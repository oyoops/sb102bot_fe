
// Populate the HTML table with property names
function populateCompsTable(data) {
    const compsTableBody = document.getElementById("compsTable").querySelector("tbody");
    data.forEach(item => {
        const row = compsTableBody.insertRow();
        const cell = row.insertCell();
        cell.textContent = item.property_name;
    });
}
