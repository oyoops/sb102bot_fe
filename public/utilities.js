// utilities.js - utility functions for Live Local Guru.


/*===========//
// Functions //
//    for    //
//  main.js  //
//===========*/

/* API Calling Functions */

// geocode v2
async function geocodeAddress(address) {
    const geoEndpoint = `/api/geocode?address=${encodeURIComponent(address)}`;
    const geoData = await fetchAPI(geoEndpoint);
        if (!geoData.results || geoData.results.length === 0) {
        throw new Error(`Whoops... That address isn't in my wheelhouse, buddy.\n\nI only know about Florida (and only the good parts at that).`);
    }
    /* Geocode was successful */
    return geoData;
}

// check city v2
async function checkCity(geoData) {
    const latitude = geoData.results[0].geometry.location.lat;
    const longitude = geoData.results[0].geometry.location.lng;
    const muniCheckEndpoint = `/api/check_city?lat=${latitude}&lng=${longitude}`;
    const muniData = await fetchAPI(muniCheckEndpoint);
    if (muniData.isInCity) {
        console.log(`Property is within ${muniData.cityName} limits.`);
    } else {
        muniData.cityName = 'unincorporated';
        console.log('Property is in unincorporated county area.');
    }
    /* City check was successful */
    return muniData;
}

// county data v2
async function fetchCountyData(lat, lng) {
    const countyDataEndpoint = `/api/load_county_table?lat=${lat}&lng=${lng}`;
    const countyData = await fetchAPI(countyDataEndpoint);
    if (!countyData.county_name) {
        throw new Error('Missing county name in county data');
    }
    /* County data lookup was successful */
    return countyData;
}

// parcel data v2
async function fetchParcelData(lat, lng, countyName) {
    const parcelDataEndpoint = `/api/load_parcel_data?lat=${lat}&lng=${lng}&county_name=${countyName}`;
    const parcelData = await fetchAPI(parcelDataEndpoint);
    if (!parcelData || Object.keys(parcelData).length === 0) {
        throw new Error('Missing or empty parcel data');
    }
    /* Parcel data lookup was successful */
    return parcelData;
}

// generic fetch API
async function fetchAPI(url) {
    const apiResponse = await fetch(url);
    if (!apiResponse.ok) throw new Error(`Server responded with ${apiResponse.status}: ${await apiResponse.text()}`);
    return await apiResponse.json();
}

// get muni name
function getMunicipality(cityData, countyData) {
    let muniName = "(error!)";
    const cityNamePropCase = toProperCase(cityData.cityName);
    const countyNamePropCase = specialCountyFormatting(countyData.county_name);
    if (cityNamePropCase.toLowerCase() === "unincorporated") {
        muniName = "Unincorporated " + countyNamePropCase + " County";
    } else {
        muniName = cityNamePropCase;
    }
    //// (hackily set globals)
    cityNameProper = cityNamePropCase;
    countyNameProper = countyNamePropCase;

    return muniName;
}


/* AI-Related Functions: */

// Main AI module entry point
async function runAIModule(eligPath, superAI, aiSupplementalData, countyData, cityData, compsData) {
    if (countyData) {
        enhanceWithCountyData(aiSupplementalData, countyData);
    }
    if (cityData) {
        enhanceWithCityData(aiSupplementalData, cityData);
    }
    if (compsData) {
        enhanceWithCompsData(aiSupplementalData, compsData);
    }

    const dirtyData = await getDirtyData(aiSupplementalData);
    const cleanerData = refineData(dirtyData, superAI);
    const aiGeneratedHTML = await fetchAiResponsesCombined(eligPath, cleanerData, superAI);

    if (!aiGeneratedHTML || aiGeneratedHTML.length === 0) {
        throw new Error('[CRITICAL] Error: The AI-generated HTML is totally blank!');
    }

    return composeAiResponsesCombined(aiGeneratedHTML);
}

