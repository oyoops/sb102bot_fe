// Owner Insights

const axios = require('axios');

module.exports = async (req, res) => {
    const { own_name, own_addr1, own_addr2, own_city, own_state } = req.query;

    const messages = [{
        "role": "system",
        "content": `
    INSTRUCTIONS:
    - The style and format of the response must be, generally, an outline (you may take artistic liberties on this rule alone).  
    - Use HTML to format your response as necessary, particularly with the style, color, etc. of the text. Line breaks must be in HTML. 
    - DO NOT WRITE ANY boilerplate, worthless, zero-information phrases such as "More analysis is required," and do not suggest that I "do additional research," etc.  Your job is to provide valuable inferences that you CAN make based on the provided data, not write prose about things you CAN'T do.
    = In fact, all filler sentences, worthless zero-info introductory sentences, and boring concluding sentences are also forbidden!
    - Speak with confidence and present the analysis like a seasoned professional. Your audience is an investor/developer of large multifamily apartment projects. They don't need to have their hands held!
    
    Given the owner's name and information, tell me anything that you know about the person/company that owns the land. If you know nothing about them from the information, then you may acknowledge that; but you MUST attempt to at least make your best attempt at an educated guess based on the info available.
        `
    }, {
        "role": "user",
        "content": `The parcel's owner is named ${own_name} and is located at ${own_addr1}, ${own_addr2}, ${own_city}, ${own_state}. What can you infer about this owner?`
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
