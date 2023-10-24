// utilities.js - contains the utility functions for the SB102bot web app.

/*===========//
// Functions //
//    for    //
//  main.js  //
//===========*/


/* AI-Related Functions: */

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
  