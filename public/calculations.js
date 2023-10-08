// calculations.js - contains the functions for recalculating the proforma math live.

/*===========//
// Functions //
//    for    //
//  main.js  //
//===========*/

// Calculate maximum units and show them in a table
function calculateMaximumUnits() {
    // Acreage, density, and affordable percentage inputs
    const acreageValue = parseFloat(document.getElementById('acreageInput').value);
    const densityValue = parseFloat(document.getElementById('densityInput').value) || 50; // default max. muni. density = 50 units/ac.
    const affordablePctSlider = document.getElementById('affordablePctSlider');
    const affordablePctDisplay = document.getElementById('affordablePctDisplay');
    affordablePct = parseFloat(affordablePctSlider.value) / 100;

    // Calculate unit counts
    totalUnits = Math.floor(acreageValue * densityValue);
    affordableUnits = Math.ceil(affordablePct * totalUnits);
    marketUnits = totalUnits - affordableUnits;

    // Update the table with unit counts
    const tableBody = document.getElementById('unitCalculationTableBody');
    tableBody.innerHTML = `
        <tr>
            <td>${affordableUnits}</td>
            <td>${marketUnits}</td>
            <td>${totalUnits}</td>
        </tr>
    `;
    // Unhide unit count table
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
        warningContainer.innerHTML += '<p style="color: red;">Need at least 70 affordable units for the steamroll option!</p>';
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
    calculateWeightedAverageSizes();
}

// Calculate weighted average sizes
function calculateWeightedAverageSizes() {
    const affordablePctSlider = document.getElementById('affordablePctSlider');
    const affordablePct = parseFloat(affordablePctSlider.value) / 100;
    const acreageValue = parseFloat(document.getElementById('acreageInput').value);
    const densityValue = parseFloat(document.getElementById('densityInput').value) || 10;

    totalUnits = Math.floor(acreageValue * densityValue);
    affordableUnits = Math.ceil(affordablePct * totalUnits);
    marketUnits = totalUnits - affordableUnits;

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

// Calculate Market-Rate rents per Sq. Ft.
function getMarketRatePerSqFt(unitType) {
    const marketRate = parseFloat(document.getElementById(`marketRate${unitType}`).value) || 0;
    const unitSize = parseFloat(document.getElementById(`market${unitType}Size`).value) || 0;
    // Debugging Step 4: Print if unit size is zero
    if (unitSize === 0) {
        console.log(`Unit size for ${unitType} is zero.`);
    }
    return (unitSize === 0) ? 'N/A' : (marketRate / unitSize).toFixed(2);
}

// Calculate Affordable rents per Sq. Ft.
function getAffordableRatePerSqFt(unitType) {
    if (typeof countyData === 'undefined') {
        console.log("countyData is not available yet.");
        return 'N/A';
    }  
    let affordableRate = 0;
    // convert max rent strings to floats
    const maxRent0bd = parseFloat(countyData.max_rent_0bd_120ami);
    const maxRent1bd = parseFloat(countyData.max_rent_1bd_120ami);
    const maxRent2bd = parseFloat(countyData.max_rent_2bd_120ami);
    const maxRent3bd = parseFloat(countyData.max_rent_3bd_120ami);
    // select appropriate affordable rate based on unit type
    switch (unitType) {
        case 'Studio':
            affordableRate = maxRent0bd;
            break;
        case '1BD':
            affordableRate = maxRent1bd;
            break;
        case '2BD':
            affordableRate = maxRent2bd;
            break;
        case '3BD':
            affordableRate = maxRent3bd;
            break;
        default:
            console.error("Invalid unit type.");
            return 'N/A';
    }
    const unitSize = parseFloat(document.getElementById(`affordable${unitType}Size`).value) || 0;
    
    if (unitSize === 0) {console.log(`Unit size for ${unitType} is zero.`);}
    console.log(`Affordable Rate for ${unitType}: ${affordableRate}`);
    console.log(`Unit Size for ${unitType}: ${unitSize}`);
    
    return (unitSize === 0) ? 'N/A' : (affordableRate / unitSize).toFixed(2);
}

// Update the Rent per Sq. Ft. table
function updateRentPerSqFtTable() {
    document.getElementById('marketRateStudioPerSqFt').innerText = getMarketRatePerSqFt('Studio');
    document.getElementById('affordableStudioPerSqFt').innerText = getAffordableRatePerSqFt('Studio');
    document.getElementById('marketRate1BDPerSqFt').innerText = getMarketRatePerSqFt('1BD');
    document.getElementById('affordable1BDPerSqFt').innerText = getAffordableRatePerSqFt('1BD');
    document.getElementById('marketRate2BDPerSqFt').innerText = getMarketRatePerSqFt('2BD');
    document.getElementById('affordable2BDPerSqFt').innerText = getAffordableRatePerSqFt('2BD');
    document.getElementById('marketRate3BDPerSqFt').innerText = getMarketRatePerSqFt('3BD');
    document.getElementById('affordable3BDPerSqFt').innerText = getAffordableRatePerSqFt('3BD');
}

