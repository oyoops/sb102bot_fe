// gmap.js - Functions for the Google Map


/* FUNCTIONS */

// Load the Google Maps API dynamically
function initMap() {
    // Maps API is now loaded and can be used.
}

// Load the Google Maps API dynamically
function loadGoogleMapsAPI() {
    const script = document.createElement('script');
    script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDJlvljO-CVH5ax4paudEnj9RoERL6Xhbc&libraries=places,geometry&callback=initMap";
    document.body.appendChild(script);
}

// Initialize the Google Map
async function initializeMap(lat, lng) {
    console.log('Centering map on lat:', lat, ', lng:', lng);
    const mapOptions = {
        center: { lat: lat, lng: lng },
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.SATELLITE
    };

    map = new google.maps.Map(mapDisplay, mapOptions);
    ////console.log('Map initialized');

    // Define a custom icon for the subject site marker
    const subjectSiteIcon = {
        url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png', // A blue icon to stand out
        scaledSize: new google.maps.Size(40, 40), // Size of the icon
        origin: new google.maps.Point(0, 0), // Origin of the icon
        anchor: new google.maps.Point(20, 40) // Anchor point of the icon
    };

    // Create a marker for the subject site with the custom icon
    const userMarker = new google.maps.Marker({
        position: { lat: lat, lng: lng },
        map: map,
        icon: subjectSiteIcon, // Use the custom icon
        zIndex: google.maps.Marker.MAX_ZINDEX + 1 // Ensure it's on top of other markers
    });

    const userInfowindow = new google.maps.InfoWindow({
        content: `<div style="text-align:center;"><strong>You</strong></div>`
    });

    userMarker.addListener('click', function() {
        userInfowindow.open(map, userMarker);
    });

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(new google.maps.LatLng(lat, lng));

    // Keep track
    let maxDistance = 0;
    let maxHeight = 0;

    // Fetch data on tallest buildings within radius
    tallestBuildingsData = await fetchTallestBuilding(lat, lng, LIVE_LOCAL_BLDG_RADIUS_MILES);

    // Parse building(s) and add to map
    (tallestBuildingsData || []).forEach((buildingData, index) => {
        try {
            if (!buildingData.lat || !buildingData.lng) {
                console.warn(`Building #${index} missing valid lat/lng. Skipping...`);
                return;
            }
            buildingLat = parseFloat(buildingData.lat);
            buildingLng = parseFloat(buildingData.lng);
            buildingHeight = buildingData.height || "Uncertain";
            buildingName = buildingData.name || `#${index + 1} tallest building`;
            buildingAddress = buildingData.address || "-";

            const buildingMarker = new google.maps.Marker({
                position: { lat: buildingLat, lng: buildingLng },
                map: map,
            });

            const buildingInfoContent = `
                <div style="text-align:center;">
                    ${buildingName}</br>
                    ${buildingHeight.toFixed(0)} feet tall</br>
                    ${buildingAddress}
                </div>
            `;

            const buildingInfowindow = new google.maps.InfoWindow({
                content: buildingInfoContent
            });

            buildingMarker.addListener('mouseover', function () {
                buildingInfowindow.open(map, buildingMarker);
            });
            buildingMarker.addListener('mouseout', function () {
                buildingInfowindow.close();
            });

            const line = new google.maps.Polyline({
                path: [
                    { lat: lat, lng: lng },
                    { lat: buildingLat, lng: buildingLng }
                ],
                strokeColor: '#FF0000',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                map: map
            });

            // distance between building and subject site
            const distanceInMeters = google.maps.geometry.spherical.computeDistanceBetween(
                new google.maps.LatLng(lat, lng),
                new google.maps.LatLng(buildingLat, buildingLng)
            );
            distanceInMilesToTallestBldg = distanceInMeters * 0.000621371; // convert to miles

            // Keep track of tallest bldg across iterations
            const currentBuildingHeight = parseFloat(buildingHeight);
            /* This could cause an error if zero tall buildings are found within radius. */
            if (currentBuildingHeight > maxHeight) {
                maxHeight = currentBuildingHeight;
                maxDistance = distanceInMilesToTallestBldg;
            }
            
            // create distance label (subject -> tallest bldg)
            const lineLabelPos = new google.maps.LatLng((lat + buildingLat) / 2, (lng + buildingLng) / 2);
            createStyledMarker(lineLabelPos, map, `${buildingHeight.toFixed(0)} feet (${distanceInMilesToTallestBldg.toFixed(2)} mi. away)`);

            // extend map boundaries to include tallest building
            bounds.extend(new google.maps.LatLng(buildingLat, buildingLng));

            window.scrollTo(0, 0);

        } catch (error) {
            console.error(`Error processing tallest building #${index}:`, error);
        }
    });

    if (bounds.getNorthEast() !== bounds.getSouthWest()) {
        map.fitBounds(bounds);
    }
    
    return {maxHeight, maxDistance};
}

