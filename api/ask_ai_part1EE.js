// Location and Zoning Insights

const axios = require('axios');

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
                Florida's Live Local Act (went into effect July 1, 2023) revolutionized multifamily development by overriding municipal restrictions.
                The Act's transformative benefits include bypassing lengthy public hearings, achieving the highest unit density anywhere within the municipality, and allowing structures to rise as tall as the tallest building within a mile.
                Furthermore, it offers a *significant* property tax abatement on affordable units, equating to a net property tax reduction for the entire development from 30% to as much as 100%.
                Key provisions mandate that qualified proposals *MUST* be approved by municipalities if:
                    1. Over 40% of units are 'affordable' ('affordable' rent maximums vary by county).
                    2. There must be at least 70 gross 'affordable' units.
                    3. All non-density/height/zoning/land use municipal regulations are met.
                    4. The parcel is currently zoned for mixed use, commercial, or industrial uses.
        `
    }, {
        "role": "user",
        "content": `
            RECENT ARTICLE ABOUT LIVE LOCAL ACT:

            '''
            On March 29, 2023, Governor Ron DeSantis signed Senate Bill 102, otherwise known as the Live
                Local Act, into law, representing the largest investment for housing efforts in Florida history. For your
                convenience we have summarized below the major sections of the bill that provide incentives to
                developers constructing affordable and workforce housing in Florida. Unless otherwise expressly
                provided below the law shall take effect July 1, 2023. As this is simply a summary of certain terms,
                please refer to Senate Bill 102 for specific language and requirements.

            **The Live Local Act Summary**
                
            A. County approval for affordable housing (Section 3 of the bill):
                Amends Section 125.01055
                Current Law and Amendments:
                Current law allows a county to circumvent its comprehensive plan and zoning regulations
                when approving the development of affordable housing on any parcel zoned for residential,
                commercial, or industrial use, subject to certain conditions.
                Specifically, current law provides that a county may approve a residential project on any
                parcel zoned as residential, commercial or industrial without the need to follow local rules and
                regulations (for example, without the need to rezone the parcel) as long as: (i) at least 10% of
                the units included in the project were used for affordable housing; and (ii) the developer did
                not apply for or receive SAIL funding.

                The amendment removes a county’s ability to approve affordable housing developments
                pursuant to the statutory process on parcels zoned in residential areas, but also removes the
                restriction on developers who have applied for/or received SAIL funding for parcels zoned in
                commercial or industrial use areas.
                
                The amendment also provides that a county must authorize proposed multifamily and mixeduse residential projects as an allowable use in any area zoned for commercial, industrial,
                or mixed use if the project will provide the following:
                1. At least 40% of the residential units are affordable;
                2. Affordable means: that the monthly rents, including taxes, insurance, and utilities do
                not exceed 30% of the AMI for extremely-low-income persons (i.e., 30% AMI) (“ELI”),
                very-low-income persons (i.e., 50% AMI) (“VLI”), low-income persons (i.e., 80% AMI)
                (“LI”), and moderate-income persons (120% AMI) (“MI”);
                3. Period of at least 30 years; and
                4. For a mixed-use project at least 65% of the total square footage of the improvement
                on the parcel must be used for residential purposes.

                For proposed multifamily developments meeting the above requirements and that are to be
                located in areas zoned for commercial, industrial, or mixed use, a county may no longer
                require the owner to obtain a zoning or land use change, special exemption, conditional use
                approval, variance, or comprehensive plan amendment for building height and densities. With
                respect to density and building height, a county may not:
                    Density – restrict density below the highest allowed density on any unincorporated
                    land in the county where residential development is allowed;
                    Height – restrict the height of the proposed development below the highest allowed
                    height for a commercial or residential development located in its jurisdiction within one
                    mile of the proposed development, or three stories, whichever is higher.
                
                It should be noted that a proposed development authorized under this section must still satisfy
                the county’s land development regulations (i.e., setback, parking, etc.) and be
                administratively approved, with the exception of provisions establishing allowable densities,
                height, and land use. Further, there is no requirement to blend the AMI limits. All of the units
                could be 120% AMI.

                A county also must consider a reduced parking requirement for projects containing at least
                40% affordable units if the parcel is located within a half-mile of a major transit stop.
                
                Sunset:
                Amendment will expire on Oct. 1, 2033
                
                What this means: A county must administratively authorize a proposed residential or mixed-use
                project on any parcel zoned as commercial, industrial, or mixed-use , without any comprehensive
                plan amendments, rezoning or other special approvals needed, provided that: (i) the project contains
                at least 40% affordable units at (ii) a density that does not exceed the highest density allowed on any
                parcel where residential use is allowed with (iii) a building height that does not exceed than the
                highest allowable building height for residential or commercial structures within one mile of the parcel
                and (iv) the project satisfies all other applicable land development regulations. If any other applicable
                land development regulations cannot be satisfied, then further action by the county may be required
                to obtain the necessary relief, but in no event shall a county require a comprehensive plan
                amendment or rezoning (or other special approval) to allow the use, building height, or density.
                
            B. County Property for Affordable Housing (Section 4 of the bill):
                
                Amends Section 125.379
                Current law provides that each county is required to prepare an inventory list of all real
                property within its jurisdiction which is owned by the county and deemed appropriate for
                affordable housing.

                The amendment now also requires any property deemed appropriate for affordable housing
                that is owned by any dependent special district to be included in the inventory list and for the
                county to publish this list on its website to encourage potential development.
                The amendment also adds that any property on the inventory list may be used for affordable
                housing through a long-term ground lease that requires the development and maintenance of
                affordable housing.
                
                The amendment also adds best practices that should be followed by counties in regard to
                their surplus land programs. The best practices provide that the counties should:
                1. Establish eligibility criteria for the receipt or purchase of surplus land by developers;
                2. Make the process for requesting surplus lands publicly available; and
                3. Ensure long-term affordability through ground leases by retaining ROFR to purchase
                property that would be sold or offered at market rate and by requiring reversion of
                property not used for affordable housing within a timeframe.

                What this means: A Developer will now be able to view the county’s property that is deemed
                appropriate for affordable housing without having to contact the county and enter into a long-term
                ground lease (rather than acquiring fee title to the property) for purposes of developing affordable
                housing.

            C. Municipal Approval for Affordable Housing (Section 5 of the bill):
                Identical to Section 3 of the bill, but applies to municipalities, except that for municipalities
                which are predominately residential (that is, less than 20% of the total land area is designated
                as either commercial or industrial), the municipality must approve pursuant to this subsection
                only if the proposed development is a mixed-use project.

                See Paragraph B above for implications.

            D. Municipal Property for Affordable Housing (Section 7 of the bill):
                Identical to Section 4 of the bill but applies to municipalities.
                See Paragraph C above for implications.

            E. Property Tax Discounts/Exemptions (Section 8)
                2. The Missing Middle:
                The bill adds an ad-valorem property tax exemption for portions of property in a
                multifamily project up to:
                    75% of the assessed value if the project provides housing to natural persons
                    or families whose annual household income is greater than 80% but no more
                    than 120% AMI; or
                    100% of the assessed value if the project provides housing to natural persons
                    or families whose annual household income does not exceed 80%AMI.
                Requirements:
                    Project must be newly constructed meaning that the improvements were
                    substantially completed within five years before the earlier of (i) the date of an
                    applicant's first submission of a request of certification; or (ii) an application for
                    an ad-valorem exemption
                    Note, the definition of newly constructed may include substantial
                    rehabilitation.
                    Project must contain more than 70 units dedicated to persons or households
                    whose household incomes do not exceed 120% AMI.
                    Units must be rented for the lesser of 
                        (i) an amount that does not exceed the
                        amounts specified by the most recent multifamily rental program income and
                        rental limit chart posted by FHFC (derived from HUD);
                        (ii) 10% below the market rate.
                    Units must not be subject to an agreement with Florida Housing.
                    Cannot be used with the exemption provided in Paragraph G below.
                
                Compliance:
                To receive an exemption the property owner must submit to the property
                appraiser an application along with a certification notice from Florida Housing
                by March 1st. Please contract us for more information on the application and
                the certification.

                Applicability:
                First applies to the 2024 tax roll and sunsets on Dec. 31, 2059
                What this means: All developers can now receive a property tax exemption on the
                portions of their properties used for affordable housing if their properties qualify,
                including market rate developers.

            F. Affordable Housing Property Tax Exemption (Section 9 of the bill):
                Creates Section 196.1979
                Allows counties and municipalities to adopt an ordinance to exempt portions of property used
                to provide affordable housing.
                To be eligible, the portions of the property must meet the following:
                1. Used to house persons or families whose annual income is no greater than 60%AMI;
                2. Must contain more than 50 residential units of which at least 20% will be used to
                provide affordable housing;
                3. Units must be rented for the lesser of (i) an amount that does not exceed the amounts
                specified by the most recent multifamily rental program income and rental limit chart
                posted by FHFC (derived from HUD); or (ii) 10% below the market rate; and
                4. The property must not have been cited for three code violations in the preceding 24
                months and must not have outstanding code violations or related fines before final
                determination on a property’s qualification.
                
                Amount of exemption:
                1. If all units in the development are used for affordable housing, then the local
                government can exempt up to 100% of the assessed value of each residential unit
                used to provide affordable housing;
                2. If less than 100% of the units are used for affordable housing, then the local
                government can exempt up to 75% of the assessed value of each residential unit used
                to provide affordable housing.
                
                Compliance:
                1. To receive an exemption the property owner must submit to the property appraiser an
                application along with a certification of qualified property by March 1st. Please
                contract us for more information on the application and the certification.
                
                Applicability:
                1. First applies to the 2024 tax roll.
                What this means: This will allow a local government to adopt a property tax exemption for affordable
                housing developments. Note, this exemption has to be adopted by the local jurisdiction before its use.
                
            G. Building Materials Sales Tax Refund (Section 12 of the bill):
                An owner may receive a refund for sales taxes paid for building materials used to construct
                property subject to a recorded agreement with Florida Housing, that has newly constructed
                units restricted by a land use restriction agreement to provide affordable housing to natural
                persons or families meeting the ELI, VLI, or LI limits.
                Note, the definition of “newly constructed” under this section specifically carves out
                rehabilitation, renovation, restoration, modification, alteration, or expansion of buildings from
                the definition.
                
                Terms:
                Exemption applies to sales of building materials that occur on or after July 1, 2023.
                Only applies to tangible personal property that becomes a component of a newly
                constructed units within the development which are restricted under the LURA
                ("Eligible Units").
                Includes appliances
                Does not include plants, landscaping, fencing, and hardscaping.
                Does not apply to renovation, restoration, rehabilitation of buildings already
                located on the parcel on which the Eligible Units are built.
                Inures to the owner at the time an eligible residential unit can be used for its intended
                purpose.
                Applies through a refund of previously paid taxes.
                To receive the refund, the owner must file an application with the Department of
                Revenue.
                Owner must submit this application for refund to the Department of Revenue either (a)
                within six months after the Eligible Unit is deemed to be substantially completed by the
                local building code inspector; or (b) by Nov. 1 after the improved property is first
                subject to assessment.

                Amount of refund:
                Must be over $500.
                Amount to be refunded may not exceed the lesser of (i) $5,000 per Eligible unit; or (ii)
                97.5% of the Florida sales or use tax paid on the cost of building materials used on an
                Eligible Unit.
                Caveat, Carve-out when CDBG, SHIP or a similar grant or loan program funds are used to purchase materials.
                The exemption may also inure to a municipality, county, other governmental unit or
                agency, or nonprofit community-based organization through a refund of previously
                paid taxes when CDBG, SHIP or a similar grant or loan program funds are used to
                purchase materials.
                
                Note, this section requires that an affordable housing development be subject to a recorded
                agreement with Florida Housing and that the eligible units be restricted by a land use
                restriction agreement. The land use restriction agreement must be submitted in the owner’s
                application. Timing should be considered for strict 9% credit deals without Florida Housing
                financing, as there may be a delay in Florida Housing’s issuance of the extended low-income
                housing agreement. Moreover, the statute is unclear whether an owner will qualify under this
                provision if the owner enters into (i) solely an extended low-income housing agreement with
                Florida Housing; and (ii) whether the sections use of “land use restriction agreement”
                includes an extended low-income housing agreement.
                What this means: An affordable housing developer can now seek a refund for sales taxes paid for
                building materials used for an eligible unit. This refund can be substantial as it allows for a refund of
                $5,000 per eligible unit.
            '''

            YOUR TASK:
                Provide a HIGHLY DETAILED SUMMARY of the sections of the Live Local Act that would be of interest to Florida multifamily developer planning a new development.
        `
    }];

    try {
        // Send fetch request from server to OpenAI API
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo-16k',//process.env.AI_MODEL_PRIMARY_ANALYSES,
            messages: messages,
            max_tokens: 1500, //parseInt(process.env.AI_MAX_TOKENS_PRIMARY_ANALYSES, 10),
            temperature: 0.3,
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