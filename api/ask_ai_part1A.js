// Owner Insights

const axios = require('axios');

module.exports = async (req, res) => {
    const { own_name, own_addr1, own_addr2, own_city, own_state, own_zipcd } = req.query;

    const messages = [{
        "role": "system",
        "content": "Given the owner's name and address, provide insights into the type of owner (individual vs. corporation) and their potential motivations or intentions."
    }, {
        "role": "user",
        "content": `The parcel's owner is named ${own_name} and is located at ${own_addr1}, ${own_addr2}, ${own_city}, ${own_state}. Can you provide insights about this owner?`
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
