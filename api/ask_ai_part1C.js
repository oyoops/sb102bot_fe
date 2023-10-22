// Valuation Insights

const axios = require('axios');

module.exports = async (req, res) => {
    const { jv, av_sd, av_nsd, tv_sd, tv_nsd, lnd_val } = req.query;

    const messages = [{
        "role": "system",
        "content": `
        INSTRUCTIONS:
        - The style and format of the response must be, generally, an outline (you may take artistic liberties on this rule alone).  
        - Use HTML to format your response as necessary, particularly with the style, color, etc. of the text. Line breaks must be in HTML. 
        - DO NOT WRITE ANY boilerplate, worthless, zero-information phrases such as "More analysis is required," and do not suggest that I "do additional research," etc.  Your job is to provide valuable inferences that you CAN make based on the provided data, not write prose about things you CAN'T do.
        = In fact, all filler sentences, worthless zero-info introductory sentences, and boring concluding sentences are also forbidden!
        - Speak with confidence and present the analysis like a seasoned professional. Your audience is an investor/developer of large multifamily apartment projects. They don't need to have their hands held!
            
    Assess the parcel's provided valuations. Give a detailed overview of its value, potential tax implications, and insights into the value distribution between the land and any structures on it.
        `
    }, {
        "role": "user",
        "content": `The parcel has a just value of ${jv}, assessed values of ${av_sd} (school district) and ${av_nsd} (non-school district), taxable values of ${tv_sd} (school district) and ${tv_nsd} (non-school district), and a land value of ${lnd_val}. How would you assess these valuations?`
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
