// utilities.js - contains the utility functions for the SB102bot web app.

/*===========//
// Functions //
//    for    //
//  main.js  //
//===========*/


/* AI-Related Functions: */


// fetch set of AI responses given a supplemental dataset
async function fetchAiResponsesCombined(cleanData) {
  /* START STAGE 1: GET, ENRICH, COMBINE */

  // Log dataset POST-transformation
  ////console.log("\n<----[POST-TRANSFORMATION:]---->");
  ////console.log(JSON.stringify(cleanData, null, 2)); // test
  
  // Define primary prompt endpoints
  const endpoints = [
      '/api/ask_ai_part1AA',
      '/api/ask_ai_part1BB',
      '/api/ask_ai_part1CC',
      '/api/ask_ai_part1DD',
      '/api/ask_ai_part1EE'
  ];

  // Map primary prompts to endpoints, then fetch all simultaneously
  const queryString = new URLSearchParams(cleanData).toString();
  const fetchPromises = endpoints.map(endpoint => {
    return Promise.race([
        fetch(`${endpoint}?${queryString}`)
        .then(response => {
            if (!response.ok) {
                console.error(`Failed at endpoint ${endpoint} with status: ${response.statusText}`);
                throw new Error(`Failed to fetch from ${endpoint}: ${response.statusText}`);
            }
            return response.json();
        }),
        timeout(30000) // 30 seconds
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
      // Once results to all primary prompts available, then combine
      const results = await Promise.all(fetchPromises);
  
      /* START STAGE 2: SER */
      const serEndpoint = `/api/ask_ai_part1SER?aiCombinedResponses=${encodeURIComponent(results)}&suppDataForAI=${encodeURIComponent(cleanData)}`;
      const serResponse = await fetch(serEndpoint);
      if (!serResponse.ok) {
          console.log('ERROR: SER failed!');
          throw new Error(`Server responded with ${serResponse.status}: ${await serResponse.text()}`);
      }
      const serData = await serResponse.json();
      
      //console.log("\n--- Combined Resp: ---\n" + results + "\n--------------------\n");
      //console.log("\n--- SER Response ---\n" + serData + "\n--------------------\n");      
      
      return serData;

  } catch (error) {
      const errorMessage = error?.data?.error?.message || "[CRITICAL] An unknown error occurred while fetching the Stage 2 (SER) AI response.";
      console.error("Error while compiling primary responses or fetching SER response:", errorMessage);
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
    let combinedResponse = `
        <h2 style="color:black;" align="center">
            <b><i>${titleLine}</i></b>
        </h2>
        <ul>
            ${aiResponse}
        </ul>
    `;
    return combinedResponse;
}

// Add globals to dataset and apply final super-enhancements
function refineData(rawData) {
    let refinedData = {};
    // Attach key globals to dataset
    rawData = {
        // Display Data
        descriptionOfLiveLocalEligibility: summaryContent,

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

/*
async function generateRefinedSummary(sheetPublicCSVUrl, columnLetter, parcelData) {
  ////const combinedResponses = await fetchColumnFromPublicSheet(sheetPublicCSVUrl, columnLetter);
  ////console.log("X: " + combinedResponses);

  // Construct a prompt for the AI to refine the combined responses
  const prompt = `
      CONTEXT:
          Florida's Live Local Act, effective July 1, 2023, revolutionizes multifamily development by overriding municipal restrictions. Key provisions mandate that cities/counties approve multifamily developments if:
              1. Over 40% of units are 'affordable' (affordable rent maximums vary by county).
              2. There at least 70 affordable units.
              3. All non-density/height/zoning/land use municipal regulations are met.
          The Act's transformative benefits include bypassing lengthy public hearings, achieving the highest unit density anywhere within the municipality, and allowing structures to rise as tall as the tallest building within a mile.
          Furthermore, it offers a 75% property tax abatement on affordable units set at 120% AMI level, equating to a net 30% property tax reduction for the entire development. 
          
      ROLE:
          You are 'Live Local Buddy', the AI brains powering a web app that helps developers navigate this game-changing law. You help users find profitable properties to buy for building new apartment complexes.

      BACKGROUND:
          I used a set of related prompts with data to generate insights about a land parcel. Each was narrow, fseveral different aspects of it.
          The five AI responses were then combined in order; as a result, it's now long, boring, and repetitive (provided below).
          The AI's writing and parcel data are imperfect, but YOU are the editor; the last line of defense between me and distributing unprofessional mediocre content to my critical audience.            
          
      RULES:
          - Must be in HTML format. Use fun, artistic HTML text styles and colors to emphasize key info, and use </br> for line breaks.
          - Include plenty of emojis for emphasis throughout.  
          - Remove all references to unavailable or incomplete information.
          - Remove everything that isn't substantive or valuable.

      SPEECH/PERSONA:
          - You speak in the manner of a stereotypical cartoon robot.

      YOUR TASK:
          - Completely rewrite the crudely-combined AI responses (below). You will now write a well-formatted, concise evaluation about the viability of a user's parcel for development.
          - Focus primarily on the Live Local Act pathway to build apartments if the parcel is currently zoned commercial or industrial. If not, then focus on apartments via obtaining traditional approvals.

      ---
  `;
  //    ${combinedResponses}
  //`;
  
  // Attach this prompt to parcelData and call fetchAiResponsesCombined
  parcelData.prompt = prompt;
  const refinedSummaryResponses = await fetchAiResponsesCombined(parcelData); // <<<<<<----------------------- WRONG               THIS SHOULD BE A SUMMARIZER/REFINER/EDITOR PROMPT FUNCTION
  
  // (this needs to go)
  //// assuming contents are all in plain text format, join components together for a combined summary
  const refinedSummary = refinedSummaryResponses.join(' ');

  return refinedSummary;
}
*/

// Fade in the AI response text
function animateTextFadeIn(element) {
    if (!element) {
        console.error("Invalid animation.");
        return;
    }

    const original = element.cloneNode(true);
    element.innerHTML = '';

    let textQueue = [];
    let nodeQueue = Array.from(original.childNodes).map(child => ({ node: child, parent: element }));
    let orderedQueue = [];
    let lastTextNode = null;

    // Adjust the order of the nodes based on priority
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

    // Process nodes in the adjusted order
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
    }, 2); // <---- adjust speed; ms between iterations
}


// Create a timeout (puts a time limit on the AI endpoints)
function timeout(ms) {
    return new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Took too long... It happens! If you simply try again, it will usually work.')), ms)
    );
}




/* Non-AI Functions: */

// Get max density of a municipality
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

// Fetch tallest building within a 1-mile radius of the address
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

// Function to convert city and county names to Proper Case
function toProperCase(str) {
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase()).join(' ');
}

// Function to format county names that contain special characters
function specialCountyFormatting(county) {
  const specialCases = {
      'miamidade': 'Miami-Dade',
      'stjohns': "St. John's",
      'stlucie': 'St. Lucie',
      'palmbeach': 'Palm Beach'
  };
  return specialCases[county] || toProperCase(county);
}

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
  
/* Loading animations */
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

/* Update the fake loading progress bar */
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
  
