//3 - Training a random forest classifier for classifying lake ice fraction in a lake using image, and exporting lake ice fraction dataset for qualifying images
//case example - lake imja

//Managing Imports
var ls = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2"),
    aoi1 = ee.FeatureCollection("users/jeevankatel987654321/ImjaLakeArea15-19"),
    aoi2 = ee.FeatureCollection("users/jeevankatel987654321/ImjaLakeArea20-24")
    //water1 = high quality point samples of water (unfrozen parts of lake)
    //ice1 = high quality point samples of ice (frozen parts of lake)
    //take samples from multiple images, seven sets in this case...

//Workflow
//1. Add Image Collection, apply scale, select an image
//2. Adding Indices and normalizing image
//3. Creating 6 trainning samples (one for every two months) and splitting
//4. Training and Running Classifier, Tuning Parameters, Getting Metrics
//5. HPT and Cloud filtering
//6. Getting a csv of lake ice fraction vs date for the selected period

//1---------------------------------------------------------------------------

function applyScaleFactors(image) {
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  var thermalBands = image.select('ST_B.*').multiply(0.00341802).add(149.0);
  return image.addBands(opticalBands, null, true)
              .addBands(thermalBands, null, true);
}
var requiredBands = ['SR_B1','SR_B2','SR_B3','SR_B4','SR_B5', 'SR_B6', 'SR_B7', 'ST_B10']

//Overall Dataset - Period 1
var ls1 = ls.map(applyScaleFactors).filter(ee.Filter.date("2015-01-01","2019-12-31"))
            .filter(ee.Filter.bounds(aoi1))
            .select(requiredBands);
            
//Overall Dataset - Period 1
var ls2 = ls.map(applyScaleFactors).filter(ee.Filter.date("2020-01-01","2024-12-31"))
            .filter(ee.Filter.bounds(aoi2))
            .select(requiredBands);
            
//Selecting Individual images
var ls_img1 = ls1.filterDate('2015-10-15','2020-01-01').first(); 
var ls_img2 = ls1.filterDate('2017-01-01','2020-12-31').first(); 
var ls_img3 = ls1.filterDate('2016-11-06','2024-06-30').first(); 


var ls_img4 = ls2.filterDate('2024-05-01','2024-08-30').first(); 
var ls_img5 = ls2.filterDate('2022-06-13','2024-12-30').first(); 
var ls_img6 = ls2.filterDate('2020-11-01','2024-12-30').first(); 
var ls_img7 = ls2.filterDate('2020-05-21','2024-12-30').first();

print(ls_img7)


var visRGBls = {
  bands: ['SR_B4', 'SR_B3', 'SR_B2'],
  min: 0.0,
  max: 0.4,
};

Map.addLayer(ls_img7, visRGBls, "True Color");
Map.addLayer(aoi2,{},"LakeBoundary");
//Map.addLayer(aoiN,{},"LakeBoundaryRecent"); 
Map.centerObject(aoi2, 15);

//2-------------------------------------------------------------------


//Normalization - period 1
var ls_median1 = ls1.median().select(requiredBands)
var minMax1 = ls_median1.reduceRegion({
  reducer: ee.Reducer.minMax(),
  geometry: aoi1,
  scale: 30,
  bestEffort: true
});
var bandNames1 = ls_median1.bandNames();
var minList1 = bandNames1.map(function(bandName) {
  return minMax1.get(ee.String(bandName).cat('_min'))});
var maxList1 = bandNames1.map(function(bandName) {
  return minMax1.get(ee.String(bandName).cat('_max'))});

var mins1 = ee.Image.constant(minList1).rename(bandNames1);
var maxs1 = ee.Image.constant(maxList1).rename(bandNames1);

function normalizeWithMedian1(image) {
  return image
    .subtract(mins1) 
    .divide(maxs1.subtract(mins1))
    .rename(image.bandNames()); // Preserve original band names
}

var ls_img1 = normalizeWithMedian1(ls_img1).select(requiredBands).clip(aoi1);
var ls_img2 = normalizeWithMedian1(ls_img2).select(requiredBands).clip(aoi1);
var ls_img3 = normalizeWithMedian1(ls_img3).select(requiredBands).clip(aoi1);

