// eventListeners.js - define all event listeners w/ DOM


import {
    tryAgainButton
} from './domElements.js';

/*import {
    tryAgainButton,
    affordablePercentageSlider,
    acreageInput,
    densityInput,
    affordablePctDisplay,
    sizeInputs,
    marketInputs,
    affordableSizeInputs,
    matchAffordableSizesCheckbox,
    marketRateInputs,
    landCostPerUnit,
    totalHCPerUnit,
    googlemap
} from './domElements.js';*/


// on New Search button click:
tryAgainButton.addEventListener("click", function() {
    location.reload();
});

/*
// on sliding the affordable percentage slider
affordablePercentageSlider.oninput = function() {
    calculateWeightedAverageSizes();
    updateRentPerSqFtTable();
}

// on acreage [A ac.] input:
acreageInput.addEventListener('input', function() {
    calculateMaximumUnits();
    updateRentPerSqFtTable();
});

// on density [D units/ac.] input:
densityInput.addEventListener('input', function() {
    calculateMaximumUnits();
    updateRentPerSqFtTable();
});

// on affordable % slider [%aff] change:
affordablePercentageSlider.addEventListener('input', function() {
    affordablePctDisplay.innerText = `${this.value}%`;
    calculateMaximumUnits();
    updateRentPerSqFtTable();
});

// on all SqFt/unit [s SqFt] inputs:
sizeInputs.forEach(input => {
    input.addEventListener('input', () => {
        calculateMaximumUnits();
        calculateWeightedAverageSizes();
        updateRentPerSqFtTable();
    });
});

// on market-rate SqFt/unit [s SqFt(mkt)] inputs:
marketInputs.forEach((input, index) => {
    input.addEventListener('input', () => {
        if (matchAffordableSizesCheckbox.checked) {
            affordableSizeInputs[index].value = input.value;
            calculateWeightedAverageSizes();
        }
    });
});

// on market-rate rent per unit [$ Rent(mkt)] inputs:
marketRateInputs.forEach(input => {
    input.addEventListener('input', function() {
        updateRentPerSqFtTable();
    });
});

// on checkbox change:
matchAffordableSizesCheckbox.addEventListener('change', function() {
    const affordableInputs = affordableSizeInputs;    
    if (this.checked) {
        affordableInputs.forEach((input, index) => {
            input.value = marketInputs[index].value;
            input.disabled = true;
        });
    } else {
        affordableInputs.forEach(input => input.disabled = false);
    }
    calculateMaximumUnits();
    calculateWeightedAverageSizes();
    updateRentPerSqFtTable();
});

*/

/*// on cost inputs change:
landCostPerUnit.addEventListener('input', updateTotalCosts);
totalHCPerUnit.addEventListener('input', updateTotalCosts);*/
