// Parcel Physical Characteristics

const axios = require('axios');

module.exports = async (req, res) => {
    const { act_yr_blt, eff_yr_blt, tot_lvg_ar, phy_addr1, phy_addr2, phy_city, phy_zipcd } = req.query;

    const messages = [{
        "role": "system",
        "content": `
        INSTRUCTIONS:
        - Provide actionable insights based on the given data.
        - Format the response as a professional outline using HTML for clarity. Your audience: savvy multifamily apartment complex investors familiar with Florida.
        - Focus on the inferences you can draw. If data is missing, don't lament it; instead, leverage what you have.

        CONTEXT:
        Florida's Live Local Act, effective July 1, 2023, revolutionizes multifamily development by overriding municipal restrictions. Key provisions mandate that cities/counties approve multifamily developments if:
            1. Over 40% of units are 'affordable' (rent thresholds vary by county).
            2. There are a minimum of 70 affordable units.
            3. All non-density/height/zoning/land use municipal regulations are met.
        The Act's transformative benefits include bypassing lengthy public hearings, achieving the highest unit density anywhere within the municipality, and allowing structures to rise as tall as the tallest building within a mile. Furthermore, it offers a 75% property tax abatement on affordable units set at 120% AMI level, equating to a net 30% property tax reduction for the entire development. 

        Describe the parcel's physical attributes. Given its age, size, and other provided details:
        1. Evaluate its condition and wear and tear.
        2. Based on its age and location, infer its potential historical significance, if any.
        3. If the data hints at it, speculate on the current usage of the property (e.g., commercial establishment, residential home, vacant lot).
        4. Suggest potential challenges and opportunities associated with redeveloping the parcel into a large apartment complex.
        5. Provide insights into the local environment around the property, like potential community sentiments towards development or local infrastructure benefits.
        `
    }, {
        "role": "user",
        "content": `The structure(s) at ${phy_addr1}, ${phy_addr2}, ${phy_city} built in ${act_yr_blt}, has ${tot_lvg_ar} SF/AC.
        What insights can you provide about this parcel's physical characteristics and its surrounding context?`
    }];

    try {
        // Send fetch request from server to OpenAI API
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: process.env.AI_MODEL_PRIMARY_ANALYSES,
            messages: messages,
            max_tokens: parseInt(process.env.AI_MAX_TOKENS_PRIMARY_ANALYSES, 10),
            temperature: 0.6,
            presence_penalty: 0.1,
            frequency_penalty: 0.1
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });
        const responseData = response.data;
        console.log("[B] AI response received!\n");

        // Log token usage
        const tokensUsed = responseData?.usage?.total_tokens;
        const promptTokens = responseData?.usage?.prompt_tokens;
        const completionTokens = responseData?.usage?.completion_tokens;
        if (tokensUsed) {
            console.log("    # Total Tkns. =", tokensUsed);
        }
        if (promptTokens) {
            console.log("   # Prompt Tkns. =", promptTokens);
        }
        if (completionTokens) {
            console.log("    # Resp. Tkns. =", completionTokens);
        }

        // Log the prompt
        const aiPromptSystem = messages[0]?.content.trim(); //// responseData?.choices[0]?.message?.role === 'system' ? responseData?.choices[0]?.message?.content : null;
        const aiPromptUser = messages[1]?.content.trim(); //// responseData?.choices[0]?.message?.role === 'user' ? responseData?.choices[0]?.message?.content : null;
        if (aiPromptSystem) {
            console.log("\n[SYSTEM Prompt]\n" + aiPromptSystem);
        }
        if (aiPromptUser) {
            console.log("\n[USER Prompt]\n" + aiPromptUser);
        }

        // Log the response
        const aiResponseText = responseData?.choices[0]?.message?.content.trim();
        if (aiResponseText) {
            console.log("\n[AI Response]\n" + aiResponseText);
        }
        
        // Send AI response to client
        res.status(200).json(aiResponseText);
    
    } catch (error) {
        // Log the actual OpenAI error message
        const errorMessage = error?.data?.error || "[CRITICAL ERROR] Unknown error while fetching the AI response.";
        console.error("Error from OpenAI:", errorMessage);
        res.status(500).send(errorMessage);
    }
};