//Normalization - period 2
var ls_median2 = ls2.median().select(requiredBands)
var minMax2 = ls_median2.reduceRegion({
  reducer: ee.Reducer.minMax(),
  geometry: aoi2,
  scale: 30,
  bestEffort: true
});
var bandNames2 = ls_median2.bandNames();
var minList2 = bandNames2.map(function(bandName) {
  return minMax2.get(ee.String(bandName).cat('_min'))});
var maxList2 = bandNames2.map(function(bandName) {
  return minMax2.get(ee.String(bandName).cat('_max'))});

var mins2 = ee.Image.constant(minList2).rename(bandNames2);
var maxs2 = ee.Image.constant(maxList2).rename(bandNames2);

function normalizeWithMedian2(image) {
  return image
    .subtract(mins2) 
    .divide(maxs2.subtract(mins2))
    .rename(image.bandNames()); // Preserve original band names
}

var ls_img4 = normalizeWithMedian2(ls_img4).select(requiredBands).clip(aoi2);
var ls_img5 = normalizeWithMedian2(ls_img5).select(requiredBands).clip(aoi2);
var ls_img6 = normalizeWithMedian2(ls_img6).select(requiredBands).clip(aoi2);
var ls_img7 = normalizeWithMedian2(ls_img7).select(requiredBands).clip(aoi2);

// // //3---------------------------------------------------------------------------------

// //Training Data : Water 0 Ice 1
// //Preparing Training Data1

// //Merging training samples
var gcps1 = water1;  
var gcps2 = ice2;
var gcps3 = water3.merge(ice3);
var gcps4 = ice4;
var gcps5 = water5;
var gcps6 = water6.merge(ice6);
var gcps7 = water7.merge(ice7);

// // // //print(gcps);

var gcps1 = gcps1.randomColumn();
var gcps2 = gcps2.randomColumn();
var gcps3 = gcps3.randomColumn();
var gcps4 = gcps4.randomColumn();
var gcps5 = gcps5.randomColumn();
var gcps6 = gcps6.randomColumn();
var gcps7 = gcps7.randomColumn();

// //Split 75 25
var traingcp1 = gcps1.filter(ee.Filter.lt('random',0.75));
var testgcp1 = gcps1.filter(ee.Filter.gte('random',0.75));
var traingcp2 = gcps2.filter(ee.Filter.lt('random',0.75));
var testgcp2 = gcps2.filter(ee.Filter.gte('random',0.75));
var traingcp3 = gcps3.filter(ee.Filter.lt('random',0.75));
var testgcp3 = gcps3.filter(ee.Filter.gte('random',0.75));
var traingcp4 = gcps4.filter(ee.Filter.lt('random',0.75));
var testgcp4 = gcps4.filter(ee.Filter.gte('random',0.75));
var traingcp5 = gcps5.filter(ee.Filter.lt('random',0.75));
var testgcp5 = gcps5.filter(ee.Filter.gte('random',0.75));
var traingcp6 = gcps6.filter(ee.Filter.lt('random',0.75));
var testgcp6 = gcps6.filter(ee.Filter.gte('random',0.75));
var traingcp7 = gcps7.filter(ee.Filter.lt('random',0.75));
var testgcp7 = gcps7.filter(ee.Filter.gte('random',0.75));

//Extracting pixel values for gcps
var training1 = ls_img1.sampleRegions({
  collection: traingcp1,
  scale: 30,
  properties: ['ice']
});

var training2 = ls_img2.sampleRegions({
  collection: traingcp2,
  scale: 30,
  properties: ['ice']
})

var training3 = ls_img3.sampleRegions({
  collection: traingcp3,
  scale: 30,
  properties: ['ice']
})

var training4 = ls_img4.sampleRegions({
  collection: traingcp4,
  scale: 30,
  properties: ['ice']
})

var training5 = ls_img5.sampleRegions({
  collection: traingcp5,
  scale: 30,
  properties: ['ice']
})

