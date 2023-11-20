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
    console.log('Map generated!');

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
        content: `<div style="text-align:center;"><strong>Subject</strong></div>`
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
                strokeOpacity: 0.7,
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
                encodeURIComponent('<svg width="18" height="18" xmlns="http://www.w3.org/2000/svg"></svg>'),
            size: new google.maps.Size(20, 20),
        },
        label: {
            text: label,
            color: "yellow",
            fontWeight: "bold",
            fontSize: "18px"
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
            scale: 1 // Reverted scale for Mid-Rise
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
    const minUnits = 200;
    const maxUnits = 400;
    const minScale = 3; // Smallest size for the icon
    const maxScale = 6; // Largest size for the icon

    // Ensure num_of_units is within the expected range
    num_of_units = Math.max(minUnits, Math.min(num_of_units, maxUnits));

    // Calculate the scale based on num_of_units
    const scale = minScale + (maxScale - minScale) * ((num_of_units - minUnits) / (maxUnits - minUnits));
    return scale;
}

// Define a function to get the color based on the average effective rent
function getRentColor(avg_eff_unit, avgRent) {
    const threshold = 0.10; // 10% threshold for variance
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

    responseData.forEach((item, index) => {
        // Get the shape for the marker based on the building style
        const shape = getStyleShape(item.style);
        // Get the color for the marker based on the average effective rent
        // Calculate the average rent of all comps
        const avgRent = responseData.reduce((sum, comp) => sum + comp.avg_eff_unit, 0) / responseData.length;
        const fillColor = getRentColor(item.avg_eff_unit, avgRent);

        // Calculate the scale for the marker based on num_of_units
        const scale = getCompMarkerScale(item.num_of_units);

        // Custom icon using the determined shape, color, and scale for the marker
        const customIcon = {
            path: (shape && shape.path) ? shape.path : (shape || google.maps.SymbolPath.CIRCLE), // Use the determined shape path, predefined shape, or default to circle
            fillColor: fillColor, // Use the determined color
            fillOpacity: 0.65,
            scale: scale, // Use the calculated scale based on num_of_units
            strokeColor: 'white',
            strokeWeight: 2
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

        // Info window content
        const infoContent = `
            <strong><u>${item.property_name}</u> (${item.yr_built})</strong><br>
            Developer: ${item.dev_name}<br><br>

            <strong>${item.num_of_stories}-story ${item.style} (${item.num_of_units} units)</strong><br>
            <strong>$${item.avg_eff_unit}</strong>/mo. = ${item.avg_unit_sf} SF @ <strong>$${item.avg_eff_sf}</strong>/SF<br>
            Occupancy: ${(100-item.vacancy_pct)}% <br><br>

            <i>${item.property_address}</i><br>
        `;

        const infoWindow = new google.maps.InfoWindow({
            content: infoContent
        });
        
        marker.addListener('mouseover', () => {
            infoWindow.open(map, marker);
        });
        marker.addListener('mouseout', () => {
            infoWindow.close();
        });
    });

    // Once all markers have been added, adjust viewport to show all
    map.fitBounds(bounds);
}
