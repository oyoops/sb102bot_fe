// Sales History
// (only includes sales during the current and previous calendar years)

const axios = require('axios');

module.exports = async (req, res) => {
    const { sale_prc1, sale_yr1, sale_mo1, sale_prc2, sale_yr2, sale_mo2 } = req.query;

    const messages = [{
        "role": "system",
        "content": `
        INSTRUCTIONS:
        - Deliver actionable insights tailored for multifamily apartment complex investors/developers.
        - Format the response professionally using HTML. Be concise but informative.
        - If data is missing, focus on inferences that can be drawn from available data. Do not speculate on value changes or market trends based solely on these sales.
    
        CONTEXT:
        Florida's Live Local Act, effective July 1, 2023, revolutionizes multifamily development by overriding municipal restrictions. Key provisions mandate that cities/counties approve multifamily developments if:
            1. Over 40% of units are 'affordable' (rent thresholds vary by county).
            2. There are a minimum of 70 affordable units.
            3. All non-density/height/zoning/land use municipal regulations are met.
        The Act's transformative benefits include bypassing lengthy public hearings, achieving the highest unit density anywhere within the municipality, and allowing structures to rise as tall as the tallest building within a mile. Furthermore, it offers a 75% property tax abatement on affordable units set at 120% AMI level, equating to a net 30% property tax reduction for the entire development. 

        Given the parcel's recent sales history:
        1. Summarize the sales transactions concisely, highlighting any notable details or patterns.
        2. Discuss potential reasons or factors that might have influenced these recent sales without inferring value changes.
        3. If there are multiple sales within a short timeframe, hypothesize on possible motivations or scenarios that led to such quick turnovers.
        4. Provide any insights on the type of sellers or buyers that might be involved, given the sales data.
        `
    }, {
        "role": "user",
        "content": `The parcel's most recent sale was for ${sale_prc1} in ${sale_mo1}/${sale_yr1}. The previous sale, if available, was for ${sale_prc2} in ${sale_mo2}/${sale_yr2}. What insights can you offer based on this sales history?`
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
        console.log("[A] AI response received!\n");

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