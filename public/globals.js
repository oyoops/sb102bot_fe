// globals.js - Centralized global variable declarations for SB102bot web app.


//let dirtyData;

/* GLOBAL VARIABLES related to main.js */
let intervalTimeLoading = 250; // loading indicator - estimated time to reach 99%
let percentageLoading = 0; // loading indicator - % value text
let address;
let geocodeData;
//let countyData;
//let parcelData;
let cityData;
let lat;
let lng;
let acres;
//let fakeMillage;
let maxMuniDensity;
let cityNameProper;
let countyNameProper;
let displayMuniName;
//let totalUnits;
//let marketUnits;
//let affordableUnits;
let maxCapacity = 0;
//let affordablePct = 0.40; // match the affordable slider default value (=40%)
let summaryContent = "";
let aiSupplementalData;
let aiResponses;

let compsData;
const COMPS_SEARCH_RADIUS_MILES = "3.0000"; // miles (must be a string)

/* GLOBAL VARIABLES related to calculations.js */
//const MILLAGE_ADJUSTMENT = 9.999;

/*
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
*/

/* MAP GLOBALS */

// Globals related to tallest building details (*** May break if tallestBuilding array size >1! ***)
const LIVE_LOCAL_BLDG_RADIUS_MILES = 1.02;
let tallestBuildingsData;
let distanceInMilesToTallestBldg;
let buildingLat;
let buildingLng;
let buildingHeight;
let buildingAddress;
let buildingName; // may not work...

/* AI GLOBALS */
////let hmmm;

/* MAP GLOBALS */
let map = null; // THE ACTUAL MAP, initialized to null
const mapDisplay = document.getElementById('map'); // unused?

/* CALCULATIONS.JS GLOBALS (DOM stuff)
// acreage & density inputs
const acreageInputDisplay = document.getElementById('acreageInput');
const densityInputDisplay = document.getElementById('densityInput');
// affordable percentage input/output
const affordablePctSliderDisplay = document.getElementById('affordablePctSlider');
const affordablePctDisplay = document.getElementById('affordablePctDisplay');
// unit count outputs
const unitCountTableBody = document.getElementById('unitCalculationTableBody');
const warningContainer = document.getElementById('warningContainer');
// unit size outputs
const marketStudioSizeDisplay = document.getElementById('marketStudioSize');
const market1BDSizeDisplay = document.getElementById('market1BDSize');
const market2BDSizeDisplay = document.getElementById('market2BDSize');
const market3BDSizeDisplay = document.getElementById('market3BDSize');
const affordableStudioSizeDisplay = document.getElementById('affordableStudioSize');
const affordable1BDSizeDisplay = document.getElementById('affordable1BDSize');
const affordable2BDSizeDisplay = document.getElementById('affordable2BDSize');
const affordable3BDSizeDisplay = document.getElementById('affordable3BDSize');
const avgAffordableSizeDisplay = document.getElementById('avgAffordableSizeDisplay');
const avgMarketSizeDisplay = document.getElementById('avgMarketSizeDisplay');
const avgBlendedSizeDisplay = document.getElementById('avgBlendedSizeDisplay');
// cost inputs
const landCostPerUnitInputDisplay = document.getElementById('landCostPerUnitInput');
const totalHCPerUnitInputDisplay = document.getElementById('totalHCPerUnitInput');
// cost outputs
const totalLandCostDisplay = document.getElementById('totalLandCost');
const totalHcCostDisplay = document.getElementById('totalHcCost');
const totalLandAndTotalHcDisplay = document.getElementById('totalLandAndTotalHc');
const totalLandAndTotalHcPerUnitDisplay = document.getElementById('totalLandAndTotalHcPerUnit');
const totalLandAndTotalHcPerSqFtDisplay = document.getElementById('totalLandAndTotalHcPerSqFt');
// abatement output
const abatementTableBody = document.getElementById('abatementTableBody');
*/



