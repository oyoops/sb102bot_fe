# Utilities.js Function Descriptions

This file contains descriptions of each function contained within `utilities.js`.

## API Calling Functions

- `geocodeAddress(address)`: This function takes an address as input and returns geocoded data for that address.

- `checkCity(geoData)`: This function takes geocoded data as input and checks if the location is within city limits.

- `fetchCountyData(lat, lng)`: This function fetches county data for a given latitude and longitude.

- `fetchParcelData(lat, lng, countyName)`: This function fetches parcel data for a given latitude, longitude, and county name.

- `fetchAPI(url)`: This function fetches data from a given API endpoint.

- `getMunicipality(cityData, countyData)`: This function returns the municipality name based on city and county data.

## AI-Related Functions

- `runAIModule(eligPath, superAI, aiSupplementalData, countyData, cityData, compsData, debugMode=false, customInstructionsText)`: This function is the main entry point for the AI module.

- `handleAIError(error)`: This function handles errors that occur within the AI module.

- `fetchAiResponsesCombined(eligPath, cleanData, superAI, debug=false, customInstructionsText)`: This function fetches combined AI responses.

- `composeFormattedAiResponse(aiResponse, titleLine = `🌞 Living Local in ${displayMuniName} 😎`)`: This function composes the final output by prepending it with a title.

- `refineData(rawData, superAI)`: This function adds globals to the dataset and applies final super-enhancements.

- `animateTextFadeIn(element)`: This function fades in the AI response text.

- `timeout(ms)`: This function creates a timeout, putting a time limit on each AI endpoint.

## Non-AI Functions

- `fetchTallestBuilding(lat, lng, radius)`: This function fetches the tallest building within a given radius of a set of coordinates.

- `toProperCase(str)`: This function converts a string to Proper Case.

- `specialCountyFormatting(county)`: This function formats county names that contain special characters.

- `verifyParcelData(parcelData)`: This function verifies the integrity of parcel data.

- `getMaxDensity(county, city)`: This function gets the maximum density of a municipality.

- `enhanceWithCountyData(aiSupplementalData, countyData)`: This function adds county data to supplemental data.

- `enhanceWithCityData(aiSupplementalData, cityData)`: This function adds city data to supplemental data.

- `enhanceWithCompsData(aiSupplementalData, compsData)`: This function adds comps data to supplemental data.

- `getDirtyData(aiSupplementalData)`: This function gets AI supplemental data in parsed JSON format.

- `getDirtyDataString(aiSupplementalData)`: This function gets AI supplemental data in stringified format.

- `updateLoadingBar()`: This function updates the fake loading progress bar.

- `generateAndDownloadExcel(data, format = 'xlsx')`: This function generates and downloads an Excel workbook.

- `runInitialDevelopmentCalculations()`: This function runs initial development calculations.
