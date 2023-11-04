// comps.js -  Functions related to managing and displaying comps data


/* FUNCTIONS: */

// Create the comps table and show it
function displayCompsTable(compsData) {
    // Generate and show comps table
    const tableHTML = generateMarketRentsTableHTML(compsData);
    document.getElementById('averagesTableContainer').innerHTML = tableHTML;
    document.getElementById('averagesTableContainer').style.display = 'block';
}

// (helper) Generates raw table HTML from comps data
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


/*   :-D   */


/* // (UNUSED) Populate the old comps table [deprecated]
function populateCompsTable(data) {
    const compsTableBody = document.getElementById("compsTable").querySelector("tbody");
    data.forEach(item => {
    
        const row = compsTableBody.insertRow();
        const cell = row.insertCell();

        cell.textContent = item.property_name; // Property Name
    
    });
}*/

