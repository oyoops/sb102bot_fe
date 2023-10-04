console.log('Start: Part 2 -- Development Program I/O');

// Unhide Tables

// Show market rate inputs
document.getElementById('marketRateInputSection').style.display = 'block';
// Show the rent/SqFt table section
document.getElementById('rentPerSqFtTableSection').style.display = 'block';
// Show the abatement table
document.getElementById('abatementTable').style.display = 'block';



// Show affordable % slider
const affordablePercentageSlider = document.getElementById("affordablePctSlider");
affordablePercentageSlider.value = 0.10; // 0.00; // 0.40; // Set the default value of the slider to 40% upon initial load
affordablePercentageSlider.oninput = function() {
    calculateWeightedAverageSizes(); // Recalculate units when the slider value changes.
}

// Event Listeners

// Set up an event listener for the acreage input to recalculate values in real-time
document.getElementById('acreageInput').addEventListener('input', function() {
    calculateMaximumUnits();
});
// Set up an event listener for the density input to recalculate values in real-time
document.getElementById('densityInput').addEventListener('input', function() {
    calculateMaximumUnits();
});
// Set up an event listener for the affordable percentage slider to recalculate values in real-time
document.getElementById('affordablePctSlider').addEventListener('input', function() {
    document.getElementById('affordablePctDisplay').innerText = `${this.value}%`;
    calculateMaximumUnits();
});
// Event listeners for all size inputs to recalculate weighted averages in real-time
document.querySelectorAll('.sizeInput').forEach(input => {
    input.addEventListener('input', () => {
        calculateMaximumUnits();
        calculateWeightedAverageSizes();
    });
});
// Event listeners for Market size inputs to set equal Affordable sizes (if checkbox is checked)
//     and then recalculate weighted averages in real-time
document.querySelectorAll('.marketSizeInput').forEach((input, index) => {
    input.addEventListener('input', () => {
        if (document.getElementById('matchAffordableSizes').checked) {
            document.querySelectorAll('.affordableSizeInput')[index].value = input.value;
            calculateWeightedAverageSizes();
        }
    });
});
// Event listeners for market-rate rent inputs
marketRateInputs.forEach(input => {
    input.addEventListener('input', function() {
        updateRentPerSqFtTable();
        // Update Revenue Table
    });
});


//  Checkbox for unit size matching


// Checkbox logic to set affordable units to the market unit sizes
document.getElementById('matchAffordableSizes').addEventListener('change', function() {
    const affordableInputs = document.querySelectorAll('.affordableSizeInput');
    const marketInputs = document.querySelectorAll('.marketSizeInput');
    const marketRateInputs = document.querySelectorAll('.marketRateInput');
    
    // If checkbox is checked
    if (this.checked) {
        affordableInputs.forEach((input, index) => {
            input.value = marketInputs[index].value;  // Set affordable value to match market value
            input.disabled = true;  // Disable the input
        });
    } else {
        // If checkbox is unchecked
        affordableInputs.forEach(input => input.disabled = false);  // Re-enable the input
    }
    
    // Recalculate units and sizes
    calculateMaximumUnits();
    calculateWeightedAverageSizes();
});

console.log('End: Part 2 -- Development Program I/O');



//           //
/* Functions */
//           //

// Function to update the Rent per Sq. Ft. table
function updateRentPerSqFtTable() {
    // Create functions getMarketRatePerSqFt and getAffordableRatePerSqFt to calculate these values
    document.getElementById('marketRateStudioPerSqFt').innerText = getMarketRatePerSqFt('Studio');
    document.getElementById('affordableStudioPerSqFt').innerText = getAffordableRatePerSqFt('Studio');
    document.getElementById('marketRateStudioPerSqFt').innerText = getMarketRatePerSqFt('1BD');
    document.getElementById('affordableStudioPerSqFt').innerText = getAffordableRatePerSqFt('1BD');
    document.getElementById('marketRateStudioPerSqFt').innerText = getMarketRatePerSqFt('2BD');
    document.getElementById('affordableStudioPerSqFt').innerText = getAffordableRatePerSqFt('2BD');
    document.getElementById('marketRateStudioPerSqFt').innerText = getMarketRatePerSqFt('3BD');
    document.getElementById('affordableStudioPerSqFt').innerText = getAffordableRatePerSqFt('3BD');
}

