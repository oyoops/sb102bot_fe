// Owner Insights

const axios = require('axios');

module.exports = async (req, res) => {
    const { own_name, address, cityNameProper, countyNameProper, own_addr1, own_addr2, own_city, own_state } = req.query;

    // Log all supplemental data available
    console.log(req.query);

    const messages = [{
        "role": "system",
        "content": `
        INSTRUCTIONS:
        - Provide succinct, actionable insights based on the provided data.
        - Style the response as a professional outline using HTML for clarity. Your audience consists of savvy multifamily apartment complex investors familiar with Florida.
        - If data is unavailable, focus on what you can infer. Assume a high level of familiarity on the part of the reader.
        
        CONTEXT:
        Florida's Live Local Act, effective July 1, 2023, revolutionizes multifamily development by overriding municipal restrictions. Key provisions mandate that cities/counties approve multifamily developments if:
            1. Over 40% of units are 'affordable' (rent thresholds vary by county).
            2. There are a minimum of 70 affordable units.
            3. All non-density/height/zoning/land use municipal regulations are met.
        The Act's transformative benefits include bypassing lengthy public hearings, achieving the highest unit density anywhere within the municipality, and allowing structures to rise as tall as the tallest building within a mile. Furthermore, it offers a 75% property tax abatement on affordable units set at 120% AMI level, equating to a net 30% property tax reduction for the entire development. 
        
        Given the owner's name and details:
        1. Offer insights into the owner type and background. For instance, if the owner's name suggests they might be elderly, consider the implications for negotiation, such as potential emotional attachment to the property.
        2. Provide potential tips for communication and negotiation with the intent to buy the property and redevelop it.
        3. If the name suggests a real estate holding company (e.g., "Coastal Properties LLC"), acknowledge it as such and provide general insights related to finding more information about the entity and its true owners.
        4. Suggest potential deal structures (e.g., fee simple purchase; joint venture; seller contributes land to GP in waterfall; seller financing; etc.) that might appeal to this landowner in a letter of intent to purchase, and briefly explain why.
        `
    }, {
        "role": "user",
        "content": `The owner of the parcel at ${address}, ${cityNameProper} in ${countyNameProper} County, FL is listed as ${own_name} whose listed address is ${own_addr1}, ${own_addr2}, ${own_city}, ${own_state}. What insights can you offer, and how should one approach negotiations with the intent to buy the property, redevelop it, and then construct a large apartment complex under the Live Local Act's provisions?`
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

        // Log the prompt
        const aiPromptSystem = messages[0]?.content.trim(); //// responseData?.choices[0]?.message?.role === 'system' ? responseData?.choices[0]?.message?.content : null;
        const aiPromptUser = messages[1]?.content.trim(); //// responseData?.choices[0]?.message?.role === 'user' ? responseData?.choices[0]?.message?.content : null;
        if (aiPromptSystem) {
            console.log("\n[Prompt: SYSTEM]\n\t" + aiPromptSystem);
        }
        if (aiPromptUser) {
            console.log("\n[Prompt: USER]\n\t" + aiPromptUser);
        }

        // Log the response
        const aiResponseText = responseData?.choices[0]?.message?.content.trim();
        if (aiResponseText) {
            console.log("\n[Response: AI]\n\t" + aiResponseText);
        }

        // Log how many tokens were used
        const tokensUsed = responseData?.usage?.total_tokens;
        const promptTokens = responseData?.usage?.prompt_tokens;
        const completionTokens = responseData?.usage?.completion_tokens;
        if (tokensUsed) {
            console.log("\n    # Total Tkns. =", tokensUsed);
        }
        if (promptTokens) {
            console.log("   # Prompt Tkns. =", promptTokens);
        }
        if (completionTokens) {
            console.log("    # Resp. Tkns. =", completionTokens);
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