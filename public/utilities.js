// utilities.js - contains the utility functions for the SB102bot web app.

/*===========//
// Functions //
//    for    //
//  main.js  //
//===========*/



/* IN TESTING */
/* AI-related functions: */

// fetch AI response set
async function fetchAiEnhancements(row) {
  // Define the endpoints
  const endpoints = [
      '/api/ask_ai_part1A',
      '/api/ask_ai_part1B',
      '/api/ask_ai_part1C',
      '/api/ask_ai_part1D',
      '/api/ask_ai_part1E'
  ];

  // Convert row object to query string
  const queryString = new URLSearchParams(row).toString();

  // Create an array of fetch promises
  const fetchPromises = endpoints.map(endpoint => {
      return fetch(`${endpoint}?${queryString}`) // append query string to endpoint
      .then(response => {
          if (!response.ok) {
              // If HTTP-status is 4xx or 5xx, throw error
              throw new Error(`Failed to fetch from ${endpoint}: ${response.statusText}`);
          }
          return response.json();
      });
  });

  try {
      // Wait for all fetches to complete
      const results = await Promise.all(fetchPromises);
      return results;
  } catch (error) {
      console.error("Error fetching AI enhancements:", error);
      throw error;
  }
}

// display AI response set
function displayAiEnhancements(enhancements) {
  // Log the received enhancements for debugging
  console.log("Received AI Summary");

  // Create and populate the summary message
  let summaryMessage = "</br><h2><b><u>Some thoughts about this property:</u></b> says:</h2><ul>";
  enhancements.forEach((enhancement, index) => {
      summaryMessage += `<li>${enhancement}</li>`;
  });
  summaryMessage += "</ul>";

  // Log the summary for debugging purposes
  console.log("AI Summary:\n" + summaryMessage);

  // Return the summary message
  return summaryMessage;
}

function animateTextFadeIn(element) {
  const textContent = element.textContent; // This will get the plain text without HTML tags
  let contentArray = textContent.split('');
  let current = 0;
  element.textContent = ''; // Clear the current content
  let interval = setInterval(() => {
      element.textContent += contentArray[current];
      current++;
      if (current === contentArray.length) {
          clearInterval(interval);
          element.innerHTML = element.textContent; // Restore the HTML formatting
      }
  }, 50); // Adjust this interval time to speed up or slow down the animation
}




/* VERIFIED */

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


/*
// Fetch the AI 'memo' by adding all relevant global vars as endpoint parameters
async function runAISection() {
    const textMod = ` Make it good. `;

    const aiContainer = document.getElementById('aiContainer');
    aiContainer.style.display = 'block';
    aiContainer.innerHTML = `<i><p>Drafting your memo, please be patient...<p></i>`;
    const icMemoEndpoint = `/api/ask_ai?address=${encodeURIComponent(address)}&county=${countyData.county_name}&acreage=${acreageInput.value}&totalUnits=${totalUnits}&affordablePct=${affordablePct}&affStudio=${countyData.max_rent_0bd_120ami}&aff1BD=${countyData.max_rent_1bd_120ami}&aff2BD=${countyData.max_rent_2bd_120ami}&aff3BD=${countyData.max_rent_3bd_120ami}&textModifier=${encodeURIComponent(textMod)}`;
    const icMemoResponse = await fetch(icMemoEndpoint);
    const icMemo = await icMemoResponse.text();
    console.log("IC Memo Received:", icMemo);
    aiContainer.innerHTML = icMemo;
}
*/

// Function to convert city and county names to Proper Case
function toProperCase(str) {
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase()).join(' ');
}

function specialCountyFormatting(county) {
  const specialCases = {
      'miamidade': 'Miami-Dade',
      'stjohns': "St. John's",
      'stlucie': 'St. Lucie',
      'palmbeach': 'Palm Beach'
  };

  return specialCases[county] || toProperCase(county);
}