// domElements.js

/* (Option 1) ES6 Module Syntax */

// Div sections/containers
const mainHeader = document.getElementById("mainHeader");
const loadingContainer = document.querySelector('.loading-container');
const initialContent = document.querySelector('#initialContent');
//const navButtonsContainer = document.querySelector('#navButtonsContainer');

const infoSections = document.getElementById('infoSections');
const currentBugsContainer = document.getElementById('currentBugs');
const recentUpdatesContainer = document.getElementById('recentUpdates');
const futureUpdatesContainer = document.getElementById('futureUpdates');

const eligibilityDiv = document.getElementById("eligibilityStatus");
const compsTable = document.getElementById("compsTable");

const developmentProgramInputSection = document.getElementById('developmentProgramInputSection');
const rentInfoContainer = document.getElementById('rentInfoContainer');
/*const marketRateInputSection = document.getElementById('marketRateInputSection');
const rentPerSqFtTableSection = document.getElementById('rentPerSqFtTableSection');
const landAndTotalHcInputSection = document.getElementById('landAndTotalHcInputSection');
const landAndTotalHcOutputSection = document.getElementById('totalLandAndTotalHcOutputSection');

// Tables & bodies
//const parcelDataTable = document.getElementById('parcelDataTable');
//const parcelDataTableBody = document.querySelector('#parcelDataTable tbody');
const countyDataTable = document.getElementById('countyDataTable');
const countyTableBody = document.querySelector('#countyDataTable tbody');
*/
const countyMaxRentsTable = document.getElementById('countyMaxRentsTable');
const rentsTableBody = document.querySelector('#countyMaxRentsTable tbody');
/*
const unitCalculationTable = document.getElementById('unitCalculationTable');
const abatementTable = document.getElementById('abatementTable');
*/

// Form and its elements
const form = document.querySelector('#searchForm');
const addressInput = document.querySelector('#addressInput');

/*
const affordablePercentageSlider = document.getElementById("affordablePctSlider");
const affordablePctDisplay = document.getElementById('affordablePctDisplay');
const acreageInput = document.getElementById("acreageInput");
const densityInput = document.getElementById('densityInput');
const landCostPerUnit = document.getElementById('landCostPerUnitInput');
const totalHCPerUnit = document.getElementById('totalHCPerUnitInput');
const matchAffordableSizesCheckbox = document.getElementById('matchAffordableSizes');

// Input groupings
const sizeInputs = document.querySelectorAll('.sizeInput');
const marketInputs = document.querySelectorAll('.marketSizeInput');
const affordableSizeInputs = document.querySelectorAll('.affordableSizeInput');
const marketRateInputs = document.querySelectorAll('.marketRateInput');
*/

// Map and try again button
const googlemap = document.getElementById('map');
const tryAgainButton = document.getElementById("tryAgainButton");

export {
    loadingContainer,
    initialContent,
    //navButtonsContainer,

    infoSections,
    currentBugsContainer,
    recentUpdatesContainer,
    futureUpdatesContainer,
    
    eligibilityDiv,
    compsTable,
    
    rentInfoContainer,
    //developmentProgramInputSection,
    //marketRateInputSection,
    //rentPerSqFtTableSection,
    //landAndTotalHcInputSection,
    //landAndTotalHcOutputSection,
    mainHeader,
    //parcelDataTable,
    //parcelDataTableBody,
    //countyDataTable,
    //countyTableBody,
    countyMaxRentsTable,
    rentsTableBody,
    //unitCalculationTable,
    //abatementTable,
    form,
    addressInput,
    //affordablePercentageSlider,
    //affordablePctDisplay,
    //acreageInput,
    //densityInput,
    //landCostPerUnit,
    //totalHCPerUnit,
    //matchAffordableSizesCheckbox,
    //sizeInputs,
    //marketInputs,
    //affordableSizeInputs,
    //marketRateInputs,
    googlemap,
    tryAgainButton
};