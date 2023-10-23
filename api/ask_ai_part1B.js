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
        "content": `The parcel located at ${phy_addr1}, ${phy_addr2}, ${phy_city}, built in ${act_yr_blt} has an effective year of ${eff_yr_blt}. It spans a total living area of ${tot_lvg_ar} sq. ft. What insights can you provide about this parcel's physical characteristics and its surrounding context?`
    }];

    try {
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

        // Log prompt and response
        const aiPromptSystem = response?.choices[0]?.message?.role === 'system' ? response?.choices[0]?.message?.content : null;
        const aiPromptUser = response?.choices[0]?.message?.role === 'user' ? response?.choices[0]?.message?.content : null;
        const aiResponseText = response?.choices[1]?.message?.content;
        if (aiPromptSystem) {
            console.log("System Prompt: ", aiPromptUser);
        }
        if (aiPromptUser) {
            console.log("User Prompt:   ", aiPromptUser);
        }
        if (aiResponseText) {
            console.log("AI Response:   ", aiResponseText);
        }

        // Log # tokens used
        const tokensUsed = response?.usage?.total_tokens;
        const promptTokens = response?.usage?.prompt_tokens;
        const completionTokens = response?.usage?.completion_tokens;
        if (tokensUsed) {
            console.log("# tokens / Total:    ", tokensUsed);
        }
        if (promptTokens) {
            console.log("# tokens / Prompt:   ", promptTokens);
        }
        if (completionTokens) {
            console.log("# tokens / Response: ", completionTokens);
        }

        // Send AI response to client
        const enhancedData = response.data.choices[0].message.content.trim();
        res.status(200).json(enhancedData);
    } catch (error) {
        // Extract the specific error message and log it
        const errorMessage = error?.data?.error?.message || "Unknown OpenAI API error occurred";
        console.error("Error from OpenAI:", errorMessage);
        res.status(500).send(errorMessage); // Send the specific error message as the response
    }
};
