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


// once DOM is fully loaded:
document.addEventListener('DOMContentLoaded', function() {
    window.scrollTo(0, 0); // scroll to top
    //initAutocomplete(); // prepare Places API
    
    // manually add Supercharge AI switch event listener
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
        
        // Send address to Google Analytics
        gtag('event', 'Address Submission', {
            'event_category': 'Form',
            'event_label': 'Address Input',
            'value': address
        });

        // Main script
        try {
            console.log(`Asking Live Local Guru about: \n${address}`);
            
            // Hide header and initial content
            mainHeader.style.display = 'none';
            initialContent.style.display = 'none';
            navButtonsContainer.style.display = 'none';
            infoSections.style.display = 'none';
            currentBugsContainer.style.display = 'none';
            recentUpdatesContainer.style.display = 'none';
            futureUpdatesContainer.style.display = 'none';

            // Display fake loading progress bar
            updateLoadingBar();
            loadingContainer.style.display = 'block';
            window.scrollTo(0, 0);


            /* Start Data Collection Module */

            // GEO DATA
            const geocodeData = await geocodeAddress(address);
            lat = geocodeData.results[0].geometry.location.lat;
            lng = geocodeData.results[0].geometry.location.lng;

            // TALLEST BLDG. DATA (+ initializes map)
            const tallestBuildingData = await initializeMap(lat, lng);

            // Display map
            googlemap.style.display = 'block';
            window.scrollTo(0, 0);

            // MAX BLDG. HEIGHT
            const maxBH = tallestBuildingData.maxHeight.toFixed(0); // feet tall
            const maxBD = tallestBuildingData.maxDistance.toFixed(2); // miles away
            buildingHeight = maxBH; //// (hackily set global)
            //console.log("MaxBH =", maxBH, "ft.");
            //console.log("MaxBD =", maxBD, "mi.");
            
            // COMPS DATA
            const compsModuleResult = await runCompsModule(lat, lng, COMPS_SEARCH_RADIUS_MILES);
            //console.log("Comps Analysis: \n" + JSON.stringify(compsModuleResult));
    
            // CITY DATA
            const cityData = await checkCity(geocodeData);        
    
            // COUNTY DATA
            const countyData = await fetchCountyData(lat, lng);
    
            // GET MUNI. NAME
            const muniName = getMunicipality(cityData, countyData);
            displayMuniName = muniName //// (hackily set global)
            console.log("Municipality:", displayMuniName);

            // MAX MUNI. DENSITY
            const maxDensity = await getMaxDensity(countyData.county_name, cityData.cityName);
            maxMuniDensity = Math.min(maxDensity, 100); // Takes the lesser of maxDensity or 100
            console.log("Max municipal density: \n", maxMuniDensity, "units per acre");
            
            // PARCEL DATA
            const parcelData = await fetchParcelData(lat, lng, countyData.county_name);            
            acres = (parseFloat(parcelData.lnd_sqfoot) / 43560).toFixed(2);
            console.log("Parcel area: \n", acres, "acres");

            // MAX UNIT CAPACITY
            maxCapacity = parseFloat(maxMuniDensity) * acres;
            maxCapacity = Math.round(maxCapacity); // Round to the nearest integer
            console.log("Parcel max unit capacity: \n", maxCapacity, "total units");

            /* End Data Collection Module */


            /* Do some things before the AI module takes ~30-60 seconds to complete */


            // Determine LLA eligibility
            let eligPath;
            if (maybeEligibleCodes.includes(parcelData.dor_uc)) {
                // Multifamily 10+ units use
                eligPath = "multi";
            } else if (eligibleCodes.includes(parcelData.dor_uc)) {
                // Commercial/industrial uses
                eligPath = "yes";
            } else if (parcelData.dor_uc == "000" || parcelData.dor_uc == "001") { 
                // Single-family address
                eligPath = "sfd";
            } else {
                // All other uses
                eligPath = "no";
            }

            // Set site colors based on eligibility
            if (eligPath == "multi") {
                document.documentElement.style.setProperty('--hue', '360'); // red
                //document.documentElement.style.setProperty('--hue', '25'); // orange
            } else if (eligPath == "yes") {
                document.documentElement.style.setProperty('--hue', '120'); // green
            } else if (eligPath == "no") {
                document.documentElement.style.setProperty('--hue', '360'); // red
            } else {
                document.documentElement.style.setProperty('--hue', '360'); // red
            }

            // If eligible, populate and show Table #2 (Comps avg. vs Affordable max. rent comparison)
            if (eligPath == "yes") {
                rentsTableBody.innerHTML = generateAffordableTableHTML(countyData,compsData);
                rentInfoContainer.style.display = 'table'; // show the container
                countyMaxRentsTable.style.display = 'table'; // show the table
            } else {
                console.log("LLA Ineligible!");
            }
            
            // Show try again button
            tryAgainButton.style.display = 'block';


            /* Start: Land Development I/O Section */
            
            try {
                // Run initial dev calcs
                //runInitialDevelopmentCalculations();
                console.log(`Skipping Land Dev I/O Module.`);
                //console.log(`Showing Land Dev I/O Module...`);
                //developmentProgramInputSection.style.display = 'block'; // show the I/O section
            } catch(error) {
                console.error('Land Dev. I/O Error:', error);
                handleAIError(error);
            }
                        
            /* End: Land Development I/O Section */


            /* Start AI Module */

            try {
                // Start composing the supplemental data set for AI beginning with parcelData
                verifyParcelData(parcelData);
                aiSupplementalData = JSON.parse(JSON.stringify(parcelData));
                // Generate AI summary HTML content
                const aiContentHTML = await runAIModule(eligPath, superAI, aiSupplementalData, countyData, cityData, compsData);
                // Hide primary AI responses
                document.getElementById("primaryResponsesContainer").style.display = 'none';
                // Hide loading indicator
                loadingContainer.style.display = 'none'; 
                // Show AI summary response
                eligibilityDiv.innerHTML = aiContentHTML;
                eligibilityDiv.style.display = 'block';
                window.scrollTo(0, 0);
                animateTextFadeIn(eligibilityDiv);

            } catch (error) {
                console.error('Error:', error);
                handleAIError(error);
            }

            /* End AI Module */


            
            /* Start Excel Workbook Generation Module */

            // Collect the data necessary for proforma workbook
            const dataForExcel = {
                acres: acres//,
                //address: address,
                // ... more relevant data ...
            };
            // Generate the proforma workbook 
            await generateAndDownloadExcel(dataForExcel, "xlsx");

            /* End Excel Workbook Generation Module */


            /* END MAIN SCRIPT */

        } catch (error) {
            /* Last-chance error catches */
            if (error.message.startsWith("Server responded with")) {
                console.error('Server error:', error);
                document.documentElement.style.setProperty('--hue', '360'); // red
                tryAgainButton.style.display = 'block';
                loadingContainer.style.display = 'none';
                alert('Sorry, there was an unknown critical error. \nYour device will now self-destruct.');
            } else if (error.message.startsWith("Took too long")) {
                console.error('Server error:', error);
                document.documentElement.style.setProperty('--hue', '360'); // red
                tryAgainButton.style.display = 'block';
                loadingContainer.style.display = 'none';
                alert('Sorry, there was an unknown critical error. \nYour device will now self-destruct.');
            } else {
                console.error('Error:', error);
                document.documentElement.style.setProperty('--hue', '360'); // red
                tryAgainButton.style.display = 'block';
                loadingContainer.style.display = 'none';
                alert('Sorry, the AI server timed out...\n\nThis happens about 10% of times. Refresh and try again.');
            }
        }
    });

    // Dynamically load Google Maps & Places APIs
    loadGoogleMapsAPI();

});
