const axios = require('axios');

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const UNDERLINE = `\x1b[4m`;
const HIGHLIGHT = '\x1b[7m';

const WHITE = '\x1b[37m';
const WHITE_BACKGROUND = '\x1b[47;30m';
const RED = '\x1b[31m';
const RED_BACKGROUND = '\x1b[41;30m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const CYAN_BACKGROUND = '\x1b[46;30m';
const YELLOW = '\x1b[33m';
const YELLOW_BACKGROUND = '\x1b[43;30m';
const GREEN = '\x1b[32m';
const GREEN_BACKGROUND = '\x1b[42;30m';
const MAGENTA = '\x1b[35m';
const MAGENTA_BACKGROUND = '\x1b[45;30m';

// ---
const COLOR_SYSTEM = YELLOW;
const COLOR_ASSISTANT = BLUE;
const COLOR_USER = GREEN;
const COLOR_AI = RED;
// ---

module.exports = async (req, res) => {
    const { message, history } = req.body;

    // New chat received
    console.log(RESET + `\n\n\n` + BOLD + MAGENTA_BACKGROUND + `        NEW CHAT        ` + RESET + `\n`);
        
    /* Set Context Switching functionality */
    const CONTEXT_SWITCHING_ACTIVE = false;
    let context;
    let systemContent;
    let assistantContent;
    // If Context Switching active, use AI to deduce the context before responding (adds time); otherwise, use defaults.
    if (CONTEXT_SWITCHING_ACTIVE) {
        // Adjust context based on the ongoing conversation
        context = await adjustContext(history);
    } else {
        // Default system & assistant prompts:
        systemContent = "You are a knowledgeable AI assistant specializing in Florida real estate development, ready to provide information on various aspects of the field. Your response should be short and concise.";
        assistantContent = "I'm here to assist with any questions about Florida real estate. Feel free to ask about market trends, investment opportunities, regulations, or anything else related to this field.";
        // Set context using the correct property names
        context = {
            systemPrompt: {
                "role": "system",
                "content": systemContent
            },
            assistantPrompt: {
                "role": "assistant",
                "content": assistantContent
            }
        };
    }
    const systemPrompt = {
        "role": "system",
        "content": systemContent
    };
    const assistantPrompt = {
        "role": "assistant",
        "content": assistantContent
    };

        // Convert the chat history to the format expected by the OpenAI API
    const messages = history
        .filter(entry => entry && entry.message) // Filter out any invalid msgs
        .map(entry => ({
            "role": entry.sender === 'user' ? 'user' : 'assistant',
            "content": entry.message.trim()
        }));
    
    // Log all prompt components before sending request
    console.log(`   ` + RESET + BOLD + WHITE_BACKGROUND + `        MESSAGES        ` + RESET);
    console.log(`   ` + RESET + BOLD + UNDERLINE + COLOR_SYSTEM + `SYSTEM` + RESET + `\n     ` + COLOR_SYSTEM + `${systemPrompt.content.split('\n').join('\n\t')}` + RESET);
    console.log(`   ` + RESET + BOLD + UNDERLINE + COLOR_ASSISTANT + `ASSISTANT` + RESET + `\n     ` + COLOR_ASSISTANT + `${assistantPrompt.content.split('\n').join('\n\t')}` + RESET);
    console.log(`   ` + RESET + BOLD + UNDERLINE + COLOR_USER + `USER` + RESET + `\n     ` + COLOR_USER + `${message.trim().split('\n').join('\n\t')}` + RESET);
    
    // Add system and assistant prompts at the beginning of the conversation history (prepares messages for API request)
    if (systemPrompt && assistantPrompt) {
        messages.unshift(systemPrompt, assistantPrompt);
    }

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            messages: messages,
            model: `gpt-4-1106-preview`,
            //model: 'gpt-4',
            max_tokens: 250,
            temperature: 0.9
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });

        const responseData = response.data;
        const responseString = responseData.choices[0].message.content;

        // Log user's current message before sending API request
        console.log(`   ` + BOLD + UNDERLINE + COLOR_AI + `AI RESPONSE` + RESET + `\n     ` + COLOR_AI + `${responseString.split('\n').join('\n\t')}` + RESET);


        // Log token usage
        const tokensUsed = responseData?.usage?.total_tokens;
        const promptTokens = responseData?.usage?.prompt_tokens;
        const completionTokens = responseData?.usage?.completion_tokens;
        if (tokensUsed) {
            // Header
            console.log(`\n` + RESET + `   ` + BOLD + WHITE_BACKGROUND + `      TOKEN USAGE       ` + RESET);
            // Prompt
            if (promptTokens) {
                console.log(RESET + DIM + `      Prompt    ${promptTokens}` + RESET);
            }
            // Response
            if (completionTokens) {
                console.log(RESET + DIM + '   ' + UNDERLINE + ` + Response  ${completionTokens}` + RESET);
            }
            // Total
            console.log(RESET + DIM + `    = Total     ` + BOLD + UNDERLINE + RED + `` + tokensUsed + ` tokens` + DIM + ` used` + RESET);
        }
        
        // Send response to client
        res.status(200).json(responseString);

    } catch (error) {
        // Determine error by OpenAI error code
        const errCode = error.response?.data?.error?.code || '';
        console.log(errCode);
        let errDesc;
        if (error.response?.data?.error?.code == 'insufficient_quota') {
            errDesc = "YOU ARE OUT OF MONEY !!!";
        } /*else if (error.response?.data?.error?.code != 'insufficient_quota') {
            errDesc = "[ERROR] \nSomething non-money related happened!";
        }*/ else {
            errDesc = "An Unknown Error Occurred!";
        }
        // Server log the error
        console.error(`\n` + RED_BACKGROUND + `[ERROR]\n` + RESET + RED + errDesc + RESET);
        console.log(error);

        // Log detailed OpenAI error info
        if (error?.response && error?.response?.data && error?.response?.data?.error) {
            console.error(RED + UNDERLINE + "Error Details:" + RESET + "\n" + RED + error.response.data.error + RESET);
            console.log(error);
        }

        // Return *just the message* from the OpenAI error
        const errorMessage = error.response?.data?.message || JSON.stringify(error);
        res.status(500).send(errorMessage);
    }
};

