// SER Prompt

const axios = require('axios');
/*
// Function to calculate the cost of API call
function calculateCost(tokensUsed, modelName) {
    let ratePer1000Tokens = 0;

    switch (modelName) {
        case "GPT-4":
            ratePer1000Tokens = 0.06; // 8K context output rate
            break;
        case "GPT-4-32k":
            ratePer1000Tokens = 0.12; // 32K context output rate
            break;
        case "GPT-3.5-turbo":
            ratePer1000Tokens = 0.002; // 4K context output rate
            break;
        case "GPT-3.5-turbo-16k":
            ratePer1000Tokens = 0.004; // 16K context output rate
            break;
        default:
            console.error("Invalid model name");
            break;
    }

    return (tokensUsed / 1000) * ratePer1000Tokens;
}
*/
module.exports = async (req, res) => {
    console.log("[SER]\n");

    let { aiCombinedResponses, suppDataForAI, superAI } = req.body;
        
    // SuperAI Switch
    console.log("<", superAI, ">");

    // Remove geometry because it can break API if too long
    if (suppDataForAI && suppDataForAI.geom) {
        delete suppDataForAI.geom;
    } else if (suppDataForAI) {
        console.log("\nThere is no geometry in the supplemental data, which is fine; just be aware!\n")
    } else {
        console.log("\n** HUGE PROBLEM! **\n There is no suppDataForAI!");
    }
    
    // Stringify and escape
    let jsonString;
    try {
        jsonString = JSON.stringify(suppDataForAI, null, 2);
    } catch (err) {
        jsonString = "Failed to stringify object: " + err.message;
    }
    console.log(jsonString);
    
    const messages = [{
        "role": "system",
        "content": `
                ROLE:
                    You are 'Live Local Buddy', the AI powering a web app that helps real estate developers navigate this game-changing law.
                    You help users find and analyze profitable properties to buy for multifamily development, specializing in Florida's new 'Live Local Act' law.
                BACKGROUND:
                    A set of related prompts with data were used to generate insights about a property, then combined.
                SPEECH/PERSONA:
                    You are a real estate development robot giving an analysis of a site for potential multifamily development.
                    Talk in a robot voice.
                FORMAT RULES:
                    - Your result will go directly inside an already-existing HTML div, so use text styling as appropriate EXCLUDING LINE BREAKS.
                        - You MUST emphasize key content through different colors and symbols. All subheadings should have text styling.
                    - Use <b>tags for all subheadings.
                    - Use line breaks SPARINGLY. NO CONSECUTIVE LINE BREAKS!
                COMMON PITFALL:
                    - Even if the land use is eligible, beware:
                        * If there is no possible way to get to 70 total affordable units (if ${suppDataForAI.maxCapacity} < 70), it is actually NOT POSSIBLE.
                            If land use is eligible, point this 'technical ineligibility' out in MASSIVE RED ALERT FONT.
                            Calculate the minimum number of acres we'd need if we were to do 100% affordable (in other words, 70 affordable units) and include it.
            `
    }, {
        "role": "user",
        "content": `
                YOUR TASK:
                    Write a succinct summary report about the property with respect to the Live Local Act.
                    Do not go into excessive detail about the law itself.
                    Be advanced, but include emojis.
                ---
                ${aiCombinedResponses}
            `
    }];

    try {
        let useModel;
        let useTokens;
        // Use SuperAI?
        if (superAI == 'on') {
            console.log('[SuperAI is ON]');
            useModel = 'gpt-4';
            useTokens = 400;
        } else {
            console.log('[SuperAI is OFF]');
            useModel = process.env.AI_MODEL_SER_MODULE;
            useTokens = parseInt(process.env.AI_MAX_TOKENS_SER_MODULE, 10);
        }
        
        // Send fetch request from server to OpenAI API
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: useModel,
            messages: messages,
            max_tokens: useTokens,
            temperature: 0.5,
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
        const modelName = responseData?.model; // Extract model name from the response data
        const promptTokens = responseData?.usage?.prompt_tokens;
        const completionTokens = responseData?.usage?.completion_tokens;
        if (tokensUsed) {
            // Calculate cost in dollars
            //const totalCost = calculateCost(tokensUsed, modelName);
            //console.log(`       Total Cost = $${totalCost.toFixed(2)}`);
            console.log("\n    # Total Tkns. =", tokensUsed);
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

        // Convert newline characters to <br> tags for HTML rendering
        let htmlFormattedResponse;
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