// handle AI module errors
function handleAIError(error) {
    document.documentElement.style.setProperty('--hue', '360'); // red
    document.getElementById("tryAgainButton").style.display = 'block';
    document.querySelector('.loading-container').style.display = 'none';
    if (error.message.startsWith("[CRITICAL]")) {
        alert('Server timeout. Refresh and try again. This happens randomly...');
    } else {
        alert('Server timeout. Refresh and try again. This happens ~10% of times!');
    }
}

// fetch a set of responses from AI given a data set to supplement prompts
async function fetchAiResponsesCombined(eligPath, cleanData, superAI) {
  /* START STAGE 1: GET, ENRICH, COMBINE DATA */
  
  // Add value of superAI switch to all primary requests
  cleanData.superAI = superAI;

  // Define primary prompt endpoints based on SuperAI switch
  let endpoints;
  let summaryEndpoint;
  if (eligPath == "yes") {
    endpoints = [
        '/api/ask_ai_part1AA',
        '/api/ask_ai_part1BB',
        '/api/ask_ai_part1CC',
        '/api/ask_ai_part1DD',
        '/api/ask_ai_part1EE',
    ];
    summaryEndpoint = 'ask_ai_part1SER';
  } else if (eligPath == "no") {
    endpoints = [
        '/api/ask_ai_part1AA',
        '/api/ask_ai_part1BB',
        '/api/ask_ai_part1CC',
        '/api/ask_ai_part1DD',
        '/api/ask_ai_part1EE'
    ];
    summaryEndpoint = 'ask_ai_part1SER';
  } else if (eligPath == "multi") {
    endpoints = [
        '/api/ask_ai_part1AA',
        '/api/ask_ai_part1BB',
        '/api/ask_ai_part1CC',
        '/api/ask_ai_part1DD',
        '/api/ask_ai_part1EE'
    ];
    summaryEndpoint = 'ask_ai_part1SER';
  } else if (eligPath == "sfd") {
    endpoints = [
        '/api/ask_ai_part1A',
        '/api/ask_ai_part1B',
        '/api/ask_ai_part1E',
        '/api/ask_ai_part1C',
        '/api/ask_ai_part1D'
    ];
    summaryEndpoint = 'ask_ai_part1SER_SFD';
  } /*else {
    endpoints = [
        '/api/ask_ai_part1AA',
        '/api/ask_ai_part1BB',
        '/api/ask_ai_part1CC',
        '/api/ask_ai_part1DD',
        '/api/ask_ai_part1EE'
    ];
    summaryEndpoint = 'ask_ai_part1SER';
  }*/

  // Map primary prompts to endpoints, then fetch all simultaneously
  const fetchPromises = endpoints.map(endpoint => {
    return Promise.race([
        fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cleanData) // Send the data as JSON in the request body
        })
        .then(response => {
            if (!response.ok) {
                console.error(`Failed at endpoint ${endpoint} with status: ${response.statusText}`);
                throw new Error(`Failed to fetch from ${endpoint}: ${response.statusText}`);
            }
            return response.json();
        }),
        timeout(30000) // 30 seconds => timeout
    ])
    .catch(err => {
        console.error(`Error during fetch from endpoint ${endpoint}: ${err}`);
        if (err.message === 'Request took too long!') {
            alert(`Endpoint ${endpoint} took too long to respond.`);
        }
        throw err;
    });
    });
    try {
        // Fetch all primary prompt responses simultaneously
        const results = await Promise.all(fetchPromises);

        // Display primary response container
        document.getElementById("primaryResponsesContainer").style.display = 'block';

        // Display each primary response as it becomes available (staggered)
        for (let i = 0; i < results.length; i++) {
            document.getElementById(`response${i + 1}`).innerHTML = results[i];
            setTimeout(() => {
                animateTextFadeIn(document.getElementById(`response${i + 1}`));
            }, i * 300); // delay each animation by 300ms (not sure this actually works)
        }
  
        console.log("Final Data: \n", cleanData);

        /* START STAGE 2: SER */
        const serEndpoint = `/api/` + summaryEndpoint + `?aiCombinedResponses=${encodeURIComponent(JSON.stringify(results))}&suppDataForAI=${encodeURIComponent(JSON.stringify(cleanData))}&superAI=${superAI}`;
        const serResponse = await fetch('/api/' + summaryEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                aiCombinedResponses: results,
                suppDataForAI: cleanData,
                superAI: superAI
            })
        });
        const serData = await serResponse.json();
            
        return serData;
    } catch (error) {
        const errorMessage = error?.data?.error?.message || "TIMEOUT: Server took too long to send AI response.";
        console.error("Server timed out while sending AI response:", errorMessage);
        throw error;
    }
}

