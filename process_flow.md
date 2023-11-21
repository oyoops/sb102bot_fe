# Main.js Process Flow

## Initialization
- The script starts by importing event listeners and DOM elements.
- It sets up the initial state by scrolling to the top of the window.

## Event Listeners
- Two event listeners are added for the 'superchargeSwitch' and 'debugModeCheckbox' checkboxes to toggle their states and log the changes.
- The main form submission event listener is set up to prevent the default action, validate the address input, and send the address to Google Analytics.

## Main Script Execution
- The script hides the header, initial content, and other sections to prepare for loading the main content.
- It displays a fake loading progress bar and triggers color transitions for loading squares.
- The script then starts the Data Collection Module, which includes:
  - Geocoding the address to get latitude and longitude.
  - Initializing the map with the tallest building data.
  - Fetching city and county data, determining the municipality name, and calculating maximum municipal density.
  - Fetching parcel data to determine acreage and maximum unit capacity.

## Eligibility Determination
- The script determines the eligibility for the Live Local Act based on the property's use code.
- It sets the site colors based on eligibility and populates the comparison table if eligible.

## AI Module
- The script prepares data for the AI module and handles any errors.
- It generates AI summary HTML content, hides loading indicators, and displays the AI summary response.

## Excel Workbook Generation Module
- If the 'superchargeSwitch' is on, the script generates and downloads an Excel workbook with the necessary data.

## Error Handling
- The script includes a last-chance error catching block to handle server errors and other exceptions.

## Google Maps API
- The script dynamically loads the Google Maps API.

## Document Ready Event
- All the above steps are wrapped inside a 'DOMContentLoaded' event listener to ensure they run after the full DOM is loaded.
