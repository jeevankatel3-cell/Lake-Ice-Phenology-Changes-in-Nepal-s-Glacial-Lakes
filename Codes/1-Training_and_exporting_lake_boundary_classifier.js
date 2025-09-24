// Training and exporting a random forest classifier for delineating lake boundary, e.g, Lake Imja

//Managing Imports
var ls7 = ee.ImageCollection("LANDSAT/LE07/C02/T1_L2"),
    dem = ee.ImageCollection("JAXA/ALOS/AW3D30/V4_1"),
    ls8 = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
//    lake1 = approximate lake outline (must be larger than lake)
    ;
//training lake boundary in imja using water/ice and land samples
var requiredBands = ['ST_URAD','ST_ATRAN','SR_B7','SR_B2',
  'ST_TRAD','ST_EMIS','SR_B1',  'SR_B5', 'SR_B4', 'SR_B3', 'elev', 'slope'];

function harmonizeL8(img){
  return img.select(
    // FROM ‑------------------------→  TO (L7 style)
    ['SR_B2','SR_B3','SR_B4','SR_B5','SR_B6','SR_B7','ST_B10',
     'ST_ATRAN','ST_CDIST','ST_DRAD','ST_EMIS','ST_EMSD',
     'ST_QA','ST_TRAD','ST_URAD'],
    ['SR_B1','SR_B2','SR_B3','SR_B4','SR_B5','SR_B7','ST_B6',
     'ST_ATRAN','ST_CDIST','ST_DRAD','ST_EMIS','ST_EMSD',
     'ST_QA','ST_TRAD','ST_URAD']
  );
}

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
              .addBands(elevation).addBands(slope)
              .select(requiredBands);
}

var ls7 = ls7.map(applyScaleFactors).filter(ee.Filter.date("2001-01-01","2013-03-17"))
            .filter(ee.Filter.bounds(aoi))
            .select(requiredBands);

var ls8 = ls8.map(harmonizeL8).map(applyScaleFactors).filter(ee.Filter.date("2013-03-18","2024-12-31"))
            .filter(ee.Filter.bounds(aoi))
            .select(requiredBands);
            
var ls = ls7.merge(ls8); 


var ls_img1 = ls.filterDate('2002-10-01','2007-01-01').first().clip(aoi);   
var ls_img2 = ls.filterDate('2003-01-15','2005-01-01').first().clip(aoi);   
var ls_img3 = ls.filterDate('2013-04-10','2024-01-01').first().clip(aoi);   
var ls_img4 = ls.filterDate('2020-06-20','2024-01-01').first().clip(aoi);   
var ls_img5 = ls.filterDate('2024-08-04','2024-12-31').first().clip(aoi);
print(ls_img5)


var visRGBls = {
  bands: ['SR_B4', 'SR_B3', 'SR_B2'],
  min: 0.0,
  max: 0.4,
};
Map.addLayer(ls_img5, visRGBls, "True Color");
 
Map.centerObject(aoi, 14);


//2-------------------------------------------------------------------


//Normalization
var ls_median = ls.median().select(requiredBands)
var minMax = ls_median.reduceRegion({
  reducer: ee.Reducer.minMax(),
  geometry: aoi,
  scale: 30,
  bestEffort: true
});

// Extract min/max values in the order of the bands in ls_img1
var bandNames = ls_median.bandNames();

var minList = bandNames.map(function(bandName) {
  return minMax.get(ee.String(bandName).cat('_min')); // Get min for each band
});
var maxList = bandNames.map(function(bandName) {
  return minMax.get(ee.String(bandName).cat('_max')); // Get max for each band
});

// Create constant images for mins and maxs
var mins = ee.Image.constant(minList).rename(bandNames);
var maxs = ee.Image.constant(maxList).rename(bandNames);

// Function to normalize ANY image using TRAINING STATS
function normalizeWithMedian(image) {
  return image
    .subtract(mins) 
    .divide(maxs.subtract(mins))
    .rename(image.bandNames()); // Preserve original band names
}

var ls_img1 = normalizeWithMedian(ls_img1).select(requiredBands);
var ls_img2 = normalizeWithMedian(ls_img2).select(requiredBands);
var ls_img3 = normalizeWithMedian(ls_img3).select(requiredBands);
var ls_img4 = normalizeWithMedian(ls_img4).select(requiredBands);
var ls_img5 = normalizeWithMedian(ls_img5).select(requiredBands);
// var ls_img6 = normalizeWithMedian(ls_img6).select(requiredBands);



