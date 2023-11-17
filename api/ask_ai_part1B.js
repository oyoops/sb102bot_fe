// Parcel Physical Characteristics

const axios = require('axios');

// Function to calculate the cost of API call
function calculateCost(tokensUsed, modelName) {
    let ratePer1000Tokens = 0;

    switch (modelName) {
        case "GPT-4":
            ratePer1000Tokens = 0.06; // 8K context output rate
            break;
        case "GPT-4-32k":
            ratePer1000Tokens = 0.12; // 32K context output rate
            break;
        case "GPT-3.5-turbo":
            ratePer1000Tokens = 0.002; // 4K context output rate
            break;
        case "GPT-3.5-turbo-16k":
            ratePer1000Tokens = 0.004; // 16K context output rate
            break;
        default:
            console.error("Invalid model name");
            break;
    }

    return (tokensUsed / 1000) * ratePer1000Tokens;
}

module.exports = async (req, res) => {
    console.log("[B]\n");

    // Log all supplemental data available
    //console.log("\nSupp. data: \n" + JSON.stringify(req.body, null, 2)); // (doesn't work)

    // SuperAI Switch
    const superAI = req.body.superAI; // 'on' / 'off'

    // Location
    const lat = req.body.lat;
    const lng = req.body.lng;
    const parcelno = req.body.parcelno;
    const parcel_id = req.body.parcel_id;
    const address = req.body.address;
    //const county_name = req.body.county_name;
    //const subject_county_name = req.body.subject_county_name;
    //const subject_cityName = req.body.subject_cityName;
    const subject_isInCity = req.body.subject_isInCity ? "inside" : "outside";
    const countyNameProper = req.body.countyNameProper;
    const cityNameProper = req.body.cityNameProper;
    const displayMuniName = req.body.displayMuniName;
    //const phy_addr1 = req.body.phy_addr1;
    //const phy_city = req.body.phy_city;
    //const phy_zipcd = req.body.phy_zipcd;

    // Parcel
    const acres = parseFloat(req.body.acres).toFixed(2)
    const s_legal = req.body.s_legal;
    const dor_uc = req.body.dor_uc;
    const pa_uc = req.body.pa_uc;

    // Comps
    const compsDataRaw = req.body.comps_data;
    const compsAvgs = req.body.comps_averages;
    const compsPcts = req.body.comps_percentages;

    // Valuations
    const jv = req.body.jv;
    const lnd_val = req.body.lnd_val;
    const av_sd = req.body.av_sd;
    const jv_chng = req.body.jv_chng;
    const jv_chng_cd = req.body.jv_chng_cd;
    const av_nsd = req.body.av_nsd;
    const tv_sd = req.body.tv_sd;
    const tv_nsd = req.body.tv_nsd;
    const jv_hmstd = req.body.jv_hmstd;
    const av_hmstd = req.body.av_hmstd;
    const jv_non_hms = req.body.jv_non_hms;
    const av_non_hms = req.body.av_non_hms;
    const jv_resd_no = req.body.jv_resd_no;
    const av_resd_no = req.body.av_resd_no;
    const jv_class_u = req.body.jv_class_u;
    const av_class_u = req.body.av_class_u;
    const jv_h2o_rec = req.body.jv_h2o_rec;
    const av_h2o_rec = req.body.av_h2o_rec;
    const jv_consrv_ = req.body.jv_consrv_;
    const av_consrv_ = req.body.av_consrv_;
    const jv_hist_co = req.body.jv_hist_co;
    const av_hist_co = req.body.av_hist_co;
    const jv_hist_si = req.body.jv_hist_si;
    const av_hist_si = req.body.av_hist_si;
    const jv_wrkng_w = req.body.jv_wrkng_w;
    const av_wrkng_w = req.body.av_wrkng_w;
    const nconst_val = req.body.nconst_val;
    const del_val = req.body.del_val;

    // Live Local
    const descriptionOfLiveLocalEligibility = req.body.descriptionOfLiveLocalEligibility;
    const subject_county_amis_income = req.body.subject_county_amis_income;
    const subject_max_rent_0bd_120ami = req.body.subject_max_rent_0bd_120ami;
    const subject_max_rent_1bd_120ami = req.body.subject_max_rent_1bd_120ami;
    const subject_max_rent_2bd_120ami = req.body.subject_max_rent_2bd_120ami;
    const subject_max_rent_3bd_120ami = req.body.subject_max_rent_3bd_120ami;
    const tallestBuildingName = req.body.tallestBuildingName;
    const tallestBuildingAddress = req.body.tallestBuildingAddress;
    const tallestBuildingHeight = parseFloat(req.body.tallestBuildingHeight).toFixed(0);
    const distanceInMilesToTallestBldg = parseFloat(req.body.distanceInMilesToTallestBldg).toFixed(2);
    const maxMuniDensity = parseFloat(req.body.maxMuniDensity).toFixed(0);
    const maxCapacity = parseFloat(req.body.maxCapacity).toFixed(0);

    // Owner
    const own_name = req.body.own_name;
    const own_addr1 = req.body.own_addr1;
    const own_city = req.body.own_city;
    const own_state = req.body.own_state;
    const own_zipcd = req.body.own_zipcd;
    const fidu_cd = req.body.fidu_cd;

    // Structures
    const no_buldng = req.body.no_buldng;
    const act_yr_blt = req.body.act_yr_blt;
    const eff_yr_blt = req.body.eff_yr_blt;
    const tot_lvg_ar = req.body.tot_lvg_ar;

    // Transactions
    // (most recent through last two calendar years)
    const sale_prc1 = req.body.sale_prc1;
    const m_par_sal1 = req.body.m_par_sal1;
    const sale_yr1 = req.body.sale_yr1;
    const sale_mo1 = req.body.sale_mo1;
    // (prior to most recent through last two calendar years)
    const sale_prc2 = req.body.sale_prc2;
    const m_par_sal2 = req.body.m_par_sal2;
    const sale_yr2 = req.body.sale_yr2;
    const sale_mo2 = req.body.sale_mo2;

    /*
    // (rest)
    const gid = req.body.gid;
    const co_no = req.body.co_no;
    const file_t = req.body.file_t;
    const asmnt_yr = req.body.asmnt_yr;
    const bas_strt = req.body.bas_strt;
    const atv_strt = req.body.atv_strt;
    const grp_no = req.body.grp_no;
    const par_splt = req.body.par_splt;
    const distr_cd = req.body.distr_cd;
    const distr_yr = req.body.distr_yr;
    const lnd_unts_c = req.body.lnd_unts_c;
    const no_lnd_unt = req.body.no_lnd_unt;
    const lnd_sqfoot = req.body.lnd_sqfoot;
    const dt_last_in = req.body.dt_last_in;
    const imp_qual = req.body.imp_qual;
    const const_clas = req.body.const_clas;
    const no_res_unt = req.body.no_res_unt;
    const spec_feat_ = req.body.spec_feat_;
    const qual_cd1 = req.body.qual_cd1;
    const vi_cd1 = req.body.vi_cd1;
    const or_book1 = req.body.or_book1;
    const or_page1 = req.body.or_page1;
    const s_chng_cd1 = req.body.s_chng_cd1;
    const qual_cd2 = req.body.qual_cd2;
    const vi_cd2 = req.body.vi_cd2;
    const or_book2 = req.body.or_book2;
    const or_page2 = req.body.or_page2;
    const s_chng_cd2 = req.body.s_chng_cd2;
    const mkt_ar = req.body.mkt_ar;
    const nbrhd_cd = req.body.nbrhd_cd;
    const tax_auth_c = req.body.tax_auth_c;
    const twn = req.body.twn;
    const rng = req.body.rng;
    const sec = req.body.sec;
    const census_bk = req.body.census_bk;
    const prev_hmstd = req.body.prev_hmstd;
    const ass_dif_tr = req.body.ass_dif_tr;
    const cono_prv_h = req.body.cono_prv_h;
    const yr_val_trn = req.body.yr_val_trn;
    const seq_no = req.body.seq_no;
    const rs_id = req.body.rs_id;
    const mp_id = req.body.mp_id;
    const state_par_ = req.body.state_par_;
    const spc_cir_cd = req.body.spc_cir_cd;
    const spc_cir_yr = req.body.spc_cir_yr;
    const subject_county_millage = req.body.subject_county_millage;
    */

    // Eligible use codes
    const eligibleCommercialCodes = ['010', '011', '012', '013', '014', '015', '016', '017', '018', '019', '020', '021', '022', '023', '024', '025', '026', '027', '028', '029', '030', '031', '032', '033', '034', '035', '036', '037', '038', '039'];
    const eligibleIndustrialCodes = ['040', '041', '042', '043', '044', '045', '046', '047', '048', '049'];
    // Complete list of use code definitions
    const useCodeLookup = {
        "000": "Vacant Residential",
        "001": "Single Family",
        "002": "Mobile Homes",
        "004": "Condominiums",
        "005": "Cooperatives",
        "006": "Retirement Homes not eligible for exemption",
        "007": "Miscellaneous Residential (migrant camps, boarding homes, etc.)",
        "008": "Residential Multifamily (<10 units)",
        "009": "Residential Common Elements/Areas",
        "003": "'Commercial Multifamily' (10+ units)",
        "010": "Vacant Commercial",
        "011": "Stores, one story",
        "012": "Mixed use - store and office or store and residential combination",
        "013": "Department Stores",
        "014": "Supermarkets",
        "015": "Regional Shopping Centers",
        "016": "Community Shopping Centers",
        "017": "Office buildings, non-professional service buildings, one story",
        "018": "Office buildings, non-professional service buildings, multi-story",
        "019": "Professional service buildings",
        "020": "Airports (private or commercial), bus terminals, marine terminals, piers, marinas",
        "021": "Restaurants, cafeterias",
        "022": "Drive-in Restaurants",
        "023": "Financial institutions (banks, saving and loan companies, mortgage companies, credit services)",
        "024": "Insurance company offices",
        "025": "Repair service shops (excluding automotive), radio and T.V. repair, refrigeration service, electric repair, laundries, Laundromats",
        "026": "Service stations",
        "027": "Auto sales, auto repair and storage, auto service shops, body and fender shops, commercial garages, farm and machinery sales and services, auto rental, marine equipment, trailers and related equipment, mobile home sales, motorcycles, construction vehicle sales",
        "028": "Parking lots (commercial or patron), mobile home parks",
        "029": "Wholesale outlets, produce houses, manufacturing outlets",
        "030": "Florists, greenhouses",
        "031": "Drive-in theaters, open stadiums",
        "032": "Enclosed theaters, enclosed auditoriums",
        "033": "Nightclubs, cocktail lounges, bars",
        "034": "Bowling alleys, skating rinks, pool halls, enclosed arenas",
        "035": "Tourist attractions, permanent exhibits, other entertainment facilities, fairgrounds (privately owned)",
        "036": "Camps",
        "037": "Race tracks (horse, auto, or dog)",
        "038": "Golf courses, driving ranges",
        "039": "Hotels, motels",
        "040": "Vacant Industrial",
        "041": "Light manufacturing, small equipment manufacturing plants, small machine shops, instrument manufacturing, printing plants",
        "042": "Heavy industrial, heavy equipment manufacturing, large machine shops, foundries, steel fabricating plants, auto or aircraft plants",
        "043": "Lumber yards, sawmills, planing mills",
        "044": "Packing plants, fruit and vegetable packing plants, meat packing plants",
        "045": "Canneries, fruit and vegetable, bottlers and brewers, distilleries, wineries",
        "046": "Other food processing, candy factories, bakeries, potato chip factories",
        "047": "Mineral processing, phosphate processing, cement plants, refineries, clay plants, rock and gravel plants",
        "048": "Warehousing, distribution terminals, trucking terminals, van and storage warehousing",
        "049": "Open storage, new and used building supplies, junk yards, auto wrecking, fuel storage, equipment and material storage",
        "050": "Improved agricultural",
        "051": "Cropland soil capability Class I",
        "052": "Cropland soil capability Class II",
        "053": "Cropland soil capability Class III",
        "054": "Timberland - site index 90 and above",
        "055": "Timberland - site index 80 to 89",
        "056": "Timberland - site index 70 to 79",
        "057": "Timberland - site index 60 to 69",
        "058": "Timberland - site index 50 to 59",
        "059": "Timberland not classified by site index to Pines",
        "060": "Grazing land soil capability Class I",
        "061": "Grazing land soil capability Class II",
        "062": "Grazing land soil capability Class III",
        "063": "Grazing land soil capability Class IV",
        "064": "Grazing land soil capability Class V",
        "065": "Grazing land soil capability Class VI",
        "066": "Orchard Groves, citrus, etc.",
        "067": "Poultry, bees, tropical fish, rabbits, etc.",
        "068": "Dairies, feed lots",
        "069": "Ornamentals, miscellaneous agricultural",
        "070": "Vacant Institutional, with or without extra features",
        "071": "Churches",
        "072": "Private schools and colleges",
        "073": "Privately owned hospitals",
        "074": "Homes for the aged",
        "075": "Orphanages, other non-profit or charitable services",
        "076": "Mortuaries, cemeteries, crematoriums",
        "077": "Clubs, lodges, union halls",
        "078": "Sanitariums, convalescent and rest homes",
        "079": "Cultural organizations, facilities",
        "080": "Vacant Governmental",
        "081": "Military",
        "082": "Forest, parks, recreational areas",
        "083": "Public county schools - including all property of Board of Public Instruction",
        "084": "Colleges (non-private)",
        "085": "Hospitals (non-private)",
        "086": "Counties (other than public schools, colleges, hospitals) including non-municipal government",
        "087": "State, other than military, forests, parks, recreational areas, colleges, hospitals",
        "088": "Federal, other than military, forests, parks, recreational areas, hospitals, colleges",
        "089": "Municipal, other than parks, recreational areas, colleges, hospitals",
        "090": "Leasehold interests (government-owned property leased by a non-governmental lessee)",
        "091": "Utility, gas and electricity, telephone and telegraph, locally assessed railroads, water and sewer service, pipelines, canals, radio/television communication",
        "092": "Mining lands, petroleum lands, or gas lands",
        "093": "Subsurface rights",
        "094": "Right-of-way, streets, roads, irrigation channel, ditch, etc.",
        "095": "Rivers and lakes, submerged lands",
        "096": "Sewage disposal, solid waste, borrow pits, drainage reservoirs, waste land, marsh, sand dunes, swamps",
        "097": "Outdoor recreational or parkland, or high-water recharge subject to classified use assessment",
        "098": "Centrally assessed",
        "099": "Acreage not zoned agricultural with or without extra features"
    };

    // Determine parcel's eligibility by virtue of land use category
    let eligibilityDescription;
    let eligibleLandUseForLiveLocal = false;
    if (eligibleCommercialCodes.includes(dor_uc)) {
        eligibleLandUseForLiveLocal = true;
        eligibilityDescription = "\nLand use is '" + useCodeLookup[dor_uc] + ",'\nwhich qualifies as COMMERCIAL!" + "\n\n  ** Live Local ELIGIBLE! **\n\n";
    } else if (eligibleIndustrialCodes.includes(dor_uc)) {
        eligibleLandUseForLiveLocal = true;
        eligibilityDescription = "\nLand use is '" + useCodeLookup[dor_uc] + ",'\nwhich qualifies as INDUSTRIAL!" + "\n\n  ** Live Local ELIGIBLE! **\n\n";
    } else if (dor_uc=="003") {    
        eligibleLandUseForLiveLocal = false;
        eligibilityDescription = "\nLand use is '" + useCodeLookup[dor_uc] + ",'\nwhich does NOT qualify. It's ALREADY residential!\n";
    } else {
        eligibleLandUseForLiveLocal = false;
        eligibilityDescription = "\nLand use is '" + useCodeLookup[dor_uc] + ",'\nwhich does NOT qualify. It's neither commercial nor industrial!\n";
    }
    ////console.log("[LAND USE ELIGIBILITY]\n" + eligibilityDescription);

    // Compose prompt
    const messages = [{
        "role": "system",
        "content": `
            CONTEXT:
                Florida's Live Local Act (went into effect July 1, 2023) revolutionized multifamily development by overriding municipal restrictions.
                The Act's transformative benefits include bypassing lengthy public hearings, achieving the highest unit density anywhere within the municipality, and allowing structures to rise as tall as the tallest building within a mile.
            
            'LIVE LOCAL' ELIGIBILITY REQUIREMENT:
                - The parcel must currently allow mixed-use. commercial, or industrial uses (not governmental, agriculutral, or even residential).
        
            Ineligible parcels get no benefit from Live Local Act whatsoever.
        `
    }, {
        "role": "user",
        "content": `
            PROPERTY:
                ${address}
                ${displayMuniName}
                (${acres} acres)

                The parcel's current use:
                    ${useCodeLookup[dor_uc] || dor_uc}

                THE PROPERTY IS CLEARLY NOT 'LIVE LOCAL'-ELIGIBLE SINCE IT IS A SINGLE-FAMILY RESIDENCE IN AN EXISTING SUBDIVISION!
            
            INSTRUCTIONS:
                Berate me for asking about a single-family residence, a use that's clearly prohibited from utilizing the Live Local Act.
                Do not use HTML.
                Use emojis for levity.
        `
    }];

    try {
        let useModel;
        let useTokens;
        // Use SuperAI?
        if (superAI == 'on') {
            console.log('[SuperAI is ON]');
            //useModel = 'gpt-3.5-turbo';
            //useTokens = 125;
            useModel = process.env.AI_MODEL_PRIMARY_ANALYSES;
            useTokens = parseInt(process.env.AI_MAX_TOKENS_PRIMARY_ANALYSES, 10);
        } else {
            console.log('[SuperAI is OFF]');
            useModel = process.env.AI_MODEL_PRIMARY_ANALYSES;
            useTokens = parseInt(process.env.AI_MAX_TOKENS_PRIMARY_ANALYSES, 10);
        }

        // Send fetch request from server to OpenAI API
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: useModel,
            messages: messages,
            max_tokens: useTokens,
            temperature: 0.5,
            presence_penalty: 0.1,
            frequency_penalty: 0.1
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });
        const responseData = response.data;

        // Log token usage
        const tokensUsed = responseData?.usage?.total_tokens;
        const modelName = responseData?.model; // Extract model name from the response data
        const promptTokens = responseData?.usage?.prompt_tokens;
        const completionTokens = responseData?.usage?.completion_tokens;
        if (tokensUsed) {
            // Calculate cost in dollars
            //const totalCost = calculateCost(tokensUsed, modelName);
            //console.log(`       Total Cost = $${totalCost.toFixed(2)}`);
            console.log("\n    # Total Tkns. =", tokensUsed);
        }
        if (promptTokens) {
            console.log("   # Prompt Tkns. =", promptTokens);
        }
        if (completionTokens) {
            console.log("    # Resp. Tkns. =", completionTokens);
        }

        // Extract prompt components and response
        const aiPromptSystem = messages[0]?.content.trim(); //// responseData?.choices[0]?.message?.role === 'system' ? responseData?.choices[0]?.message?.content : null;
        const aiPromptUser = messages[1]?.content.trim(); //// responseData?.choices[0]?.message?.role === 'user' ? responseData?.choices[0]?.message?.content : null;
        const aiResponseText = responseData?.choices[0]?.message?.content.trim();
        
        // Log prompt components and response
        if (aiPromptSystem) {
            ////console.log("\n[SYSTEM Prompt]\n" + aiPromptSystem);
        }
        if (aiPromptUser) {
            ////console.log("\n[USER Prompt]\n" + aiPromptUser);
        }
        if (aiResponseText) {
            console.log("\n[AI Response]\n" + aiResponseText);
        }

        // Send response to client
        res.status(200).json(aiResponseText);

    } catch (error) {
        // Log the OpenAI error
        console.error("Full error object:", error);
    
        // Check if the error response contains detailed error information
        if (error.response && error.response.data && error.response.data.error) {
            console.error("Detailed OpenAI error:", error.response.data.error);
        }
    
        const errorMessage = error.response?.data?.message || JSON.stringify(error);
        res.status(500).send(errorMessage);
    }
};