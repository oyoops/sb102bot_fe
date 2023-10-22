

const axios = require('axios');

module.exports = async (req, res) => {
    const { address, county, ownerName, neighborhoodCode } = req.query;

    // Define the prompt to get enhanced data
    const messages = [{
        "role": "system",
        "content": "You are an AI with knowledge of real estate parcels in Florida, their associated data, and the context around them. Given a parcel's basic information, provide an enhanced set of data that includes insights or additional context about the parcel, its owner, its location, and other relevant information."
    }, {
        "role": "user",
        "content": `Here's a parcel located at ${address} in ${county}, FL. The owner is ${ownerName}, and it has a neighborhood code of ${neighborhoodCode}. Can you provide any additional insights or context about this parcel?`
    }];

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4',
            messages: messages,
            max_tokens: 500,
            temperature: 0.7,
            presence_penalty: 0.1,
            frequency_penalty: 0.1
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });

        const enhancedData = response.data.choices[0].message.content.trim();
        res.status(200).json(enhancedData);
    } catch (error) {
        console.error(error);
        res.status(500).json('Error processing the request.');
    }
};
