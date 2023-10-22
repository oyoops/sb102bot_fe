// Sales History
// (only includes sales during the current and previous calendar years)

const axios = require('axios');

module.exports = async (req, res) => {
    const { sale_prc1, sale_yr1, sale_mo1, sale_prc2, sale_yr2, sale_mo2 } = req.query;

    const messages = [{
        "role": "system",
        "content": "Analyze the parcel's sales history. Provide insights into its appreciation or depreciation over time, the frequency of sales, and any potential market trends."
    }, {
        "role": "user",
        "content": `The parcel was sold for ${sale_prc1} in ${sale_mo1}/${sale_yr1} and for ${sale_prc2} in ${sale_mo2}/${sale_yr2}. Can you analyze its sales history?`
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
