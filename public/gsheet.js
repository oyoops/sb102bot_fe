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
        CONTEXT:
            Florida's Live Local Act, effective July 1, 2023, revolutionizes multifamily development by overriding municipal restrictions. Key provisions mandate that cities/counties approve multifamily developments if:
                1. Over 40% of units are 'affordable' (rent thresholds vary by county).
                2. There are a minimum of 70 affordable units.
                3. All non-density/height/zoning/land use municipal regulations are met.
            The Act's transformative benefits include bypassing lengthy public hearings, achieving the highest unit density anywhere within the municipality, and allowing structures to rise as tall as the tallest building within a mile. Furthermore, it offers a 75% property tax abatement on affordable units set at 120% AMI level, equating to a net 30% property tax reduction for the entire development. 

        BACKGROUND:
            I use a set of related but specialized AI prompts plus supplemental data about a parcel to generate insights.
            My AI writing and parcel data are imperfect. YOU are the editor - the last line of defense between me sending out poor, unprofessional content to my highly-criticaL audience.
            
            Prompt instruction summaries:
            - 1A. [Based on the limited available info,] make inferences about the property owner; suggest a negotiation strategy to the buy land; recommend an appealing deal structure 
            - 1B. ", make inferences about the property's physical characteristics including existing structures (if any)
            - 1C. ", make inferences about its different taxable valuations; discuss the land value vs. building value
            - 1D. ", make inferences about sale(s) of the property during the last two years (if any)
            - 1E. ", make inferences about the city, county, neighborhood, and immediate surroundings of the property 
            
            The five AI responses were then combined in order; as a result, it's now long, boring, and repetitive (provided below).
        
        RULES:
            - Remove ALL references to data that is missing, unavailable, or incomplete.
            - Remove ALL non-sensical, irrelevant, and low-info sentences.

        MAIN TASK:
            - Provide a concise and well-formatted HTML summary:

        "${combinedResponses}"
    `;
    
    // Attach this prompt to parcelData and call fetchAiEnhancements
    parcelData.prompt = prompt;
    const refinedSummaryResponses = await fetchAiResponsesCombined(parcelData); // <<<<<<<<<<<<<<<<<<<<<<<<------------------------------------------
    // Assuming the AI responses are in a plain text format, join them together for a refined summary
    const refinedSummary = refinedSummaryResponses.join(' ');

    return refinedSummary;
}
