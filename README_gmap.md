# gmap.js Function Documentation

This document provides descriptions for each function contained within `gmap.js`.

## initMap()
This function is a placeholder that gets called when the Google Maps API is loaded.

## loadGoogleMapsAPI()
Dynamically loads the Google Maps API by creating a script element with the API URL and appending it to the document body.

## initializeMap(lat, lng)
Initializes the Google Map centered on the given latitude and longitude. It sets up the map options, creates a marker for the subject site, fetches data on the tallest buildings within a radius, and adds them to the map with custom markers and info windows.

## createStyledMarker(position, map, label)
Creates a text marker on the map at the given position with a specified label. The marker is transparent with a label that appears above it.

## getStyleShape(style)
Returns a custom SVG path for a marker shape based on the building style provided. It supports 'Garden', 'Mid-Rise', and 'Hi-Rise' styles with a default square shape for unrecognized styles.

## getCompMarkerScale(num_of_units)
Calculates and returns the scale for a comp marker icon based on the number of units. The scale is interpolated between a minimum and maximum value based on the number of units.

## getRentColor(avg_eff_unit, avgRent)
Determines and returns a color for a comp marker based on the average effective rent in comparison to the overall average rent. The color is interpolated between green and red with white as the midpoint.

## addCompsMarkersToMap(responseData)
Adds markers to the Google Map for each comp in the responseData array. Each marker is styled with a unique color, shape, and scale based on the comp's data. Info windows are also set up to display detailed information about each comp.