// Exclude these irrelevant columns which, if provided, would only serve to confuse the AI
const unwantedColumns = ["geom", "descriptionOfLiveLocalEligibility", "JV_HMSTD", "AV_HMSTD"];
// ADD MORE
// ..... & MORE
// ......... & MORE


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
    "MULTI_PAR_SAL1": "MultiParcelSale1",
    "QUAL_CD1": "QualificationCodeSale1",
    "VI_CD1": "VacantImprovedCodeSale1",
    "SALE_PRC1": "SalePrice1",
    "SALE_YR1": "SaleYear1",
    "SALE_MO1": "SaleMonth1",
    "OR_BOOK1": "OfficialRecordBookNumber1",
    "OR_PAGE1": "OfficialRecordPageNumber1",
    "CLERK_NO1": "ClerkInstrumentNumber1",
    "SAL_CHNG_CD1": "SaleChangeCode1",
    "MULTI_PAR_SAL2": "MultiParcelSale2",
    "QUAL_CD2": "QualificationCodeSale2",
    "VI_CD2": "VacantImprovedCodeSale2",
    "SALE_PRC2": "SalePrice2",
    "SALE_YR2": "SaleYear2",
    "SALE_MO2": "SaleMonth2",
    "OR_BOOK2": "OfficialRecordBookNumber2",
    "R_PAGE2": "OfficialRecordPageNumber2",
    "CLERK_NO2": "ClerkInstrumentNumber2",
    "SAL_CHNG_CD2": "SaleChangeCode2",
    "OWN_NAME": "OwnerName",
    "OWN_ADDR1": "OwnerMailingAddressLine1",
    "OWN_ADDR2": "OwnerMailingAddressLine2",
    "OWN_CITY": "OwnerCity",
    "OWN_STATE": "OwnerState",
    "OWN_ZIPCD": "OwnerZIPCode",
    "OWN_STATE_DOM": "OwnerStateOfDomicile",
    "FIDU_NAME": "FiduciaryName",
    "FIDU_ADDR1": "FiduciaryAddressLine1",
    "FIDU_ADDR2": "FiduciaryAddressLine2",
    "FIDU_CITY": "FiduciaryCity",
    "FIDU_STATE": "FiduciaryState",
    "FIDU_ZIPCD": "FiduciaryZIPCode",
    "FIDU_CD": "FiduciaryCode",
    "S_LEGAL": "ShortLegalDescription",
    "APP_STAT": "HomesteadApplicantStatus",
    "CO_APP_STAT": "HomesteadCoApplicantStatus",
    "MKT_AR": "MarketAreaCode",
    "NBRHD_CD": "NeighborhoodCode",
    "PUBLIC_LND": "PublicLand",
    "TAX_AUTH_CD": "TaxingAuthorityCode",
    "TWN": "TownshipNumber",
    "RNG": "RangeNumber",
    "SEC": "SectionOrGrantNumber",
    "CENSUS_BK": "CensusBlockGroupNumber",
    "PHY_ADDR1": "PhysicalAddressLine1",
    "PHY_ADDR2": "PhysicalAddressLine2",
    "PHY_CITY": "PhysicalLocationCity",
    "PHY_ZIPCD": "PhysicalLocationZIPCode",
    "ALT_KEY": "AlternateKeyNumber",
    "ASS_TRNSFR_FG": "AssessmentDifferentialTransferFlag",
    "PREV_HMSTD_OWN": "NumberOfOwnersPreviousHomestead",
    "ASS_DIF_TRNS": "AssessmentDifferentialTransferred",
    "CONO_PRV_HM": "CountyNumberPreviousHomestead",
    "PARCEL_ID_PRV_HMSTD": "ParcelIDPreviousHomestead",
    "YR_VAL_TRNSF": "YearValueTransferred",
    "EXMPT_##": "Exemptions",
    "SEQ_NO": "FileSequenceNumber",
    "RS_ID": "RealPropertySubmissionID",
    "MP_ID": "MasterParcelID",
    "STATE_PAR_ID": "UniformParcelID",
    "SPC_CIR_CD": "SpecialCircumstancesCode",
    "SPC_CIR_YR": "SpecialCircumstancesYear",
    "SPC_CIR_TXT": "SpecialCircumstancesText"
};


// These globals will certainly NOT be available until after the data refinement process
/*
let refinedDataset;
let aiGeneratedHTML;
*/