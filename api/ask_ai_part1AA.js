// Owner Insights

const axios = require('axios');

module.exports = async (req, res) => {
    console.log("[A]\n");

    // Log all supplemental data available
    //console.log("\nSupp. data: \n" + JSON.stringify(req.query, null, 2)); // (doesn't work)

    // Location
    const lat = req.query.lat;
    const lng = req.query.lng;
    const parcelno = req.query.parcelno;
    const parcel_id = req.query.parcel_id;
    const address = req.query.address;
    //const county_name = req.query.county_name;
    //const subject_county_name = req.query.subject_county_name;
    //const subject_cityName = req.query.subject_cityName;
    const subject_isInCity = req.query.subject_isInCity ? "inside" : "outside";
    const countyNameProper = req.query.countyNameProper;
    const cityNameProper = req.query.cityNameProper;
    const displayMuniName = req.query.displayMuniName;
    //const phy_addr1 = req.query.phy_addr1;
    //const phy_city = req.query.phy_city;
    //const phy_zipcd = req.query.phy_zipcd;

    // Parcel
    const acres = req.query.acres;
    const s_legal = req.query.s_legal;
    const dor_uc = req.query.dor_uc;
    const pa_uc = req.query.pa_uc;

    // Valuations
    const jv = req.query.jv;
    const lnd_val = req.query.lnd_val;
    const av_sd = req.query.av_sd;
    const jv_chng = req.query.jv_chng;
    const jv_chng_cd = req.query.jv_chng_cd;
    const av_nsd = req.query.av_nsd;
    const tv_sd = req.query.tv_sd;
    const tv_nsd = req.query.tv_nsd;
    const jv_hmstd = req.query.jv_hmstd;
    const av_hmstd = req.query.av_hmstd;
    const jv_non_hms = req.query.jv_non_hms;
    const av_non_hms = req.query.av_non_hms;
    const jv_resd_no = req.query.jv_resd_no;
    const av_resd_no = req.query.av_resd_no;
    const jv_class_u = req.query.jv_class_u;
    const av_class_u = req.query.av_class_u;
    const jv_h2o_rec = req.query.jv_h2o_rec;
    const av_h2o_rec = req.query.av_h2o_rec;
    const jv_consrv_ = req.query.jv_consrv_;
    const av_consrv_ = req.query.av_consrv_;
    const jv_hist_co = req.query.jv_hist_co;
    const av_hist_co = req.query.av_hist_co;
    const jv_hist_si = req.query.jv_hist_si;
    const av_hist_si = req.query.av_hist_si;
    const jv_wrkng_w = req.query.jv_wrkng_w;
    const av_wrkng_w = req.query.av_wrkng_w;
    const nconst_val = req.query.nconst_val;
    const del_val = req.query.del_val;

    // Live Local
    const descriptionOfLiveLocalEligibility = req.query.descriptionOfLiveLocalEligibility;
    const subject_area_median_income = req.query.subject_area_median_income;
    const subject_county_amis_income = req.query.subject_county_amis_income;
    const subject_max_rent_0bd_120ami = req.query.subject_max_rent_0bd_120ami;
    const subject_max_rent_1bd_120ami = req.query.subject_max_rent_1bd_120ami;
    const subject_max_rent_2bd_120ami = req.query.subject_max_rent_2bd_120ami;
    const subject_max_rent_3bd_120ami = req.query.subject_max_rent_3bd_120ami;
    const tallestBuildingName = req.query.tallestBuildingName;
    const tallestBuildingAddress = req.query.tallestBuildingAddress;
    const tallestBuildingHeight = req.query.tallestBuildingHeight;
    const distanceInMilesToTallestBldg = req.query.distanceInMilesToTallestBldg;
    const maxMuniDensity = req.query.maxMuniDensity;
    const maxCapacity = req.query.maxCapacity;

    // Owner
    const own_name = req.query.own_name;
    const own_addr1 = req.query.own_addr1;
    const own_city = req.query.own_city;
    const own_state = req.query.own_state;
    const own_zipcd = req.query.own_zipcd;
    const fidu_cd = req.query.fidu_cd;

    // Structures
    const no_buldng = req.query.no_buldng;
    const act_yr_blt = req.query.act_yr_blt;
    const eff_yr_blt = req.query.eff_yr_blt;
    const tot_lvg_ar = req.query.tot_lvg_ar;

    // Transactions
    // (most recent through last two calendar years)
    const sale_prc1 = req.query.sale_prc1;
    const m_par_sal1 = req.query.m_par_sal1;
    const sale_yr1 = req.query.sale_yr1;
    const sale_mo1 = req.query.sale_mo1;
    // (prior to most recent through last two calendar years)
    const sale_prc2 = req.query.sale_prc2;
    const m_par_sal2 = req.query.m_par_sal2;
    const sale_yr2 = req.query.sale_yr2;
    const sale_mo2 = req.query.sale_mo2;

    // (rest)
    /*
    const gid = req.query.gid;
    const co_no = req.query.co_no;
    const file_t = req.query.file_t;
    const asmnt_yr = req.query.asmnt_yr;
    const bas_strt = req.query.bas_strt;
    const atv_strt = req.query.atv_strt;
    const grp_no = req.query.grp_no;
    const par_splt = req.query.par_splt;
    const distr_cd = req.query.distr_cd;
    const distr_yr = req.query.distr_yr;
    const lnd_unts_c = req.query.lnd_unts_c;
    const no_lnd_unt = req.query.no_lnd_unt;
    const lnd_sqfoot = req.query.lnd_sqfoot;
    const dt_last_in = req.query.dt_last_in;
    const imp_qual = req.query.imp_qual;
    const const_clas = req.query.const_clas;
    const no_res_unt = req.query.no_res_unt;
    const spec_feat_ = req.query.spec_feat_;
    const qual_cd1 = req.query.qual_cd1;
    const vi_cd1 = req.query.vi_cd1;
    const or_book1 = req.query.or_book1;
    const or_page1 = req.query.or_page1;
    const s_chng_cd1 = req.query.s_chng_cd1;
    const qual_cd2 = req.query.qual_cd2;
    const vi_cd2 = req.query.vi_cd2;
    const or_book2 = req.query.or_book2;
    const or_page2 = req.query.or_page2;
    const s_chng_cd2 = req.query.s_chng_cd2;
    const mkt_ar = req.query.mkt_ar;
    const nbrhd_cd = req.query.nbrhd_cd;
    const tax_auth_c = req.query.tax_auth_c;
    const twn = req.query.twn;
    const rng = req.query.rng;
    const sec = req.query.sec;
    const census_bk = req.query.census_bk;
    const prev_hmstd = req.query.prev_hmstd;
    const ass_dif_tr = req.query.ass_dif_tr;
    const cono_prv_h = req.query.cono_prv_h;
    const yr_val_trn = req.query.yr_val_trn;
    const seq_no = req.query.seq_no;
    const rs_id = req.query.rs_id;
    const mp_id = req.query.mp_id;
    const state_par_ = req.query.state_par_;
    const spc_cir_cd = req.query.spc_cir_cd;
    const spc_cir_yr = req.query.spc_cir_yr;
    const subject_county_millage = req.query.subject_county_millage;
    */


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
            - Analyze a parcel with regard to its ELIGIBILITY AND REGULATORY BENEFITS for multifamily using the Live Local Act.
            - Glean valuable information from the provided cheeky description of eligibility and benefits.
            - The audience is experienced multifamily investors familiar with Florida.
            - Avoid generic and filler content.
            
            Consider:
             - the parcel's municipality
             - maximum municipal density
             - its maximum unit capacity under the Act. 
            
            Very important final check: Remember there must be a minimum of 70 total affordable units to qualify! 
            
            Provide comprehensive insights.

        `
    }, {
        "role": "user",
        "content": `
            Tell me about the eligibility and potential benefits of the parcel at ${address} in ${cityNameProper} for Live Local Act.
            
            The parcel located at ${address} has the following cheeky description of its eligibility and benefits:
                '''
                ${descriptionOfLiveLocalEligibility}
                '''
            The parcel is ${subject_isInCity} city limits, so the primary municipality is ${displayMuniName}.
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