

const axios = require('axios');

module.exports = async (req, res) => {
    // Assuming we're sending the AI-enhanced data from the frontend as a JSON string
    const enhancedData = req.body;

    // Construct the prompt for detailed analysis
    const messages = [{
        "role": "system",
        "content": "Given a detailed set of data about a parcel in Florida, provide a comprehensive analysis of its viability for multifamily development, considering all factors and insights provided."
    }, {
        "role": "user",
        "content": `Here's an AI-enhanced dataset for a parcel: ${JSON.stringify(enhancedData)}. Considering this data, can you provide a thorough analysis for a land investor about the viability of this parcel for multifamily development in Florida?`
    }];

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4',
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7,
            presence_penalty: 0.1,
            frequency_penalty: 0.1
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });

        const analysis = response.data.choices[0].message.content.trim();
        res.status(200).send(analysis);
    } catch (error) {
        console.error(error);
        res.status(500).json('Error processing the request.');
    }
};
