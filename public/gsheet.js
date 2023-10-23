// gsheet.js - Helper functions for getting prompts from Google Sheets

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

async function generateRefinedSummary(sheetPublicCSVUrl, columnLetter, parcelData) {
    const combinedResponses = await fetchColumnFromPublicSheet(sheetPublicCSVUrl, columnLetter);

    // Construct a prompt for the AI to refine the combined responses
    const prompt = `
        Given the detailed information below, provide a concise and well-formatted HTML summary:
        "${combinedResponses}"
    `;
    
    // Attach this prompt to parcelData and call fetchAiEnhancements
    parcelData.prompt = prompt;
    const refinedSummaryResponses = await fetchAiEnhancements(parcelData);
    // Assuming the AI responses are in a plain text format, join them together for a refined summary
    const refinedSummary = refinedSummaryResponses.join(' ');

    return refinedSummary;
}