// Create a text marker (transparent placemark with a label)
function createStyledMarker(position, map, label) {
    const marker = new google.maps.Marker({
        position: position,
        map: map,
        icon: {
            labelOrigin: new google.maps.Point(11, 50),
            url: 'data:image/svg+xml;charset=utf-8,' +
                encodeURIComponent('<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"></svg>'),
            size: new google.maps.Size(20, 20),
        },
        label: {
            text: label,
            color: "yellow",
            fontWeight: "bold",
            fontSize: "20px"
        }
    });
    return marker;
}



/* Maps + Comps Database */

// Define a function to get the shape based on the building style
function getStyleShape(style) {
    const shapes = {
        'Garden': {
            path: 'M -2 -2 L 2 -2 L 2 2 L -2 2 z', // Square shape for Garden
            scale: 1
        },
        'Mid-Rise': {
            path: 'M 0 -3 L -3 3 L 3 3 z', // Triangle shape for Mid-Rise
            scale: 1
        },
        'Hi-Rise': {
            path: 'M -2 0 L 0 -2 L 2 0 L 0 2 z', // Diamond shape for Hi-Rise
            scale: 1 // Reverted scale for Hi-Rise
        }
    };
    return shapes[style] || shapes['Garden']; // Default to Garden shape if style is not recognized
}

// Define a function to calculate the scale of the icon based on num_of_units
function getCompMarkerScale(num_of_units) {
    const minUnits = 150;
    const maxUnits = 450;
    const minScale = 2; // Smallest size for the icon
    const maxScale = 5; // Largest size for the icon

    // Ensure num_of_units is within the expected range
    num_of_units = Math.max(minUnits, Math.min(num_of_units, maxUnits));

    // Calculate the scale based on num_of_units
    const scale = minScale + (maxScale - minScale) * ((num_of_units - minUnits) / (maxUnits - minUnits));
    return scale;
}

// Define a function to get the color based on the average effective rent
function getRentColor(avg_eff_unit, avgRent) {
    const threshold = 0.15; // 10% threshold for variance
    const maxIntensity = 255;
    let color = '#FFFFFF'; // Default to white for mid-point rent

    // Calculate the percentage difference from the average rent
    const percentageDifference = (avg_eff_unit - avgRent) / avgRent;

    // Calculate the intensity based on the absolute percentage difference
    const intensity = Math.round(maxIntensity * Math.abs(percentageDifference) / threshold);
    // Determine the color based on the percentage difference
    if (percentageDifference > 0) {
        // Above average rent, interpolate between white and green
        color = `rgb(${255 - intensity}, ${255}, ${255 - intensity})`; // Greenish to white gradient
    } else if (percentageDifference < 0) {
        // Below average rent, interpolate between white and red
        color = `rgb(${255}, ${255 - intensity}, ${255 - intensity})`; // Reddish to white gradient
    } else {
        // Exactly average rent, use white
        color = `rgb(255, 255, 255)`; // White
    }

    return color;
}

