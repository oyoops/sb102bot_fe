// After successfully populating the tables, display the (poorly named) "acreage input section"
document.getElementById('acreageSection').style.display = 'block';

// Show affordable % slider
const affordablePercentageSlider = document.getElementById("affordablePctSlider");
const affordablePercentageValue = document.getElementById("affordablePercentageValue");
affordablePercentageSlider.oninput = function() {
    affordablePercentageValue.textContent = this.value + '%';
    calculateWeightedAverageSizes(); // Recalculate units when the slider value changes.
}

// Set up an event listener for the affordable percentage slider to recalculate values in real-time
document.getElementById('affordablePctSlider').addEventListener('input', function() {
    document.getElementById('affordablePctDisplay').innerText = `${this.value}%`;
    calculateMaximumUnits();
    calculateWeightedAverageSizes();
});

// Checkbox logic to set affordable units to the market unit sizes
document.getElementById('matchAffordableSizes').addEventListener('change', function() {
    const affordableInputs = document.querySelectorAll('.affordableSizeInput');
    const marketInputs = document.querySelectorAll('.marketSizeInput');
    
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

// Event listeners for all size inputs to recalculate weighted averages in real-time
document.querySelectorAll('.sizeInput').forEach(input => {
    input.addEventListener('input', calculateWeightedAverageSizes);
});

// Calculate maximum units and show them in a table
function calculateMaximumUnits() {
    const acreageValue = parseFloat(document.getElementById('acreageInput').value);
    
    const densityValue = 10;  // Example density value, modify as needed

    const affordablePctSlider = document.getElementById('affordablePctSlider');
    const affordablePctDisplay = document.getElementById('affordablePctDisplay');
    const affordablePct = parseFloat(affordablePctSlider.value) / 100;

    const totalUnits = Math.floor(acreageValue * densityValue);
    const affordableUnits = Math.ceil(affordablePct * totalUnits);
    const marketUnits = totalUnits - affordableUnits;



    // Update the table with calculated values
    const tableBody = document.getElementById('unitCalculationTableBody');
    tableBody.innerHTML = `
        <tr>
            <td>${affordableUnits}</td>
            <td>${marketUnits}</td>
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
    // Display the abatement table now that we have data
    document.getElementById('abatementTable').style.display = 'block';


    // Check for warnings
    const warningContainer = document.getElementById('warningContainer');
    warningContainer.innerHTML = "";  // Clear previous warnings
    if (affordableUnits <= 70) {
        warningContainer.innerHTML += '<p style="color: red;">Not enough affordable units!</p>';
    }
    if (affordablePct < 0.4) {
        warningContainer.innerHTML += '<p style="color: red;">Not at 40% affordable threshold!</p>';
    }
}

// Function to calculate weighted average sizes
function calculateWeightedAverageSizes() {
    const affordableUnits = parseInt(document.querySelector('#unitCalculationTableBody td:first-child').innerText);
    const marketUnits = parseInt(document.querySelector('#unitCalculationTableBody td:last-child').innerText);
    const totalUnits = affordableUnits + marketUnits;

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
