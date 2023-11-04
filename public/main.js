// main.js - primary script for the sb102bot web app

// get event listeners
import './eventListeners.js';
// get DOM elements
import {
    mainHeader, initialContent, form, addressInput, navButtonsContainer, loadingContainer,
    eligibilityDiv, tryAgainButton, 
    currentBugsContainer, recentUpdatesContainer, futureUpdatesContainer, infoSections,
    googlemap, compsTable,
    developmentProgramInputSection,
    marketRateInputSection, rentPerSqFtTableSection, landAndTotalHcInputSection, landAndTotalHcOutputSection,
    ////parcelDataTable, parcelDataTableBody, 
    rentInfoContainer, countyDataTable, countyTableBody, countyMaxRentsTable, rentsTableBody,
    unitCalculationTable, abatementTable,
    affordablePercentageSlider, affordablePctDisplay, acreageInput, densityInput,
    landCostPerUnit, totalHCPerUnit, matchAffordableSizesCheckbox,
    sizeInputs, marketInputs, affordableSizeInputs, marketRateInputs
} from './domElements.js';


/* once DOM is fully loaded: */
document.addEventListener('DOMContentLoaded', function() {
    window.scrollTo(0, 0); // scroll to top
    //initAutocomplete(); // prepare Places API
    
    // manual add Supercharge AI switch event listener
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
        // Google Analytics -> capture address
        gtag('event', 'Address Submission', {
            'event_category': 'Form',
            'event_label': 'Address Input',
            'value': address
        });

        // ONE HUGE TRY BLOCK
        try {
            console.log(`Submitting ${address} to Live Local Guru w/ SuperAI=${superAI}...`);
            
            // hide header and initial content
            mainHeader.style.display = 'none';
            initialContent.style.display = 'none';
            navButtonsContainer.style.display = 'none';
            infoSections.style.display = 'none';
            currentBugsContainer.style.display = 'none';
            recentUpdatesContainer.style.display = 'none';
            futureUpdatesContainer.style.display = 'none';
            // display fake loading progress bar
            updateLoadingBar();
            loadingContainer.style.display = 'block';
            window.scrollTo(0, 0);

            /* API blocks: */

            // GEO DATA
            const geocodeData = await geocodeAddress(address);
            lat = geocodeData.results[0].geometry.location.lat;
            lng = geocodeData.results[0].geometry.location.lng;

            // TALLEST BLDG. DATA
            // + initializes map
            const tallestBuildingData = await initializeMap(lat, lng);

            // Get Max Height (& distance)
            const maxBH = tallestBuildingData.maxHeight.toFixed(0); // feet
            const maxBD = tallestBuildingData.maxDistance.toFixed(2); // miles
            //console.log("MaxBH =", maxBH, "ft.");
            //console.log("MaxBD =", maxBD, "mi.");
            buildingHeight = maxBH; //// (hackily set global)


            // Display the map
            googlemap.style.display = 'block';
            window.scrollTo(0, 0);


            // COMPS DATA
            try {
                // Search Parameters:
                const exampleLat = lat.toFixed(6);
                const exampleLng = lng.toFixed(6);
                const exampleRadiusMiles = "3.000";

                // Compose URL
                const endpointUrl = "https://www.livelocal.guru/api/get_comps?lat=" + exampleLat + "&lng=" + exampleLng + "&radius=" + exampleRadiusMiles;

                // Pull comps data
                const response = await fetch(endpointUrl);
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                const compsDataObj = await response.json();
                compsData = compsDataObj.data; //// (hackily set global)
                console.log("Comps: \n" + JSON.stringify(compsData));
                
                // Add placemarks to map
                addCompsMarkersToMap(compsData);

                // Populate comps table
                populateCompsTable(compsData);
                //document.getElementById("compsTable").style.display = 'block';

            } catch (error) {
                alert("An unknown error tragically befell me while pulling your comps.")
                console.error("Error while fetching comps: \n", error);
            }
            console.log("Comps module complete.");
    

            // CITY / MUNI. DATA
            const cityData = await checkCity(geocodeData);
            cityNameProper = toProperCase(cityData.cityName);
            

            // COUNTY DATA
            const countyData = await fetchCountyData(lat, lng);
            countyNameProper = specialCountyFormatting(countyData.county_name);

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

            // Get Municipality
            let muniNameProper;
            if (cityNameProper.toLowerCase() === "unincorporated") {
                muniNameProper = "Unincorporated " + countyNameProper + " County";
                ////muniNameProper = "unincorporated " + countyNameProper + " County";
            } else {
                muniNameProper = cityNameProper;
            }
            displayMuniName = muniNameProper; // (hackily set global)

            // Get Max Density
            const maxDensity = await getMaxDensity(countyData.county_name, cityData.cityName);
            maxMuniDensity = maxDensity; //// (hackily set global)
            console.log("MMD:", maxMuniDensity,"units/ac.");
            
            // PARCEL DATA
            const parcelData = await fetchParcelData(lat, lng, countyData.county_name);
            acres = parseFloat(parcelData.lnd_sqfoot) / 43560;

            // Show try again button
            tryAgainButton.style.display = 'block';

            

            // Calculate parcel's maximum LLA unit capacity
            maxCapacity = parseFloat(maxMuniDensity) * acres;
            maxCapacity = maxCapacity.toFixed(0);


            // Set site colors based on Live Local eligibility
            if (maybeEligibleCodes.includes(parcelData.dor_uc)) {
                // Set site to red
                document.documentElement.style.setProperty('--hue', '360'); // red
                //document.documentElement.style.setProperty('--hue', '25'); // orange
            } else if (eligibleCodes.includes(parcelData.dor_uc)) {
                // Set site to green
                document.documentElement.style.setProperty('--hue', '120'); // green
            } else {
                // Set site to red
                document.documentElement.style.setProperty('--hue', '360'); // red
            }

            /* Generate AI */
            try {
                verifyParcelData(parcelData);
                aiSupplementalData = JSON.parse(JSON.stringify(parcelData));
                if (countyData) {
                    enhanceWithCountyData(aiSupplementalData, countyData);
                }
                if (cityData) {
                    enhanceWithCityData(aiSupplementalData, cityData);
                }

                // Compile all supplementary data
                const dirtyData = await getDirtyData(aiSupplementalData);
                ////const dirtyDataString = await getDirtyDataString(aiSupplementalData);
                ////const cleanerData = await refineData(dirtyData, superAI); // refine, add globals, etc
                const cleanerData = refineData(dirtyData, superAI); // refine, add globals, etc
                console.log("AI will get this data: \n", cleanerData);
                
                // Send primary prompts, compile intermediate responses, and get SER response
                aiGeneratedHTML = await fetchAiResponsesCombined(cleanerData, superAI); // <-- Master prompt dispatch
                if (!aiGeneratedHTML || aiGeneratedHTML.length === 0) {
                    throw new Error('[CRITICAL] Error: The AI-generated HTML is totally blank!');
                }

                // Hide loading indicator
                loadingContainer.style.display = 'none'; 
                
                // Get and show final AI content
                summaryContent = composeAiResponsesCombined(aiGeneratedHTML); // show AI output only
                eligibilityDiv.innerHTML = summaryContent;            
                eligibilityDiv.style.display = 'block';
                window.scrollTo(0, 0);

                // Fade in div
                animateTextFadeIn(eligibilityDiv);
                window.scrollTo(0, 0);

            } catch (error) {
                if (error.message.startsWith("[CRITICAL]")) {
                    console.error('AI FAILURE!');
                    document.documentElement.style.setProperty('--hue', '360'); // red
                    tryAgainButton.style.display = 'block';
                    loadingContainer.style.display = 'none';
                    alert('Sorry, there was an unknown error of the catastrophic variety. \n\nYour device will self-destruct in 20 seconds.');
                    //location.reload(); // Reload the page    
                } else {
                    console.error('Unknown AI Error!');
                    document.documentElement.style.setProperty('--hue', '360'); // red
                    tryAgainButton.style.display = 'block';
                    loadingContainer.style.display = 'none';
                    alert('Sorry, there was an unknown error of the catastrophic variety. \n\nYour device will self-destruct in 25 seconds.');
                    //location.reload(); // Reload the page
                }
                return;
            }
            
            /* Start: Land Development I/O Section */
            // Run initial calculations using loaded & default values
            //calculateMaximumUnits();
            //calculateWeightedAverageSizes();
            //updateRentPerSqFtTable();
            //updateTotalCosts();
            //calculateAbatement();
            /* End: Land Development I/O Section */    
            
        } catch (error) {
            if (error.message.startsWith("Server responded with")) {
                console.error('Server error:', error);
                document.documentElement.style.setProperty('--hue', '360'); // red
                tryAgainButton.style.display = 'block';
                loadingContainer.style.display = 'none';
                alert('Sorry, there was an unknown error of the catastrophic variety. \n\nYour device will self-destruct in 35 seconds.');
                //location.reload(); // Reload the page
            } else if (error.message.startsWith("Took too long")) {
                console.error('Server error:', error);
                document.documentElement.style.setProperty('--hue', '360'); // red
                tryAgainButton.style.display = 'block';
                loadingContainer.style.display = 'none';
                alert('Sorry, there was an unknown error of the fatal variety. \n\nYour device will self-destruct in 40 seconds.');
                //location.reload(); // Reload the page
            } else {
                console.error('Error:', error);
                document.documentElement.style.setProperty('--hue', '360'); // red
                tryAgainButton.style.display = 'block';
                loadingContainer.style.display = 'none';
                alert('Sorry, there was an unknown error of the cataclysmic variety. \n\nYour device will self-destruct in 45 seconds.');
                //location.reload(); // Reload the page
            }
        }

    });

    // dynamically load Google Maps & Places APIs
    loadGoogleMapsAPI();

});


