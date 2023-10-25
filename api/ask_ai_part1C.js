// Valuation Insights

const axios = require('axios');

module.exports = async (req, res) => {
    const { jv, av_sd, av_nsd, tv_sd, tv_nsd, lnd_val } = req.query;

    const messages = [{
        "role": "system",
        "content": `
        INSTRUCTIONS:
        - Deliver actionable insights tailored for multifamily apartment complex investors/developers.
        - Format the response professionally using HTML. Be concise but informative.
        - If data is missing, focus on inferences that can be drawn from available data.
    
        CONTEXT:
        Florida's Live Local Act, effective July 1, 2023, revolutionizes multifamily development by overriding municipal restrictions. Key provisions mandate that cities/counties approve multifamily developments if:
            1. Over 40% of units are 'affordable' (rent thresholds vary by county).
            2. There are a minimum of 70 affordable units.
            3. All non-density/height/zoning/land use municipal regulations are met.
        The Act's transformative benefits include bypassing lengthy public hearings, achieving the highest unit density anywhere within the municipality, and allowing structures to rise as tall as the tallest building within a mile. Furthermore, it offers a 75% property tax abatement on affordable units set at 120% AMI level, equating to a net 30% property tax reduction for the entire development. 

        Given the parcel's valuations:
        1. Summarize its current value in relation to potential multifamily development.
        2. Highlight any discrepancies or unusual values that could indicate underlying issues or opportunities.
        3. Discuss potential tax implications and benefits related to redeveloping the parcel into a multifamily complex of 100+ units.
        4. Based on the land value and other valuations, deduce the potential value, state, or significance of any existing structures. If feasible, infer the type and utility of the current structures.
        5. Suggest the economic feasibility and potential ROI of redeveloping the parcel given its current value and the anticipated value of a large multifamily complex in the local Florida market.
        `
    }, {
        "role": "user",
        "content": `The parcel's just value is ${jv}, with assessed values of ${av_sd} (school district) and ${av_nsd} (non-school district). Taxable values are ${tv_sd} (school district) and ${tv_nsd} (non-school district), and the land value stands at ${lnd_val}. Can you provide insights regarding these valuations in the context of multifamily development?`
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