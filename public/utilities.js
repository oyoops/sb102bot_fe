// utilities.js - contains the utility functions for the SB102bot web app.

/*===========//
// Functions //
//    for    //
//  main.js  //
//===========*/


/* AI-Related Functions: */

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

// fetch the set of AI responses
async function fetchAiResponsesCombined(row) {
  const endpoints = [
      '/api/ask_ai_part1A',
      '/api/ask_ai_part1B',
      '/api/ask_ai_part1C',
      '/api/ask_ai_part1D',
      '/api/ask_ai_part1E'
  ];

  const queryString = new URLSearchParams(row).toString();

  const fetchPromises = endpoints.map(endpoint => {
      return fetch(`${endpoint}?${queryString}`)
      .then(response => {
          if (!response.ok) {
              console.error(`Failed at endpoint ${endpoint} with status: ${response.statusText}`);
              throw new Error(`Failed to fetch from ${endpoint}: ${response.statusText}`);
          }
          return response.json();
      })
      .catch(err => {
          console.error(`Error during fetch from endpoint ${endpoint}: ${err}`);
          throw err;
      });
  });

  try {
      const results = await Promise.all(fetchPromises);

      /*
      results.forEach(result => {
          console.log('OpenAI Prompt:', result?.choices?.[0]?.message?.content);
          console.log('OpenAI Response:', result?.choices?.[1]?.message?.content);
          console.log('Total Tokens Used:', result?.usage?.total_tokens);
      });
      */

      return results;
  } catch (error) {
      const errorMessage = error?.data?.error?.message || "An unknown error occurred while fetching AI responses.";
      console.error("Error while fetching AI responses:", errorMessage);
      throw error;
  }
}

// combine the multiple AI responses
function composeAiResponsesCombined(aiResponses) {
  if (!aiResponses || aiResponses.length === 0) {
      console.error("No AI responses received");
      return;
  }
  console.log("Received set of AI responses.");

  let aiCombinationParts = [
      `</br></br>
      <h3 style="color:black;" align="center">
      First, let's review some preliminary intel.
      </h3>
      <ul>`
  ];  // (the HTML intro really belongs somewhere else...)

  aiResponses.forEach((aiResponse, index) => {
    aiCombinationParts.push(`<li>${aiResponse}</li>`);
  });
  aiCombinationParts.push("</ul>");

  const combinedResponses = aiCombinationParts.join('');
  return combinedResponses;
}

// fade in the AI response text
function animateTextFadeIn(element) {
  if (!element) {
      console.error("Invalid animation.");
      return;
  }

  const original = element.cloneNode(true);
  element.innerHTML = '';

  let queue = [{ node: original, parent: element }];
  let childQueue = [];

  let interval = setInterval(() => {
      if (queue.length > 0) {
          const { node, parent } = queue.shift();

          if (node.nodeName !== "#text" || node.textContent.trim() !== "") {
              const appendedNode = parent.appendChild(node.cloneNode(false));

              if (node.childNodes.length > 0) {
                  Array.from(node.childNodes).forEach(child => {
                      childQueue.push({ node: child, parent: appendedNode });
                  });
              }
          }

          if (queue.length === 0) {
              queue = childQueue;
              childQueue = [];
          }
      } else {
          clearInterval(interval);
      }
  }, 75); //   <---- increase/decrease to change text fading speed
}

/* Update the fake loading progress bar */
function updateLoadingBar() {
  const loadingFill = document.querySelector('.loading-fill');
  const loadingPercentage = document.querySelector('.loading-percentage');

  percentageLoading = percentageLoading + (1 - percentageLoading / 100) * 2; // This makes it slow down as it approaches 100

  if (percentageLoading >= 99) {
    percentageLoading = 99;
  }

  loadingFill.style.width = percentageLoading + '%';
  loadingPercentage.textContent = Math.round(percentageLoading) + '%';

  if (percentageLoading < 99) {
      setTimeout(updateLoadingBar, intervalTimeLoading);
  }
}


/* Non-AI Functions: */

// Get max density of a municipality
async function getMaxDensity(county, city) {
  try {
    const response = await fetch(`https://www.oyoops.com/api/get_max_density?county=${county}&city=${city}`);
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
        const response = await fetch(`https://www.oyoops.com/api/building_height?lat=${lat}&lng=${lng}&radius=${radius}`);
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
  