var training6 = ls_img6.sampleRegions({
  collection: traingcp6,
  scale: 30,
  properties: ['ice']
})

var training7 = ls_img7.sampleRegions({
  collection: traingcp7,
  scale: 30,
  properties: ['ice']
})


var training_merged = training1.merge(training2)
                        .merge(training3)
                        .merge(training4)
                        .merge(training5)
                        .merge(training6)
                        .merge(training7);


// //4-----------------------------------------------------------------------
var classifier = ee.Classifier.smileRandomForest({
  numberOfTrees:25, 
  variablesPerSplit:5, 
  bagFraction:0.7})
  .train({
  features: training_merged,
  classProperty:'ice',
  inputProperties: ls_median1.bandNames()
});

print(classifier.confusionMatrix())

var class1 = ls_img1.classify(classifier);
var eval1  = class1.sampleRegions({
  collection: testgcp1, 
  properties: ['ice'], 
  scale: 30
});

print('Confusion for img1:', eval1.errorMatrix('ice','classification'));
print('Accuracy for img1:', eval1.errorMatrix('ice','classification').accuracy());


var class2 = ls_img2.classify(classifier);
var eval2  = class2.sampleRegions({
  collection: testgcp2,
  properties: ['ice'],
  scale: 30
});
print('Confusion for img2:', eval2.errorMatrix('ice','classification'));
print('Accuracy for img2:', eval2.errorMatrix('ice','classification').accuracy());

var class3 = ls_img3.classify(classifier);
var eval3  = class3.sampleRegions({
  collection: testgcp3,
  properties: ['ice'],
  scale: 30
});
print('Confusion for img3:', eval3.errorMatrix('ice','classification'));
print('Accuracy for img3:', eval3.errorMatrix('ice','classification').accuracy());

var class4 = ls_img4.classify(classifier);
var eval4  = class4.sampleRegions({
  collection: testgcp4,
  properties: ['ice'],
  scale: 30
});
print('Confusion for img4:', eval4.errorMatrix('ice','classification'));
print('Accuracy for img4:', eval4.errorMatrix('ice','classification').accuracy());

var class5 = ls_img5.classify(classifier);
var eval5  = class5.sampleRegions({
  collection: testgcp5,
  properties: ['ice'],
  scale: 30
});
print('Confusion for img5:', eval5.errorMatrix('ice','classification'));
print('Accuracy for img5:', eval5.errorMatrix('ice','classification').accuracy());

var class6 = ls_img6.classify(classifier);
var eval6  = class6.sampleRegions({
  collection: testgcp6,
  properties: ['ice'],
  scale: 30
});
print('Confusion for img6:', eval6.errorMatrix('ice','classification'));
print('Accuracy for img6:', eval6.errorMatrix('ice','classification').accuracy());

var class7 = ls_img7.classify(classifier);
var eval7  = class7.sampleRegions({
  collection: testgcp7,
  properties: ['ice'],
  scale: 30
});
print('Confusion for img7:', eval7.errorMatrix('ice','classification'));
print('Accuracy for img7:', eval7.errorMatrix('ice','classification').accuracy());

var IFVis = {
  min:0,
  max:1,
  palette: ['#000000', '#FFFFFF']
};

Map.addLayer(class7.clip(aoi2), IFVis, 'LC');


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

//5. HPT -----------------------------------------------------------
//creating test samples
var test_points1 = ls_img1.sampleRegions({
  collection: testgcp1,
  properties: ['ice'],
  scale: 30
});
var test_points2 = ls_img2.sampleRegions({collection: testgcp2,
  properties: ['ice'],
  scale: 30}); 
var test_points3 = ls_img3.sampleRegions({collection: testgcp3,
  properties: ['ice'],
  scale: 30});
var test_points4 = ls_img4.sampleRegions({collection: testgcp4,
  properties: ['ice'],
  scale: 30});
var test_points5 = ls_img5.sampleRegions({collection: testgcp5,
  properties: ['ice'],
  scale: 30});
var test_points6 = ls_img6.sampleRegions({collection: testgcp6,
  properties: ['ice'],
  scale: 30});
