// Location and Zoning Insights

const axios = require('axios');

module.exports = async (req, res) => {
    console.log("[E]\n");
    //const { own_name, address, cityNameProper, countyNameProper, own_addr1, own_addr2, own_city, own_state } = req.query;

    // Log all supplemental data available
    //console.log(req.query);

    const address = req.query.address;
    const cityNameProper = req.query.cityNameProper;
    const descriptionOfLiveLocalEligibility = req.query.descriptionOfLiveLocalEligibility;
    const subject_isInCity = req.query.subject_isInCity ? "inside" : "outside";
    const maxMuniDensity = req.query.maxMuniDensity;
    const maxCapacity = req.query.maxCapacity;
    const displayMuniName = req.query.displayMuniName;

    const tallestBuildingHeight = req.query.tallestBuildingHeight;
    const act_yr_blt = req.query.act_yr_blt;
    const tot_lvg_ar = req.query.tot_lvg_ar;
    const no_buldng = req.query.no_buldng;
    const address = req.query.address;
    const cityNameProper = req.query.cityNameProper;
    const jv = req.query.jv;
    const av_sd = req.query.av_sd;
    const lnd_val = req.query.lnd_val;
    const sale_prc1 = req.query.sale_prc1;
    const sale_prc2 = req.query.sale_prc2;
    const subject_area_median_income = req.query.subject_area_median_income;
    const subject_county_amis_income = req.query.subject_county_amis_income;
    const subject_max_rent_0bd_120ami = req.query.subject_max_rent_0bd_120ami;
    const subject_max_rent_1bd_120ami = req.query.subject_max_rent_1bd_120ami;
    const subject_max_rent_2bd_120ami = req.query.subject_max_rent_2bd_120ami;
    const subject_max_rent_3bd_120ami = req.query.subject_max_rent_3bd_120ami;
    const own_name = req.query.own_name;
    const s_legal = req.query.s_legal;
    const eff_yr_blt = req.query.eff_yr_blt;
    const m_par_sal1 = req.query.m_par_sal1;
    const sale_yr1 = req.query.sale_yr1;
    const m_par_sal2 = req.query.m_par_sal2;
    const sale_yr2 = req.query.sale_yr2;


    // Compose prompt
    const messages = [{
        "role": "system",
        "content": `
            INSTRUCTIONS:
            - Your role is to delve into the ownership history and context of a parcel. Consider past transactions, the year it was built, and any relevant legal descriptions.
            - The audience is experienced multifamily investors familiar with Florida.
            - Avoid generic and filler content.
        
            CONTEXT:
            Florida's Live Local Act, effective July 1, 2023, revolutionizes multifamily development by overriding municipal restrictions. Key provisions mandate that cities/counties approve multifamily developments if:
                1. Over 40% of units are 'affordable' (rent thresholds vary by county).
                2. There are a minimum of 70 affordable units.
                3. All non-density/height/zoning/land use municipal regulations are met.
            The Act's transformative benefits include bypassing lengthy public hearings, achieving the highest unit density anywhere within the municipality, and allowing structures to rise as tall as the tallest building within a mile. Furthermore, it offers a 75% property tax abatement on affordable units set at 120% AMI level, equating to a net 30% property tax reduction for the entire development. 
        `
    }, {
        "role": "user",
        "content": `
            I'm interested in the ownership and historical background of the parcel at ${address}.
            Can you shed light on its past transactions and any significant historical context?
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