// Compose final output by prepending it with a title and calling it a day
function composeAiResponsesCombined(aiResponse, titleLine = `🌞 Living Local in ${displayMuniName} 😎`) {
    if (!aiResponse || typeof aiResponse !== 'string') {
        console.error("Error: Invalid or no AI response received!");
        return;
    }
    // Preface final AI content with a custom introduction
    let combinedResponse = 
    /*`<h2 style="color:black;" align="center">
            <b><i>${titleLine}</i></b>
        </h2>*/
    `
        <ul>
            ${aiResponse}
        </ul>
    `;
    return combinedResponse;
}

// Add globals to dataset and apply final super-enhancements
function refineData(rawData, superAI) {
    let refinedData = {};
    // Attach key globals to dataset
    rawData = {
        // Model data
        superAI: superAI,

        // Display Data
        //descriptionOfLiveLocalEligibility: summaryContent,

        // Location Data
        address: address,
        lat: lat,
        lng: lng,
        ////////geocodeData: geocodeData,
        ////////countyData: countyData,
        ////////parcelData: parcelData,
        ////////cityData: cityData,
        cityNameProper: cityNameProper,
        countyNameProper: countyNameProper,
        displayMuniName: displayMuniName,

        // Housing and Unit Data
        acres: acres,
        ////////fakeMillage: fakeMillage,
        maxMuniDensity: maxMuniDensity,
        ////////totalUnits: totalUnits,
        ////////marketUnits: marketUnits,
        ////////affordableUnits: affordableUnits,
        maxCapacity: maxCapacity,
        ////////affordablePct: affordablePct,

        /*
        // AI Data
        aiSupplementalData: aiSupplementalData,
        aiResponses: aiResponses,
        */

        /*
        // Cost Data
        MILLAGE_ADJUSTMENT: MILLAGE_ADJUSTMENT,
        landCostPerUnit: landCostPerUnit,
        totalHCPerUnit: totalHCPerUnit,
        totalLandCost: totalLandCost,
        totalHcCost: totalHcCost,
        totalLandAndTotalHc: totalLandAndTotalHc,
        totalLandAndTotalHcPerUnit: totalLandAndTotalHcPerUnit,
        totalLandAndTotalHcPerSqFt: totalLandAndTotalHcPerSqFt,
        */
        
        // Housing Unit Sizes & Rents
        /*
        marketStudioSize: marketStudioSize,
        market1BDSize: market1BDSize,
        market2BDSize: market2BDSize,
        market3BDSize: market3BDSize,
        affordableStudioSize: affordableStudioSize,
        affordable1BDSize: affordable1BDSize,
        affordable2BDSize: affordable2BDSize,
        affordable3BDSize: affordable3BDSize,
        avgMarketSize: avgMarketSize,
        avgAffordableSize: avgAffordableSize,
        avgBlendedSize: avgBlendedSize,
        maxRent0bd: maxRent0bd,
        maxRent1bd: maxRent1bd,
        maxRent2bd: maxRent2bd,
        maxRent3bd: maxRent3bd,
        affordablerent: affordablerent,
        affordableunitsize: affordableunitsize,
        mktrent: mktrent,
        mktunitsize: mktunitsize,
        */

        // Abatement Data
        acreageValue: acreageValue,
        densityValue: densityValue,
        ////////abatementValue: abatementValue,
        ////////abatementEstimate: abatementEstimate,

        // Map & Building Data
        ////////LIVE_LOCAL_BLDG_RADIUS_MILES: LIVE_LOCAL_BLDG_RADIUS_MILES,
        ////////tallestBuildingsData: tallestBuildingsData,
        distanceInMilesToTallestBldg: distanceInMilesToTallestBldg,
        ////////tallestBuildingLat: buildingLat,
        ////////tallestBuildingLng: buildingLng,
        tallestBuildingHeight: buildingHeight,
        tallestBuildingName: buildingName,
        tallestBuildingAddress: buildingAddress,

        // (existing) Parcel/County/City Data
        ...rawData
    };

    // Rename most columns
    for (let [key, value] of Object.entries(rawData)) {
        if (renameMap[key]) {
            refinedData[renameMap[key]] = value;
        } else {
            refinedData[key] = value; // Keeping columns not in the renameMap as-is
        }
    }
    // Remove unwanted columns
    for (let unwantedColumn of unwantedColumns) {
        if (refinedData[renameMap[unwantedColumn]]) {
            delete refinedData[renameMap[unwantedColumn]];
        }
    }
    // Remove null values; convert zero values
    for (let [key, value] of Object.entries(refinedData)) {
        if (value === null) {
            delete refinedData[key];
        } else if (value === "0.00000") {
            refinedData[key] = 0;
        }
    }
    return refinedData;
}