var test_points7 = ls_img7.sampleRegions({collection: testgcp7,
  properties: ['ice'],
  scale: 30});
var test_merged_bands = test_points1.merge(test_points2)
                        .merge(test_points3)
                        .merge(test_points4)
                        .merge(test_points5)
                        .merge(test_points6)
                        .merge(test_points7);
                         
//Hyperparameter tuning at last
//Tuning Multiple Parameters of Random Forest Classifier
// var nTrees = ee.List.sequence(2,50, 1);
// var bagFractionList = ee.List.sequence(0.6, 0.9, 0.1);
// var variablesPerSplitList = ee.List([5 , 6, 7,  8]);

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
//         classProperty: 'ice',
//         inputProperties: requiredBands // Use band names directly
//       });
      
//       // Classify using the TEST SET WITH BAND VALUES
//       var valPredictions = test_merged_bands.classify(classifier);
      
//       var errorMatrix = valPredictions.errorMatrix('ice', 'classification');
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
//   fileNamePrefix:'hpt_tilicho_lif3',
//   folder:'ee4',
//   selectors: ['accuracy', 'kappa', 'precision',	'recall',	'nTrees', 'bagFraction',	'varPerSplit']
// });



function maskL8sr(image) {
  // Bits 3 and 4 are cloud and cloud shadow, respectively
  var cloudShadowBitMask = (1 << 4);
  var cloudsBitMask = (1 << 3);
  
  // Get the pixel QA band
  var qa = image.select('QA_PIXEL');
  
  // Both flags should be set to zero, indicating clear conditions
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
              .and(qa.bitwiseAnd(cloudsBitMask).eq(0));
  
  return image.updateMask(mask);
}

  
var lsExport1 = ls
  .map(applyScaleFactors)
  .filterDate("2015-01-01","2019-12-31")
  .filterBounds(aoi1)
  .filter(ee.Filter.lt('CLOUD_COVER', 20))
  .map(maskL8sr);
  
var lsExport2 = ls
  .map(applyScaleFactors)
  .filterDate("2020-01-01","2024-12-31")
  .filterBounds(aoi2)
  .filter(ee.Filter.lt('CLOUD_COVER', 20))
  .map(maskL8sr);
  
//6-----------------------------------------------------------------------
var results1 = lsExport1.map(function(image) {
  var selectBands = image.select(requiredBands);
  var normalized = normalizeWithMedian1(selectBands); 
  var classified = normalized.classify(classifier);
  var iceFraction = classified.select('classification')
    .reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: aoi1,
      scale: 30,
      maxPixels: 1e9
    }).get('classification');
  
  var date_str = ee.Date(image.get('system:time_start')).format('YYYYMMdd');
  
  return ee.Feature(null, {
    'date': date_str,  
    'ice_fraction': iceFraction
  });
});
Export.table.toDrive({
  collection: results1.filter(ee.Filter.neq('ice_fraction', null)),
  description: 'lake_ice_fraction',
  fileFormat: 'CSV',
  selectors: ['date', 'ice_fraction'],
  folder:'ee4',
  fileNamePrefix: 'LakeIceFraction_Imja_15-19'
});

var results2 = lsExport2.map(function(image) {
  var selectBands = image.select(requiredBands);
  var normalized = normalizeWithMedian2(selectBands); 
  var classified = normalized.classify(classifier);
  var iceFraction = classified.select('classification')
    .reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: aoi2,
      scale: 30,
      maxPixels: 1e9
    }).get('classification');
  
  var date_str = ee.Date(image.get('system:time_start')).format('YYYYMMdd');
  
  return ee.Feature(null, {
    'date': date_str,  
    'ice_fraction': iceFraction
  });
});
Export.table.toDrive({
  collection: results2.filter(ee.Filter.neq('ice_fraction', null)),
  description: 'lake_ice_fraction',
  fileFormat: 'CSV',
  selectors: ['date', 'ice_fraction'],
  folder:'ee4',
  fileNamePrefix: 'LakeIceFraction_Imja_20-24'
});

    