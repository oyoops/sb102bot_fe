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

// Event listener for the Calculate Maximum Rents button