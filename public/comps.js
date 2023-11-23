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
                        <th>Rent</th>
                        <th>Rent/SF</th>
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


// (Column titles) Map cleaner column titles to data keys
const columnNameToDataKeyMap = {
    'Mix %': 'compsUnitMixPct',
    'Rent': 'compsRents',
    'Avg. SF': 'compsSqFts',
    'Rent/SF': 'compsRentPerSqfts'
};

/* NOTE THE MAPPING IS REVERSED 
   COMPARED TO columnNameToDataKeyMap
   WHICH WAS VERY STUPID OF ME... */

// (Row titles) Map data keys to cleaner row titles
const rowTitlesFromDataKeyMap = {
    'studio': 'Studio',
    'oneBd': '1BD',
    'twoBd': '2BD',
    'threeBd': '3BD'
};


function generateCompsTables(compsData) {
    const container = document.getElementById('devProgramTable');
    container.innerHTML = ''; // Clear any existing content

    // Calculate the number of columns (N)
    const numColumns = Object.keys(columnNameToDataKeyMap).length + 1; // +1 for the row title column

    // Start generating the table HTML
    let tableHTML = `<table id="compsTable" style="width: 100%;"><tr><th style="width: ${100 / numColumns}%;"> </th>`;
    // Generate each row
    Object.keys(columnNameToDataKeyMap).forEach(key => {
        const columnHeader = getColumnHeaderFromKey(key);
        tableHTML += `<th style="width: ${100 / numColumns}%;">${columnHeader}</th>`;
    });

    /*
    Object.keys(compsData).forEach(key => {
        const columnHeader = getColumnHeaderFromKey(key);
        tableHTML += `<th>${columnHeader}</th>`;
    });
    */

    tableHTML += '</tr>';

    // Calculate weighted averages and sum of percentages
    let sumPercentages = 0;
    let weightedRents = 0;
    let weightedSqFts = 0;
    let totalUnits = 0;

    // Create a row for each key and calculate weighted sums
    Object.keys(compsData.compsUnitMixPct).forEach(key => {
        const percentage = parseFloat(compsData.compsUnitMixPct[key]) / 100;
        let rent = 0, sqFt = 0;
    
        if (compsData.compsRents && compsData.compsRents.hasOwnProperty(key)) {
            rent = parseFloat(compsData.compsRents[key]);
        } else {
            console.log("compsData.compsRents value: \n" + compsData.compsRents);
        }

        if (compsData.compsSqFts && compsData.compsSqFts.hasOwnProperty(key)) {
            sqFt = parseFloat(compsData.compsSqFts[key]);
        } else {
            console.log("compsData.compsSqFts value: \n" + compsData.compsSqFts);
        }
        
        sumPercentages += parseFloat(compsData.compsUnitMixPct[key]);
        weightedRents += rent * percentage;
        weightedSqFts += sqFt * percentage;
        totalUnits += percentage;

        tableHTML += `<tr><td>${rowTitlesFromDataKeyMap[key]}</td>`;

        Object.entries(columnNameToDataKeyMap).forEach(([columnName, dataKey]) => {
            const dataset = compsData[dataKey];
            const category = columnName;
            /*
            // Logging to diagnose the issue
            console.log(`Category: ${category}, DataKey: ${dataKey}, Dataset:`, dataset);
            if (!dataset) {
                console.error(`Dataset for ${category} (${dataKey}) is undefined.`);
                return; // Skip to next iteration
            }
            if (!dataset.hasOwnProperty(key)) {
                console.error(`Key '${key}' not found in dataset for ${category} (${dataKey}).`);
                return; // Skip to next iteration
            }*/
            const isEditable = category !== 'Rent/SF';
            let formattedValue = dataset[key];

            switch (category) {
                case 'Mix %':
                    formattedValue = `${parseInt(formattedValue).toFixed(1)}%`;
                    break;
                case 'Rent':
                    formattedValue = `$${parseInt(formattedValue).toLocaleString()}`;
                    break;
                case 'Avg. SF':
                    formattedValue = `${parseInt(formattedValue).toLocaleString()} SF`;
                    break;
                case 'Rent/SF':
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

    // Add the averages row w/ bold font and darker background color
    const avgRowStyle = 'style="font-weight: bold; background-color: #ddd;"';
    tableHTML += `<tr class="averages" ${avgRowStyle}><td>Avgs</td>`;
    tableHTML += `<td class="avgPercentage">${parseInt(sumPercentages).toFixed(1)}%</td>`; // Sum of percentages
    tableHTML += `<td class="avgRent">$${parseInt(weightedRents / totalUnits).toLocaleString()}</td>`; // Weighted average of Rents
    tableHTML += `<td class="avgSqFt">${parseInt(weightedSqFts / totalUnits).toLocaleString()} SF</td>`; // Weighted average of SqFts
    tableHTML += `<td class="avgRentPerSqFt">$${(weightedRents / weightedSqFts).toFixed(2)}/SF</td>`; // Weighted average of RentPerSqFts
    tableHTML += `</tr>`;

    tableHTML += '</table>';
    container.innerHTML = tableHTML; // Set the innerHTML to the new table

    // Add event listeners for editable cells and handle focus and blur events for formatting
    container.querySelectorAll('td[contenteditable]').forEach(cell => {
        cell.addEventListener('focus', event => {
            // Show only the number for editing
            event.target.textContent = event.target.dataset.value;
        });
        cell.addEventListener('keypress', event => {
            handleCellEditKeypress(event);
        });
        cell.addEventListener('blur', event => {
            const cell = event.target;
            const category = cell.dataset.category; // Get the category from the cell's data attribute
            const newValue = parseFloat(cell.textContent.replace(/[^0-9.-]+/g, ""));
        
            if (!isNaN(newValue) && newValue >= 0) {
                cell.dataset.value = newValue; // Update the data-value attribute
                // Reapply formatting based on the category
                switch (category) {
                    case 'Mix %':
                        cell.textContent = `${newValue.toFixed(1)}%`;
                        break;
                    case 'Rent':
                        cell.textContent = `$${newValue.toLocaleString()}`;
                        break;
                    case 'Avg. SF':
                        cell.textContent = `${newValue.toLocaleString()} SF`;
                        break;
                    case 'Rent/SF':
                        cell.textContent = `$${newValue.toFixed(2)}/SF`;
                        break;
                }

                // Initial computation of the averages(/total) row
                recalculateWeightedAverages();
            } else {
                // If the input is not a number or is negative, revert to the previous value
                cell.textContent = cell.dataset.value;
                alert('Please enter a positive number.');
            }
        });
    });
    
    // Update the recalculateWeightedAverages function to recompute the averages
    function recalculateWeightedAverages() {
        let sumPercentages = 0;
        let weightedRents = 0;
        let weightedSqFts = 0;
        let totalUnits = 0;

        // Iterate over each row to calculate the new weighted averages
        Object.keys(compsData.compsUnitMixPct).forEach(key => {
            const percentageCell = document.querySelector(`td[data-category="Mix %"][data-key="${key}"]`);
            const rentCell = document.querySelector(`td[data-category="Rent"][data-key="${key}"]`);
            const sqFtCell = document.querySelector(`td[data-category="Avg. SF"][data-key="${key}"]`);
            const rentPerSqFtCell = document.querySelector(`td[data-category="Rent/SF"][data-key="${key}"]`);

            const weight = parseFloat(percentageCell.dataset.value) / 100;
            const rent = parseFloat(rentCell.dataset.value);
            const sqFt = parseFloat(sqFtCell.dataset.value);

            // Calculate the rent per square foot for the current row
            const rentPerSqFt = sqFt !== 0 ? (rent / sqFt).toFixed(2) : 'N/A';
            // Update the rent per square foot cell
            rentPerSqFtCell.textContent = sqFt !== 0 ? `$${rentPerSqFt}/SF` : rentPerSqFt;
            rentPerSqFtCell.dataset.value = rentPerSqFt;

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
        const avgRentCell = document.querySelector('.avgRent');
        const avgSqFtCell = document.querySelector('.avgSqFt');
        const avgRentPerSqFtCell = document.querySelector('.avgRentPerSqFt');
        const avgPercentageCell = document.querySelector('.avgPercentage'); // Get the average percentage cell

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

        // Check if the sum of percentages equals 100
        if (sumPercentages.toFixed(0) !== '100') {
            // If not, change the background color of the average percentage cell to light red
            ////avgPercentageCell.style.backgroundColor = 'lightcoral';
            avgPercentageCell.classList.add('redFill');
        } else {
            // If it does, reset the background color
            ////avgPercentageCell.style.backgroundColor = '';
            avgPercentageCell.classList.remove('redFill');
        }
    }

    recalculateWeightedAverages();
}


// Define the column names
function getColumnHeaderFromKey(key) {
    switch (key) {
        case 'compsUnitMixPct':
            return 'Mix %';
        case 'compsRents':
            return 'Rent';
        case 'compsSqFts':
            return 'Avg. SF';
        case 'compsRentPerSqfts':
            return 'Rent/SF';
        default:
            return key; // Fallback in case of an unexpected key
    }
}

/*
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
*/

function handleCellEditKeypress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const cell = event.target;
        cell.blur();
        const nextRow = cell.parentElement.nextElementSibling;
        if (nextRow) {
            const nextCell = nextRow.querySelector(`td[data-category="${cell.dataset.category}"]`);
            if (nextCell) {
                nextCell.focus();
            }
        }
    }
}
