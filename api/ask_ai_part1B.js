// Parcel Physical Characteristics

const axios = require('axios');

module.exports = async (req, res) => {
    const { act_yr_blt, eff_yr_blt, tot_lvg_ar, phy_addr1, phy_addr2, phy_city, phy_zipcd } = req.query;

    const messages = [{
        "role": "system",
        "content": "Analyze the parcel's physical characteristics, including its age, size, and construction. Provide insights into its condition, potential wear and tear, and any historical significance."
    }, {
        "role": "user",
        "content": `The parcel at ${phy_addr1}, ${phy_addr2}, ${phy_city} was built in ${act_yr_blt} with an effective year of ${eff_yr_blt}. It has a total living area of ${tot_lvg_ar} sq. ft. Can you provide insights about this parcel's physical characteristics?`
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
