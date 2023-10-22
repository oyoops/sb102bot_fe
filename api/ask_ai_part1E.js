// Location and Zoning Insights

const axios = require('axios');

module.exports = async (req, res) => {
    const { mkt_ar, nbrhd_cd, dor_uc, pa_uc, twn, rng, sec, census_bk } = req.query;

    const messages = [{
        "role": "system",
        "content": "Given the parcel's location codes and use codes, provide insights into its broader location context, potential growth areas, and any areas that are becoming less popular or more in demand."
    }, {
        "role": "user",
        "content": `The parcel is located in market area ${mkt_ar}, neighborhood code ${nbrhd_cd}, with DOR use code ${dor_uc} and PA use code ${pa_uc}. Its geographical coordinates are township ${twn}, range ${rng}, section ${sec}, and census block ${census_bk}. Can you provide insights about its location and zoning?`
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
