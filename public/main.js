// main.js

// Get event listeners
import './eventListeners.js';
// Get DOM elements
import {
    // In use:
    mainHeader, initialContent, form, addressInput, infoSections, recentUpdatesContainer,
    loadingContainer, googlemap, eligibilityDiv, tryAgainButton, rentInfoContainer, countyMaxRentsTable, rentsTableBody,
    compsTable
} from './domElements.js';


// once DOM is fully loaded:
document.addEventListener('DOMContentLoaded', function() {
    // Add fade-in effect to infoSections
    setTimeout(function() {
        document.getElementById('infoSections').classList.add('info-fade-in');
    }, 1000); // start after 1 second
    // Toggle more options
    document.getElementById('toggleMoreOptions').addEventListener('click', function() {
        var moreOptions = document.getElementById('moreOptions');
        var checkboxGrid = document.querySelector('.checkbox-grid');
        if (moreOptions.style.display === 'none') {
            moreOptions.style.display = 'block';
            checkboxGrid.style.display = 'grid';
            this.textContent = 'Hide More Options';
        } else {
            moreOptions.style.display = 'none';
            checkboxGrid.style.display = 'none';
            this.textContent = 'Show More Options';
        }
    });
    window.scrollTo(0, 0); // scroll to top
    
    // manually add Excel workbook switch event listener
    let superAI = 'off';
    document.getElementById('superchargeSwitch').checked = false;
    document.getElementById('superchargeSwitch').addEventListener('change', function() {
        this.value = this.checked ? 'on' : 'off';
        superAI = this.value;
        console.log(`Download in Excel=${superAI}`);
    });

    // manually add debug mode switch event listener
    let debugModeCheckbox = 'on'
    document.getElementById('debugModeCheckbox').checked = true;
    document.getElementById('debugModeCheckbox').addEventListener('change', function() {
        this.value = this.checked ? 'on' : 'off';
        debugModeCheckbox = this.value;
        console.log(`Debug Mode=${debugModeCheckbox}`);
    });

    // manually add 'Use Live Local' switch event listener
    let enableLiveLocalCheckbox = 'on'
    document.getElementById('enableLiveLocalSwitch').checked = true;
    document.getElementById('enableLiveLocalSwitch').addEventListener('change', function() {
        this.value = this.checked ? 'on' : 'off';
        enableLiveLocalCheckbox = this.value;
        console.log(`Use Live Local=${enableLiveLocalCheckbox}`);
    });
    
    // on form submit:
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get user input (dirty address) 
        address = addressInput.value;
        if (!address) {
            alert('Type an address first. Just a suggestion!');
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
            console.log(`Asking the Guru about \n${address}`);
            
            // Hide header and initial content
            mainHeader.style.display = 'none';
            initialContent.style.display = 'none';
            infoSections.style.display = 'none';
            recentUpdatesContainer.style.display = 'none';

            // Display fake loading progress bar
            updateLoadingBar();
            loadingContainer.style.display = 'block';

            // Add class to loading squares to trigger transition
            const loadingSquares = document.querySelectorAll('.loading-square');
            loadingSquares.forEach((square, index) => {
                // Delay each square's color change by an increasing multiple of 10000ms
                setTimeout(() => square.classList.add('green'), (index+1) * 10000);
            });
            window.scrollTo(0, 0);


            /* Start Data Collection Module */

            // GEO DATA
            const geocodeData = await geocodeAddress(address);
            lat = geocodeData.results[0].geometry.location.lat;
            lng = geocodeData.results[0].geometry.location.lng;

            // TALLEST BLDG. DATA (+ initializes map)
            const tallestBuildingData = await initializeMap(lat, lng);
            
            // Display the map with a smooth fade-in effect
            googlemap.style.display = 'block';
            window.scrollTo(0, 0);
            setTimeout(() => {
                googlemap.style.opacity = 1; // Trigger the fade-in effect
            }, 100); // Start the transition 100ms after display change
            
            // MAX BLDG. HEIGHT
            const maxBH = tallestBuildingData.maxHeight.toFixed(0); // feet tall
            const maxBD = tallestBuildingData.maxDistance.toFixed(2); // miles away
            buildingHeight = maxBH; //// (hackily set global)
            
            // COMPS DATA
            const compsModuleResult = await runCompsModule(lat, lng, COMPS_SEARCH_RADIUS_MILES);
            console.log("Comps Analysis: \n" + JSON.stringify(compsModuleResult));
    
            // CITY DATA
            const cityData = await checkCity(geocodeData);        
    
            // COUNTY DATA
            const countyData = await fetchCountyData(lat, lng);
    
            // GET MUNI. NAME
            const muniName = getMunicipality(cityData, countyData);
            displayMuniName = muniName //// (hackily set global)
            //console.log("Municipality:", displayMuniName);

            // MAX MUNI. DENSITY
            const maxDensity = await getMaxDensity(countyData.county_name, cityData.cityName);
            maxMuniDensity = Math.min(maxDensity, 100); // Takes the lesser of maxDensity or 100 (rough limit of feasibility)
            //console.log("Max municipal density: \n", maxMuniDensity, "units per acre");
            
            // PARCEL DATA
            const parcelData = await fetchParcelData(lat, lng, countyData.county_name);            
            acres = (parseFloat(parcelData.lnd_sqfoot) / 43560).toFixed(2);
            //console.log("Parcel area: \n", acres, "acres");

            // MAX UNIT CAPACITY
            maxCapacity = parseFloat(maxMuniDensity) * acres;
            maxCapacity = Math.round(maxCapacity); // Round to the nearest integer
            //console.log("Parcel max unit capacity: \n", maxCapacity, "total units");

            /* End Data Collection Module */


            /* Do a few more things before the AI module takes ~30-45 seconds to complete */


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

            // * If LLA Module = Enabled && Parcel Eligibility = True,
            //   then populate and show Table #2 (Comps avg. vs Affordable max. rents comparison)
            if (enableLiveLocalCheckbox) {

            } else {
                console.log("LLA Ineligible!");
            }

            if (eligPath == "yes") {
                rentsTableBody.innerHTML = generateAffordableTableHTML(countyData,compsData);
                rentInfoContainer.style.display = 'table';
                countyMaxRentsTable.style.display = 'table';
                console.log(`'Use Live Local' is enabled \n*AND* the property is eligible!\n  :-D   :-D   :-D`); 
            } else {
                console.log(`'Use Live Local' is enabled... \nBut the property is INELIGIBLE.\n  :'(   :'(   :'(`);
            }

            // Show the Try Again button
            tryAgainButton.style.display = 'block';

            /* Start AI Module */
            try {
                // Start composing the supplemental data set for AI beginning with parcelData
                verifyParcelData(parcelData);
                aiSupplementalData = JSON.parse(JSON.stringify(parcelData));
            } catch (error) {
                console.error('Parcel Data Error:', error);
                handleAIError(error);
            }

            let debugMode = false;
            if (debugModeCheckbox=='on') {
                debugMode = true;
            }

            try {
                // Generate AI summary HTML content
                const aiContentHTML = await runAIModule(eligPath, superAI, aiSupplementalData, countyData, cityData, compsData, debugMode);
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
            if (superAI=="on") {
                // Collect the data necessary for proforma workbook
                const dataForExcel = {
                    acres: acres,
                    // ^dup?
                    ...aiSupplementalData
                };
                await generateAndDownloadExcel(dataForExcel, "xlsx");
            } else {
                //console.log("Skipping Excel workbook generation module...")
            }
            /* End Excel Workbook Generation Module */


            /* END MAIN SCRIPT */

        } catch (error) {
            /* Last-chance error catching */
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
                alert('The AI server took too long to respond. \n\nThis happens randomly. \n Please refresh and try again.');
            }
        }
    });
    // Dynamically load Google Maps APIs
    loadGoogleMapsAPI();
});
