// main.js - primary script for the sb102bot web app

// get event listeners
import './eventListeners.js';
// get DOM elements
import {
    loadingContainer, initialContent, eligibilityDiv, developmentProgramInputSection,
    currentBugsContainer, recentUpdatesContainer, futureUpdatesContainer, infoSections,
    marketRateInputSection, rentPerSqFtTableSection, landAndTotalHcInputSection, landAndTotalHcOutputSection,
    mainHeader,
    ////parcelDataTable, parcelDataTableBody, 
    rentInfoContainer, countyDataTable, countyTableBody, countyMaxRentsTable, rentsTableBody,
    unitCalculationTable, abatementTable,
    form, addressInput, affordablePercentageSlider, affordablePctDisplay, acreageInput, densityInput,
    landCostPerUnit, totalHCPerUnit, matchAffordableSizesCheckbox,
    sizeInputs, marketInputs, affordableSizeInputs, marketRateInputs,
    googlemap, tryAgainButton
} from './domElements.js';


/* once DOM is fully loaded: */
document.addEventListener('DOMContentLoaded', function() {
    window.scrollTo(0, 0); // scroll to top
    //initAutocomplete(); // prepare Places API
    

    // (manually add 'Supercharge AI' switch event listener)
    let superAI = 'off';
    document.getElementById('superchargeSwitch').addEventListener('change', function() {
        this.value = this.checked ? 'on' : 'off';
        superAI = this.value;
        console.log(`SuperAI=${superAI}`);
    });

      
    // on form submit:
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get user input (dirty address) 
        address = addressInput.value;
        if (!address) {
            alert('You might want to try typing an address first? Just a suggestion, though...');
            return;
        }

        // ONE HUGE TRY BLOCK
        try {
            console.log(`Submitting ${address} to Live Local Guru w/ SuperAI=${superAI}...`);
            
            // hide header and initial content
            mainHeader.style.display = 'none';
            initialContent.style.display = 'none';
            infoSections.style.display = 'none';
            currentBugsContainer.style.display = 'none';
            recentUpdatesContainer.style.display = 'none';
            futureUpdatesContainer.style.display = 'none';
            // display fake loading progress bar
            updateLoadingBar();
            loadingContainer.style.display = 'block';
            window.scrollTo(0, 0);

            // geocode the input address
            /*
            const geocodeEndpoint = `/api/geocode?address=${encodeURIComponent(address)}`;
            const geocodeResponse = await fetch(geocodeEndpoint);
            if (!geocodeResponse.ok) {
                console.log('ERROR: Geocode failed!');
                throw new Error(`Server responded with ${geocodeResponse.status}: ${await geocodeResponse.text()}`);
            }
            geocodeData = await geocodeResponse.json();
            */
            const geocodeData = await geocodeAddress(address);
            ////console.log("Geocode Data Received:", geocodeData);            
            // extract coordinates from geo data
            lat = geocodeData.results[0].geometry.location.lat;
            lng = geocodeData.results[0].geometry.location.lng;

            // fetch the city of the address (Lat,Lng = CityData || CityName = Unincorporated if not in a city)
            /*
            const cityCheckEndpoint = `/api/check_city?lat=${lat}&lng=${lng}`;
            const cityCheckResponse = await fetch(cityCheckEndpoint);
            cityData = await cityCheckResponse.json(); // global
            if (cityData.isInCity) {
                ////console.log(`Address is in city: ${cityData.cityName}`);
            } else {
                ////console.log('Address is unincorporated.');
                cityData.cityName = 'unincorporated';
            }
            */
            const cityData = await checkCity(geocodeData);

            // initialize the map (is this too early?)
            initializeMap(lat, lng);
            // Display Google Map
            googlemap.style.display = 'block';
            // scroll to top
            window.scrollTo(0, 0);



            /* API blocks: */

            // API block #1 of 3: COUNTY DATA
            try {
                // fetch the county data for the address (Lat,Lng = CountyData)
                const countyDataEndpoint = `/api/load_county_table?lat=${lat}&lng=${lng}`;
                const countyDataResponse = await fetch(countyDataEndpoint);
                
                countyData = await countyDataResponse.json();
                ////console.log("County Data Received:", countyData);
                
                if (!countyData.county_name) {
                    throw new Error;
                }
                ////addLoadingLine(`Found the address in <b>${specialCountyFormatting(countyData.county_name)} County</b>.`);
            } catch (error) {
                console.error("Error fetching county data:\n", error);
                alert("Looks like we hit a roadblock on County Road! 🛣️\nCouldn't fetch the county data.");
                return;  // Exit early since we can't proceed without county data
            }



            // API block #2 of 3: PARCEL DATA
            try {
                // fetch the parcel data for the address (Lat,Lng + County = ParcelData)
                const parcelDataEndpoint = `/api/load_parcel_data?lat=${lat}&lng=${lng}&county_name=${countyData.county_name}`;
                const parcelDataResponse = await fetch(parcelDataEndpoint);
                
                parcelData = await parcelDataResponse.json();
                ////console.log("Parcel Data Received:", parcelData);
                if (!parcelData || Object.keys(parcelData).length === 0) {
                    throw new Error('Missing or empty parcel data');
                }
                //addLoadingLine(`Found ${specialCountyFormatting(countyData.county_name)} <br>parcel <b>#${parcelData.parcel_id}</b>.<br><br>Writing a memo about the property...`);
                addLoadingLine(`Found parcel #${parcelData.parcel_id}.<br>Researching the parcel...<br>`);
                
            } catch (error) {
                console.error("Error fetching parcel data:\n", error);
                alert("We tried to lay the foundation, but hit a snag with the parcel! 🏗️\nCouldn't fetch the parcel data.");
                return;  // Exit early (can't proceed without parcel data)
            }

            let height = parseFloat(buildingHeight).toFixed(0); /////// fix
            if (isNaN(height)) {
                height = "unknown";
                ////addLoadingLine(`Trying to find a tall building within a mile...`);
            } else {
                ////addLoadingLine(`Found a <b>${parseFloat(buildingHeight).toFixed(0)}'-tall building</b> within a mile...`);
            }

            // API block #3 of 3: AI RESPONSES
            try {
                // verify parcelData exists
                if (!parcelData || Object.keys(parcelData).length === 0) {
                    console.log(`Skipping AI analysis module...`);
                    throw new Error('Sorry, this property is not eligible, buddy.');
                }

                // make copy of parcelData for enhancement
                aiSupplementalData = JSON.parse(JSON.stringify(parcelData));

                // decompose available JSONs and add their values
                if (countyData) {
                    // *must* stay in simple flat JSON form; will need a recursive merge if I ever add nested objects
                    for (const [key, value] of Object.entries(countyData)) {
                        aiSupplementalData[`subject_${key}`] = value;  // Prefixing with "subject_" to ensure uniqueness with globals
                    }
                }
                if (cityData) {
                    if (toProperCase(cityData.cityName) == "Unincorporated") {
                        ////addLoadingLine(`Site is within <b>${toProperCase(cityData.cityName)}</b> city limits...`);
                    } else {
                        ////addLoadingLine(`Site is in unincorporated <b>${countyData.county_name} County</b>...`);
                    }
                    // *must* stay in simple flat JSON form; will need a recursive merge if I ever add nested objects
                    for (const [key, value] of Object.entries(cityData)) {
                        aiSupplementalData[`subject_${key}`] = value;  // Prefixing with "subject_" to ensure uniqueness with globals
                    }
                }
                // Preserve dirtyData
                dirtyData = JSON.parse(JSON.stringify(aiSupplementalData));
                let dirtyDataString = JSON.stringify(dirtyData, null, 2); 

                /* ALTERNATE WAY TO PULL PRIMARY PROMPTS (FROM GOOGLE SHEETS):
                // (maybe wrong formula name, IDK)
                // (example usage)
                generateRefinedSummary('https://docs.google.com/spreadsheets/d/e/2PACX-1vQDEUHmX1uafVBH5AHDDOibri_dnweF-UQ5wJsubhLM7Z4sX5ifOn1pRNvmgbSCL5OMYW-2UVbKTUYc/pubhtml', 'A', cleanData).then(summary => {
                    hmmm = summary;
                    console.log("Hmmm = " + hmmm);
                });*/

            } catch (error) {
                console.error("[CRITICAL] Error while collecting AI responses: \n", error);
                return;
            }

            // convert city and county names to Proper Case for clean
            cityNameProper = toProperCase(cityData.cityName);
            countyNameProper = specialCountyFormatting(countyData.county_name);

            // show Try Again button
            tryAgainButton.style.display = 'block';
            window.scrollTo(0, 0);
            
            // ...
            // MANUAL MILLAGE ADJUSTMENT:
            fakeMillage = parseFloat(countyData.county_millage) + parseFloat(MILLAGE_ADJUSTMENT); // "rough estimate" using known county mills + a constant manual adjustment to approximate state (and perhaps local...) portion of grand total millage
            fakeMillage = parseFloat(fakeMillage).toFixed(4);
            // ...

            // Populate the municipal data table
            const countyRow = `
                <tr>
                    <td>${cityNameProper}</td>
                    <td>${countyNameProper}</td>
                    <td>$${parseFloat(countyData.county_amis_income).toFixed(0)}</td>
                    <td>${parseFloat(fakeMillage).toFixed(4)}</td>
                </tr>
            `;
            countyTableBody.innerHTML = countyRow;
            ////countyDataTable.style.display = 'table'; // show municipal data table
            
            // Populate the max rents table
            const rentsRow = `
                <tr>
                    <td>$${parseFloat(countyData.max_rent_0bd_120ami).toFixed(0)}</td>
                    <td>$${parseFloat(countyData.max_rent_1bd_120ami).toFixed(0)}</td>
                    <td>$${parseFloat(countyData.max_rent_2bd_120ami).toFixed(0)}</td>
                    <td>$${parseFloat(countyData.max_rent_3bd_120ami).toFixed(0)}</td>
                </tr>
            `;
            rentsTableBody.innerHTML = rentsRow;

            rentInfoContainer.style.display = 'table'; // show the max affordable rents container
            countyMaxRentsTable.style.display = 'table'; // show the max affordable rents table

            // convert land sq. ft. to acres
            acres = parseFloat(parcelData.lnd_sqfoot) / 43560;
            ////addLoadingLine(`Area = <b>${acres.toFixed(2)} acres</b>...`);
            
            /*
            // populate parcel data table
            const parcelDataRow = `
                <tr>
                    <td>${parcelData.own_name}</td>
                    <td>${parcelData.parcel_id}</td>
                    <td>${acres.toFixed(2)}</td>
                    <td>${useCodeLookup[parcelData.dor_uc] || parcelData.dor_uc}</td>
                </tr>
            `;
            parcelDataTableBody.innerHTML = parcelDataRow;
            ////parcelDataTableBody.style.display = 'block'; // show the parcel data table
            parcelDataTableBody.style.display = 'none'; // hide the parcel data table
            */

            // scroll to top of map after everything is loaded x1
            //googlemap.scrollIntoView();
            window.scrollTo(0, 0);
            

            
            /* USER INPUTS SECTION START */

            // unhide tables and I/O sections            
            /*
            ////parcelDataTable.style.display = 'table'; // parcel data
            developmentProgramInputSection.style.display = 'block'; // development program inputs (??)
            unitCalculationTable.style.display = 'block'; // unit counts
            marketRateInputSection.style.display = 'block'; // market rate rent inputs
            rentPerSqFtTableSection.style.display = 'block'; // rent per Sq Ft
            abatementTable.style.display = 'block'; // property tax abatement
            // ...
            landAndTotalHcInputSection.style.display = 'block';
            landAndTotalHcOutputSection.style.display = 'block';
            // ...
            */



            // set acreage input placeholder
            acreageInput.value = acres.toFixed(2); // ACREAGE AUTO/MANUAL INPUT

            // set density input placeholder
            const maxDensity = await getMaxDensity(countyData.county_name, cityData.cityName);
            if (maxDensity !== null) {
                ////console.log ("Maximum allowed density in", countyData.county_name, cityData.cityName, ":", maxDensity);
                // set global
                maxMuniDensity = maxDensity;
            } else {
                console.log ("WARNING: Maximum municipal density was not found!")
                // set global
                maxMuniDensity = 0;
            }
            densityInput.value = maxMuniDensity.toFixed(0); // DENSITY AUTO/MANUAL INPUT

            // get Municipality Name in Proper Case for cleaner display      
            if (cityNameProper.toLowerCase() === "unincorporated") {
                displayMuniName = "unincorporated " + countyNameProper + " County";
            } else {
                displayMuniName = cityNameProper;
            }
            ////addLoadingLine(`Max density in ${displayMuniName} is <b>${maxDensity.toFixed(0)} units/acre</b>...`);

            // calculate the parcel's absolute maximum unit capacity
            maxCapacity = parseFloat(maxMuniDensity) * parseFloat(acres);
            maxCapacity = maxCapacity.toFixed(0);
            ////addLoadingLine(`Ceiling of <b>${maxCapacity} units</b>...`);

            
            buildingHeight = parseFloat(buildingHeight);

            // Get detailed eligibility
            if (maybeEligibleCodes.includes(parcelData.dor_uc)) {
                // NEW: Set site to orange
                document.documentElement.style.setProperty('--hue', '25'); // For orange
                ////addLoadingLine(`<b><u>NOT ELIGIBLE</u> for Live Local!</b>`);
                eligibilityDiv.innerHTML += `<h3 style="color:orange;" align="center">Your site is probably <u>NOT ELIGIBLE</u> for Live Local development.</h3> 
                </br>Believe it or not, a property can't qualify if it's already residential.`;
                //eligibilityDiv.style.color = "Orange";
                eligibilityDiv.style.fontSize = "18px";
            } else if (eligibleCodes.includes(parcelData.dor_uc)) {
                // NEW: Set site to green
                document.documentElement.style.setProperty('--hue', '120'); // For green
                ////addLoadingLine(`<b><u>ELIGIBLE</u> for Live Local!</b>`);
                console.log("MAX HEIGHT:", buildingHeight, "feet");
                eligibilityDiv.innerHTML += `<h3 style="color:green;" align="center">Your site is <u>ELIGIBLE</u> for Live Local development!</h3> 
                    </br></br><b><i>Coolio 😎👍</b></i> Now here's why you should <i><b>grab this land by the dirt</b></i> and <b><i>Live Local</i></b> on it:
                    </br></br>First, you can build <i>up to the height of the <b>tallest building within a mile</b> radius</i>. 
                    </br></br>That would allow <i>up to <b><u>${buildingHeight.toFixed(0)} feet</u></b> here</i>. <b><i>Oh my! 😮</b></i>`
                /*if (buildingHeight >= 200) {
                    eligibilityDiv.innerHTML += ` <i><b>Wow!</b> That's a lot of juicy feet 👀👣. </i>`;
                }*/
                //eligibilityDiv.style.color = "green";
                eligibilityDiv.style.fontSize = "18px";
            } else {
                // NEW: Set site to red
                document.documentElement.style.setProperty('--hue', '360'); // For red
                ////addLoadingLine(`<b><u>NOT ELIGIBLE</u> for Live Local!</b>`);
                eligibilityDiv.innerHTML += `<h3 style="color:red;" align="center">Your site is likely <u>NOT ELIGIBLE</u> for Live Local development. </h3> <br> It needs to already be commercial or industrial to qualify.`;
                //eligibilityDiv.style.color = "red";
                eligibilityDiv.style.fontSize = "18px";
            }
            summaryContent = eligibilityDiv.innerHTML;
            //console.log("\nSummary Content 1:\n", summaryContent);

            // if parcel is LLA eligible, then finish composing the eligibility + AI summary
            if (eligibleCodes.includes(parcelData.dor_uc)) {
                // add LLA density limit explainer section
                summaryContent += `
                    </br></br>
                    The Act also allows you to match the <i><b>highest density</b> allowed <b>anywhere</b> in ${displayMuniName}</i>.  <b><i>Radical!</i></b>
                    </br></br>And the highest density is </i><b>${maxMuniDensity} units/acre</b></i> among all existing multifamily in ${displayMuniName}.
                    `;

                // if max unit capacity is excessive/unrealistic for multifamily, add a small note acknowledging that
                if (maxCapacity >= 1000) {
                    summaryContent += `
                    </br></br>
                    The maximum-achievable yield here is <b><u><i>${maxCapacity} units</i></u></b>... but that's <b><i>a lot</i></b> of units. 
                    It might be unrealistic for a multifamily development to physically and/or feasibly achieve that on just ${acres.toFixed(2)} acres... 
                    </br></br>But, hey, what do I know? <b><i>Go shoot for the moon!</i></b>.
                    `;
                } else {
                    summaryContent += `
                    </br></br>
                    The max. achievable yield on this ${acres.toFixed(2)}-acre parcel would be <i><u><b>${maxCapacity} units</b></u></i> if approved through Live Local.
                    `;
                }


                /* Generate the final AI summary */

                // Prepare and refine the supplemental data
                const cleanerData = refineData(dirtyData, superAI);
                ////console.log("Clean property data: \n", cleanerData);
                
                // (Master prompt dispatcher) 
                // Sends primary prompts, compiles responses, then gets and returns SER response
                aiGeneratedHTML = await fetchAiResponsesCombined(cleanerData, superAI); // send perfect supplemental data to the master dispatcher to inform all prompts

                // check SER response
                if (!aiGeneratedHTML || aiGeneratedHTML.length === 0) {
                    throw new Error('[CRITICAL] Error: The AI-generated HTML is totally blank!');
                }

                // log it
                //console.log("\n\n***** FINAL ANALYSIS ***** \n", aiGeneratedHTML);

                // format the AI summary and add to div
                //summaryContent += composeAiResponsesCombined(aiGeneratedHTML); // show my written output first
                summaryContent = composeAiResponsesCombined(aiGeneratedHTML); // show AI output only

            } else {
                // -------------------------------------- //
                //         *** CHANGE THIS! ***           //
                // -------------------------------------- //
                // No LLA density limit explanation added //
                // since this parcel is not LLA-qualified //
                

                /* NEW: Generate the final AI summary anyway despite ineligibility */

                // Prepare and refine the supplemental data
                //const cleanerData = refineData(dirtyData);
                // (Master prompt dispatcher) 
                // Sends primary prompts, compiles responses, then gets and returns SER response
                //aiGeneratedHTML = await fetchAiResponsesCombined(cleanerData); // send perfect supplemental data to the master dispatcher to inform all prompts
                // check SER response
                //if (!aiGeneratedHTML || aiGeneratedHTML.length === 0) {throw new Error('[CRITICAL] Error: The AI-generated HTML is totally blank!');}
                // log it
                //console.log("\n\n***** FINAL ANALYSIS ***** \n", aiGeneratedHTML);
                // format the AI summary and add to div
                //summaryContent = composeAiResponsesCombined(aiGeneratedHTML); // show AI output only
            }

            // scroll to top
            //loadingContainer.scrollIntoView;
            window.scrollTo(0, 0);

            // set AI+Eligibility div content
            eligibilityDiv.innerHTML = summaryContent;            
            // display div
            eligibilityDiv.style.display = 'block';
            // fade in div
            animateTextFadeIn(eligibilityDiv);


            /* Start -- Land Development Input/Output Section */
            
            // Run initial calculations using loaded & default values
            calculateMaximumUnits();
            calculateWeightedAverageSizes();
            updateRentPerSqFtTable();
            updateTotalCosts();
            calculateAbatement();
            
            /* End -- Land Development Input/Output Section */



            // hide loading indicator
            //loadingContainer.scrollIntoView;
            window.scrollTo(0, 0);
            loadingContainer.style.display = 'none';       

            // scroll to top again
            //googlemap.scrollIntoView();
            window.scrollTo(0, 0);
            
        } catch (error) {
            const loadingContainer = document.querySelector('.loading-container');
        
            if (error.message.startsWith("Server responded with")) {
                console.error('Server error:', error);
                loadingContainer.style.color = "red";
            } else if (error.message.startsWith("Took too long")) {
                console.error('Server error:', error);
                location.reload(); // Reload the page
            } else {
                console.error('Error:', error);
                loadingContainer.style.color = "grey";
            }
        }
    });

    // Dynamically load the Google Maps & Places APIs
    loadGoogleMapsAPI();

});


