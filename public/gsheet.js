// gsheet.js - Helper functions for getting prompts from Google Sheets


/*
async function fetchColumnFromPublicSheet(sheetPublicCSVUrl, columnLetter) {
    const response = await fetch(sheetPublicCSVUrl);
    const csvData = await response.text();

    // Parse CSV to extract values from the desired column
    const rows = csvData.split('\n');
    const values = rows.map(row => {
        const columns = row.split(',');
        const columnIndex = columnLetter.charCodeAt(0) - 65; // Convert letter to zero-based index
        return columns[columnIndex];
    });

    return values.join('\n');
}
*/


