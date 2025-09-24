var ls = ee.ImageCollection("LANDSAT/LE07/C02/T1_L2"),
    aoi = ee.FeatureCollection("users/jeevankatel987654321/imja_aoi"),
    dem = ee.ImageCollection("JAXA/ALOS/AW3D30/V4_1"),
    modis = ee.ImageCollection("MODIS/061/MOD09GQ");

//Delineating SA for 00-05 and using it to extract daily red and nir modis reflectance
//we use the trained and exported rf classifier for landsat
//1- Creating a median collection for the period

var ls1 = ls.filterDate("2010-01-01","2014-12-31")
              .filter(ee.Filter.lt('CLOUD_COVER', 20))
              .filter(ee.Filter.bounds(aoi));

var requiredBands = ['ST_URAD','ST_ATRAN','SR_B7','SR_B2',
  'ST_TRAD','ST_EMIS','SR_B1',  'SR_B5', 'SR_B4', 'SR_B3', 'elev', 'slope'];

function applyScaleFactors(image) {
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  var thermalBands = image.select('ST_B.*').multiply(0.00341802).add(149.0);
  var proj = dem.first().projection();
  var elevation = dem.select('DSM').mosaic()
  .setDefaultProjection(proj)
  .rename('elev');
  var slope = ee.Terrain.slope(elevation)
  .rename('slope');
  return image.addBands(opticalBands, null, true)
              .addBands(thermalBands, null, true)
              .addBands(elevation).addBands(slope);
}


var ls_scaled = ls1.map(applyScaleFactors);

var vis = {
  bands: ['SR_B3', 'SR_B2', 'SR_B1'],
  min: 0.0,
  max: 0.3,
};

Map.centerObject(aoi, 13);

// Corrected cloud masking function using SR_CLOUD_QA
function addMask(image) {
  var qa = image.select('SR_CLOUD_QA');
  var cloudShadow = qa.bitwiseAnd(1 << 0).eq(0); 
  var cloud = qa.bitwiseAnd(1 << 2).eq(0);     
  return image.updateMask(cloudShadow.and(cloud));
}

var lsMasked = ls_scaled.map(addMask)

var lsWithClear = lsMasked.map(function(image) {
  var cs = ee.Image(1)
      .subtract(
        image.select('QA_PIXEL').multiply(0.001)
      )
      .rename('clearScore');
  return image.addBands(cs);
});

var lsMedian = lsWithClear
    .qualityMosaic('clearScore')
    //.median()
    .clip(aoi);

Map.addLayer(lsMedian, vis, 'Corrected Masked Image');


//Normalizing the image before running classifiers
function normalize(image){
  var bandNames = image.bandNames();
  // Compute min and max of the image
  var minDict = image.reduceRegion({
    reducer: ee.Reducer.min(),
    geometry: aoi,
    scale: 30,
    bestEffort: true
  });
  var maxDict = image.reduceRegion({
    reducer: ee.Reducer.max(),
    geometry: aoi,
    scale: 30,
    bestEffort: true,
  });
  var mins = ee.Image.constant(minDict.values(bandNames));
  var maxs = ee.Image.constant(maxDict.values(bandNames));

  var normalized = image.subtract(mins).divide(maxs.subtract(mins));
  return normalized;
}

var ls_composite = normalize(lsMedian);

//2- Running the classifier
var classifierAssetId = "users/jeevankatel987654321/LakeBoundaryClassifier_LS_Imja"
var savedClassifier = ee.Classifier.load(classifierAssetId)

var classified= ls_composite.classify(savedClassifier).clip(aoi)

var LakeVis = {
  min:0,
  max:1,
  palette: ['#000000', '#FFFFFF']
};

Map.addLayer(classified, LakeVis, 'Lake');


//3- Delineating and vectorizing the lake boundary 
var lakeMask = classified.eq(1);

var lakeVectors = lakeMask
  .selfMask()                         
  .reduceToVectors({
    geometry:       aoi,              
    scale:          30,              
    geometryType:   'polygon',        
    eightConnected: false,            
    labelProperty:  'lake',           
    maxPixels:      1e10
  });

lakeVectors = lakeVectors.map(function(feature) {
  var area = feature.geometry(1).area({maxError: 1});
  return feature.set('area', area);
});

var minArea = 100000;
lakeVectors = lakeVectors.filter(ee.Filter.gt('area', minArea));

var lakeOutline = lakeVectors.map(function(f) {
  return f.setGeometry(f.geometry(1).simplify(50));
});

Map.addLayer(lakeVectors, {color: '0000FF'}, 'Lake Boundary Vectors');


//Reading MODIS daily red and nir reflectance from the classified lake outline

var modis_f1 = modis.filter(ee.Filter.date("2010-01-01","2014-12-31"))
                .filter(ee.Filter.bounds(lakeOutline))

function returnBands(image){
  // Extract QC band and create cloud mask
  var qcBand = image.select('QC_250m');
  
  // Bitwise operations to extract relevant flags
  var modlandQa = qcBand.rightShift(0).bitwiseAnd(0x3);
  var band1Qa = qcBand.rightShift(4).bitwiseAnd(0xF);
  var band2Qa = qcBand.rightShift(8).bitwiseAnd(0xF);

  var cloudMask = modlandQa.lte(1); 
  var band1Mask = band1Qa.eq(0);     
  var band2Mask = band2Qa.eq(0);     


  var finalMask = cloudMask.and(band1Mask).and(band2Mask);

  // Applying scaling and masking
  var sf = 0.0001;
  var red = image.select('sur_refl_b01')
              .multiply(sf)
              .unitScale(-0.1,1.6)
              .rename('red')
              .updateMask(finalMask);
              
  var nir = image.select('sur_refl_b02')
              .multiply(sf)
              .unitScale(-0.1,1.6)
              .rename('nir')
              .updateMask(finalMask);

  var date_str = ee.Date(image.get('system:time_start')).format('YYYYMMdd');
  
  return image.addBands([red,nir])
              .clip(lakeOutline)
              .copyProperties(image, ['system:time_start'])
              .set('filename',date_str);
}
var modis_scaledBands = modis_f1.map(returnBands).select(['red','nir']);

print(modis_scaledBands);

// Export mean Red and NIR values as CSV
var lakeGeometry = lakeOutline.geometry();

var statsCollection = modis_scaledBands.map(function(image) {
  var date = image.get('filename');
  var meanValues = image.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: lakeGeometry,
    scale: 250, 
    maxPixels: 1e9
  });
  return ee.Feature(null, {
    'date': date,
    'mean_red': meanValues.get('red'),
    'mean_nir': meanValues.get('nir')
  });
});


Export.table.toDrive({
  collection: statsCollection,
  description: 'MODIS_Lake_Reflectance_Means',
  fileFormat: 'CSV',
  folder:"ee4",
  fileNamePrefix: 'Modis_Reflectance_10-14',
  selectors: ['date', 'mean_red', 'mean_nir']
});

var modisRedImage = modis_scaledBands.first();
var modisRedVis = {
  bands: ['red'],
  min: 0,
  max: 1,
  palette: ['000000', 'FFFFFF']  
};
Map.addLayer(modisRedImage, modisRedVis, 'MODIS Red Band Example');

Export.table.toAsset(lakeOutline, "LakeBoundaryExport10-14", "Imja_LakeArea10-14")