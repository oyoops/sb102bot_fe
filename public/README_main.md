# Web App README

## Overview

This web app is designed to provide users with detailed information about properties, including eligibility for certain programs, comparison of local comps, and various other data points relevant to real estate development.

## Main Features

- **Address Submission**: Users can submit an address to receive a comprehensive analysis.
- **Map Integration**: The app integrates with Google Maps to display relevant geographical data.
- **Data Collection**: The app collects data from various sources to provide a detailed analysis of the submitted address.
- **Eligibility Analysis**: It determines eligibility for programs like Live Local Atlanta (LLA) based on the property's characteristics.
- **Comparative Analysis**: The app compares the submitted property to local comps, providing a detailed comparison.
- **AI Module**: An AI module provides a summary of the property's potential and advice on development.
- **Excel Workbook Generation**: For eligible properties, the app can generate an Excel workbook with a proforma analysis.

## File Structure

- `main.js`: The main JavaScript file that orchestrates the functionality of the web app.
- `eventListeners.js`: Contains event listeners for user interactions.
- `domElements.js`: Manages the DOM elements used throughout the app.
- `calculations.js`: (Read-Only) Contains functions for various calculations related to property analysis.
- `comps.js`: (Read-Only) Handles the generation of comparative analysis tables.
- `utilities.js`: (Read-Only) Provides utility functions such as API fetching.

## How It Works

1. The user submits an address through the form.
2. The app sends the address to various modules to collect geo data, building data, comps data, city and county data, and parcel data.
3. Based on the collected data, the app determines eligibility for different programs and provides a comparative analysis with local comps.
4. The AI module processes the data and provides a summary and development advice.
5. If applicable, the app generates an Excel workbook with a detailed proforma analysis.

## Dependencies

- Google Maps API: Used for map integration and geographical data visualization.
- External APIs: Used to collect various data points for analysis.

## Setup and Running

To set up the web app, ensure that all dependencies are properly installed and configured. Then, serve the files using a web server and navigate to the main page to begin using the app.
