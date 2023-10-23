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

async function generateRefinedSummary(sheetPublicCSVUrl, columnLetter) {
    const combinedResponses = await fetchColumnFromPublicSheet(sheetPublicCSVUrl, columnLetter);

    // Construct a prompt for the AI to refine the combined responses
    const prompt = `
        Given the detailed information below, provide a concise and well-formatted HTML summary:
        "${combinedResponses}"
    `;

    // Use your AI API call method here. I'm using a placeholder function call as an example.
    const refinedSummaryResponse = await fetchAI(prompt);

    // Check if the AI response is valid
    if (refinedSummaryResponse && refinedSummaryResponse.data) {
        return refinedSummaryResponse.data;
    } else {
        console.error("Failed to generate refined summary");
        return "";
    }
}

// Placeholder function for the AI API call
async function fetchAI(prompt) {
    // Implement the code to call your AI API here
    // For now, I'm returning a mock response as an example
    return {
        data: "<strong>Summary:</strong> Here's a concise and well-formatted summary generated by the AI."
    };
}

// Example usage
// You'd replace 'YOUR_SHEET_ID' with your actual Google Sheet's ID and 'A' with the column letter you're interested in.
generateRefinedSummary('https://docs.google.com/spreadsheets/d/e/2PACX-1vQDEUHmX1uafVBH5AHDDOibri_dnweF-UQ5wJsubhLM7Z4sX5ifOn1pRNvmgbSCL5OMYW-2UVbKTUYc/pubhtml', 'A').then(summary => {
    console.log(summary);
});
