
// Populate the Comps table
function populateCompsTable(data) {
    const compsTableBody = document.getElementById("compsTable").querySelector("tbody");
    data.forEach(item => {
    
        const row = compsTableBody.insertRow();
        const cell = row.insertCell();

        cell.textContent = item.property_name; // Property Name
    
    });
}

// Fetch the data and populate the table (this is an example)
function displayAverages(compsAvgs, compsWeightedPercentages) {
    const tableHTML = generateAveragesTable(compsAvgs, compsWeightedPercentages);
    document.getElementById('averagesTableContainer').innerHTML = tableHTML;
    document.getElementById('averagesTableContainer').style.display = 'block';
}

function generateAveragesTable(averages, percentages) {
    console.log(averages);
    console.log(percentages);

    const types = [
        { key: 'studio', display: 'Studio' },
        { key: 'oneBd', display: '1 Bed' },
        { key: 'twoBd', display: '2 Bed' },
        { key: 'threeBd', display: '3 Bed' },
    ];

    let tableHTML = `
        <table border="1">
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Average Rent ($)</th>
                    <th>Average Sqft</th>
                    <th>Average Rent per Sqft ($)</th>
                    <th>Weighted Percentage (%)</th> <!-- Added this new header -->
                </tr>
            </thead>
            <tbody>
    `;

    types.forEach(type => {
        tableHTML += `
            <tr>
                <td>${type.display}</td>
                <td>${averages.rents[type.key]}</td>
                <td>${averages.sqfts[type.key]}</td>
                <td>${averages.rentPerSqfts[type.key]}</td>
                <td>${percentages[type.key]}%</td> <!-- Added this new column to display the percentage -->
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    return tableHTML;
}


