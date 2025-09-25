# Lake-Ice-Phenology-Changes-in-Nepal-s-Glacial-Lakes
Remote-sensing workflow, data sets and scripts for
“Studying Ice-Phenology Changes in Rapidly Changing Glacial Lakes of the Nepalese Himalayas using an Adaptive Threshold-Based Approach” (submitted to JGR Biogeosciences).

1. Repository Contents
.
├── codes/
│   ├── 1-Training_and_exporting_lake_boundary_classifier.js
│   ├── 2-Surface_area_delineation_using_RFClassifier.js
│   ├── 3-Training_classifier_exporting_lakeicefraction_dataset.js
│   ├── 4-Model_optimization_threshold_analysis.ipynb
│   └── 5-Phenology_extraction.ipynb
├── data/
│   ├── reflectance_timeseries_*.csv
│   ├── icefractionDataset_*.csv
│   ├── LIP_Dates+Analysis_*.xlsx
│   └── Model_Optimization_20_best_models_*.csv
└── LICENSE  (CC-BY 4.0)
.

*.js Google Earth Engine (GEE) scripts for boundary delineation and ice-fraction mapping

*.ipynb Python notebooks for model optimisation and phenology extraction

data/ Cleaned MODIS reflectance, ice-fraction series, phenology metrics and top-model tables for five lakes (Imja, Lower Barun, Lumding, Tilicho, Tsho Rolpa)


2. Quick Start
2.1 Prerequisites
Google Earth Engine account

Python ≥ 3.9 with pandas, numpy, scipy, statsmodels, matplotlib, geemap

2.2 Run the full workflow
Lake boundaries & ice fraction

Open 1-Training_and_exporting_lake_boundary_classifier.js in the GEE code editor, set your assets folder, run the classifier, and export tidy lake masks.

Repeat for 2- and 3- scripts to export daily lake reflectance and matched ice-fraction samples.

Model optimisation

bash
jupyter notebook 4-Model_optimization_threshold_analysis.ipynb
The notebook determines the best smoothing window, spectral band and polynomial order for each lake, and writes the top-20 model table to data/.

Phenology extraction
Run 5-Phenology_extraction.ipynb to calculate four LIP dates per year (FUS, FUE, BUS, BUE), ice-on/off durations, and Mann-Kendall/linear trends.

All intermediate files generated locally will mirror the folder names in data/. You can skip steps 1–2 and reproduce every figure in the manuscript directly with the frozen data/ CSV/XLSX files.

3. Re-using the Code for New Lakes
Clone this repo and change the LAKE_NAME constants in each GEE script.

Update the AOI polygon or import a new shapefile.

Rerun the notebooks; they will adapt automatically to new file names.

4. Citation
If you use this toolkit, please cite both:

Kat​el & Chand (2025). Studying Ice-Phenology … JGR Biogeosciences (in review).
Zenodo repository: (https://doi.org/10.5281/zenodo.17197712)

A ready-made BibTeX entry is in [working]

5. License & Contact
All code and data are released under Creative Commons Attribution 4.0.
Questions or contributions → jeevan.katel3@gmail.com.

Pull requests and issue reports are welcome!


