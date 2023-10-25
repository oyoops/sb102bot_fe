// main.js - primary script for the sb102bot web app

// get event listeners
import './eventListeners.js';
// get DOM elements
import {
    loadingContainer, initialContent, eligibilityDiv, developmentProgramInputSection,
    marketRateInputSection, rentPerSqFtTableSection, landAndTotalHcInputSection, landAndTotalHcOutputSection,
    mainHeader,
    parcelDataTable, parcelDataTableBody, countyDataTable, countyTableBody, countyMaxRentsTable, rentsTableBody,
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
    
    // on form submit:
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get user input (dirty address) 
        address = addressInput.value;
        if (!address) {
            alert('Ummm, you might want to try typing an address first? Just a suggestion, though...');
            return;
        }

        // ONE HUGE TRY BLOCK
        try {
            // hide header and initial content
            mainHeader.style.display = 'none';
            initialContent.style.display = 'none';
            // display fake loading progress bar
            updateLoadingBar();
            loadingContainer.style.display = 'block';

            // geocode the input address
            const geocodeEndpoint = `/api/geocode?address=${encodeURIComponent(address)}`;
            const geocodeResponse = await fetch(geocodeEndpoint);
            if (!geocodeResponse.ok) {
                console.log('ERROR: Geocode failed!');
                throw new Error(`Server responded with ${geocodeResponse.status}: ${await geocodeResponse.text()}`);
            }
            geocodeData = await geocodeResponse.json();
            console.log("Geocode Data Received:", geocodeData);
            if (!geocodeData.results || geocodeData.results.length === 0) {
                throw new Error(`Whoops... That address isn't in my domain.\nI only know about Florida (and only the good counties at that).`);
            }

            /* Geocode was successful */
            
            // extract coordinates from geo data
            lat = geocodeData.results[0].geometry.location.lat;
            lng = geocodeData.results[0].geometry.location.lng;

            // fetch the city of the address (Lat,Lng = CityData || CityName = Unincorporated if not in a city)
            const cityCheckEndpoint = `/api/check_city?lat=${lat}&lng=${lng}`;
            const cityCheckResponse = await fetch(cityCheckEndpoint);
            cityData = await cityCheckResponse.json(); // global
            if (cityData.isInCity) {
                console.log(`Address is in city: ${cityData.cityName}`);
            } else {
                console.log('Address is unincorporated.');
                cityData.cityName = 'unincorporated';
            }
            


            // initialize the map (is this too early?)
            initializeMap(lat, lng);



            // scroll to top
            //loadingContainer.scrollIntoView;



            /* API blocks: */


            // API block #1 of 3: COUNTY DATA
            try {
                // fetch the county data for the address (Lat,Lng = CountyData)
                const countyDataEndpoint = `/api/load_county_table?lat=${lat}&lng=${lng}`;
                const countyDataResponse = await fetch(countyDataEndpoint);
                
                countyData = await countyDataResponse.json();
                console.log("County Data Received:", countyData);
                
                if (!countyData.county_name) {
                    throw new Error;
                }
            } catch (error) {
                console.error("Error fetching county data:\n", error);
                alert("Looks like we hit a roadblock on County Road! 🛣️\nCouldn't fetch the county data.");
                return;  // Exit early since we can't proceed without county data
            }





            // API block #2 of 3: CITY DATA
            try {
                // fetch the parcel data for the address (Lat,Lng + County = ParcelData)
                const parcelDataEndpoint = `/api/load_parcel_data?lat=${lat}&lng=${lng}&county_name=${countyData.county_name}`;
                const parcelDataResponse = await fetch(parcelDataEndpoint);
                
                parcelData = await parcelDataResponse.json();
                console.log("Parcel Data Received:", parcelData);
                if (!parcelData || Object.keys(parcelData).length === 0) {
                    throw new Error('Missing or empty parcel data');
                }            
            } catch (error) {
                console.error("Error fetching parcel data:\n", error);
                alert("We tried to lay the foundation, but hit a snag with the parcel! 🏗️\nCouldn't fetch the parcel data.");
                return;  // Exit early (can't proceed without parcel data)
            }






            // API block #3 of 3: AI RESPONSES
            try {
                // verify parcelData exists
                if (!parcelData || Object.keys(parcelData).length === 0) {
                    console.log(`Skipping AI analysis module.`);
                    throw new Error('Sorry, this property is not eligible, buddy.');
                }

                // make copy of parcelData for enhancing
                aiSupplementalData = JSON.parse(JSON.stringify(parcelData));
                
                // add primitive values directly
                /*
                aiSupplementalData.address = address;
                aiSupplementalData.lat = lat;
                aiSupplementalData.lng = lng;
                aiSupplementalData.acres = acres;
                aiSupplementalData.cityNameProper = cityNameProper;
                aiSupplementalData.countyNameProper = countyNameProper;
                aiSupplementalData.displayMuniName = displayMuniName;
                aiSupplementalData.totalUnits = totalUnits;
                aiSupplementalData.marketUnits = marketUnits;
                aiSupplementalData.affordableUnits = affordableUnits;
                aiSupplementalData.maxCapacity = maxCapacity;
                */
               
                // decompose both JSONs and add their values
                if (countyData) {
                    // countyData *must* stay in simple flat JSON form; will need a recursive merge if I ever add nested objects
                    for (const [key, value] of Object.entries(countyData)) {
                        aiSupplementalData[`county_${key}`] = value;  // Prefixing with "county_" to ensure uniqueness
                    }
                }
                if (cityData) {
                    // cityData *must* stay in simple flat JSON form; will need a recursive merge if I ever add nested objects
                    for (const [key, value] of Object.entries(cityData)) {
                        aiSupplementalData[`city_${key}`] = value;  // Prefixing with "city_" to ensure uniqueness
                    }
                }

                /* Enhanced data is now prepared! */


                /*
                // NEW WAY TO GET PROMPTS! (EXAMPLE)
                let hmmm;
                generateRefinedSummary('https://docs.google.com/spreadsheets/d/e/2PACX-1vQDEUHmX1uafVBH5AHDDOibri_dnweF-UQ5wJsubhLM7Z4sX5ifOn1pRNvmgbSCL5OMYW-2UVbKTUYc/pubhtml', 'A', aiSupplementalData).then(summary => {
                    hmmm = summary;
                    console.log("Hmmm = " + hmmm);
                });
                */


                // send enriched supplemental data to AI server
                aiResponses = await fetchAiResponsesCombined(aiSupplementalData);
                ////////////aiResponses = await fetchAiResponsesCombined(parcelData);



                // verify and log
                if (!aiResponses || aiResponses.length === 0) {
                    throw new Error('[CRITICAL ERROR] No responses received from the AI.');
                }
                console.log("AI Responses:", aiResponses);
            } catch (error) {
                console.error("[CRITICAL ERROR] Unknown error while fetching AI responses.", error);
                return;
            }

            // convert city & county names to Proper Case for a cleaner look
            cityNameProper = toProperCase(cityData.cityName);
            countyNameProper = specialCountyFormatting(countyData.county_name);

            // hide loading indicator
            loadingContainer.scrollIntoView;
            loadingContainer.style.display = 'none';            

            // show Try Again button
            tryAgainButton.style.display = 'block';
            
            // ...
            // MILLAGE MANUAL ADJUSTMENT
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
            countyDataTable.style.display = 'table'; // show the county (and city*) data table
            
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
            countyMaxRentsTable.style.display = 'table'; // show the max affordable rents table

            // Get detailed eligibility
            if (maybeEligibleCodes.includes(parcelData.dor_uc)) {
                eligibilityDiv.innerHTML += `<h3 style="color:orange;" align="center">Your site is probably <u>NOT ELIGIBLE</u> for Live Local development.</h3> <br>It can't qualify if it's <i>already</i> residential, believe it or not...`;
                //eligibilityDiv.style.color = "Orange";
                eligibilityDiv.style.fontSize = "18px";
            } else if (eligibleCodes.includes(parcelData.dor_uc)) {
                buildingHeight = parseFloat(buildingHeight);
                console.log("MAX HEIGHT:", buildingHeight, "feet");
                eligibilityDiv.innerHTML += `<h3 style="color:green;" align="center">Your site is <u>ELIGIBLE</u> for Live Local development!</h3> 
                    </br></br><b><i>Coolio 😎👍</b></i> Now here's why you should <i><b>grab this land by the dirt</b></i> and start <b><i>Living Local on the bitch!</i></b>
                    </br></br>First, you can build <i>up to the height of the <b>tallest building within a mile</b> radius</i>. 
                    </br></br>That would allow <i>up to <b><u>${buildingHeight.toFixed(0)} feet</u></b> here</i>. <b><i>Oh my! 😮</b></i>`
                /*if (buildingHeight >= 200) {
                    eligibilityDiv.innerHTML += ` <i><b>Wow!</b> That's a lot of juicy feet 👀👣. </i>`;
                }*/
                //eligibilityDiv.style.color = "green";
                eligibilityDiv.style.fontSize = "18px";
            } else {
                eligibilityDiv.innerHTML += `<h3 style="color:red;" align="center">Your site is likely <u>NOT ELIGIBLE</u> for Live Local development. </h3> <br> It needs to <i>already</i> be <b>commercial</b> or <b>industrial</b> to qualify.`;
                //eligibilityDiv.style.color = "red";
                eligibilityDiv.style.fontSize = "18px";
            }
            summaryContent = eligibilityDiv.innerHTML;

            // convert land sq. ft. to acres
            acres = parseFloat(parcelData.lnd_sqfoot) / 43560;
            
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

            // scroll to top of map after everything is loaded x1
            //googlemap.scrollIntoView();
            //window.scrollTo(0, 0);
            

            /* USER INPUTS SECTION START */

            // unhide tables and I/O sections            
            parcelDataTable.style.display = 'table'; // parcel data
            developmentProgramInputSection.style.display = 'block'; // development program inputs (??)
            unitCalculationTable.style.display = 'block'; // unit counts
            marketRateInputSection.style.display = 'block'; // market rate rent inputs
            rentPerSqFtTableSection.style.display = 'block'; // rent per Sq Ft
            abatementTable.style.display = 'block'; // property tax abatement
            // ...
            landAndTotalHcInputSection.style.display = 'block';
            landAndTotalHcOutputSection.style.display = 'block';
            // ...


            // set acreage input placeholder
            acreageInput.value = acres.toFixed(2); // ACREAGE AUTO/MANUAL INPUT

            // set density input placeholder
            const maxDensity = await getMaxDensity(countyData.county_name, cityData.cityName);
            if (maxDensity !== null) {
                console.log ("Maximum municipal density found for", countyData.county_name, cityData.cityName, ":", maxDensity);
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

            // calculate the parcel's absolute max unit capacity
            maxCapacity = parseFloat(maxMuniDensity) * parseFloat(acres);
            maxCapacity = maxCapacity.toFixed(0);

            // if parcel is LLA eligible, then finish composing the eligibility and AI summary
            if (eligibleCodes.includes(parcelData.dor_uc)) {
                // LLA density limit explainer section
                summaryContent += `
                    </br></br>
                    The Act also allows you to match the <i><b>highest density</b> allowed <b>anywhere</b> in the municipality</i>.  <b><i>Radical!</i></b>
                    </br>And the highest density among all existing multifamily in ${displayMuniName} is </i><b>${maxMuniDensity} units/acre</b></i>.
                    `;

                // if max unit capacity is excessive/unrealistic for multifamily, add a small note acknowledging that
                if (maxCapacity >= 1000) {
                    summaryContent += `
                    </br></br>
                    The maximum-achievable yield here is <b><u>${maxCapacity} units</b></u>... but that's <b><i>a lot</i></b> of units. 
                    It might be unrealistic for a multifamily development to physically and feasibly achieve that kind of density on ${acres.toFixed(2)} acres... 
                    </br>But, hey, shoot for the moon! I'm only here to shove numbers up your ass.
                    `;
                } else {
                    summaryContent += `
                    </br></br>
                    The maximum achievable yield here is <u><b>${maxCapacity} units</b></u>.
                    `;
                }

                // Add the combined AI summary to bottom of the ultimate eligibility text
                summaryContent += composeAiResponsesCombined(aiResponses);

            } else {
                //           CHANGE THIS!!!               //
                // -------------------------------------- //
                // No LLA density limit explanation added //
                // since this parcel is not LLA-qualified //
            }

            // Reset content of AI+Eligibility div
            eligibilityDiv.innerHTML = summaryContent;
            
            // Display AI+Eligibility div
            eligibilityDiv.style.display = 'block';

            // Display Google Map
            googlemap.style.display = 'block';
            
            // Slowly fade in content of AI+Eligibility div
            animateTextFadeIn(eligibilityDiv);


            




            /* Start -- Land Development Input/Output Section */
            
            // Run initial calculations using loaded & default values
            calculateMaximumUnits();
            calculateWeightedAverageSizes();
            updateRentPerSqFtTable();
            updateTotalCosts();
            calculateAbatement();
            
            /* End -- Land Development Input/Output Section */            
            
            // scroll to top again
            googlemap.scrollIntoView();
            window.scrollTo(0, 0);
            
        } catch (error) {
            if (error.message.startsWith("Server responded with")) {
                console.error('Server error:', error);
                alert('There was an error with the server. Darn! Please try again later.');
            } else {
                console.error('Error:', error);
                // to-do: significantly improve error handling.
                alert('Whoops, something bad happened and I failed...\nTry again. I was probably just hella busy for a minute.');
            }
        }
    });

    // Dynamically load the Google Maps & Places APIs
    loadGoogleMapsAPI();

});


