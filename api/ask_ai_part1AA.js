// Owner Insights

const axios = require('axios');

module.exports = async (req, res) => {
    console.log("[A]\n");
    //const { own_name, address, cityNameProper, countyNameProper, own_addr1, own_addr2, own_city, own_state } = req.query;

    // Log all supplemental data available
    //console.log(req.query);

    const address = req.query.address;
    const cityNameProper = req.query.cityNameProper;
    const descriptionOfLiveLocalEligibility = req.query.descriptionOfLiveLocalEligibility;
    const subject_isInCity = req.query.subject_isInCity ? "inside" : "outside";
    const maxMuniDensity = req.query.maxMuniDensity;
    const maxCapacity = req.query.maxCapacity;

    // Compose prompt
    const messages = [{
        "role": "system",
        "content": `

            CONTEXT:
            Florida's Live Local Act, effective July 1, 2023, revolutionizes multifamily development by overriding municipal restrictions. Key provisions mandate that cities/counties approve multifamily developments if:
                1. Over 40% of units are 'affordable' (maximum affordable rent limits vary by based on counties' Area Median Income).
                2. There are a minimum of 70 total affordable units.
                3. All non-density/height/zoning/land use municipal regulations are met.
                4. The parcel is currently zoned for mixed use, commercial, or industrial uses.
            The Act's transformative benefits include bypassing lengthy public hearings, achieving the highest unit density anywhere within the municipality, and allowing structures to rise as tall as the tallest building within a mile.
            Furthermore, it offers a 75% property tax abatement on affordable units set at the 120% AMI level (quite high), equating to a net 30% property tax reduction for the entire development; big savings. 

            INSTRUCTIONS:
            Analyze a parcel with regard to its ELIGIBILITY AND REGULATORY BENEFITS for multifamily using the Live Local Act.
            Glean valuable information from the provided cheeky description of eligibility and benefits.
            
            Consider:
             - the parcel's municipality
             - maximum municipal density
             - its maximum unit capacity under the Act
            
            Provide comprehensive insights.

            If isInCity = false, then parcel's primary municipality is its county; if true, then it is the city '${cityNameProper}'
                isInCity = ${subject_isInCity}
        `
    }, {
        "role": "user",
        "content": `
            Tell me about the eligibility and potential benefits of the parcel at ${address} in ${cityNameProper} for Live Local Act.
            
            The parcel located at ${address} has the following cheeky description of its eligibility and benefits:
                '''
                ${descriptionOfLiveLocalEligibility}
                '''
            The maximum density allowed in the municipality is ${maxMuniDensity} units/acre, which we can match using the Act.
            Given the parcel's size and location, the maximum achievable yield would be ${maxCapacity} units if approved through Live Local.
        `
    }];    

    try {
        // Send fetch request from server to OpenAI API
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: process.env.AI_MODEL_PRIMARY_ANALYSES,
            messages: messages,
            max_tokens: parseInt(process.env.AI_MAX_TOKENS_PRIMARY_ANALYSES, 10),
            temperature: 0.6,
            presence_penalty: 0.1,
            frequency_penalty: 0.1
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });
        const responseData = response.data;

        // Get token usage
        const tokensUsed = responseData?.usage?.total_tokens;
        const promptTokens = responseData?.usage?.prompt_tokens;
        const completionTokens = responseData?.usage?.completion_tokens;

        // Log token usage
        if (tokensUsed) {
            console.log(" # Total Tkns. =", tokensUsed);
        }
        if (promptTokens) {
            console.log("# Prompt Tkns. =", promptTokens);
        }
        if (completionTokens) {
            console.log(" # Resp. Tkns. =", completionTokens);
        }

        // Extract prompt components and response
        const aiPromptSystem = messages[0]?.content.trim(); //// responseData?.choices[0]?.message?.role === 'system' ? responseData?.choices[0]?.message?.content : null;
        const aiPromptUser = messages[1]?.content.trim(); //// responseData?.choices[0]?.message?.role === 'user' ? responseData?.choices[0]?.message?.content : null;
        const aiResponseText = responseData?.choices[0]?.message?.content.trim();
        
        /*
        // Log prompt components and response
        if (aiPromptSystem) {
            console.log("\n[SYSTEM Prompt]\n" + aiPromptSystem);
        }
        if (aiPromptUser) {
            console.log("\n[USER Prompt]\n" + aiPromptUser);
        }
        if (aiResponseText) {
            console.log("\n[AI Response]\n" + aiResponseText);
        }
        */

        // Send response to client
        res.status(200).json(aiResponseText);

    } catch (error) {
        // Log OpenAI error message
        const errorMessage = error?.data?.error || "[CRITICAL] Encountered a fatal OpenAI error!";
        console.error("Error from OpenAI:", errorMessage);
        res.status(500).send(errorMessage);
    }
};