// Fade in the AI response text
function animateTextFadeIn(element) {
    if (!element) {
        console.error("Invalid animation.");
        return;
    }

    // Start the fade and slide animation for the container
    setTimeout(() => {
        element.style.opacity = "1";
        element.style.transform = "translateY(0)";
    }, 100); // slight delay to trigger the transition

    const original = element.cloneNode(true);
    element.innerHTML = '';

    let textQueue = [];
    let nodeQueue = Array.from(original.childNodes).map(child => ({ node: child, parent: element }));
    let orderedQueue = [];
    let lastTextNode = null;

    while (nodeQueue.length > 0) {
        const { node } = nodeQueue.shift();

        if (["H1", "H2", "H3", "H4", "H5", "H6"].includes(node.nodeName)) {
            orderedQueue.unshift(node);
        } else if (["B", "STRONG", "I", "EM"].includes(node.nodeName)) {
            const headingCount = orderedQueue.filter(n => ["H1", "H2", "H3", "H4", "H5", "H6"].includes(n.nodeName)).length;
            orderedQueue.splice(headingCount, 0, node);
        } else {
            orderedQueue.push(node);
        }
    }

    nodeQueue = orderedQueue.map(child => ({ node: child, parent: element }));
    while (nodeQueue.length > 0) {
        const { node, parent } = nodeQueue.shift();

        if (node.nodeName === "#text") {
            lastTextNode = parent.appendChild(document.createTextNode(''));
            for (let char of node.textContent) {
                textQueue.push({ char, textNode: lastTextNode });
            }
        } else {
            const appendedNode = parent.appendChild(node.cloneNode(false));
            if (node.childNodes.length > 0) {
                for (let child of node.childNodes) {
                    nodeQueue.push({ node: child, parent: appendedNode });
                }
            }
        }
    }

    let interval = setInterval(() => {
        if (textQueue.length > 0) {
            const { char, textNode } = textQueue.shift();
            textNode.appendData(char);
        } else {
            clearInterval(interval);
        }
    }, 2); // adjust speed; ms between iterations
}

// Create a timeout, putting a time limit on each AI endpoint
function timeout(ms) {
    return new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI SERVER TIMEOUT! Please try again.')), ms)
    );
}


/* Non-AI Functions: */

