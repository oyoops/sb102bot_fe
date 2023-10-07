/*===========//
// Functions //
//    for    //
//  main.js  //
//===========*/

function initMap() {
    // Maps API is now loaded and can be used.
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

// Fetch the AI 'memo' by adding all relevant global vars as endpoint parameters
async function runAISection() {
    const textMod = ` Make it good. `;

    const aiContainer = document.getElementById('aiContainer');
    aiContainer.style.display = 'block';
    aiContainer.innerHTML = `<i><p>Drafting your memo, please be patient...<p></i>`;
    const icMemoEndpoint = `/api/ask_ai?address=${encodeURIComponent(address)}&county=${countyData.county_name}&acreage=${acreageInput.value}&totalUnits=${totalUnits}&affordablePct=${affordablePct}&affStudio=${countyData.max_rent_0bd_120ami}&aff1BD=${countyData.max_rent_1bd_120ami}&aff2BD=${countyData.max_rent_2bd_120ami}&aff3BD=${countyData.max_rent_3bd_120ami}&textModifier=${encodeURIComponent(textMod)}`;
    const icMemoResponse = await fetch(icMemoEndpoint);
    const icMemo = await icMemoResponse.text();
    console.log("IC Memo Received:", icMemo);
    aiContainer.innerHTML = icMemo;
}

// Fetch tallest building within a 1-mile radius of the address
async function fetchTallestBuilding(lat, lng) {
    try {
        const response = await fetch(`https://www.oyoops.com/api/building_height?lat=${lat}&lng=${lng}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching tallest building within radius:', error);
        return null;
    }
}

// Initialize the google map
async function initializeMap(lat, lng) {
    console.log('Initializing map with lat:', lat, ', lng:', lng);
    const mapOptions = {
        center: { lat: lat, lng: lng },
        zoom: 17,
        mapTypeId: google.maps.MapTypeId.SATELLITE
    };

    const map = new google.maps.Map(document.getElementById('map'), mapOptions);
    console.log('Map initialized.');

    // Add a marker at the user's input location
    const userMarker = new google.maps.Marker({
        position: { lat: lat, lng: lng },
        map: map
    });

    const userInfowindow = new google.maps.InfoWindow({
        content: `<div style="text-align:center;"><strong>You</strong></div>`
        //content: `<div style="text-align:center;"><strong>${address}</strong></div>`
    });

    userMarker.addListener('click', function() {
        userInfowindow.open(map, userMarker);
    });

    // Fetch and add a marker for the tallest building within a 1-mile radius
    const tallestBuildingData = await fetchTallestBuilding(lat, lng);
    if (tallestBuildingData && tallestBuildingData.tags) {
        const buildingLat = parseFloat(tallestBuildingData.lat);
        const buildingLng = parseFloat(tallestBuildingData.lon);
        const buildingHeight = tallestBuildingData.tags.height || "Unknown";
        const buildingName = tallestBuildingData.tags.name || "Unknown";
        const buildingAddress = tallestBuildingData.tags['addr:street'] || "Address not available";

        const buildingMarker = new google.maps.Marker({
            position: { lat: buildingLat, lng: buildingLng },
            map: map
        });

        const buildingInfoContent = `
            <div style="text-align:center;">
                <strong>${buildingName}</strong><br>
                Height: ${buildingHeight} m<br>
                Address: ${buildingAddress}
            </div>
        `;

        const buildingInfowindow = new google.maps.InfoWindow({
            content: buildingInfoContent
        });

        buildingMarker.addListener('click', function() {
            buildingInfowindow.open(map, buildingMarker);
        });
    }

    // Show the Google Map element
    document.getElementById('map').style.display = 'block';
}