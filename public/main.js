// main.js - the primary script for SB102bot web app.

/* once the page is fully loaded */
document.addEventListener('DOMContentLoaded', function() {
    window.scrollTo(0, 0); // scroll to top

    // DOM
    const loadingContainer = document.querySelector('.loading-container');
    const mainHeader = document.getElementById("mainHeader");
    const initialContent = document.querySelector('#initialContent');
    const form = document.querySelector('#searchForm');
    const addressInput = document.querySelector('#addressInput');
    const googlemap = document.getElementById('map');
    const countyTableBody = document.querySelector('#countyDataTable tbody');
    const rentsTableBody = document.querySelector('#countyMaxRentsTable tbody');
    const parcelDataTableBody = document.querySelector('#parcelDataTable tbody');
    const eligibilityDiv = document.getElementById("eligibilityStatus");
    const parcelDataTable = document.getElementById('parcelDataTable');
    const developmentProgramInputSection = document.getElementById('developmentProgramInputSection');
    const affordablePercentageSlider = document.getElementById("affordablePctSlider");
    const affordablePctDisplay = document.getElementById('affordablePctDisplay');
    const unitCalculationTable = document.getElementById('unitCalculationTable');
    const sizeInputs = document.querySelectorAll('.sizeInput');
    const marketInputs = document.querySelectorAll('.marketSizeInput');
    const affordableSizeInputs = document.querySelectorAll('.affordableSizeInput');
    const marketRateInputSection = document.getElementById('marketRateInputSection');
    const marketRateInputs = document.querySelectorAll('.marketRateInput');
    const acreageInput = document.getElementById("acreageInput");
    const densityInput = document.getElementById('densityInput');
    const matchAffordableSizesCheckbox = document.getElementById('matchAffordableSizes');
    const rentPerSqFtTableSection = document.getElementById('rentPerSqFtTableSection');
    
    const countyDataTable = document.getElementById('countyDataTable');
    const countyMaxRentsTable = document.getElementById('countyMaxRentsTable');
    
    const landAndTotalHcInputSection = document.getElementById('landAndTotalHcInputSection');
    const landCostPerUnit = document.getElementById('landCostPerUnitInput');
    const totalHCPerUnit = document.getElementById('totalHCPerUnitInput');

    const landAndTotalHcOutputSection = document.getElementById('totalLandAndTotalHcOutputSection');
    
    const abatementTable = document.getElementById('abatementTable');
    const tryAgainButton = document.getElementById("tryAgainButton");

    // on New Search button click:
    tryAgainButton.addEventListener("click", function() {
        location.reload();
    });
    
    // on form submit:
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        address = addressInput.value;

        if (!address) {
            alert('You might want to enter an address first... <br>Just a suggestion, though!');
            return;
        }

        try {
            // hide initial content
            mainHeader.style.display = 'none';  // hide main header
            initialContent.style.display = 'none';  // hide the rest of initial content
            
            // show loading indicators
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
                throw new Error(`Whoops... That address isn't in my coverage area.\nI only know about Florida (and only the good counties at that).`);
            }
            /* Geocode was successful */
            
            // extract coordinates from response
            lat = geocodeData.results[0].geometry.location.lat;
            lng = geocodeData.results[0].geometry.location.lng;

            // fetch the city of the address (Lat,Lng = CityData || CityName = Unincorporated if not in a city)
            const cityCheckEndpoint = `/api/check_city?lat=${lat}&lng=${lng}`;
            const cityCheckResponse = await fetch(cityCheckEndpoint);

            cityData = await cityCheckResponse.json(); // global
            console.log("City Data Received:", cityData);
            
            if (cityData.isInCity) {
                console.log(`Address is within city: ${cityData.cityName}`);
            } else {
                console.log('Address is unincorporated.');
                cityData.cityName = 'unincorporated';
            }
            
            // initialize the map (kind of early...)
            initializeMap(lat, lng);

            // scroll to top of page
            loadingContainer.scrollIntoView;


            /* API blocks: */

            // API block #1 of 3
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

            // API block #2 of 3
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
                return;  // Exit early since we can't proceed without parcel data
            }

            // API block #3 of 3
            try {
                // fetch the AI responses to the set of prompts concerning the parcel data

                // verify that the required supplemental data variable exists
                if (!parcelData || Object.keys(parcelData).length === 0) {
                    console.log(`Skipping AI analysis module; missing parcelData or parcel is simply ineligible for the Live Local Act.`);
                    throw new Error('Sorry, this property is ineligible for the Live Local Act.');
                }
                

                // NEW WAY TO GET PROMPTS! (EXAMPLE)
                generateRefinedSummary('https://docs.google.com/spreadsheets/d/e/2PACX-1vQDEUHmX1uafVBH5AHDDOibri_dnweF-UQ5wJsubhLM7Z4sX5ifOn1pRNvmgbSCL5OMYW-2UVbKTUYc/pubhtml', 'A', parcelData).then(summary => {
                    console.log("PROMPT_SOURCE V2 data: \n" + summary);
                });
                
                
                aiResponses = await fetchAiResponsesCombined(parcelData);
                
                // verify and log
                if (!aiResponses || aiResponses.length === 0) {
                    throw new Error('[CRITICAL ERROR] No responses were received from the AI!');
                }
                console.log("AI Responses:", aiResponses);
            } catch (error) {
                console.error("[CRITICAL ERROR] Unknown error while trying to fetch AI responses.", error);
                return;
            }

            // convert [CITY] and [county] to Proper Case for cleaner display
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
                eligibilityDiv.innerHTML += `<h3 style="color:orange;" align="center">The property is probably <u>NOT</u> ELIGIBLE for Live Local development...</h3> <br>It can't <i>already</i> be a residential/multifamily property to qualify.`;
                //eligibilityDiv.style.color = "Orange";
                eligibilityDiv.style.fontSize = "18px";
            } else if (eligibleCodes.includes(parcelData.dor_uc)) {
                buildingHeight = parseFloat(buildingHeight);
                console.log("MAX HEIGHT:", buildingHeight, "feet");
                eligibilityDiv.innerHTML += `<h3 style="color:green;" align="center">The property looks <u>ELIGIBLE</u> for Live Local development!</h3> 
                    </br><b><i>Coolio 😎👍</b></i> That means, among other benefits, you can build <b>as high as the tallest building</b> within a one-mile radius. 
                    Here, that'd mean up to <b>${buildingHeight.toFixed(0)} feet</b> in height! I've added it to the map of the subject. They're ${distanceInMilesToTallestBldg.toFixed(2)} miles apart.`
                /*if (buildingHeight >= 200) {
                    eligibilityDiv.innerHTML += ` <i><b>Wow!</b> That's a lot of juicy feet 👀👣. </i>`;
                }*/
                //eligibilityDiv.style.color = "green";
                eligibilityDiv.style.fontSize = "18px";
            } else {
                eligibilityDiv.innerHTML += `<h3 style="color:red;" align="center">The property is probably <u>NOT</u> ELIGIBLE for Live Local development... </h3> <br> It must be <b>commercial</b> or <b>industrial</b> <i>already</i> to qualify.`;
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
                summaryContent += `</br></br>The Act also allows developers to match the <b>highest density allowed anywhere in the municipality. </b> <i>Radical! </i>
                    The highest density in ${displayMuniName} among existing apartments is <b>${maxMuniDensity} units per acre</b>, per my unofficial (but awesome) data.`;                

                // if max unit capacity is excessive/unrealistic for multifamily, add a small note acknowledging that
                if (maxCapacity >= 1000) {
                    summaryContent += `</br></br>The maximum-achievable yield is <b><u>${maxCapacity} units</b></u> here, but that's <b><i>a lot</i></b> of units. It's probably unrealistic for a multifamily development to feasibly and/or physically achieve such density on ${acres.toFixed(2)} acres... But, hey; shoot for the moon! I'm just here to give you the numbers.`;
                } else {
                    summaryContent += `</br></br>The maximum-achievable yield is <u><b>${maxCapacity} units</b></u> here.`;// ${acres.toFixed(2)}-acre parcel.`;
                }

                // Add the combined AI summary to bottom of the eligibility text
                summaryContent += composeAiResponsesCombined(aiResponses);

            } else {
                // DON'T add the LLA density limit-explainer since this parcel isn't LLA-qualified.
            }

            // Show Google Map we initialized earlier
            document.getElementById('map').style.display = 'block';

            // Set div content and display
            //   (Div content = Eligibility text + Combined AI summary)
            eligibilityDiv.innerHTML = summaryContent; // reset div content
            eligibilityDiv.style.display = 'block';

            // Fade the div content in slowly
            animateTextFadeIn(eligibilityDiv); // fade text in to simulate AI talking


            /* Land Development Inputs Section */

            // affordable percentage slider
            affordablePercentageSlider.value = 40; // 0.40; // default = 40% affordable units
            affordablePercentageSlider.oninput = function() {
                // recalculate unit sizes and revenues on slider change
                calculateWeightedAverageSizes();
                updateRentPerSqFtTable();
                
            }

            /* Event Listeners: */

            // on acreage [A ac.] input:
            acreageInput.addEventListener('input', function() {
                // Recalculate unit counts and revenues
                calculateMaximumUnits();
                updateRentPerSqFtTable();
                
            });
            // on density [D units/ac.] input:
            densityInput.addEventListener('input', function() {
                // Recalculate unit counts and revenues
                calculateMaximumUnits();
                updateRentPerSqFtTable();
                
            });
            // on affordable % slider [%aff] change:
            affordablePercentageSlider.addEventListener('input', function() {
                affordablePctDisplay.innerText = `${this.value}%`;
                // Recalculate unit counts and revenues
                calculateMaximumUnits();
                updateRentPerSqFtTable();
                
            });
            // on all SqFt/unit [s SqFt] inputs:
            sizeInputs.forEach(input => {
                input.addEventListener('input', () => {
                    // Recalculate unit counts, unit sizes, and revenues
                    calculateMaximumUnits(); // unnecessary?
                    calculateWeightedAverageSizes();
                    updateRentPerSqFtTable();
                    
                });
            });
            // on market-rate SqFt/unit [s SqFt(mkt)] inputs: (if checkbox = checked)
            marketInputs.forEach((input, index) => {
                input.addEventListener('input', () => {
                    if (matchAffordableSizesCheckbox.checked) {
                        affordableSizeInputs[index].value = input.value;
                        // Recalculate unit sizes
                        calculateWeightedAverageSizes();
                    }
                });
            });
            // on market-rate rent per unit [$ Rent(mkt)] inputs:
            marketRateInputs.forEach(input => {
                input.addEventListener('input', function() {
                    // Recalculate revenues
                    updateRentPerSqFtTable();
                    
                });
            });
            // on checkbox change:
            matchAffordableSizesCheckbox.addEventListener('change', function() {
                const affordableInputs = affordableSizeInputs;    
                //      Checked   = Lock affordable avg. size inputs; keep them matched to corresponding market-rate sizes.
                //      Unchecked = Unlock affordable avg. size inputs; allow affordable units to have different avg. sizes.
                if (this.checked) {
                    // checkbox = checked
                    affordableInputs.forEach((input, index) => {
                        input.value = marketInputs[index].value;
                        input.disabled = true;
                    });
                } else {
                    // checkbox = unchecked
                    affordableInputs.forEach(input => input.disabled = false);
                }
                // Recalculate unit counts, unit sizes, and revenues
                calculateMaximumUnits();
                calculateWeightedAverageSizes();
                updateRentPerSqFtTable();
                
            });
            // on cost inputs change:
            landCostPerUnit.addEventListener('input', updateTotalCosts);
            totalHCPerUnit.addEventListener('input', updateTotalCosts);

            // (more event listeners...)
            
            
            // run initial calculations using loaded & default values
            calculateMaximumUnits();
            calculateWeightedAverageSizes();
            updateRentPerSqFtTable();
            updateTotalCosts();
            calculateAbatement();
            
            /* USER INPUTS SECTION END. */
            
            // scroll to top x2
            googlemap.scrollIntoView();
            window.scrollTo(0, 0);
            
        } catch (error) {
            if (error.message.startsWith("Server responded with")) {
                console.error('Server error:', error);
                alert('There was an error with the server. Darn! Please try again later.');
            } else {
                console.error('Error:', error);
                // to-do: significantly improve error handling.
                alert('Whoops, something bad happened and I failed...\nTry again, I was probably just hella busy for a minute.');
            }
        }
    });

    // Dynamically load the Google Maps API
    loadGoogleMapsAPI();

});


