// globals.js - Centralized declarations of (most) constants and global variables.


let superAI = 'off';
let debugModeSwitch = 'on';
let enableLiveLocalModule = 'on';

let globSupData;
let globSupDataForLegacy;

/* CONSTANTS */
// Comps:
const COMPS_SEARCH_RADIUS_MILES = "3.0000"; // miles (must be in string form)
const COMPS_SEARCH_RESULTS_LIMIT = 10; // max # of comps returned
// Max Bldg. Height:
const LIVE_LOCAL_BLDG_RADIUS_MILES = 1.02; // building height search radius (note the buffer!)


/* MAIN SCRIPT GLOBALS */
let intervalTimeLoading = 250; // loading indicator - estimated time to reach 99%
let percentageLoading = 0; // loading indicator % value text
let lat;
let lng;
let address;
let geocodeData;
let compsData;
let cityData;
let cityNameProper;
let countyNameProper;
let displayMuniName;
let maxMuniDensity;
let acres;
let maxCapacity = 0;
let aiSupplementalData;
let aiResponses;
let summaryContent = "";

/* MAX BLDG. HEIGHT GLOBALS
   (all of these could break if tallestBuilding array size is increased >1 in the future) */
let tallestBuildingsData;
let buildingLat;
let buildingLng;
let buildingHeight;
let buildingAddress; // (not 100% reliable)
let buildingName; // (not even close to 100% reliable)
let distanceInMilesToTallestBldg;

/* MAP GLOBALS 
   (mapDisplay should be moved to domElements.js eventually) */
let map = null; // ACTUAL MAP OBJECT; initialized to null
const mapDisplay = document.getElementById('map'); // MAP DOM OBJECT; used in gmap.js


// ----------------------------------


/* Exclude these columns during the (dirtyData -> cleanData) conversion process.
   These are irrelevant to us and would degrade response quality if included in the AI supplemental data set. */
const unwantedColumns = [
    "geom",
    "descriptionOfLiveLocalEligibility",
    "JV_HMSTD",
    "AV_HMSTD"
    //
    // EXCLUDE MORE!!
    //
];

/* Map parcelData columns to new columns with improved and more self-explanatory names.
   (DOES THIS EVEN WORK!?) */ 
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
