const axios = require('axios');
const logger = require('../logger');
//const { update } = require('lodash');

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
const ORANGE = '\x1b[33m';
const ORANGE_BACKGROUND = '\x1b[43;30m'; // New background color for system-update messages

// ---
const COLOR_SYSTEM = YELLOW;
const COLOR_SYSTEM_UPDATE = ORANGE;
const COLOR_ASSISTANT = BLUE;
const COLOR_USER = GREEN;
const COLOR_AI = RED;
// ---


module.exports = async (req, res) => {
    const { message, history, chatbotSupplementalData, updateContext } = req.body;
    //logger.sendLog(history);
    //logger.sendLog(message);
    //logger.sendLog(chatbotSupplementalData);

    // New chat received
    //logger.sendLog(RESET + `\n\n\n\n` + BOLD + MAGENTA_BACKGROUND + `        NEW CHAT        ` + RESET + `\n`);
    logger.sendLog(RESET + BOLD + MAGENTA_BACKGROUND + `        NEW CHAT        ` + RESET);

    /* Set Context Switching functionality */
    const CONTEXT_SWITCHING_ACTIVE = false;
    let context;
    let systemContentText;
    let assistantContentText;
    if (CONTEXT_SWITCHING_ACTIVE) {
        context = await adjustContext(history);
    } else {
        // Default system & assistant prompts:
        systemContentText = `You are a knowledgeable AI assistant specializing in Florida real estate. If you cannot answer a question, you simply say 'Sorry, I don't know that'. You are answering questions about a property.`;
        assistantContentText = `I'm here to assist with any questions about Florida real estate, particularly the subject property.`;
        context = {
            systemPrompt: {
                "role": "system",
                "content": systemContentText
            },
            assistantPrompt: {
                "role": "assistant",
                "content": assistantContentText
            }
        };
    }

    const systemPrompt = {
        "role": "system",
        "content": systemContentText
    };

    const assistantPrompt = {
        "role": "system",
        "content": assistantContentText
    };


    // Log the history before processing
    //logger.sendLog("History before processing:", JSON.stringify(history, null, 2));

    // Ensure that the supplemental data is included only in the first system message and not duplicated
    let initialSystemMessageIncluded = false;
    let messages = [];

    // Parse the supplemental data once at the beginning to ensure consistent handling
    let parsedSupplementalData;
    if (typeof chatbotSupplementalData === 'string') {
        try {
            // Attempt to parse the string as JSON
            parsedSupplementalData = JSON.parse(chatbotSupplementalData);
        } catch (error) {
            // If parsing fails, log the error and use the original string
            console.error('Error parsing supplemental data:', error);
            parsedSupplementalData = chatbotSupplementalData;
        }
    } else if (typeof chatbotSupplementalData === 'object') {
        // If it's already an object, use it as is
        parsedSupplementalData = chatbotSupplementalData;
    } else {
        // If it's neither a string nor an object, log an error and use an empty object
        console.error('Supplemental data is neither an object nor a string:', chatbotSupplementalData);
        parsedSupplementalData = {};
    }
    //logger.sendLog(parsedSupplementalData);

    // Process the history and construct the messages array
    history
        .filter(entry => entry && entry.message) // Filter out any invalid msgs
        .forEach((entry, index) => {
            if (index === 0 && entry.sender === 'system') {
                // Include supplemental data in the first system message
                // Ensure supplemental data is a properly formatted JSON object
                // Use the parsed supplemental data for the first system message
                let supplementalDataContent = typeof parsedSupplementalData === 'object' ? JSON.stringify(parsedSupplementalData, null, 2) : parsedSupplementalData;
                /*logger.sendLog(supplementalDataContent);*/
                messages.push({
                    "role": "system",
                    "content": `${entry.message.trim()} \nProperty Data:\n${supplementalDataContent}`
                });
                initialSystemMessageIncluded = true;
            } else {
                // Add the rest of the conversation history without supplemental data
                messages.push({
                    "role": entry.sender === 'user' ? 'user' : 'assistant',
                    "content": entry.message.trim()
                });
            }
        });

    // Ensure that the supplemental data is included only in the first system message
    if (!initialSystemMessageIncluded) {
        // Include the assistant prompt in the messages array
        messages.unshift({
            "role": "assistant",
            "content": `${assistantPrompt.content}` //assistantContentText
        });
        
        // Use the parsed supplemental data when adding the initial system message
        messages.unshift({
            "role": "system",
            "content": `${systemPrompt.content}\nProperty Data:\n${typeof parsedSupplementalData === 'object' ? JSON.stringify(parsedSupplementalData) : parsedSupplementalData}`
        });
    }

    // Log the messages after processing
    //logger.sendLog("Messages after processing:", JSON.stringify(messages, null, 2));

    // Log messages
    logger.sendLog(`   ` + RESET + BOLD + WHITE_BACKGROUND + `        MESSAGES        ` + RESET);
    history.forEach(entry => {
        let roleColor = COLOR_ASSISTANT; // Default color
        switch (entry.sender) {
            case 'user':
                roleColor = COLOR_USER;
                break;
            case 'system-update':
                roleColor = COLOR_SYSTEM_UPDATE;
                break;
            case 'system':
                roleColor = COLOR_SYSTEM;
                break;
            case 'assistant':
                roleColor = COLOR_ASSISTANT;
                break;
            case 'bot':
                roleColor = COLOR_AI;
                break;
            // No default case needed since we set a default color above
        }
        logger.sendLog(`   ` + RESET + BOLD + UNDERLINE + roleColor + `${entry.sender.toUpperCase()}` + RESET + `     ` + roleColor + `${entry.message.trim().split('\n').join('\n\t')}` + RESET);
    });

    //logger.sendLog("Messages:\n", JSON.stringify(messages[0]));

    // Send POST request
    try {
        // Set OpenAI API parameters
        const requestData = {
            messages: messages,
            model: 'gpt-4-1106-preview',
            max_tokens: 300,
            temperature: 0.9
        };

        // Send the request
        const response = await axios.post('https://api.openai.com/v1/chat/completions', requestData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
        })

        // Parse the response
        const responseData = response.data;
        const responseString = responseData.choices[0].message.content;

        // Log the AI's response
        logger.sendLog(`   ` + BOLD + UNDERLINE + COLOR_AI + `AI RESPONSE` + RESET + `     ` + COLOR_AI + `${responseString.split('\n').join('\n\t')}` + RESET);

        // Log token usage
        const tokensUsed = responseData?.usage?.total_tokens;
        const promptTokens = responseData?.usage?.prompt_tokens;
        const completionTokens = responseData?.usage?.completion_tokens;
        if (tokensUsed) {
            // Header
            logger.sendLog(RESET + `   ` + BOLD + WHITE_BACKGROUND + `      TOKEN USAGE       ` + RESET);
            // Prompt
            if (promptTokens) {
                logger.sendLog(RESET + DIM + `      Prompt    ${promptTokens}` + RESET);
            }
            // Response
            if (completionTokens) {
                logger.sendLog(RESET + DIM + '   ' + UNDERLINE + ` + Response  ${completionTokens}` + RESET);
            }
            // Total
            logger.sendLog(RESET + DIM + `    = Total     ` + BOLD + UNDERLINE + RED + `` + tokensUsed + ` tokens` + DIM + ` used` + RESET);
        }
        
        //logger.sendLog(history);
        //logger.sendLog(message);
        //logger.sendLog(chatbotSupplementalData);

        
        // Send response to client
        res.status(200).json(responseString);

    } catch (error) {
        // Determine error by OpenAI error code
        const errCode = error.response?.data?.error?.code || '';
        logger.sendLog(errCode);
        let errDesc;
        if (error.response?.data?.error?.code == 'insufficient_quota') {
            errDesc = "YOU ARE OUT OF MONEY !!!";
        } else if (error.response?.data?.error?.code != 'insufficient_quota') {
            errDesc = error.response.data.error.message;
        } else {
            errDesc = "An Unknown Error Occurred!";
        }

        // Server log detailed error info
        console.error(`\n` + RED_BACKGROUND + `[ERROR]` + RESET);
        if (error?.response && error?.response?.data && error?.response?.data?.error) {
            console.error(RED + UNDERLINE + "Exact Error Details:" + RESET + "\n" + RED + error.response.data.error.message + RESET);
        }

        // Return *just* the error message
        let errorMsg;
        if (error?.response?.data) {
            errorMsg = {error: `Sorry, I'm broken right now.\nTell the clown who made this website,\n  "${error.response.data.error.message}"` || JSON.stringify(error)
            };
        } else {
            errorMsg = {error: `Sorry, I'm broken right now. \nTry again later.`};
        }
        res.status(500).send(errorMsg);
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
        logger.sendLog("\n\n*** MESSAGES-B: ***\n\n");
        recentMessages.forEach(msg => {
            logger.sendLog(`\n[${msg.role.toUpperCase()}]: \n${msg.content}`);
        });

        // Log topic of conversation
        logger.sendLog(`\n\n*** Topic: ${topic.toLowerCase()} ***\n`);

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