// Adds each comp returned to a Google Map with unique color
function addCompsMarkersToMap(responseData) {
    // Create a new bounds object
    let bounds = new google.maps.LatLngBounds();
    let openInfoWindows = [];

    responseData.forEach((item, index) => {
        // Get the shape for the marker based on the building style
        const shape = getStyleShape(item.style);
        // Get the color for the marker based on the average effective rent
        // Calculate the average rent of all comps
        const avgRent = responseData.reduce((sum, comp) => sum + comp.avg_eff_unit, 0) / responseData.length;
        const fillColor = getRentColor(item.avg_eff_unit, avgRent);

        // Get the scale for the marker based on unit count
        const scale = getCompMarkerScale(item.num_of_units);

        // Custom icon using the determined shape, color, and scale for the marker
        const customIcon = {
            path: shape.path, // Use the determined shape path
            fillColor: fillColor, // Use the determined color
            fillOpacity: 0.70,
            scale: scale,
            strokeColor: 'white',
            strokeWeight: 1.5
        };

        const markerPosition = new google.maps.LatLng(item.lat, item.lng);
        const marker = new google.maps.Marker({
            position: markerPosition,
            map: map,
            title: item.property_name, // Comp name
            icon: customIcon
        });

        // Extend the bounds to include each comp marker
        bounds.extend(markerPosition);

        // Assuming 'item' is your data object
        const infoContent = `
        <div style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9; border-radius: 8px; padding: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            <h2 style="margin: 0; color: #007bff; font-size: 18px;">${item.property_name}</h2>
            <p class="info-window" style="margin: 5px 0; color: #666;">Developed by ${item.dev_name} (${item.yr_built})</p>
            <p class="info-window" style="margin: 5px 0; color: #666;">${item.property_address}</p>
            <div style="background-color: #fff; border-radius: 5px; padding: 8px; margin-top: 10px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">
                <p class="info-window" style="margin: 4px 0; font-size: 14px;"><strong>${item.num_of_stories}-story ${item.style}</strong> with ${item.num_of_units} units</p>
                <p class="info-window" style="margin: 4px 0; font-size: 14px;"><strong>$${item.avg_eff_unit}/month</strong> - ${item.avg_unit_sf} SF at <strong>$${item.avg_eff_sf}/SF</strong></p>
                <p class="info-window" style="margin: 4px 0; font-size: 14px;"><strong>${(100-item.vacancy_pct)}%</strong> occupied</p>
            </div>
            <div style="margin-top: 15px;">
                <h3 style="font-size: 16px; margin-bottom: 10px;">Unit Types</h3>
                ${
                    item.st_ask_rent_unit ? `
                    <div style="background-color: #eef2f7; border-radius: 5px; padding: 8px; margin-bottom: 10px;">
                        <h4 style="margin: 0 0 5px 0; color: #4a90e2;">Studio</h4>
                        <p class="info-window" style="margin: 2px 0; font-size: 13px;">Rent: $${item.st_ask_rent_unit}/mo</p>
                        <p class="info-window" style="margin: 2px 0; font-size: 13px;">Average Size: ${item.st_avg_sf} SF</p>
                        <p class="info-window" style="margin: 2px 0; font-size: 13px;">Rent/SF: $${item.st_ask_rent_sf}/SF</p>
                    </div>` : ''
                }
                ${
                    item.one_bd_ask_rent_unit ? `
                    <div style="background-color: #eef2f7; border-radius: 5px; padding: 8px; margin-bottom: 10px;">
                        <h4 style="margin: 0 0 5px 0; color: #4a90e2;">1-Bedroom</h4>
                        <p class="info-window" style="margin: 2px 0; font-size: 13px;">Rent: $${item.one_bd_ask_rent_unit}/mo</p>
                        <p class="info-window" style="margin: 2px 0; font-size: 13px;">Average Size: ${item.one_bd_avg_sf} SF</p>
                        <p class="info-window" style="margin: 2px 0; font-size: 13px;">Rent/SF: $${item.one_bd_ask_rent_sf}/SF</p>
                    </div>` : ''
                }
                ${
                    item.two_bd_ask_rent_unit ? `
                    <div style="background-color: #eef2f7; border-radius: 5px; padding: 8px; margin-bottom: 10px;">
                        <h4 style="margin: 0 0 5px 0; color: #4a90e2;">2-Bedroom</h4>
                        <p class="info-window" style="margin: 2px 0; font-size: 13px;">Rent: $${item.two_bd_ask_rent_unit}/mo</p>
                        <p class="info-window" style="margin: 2px 0; font-size: 13px;">Average Size: ${item.two_bd_avg_sf} SF</p>
                        <p class="info-window" style="margin: 2px 0; font-size: 13px;">Rent/SF: $${item.two_bd_ask_rent_sf}/SF</p>
                    </div>` : ''
                }
                ${
                    item.three_bd_ask_rent_unit ? `
                    <div style="background-color: #eef2f7; border-radius: 5px; padding: 8px; margin-bottom: 10px;">
                        <h4 style="margin: 0 0 5px 0; color: #4a90e2;">3-Bedroom</h4>
                        <p class="info-window" style="margin: 2px 0; font-size: 13px;">Rent: $${item.three_bd_ask_rent_unit}/mo</p>
                        <p class="info-window" style="margin: 2px 0; font-size: 13px;">Average Size: ${item.three_bd_avg_sf} SF</p>
                        <p class="info-window" style="margin: 2px 0; font-size: 13px;">Rent/SF: $${item.three_bd_ask_rent_sf}/SF</p>
                    </div>` : ''
                }
            </div>
        </div>
        `;

        const infoWindow = new google.maps.InfoWindow({
            content: infoContent
        });

        // Click listener for marker
        marker.addListener('click', () => {
            // Close all open info windows
            openInfoWindows.forEach(iw => iw.close());
            openInfoWindows = []; // Reset the array

            // Open the clicked info window
            infoWindow.open(map, marker);
            openInfoWindows.push(infoWindow); // Add this info window to the array
        });

        /*marker.addListener('mouseover', () => {
            infoWindow.open(map, marker);
        });
        marker.addListener('mouseout', () => {
            infoWindow.close();
        });*/
    });

    // Click listener for the map to close all info windows
    map.addListener('click', () => {
        openInfoWindows.forEach(iw => iw.close());
        openInfoWindows = [];
    });

    // Once all markers have been added, adjust viewport to show all
    map.fitBounds(bounds);
}