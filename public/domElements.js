// domElements.js


/* (Option 1) ES6 Module Syntax */

// Div sections/containers
const loadingContainer = document.querySelector('.loading-container');
const initialContent = document.querySelector('#initialContent');
const navButtonsContainer = document.querySelector('navButtons');
const infoSections = document.getElementById('infoSections');
const currentBugsContainer = document.getElementById('currentBugs');
const recentUpdatesContainer = document.getElementById('recentUpdates');
const futureUpdatesContainer = document.getElementById('futureUpdates');
const eligibilityDiv = document.getElementById("eligibilityStatus");
const developmentProgramInputSection = document.getElementById('developmentProgramInputSection');
const rentInfoContainer = document.getElementById('rentInfoContainer');
const marketRateInputSection = document.getElementById('marketRateInputSection');
const rentPerSqFtTableSection = document.getElementById('rentPerSqFtTableSection');
const landAndTotalHcInputSection = document.getElementById('landAndTotalHcInputSection');
const landAndTotalHcOutputSection = document.getElementById('totalLandAndTotalHcOutputSection');

// Header
const mainHeader = document.getElementById("mainHeader");

// Tables and their bodies
//const parcelDataTable = document.getElementById('parcelDataTable');
//const parcelDataTableBody = document.querySelector('#parcelDataTable tbody');
const countyDataTable = document.getElementById('countyDataTable');
const countyTableBody = document.querySelector('#countyDataTable tbody');
const countyMaxRentsTable = document.getElementById('countyMaxRentsTable');
const rentsTableBody = document.querySelector('#countyMaxRentsTable tbody');
const unitCalculationTable = document.getElementById('unitCalculationTable');
const abatementTable = document.getElementById('abatementTable');

// Form and its elements
const form = document.querySelector('#searchForm');
const addressInput = document.querySelector('#addressInput');
const affordablePercentageSlider = document.getElementById("affordablePctSlider");
const affordablePctDisplay = document.getElementById('affordablePctDisplay');
const acreageInput = document.getElementById("acreageInput");
const densityInput = document.getElementById('densityInput');
const landCostPerUnit = document.getElementById('landCostPerUnitInput');
const totalHCPerUnit = document.getElementById('totalHCPerUnitInput');
const matchAffordableSizesCheckbox = document.getElementById('matchAffordableSizes');

// Inputs groupings
const sizeInputs = document.querySelectorAll('.sizeInput');
const marketInputs = document.querySelectorAll('.marketSizeInput');
const affordableSizeInputs = document.querySelectorAll('.affordableSizeInput');
const marketRateInputs = document.querySelectorAll('.marketRateInput');

// Map and button
const googlemap = document.getElementById('map');
const tryAgainButton = document.getElementById("tryAgainButton");

export {
    loadingContainer,
    initialContent,
    navButtonsContainer,
    infoSections,
    currentBugsContainer,
    recentUpdatesContainer,
    futureUpdatesContainer,
    eligibilityDiv,
    rentInfoContainer,
    developmentProgramInputSection,
    marketRateInputSection,
    rentPerSqFtTableSection,
    landAndTotalHcInputSection,
    landAndTotalHcOutputSection,
    mainHeader,
    //parcelDataTable,
    //parcelDataTableBody,
    countyDataTable,
    countyTableBody,
    countyMaxRentsTable,
    rentsTableBody,
    unitCalculationTable,
    abatementTable,
    form,
    addressInput,
    affordablePercentageSlider,
    affordablePctDisplay,
    acreageInput,
    densityInput,
    landCostPerUnit,
    totalHCPerUnit,
    matchAffordableSizesCheckbox,
    sizeInputs,
    marketInputs,
    affordableSizeInputs,
    marketRateInputs,
    googlemap,
    tryAgainButton
};


/* (Option 2) '.window' Syntax */

/*
// Div sections/containers
window.loadingContainer = document.querySelector('.loading-container');
window.initialContent = document.querySelector('#initialContent');
window.eligibilityDiv = document.getElementById("eligibilityStatus");
window.developmentProgramInputSection = document.getElementById('developmentProgramInputSection');
window.marketRateInputSection = document.getElementById('marketRateInputSection');
window.rentPerSqFtTableSection = document.getElementById('rentPerSqFtTableSection');
window.landAndTotalHcInputSection = document.getElementById('landAndTotalHcInputSection');
window.landAndTotalHcOutputSection = document.getElementById('totalLandAndTotalHcOutputSection');

// Header
window.mainHeader = document.getElementById("mainHeader");

// Tables and their bodies
window.parcelDataTable = document.getElementById('parcelDataTable');
window.parcelDataTableBody = document.querySelector('#parcelDataTable tbody');
window.countyDataTable = document.getElementById('countyDataTable');
window.countyTableBody = document.querySelector('#countyDataTable tbody');
window.countyMaxRentsTable = document.getElementById('countyMaxRentsTable');
window.rentsTableBody = document.querySelector('#countyMaxRentsTable tbody');
window.unitCalculationTable = document.getElementById('unitCalculationTable');
window.abatementTable = document.getElementById('abatementTable');

// Form and its elements
window.form = document.querySelector('#searchForm');
window.addressInput = document.querySelector('#addressInput');
window.affordablePercentageSlider = document.getElementById("affordablePctSlider");
window.affordablePctDisplay = document.getElementById('affordablePctDisplay');
window.acreageInput = document.getElementById("acreageInput");
window.densityInput = document.getElementById('densityInput');
window.landCostPerUnit = document.getElementById('landCostPerUnitInput');
window.totalHCPerUnit = document.getElementById('totalHCPerUnitInput');
window.matchAffordableSizesCheckbox = document.getElementById('matchAffordableSizes');

// Inputs groupings
window.sizeInputs = document.querySelectorAll('.sizeInput');
window.marketInputs = document.querySelectorAll('.marketSizeInput');
window.affordableSizeInputs = document.querySelectorAll('.affordableSizeInput');
window.marketRateInputs = document.querySelectorAll('.marketRateInput');

// Map and button
window.googlemap = document.getElementById('map');
window.tryAgainButton = document.getElementById("tryAgainButton");
*/