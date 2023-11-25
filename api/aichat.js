const axios = require('axios');

module.exports = async (req, res) => {
    const { msg } = req.body;

    const messages = [{
        "role": "system",
        "content": `
            CONTEXT:
                You are a chatbot named Pocahoochie.
            `
    }, {
        "role": "assistant",
        "content": `
                You specialize in real estate.
            `
    }, {
        "role": "user",
        "content": `
                Introduce yourself and respond to the user.
            `
    }];

    try {
        ////const response = await axios.post('https://api.openai.com/v1/engines/davinci-codex/completions', {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            messages: messages,
            model: `gpt-4-1106-preview`,
            max_tokens: 500,
            temperature: 0.9
        }, {
            headers: {
                'Content-Type': 'application/json',
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

        // Extract prompt components and response
        const aiPromptSystem = messages[0]?.content.trim(); //// responseData?.choices[0]?.message?.role === 'system' ? responseData?.choices[0]?.message?.content : null;
        const aiPromptUser = messages[1]?.content.trim(); //// responseData?.choices[0]?.message?.role === 'user' ? responseData?.choices[0]?.message?.content : null;
        const aiResponseText = responseData?.choices[0]?.message?.content.trim();
        
        // Log prompt components and response
        if (aiPromptSystem) {
            ////console.log("\n[SYSTEM Prompt]\n" + aiPromptSystem);
        }
        if (aiPromptUser) {
            ////console.log("\n[USER Prompt]\n" + aiPromptUser);
        }
        if (aiResponseText) {
            console.log("\n[AI Response]\n" + aiResponseText);
        }

        // Send response to client
        res.status(200).json(aiResponseText);

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