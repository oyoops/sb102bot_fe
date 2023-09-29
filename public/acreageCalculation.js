// Event listener for the Calculate Maximum Units button
document.getElementById('calculateUnitsButton').addEventListener('click', function() {
    // Fetch the acreage value
    const acreageValue = parseFloat(document.getElementById('acreageInput').value);
    
    // Assuming a constant density value for now (modify as needed)
    const densityValue = 10;  // Example density value, modify as needed
    const affordablePctInput = 0.4

    // Calculate affordable and market units
    const affordableUnits = Math.ceil(affordablePctInput * (acreageValue * densityValue));
    const marketUnits = (acreageValue * densityValue) - affordableUnits;
    
    // Update the table with calculated values
    const tableBody = document.createElement('tbody');
    const row = `
        <tr>
            <td>${affordableUnits} units</td>
            <td>${marketUnits} units</td>
        </tr>
    `;
    tableBody.innerHTML = row;
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Affordable</th>
                <th>Market rate</th>
            </tr>
        </thead>
    `;
    table.appendChild(tableBody);
    document.getElementById('acreageSection').appendChild(table);
    
    // Check and display warnings
    const warningContainer = document.createElement('div');
    if (affordableUnits <= 70) {
        const warning = document.createElement('p');
        warning.innerText = "Not enough affordable units";
        warning.style.color = "red";
        warningContainer.appendChild(warning);
    }
    
    const affordablePercentage = (affordableUnits / (affordableUnits + marketUnits)) * 100;
    if (affordablePercentage < 40) {
        const warning = document.createElement('p');
        warning.innerText = "Not at 40% affordable threshold!";
        warning.style.color = "red";
        warningContainer.appendChild(warning);
    }
    
    // Display the abatement label
    const abatementLabel = document.createElement('p');
    const abatementValue = Math.round(0.75 * affordablePercentage);
    abatementLabel.innerText = `Abatement = ${abatementValue}% of ad valorem property taxes`;
    warningContainer.appendChild(abatementLabel);
    
    document.getElementById('acreageSection').appendChild(warningContainer);
});


// Select the new input elements
const marketStudioSize = document.getElementById('marketStudioSize');
const market1BDSize = document.getElementById('market1BDSize');
const market2BDSize = document.getElementById('market2BDSize');
const market3BDSize = document.getElementById('market3BDSize');

const affordableStudioSize = document.getElementById('affordableStudioSize');
const affordable1BDSize = document.getElementById('affordable1BDSize');
const affordable2BDSize = document.getElementById('affordable2BDSize');
const affordable3BDSize = document.getElementById('affordable3BDSize');

const matchSizesCheckbox = document.getElementById('matchAffordableSizes');

// Add event listener for the checkbox
matchSizesCheckbox.addEventListener('change', function() {
    if (this.checked) {
        // Copy market unit sizes to affordable unit sizes
        affordableStudioSize.value = marketStudioSize.value;
        affordable1BDSize.value = market1BDSize.value;
        affordable2BDSize.value = market2BDSize.value;
        affordable3BDSize.value = market3BDSize.value;
        
        // Disable affordable unit size inputs
        affordableStudioSize.disabled = true;
        affordable1BDSize.disabled = true;
        affordable2BDSize.disabled = true;
        affordable3BDSize.disabled = true;
    } else {
        // Re-enable affordable unit size inputs
        affordableStudioSize.disabled = false;
        affordable1BDSize.disabled = false;
        affordable2BDSize.disabled = false;
        affordable3BDSize.disabled = false;
    }
});

// Function to calculate weighted average sizes
function calculateWeightedAverageSizes() {
    // Get the unit counts (from previous calculations)
    const affordableUnits = Math.ceil(affordablePercentage / 100 * totalUnits);
    const marketUnits = totalUnits - affordableUnits;
    
    // Calculate weighted averages for each unit type
    const avgMarketSize = (marketStudioSize.value * studioUnits + market1BDSize.value * oneBDUnits + market2BDSize.value * twoBDUnits + market3BDSize.value * threeBDUnits) / marketUnits;
    const avgAffordableSize = (affordableStudioSize.value * studioUnits + affordable1BDSize.value * oneBDUnits + affordable2BDSize.value * twoBDUnits + affordable3BDSize.value * threeBDUnits) / affordableUnits;
    const avgTotalSize = (avgMarketSize * marketUnits + avgAffordableSize * affordableUnits) / totalUnits;
    
    // Display these values somewhere on the page (you may need to adjust this based on where you want to show the results)
    // For now, I'm just logging them to the console
    console.log('Average Market Unit Size:', avgMarketSize);
    console.log('Average Affordable Unit Size:', avgAffordableSize);
    console.log('Average Total Unit Size:', avgTotalSize);
}

// Add event listeners for the input fields to update calculations in real-time
marketStudioSize.addEventListener('input', calculateWeightedAverageSizes);
market1BDSize.addEventListener('input', calculateWeightedAverageSizes);
market2BDSize.addEventListener('input', calculateWeightedAverageSizes);
market3BDSize.addEventListener('input', calculateWeightedAverageSizes);

affordableStudioSize.addEventListener('input', calculateWeightedAverageSizes);
affordable1BDSize.addEventListener('input', calculateWeightedAverageSizes);
affordable2BDSize.addEventListener('input', calculateWeightedAverageSizes);
affordable3BDSize.addEventListener('input', calculateWeightedAverageSizes);
