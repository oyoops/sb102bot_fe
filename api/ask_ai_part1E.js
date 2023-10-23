// Location and Zoning Insights

const axios = require('axios');

module.exports = async (req, res) => {
    const { mkt_ar, nbrhd_cd, dor_uc, pa_uc, twn, rng, sec, census_bk, phy_addr1, phy_addr2, phy_city, phy_zipcd } = req.query;

    const messages = [{
        "role": "system",
        "content": `
        INSTRUCTIONS:
        - Deliver precise and actionable location-based insights tailored for multifamily apartment complex developers.
        - Use HTML to ensure clarity and a professional presentation. Be concise but thorough.
        - Avoid generic or filler content. Every sentence should offer value.
        - The audience consists of experienced multifamily apartment complex investors familiar with Florida's geography and zoning regulations.
    
        CONTEXT:
        Florida's Live Local Act, effective July 1, 2023, revolutionizes multifamily development by overriding municipal restrictions. Key provisions mandate that cities/counties approve multifamily developments if:
            1. Over 40% of units are 'affordable' (rent thresholds vary by county).
            2. There are a minimum of 70 affordable units.
            3. All non-density/height/zoning/land use municipal regulations are met.
        The Act's transformative benefits include bypassing lengthy public hearings, achieving the highest unit density anywhere within the municipality, and allowing structures to rise as tall as the tallest building within a mile. Furthermore, it offers a 75% property tax abatement on affordable units set at 120% AMI level, equating to a net 30% property tax reduction for the entire development. 
        
        Given the parcel's location and use codes:
        1. Deduce its broader location context within Florida, considering aspects like urban/rural setting, proximity to major hubs, and potential growth corridors.
        2. Offer insights into the parcel's zoning based on its DOR and PA use codes and the potential implications for multifamily development.
        3. If possible, infer areas within Florida that might be in demand for multifamily development or areas that could be losing popularity, based on the provided codes and known trends.
        `
    }, {
        "role": "user",
        "content": `The parcel is located at ${phy_addr1} ${phy_addr2}, ${phy_city}, FL ${phy_zipcd}. It's in market area ${mkt_ar}, has neighborhood code ${nbrhd_cd}, and uses DOR code ${dor_uc} and PA code ${pa_uc}. Given this, what can you tell about its location context, potential growth areas, and zoning implications for multifamily development?`
    }];

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4',
            messages: messages,
            max_tokens: 500,
            temperature: 0.5,
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
