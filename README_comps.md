# comps.js Function Documentation

This document provides descriptions for each function contained within `comps.js`.

## runCompsModule(latitude, longitude, radius, compsLimit)
Initiates the comps module by querying the comps endpoint with provided parameters, processing the data, displaying the comps table, and adding comp placemarks to the map.

## displayCompsTable(compsData)
Creates and displays the market comps table using the data retrieved from the comps endpoint.

## generateMarketRentsTableHTML(compsData)
Generates the HTML for the market rents table based on the comps data provided.

## generateAffordableTableHTML(countyData, compsData)
Generates the HTML for the table comparing average market rents to affordable maximum rents by unit type.

## generateLiveLocalTable(compsData)
Generates and populates the live local table with comps data, allowing for editable fields and recalculating weighted averages on data changes.

## generateCompsTable(compsData)
Generates and populates the comps table with data, allowing for editable fields and recalculating weighted averages on data changes.

## getColumnHeaderFromKey(key)
Defines the column names for the tables based on the provided key.

## handleCellEditKeypress(event)
Handles the keypress event for editable table cells, specifically for when the Enter key is pressed, moving the focus to the next cell or blurring the current cell.

## recalculateWeightedAverages()
Recalculates and updates the weighted averages in the live local table when data in editable cells is changed.