//3---------------------------------------------------------------------------------

//Training Data : Lake 1 Land 0
//Preparing Training Data1

//Merging training samples
var gcps1 = lake1.merge(land1);
var gcps2 = lake2.merge(land2);
var gcps3 = lake3.merge(land3);
var gcps4 = lake4.merge(land4);
var gcps5 = lake5.merge(land5);

// // //print(gcps);

var gcps1 = gcps1.randomColumn();
var gcps2 = gcps2.randomColumn();
var gcps3 = gcps3.randomColumn();
var gcps4 = gcps4.randomColumn();
var gcps5 = gcps5.randomColumn();
// // var gcps6 = gcps6.randomColumn();

//Split 75 25
var traingcp1 = gcps1.filter(ee.Filter.lt('random',0.55));
var testgcp1 = gcps1.filter(ee.Filter.gte('random',0.55));
var traingcp2 = gcps2.filter(ee.Filter.lt('random',0.55));
var testgcp2 = gcps2.filter(ee.Filter.gte('random',0.55));
var traingcp3 = gcps3.filter(ee.Filter.lt('random',0.55));
var testgcp3 = gcps3.filter(ee.Filter.gte('random',0.55));
var traingcp4 = gcps4.filter(ee.Filter.lt('random',0.55));
var testgcp4 = gcps4.filter(ee.Filter.gte('random',0.55));
var traingcp5 = gcps5.filter(ee.Filter.lt('random',0.55));
var testgcp5 = gcps5.filter(ee.Filter.gte('random',0.55));


//Extracting pixel values for gcps
var training1 = ls_img1.sampleRegions({
  collection: traingcp1,
  scale: 30,
  properties: ['lake']
});

var training2 = ls_img2.sampleRegions({
  collection: traingcp2,
  scale: 30,
  properties: ['lake']
})

var training3 = ls_img3.sampleRegions({
  collection: traingcp3,
  scale: 30,
  properties: ['lake']
})

var training4 = ls_img4.sampleRegions({
  collection: traingcp4,
  scale: 30,
  properties: ['lake']
})

var training5 = ls_img5.sampleRegions({
  collection: traingcp5,
  scale: 30,
  properties: ['lake']
})



var training_merged = training1.merge(training2)
                        .merge(training3)
                        .merge(training4)
                        .merge(training5);
          
// //4-----------------------------------------------------------------------
var classifier = ee.Classifier.smileRandomForest({
  numberOfTrees: 31, 
  variablesPerSplit: 8, 
  bagFraction:0.8, 
  seed: 45}).train({
  features: training_merged,
  classProperty:'lake',
  inputProperties: ls_median.bandNames()
});

print(classifier.confusionMatrix())

var class1 = ls_img1.classify(classifier);
var eval1  = class1.sampleRegions({
  collection: testgcp1, 
  properties: ['lake'], 
  scale: 30
});

print('Confusion for img1:', eval1.errorMatrix('lake','classification'));
print('Accuracy for img1:', eval1.errorMatrix('lake','classification').accuracy());


var class2 = ls_img2.classify(classifier);
var eval2  = class2.sampleRegions({
  collection: testgcp2,
  properties: ['lake'],
  scale: 30
});
print('Confusion for img2:', eval2.errorMatrix('lake','classification'));
print('Accuracy for img2:', eval2.errorMatrix('lake','classification').accuracy());

var class3 = ls_img3.classify(classifier);
var eval3  = class3.sampleRegions({
  collection: testgcp3,
  properties: ['lake'],
  scale: 30
});
print('Confusion for img3:', eval3.errorMatrix('lake','classification'));
print('Accuracy for img3:', eval3.errorMatrix('lake','classification').accuracy());

var class4 = ls_img4.classify(classifier);
var eval4  = class4.sampleRegions({
  collection: testgcp4,
  properties: ['lake'],
  scale: 30
});
print('Confusion for img4:', eval4.errorMatrix('lake','classification'));
print('Accuracy for img4:', eval4.errorMatrix('lake','classification').accuracy());