// Helper function to adjust context based on the conversation
async function adjustContext(history) {
    // Create a prompt to determine the main topic of conversation
    const recentMessages = history.slice(-5).map(entry => ({
        "role": entry.sender === 'user' ? "user" : "assistant",
        "content": entry.message
    }));

    const topicPrompt = {
        "role": "system",
        "content": "Please determine the main topic of this conversation from the following options: 'market trends', 'investment opportunities', 'live local act', 'zoning laws', 'affordable housing regulations', 'property regulations', 'residential real estate', 'commercial real estate', 'environmental concerns', 'sustainability', 'market analysis', 'investment strategies', 'development projects', 'real estate law', 'legal advice', 'other'."
    };

    recentMessages.push(topicPrompt);

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            messages: recentMessages,
            ////model: `gpt-4-1106-preview`,
            model: `gpt-4`,
            max_tokens: 199,
            temperature: 0.9
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });

        ////const topic = response.data.choices[0].text.trim();
        const topic = response.data.choices[0].message.content.trim();

        // Log each message with its role
        console.log("\n\n*** MESSAGES-B: ***\n\n");
        recentMessages.forEach(msg => {
            console.log(`\n[${msg.role.toUpperCase()}]: \n${msg.content}`);
        });

        // Log topic of conversation
        console.log(`\n\n*** Topic: ${topic.toLowerCase()} ***\n`);

        // Decide the context based on the summarized topic
        let systemContent, assistantContent;
        switch (topic.toLowerCase()) {
            case 'market trends':
                systemContent = "You are an AI trained to provide insights on Florida's real estate market trends.";
                assistantContent = "I have the latest information on Florida's real estate market trends. What would you like to know?";
                break;
            case 'investment opportunities':
                systemContent = "You are an AI knowledgeable about investment opportunities in Florida's real estate.";
                assistantContent = "I can guide you through various investment opportunities in Florida’s real estate market. Are you looking at residential or commercial properties?";
                break;
            case 'live local act':
            case 'zoning laws':
            case 'property regulations':
                case 'affordable housing regulations':
                systemContent = "You are an AI equipped to advise on Florida's real estate regulations and zoning laws.";
                assistantContent = "Navigating property regulations is crucial. Do you have specific questions about zoning laws or building regulations in Florida?";
                break;
            case 'residential real estate':
                systemContent = "You are an AI expert in residential real estate development in Florida.";
                assistantContent = "Whether it's about purchasing homes or developing residential projects, I can help. What do you need to know about Florida's residential real estate?";
                break;
            case 'commercial real estate':
                systemContent = "You are well-versed in commercial real estate opportunities in Florida.";
                assistantContent = "Commercial real estate can be a great investment. Are you interested in office spaces, retail, or something else?";
                break;
            case 'environmental concerns':
            case 'sustainability':
                systemContent = "You specialize in providing insights on environmental sustainability in Florida real estate.";
                assistantContent = "It's important to consider environmental impacts. Are you interested in eco-friendly building practices or sustainable development?";
                break;
            case 'market analysis':
                systemContent = "You are an AI trained to perform detailed real estate market analysis in Florida.";
                assistantContent = "Understanding the market is key. Do you need an analysis of current trends or future projections?";
                break;
            case 'investment strategies':
                systemContent = "You are an AI adept in advising on investment strategies in the Florida real estate market.";
                assistantContent = "Every investment needs a strategy. Are you looking for long-term growth or short-term gains?";
                break;
            case 'development projects':
                systemContent = "You are knowledgeable about property development projects across Florida.";
                assistantContent = "Development projects can be complex. Are you inquiring about residential developments or commercial ones?";
                break;
            case 'real estate law':
            case 'legal advice':
                systemContent = "You provide information on real estate law and legal aspects in Florida.";
                assistantContent = "Legal advice is crucial in real estate. Do you have specific legal questions or need guidance on property laws?";
                break;
            // Add more cases as necessary
            // ...
            case 'other':
            default:
                systemContent = "You are a knowledgeable AI assistant specializing in Florida real estate development, ready to provide information on various aspects of the field.";
                assistantContent = "I'm here to assist with any questions about Florida real estate. Feel free to ask about market trends, investment opportunities, regulations, or anything else related to this field.";
                break;
        }

        return {
            systemPrompt: {
                "role": "system",
                "content": systemContent
            },
            assistantPrompt: {
                "role": "assistant",
                "content": assistantContent
            }
        };

    } catch (error) {
        console.error("Error in adjustContext:", error);
        // Fallback to default prompts in case of an error
        return {
            systemPrompt: {
                "role": "system",
                "content": "You are a knowledgeable chatbot specializing in Florida real estate development."
            },
            assistantPrompt: {
                "role": "assistant",
                "content": "I'm here to provide expert advice on Florida real estate development. How can I assist you today?"
            }
        };
    }
}