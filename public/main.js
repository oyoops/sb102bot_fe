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
            const compsModuleResult = await runCompsModule(lat, lng, COMPS_SEARCH_RADIUS_MILES);
            //console.log("Comps Analysis: \n" + JSON.stringify(compsModuleResult));
    
            // CITY DATA
            const cityData = await checkCity(geocodeData);        
    
            // COUNTY DATA
            const countyData = await fetchCountyData(lat, lng);
    
            
            // MUNI. NAME
            /* [Method A] NEW! Testing; Not currently in use. */
            const muniName = getMunicipality(cityData, countyData);
            console.log("Municipality (testing): \n", muniName);
            /* [Method B] OLD! Reliable; Currently in use. */
            let muniNameProper;
            if (cityNameProper.toLowerCase() === "unincorporated") {
                muniNameProper = "Unincorporated " + countyNameProper + " County";
            } else {
                muniNameProper = cityNameProper;
            }
            displayMuniName = muniNameProper; // (hackily set global)            
            console.log("Municipality (current): \n", displayMuniName);


            // MAX MUNI. DENSITY
            const maxDensity = await getMaxDensity(countyData.county_name, cityData.cityName);
            maxMuniDensity = maxDensity; //// (hackily set global)
            console.log("Max municipal density: \n", maxMuniDensity,"units per acre");
            

            // PARCEL DATA
            const parcelData = await fetchParcelData(lat, lng, countyData.county_name);            
            acres = (parseFloat(parcelData.lnd_sqfoot) / 43560).toFixed(2);
            console.log("Parcel area: \n", acres, "acres");


            // MAX UNIT CAPACITY
            maxCapacity = parseFloat(maxMuniDensity) * acres;
            maxCapacity = maxCapacity.toFixed(0);
            console.log("Parcel max unit capacity: \n", maxCapacity,"total units");


            // ...

            
            // Show try again button
            tryAgainButton.style.display = 'block';

            // Set colors based on Live Local eligibility
            if (maybeEligibleCodes.includes(parcelData.dor_uc)) {
                document.documentElement.style.setProperty('--hue', '360'); // red
                //document.documentElement.style.setProperty('--hue', '25'); // orange
            } else if (eligibleCodes.includes(parcelData.dor_uc)) {
                document.documentElement.style.setProperty('--hue', '120'); // green
            } else {
                document.documentElement.style.setProperty('--hue', '360'); // red
            }

            // Populate and show Table #2 (Comps avg. vs Affordable max. rent comparison)
            rentsTableBody.innerHTML = generateAffordableTableHTML(countyData,compsData);
            rentInfoContainer.style.display = 'table'; // show the container
            countyMaxRentsTable.style.display = 'table'; // show the table


            // ...


            /* Generate AI */
            try {
                // Start building the supplemental data set for AI beginning with parcelData
                verifyParcelData(parcelData);
                aiSupplementalData = JSON.parse(JSON.stringify(parcelData));
                
                // Generate AI HTML content
                const aiContentHTML = await runAIModule(superAI, aiSupplementalData, countyData, cityData);
                
                // Show AI response
                eligibilityDiv.innerHTML = aiContentHTML;
                eligibilityDiv.style.display = 'block';
                window.scrollTo(0, 0);
                animateTextFadeIn(eligibilityDiv);

                // Hide loading indicator
                loadingContainer.style.display = 'none'; 

                /* Done! */

            } catch (error) {
                console.error('Error:', error);
                handleAIError(error);
            }
            
            // Get and show final AI content
            summaryContent = composeAiResponsesCombined(aiGeneratedHTML); // puts in HTML wrapper
            eligibilityDiv.innerHTML = summaryContent;
            eligibilityDiv.style.display = 'block';
            window.scrollTo(0, 0);

            // Fade in div
            animateTextFadeIn(eligibilityDiv);

            /* Done! */
            
            /* Start: Land Development I/O Section */
            // Run initial development calculations
            ////runInitialDevelopmentCalculations();
            /* End: Land Development I/O Section */ 
            
        } catch (error) {
            if (error.message.startsWith("Server responded with")) {
                console.error('Server error:', error);
                document.documentElement.style.setProperty('--hue', '360'); // red
                tryAgainButton.style.display = 'block';
                loadingContainer.style.display = 'none';
                alert('Sorry, there was an error of the catastrophic variety. \n\nYour device will self-destruct in 35 seconds.');
                //location.reload(); // Reload the page
            } else if (error.message.startsWith("Took too long")) {
                console.error('Server error:', error);
                document.documentElement.style.setProperty('--hue', '360'); // red
                tryAgainButton.style.display = 'block';
                loadingContainer.style.display = 'none';
                alert('Sorry, there was an error of the fatal variety. \n\nYour device will self-destruct in 40 seconds.');
                //location.reload(); // Reload the page
            } else {
                console.error('Error:', error);
                document.documentElement.style.setProperty('--hue', '360'); // red
                tryAgainButton.style.display = 'block';
                loadingContainer.style.display = 'none';
                alert('Sorry, there was an error of the cataclysmic variety. \n\nYour device will self-destruct in 45 seconds.');
                //location.reload(); // Reload the page
            }
        }
    });

    // Dynamically load Google Maps & Places APIs
    loadGoogleMapsAPI();

});


