// Valuation Insights

const axios = require('axios');

module.exports = async (req, res) => {
    const { jv, av_sd, av_nsd, tv_sd, tv_nsd, lnd_val } = req.query;

    const messages = [{
        "role": "system",
        "content": "Evaluate the parcel's provided valuations. Provide an overview of its value, potential tax implications, and insights into the value distribution between the land and any structures on it."
    }, {
        "role": "user",
        "content": `The parcel has a just value of ${jv}, assessed values of ${av_sd} (school district) and ${av_nsd} (non-school district), taxable values of ${tv_sd} (school district) and ${tv_nsd} (non-school district), and a land value of ${lnd_val}. Can you evaluate these valuations?`
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
