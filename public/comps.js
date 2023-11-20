// comps.js -  Functions related to managing and displaying comps data


// Comps module main entry point
async function runCompsModule(latitude, longitude, radius=COMPS_SEARCH_RADIUS_MILES, compsLimit=COMPS_SEARCH_RESULTS_LIMIT) {
    // Comps search parameters:
    const searchLat = latitude.toFixed(6);
    const searchLng = longitude.toFixed(6);
    const searchRadius = radius; // global default = 3.000 miles
    const searchResultsLimit = compsLimit; // global default = 10 comps
    
    // Query the comps endpoint
    try {
        const endpointUrl = "/api/get_comps?lat=" + searchLat + "&lng=" + searchLng + "&radius=" + searchRadius + "&limit=" + searchResultsLimit;    
        const response = await fetch(endpointUrl);
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        compsData = await response.json(); // Set global
    } catch(error) {
        alert("Error: Failed to pull comps from the server! \nThat's a pretty big 'OOPSIE'!")
        console.error("Error while pulling comps from the server: \n", error);
    }

    // Decompose compsData object
    try {
        // Full data set
        const compsDataFull = compsData.data;
        // Extract WAvg sets
        const compsAvgs = compsData.averages;
        // Extract each WAvg set
        const compsUnitMixPct = compsData.percentages;
        const compsRents = compsAvgs.rents;
        const compsSqFts = compsAvgs.sqfts;
        const compsRentPerSqfts = compsAvgs.rentPerSqfts;
        /*  EXAMPLE WAVG SETS:
                compsUnitMixPct     {"studio":"4.99","oneBd":"45.01","twoBd":"40.01","threeBd":"9.99"} (notice, not like percentages)
                compsRents          {"studio":2193,"oneBd":2379,"twoBd":3141,"threeBd":4007}
                compsSqFts          {"studio":550,"oneBd":775,"twoBd":1050,"threeBd":1300}
                compsRentPerSqfts   {"studio":3.75,"oneBd":3.50,"twoBd":3.21,"threeBd":3.33} */
        
        // Generate and show the market comps table
        try {
            displayCompsTable(compsData);
        } catch (error) {
            alert("Error: Failed to get/display the comp set's weighted averages. \nWhoops!")
            console.error("Error while getting comp weighted avgs: \n", error);
        }

        // Add comp placemarks to the map
        try {
            addCompsMarkersToMap(compsDataFull, map);
        } catch (error) {
            alert("Error: Failed to add comp placemarks to the map. \nWhoops!")
            console.error("Error while adding comp placemarks to map: \n", error);
        }

        return {compsUnitMixPct, compsRents, compsSqFts, compsRentPerSqfts};
        /*  Return one object containing all comps data:
                (1) Full data set (every comp, every column)
                (2) WAvg rent, SF, and rent/SF
                (3) WAvg % mix */

    } catch (error) {
        alert("Error: Failed while trying to process the comp set. \nWhoops!")
        console.error("Error while trying to process the comp set: \n", error);        
    }
}

// Create and show the market comps table
function displayCompsTable(compsData) {
    // Generate table
    const tableHTML = generateMarketRentsTableHTML(compsData);
    // Show table
    document.getElementById('averagesTableContainer').innerHTML = tableHTML;
    document.getElementById('averagesTableContainer').style.display = 'block';
}

// Generate Table #1 HTML from comps data
function generateMarketRentsTableHTML(compsData) {
    const averages = compsData.averages;
    const percentages = compsData.percentages;
    const names = compsData.names;

    const types = [
        { key: 'studio', display: 'Studio' },
        { key: 'oneBd', display: '1 BD' },
        { key: 'twoBd', display: '2 BD' },
        { key: 'threeBd', display: '3 BD' },
    ];

    let tableHTML = `
        <div class="table-container">
            <table border="1">
                <thead>
                    <tr>
                        <th></th>
                        <th>Unit Mix</th>
                        <th>Sq. Ft. (Avg.)</th>
                        <th>Market Rent</th>
                        <th>Market Rent/Sq. Ft.</th>
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
                <td><strong>Avgs.</strong></td>
                <td><strong>${percentageSum.toFixed(0)}%</strong></td>
                <td><strong>${averageWeightedSqft} sq. ft.</strong></td>
                <td><strong>$${averageWeightedRent}</strong></td>
                <td><strong>$${averageWeightedRentPerSqft}/sq. ft.</strong></td>
            </tr>
    `;

    tableHTML += `
                </tbody>
            </table>
        </div>
    `;

    return tableHTML;
}

// Generate table HTML for Table #2 (Comp avg. rents vs. affordable max. rents by unit type)
function generateAffordableTableHTML(countyData, compsData) {
    // Mapping of market & affordable units (for the market/affordable rents comparison table)
    const unitTypes = [
        { key: '0bd', display: 'Studio', marketKey: 'studio' },
        { key: '1bd', display: '1 BD', marketKey: 'oneBd' },
        { key: '2bd', display: '2 BD', marketKey: 'twoBd' },
        { key: '3bd', display: '3 BD', marketKey: 'threeBd' },
    ];
    let rentRowsHTML = '';
    unitTypes.forEach(type => {
        const maxAffordableRent = parseFloat(countyData[`max_rent_${type.key}_120ami`]).toFixed(0);
        const avgMarketRent = parseFloat(compsData.averages.rents[type.marketKey]).toFixed(0);
        const diffDollar = -(maxAffordableRent - avgMarketRent).toFixed(0);
        const diffPercent = -(((avgMarketRent/maxAffordableRent)-1)*100).toFixed(0);  
        rentRowsHTML += `
            <tr>
                <td>${type.display}</td>
                <td>$${avgMarketRent}</td>
                <td>$${maxAffordableRent}</td>
                <td>-$${diffDollar} (${diffPercent}%)</td>
            </tr>
        `;
    });
    
    return rentRowsHTML;
}
