// globals.js - Centralized global variable declarations for SB102bot web app.

/* GLOBAL VARIABLES FROM main.js */
let intervalTimeLoading = 500; // fake loading indicator time (ms) until 99%
let percentageLoading = 0; // fake loading indicator % value
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
// tallest building details (may break if tallestBuilding array >1)
let buildingLat;
let buildingLng;
let buildingHeight;
let buildingName; // may not work
let buildingAddress; // may not work
