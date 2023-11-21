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
async function runAIModule(eligPath, superAI, aiSupplementalData, countyData, cityData, compsData, debugMode=false, customInstructionsText) {
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
    const aiGeneratedHTML = await fetchAiResponsesCombined(eligPath, cleanerData, superAI, debugMode, customInstructionsText);

    if (!aiGeneratedHTML || aiGeneratedHTML.length === 0) {
        throw new Error('[CRITICAL] Error: The AI-generated HTML is totally blank!');
    }
    return composeFormattedAiResponse(aiGeneratedHTML);
}

// handle AI module errors
function handleAIError(error) {
    document.documentElement.style.setProperty('--hue', '360'); // red
    document.getElementById("tryAgainButton").style.display = 'block';
    document.querySelector('.loading-container').style.display = 'none';
    if (error.message.startsWith("[CRITICAL]")) {
        alert('Server timed out... Simply refresh and try again.');
    } else {
        ////alert('Server timeout. Refresh and try again. This happens ~10% of times!');
    }
}

// fetch combined set of primary AI responses
async function fetchAiResponsesCombined(eligPath, cleanData, superAI, debug=false, customInstructionsText) {
  // (super secret debug method)
  if (debug) {
    const noAIresultHTML =  `
        <h2>Comps Analysis</h2>
        <p>[Placeholder]</p>
    `;
    return noAIresultHTML
  }
    
  // Add value of superAI switch to cleanData for all primary requests [LEGACY]
  cleanData.superAI = superAI;
  // Add custom instructions text to cleanData for all primary requests
  cleanData.customInstructionsText = customInstructionsText;

  // Define primary prompt endpoints based on Live Local Eligibility and Current Land Use
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
  }

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
        timeout(59000) // 59 seconds => timeout
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
        /* STAGE 1: PRIMARY RESPONSES */

        // Fetch all primary prompt responses simultaneously
        const results = await Promise.all(fetchPromises);

        // Display primary response container
        document.getElementById("primaryResponsesContainer").style.display = 'block';

        // Display primary responses once they are available
        for (let i = 0; i < results.length; i++) {
            document.getElementById(`response${i + 1}`).innerHTML = results[i];
            setTimeout(() => {
                animateTextFadeIn(document.getElementById(`response${i + 1}`));
            }, i * 300); // delay each animation by 300ms (not sure this actually works...)
        }
  
        ////console.log("Clean Data: \n", cleanData);

        /* START STAGE 2: SER */
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
        alert(`The AI server timed out while responding. \nThis happens... Please refresh and try again.`)
        throw error;
    }
}

// Compose final output by prepending it with a title and calling it a day
function composeFormattedAiResponse(aiResponse, titleLine = `🌞 Living Local in ${displayMuniName} 😎`) {
    if (!aiResponse || typeof aiResponse !== 'string') {
        console.error("Error: Invalid or no AI response was received!");
        return;
    }
    // Preface final AI content with a custom introduction
    let formattedResponse = 
    /*`<h2 style="color:black;" align="center">
            <b><i>${titleLine}</i></b>
        </h2>*/
    `
        <ul>
            ${aiResponse}
        </ul>
    `;
    return formattedResponse;
}

// Add globals to dataset and apply final super-enhancements
function refineData(rawData, superAI) {
    let refinedData = {};
    // Attach key globals to the supplementary dataset
    rawData = {
        // Parameters
        superAI: superAI,

        // Location Data
        address: address,
        lat: lat,
        lng: lng,
        cityNameProper: cityNameProper,
        countyNameProper: countyNameProper,
        displayMuniName: displayMuniName,

        // Unit Density Data
        acres: acres,
        maxMuniDensity: maxMuniDensity,
        maxCapacity: maxCapacity,

        // Map & Building Data
        //LIVE_LOCAL_BLDG_RADIUS_MILES: LIVE_LOCAL_BLDG_RADIUS_MILES,
        //tallestBuildingLat: buildingLat,
        //tallestBuildingLng: buildingLng,
        distanceInMilesToTallestBldg: distanceInMilesToTallestBldg,
        tallestBuildingHeight: buildingHeight,
        tallestBuildingName: buildingName,
        tallestBuildingAddress: buildingAddress,

        // Custom Data
        //descriptionOfLiveLocalEligibility: summaryContent,

        /* Cost Data */
        // ...
        
        /* Housing Unit Sizes & Rents */
        // ...

        /* Abatement Data */
        // ...

        // Pre-existing Parcel-County-City Data
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

// Generate and download Excel workbook
async function generateAndDownloadExcel(data, format = 'xlsx') {
    /* Prompt user for confirmation
    const userConfirmation = confirm(`Do you want to download an Excel financial model template for this property?`);
    if (!userConfirmation) {
        console.log('Declined an Excel proforma.');
        return;
    }*/

    // Generate and download
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
        console.error('Error generating Excel file (or user exited early):\n', error);
        ////alert('There was an error while generating the Excel workbook.');
    }
}

// (UNUSED) Run initial development calculations
function runInitialDevelopmentCalculations() {
    // Run initial calculations using globals or whatever
    calculateMaximumUnits();
    calculateWeightedAverageSizes();
    updateRentPerSqFtTable();
    updateTotalCosts();
    calculateAbatement();
}
