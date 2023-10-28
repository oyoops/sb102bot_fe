// SER Prompt

const axios = require('axios');

module.exports = async (req, res) => {
    console.log("[SER]\n");

    let { aiCombinedResponses, suppDataForAI } = req.query;

    // Try to parse if it's a JSON string
    if (typeof suppDataForAI === "string") {
        try {
            suppDataForAI = JSON.parse(suppDataForAI);
        } catch(e) {
            // It's not a JSON string, so keep it as is
        }
    }
    
    // Remove geometry because it can break API if too long
    if (suppDataForAI && suppDataForAI.geom) {
        delete suppDataForAI.geom;
    } else if (suppDataForAI) {
        //console.log("\nThere is no geometry in the supplemental data, which is fine; just be aware!\n")
    } else {
        console.log("\n** HUGE PROBLEM! **\n There is no suppDataForAI!");
    }

    // Stringify and escape
    let suppDataForAIString = JSON.stringify(suppDataForAI).replace(/`/g, "\\`");
    ////console.log("\nsuppDataForAIString: \n" + JSON.stringify(suppDataForAIString, null, 2));
    

    const messages = [{
        "role": "system",
        "content": `
                    CONTEXT:
                        Florida's Live Local Act (went into effect July 1, 2023) revolutionized multifamily development by overriding municipal restrictions. Key provisions mandate that cities/counties approve multifamily developments if:
                            1. Over 40% of units are 'affordable' (affordable rent maximums vary by county).
                            2. There at least 70 total affordable units.
                            3. All non-density/height/zoning/land use municipal regulations are met.
                        The Act's transformative benefits include bypassing lengthy public hearings, achieving the highest unit density anywhere within the municipality, and allowing structures to rise as tall as the tallest building within a mile.
                        Furthermore, it offers a 75% property tax abatement on affordable units set at 120% AMI level, equating to a net 30% property tax reduction for the entire development. 
                        
                    ROLE:
                        You are 'Live Local Buddy', the AI brains powering a web app that helps developers navigate this game-changing law.
                        You help users find profitable properties to buy for multifamily development.

                    BACKGROUND:
                        A set of related prompts with data were used to generate insights about a land parcel. Each was narrow, examining a different aspect of the land.
                        The five AI responses were then crudely chained in order. As a result, it's now long, boring, and repetitive.

                    SPEECH/PERSONA:
                        You are a real estate development genius giving an executive report to the investment committee on a potential multifamily development site.

                    RULES:
                        - Remove repetitive non-substantive, and low value, unavailable, and incomplete information.
                        - You MUST emphasize key content through different colors and bold/italic/underlined text. Your result will go directly inside an already-existing HTML div, so use text styling as appropriate.
                        - Use emojis throughout for levity.
                `
                //    SUPPLEMENTAL DATA:
                //        ${suppDataForAIString}
                //`
    }, {
        "role": "user",
        "content": `
                    YOUR TASK:
                        - Completely rewrite the repetitive chained AI responses (below).
                        - Subject: Analysis of parcel's viability for purchase and development of apartments.
                        - If the parcel is currently zoned commercial or industrial, focus primarily on the Live Local Act pathway to build apartments. If residential or other, then focus on the traditional pathway of getting land use, zoning, and all other municipal approvals.
                    ---
                    ${aiCombinedResponses}
                `
    }];

    try {
        // Send fetch request from server to OpenAI API
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: process.env.AI_MODEL_SER_MODULE,
            messages: messages,
            max_tokens: parseInt(process.env.AI_MAX_TOKENS_SER_MODULE, 10), // (gpt-3.5-turbo) SER max output is set to 1596 (because I'm OCD) so max input space = 2500 tokens {= 4096 total limit - 1596 response}
            temperature: 0.6,
            presence_penalty: 0.1,
            frequency_penalty: 0.1
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });
        const responseData = response.data;
        
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
            ////console.log("\n[SYSTEM Prompt]\n" + aiPromptSystem);
        }
        if (aiPromptUser) {
            ////console.log("\n[USER Prompt]\n" + aiPromptUser);
        }

        // Log the response
        const aiResponseText = responseData?.choices[0]?.message?.content.trim();
        if (aiResponseText) {
            ////console.log("\n[AI Response]\n" + aiResponseText);
        }
        
        // Log all available supplemental data
        ////console.log("\nAVAILABLE DATA:\n" + JSON.stringify(suppDataForAIString, null, 2));

        // Convert newline characters to <br> tags for HTML rendering
        let htmlFormattedResponse;
        //htmlFormattedResponse = aiResponseText.replace(/\n/g, '<br>');
        htmlFormattedResponse = aiResponseText.replace(/<br>/g, '').replace(/\n/g, '<br>');
        
        // Send AI response to client
        res.status(200).json(htmlFormattedResponse);
    
    } catch (error) {
        // Log the OpenAI error
        console.error("Full error object:", error);
    
        // Check if the error response contains detailed error information
        if (error.response && error.response.data && error.response.data.error) {
            console.error("Detailed OpenAI error:", error.response.data.error);
        }
    
        const errorMessage = error.response?.data?.message || JSON.stringify(error);
        res.status(500).send(errorMessage);
    }
};