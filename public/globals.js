// globals.js - Centralized global variable declarations for SB102bot web app.

/* GLOBAL VARIABLES FROM main.js */
let intervalTimeLoading = 250; // loading indicator - estimated time to reach 99%
let percentageLoading = 0; // loading indicator - % value text
let address;
let geocodeData;
let countyData;
let parcelData;
let cityData;
let lat;
let lng;
let acres;
let fakeMillage;
let maxMuniDensity;
let cityNameProper;
let countyNameProper;
let displayMuniName;
let totalUnits;
let marketUnits;
let affordableUnits;
let maxCapacity = 0;
let affordablePct = 0.40; // match the affordable slider default value (=40%)
let summaryContent = "";
let aiSupplementalData;
let aiResponses;

/* GLOBAL VARIABLES FROM calculations.js */
const MILLAGE_ADJUSTMENT = 9.999;

let acreageValue;
let densityValue;
let abatementValue = 0;
let marketStudioSize;
let market1BDSize;
let market2BDSize;
let market3BDSize;
let affordableStudioSize;
let affordable1BDSize;
let affordable2BDSize;
let affordable3BDSize;
let avgMarketSize;
let avgAffordableSize;
let avgBlendedSize;
let maxRent0bd;
let maxRent1bd;
let maxRent2bd;
let maxRent3bd;
let affordablerent;
let affordableunitsize;
let mktrent;
let mktunitsize;
// cost inputs
let landCostPerUnit;
let totalHCPerUnit;
// cost outputs
let totalLandCost;
let totalHcCost;
let totalLandAndTotalHc;
let totalLandAndTotalHcPerUnit;  
let totalLandAndTotalHcPerSqFt;
// abatement outputs
let abatementEstimate = 0;

/* MAP GLOBALS */
const LIVE_LOCAL_BLDG_RADIUS_MILES = 1.02;

// related to tallest building details (*** May break if tallestBuilding array size >1! ***)
let tallestBuildingsData;
let distanceInMilesToTallestBldg;
let buildingLat;
let buildingLng;
let buildingHeight;
let buildingName; // may not work
let buildingAddress; // may not work

/* AI GLOBALS */
let hmmm;

/*
    parcelData ----> [__data refinement process__] ----> clean dataset, ready to be fed into AI
*/

// Map parcelData to variable names that are intelligible 
const renameMap = {
    "CO_NO": "CountyNumber",
    "PARCEL_ID": "ParcelIdentificationCode",
    "FILE_T": "FileType",
    "ASMNT_YR": "AssessmentYear",
    "BAS_STRT": "BasicStratum",
    "ATV_STRT": "ActiveStratum",
    "GRP_NO": "GroupNumber",
    "DOR_UC": "DORLandUseCode",
    "PA_UC": "PropertyAppraiserLandUseCode",
    "SPASS_CD": "SpecialAssessmentCode",
    "JV": "JustValue",
    "JV_CHNG": "JustValueChange",
    "JV_CHNG_CD": "JustValueChangeCode",
    "AV_SD": "AssessedValueSchoolDistrict",
    "AV_NSD": "AssessedValueNonSchoolDistrict",
    "TV_SD": "TaxableValueSchoolDistrict",
    "TV_NSD": "TaxableValueNonSchoolDistrict",
    "JV_HMSTD": "JustValueHomesteadProperty",
    "AV_HMSTD": "AssessedValueHomesteadProperty",
    "JV_NON_HMSTD_RESD": "JustValueNonHomesteadResidentialProperty",
    "AV_NON_HMSTD_RESD": "AssessedValueNonHomesteadResidentialProperty",
    "JV_RESD_NON_RESD": "JustValueResidentialAndNonResidentialProperty",
    "AV_RESD_NON_RESD": "AssessedValueResidentialAndNonResidentialProperty",
    "JV_CLASS_USE": "JustValueClassifiedUse",
    "AV_CLASS_USE": "AssessedValueClassifiedUse",
    "JV_H2O_RECHRGE": "JustValueHighWaterRecharge",
    "AV_H2O_RECHRGE": "AssessedValueHighWaterRecharge",
    "JV_CONSRV_LND": "JustValueConservationLand",
    "AV_CONSRV_LND": "AssessedValueConservationLand",
    "JV_HIST_COM_PROP": "JustValueHistoricCommercialProperty",
    "AV_HIST_COM_PROP": "AssessedValueHistoricCommercialProperty",
    "JV_HIST_SIGNF": "JustValueHistoricallySignificantProperty",
    "AV_HIST_SIGNF": "AssessedValueHistoricallySignificantProperty",
    "JV_WRKNG_WTRFNT": "JustValueWorkingWaterfrontProperty",
    "AV_WRKNG_WTRFNT": "AssessedValueWorkingWaterfrontProperty",
    "NCONST_VAL": "NewConstructionValue",
    "DEL_VAL": "DeletionValue",
    "PAR_SPLT": "ParcelSplitCombineFlag",
    "DISTR_CD": "DisasterCode",
    "DISTR_YR": "DisasterYear",
    "LND_VAL": "LandValue",
    "LND_UNTS_CD": "LandUnitCode",
    "NO_LND_UNTS": "NumberOfLandUnits",
    "LND_SQFOOT": "LandSquareFootage",
    "DT_LAST_INSPT": "DateOfLastPhysicalInspection",
    "IMP_QUAL": "ImprovementQuality",
    "CONST_CLASS": "ConstructionClass",
    "EFF_YR_BLT": "EffectiveYearBuilt",
    "ACT_YR_BLT": "ActualYearBuilt",
    "TOT_LVG_AREA": "TotalLivingOrUsableArea",
    "NO_BULDNG": "NumberOfBuildings",
    "NO_RES_UNTS": "NumberOfResidentialUnits",
    "SPEC_FEAT_VAL": "SpecialFeatureValue",
    "MULTI_PAR_SAL1": "MultiParcelSale1"
    // ... [similarly for other columns]
};

// parcelData columns that are *irrelevant* to prompts and would only confuse the AI if provided
const unwantedColumns = ["JV_HMSTD", "AV_HMSTD"];
// ADD MANY MORE
// ADD MANY MORE
// ADD MANY MORE

// the following globals are certainly unavailable until AFTER the above data refinement process has completed
let refinedDataset;
let cleanData;
let aiGeneratedHTML;
