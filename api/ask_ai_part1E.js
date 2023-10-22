// Location and Zoning Insights

const axios = require('axios');

module.exports = async (req, res) => {
    const { mkt_ar, nbrhd_cd, dor_uc, pa_uc, twn, rng, sec, census_bk, phy_addr1, phy_addr2, phy_city, phy_zipcd } = req.query;

    const messages = [{
        "role": "system",
        "content": `
        INSTRUCTIONS:
        - The style and format of the response must be, generally, an outline (you may take artistic liberties on this rule alone).  
        - Use HTML to format your response as necessary, particularly with the style, color, etc. of the text. Line breaks must be in HTML. 
        - DO NOT WRITE ANY boilerplate, worthless, zero-information phrases such as "More analysis is required," and do not suggest that I "do additional research," etc.  Your job is to provide valuable inferences that you CAN make based on the provided data, not write prose about things you CAN'T do.
        = In fact, all filler sentences, worthless zero-info introductory sentences, and boring concluding sentences are also forbidden!
        - Speak with confidence and present the analysis like a seasoned professional. Your audience is an investor/developer of large multifamily apartment projects. They don't need to have their hands held!
    
        Given the parcel's location codes and use codes, deduce its broader location context, potential growth areas, and areas that might be in demand or losing popularity.
        `
    }, {
        "role": "user",
        "content": `The parcel's address is ${phy_addr1} ${phy_addr2}, ${phy_city}, FL ${phy_zipcd}. According to Florida tax roll, it's located in market area ${mkt_ar}, neighborhood code ${nbrhd_cd}, with DOR use code ${dor_uc} and PA use code ${pa_uc}. Its geographical coordinates are township ${twn}, range ${rng}, section ${sec}, and census block ${census_bk}. What insights can you provide about its location and zoning?`
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
