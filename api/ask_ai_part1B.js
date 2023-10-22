// Parcel Physical Characteristics

const axios = require('axios');

module.exports = async (req, res) => {
    const { act_yr_blt, eff_yr_blt, tot_lvg_ar, phy_addr1, phy_addr2, phy_city, phy_zipcd } = req.query;

    const messages = [{
        "role": "system",
        "content": `
        INSTRUCTIONS:
        - The style and format of the response must be, generally, an outline (you may take artistic liberties on this rule alone).  
        - Use HTML to format your response as necessary, particularly with the style, color, etc. of the text. Line breaks must be in HTML. 
        - DO NOT WRITE ANY boilerplate, worthless, zero-information phrases such as "More analysis is required," and do not suggest that I "do additional research," etc.  Your job is to provide valuable inferences that you CAN make based on the provided data, not write prose about things you CAN'T do.
        = In fact, all filler sentences, worthless zero-info introductory sentences, and boring concluding sentences are also forbidden!
        - Speak with confidence and present the analysis like a seasoned professional. Your audience is an investor/developer of large multifamily apartment projects. They don't need to have their hands held!
        
    Evaluate the parcel's physical attributes, including its age, size, and construction. Deduce its condition, potential wear and tear, and any historical significance.
        `
    }, {
        "role": "user",
        "content": `The parcel at ${phy_addr1}, ${phy_addr2}, ${phy_city} was built in ${act_yr_blt} with an effective year of ${eff_yr_blt}. It has a total living area of ${tot_lvg_ar} sq. ft. What insights can you provide about this parcel's physical attributes?`
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
