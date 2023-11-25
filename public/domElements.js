// domElements.js - Define and export DOM elements for main.js (ES6 Module Syntax)


// Div sections/containers
const mainHeader = document.getElementById("mainHeader");
const loadingContainer = document.querySelector('.loading-container');
const initialContent = document.querySelector('#initialContent');
const infoSections = document.getElementById('infoSections');
const recentUpdatesContainer = document.getElementById('recentUpdates');

// Main form and its elements
const form = document.querySelector('#searchForm');
const addressInput = document.querySelector('#addressInput');
const customInstructionsInput = document.getElementById('customInstructionsInput');
const superchargeSwitch = document.getElementById('superchargeSwitch');
const debugModeCheckbox = document.getElementById('debugModeCheckbox');
const enableLiveLocalSwitch = document.getElementById('enableLiveLocalSwitch')

// Map and try again button
const googlemap = document.getElementById('map');
const tryAgainButton = document.getElementById("tryAgainButton");

// AI response div
const eligibilityDiv = document.getElementById("eligibilityStatus");

// Tables and their elements
const rentInfoContainer = document.getElementById('rentInfoContainer');
const countyMaxRentsTable = document.getElementById('countyMaxRentsTable');
const rentsTableBody = document.querySelector('#countyMaxRentsTable tbody');
const compsTable = document.getElementById('compsTable');

const devProgramContainer = document.getElementById('devProgramContainer');
const devProgramTable = document.getElementById('devProgramTable');
const liveLocalContainer = document.getElementById('liveLocalContainer');
const liveLocalTable = document.getElementById('liveLocalTable');


export {
    initialContent,
    mainHeader, // (?)
    form,
    addressInput,
    customInstructionsInput,
    debugModeCheckbox,
    enableLiveLocalSwitch,
    superchargeSwitch,
    infoSections,
    recentUpdatesContainer,
    loadingContainer,
    googlemap,
    tryAgainButton,
    eligibilityDiv,
    compsTable,
    rentInfoContainer,
    countyMaxRentsTable,
    rentsTableBody,
    devProgramContainer,
    devProgramTable,
    liveLocalContainer,
    liveLocalTable
};
