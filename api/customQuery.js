
const { Client } = require('pg');
const axios = require('axios');

module.exports = async (req, res) => {    
    const cqPrompt = req?.body;
    console.log('Received prompt to generate custom query:\n\t"' + cqPrompt + '"');

    const messages = [{
        "role": "system",
        "content": `
            RETURN A QUERY USING ACTUAL TABLES AND COLUMNS FROM THE SCHEMA.

            You may use multiple tables in a single query. 
            For queries related to parcels, bias toward joining public.data_master and public.parcels_master.
                The public.parcels_master table contains the important 'geom' column.
                Join parcels_master 'parcelno' with data_master 'parcel_id' to return parcel geometries with all requests related to parcel data.
            For queries related to apartment/multifamily comps, bias toward using only public.comps_data.
                Resist joining public.comps_data with other tables.
            
            ** Schema description for PostgreSQL database with PostGIS **  
            
            [Table: public.comps_data] 
                Purpose: Repository of comprehensive property data. 
                Primary Key: propertyid (integer) - Unique identifier for the property. 
                Description: Extensive data repository for multifamily properties, covering identification, location, physical attributes, financial details, and market segmentation. Vital for property analysis and valuation. 
                Columns:
                    propertyid, property_address, property_name, parcel_num, building_class, building_status, num_of_units, last_sale_price, last_sale_date, style, star_rating, sec_type, constr_status, constr_begin, market_name, submkt_name, city, state, zip, cty_name, for_sale_price, for_sale_status, mth_built, yr_built, yr_renovated, num_of_stories, rent_type, affordable_type, market_segment, price_per_unit, cap_rate, vacancy_pct, avg_unit_sf, avg_ask_unit, avg_ask_sf, avg_eff_unit, avg_eff_sf, avg_concess_pct, dev_name, own_name, true_own_name, pct_st, pct_1bd, pct_2bd, pct_3bd, st_ask_rent_bed, st_ask_rent_sf, st_ask_rent_unit, st_avg_sf, st_concess_pct, st_eff_rent_bed, st_eff_rent_sf, st_eff_rent_unit, st_vacancy_pct, st_vacant_units, one_bd_ask_rent_bed, one_bd_ask_rent_sf, one_bd_ask_rent_unit, one_bd_avg_sf, one_bd_concess_pct, one_bd_eff_rent_bed, one_bd_eff_rent_sf, one_bd_eff_rent_unit, one_bd_vacancy_pct, one_bd_vacant_units, two_bd_ask_rent_bed, two_bd_ask_rent_sf, two_bd_ask_rent_unit, two_bd_avg_sf, two_bd_concess_pct, two_bd_eff_rent_bed, two_bd_eff_rent_sf, two_bd_eff_rent_unit, two_bd_vacancy_pct, two_bd_vacant_units, three_bd_ask_rent_bed, three_bd_ask_rent_sf, three_bd_ask_rent_unit, three_bd_avg_sf, three_bd_concess_pct, three_bd_eff_rent_bed, three_bd_eff_rent_sf, three_bd_eff_rent_unit, three_bd_vacancy_pct, three_bd_vacant_units, lat, lng. 
                
            [Table: public.data_master] 
                Purpose: Detailed property and parcel information aggregation.
                Foreign Key References: county_name from public.florida_counties, dor_uc from public.use_codes 
                Description: Central repository for parcel data, crucial for geographic and administrative tracking. 
                Columns:
                    county_name text, co_no text, parcel_id text, file_t text, asmnt_yr text, bas_strt text, atv_strt text, grp_no text, dor_uc text, pa_uc text, spass_cd text, jv text, jv_chng text, jv_chng_cd text, av_sd text, av_nsd text, tv_sd text, tv_nsd text, jv_hmstd text, av_hmstd text, jv_non_hms text, av_non_hms text, jv_resd_no text, av_resd_no text, jv_class_u text, av_class_u text, jv_h2o_rec text, av_h2o_rec text, jv_consrv_ text, av_consrv_ text, jv_hist_co text, av_hist_co text, jv_hist_si text, av_hist_si text, jv_wrkng_w text, av_wrkng_w text, nconst_val text, del_val text, par_splt text, distr_cd text, distr_yr text, lnd_val text, lnd_unts_c text, no_lnd_unt text, lnd_sqfoot text, dt_last_in text, imp_qual text, const_clas text, eff_yr_blt text, act_yr_blt text, tot_lvg_ar text, no_buldng text, no_res_unt text, spec_feat_ text, m_par_sal1 text, qual_cd1 text, vi_cd1 text, sale_prc1 text, sale_yr1 text, sale_mo1 text, or_book1 text, or_page1 text, clerk_no1 text, s_chng_cd1 text, m_par_sal2 text, qual_cd2 text, vi_cd2 text, sale_prc2 text, sale_yr2 text, sale_mo2 text, or_book2 text, or_page2 text, clerk_no2 text, s_chng_cd2 text, own_name text, own_addr1 text, own_addr2 text, own_city text, own_state text, own_zipcd text, own_state_ text, fidu_name text, fidu_addr1 text, fidu_addr2 text, fidu_city text, fidu_state text, fidu_zipcd text, fidu_cd text, s_legal text, app_stat text, co_app_sta text, mkt_ar text, nbrhd_cd text, public_lnd text, tax_auth_c text, twn text, rng text, sec text, census_bk text, phy_addr1 text, phy_addr2 text, phy_city text, phy_zipcd text, alt_key text, ass_trnsfr text, prev_hmstd text, ass_dif_tr text, cono_prv_h text, parcel_id_ text, yr_val_trn text, seq_no text, rs_id text, mp_id text, state_par_ text, spc_cir_cd text, spc_cir_yr text, spc_cir_tx text
                
            [Table: public.parcels_master]
                Purpose: Contains the geometries of parcels data_master.
                Primary Key: gid 
                Foreign Key Reference: county_name references public.florida_counties(county_name)
                Description: Central repository for parcel data, crucial for geographic and administrative tracking. 
                Columns:
                    parcelno (character varying): Unique identifier for the parcel. 
                    geom (geometry): GIS data representing parcel's shape and location. 
                    county_name (character varying): Name of the county where the parcel is located. 
                    gid (integer): Unique auto-incrementing identifier for each parcel record.  
        `
    }, {
        "role": "user",
        "content": `${cqPrompt}`
    }];

    let aiResponseText;

    try {
        const useModel = "ft:gpt-3.5-turbo-1106:personal::8QhzzRNz";
        const useTokens = parseInt(500, 10);
        
        // Send fetch request from server to OpenAI API
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: useModel,
            messages: messages,
            max_tokens: useTokens,
            temperature: 0.9,
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

        // Log the prompt
        const aiPromptSystem = messages[0]?.content.trim(); //// responseData?.choices[0]?.message?.role === 'system' ? responseData?.choices[0]?.message?.content : null;
        const aiPromptUser = messages[1]?.content.trim(); //// responseData?.choices[0]?.message?.role === 'user' ? responseData?.choices[0]?.message?.content : null;
        if (aiPromptSystem) {
            ////console.log("\n[SYSTEM Prompt]\n" + aiPromptSystem);
        }
        if (aiPromptUser) {
            ////console.log("\n[USER Prompt]\n" + aiPromptUser);
        }

        // Log the response
        aiResponseText = responseData?.choices[0]?.message?.content.trim();
        if (aiResponseText) {
            console.log("\n[AI Response]\n" + aiResponseText);
        }

        // Convert newline characters to <br> tags for HTML rendering
        //let htmlFormattedResponse;
        //htmlFormattedResponse = aiResponseText.replace(/<br>/g, '').replace(/\n/g, '<br>');
        
        /*// (log all available data)
        ////console.log(jsonString);
        ////console.log(modelName);*/

        // Send AI response to client
        //res.status(200).json(aiResponseText);
    
    } catch (error) {
        // Log the OpenAI error
        //console.error("Full error:", error);
    
        // Check if the error response contains detailed error information
        if (error.response && error.response.data && error.response.data.error) {
            console.error("Detailed OpenAI error:", error.response.data.error);
        }
    
        const errorMessage = error.response?.data?.message || JSON.stringify(error);
        res.status(500).send(errorMessage);
    }

    let cqAIGeneratedQuery = aiResponseText;
    
    // Setup direct database connection
    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASS,
        port: process.env.DB_PORT,
    });

    await client.connect();

    try {
        // Perform the query
        const result = await client.query(cqAIGeneratedQuery);

        if (result.rows.length > 0) {
            console.log('Data:\n' + json(result).stringify);
            res.json(result);
        } else {
            console.log('No Data!');
            res.json({ result: "No Data!" });
        }
    } catch (error) {
        console.error('Error querying the database:\n' + error);
        res.json({ result: "No Data!" });
        //res.status(500).send('Error querying the database.');
    } finally {
        await client.end();
    }
};
