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
                        <th>% Mix</th>
                        <th>Avg. SF</th>
                        <th>Market Rent</th>
                        <th>Market Rent/SF</th>
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
                    <td>${sqft.toFixed(0)} SF</td>
                    <td>$${rent.toFixed(0)}</td>
                    <td>$${rentPerSqft.toFixed(2)}/SF</td>
                </tr>
        `;

    });
    // Calculate the weighted averages
    const averageWeightedRent = (weightedRentSum / 100).toFixed(0);
    const averageWeightedSqft = (weightedSqftSum / 100).toFixed(0);
    const averageWeightedRentPerSqft = (weightedRentPerSqftSum / 100).toFixed(2);
    
    // Cap percentage sum manually since the rounding handling sucks
    percentageSum = Math.min(percentageSum, 100);

    // Append the weighted average row
    tableHTML += `
            <tr>
                <td><strong>Avgs.</strong></td>
                <td><strong>${percentageSum.toFixed(0)}%</strong></td>
                <td><strong>${averageWeightedSqft} SF</strong></td>
                <td><strong>$${averageWeightedRent}</strong></td>
                <td><strong>$${averageWeightedRentPerSqft}/SF</strong></td>
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

function generateCompsTables(compsData) {
    const container = document.getElementById('rentInfoContainer');
    container.innerHTML = ''; // Clear any existing content

    let tableHTML = '<table id="compsTable"><tr><th>Category</th>';

    // Assuming the dataset is an object where each key is a column
    Object.keys(compsData).forEach(key => {
        tableHTML += `<th>${key}</th>`;
    });

    tableHTML += '</tr>';

    // Define row titles
    const rowTitles = {
        'studio': 'Studio',
        'oneBd': '1BD',
        'twoBd': '2BD',
        'threeBd': '3BD'
    };

    // Calculate weighted averages and sum of percentages
    let sumPercentages = 0;
    let weightedRents = 0;
    let weightedSqFts = 0;
    let totalUnits = 0;

    // Create a row for each key and calculate weighted sums
    Object.keys(compsData.compsUnitMixPct).forEach(key => {
        const percentage = parseFloat(compsData.compsUnitMixPct[key]) / 100;
        const rent = parseFloat(compsData.compsRents[key]);
        const sqFt = parseFloat(compsData.compsSqFts[key]);

        sumPercentages += parseFloat(compsData.compsUnitMixPct[key]);
        weightedRents += rent * percentage;
        weightedSqFts += sqFt * percentage;
        totalUnits += percentage;

        tableHTML += `<tr><td>${rowTitles[key]}</td>`;
        ['compsUnitMixPct', 'compsRents', 'compsSqFts', 'compsRentPerSqfts'].forEach(category => {
            const dataset = compsData[category];
            const isEditable = category !== 'compsRentPerSqfts';
            let formattedValue = dataset[key];
            switch (category) {
                case 'compsUnitMixPct':
                    formattedValue = `${parseInt(formattedValue).toFixed(0)}%`;
                    break;
                case 'compsRents':
                    formattedValue = `$${parseInt(formattedValue).toLocaleString()}`;
                    break;
                case 'compsSqFts':
                    formattedValue = `${parseInt(formattedValue).toLocaleString()} SF`;
                    break;
                case 'compsRentPerSqfts':
                    formattedValue = `$${parseFloat(formattedValue).toFixed(2)}/SF`;
                    break;
            }
            const contentEditable = isEditable ? 'contenteditable' : 'false';
            const editableStyle = isEditable ? 'style="color: blue; background-color: #ffffe0;"' : '';
            // Store the numeric value in a data attribute for calculations and display the formatted value
            const dataValue = isEditable ? `data-value="${dataset[key]}"` : '';
            // Apply formatting immediately for all cells
            const displayValue = formattedValue;
            tableHTML += `<td ${contentEditable} ${editableStyle} ${dataValue} data-category="${category}" data-key="${key}">${displayValue}</td>`;
        });
        tableHTML += '</tr>';
    });

    // Add the averages row
    // Apply bold font and darker background color to the averages row
    const avgRowStyle = 'style="font-weight: bold; background-color: #ddd;"';
    tableHTML += `<tr ${avgRowStyle}><td>Avgs</td>`;
    tableHTML += `<td>${parseInt(sumPercentages).toFixed(0)}%</td>`; // Sum of percentages
    tableHTML += `<td>${parseInt(weightedSqFts / totalUnits).toLocaleString()} SF</td>`; // Weighted average of SqFts
    tableHTML += `<td>$${parseInt(weightedRents / totalUnits).toLocaleString()}</td>`; // Weighted average of Rents
    tableHTML += `<td>$${(weightedRents / weightedSqFts).toFixed(2)}/SF</td>`; // Weighted average of RentPerSqFts
    tableHTML += `</tr>`;

    tableHTML += '</table>';
    container.innerHTML = tableHTML; // Set the innerHTML to the new table

    // Add event listeners for editable cells
    const editableCells = container.querySelectorAll('td[contenteditable]');
    // Update event listeners to handle focus and blur events for formatting
    editableCells.forEach(cell => {
        cell.addEventListener('focus', handleCellFocus); // Add focus event listener
        cell.addEventListener('blur', handleCellBlur); // Change to handleCellBlur
    });

    // Define new functions to handle focus and blur events
    function handleCellFocus(event) {
        const cell = event.target;
        cell.textContent = cell.dataset.value; // Show only the number for editing
    }

    function handleCellBlur(event) {
        const cell = event.target;
        const category = cell.dataset.category;
        const key = cell.dataset.key;
        const newValue = parseFloat(cell.textContent);
        if (!isNaN(newValue)) {
            cell.dataset.value = newValue; // Update the data-value attribute
            // Reapply formatting based on the category
            switch (category) {
                case 'compsUnitMixPct':
                    cell.textContent = `${newValue.toFixed(0)}%`;
                    break;
                case 'compsRents':
                    cell.textContent = `$${newValue.toLocaleString()}`;
                    break;
                case 'compsSqFts':
                    cell.textContent = `${newValue.toLocaleString()} SF`;
                    break;
                case 'compsRentPerSqfts':
                    cell.textContent = `$${newValue.toFixed(2)}/SF`;
                    break;
            }
            // Recalculate weighted averages after updating the value
            recalculateWeightedAverages();
        } else {
            // If the input is not a number, revert to the previous value
            cell.textContent = cell.dataset.value;
        }
    }

    // Update the recalculateWeightedAverages function to recompute the averages
    function recalculateWeightedAverages() {
        let sumPercentages = 0;
        let weightedRents = 0;
        let weightedSqFts = 0;
        let totalUnits = 0;

        // Iterate over each row to calculate the new weighted averages
        Object.keys(compsData.compsUnitMixPct).forEach(key => {
            const percentageCell = document.querySelector(`td[data-category="compsUnitMixPct"][data-key="${key}"]`);
            const rentCell = document.querySelector(`td[data-category="compsRents"][data-key="${key}"]`);
            const sqFtCell = document.querySelector(`td[data-category="compsSqFts"][data-key="${key}"]`);

            const weight = parseFloat(percentageCell.dataset.value) / 100;
            const rent = parseFloat(rentCell.dataset.value);
            const sqFt = parseFloat(sqFtCell.dataset.value);

            sumPercentages += parseFloat(percentageCell.dataset.value);
            weightedRents += rent * weight;
            weightedSqFts += sqFt * weight;
            totalUnits += weight;
        });

        // Calculate the weighted averages
        const averageWeightedRent = (weightedRents / totalUnits).toFixed(0);
        const averageWeightedSqft = (weightedSqFts / totalUnits).toFixed(0);
        const averageWeightedRentPerSqft = (weightedRents / weightedSqFts).toFixed(2);

        // Update the averages row with the new values if elements are found
        const avgRentCell = document.querySelector('tr[style*="font-weight: bold;"] td[data-category="compsRents"]');
        const avgSqFtCell = document.querySelector('tr[style*="font-weight: bold;"] td[data-category="compsSqFts"]');
        const avgRentPerSqFtCell = document.querySelector('tr[style*="font-weight: bold;"] td[data-category="compsRentPerSqfts"]');

        if (avgRentCell) {
            avgRentCell.textContent = `$${parseInt(averageWeightedRent).toLocaleString()}`;
        } else {
            console.error('Error: Average Rent Cell not found');
        }
        if (avgSqFtCell) {
            avgSqFtCell.textContent = `${parseInt(averageWeightedSqft).toLocaleString()} SF`;
        } else {
            console.error('Error: Average SqFt Cell not found');
        }
        if (avgRentPerSqFtCell) {
            avgRentPerSqFtCell.textContent = `$${parseFloat(averageWeightedRentPerSqft).toFixed(2)}/SF`;
        } else {
            console.error('Error: Average Rent Per SqFt Cell not found');
        }
    }
}

// Handle cell edit event
function handleCellEdit(event) {
    const cell = event.target;
    const key = cell.getAttribute('data-key');
    const rentCell = document.querySelector(`td[data-category="compsRents"][data-key="${key}"]`);
    const sqFtCell = document.querySelector(`td[data-category="compsSqFts"][data-key="${key}"]`);
    const rentPerSqFtCell = document.querySelector(`td[data-category="compsRentPerSqfts"][data-key="${key}"]`);

    // Use the numeric values from data attributes for calculations
    const rent = parseFloat(rentCell.dataset.value);
    const sqFt = parseFloat(sqFtCell.dataset.value);

    if (!isNaN(rent) && !isNaN(sqFt) && sqFt !== 0) {
        const rentPerSqFt = (rent / sqFt).toFixed(2); // Ensure two decimal places
        // Update the display formatting and the data-value attribute
        rentPerSqFtCell.innerText = `$${rentPerSqFt}/SF`;
        rentPerSqFtCell.dataset.value = rentPerSqFt;
    } else {
        rentPerSqFtCell.innerText = 'N/A'; // Handle division by zero or invalid input
    }
}
