// Location and Zoning Insights

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
    console.log("[E]\n");

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
                For your convenience, I've summarized below the sections of the Live Local Act of key concern to multifamily developers.
                Florida's Live Local Act (went into effect July 1, 2023) revolutionizes multifamily development by overriding municipal restrictions.
                On March 29, 2023, Governor Ron DeSantis signed it (previously known as Senate Bill 102) into law. It took effect on July 1, 2023.
                
                Today is October 22, 2023. It is currently under fierce litigatation by several municipalities (though to no avail thus far).
        `
    }, {
        "role": "user",
        "content": `
            INSTRUCTIONS:                
                Below is a summary.
                Do not summarize too much further as most remaining sections and figures are very important.
                Your task is simply to add emojis throughout.

            SUMMARY:

            '''
            ** 'Live Local Act' (SB-102) Summary **
                
            MOST RELEVANT CHANGES FOR MULTIFAMILY DEVELOPERS:

            I.  Approval for Affordable Housing (Section 3 of the Act):
                The Live Local Act permits counties/cities/municipalities to bypass their comprehensive plan and zoning regulations when they approve developments with more than 10% of rental units dedicated to 'affordable housing' on parcels with zoning currently allowing for mixed-use, commercial, or industrial uses (note: residential not included), allowing them to bypass comprehensive plans and rezonings.
                If more than 40% is affordable, then the county/city/municipality *MUST* approve such development proposals.
                Amends Section 125.01055.
 
                Major Key Provisions:
                    A municipality *CAN APPROVE* any proposed multifamily and mixed-use residential projects in any area  zoned as mixed-use, commercial, or industrial (note: residential not included) without the need to adhere to local rules, provided:
                        - At least 10% of the units are used for affordable housing.
                        - The developer has not sought or received SAIL (State Apartment Incentive Loan) funding.
                    A municipality *MUST APPROVE* any proposed multifamily/mixed-use projects on any parcel zoned for commercial, industrial, or mixed-use (notice 'residential' is excluded) - no public hearings required - if:
                        - The current zoning allows for mixed-use, commercial, or industrial (note: residential not included) uses.
                        - At least 40% of the residential units are affordable.
                            "Affordable" is defined as monthly rents (inclusive of taxes, insurance, and utilities) that do not exceed 30% of the AMI for different income categories such as ELI, VLI, LI, and MI.
                            The affordability period is 30 years.
                        - For mixed-use projects, at least 65% of the total square footage of the improvement must be used for residential purposes.
                
                Density and Building Height Provisions:
                    - For eligible multifamily developments, municipalities can't require changes like rezoning, comprehensive plan amendment, etc., for building height and densities.
                    - Regarding density and building height, municipalities cannot:
                        Overrides density limits; allows a proposed development to go as dense as the highest allowed density permitted on any land in the county/city/municipality.
                        Overrides height restrictions; allows a proposed development to build up to the height of the highest allowed height for a commercial or residential development located within a mile of the proposed site or three stories, whichever is taller.
                        (As a proxy for "highest allowed height", I will provide you with the *tallest existing building* to be conservative.) 
                
                Other Notes:
                    - Developments must still meet city/county/municipal land development regulations (like setbacks, design, parking) with the exceptions of those restricting land use, unit density, and building height.
                    - Reduced parking requirements must be "considered" (whatever that truly means...) for projects with at least 40% affordable units if located within half a mile of a major transit stop.

            II. Property Tax Discounts/Exemptions (Section 8 of the Act):
                The bill introduces an ad-valorem property tax exemption for portions of property in a multifamily project up to:
                    - 75% of the assessed value if housing is provided for households with income between 80% and 120% AMI.
                    - 100% of the assessed value if housing is provided for households with income not exceeding 80% AMI.
                
                Requirements for Exemption:
                    - The project should be newly constructed, defined as improvements substantially completed within five years before certain application dates. This can include substantial rehabilitation.
                    - The project must have over 70 units dedicated to households with incomes not exceeding 120% AMI.
                    - Rents for units should be the lesser of the amount specified by the most recent multifamily rental program income and rental limit chart posted by FHFC (derived from HUD) or 10% below market rate.
                    - Units must not have an agreement with Florida Housing.
                    - The affordability period is 30 years (equal to the tax abatement period).
                
                Compliance and Applicability:
                    Property owners must submit an application along with a certification from Florida Housing by March 1st to avail the exemption.
                    The exemption applies first to the 2024 tax roll and is valid until Dec. 31, 2059.
                
                Implication:
                    Developers, including market-rate developers, can avail of substantial property tax exemptions for portions of their properties used for affordable housing, provided they meet the stipulated conditions.
                
            III. Building Materials Sales Tax Refund (Section 12 of the Act):
                Tax Refund Provisions:
                    Property owners can get a refund for sales taxes paid on building materials used in constructing properties that have a recorded agreement with Florida Housing. These properties should have newly built units that are bound by a land use restriction agreement to offer affordable housing to individuals or families meeting the ELI, VLI, or LI limits.
                
                Definitions:
                    "Newly constructed" in this section explicitly excludes rehabilitation, renovation, restoration, modification, alteration, or expansion of existing buildings.
                
                Terms and Conditions:
                    - The exemption applies to sales of building materials starting July 1, 2023.
                    - Only tangible personal property that becomes a component of newly built units within the development that are restricted under the LURA (Land Use Restriction Agreement) qualify as "Eligible Units."
                    - It includes appliances but excludes items like plants, landscaping, fencing, and hardscaping.
                    - This exemption doesn't apply to renovation or restoration of existing buildings on the parcel where the Eligible Units are constructed.
                    - The benefit is realized through a refund of previously paid taxes.
                
                Application Process:
                    - To get the refund, property owners must send an application to the Department of Revenue.
                    - The application must be submitted:
                        Within six months after the eligible unit is deemed substantially complete by the local building code inspector.
                        Or by November 1st after the improved property is first subject to assessment.
                    
                Refund Amount:
                    - The refund must be over $500.
                    - The refundable amount can't exceed the lesser of:
                        $5,000 per Eligible unit.
                        97.5% of the Florida sales or use tax paid on the building materials used on an Eligible Unit.
                    
                Implication:
                    Affordable housing developers can now reclaim sales taxes paid on building materials used for qualifying units. This refund can be significant, allowing for a refund of up to $5,000 per eligible unit.
            '''

            YOUR TASK:
                Reproduce the text, interspersing relevant emojis throughout.
        `
    }];

    try {
        // Send fetch request from server to OpenAI API
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo-16k',//process.env.AI_MODEL_PRIMARY_ANALYSES,
            messages: messages,
            max_tokens: 1000, //parseInt(process.env.AI_MAX_TOKENS_PRIMARY_ANALYSES, 10),
            temperature: 0.3,
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
            console.log("\n   # Prompt Tkns. =", promptTokens);
        }
        if (completionTokens) {
            console.log("\n    # Resp. Tkns. =", completionTokens);
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
