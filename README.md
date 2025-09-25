<!-- PROJECT LOGO -->
<p align="center">
  <!-- Replace with a lake/glacier icon or your own logo -->
  <img src="https://user-images.githubusercontent.com/placeholder/lake_logo.png" alt="Logo" width="140">
</p>

<h1 align="center">Himalayan Glacial-Lake Ice Phenology Toolkit</h1>

<p align="center">
  Scripts & data underpinning the study
  <em>"Studying Ice-Phenology Changes in Rapidly Changing Glacial Lakes of the Nepalese Himalayas using an Adaptive Threshold-Based Approach"</em><br>
  <a href="https://doi.org/10.5281/zenodo.17197712"><img src="https://img.shields.io/badge/Zenodo-10.5281/zenodo.XXXXXXX-blue.svg?logo=zenodo" alt="DOI"></a>
  <a href="https://github.com/USERNAME/REPO/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-CC--BY%204.0-lightgrey.svg?logo=creativecommons" alt="License"></a>
  <img alt="Python" src="https://img.shields.io/badge/Python-3.9%2B-blue?logo=python">
  <img alt="GEE" src="https://img.shields.io/badge/Google%20Earth%20Engine-Enabled-darkgreen?logo=google">
</p>

---

## 📒 Index
- [About](#-about)
- [Usage](#-usage)
  - [Installation](#installation)
  - [Commands](#commands)
- [Development](#-development)
  - [Pre-Requisites](#pre-requisites)
  - [Development Environment](#development-environment)
  - [File Structure](#file-structure)
  - [Build](#build)
  - [Deployment](#deployment)
- [Community](#-community)
  - [Contribution](#contribution)
  - [Branches](#branches)
  - [Guideline](#guideline)
- [FAQ](#-faq)
- [Resources](#resources)
- [Gallery](#gallery)
- [Credit / Acknowledgment](#-creditacknowledgment)
- [License](#-license)

---

## 🔰 About
This repository provides a complete, reproducible workflow for extracting **lake-ice phenology (LIP)** from small, turbid Himalayan glacial lakes using an adaptive-threshold method.  

Key features:
- Google Earth Engine (GEE) scripts for **lake-boundary delineation** and **daily ice-fraction mapping**  
- Python notebooks for **model optimisation** (selecting band, smoothing window, polynomial order) and **phenology extraction**  
- Cleaned, high-quality daily **MODIS reflectance** (2000-2024) and derived **ice-fraction time series**  
- Ready-made phenology metrics (FUS, FUE, BUS, BUE, durations) and trend statistics for five Nepali lakes

---

## ⚡ Usage

### 🔌 Installation
1. Clone the repo
git clone https://github.com/USERNAME/REPO.git
cd REPO

2. (Optional) create conda environment
conda env create -f environment.yml
conda activate lip-himalaya

text
You also need an **active Google Earth Engine account** and the **earthengine-api** (`pip install earthengine-api`).

### 📦 Commands
Authenticate GEE
earthengine authenticate

Optimise models
jupyter notebook codes/4-Model_optimization_threshold_analysis.ipynb

Extract phenology
jupyter notebook codes/5-Phenology_extraction.ipynb

text

---

## 🔧 Development

### 📓 Pre-Requisites
| Tool | Purpose |
|------|---------|
| Google Earth Engine | Satellite data processing |
| Python ≥ 3.9      | Notebooks & analysis      |
| Geemap, Pandas, Statsmodels | Dependencies (see `environment.yml`) |

### 🔩 Development Environment
Fork then clone your fork
git clone https://github.com/YOU/REPO.git

Install deps
conda env create -f environment.yml
conda activate lip-himalaya

text
Open the GEE scripts in the Code Editor, update the **assets folder** paths, and run exports.

### 📁 File Structure
.
├── codes/
│ ├── 1-Training_and_exporting_lake_boundary_classifier.js
│ ├── 2-Surface_area_delineation_using_RFClassifier.js
│ ├── 3-Training_classifier_exporting_lakeicefraction_dataset.js
│ ├── 4-Model_optimization_threshold_analysis.ipynb
│ └── 5-Phenology_extraction.ipynb
├── data/
│ ├── reflectance_timeseries_.csv
│ ├── icefractionDataset_.csv
│ ├── LIP_Dates+Analysis_.xlsx
│ └── Model_Optimization_20_best_models_.csv
└── LICENSE (CC-BY 4.0)

text

| No | File / Folder | Details |
|----|---------------|---------|
| 1 | `codes/1-3` | GEE scripts for masks, reflectance & ice-fraction exports |
| 2 | `codes/4` | Model optimisation notebook |
| 3 | `codes/5` | Phenology extraction notebook |
| 4 | `data/` | Frozen clean datasets (skip GEE if you use these) |

### 🔨 Build
Not applicable—Python notebooks run interactively; no compiled artefacts.

### 🚀 Deployment
For a fully cloud-based demo, open the notebooks on **Binder**:  
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/USERNAME/REPO/main)

---

## 🌸 Community

### 🔥 Contribution
Your contributions are always welcome and appreciated. Following are the things you can do to contribute to this project:

1. **Report a bug** If you think you have encountered a bug, and I should know about it, feel free to report it [here](https://github.com/USERNAME/REPO/issues) and I will take care of it.
2. **Request a feature** You can also request for a feature [here](https://github.com/USERNAME/REPO/issues), and if it will viable, it will be picked for development.
3. **Create a pull request** It can't get better than this, your pull request will be appreciated by the community. You can get started by picking up any open issues from [here](https://github.com/USERNAME/REPO/issues) and make a pull request.

If you are new to open-source, make sure to check read more about it [here](https://opensource.com/resources/what-open-source) and learn more about creating a pull request [here](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request).

### 🌵 Branches
| Branch | Purpose |
|--------|---------|
| `main` | Stable production code |
| `develop` | Ongoing development |

**Steps to work with feature branch**
1. To start working on a new feature, create a new branch prefixed with `feat` and followed by feature name. (ie. `feat-FEATURE-NAME`)
2. Once you are done with your changes, you can raise PR.

**Steps to create a pull request**
1. Make a PR to `develop` branch.
2. Comply with the best practices and guidelines e.g. where the PR concerns visual elements it should have an image showing the effect.
3. It must pass all continuous integration checks and get positive reviews.

### ❗ Guideline
Follow **PEP-8**, write docstrings, and keep notebooks under 500 lines. Large outputs belong in `data/` (≤ 100 MB).

---

## ❓ FAQ
**Q:** Can I apply this to lakes < 1 km²?  
**A:** Yes, but adjust the `scale` parameter in the GEE scripts and expect higher noise.

**Q:** Do I need to run all GEE scripts?  
**A:** No, if you only want to reproduce the manuscript figures, use the frozen datasets in `data/`.

---

## 📄 Resources
- Manuscript preprint → *coming soon*  
- Zenodo archive → https://doi.org/10.5281/zenodo.XXXXXXX
- Google Earth Engine → https://earthengine.google.com/

---

## 📷 Gallery
<p align="center">
  <!-- Add phenology figure or lake photo -->
  <img src="https://user-images.githubusercontent.com/placeholder/phenology_plot.png" width="600" alt="Sample phenology plot">
</p>

---

## 🌟 Credit/Acknowledgment
Developed by **Jeevan Prakash Katel** and **Mohan Bahadur Chand**.  
We thank Kathmandu University and the Global Institute for Interdisciplinary Studies for support.

---

## 🔒 License
Distributed under the **Creative Commons Attribution 4.0 International** license.  
See [`LICENSE`](LICENSE) for full text.