// Fetch tallest building within N-mile radius of coordinates
async function fetchTallestBuilding(lat, lng, radius) {
    try {
        //const response = await fetch(`https://www.oyoops.com/api/building_height?lat=${lat}&lng=${lng}&radius=${radius}`);
        const response = await fetch(`/api/building_height?lat=${lat}&lng=${lng}&radius=${radius}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching tallest building within radius:', error);
        return null;
    }
}

// Convert city/county names to Proper Case
function toProperCase(str) {
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase()).join(' ');
}

// Format county names that contain special characters
function specialCountyFormatting(county) {
    const specialCases = {
        'miamidade': 'Miami-Dade',
        'stjohns': "St. John's",
        'stlucie': 'St. Lucie',
        'palmbeach': 'Palm Beach'
    };
    return specialCases[county] || toProperCase(county);
}

// Verify the integrity of parcelData
function verifyParcelData(parcelData) {
    if (!parcelData || Object.keys(parcelData).length === 0) {
        console.log(`Skipping AI analysis module...`);
        throw new Error('Sorry, this property is not eligible, buddy.');
    }
}

// Get the max density of a municipality (a bit sloppy, but reliable)
async function getMaxDensity(county, city) {
    try {
      //const response = await fetch(`https://www.oyoops.com/api/get_max_density?county=${county}&city=${city}`);
      const response = await fetch(`/api/get_max_density?county=${county}&city=${city}`);
      const data = await response.json();
      if (data.error) {
        console.error(data.error);
        return null;
      }
      return data.max_density;
    } catch (err) {
      console.error(err);
      return null;
    }
}  

// Add countyData to supplemental data
function enhanceWithCountyData(aiSupplementalData, countyData) {
    for (const [key, value] of Object.entries(countyData)) {
        aiSupplementalData[`subject_${key}`] = value;  // Prefixing with "subject_" to ensure uniqueness with globals
    }
}

// Add cityData to supplemental data
function enhanceWithCityData(aiSupplementalData, cityData) {
    if (toProperCase(cityData.cityName) == "Unincorporated") {
        // addLoadingLine(`Site is within <b>${toProperCase(cityData.cityName)}</b> city limits...`);
    } else {
        // addLoadingLine(`Site is in unincorporated <b>${countyData.county_name} County</b>...`);
    }
    for (const [key, value] of Object.entries(cityData)) {
        aiSupplementalData[`subject_${key}`] = value;  // Prefixing with "subject_" to ensure uniqueness with globals
    }
}

// Add compsData to supplemental data
function enhanceWithCompsData(aiSupplementalData, compsData) {
    for (const [key, value] of Object.entries(compsData)) {
        aiSupplementalData[`comps_${key}`] = value;  // Prefixing with "comps_" to ensure uniqueness with globals
    }
}

// Get AI supplemental data in parsed JSON format
function getDirtyData(aiSupplementalData) {
    let dirtyData = JSON.parse(JSON.stringify(aiSupplementalData));
    return dirtyData;
}
// Get AI supplemental data in stringified format
function getDirtyDataString(aiSupplementalData) {
    let dirtyData = JSON.parse(JSON.stringify(aiSupplementalData));
    return JSON.stringify(dirtyData, null, 2);
}

// Animate in the AI response for fancy effect
function animateLoadingText(element) {
    const original = element.cloneNode(true);
    element.innerHTML = '';

    let textQueue = [];
    let nodeQueue = Array.from(original.childNodes).map(child => ({ node: child, parent: element }));
    let lastTextNode = null;

    while (nodeQueue.length > 0) {
        const { node, parent } = nodeQueue.shift();
        
        if (node.nodeName === "#text") {
            for (let char of node.textContent) {
                const span = document.createElement('span');
                span.className = 'char';
                span.innerHTML = char === ' ' ? '&nbsp;' : char;  // Replace space with non-breaking space
                parent.appendChild(span);
                textQueue.push(span);
            }
        } else {
            const appendedNode = parent.appendChild(node.cloneNode(false));
            if (node.childNodes.length > 0) {
                for (let child of node.childNodes) {
                    nodeQueue.push({ node: child, parent: appendedNode });
                }
            }
        }
    }

    let interval = setInterval(() => {
        if (textQueue.length > 0) {
            const span = textQueue.shift();
            span.classList.add('show');
        } else {
            clearInterval(interval);
        }
    }, 100); // adjust speed; ms between character iterations
}

// Update the fake loading progress bar
function updateLoadingBar() {
    const loadingFill = document.querySelector('.loading-fill');
    const loadingPercentage = document.querySelector('.loading-percentage');
    percentageLoading = percentageLoading + (1 - percentageLoading / 100) * 1.00042069; // This makes it slow down as it approaches 100
    if (percentageLoading >= 99) {
      percentageLoading = 99;
    }
    loadingFill.style.width = percentageLoading + '%';
    loadingPercentage.textContent = Math.round(percentageLoading) + '%';
    if (percentageLoading < 99) {
        setTimeout(updateLoadingBar, intervalTimeLoading);
    }
}


/* UNUSED SECTION */


// (UNUSED) Run initial development calculations
function runInitialDevelopmentCalculations() {
    // Run initial calculations using globals or whatever
    calculateMaximumUnits();
    calculateWeightedAverageSizes();
    updateRentPerSqFtTable();
    updateTotalCosts();
    calculateAbatement();
}

// (UNUSED) Load main tables
function loadMainTables() {
    // MANUAL MILLAGE ADJUSTMENT:
    fakeMillage = parseFloat(countyData.county_millage) + parseFloat(MILLAGE_ADJUSTMENT); // "rough estimate" using known county mills + a constant manual adjustment to approximate state (and perhaps local...) portion of grand total millage
    fakeMillage = parseFloat(fakeMillage).toFixed(4);

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

    
    ////const maxDensity = await getMaxDensity(countyData.county_name, cityData.cityName);
    /*
    if (maxDensity !== null) {
        ////console.log ("Maximum allowed density in", countyData.county_name, cityData.cityName, ":", maxDensity);
        // set global
        maxMuniDensity = maxDensity;
    } else {
        console.log ("WARNING: Maximum municipal density was not found!")
        // set global
        maxMuniDensity = 0;
    }
    */
    // set density input placeholder
    densityInput.value = maxMuniDensity.toFixed(0); // DENSITY AUTO/MANUAL INPUT

}

// (UNUSED) Animate loading lines to keep users enthralled while loading
function addLoadingLine(text) {
    const loadingContainer = document.querySelector('.loading-container');
    const newTextElement = document.createElement('div');
    newTextElement.classList.add('animated-text');
    newTextElement.innerHTML = text;
    loadingContainer.appendChild(newTextElement);
    animateLoadingText(newTextElement); // Use the new function here
}
// Example usage:
// addLoadingLine('Fetching data from the server...');
// addLoadingLine('Processing user information...');
// ...and so on.

/*
function initAutocomplete() {
    const input = document.getElementById('addressInput');
    const autocomplete = new google.maps.places.Autocomplete(input);
  
    // If you want to get details once a place is selected
    autocomplete.addListener('place_changed', function() {
      const place = autocomplete.getPlace();
      if (!place.geometry) {
          console.log("Returned place contains no geometry");
          return;
      }
      
      // Extract latitude and longitude
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
  
      console.log("Latitude: " + lat);
      console.log("Longitude: " + lng);
  
      // Extract name and address
      const name = place.name;
      const address = place.formatted_address;
  
      console.log("Name: " + name);
      console.log("Address: " + address);
  
      // If you wish, you can display these details on your webpage, store them, or use them in other functions.
  });
}
*/

async function generateAndDownloadExcel(data, format = 'xlsx') {
    // Prompt user for confirmation
    const userConfirmation = confirm(`Do you want to download an Excel financial model based upon this property?`);
    
    if (!userConfirmation) {
        console.log('Declined an Excel proforma.');
        return; // Exit the function if user doesn't confirm
    }

    try {
        const response = await fetch('/api/genExcel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...data }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = format === 'xlsx' ? 'LiveLocalGuru_Proforma.xlsx' : 'LiveLocalGuru_Proforma.xlsm';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error generating Excel file:\n', error);
        alert('There was an error while generating the Excel workbook.');
    }
}
