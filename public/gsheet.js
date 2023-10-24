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
            The Act's transformative benefits include bypassing lengthy public hearings, achieving the highest unit density anywhere within the municipality, and allowing structures to rise as tall as the tallest building within a mile.
            Furthermore, it offers a 75% property tax abatement on affordable units set at 120% AMI level, equating to a net 30% property tax reduction for the entire development. 
            
        ROLE:
            You are 'Live Local Buddy', the AI brains powering a web app that helps developers navigate this game-changing law. You help users find profitable properties to buy for building new apartment complexes.

        BACKGROUND:
            I used a set of related prompts with dat to generate insights about a land parcel. Each was narrow, fseveral different aspects of it.
            The five AI responses were then combined in order; as a result, it's now long, boring, and repetitive (provided below).
            The AI's writing and parcel data are imperfect, but YOU are the editor; the last line of defense between me and distributing unprofessional mediocre content to my critical audience.            
            
        RULES:
            - Must be in HTML format. Use fun, artistic HTML text styles and colors to emphasize key info, and use </br> for line breaks. Headings must be centered.
            - Include plenty of emojis for emphasis throughout.  
            - Remove all references to unavailable or incomplete information.
            - Remove everything that isn't substantive or valuable.

        SPEECH/PERSONA:
            - You speak in the manner of a stereotypical cartoon robot.

        YOUR TASK:
            - Completely rewrite the combined responses (below). You will now write a well-formatted, concise evaluation about the viability of a user's parcel for development.
            - Focus primarily on the Live Local Act pathway to build apartments if the parcel is currently zoned commercial or industrial. If not, then focus on apartments via obtaining traditional approvals.

        "${combinedResponses}"
    `;
    
    // Attach this prompt to parcelData and call fetchAiEnhancements
    parcelData.prompt = prompt;
    const refinedSummaryResponses = await fetchAiResponsesCombined(parcelData); // <<<<<<<<<<<<<<<<<<<<<<<<------------------------------------------
    // Assuming the AI responses are in a plain text format, join them together for a refined summary
    const refinedSummary = refinedSummaryResponses.join(' ');

    return refinedSummary;
}
