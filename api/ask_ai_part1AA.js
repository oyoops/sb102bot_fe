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
    const acres = parseFloat(req.query.acres).toFixed(2)
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
    const subject_county_amis_income = req.query.subject_county_amis_income;
    const subject_max_rent_0bd_120ami = req.query.subject_max_rent_0bd_120ami;
    const subject_max_rent_1bd_120ami = req.query.subject_max_rent_1bd_120ami;
    const subject_max_rent_2bd_120ami = req.query.subject_max_rent_2bd_120ami;
    const subject_max_rent_3bd_120ami = req.query.subject_max_rent_3bd_120ami;
    const tallestBuildingName = req.query.tallestBuildingName;
    const tallestBuildingAddress = req.query.tallestBuildingAddress;
    const tallestBuildingHeight = parseFloat(req.query.tallestBuildingHeight).toFixed(0);
    const distanceInMilesToTallestBldg = parseFloat(req.query.distanceInMilesToTallestBldg).toFixed(2);
    const maxMuniDensity = parseFloat(req.query.maxMuniDensity).toFixed(0);
    const maxCapacity = parseFloat(req.query.maxCapacity).toFixed(0);

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

    /*
    // (rest)
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
    } else if (dor_uc="003") {    
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
                Florida's Live Local Act (went into effect July 1, 2023) revolutionized multifamily development by overriding municipal restrictions. Key provisions mandate that cities/counties approve multifamily developments if:
                    1. Over 40% of units are 'affordable' ('affordable' rent maximums vary by county).
                    2. There must be at least 70 gross 'affordable' units.
                    3. All non-density/height/zoning/land use municipal regulations are met.
                    4. The parcel is currently zoned for mixed use, commercial, or industrial uses.
                The Act's transformative benefits include bypassing lengthy public hearings, achieving the highest unit density anywhere within the municipality, and allowing structures to rise as tall as the tallest building within a mile.
                Furthermore, it offers a 75% property tax abatement on 'affordable' units set at 120% AMI level, equating to a net 30% property tax reduction for the entire development. 
    
            INSTRUCTIONS:
                Provide a comprehensive overview of the parcel and its ownership.
        `
    }, {
        "role": "user",
        "content": `

            PROPERTY:
                - Address: ${address}
                - Lat/Long: ${lat}, ${lng}
                - Parcel ID#: ${parcel_id}
                - Total area: ${acres} acres
                - Legal description: ${s_legal}
                - Existing structures: ${no_buldng} buildings (first built in ${act_yr_blt}), ${tot_lvg_ar} SF A/C
            
            LANDOWNER:
                - Owner: ${own_name}
                - Address: ${own_addr1}, ${own_city}, ${own_state} ${own_zipcd}
                - Latest sale: ${sale_mo2}/${sale_yr2} for ${sale_prc2}
                - Prior sale: ${sale_mo1}/${sale_yr1} for ${sale_prc1}
                - Fiduciary name: ${fidu_cd}
            
            YOUR TASK:
                Provide an overview summary of the parcel and ownership history.
                EXCLUDE ALL REFERENCES TO UNAVAILABLE AND "0" DATA
                Do not use HTML.
                Use lots of emojis for levity.
        `
        //    The parcel located at ${address} has the following description of its eligibility and benefits:
        //        '''
        //        ${descriptionOfLiveLocalEligibility}
        //        '''
        //
        //`
    }];    

    try {
        // Send fetch request from server to OpenAI API
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: process.env.AI_MODEL_PRIMARY_ANALYSES,
            messages: messages,
            max_tokens: parseInt(process.env.AI_MAX_TOKENS_PRIMARY_ANALYSES, 10),
            temperature: 0.5,
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
        
        
        // Log prompt components and response
        if (aiPromptSystem) {
            ////console.log("\n[SYSTEM Prompt]\n" + aiPromptSystem);
        }
        if (aiPromptUser) {
            console.log("\n[USER Prompt]\n" + aiPromptUser);
        }
        if (aiResponseText) {
            ////console.log("\n[AI Response]\n" + aiResponseText);
        }
        

        // Send response to client
        res.status(200).json(aiResponseText);

    } catch (error) {
        // Log OpenAI error message
        const errorMessage = error?.data?.error || "[CRITICAL] Encountered a fatal OpenAI error!";
        console.error("Error from OpenAI:", errorMessage);
        res.status(500).send(errorMessage);
    }
};