// Calculate maximum units and show them in a table
function calculateMaximumUnits() {
    // Acreage, density, and affordable percentage inputs
    const acreageValue = parseFloat(document.getElementById('acreageInput').value);
    const densityValue = parseFloat(document.getElementById('densityInput').value) || 10; // Default to 10 if not provided
    const affordablePctSlider = document.getElementById('affordablePctSlider');
    const affordablePctDisplay = document.getElementById('affordablePctDisplay');
    const affordablePct = parseFloat(affordablePctSlider.value) / 100;

    // Calculate unit counts
    const totalUnits = Math.floor(acreageValue * densityValue);
    const affordableUnits = Math.ceil(affordablePct * totalUnits);
    const marketUnits = totalUnits - affordableUnits;

    // Update the table with unit counts
    const tableBody = document.getElementById('unitCalculationTableBody');
    tableBody.innerHTML = `
        <tr>
            <td>${affordableUnits}</td>
            <td>${marketUnits}</td>
            <td>${totalUnits}</td>
        </tr>
    `;
    // Display the unit calculation table now that we have data
    document.getElementById('unitCalculationTable').style.display = 'block';


    // Update abatement
    const abatementValue = Math.round(0.75 * (affordableUnits / totalUnits) * 100);
    const abatementTableBody = document.getElementById('abatementTableBody');
    abatementTableBody.innerHTML = `
        <tr>
            <td>${abatementValue}% of ad valorem property taxes</td>
        </tr>
    `;

    // Check for warnings
    const warningContainer = document.getElementById('warningContainer');
    warningContainer.innerHTML = "";  // Clear previous warnings
    if (affordableUnits < 70) {
        document.getElementById('warningContainer').style.display = 'block';
    }
    if (affordablePct < 0.4) {
        document.getElementById('warningContainer').style.display = 'block';
        warningContainer.innerHTML += '<p style="color: orange;">Not at 40% affordable threshold!</p>';
    } 
    if (affordablePct < 0.1) {
        warningContainer.innerHTML += '<p style="color: red;">Not at 10% affordable threshold!</p>';
        document.getElementById('warningContainer').style.display = 'block';
    }
    if (affordableUnits >= 70 && affordablePct >= 0.4) {
        document.getElementById('warningContainer').style.display = 'none';
    }

    calculateWeightedAverageSizes(); // Run it
}

// Function to calculate Market Rate per Sq. Ft.
function getMarketRatePerSqFt(unitType) {
    const marketRate = parseFloat(document.getElementById(`marketRate${unitType}`).value) || 0;
    const unitSize = parseFloat(document.getElementById(`market${unitType}Size`).value) || 0;
    return (unitSize === 0) ? 'N/A' : (marketRate / unitSize).toFixed(2);
}

// Function to calculate Affordable Rate per Sq. Ft.
function getAffordableRatePerSqFt(unitType) {
    // Assuming we have an input field for affordable rate, similar to market rate
    const affordableRate = parseFloat(document.getElementById(`affordableRate${unitType}`).value) || 0;
    const unitSize = parseFloat(document.getElementById(`affordable${unitType}Size`).value) || 0;
    return (unitSize === 0) ? 'N/A' : (affordableRate / unitSize).toFixed(2);
}

// Function to calculate weighted average sizes
function calculateWeightedAverageSizes() {
    const affordablePctSlider = document.getElementById('affordablePctSlider');
    const affordablePct = parseFloat(affordablePctSlider.value) / 100;
    const acreageValue = parseFloat(document.getElementById('acreageInput').value);
    const densityValue = parseFloat(document.getElementById('densityInput').value) || 10;

    const totalUnits = Math.floor(acreageValue * densityValue);
    const affordableUnits = Math.ceil(affordablePct * totalUnits);
    const marketUnits = totalUnits - affordableUnits;

    const marketStudioSize = parseFloat(document.getElementById('marketStudioSize').value) || 0;
    const market1BDSize = parseFloat(document.getElementById('market1BDSize').value) || 0;
    const market2BDSize = parseFloat(document.getElementById('market2BDSize').value) || 0;
    const market3BDSize = parseFloat(document.getElementById('market3BDSize').value) || 0;

    const affordableStudioSize = parseFloat(document.getElementById('affordableStudioSize').value) || 0;
    const affordable1BDSize = parseFloat(document.getElementById('affordable1BDSize').value) || 0;
    const affordable2BDSize = parseFloat(document.getElementById('affordable2BDSize').value) || 0;
    const affordable3BDSize = parseFloat(document.getElementById('affordable3BDSize').value) || 0;

    // Calculate the weighted average sizes for market, affordable, and total units
    const avgMarketSize = (marketStudioSize + market1BDSize + market2BDSize + market3BDSize) / 4;
    const avgAffordableSize = (affordableStudioSize + affordable1BDSize + affordable2BDSize + affordable3BDSize) / 4;
    const avgTotalSize = (avgMarketSize * marketUnits + avgAffordableSize * affordableUnits) / totalUnits;

    // Display these values
    document.getElementById('avgMarketSizeDisplay').innerText = avgMarketSize.toFixed(0);
    document.getElementById('avgAffordableSizeDisplay').innerText = avgAffordableSize.toFixed(0);
    document.getElementById('avgTotalSizeDisplay').innerText = avgTotalSize.toFixed(0);
}