var class5 = ls_img5.classify(classifier);
var eval5  = class5.sampleRegions({
  collection: testgcp5,
  properties: ['lake'],
  scale: 30
});
print('Confusion for img5:', eval5.errorMatrix('lake','classification'));
print('Accuracy for img5:', eval5.errorMatrix('lake','classification').accuracy());

var test_merged = eval1.merge(eval2)
                        .merge(eval3)
                        .merge(eval4)
                        .merge(eval5)



var IFVis = {
  min:0,
  max:1,
  palette: ['#000000', '#FFFFFF']
};

Map.addLayer(class5.clip(aoi), IFVis, 'LC');


// Calculate variable importance
var importance = ee.Dictionary(classifier.explain().get('importance'))

// Calculate relative importance
var sum = importance.values().reduce(ee.Reducer.sum())

var relativeImportance = importance.map(function(key, val) {
  return (ee.Number(val).multiply(100)).divide(sum)
  })

// Create a FeatureCollection so we can chart it
var importanceFc = ee.FeatureCollection([
  ee.Feature(null, relativeImportance)
])

var chart = ui.Chart.feature.byProperty({
  features: importanceFc
}).setOptions({
      title: 'Feature Importance',
      vAxis: {title: 'Importance'},
      hAxis: {title: 'Feature'}
  })
print(chart)

//5-----------------------------------------------------------------------

//creating test samples
var test_points1 = ls_img1.sampleRegions({
  collection: testgcp1,
  properties: ['lake'],
  scale: 30
});
var test_points2 = ls_img2.sampleRegions({collection: testgcp2,
  properties: ['lake'],
  scale: 30}); 
var test_points3 = ls_img3.sampleRegions({collection: testgcp3,
  properties: ['lake'],
  scale: 30});
var test_points4 = ls_img4.sampleRegions({collection: testgcp4,
  properties: ['lake'],
  scale: 30});
var test_points5 = ls_img5.sampleRegions({collection: testgcp5,
  properties: ['lake'],
  scale: 30});
  
var test_merged_bands = test_points1.merge(test_points2)
                        .merge(test_points3)
                        .merge(test_points4)
                        .merge(test_points5);
                        
//Hyperparameter tuning
//Tuning Multiple Parameters of Random Forest Classifier
// var nTrees = ee.List.sequence(5, 100, 1);
// var bagFractionList = ee.List.sequence(0.2, 0.9, 0.1);
// var variablesPerSplitList = ee.List([4,5,6,7, 8, 9]);

// var validationAccuracies = nTrees.map(function(nTrees) {
//   return bagFractionList.map(function(bagFraction) {
//     return variablesPerSplitList.map(function(variablesPerSplit) {
//       var classifier = ee.Classifier.smileRandomForest({
//         numberOfTrees: nTrees,
//         bagFraction: bagFraction,
//         variablesPerSplit: variablesPerSplit,
//         seed: 45
//       }).train({
//         features: training_merged,
//         classProperty: 'lake',
//         inputProperties: requiredBands // Use band names directly
//       });
      
//       // Classify using the TEST SET WITH BAND VALUES
//       var valPredictions = test_merged_bands.classify(classifier);
      
//       var errorMatrix = valPredictions.errorMatrix('lake', 'classification');
//       return ee.Feature(
//         null, {'accuracy': errorMatrix.accuracy(),
//         'kappa': errorMatrix.kappa(),
//         'recall': errorMatrix.producersAccuracy(),
//         'precision': errorMatrix.consumersAccuracy(),
//         'nTrees': nTrees, 
//         'bagFraction': bagFraction, 
//         'varPerSplit': variablesPerSplit});
//   });
//   });
// }).flatten();

// var valAccuracy = ee.FeatureCollection(validationAccuracies);

// Export.table.toDrive({
//   collection: valAccuracy,
//   description: 'hpt_1',
//   fileFormat: 'CSV',
//   fileNamePrefix:'hpt_imja_lakeBoundary',
//   folder:'ee4',
//   selectors: ['accuracy', 'kappa', 'precision',	'recall',	'nTrees', 'bagFraction',	'varPerSplit']
// });

//Finally Export the classifier after training with multiple images
Export.classifier.toAsset(classifier, "LakeBoundaryClassifier", "LakeBoundaryClassifier_LS_Imja")
