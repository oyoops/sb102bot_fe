// main.js - the primary script for SB102bot web app.

/* once the page is fully loaded */
document.addEventListener('DOMContentLoaded', function() {
    window.scrollTo(0, 0); // scroll to top

    // DOM
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
            document.querySelector('.loading-container').style.display = 'block';

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
            
            /*
            // fetch the county data for the address (Lat,Lng = CountyData)
            const countyDataEndpoint = `/api/load_county_table?lat=${lat}&lng=${lng}`;
            const countyDataResponse = await fetch(countyDataEndpoint);
            countyData = await countyDataResponse.json(); // global
            console.log("County Data Received:", countyData);
            if (!countyData.county_name) {
                throw new Error('No county data available for the address.');
            }
            
            // fetch the parcel data for the address (Lat,Lng + County = ParcelData)
            const parcelDataEndpoint = `/api/load_parcel_data?lat=${lat}&lng=${lng}&county_name=${countyData.county_name}`;
            const parcelDataResponse = await fetch(parcelDataEndpoint);
            parcelData = await parcelDataResponse.json(); // global
            console.log("Parcel Data Received:", parcelData);

            // Now fetch the AI enhancements for the parcel data
            const enhancements = await fetchAiEnhancements(parcelData);
            console.log("AI Enhancements Received:", enhancements);

            displayAiEnhancements(enhancements);
            */


            // #1 of 3
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

            // #2 of 3
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

            // #3 of 3
            try {
                // fetch the AI responses to the set of prompts concerning the parcel data
                aiEnhancements = await fetchAiEnhancements(parcelData);
                if (!aiEnhancements || aiEnhancements.length === 0) {
                    throw new Error('No response received from AI server');
                }
                console.log("AI Enhancements Received:", aiEnhancements);
                displayAiEnhancements(aiEnhancements);
            } catch (error) {
                console.error("Error fetching AI enhancements:\n", error);
                alert("Sorry, I might need a coffee or two... ☕ \nBecause my AI failed to analyze the parcel data.");
            }

            // convert [CITY] and [county] to Proper Case for cleaner display
            cityNameProper = toProperCase(cityData.cityName);
            countyNameProper = specialCountyFormatting(countyData.county_name);

            // show map with placemarks: (1) input address at center of map; (2) the tallest bldg. within 1-mi. radius
            initializeMap(lat, lng);
            // show Try Again button
            document.querySelector('#tryAgainButton').style.display = 'block';  // show try again button
            // hide loading indicator
            document.querySelector('.loading-container').style.display = 'none';            
            
            // ...
            // ...

            // MILLAGE MANUAL ADJUSTMENT
            fakeMillage = parseFloat(countyData.county_millage) + parseFloat(MILLAGE_ADJUSTMENT); // "rough estimate" using known county mills + a constant manual adjustment to approximate state (and perhaps local...) portion of grand total millage
            fakeMillage = parseFloat(fakeMillage).toFixed(4);

            // ...
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
            document.getElementById('countyDataTable').style.display = 'table'; // Unhide
            
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
            document.getElementById('countyMaxRentsTable').style.display = 'table'; // Unhide

    
            // Get detailed eligibility
            if (maybeEligibleCodes.includes(parcelData.dor_uc)) {
                eligibilityDiv.innerHTML += `<h3>This property is LIKELY <u>NOT ELIGIBLE</u> for Live Local development.</h3> <br>Properties that are <u>already</u> residential do not qualify.`;
                eligibilityDiv.style.color = "orange";
                eligibilityDiv.style.fontSize = "18px";
            } else if (eligibleCodes.includes(parcelData.dor_uc)) {
                buildingHeight = parseFloat(buildingHeight);
                console.log("HEIGHT:", buildingHeight, "feet");
                eligibilityDiv.innerHTML += `<h3>This property appears to be <u>ELIGIBLE</u> for Live Local Act development!</h3> 
                    </br><b>This means, among other benefits, that you can build as high as the tallest building within a mile.</b>
                    </br>Here, that ceiling would be <b>${buildingHeight.toFixed(0)} feet tall.</b>`
                if (buildingHeight >= 200) {
                    eligibilityDiv.innerHTML += ` <i><b>(Wow!</b> That's a lot of juicy feet 👀👣)</i>`;
                }
                eligibilityDiv.style.color = "green";
                eligibilityDiv.style.fontSize = "18px";
            } else {
                eligibilityDiv.innerHTML += `<h3>This property seems to be <u>INELIGIBLE</u> for Live Local development.</h3> <br>The property must <u>already</u> be <b>commercial</b> or <b>industrial</b> to qualify!`;
                eligibilityDiv.style.color = "red";
                eligibilityDiv.style.fontSize = "18px";
            }

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
            googlemap.scrollIntoView();
            window.scrollTo(0, 0);
            

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

            

            // ACREAGE AUTO/MANUAL INPUT:
            // set acreage input placeholder
            acreageInput.value = acres.toFixed(2);

            // DENSITY AUTO/MANUAL INPUT:
            const maxDensity = await getMaxDensity(countyData.county_name, cityData.cityName);
            if (maxDensity !== null) {
                console.log ("Maximum municipal density found for", countyData.county_name, cityData.cityName, ":", maxDensity);
                // set global
                maxMuniDensity = maxDensity;
                // set input placeholder
                densityInput.value = maxDensity.toFixed(0);
            } else {
                console.log ("WARNING: Maximum municipal density was not found!")
                // set global
                maxMuniDensity = 0;
                // set input placeholder
                densityInput.value = maxMuniDensity.toFixed(0);
            }

            // get a Proper Case Municipality Name            
            if (cityNameProper.toLowerCase() === "unincorporated") {
                displayMuniName = "unincorporated " + countyNameProper + " County";
            } else {
                displayMuniName = cityNameProper;
            }

            // calculate "max capacity" value
            // MC = max. muni. density * acreage
            maxCapacity = parseFloat(maxMuniDensity) * parseFloat(acres);
            maxCapacity = maxCapacity.toFixed(0);

            if (eligibleCodes.includes(parcelData.dor_uc)) {
                // Second explainer part (max density limit)
                eligibilityDiv.innerHTML += `</br>
                    </br><b>The Act also lets you match the highest density anywhere in the municipality.</b>
                    </br>According to my unofficial data, that's <b>${maxMuniDensity} units per acre in ${displayMuniName}</b>. <i>Tubular!</i>
                    </br></br>Assuming all ${acres.toFixed(2)} acres will be residential at ${maxMuniDensity} units/ac. you're looking at
                    </br>a maximum yield <b>${maxCapacity} units</b> via the Live Local pathway.</b>`;

                // add AI summary below eligibility section (not a great place for it, but w/e...)
                const aiSummaryHtml = displayAiEnhancements(aiEnhancements);
                eligibilityDiv.innerHTML = eligibilityDiv.innerHTML + aiSummaryHtml;
            } else {
                /*
                eligibilityDiv.innerHTML += `</br>You must bring me commercial and industrial properties ONLY!
                    </br></br>Actually, I'm getting pretty sick of being fed mediocre sites all day!!!`;
                */
                eligibilityDiv.innerHTML += `</br><h4><i>Bring me a commercial/industrial property next time.</i></h4>`;
            }
            // show detailed eligibility section
            eligibilityDiv.style.display = 'block';
            // fade its text in quickly to simulate the AI 'speaking' to the user
            animateTextFadeIn(eligibilityDiv);


            // affordable percentage slider
            affordablePercentageSlider.value = 40; // 0.40; // default = 40% affordable units
            affordablePercentageSlider.oninput = function() {
                // Recalculate unit sizes and revenues on slider change
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

            
            /*
            // AI SECTION START            
            const runAIButton = document.getElementById("runAIButton");
            runAIButton.addEventListener('click', runAISection);
               ENDPOINT PARAMS:
                    ASK_AI: 
                        address, 
                        county, 
                        acreage, 
                        totalUnits, 
                        affordablePct,
                        affStudio,
                        aff1BD,
                        aff2BD,
                        aff3BD,
                        textModifier
            // AI SECTION END
            */
            
            // scroll to top x2
            googlemap.scrollIntoView();
            window.scrollTo(0, 0);
            
        } catch (error) {
            if (error.message.startsWith("Server responded with")) {
                console.error('Server error:', error);
                alert('There was an error with the server. Please try again later.');
            } else {
                console.error('Error:', error);
                // to-do: significantly improve error handling.
                alert('Whoops, something bad happened and I broke.\nEither try again or give up. The choice is yours!');
            }
        }
    });

    // Dynamically load the Google Maps API
    loadGoogleMapsAPI();

});


