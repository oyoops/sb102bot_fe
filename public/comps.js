// comps.js -  Functions related to managing and displaying comps data


/* FUNCTIONS: */

async function runCompsModule(latitude, longitude, radius="3.000") {
    // Search Parameters:
    const SEARCH_RESULTS_COMPS_LIMIT = 10;
    const searchLat = latitude.toFixed(6);
    const searchLng = longitude.toFixed(6);
    const searchRadius = radius;

    // Pull data from endpoint
    try {
        // Compose URL
        const endpointUrl = "https://www.livelocal.guru/api/get_comps?lat=" + searchLat + "&lng=" + searchLng + "&radius=" + searchRadius + "&limit=" + searchRadius;
    
        // Pull comps data
        const response = await fetch(endpointUrl);
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        compsData = await response.json(); //// (set global = whole object)
    } catch(error) {
        alert("Error: Failed to pull comps from the server! \nThat's a pretty big 'OOPSIE'!")
        console.error("Error while pulling comps from the server: \n", error);
    }

    // Decompose compsData into its constituent parts (.percentages, .averages, etc.)
    try {
        // get full data set
        const compsDataFull = compsData.data;        
        // get weighted averages set
        const compsAvgs = compsData.averages;
        // extract all weighted avgs
        const compsUnitMixPct = compsData.percentages; // example structure: {"studio":"4.99","oneBd":"45.01","twoBd":"40.01","threeBd":"9.99"} (notice, not like percentages)
        const compsRents = compsData.averages.rents; // example structure: {"studio":2193,"oneBd":2379,"twoBd":3141,"threeBd":4007}
        const compsSqFts = compsData.averages.sqfts; // example structure: {"studio":550,"oneBd":775,"twoBd":1050,"threeBd":1300}
        const compsRentPerSqfts = compsData.averages.rentPerSqfts; // example structure: {"studio":3.75,"oneBd":3.50,"twoBd":3.21,"threeBd":3.33}
        // log all weighted avgs
        console.log("Market % Unit Mix: \n" + JSON.stringify(compsUnitMixPct));
        console.log("Market Rents: \n" + JSON.stringify(compsRents));
        console.log("Market Avg Sq Ft: \n" + JSON.stringify(compsSqFts));
        console.log("Market Rents/Sq Ft: \n" + JSON.stringify(compsRentPerSqfts));
    } catch (error) {
        alert("Error: Failed while trying to get weighted averages from the comp set. \nWhoops!")
        console.error("Error while trying to get weighted averages from the comp set: \n", error);        
    }
        
    // Create and display market comps table
    try {
        displayCompsTable(compsData);
    } catch (error) {
        alert("Error: Failed to get/display the comp set's weighted averages. \nWhoops!")
        console.error("Error while getting comp weighted avgs: \n", error);
    }

    // Add comp placemarks to the map
    try {
        addCompsMarkersToMap(compsDataFull);
    } catch (error) {
        alert("Error: Failed to add comp placemarks to the map. \nWhoops!")
        console.error("Error while adding comp placemarks to map: \n", error);
    }

    // Done
    console.log("Comps module complete.");
    return {compsUnitMixPct, compsRents, compsSqFts, compsRentPerSqfts};
}


// Create and show the comps table
function displayCompsTable(compsData) {
    // Generate and show comps table
    const tableHTML = generateMarketRentsTableHTML(compsData);
    document.getElementById('averagesTableContainer').innerHTML = tableHTML;
    document.getElementById('averagesTableContainer').style.display = 'block';
}


// Generate raw table HTML from comps data
function generateMarketRentsTableHTML(compsData) {
    const averages = compsData.averages;
    const percentages = compsData.percentages;
    const names = compsData.names;

    const types = [
        { key: 'studio', display: 'Studio' },
        { key: 'oneBd', display: '1 Bed' },
        { key: 'twoBd', display: '2 Bed' },
        { key: 'threeBd', display: '3 Bed' },
    ];

    let tableHTML = `
        <div class="table-container">
            <table border="1">
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Mix</th>
                        <th>Sq. Ft.</th>
                        <th>Eff. Rent</th>
                        <th>Eff. Rent/Sq. Ft.</th>
                    </tr>
                </thead>
                <tbody>
    `;

    let weightedRentSum = 0;
    let weightedSqftSum = 0;
    let weightedRentPerSqftSum = 0;
    let percentageSum = 0;

    types.forEach(type => {
        const rent = averages.rents[type.key];
        const sqft = averages.sqfts[type.key];
        const rentPerSqft = averages.rentPerSqfts[type.key];
        const weight = parseFloat(percentages[type.key] || '0');

        // Accumulate the weighted sums
        weightedRentSum += rent * weight;
        weightedSqftSum += sqft * weight;
        weightedRentPerSqftSum += rentPerSqft * weight;
        percentageSum += weight;

        tableHTML += `
                <tr>
                    <td>${type.display}</td>
                    <td>${weight.toFixed(0)}%</td>
                    <td>${sqft.toFixed(0)} sf</td>
                    <td>$${rent.toFixed(0)}</td>
                    <td>$${rentPerSqft.toFixed(2)}/sf</td>
                </tr>
        `;
    });

    // Calculate the weighted averages
    const averageWeightedRent = (weightedRentSum / 100).toFixed(0);
    const averageWeightedSqft = (weightedSqftSum / 100).toFixed(0);
    const averageWeightedRentPerSqft = (weightedRentPerSqftSum / 100).toFixed(2);

    // Append the weighted average row
    tableHTML += `
            <tr>
                <td><strong>Average</strong></td>
                <td><strong>${percentageSum.toFixed(0)}%</strong></td>
                <td><strong>${averageWeightedSqft} sf</strong></td>
                <td><strong>$${averageWeightedRent}</strong></td>
                <td><strong>$${averageWeightedRentPerSqft}/sf</strong></td>
            </tr>
    `;

    tableHTML += `
                </tbody>
            </table>
        </div>
    `;

    return tableHTML;
}


