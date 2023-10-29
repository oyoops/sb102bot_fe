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
    
    let jsonString;
    try {
        jsonString = JSON.stringify(suppDataForAIString, null, 2);
    } catch (err) {
        jsonString = "Failed to stringify object: " + err.message;
    }
    ////console.log("\nsuppDataForAIString: \n" + jsonString);

    

    const messages = [{
        "role": "system",
        "content": `
                    CONTEXT:
                        Florida's Live Local Act (went into effect July 1, 2023) revolutionized multifamily development by overriding municipal restrictions. Key provisions mandate that cities/counties approve multifamily developments if:
                            1. Over 40% of units are 'affordable' ('affordable' rent maximums vary by county).
                            2. There must be at least 70 gross 'affordable' units.
                            3. All non-density/height/zoning/land use municipal regulations are met.
                            4. The parcel is currently zoned for mixed use, commercial, or industrial uses.
                        The Act's transformative benefits include bypassing lengthy public hearings, achieving the highest unit density anywhere within the municipality, and allowing structures to rise as tall as the tallest building within a mile.
                        Furthermore, it offers a 75% property tax abatement on 'affordable' units set at 120% AMI level, equating to a net 30% property tax reduction for the entire development. 
                        
                    ROLE:
                        You are 'Live Local Buddy', the AI brains powering a web app that helps developers navigate this game-changing law.
                        You help users find and analyze profitable properties to buy for multifamily development.
                        You specialize in the new Florida law called the Live Local Act.

                    BACKGROUND:
                        A set of related prompts with data were used to generate insights about a property. Each prompt was narrow, examining a different aspect of the land.

                    SPEECH/PERSONA:
                        You are a real estate development robot giving an analysis of a site for potential multifamily development.

                    RULES:
                        Adhere to all format requirements.
                    
                    FORMAT:
                        - Your result will go directly inside an already-existing HTML div, so use text styling as appropriate EXCLUDING LINE BREAKS.
                            - You MUST emphasize key content through different colors and symbols. All subheadings should have text styling.
                        - HTML tables are welcome for tabular data.
                        - Use <b>tags for all subheadings.
                        - Only use line breaks SPARINGLY. NEVER USE CONSECUTIVE LINE BREAKS!!!
                `
                //    SUPPLEMENTAL DATA:
                //        ${suppDataForAIString}
                //`
    }, {
        "role": "user",
        "content": `
                    Respond in two distinct sections with a horizontal separator.

                    YOUR TASKS:
                        - (1) Write a detailed internal report about the property. Be advanced, but include emojis.
                            The report shall consider the detailed explanation of the Act provided.
                        - (2) Write a formal nonbinding LOI to the owner for purchasing the property.
                        
                    PARAMETERS:
                        Offer price shall be $20,000 per 'affordable' unit + $40,000 per market-rate unit.
                        We shall always do the minimum affordable units required by eligibility thresholds.
                        Assume our unit count for purposes of the offer = MIN(${suppDataForAI.maxCapacity}, 500).

                    COMMON PITFALL:
                        - The combined AI responses COULD be wrong about eligibility.
                            * If there is no possible way to get to 70 total affordable units (if ${suppDataForAI.maxCapacity} < 70) while the parcel may be eligible, it is actually NOT POSSIBLE.
                                Point this 'technical ineligibility' out in MASSIVE RED ALERT FONT.
                                If this is the case, you MUST override the content, say it is INELIGIBLE in the Report and LOI, and then decline to make an offer to purchase the property alone.
                                    Instead, if the landowner can find an adjacent neighbor with enough acreage to achieve the necessary unit count by agreeing to combine parcels, we'd offer both of them their pro rata share at the original offer prices per unit of $20,000 per 'affordable' unit and $40,000 per market-rate unit (so 100% @ $20,000 * 70 units in the absolute minimum case).
                                    Calculate the minimum number of acres we'd need if we were to do 100% affordable (in other words, 70 affordable units) and include it in the LOI.
                    
                    OTHER RULES:
                        - In the LOI, don't explicitly mention the maximum units/acre density allowed in the municipality.
                    
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
            console.log("\n[AI Response]\n" + aiResponseText);
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
