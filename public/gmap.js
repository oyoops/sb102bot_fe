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
    // Adjust map options for better mobile interaction and apply color scheme styling
    const mapOptions = {
        center: { lat: lat, lng: lng },
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        styles: [],
        gestureHandling: 'greedy', // Allows map to be moved with one finger on mobile
        streetViewControl: false, // Disable Street View control
        fullscreenControl: false, // Disable Fullscreen control
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

    // Create an animated marker for the subject site with the custom icon
    const userMarker = new google.maps.Marker({
        position: { lat: lat, lng: lng },
        map: map,
        icon: subjectSiteIcon, // Use the custom icon
        zIndex: google.maps.Marker.MAX_ZINDEX + 1, // Ensure it's on top of other markers
        animation: google.maps.Animation.DROP // Add drop animation
    });

    // Delay the animation of the tallest building and comps markers
    setTimeout(() => {
        // Code for animating tallest building-related elements will go here
    }, 2000); // 2 seconds after the subject site marker

    const userInfowindow = new google.maps.InfoWindow({
        content: `<div style="text-align:center;"><strong>Subject</strong></div>`
    });

    // New test...
    userInfowindow.open(map, userMarker);

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

            buildingMarker.addListener('click', function () {
                buildingInfowindow.open(map, buildingMarker);
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
            createStyledMarker(lineLabelPos, map, `${buildingHeight.toFixed(0)}' max. height\n${distanceInMilesToTallestBldg.toFixed(2)} miles away`);

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

// Adds each comp returned to a Google Map
function addCompsMarkersToMap(responseData) {
    // Create a new bounds object
    let bounds = new google.maps.LatLngBounds();

    responseData.forEach(item => {

        // Custom icon using SVG for a smaller and different-colored marker
        const customIcon = {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: 'orange', // Change this color as needed
            fillOpacity: 0.8,
            scale: 14,  // Adjust the size using the scale property
            strokeColor: 'white',
            strokeWeight: 2
        };
        
        const markerPosition = new google.maps.LatLng(item.lat, item.lng);
        // Add a delay between each comps marker animation for a fancy effect
        setTimeout(() => {
            const marker = new google.maps.Marker({
                position: markerPosition,
                map: map,
                title: item.property_name, // Comp name
                icon: customIcon,
                animation: google.maps.Animation.DROP // Add drop animation
            });

            // Add a label above the marker with the property name
            const label = new google.maps.Marker({
                position: markerPosition,
                map: map,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: 'transparent', // Transparent fill
                    fillOpacity: 0,
                    scale: 0, // No scale
                    strokeWeight: 0
                },
                label: {
                    text: item.property_name, // Property name
                    color: 'black', // Text color
                    fontSize: '10px', // Smaller font size
                }
            });
        }, index * 200); // Small delay between each marker

        // Extend the bounds to include each comp marker
        /* Probably will cause an error if zero comps within radius... */
        bounds.extend(markerPosition);

        // Info window content
        const infoContent = `
            <strong><u>${item.property_name}</u><br>
            by ${item.dev_name} (${item.yr_built})</strong><br>
            ${item.property_address}<br><br>

            ${item.num_of_stories}-story ${item.style} (${item.num_of_units} units)<br>
            $${item.avg_eff_unit}/mo. = ${item.avg_unit_sf} SF @ $${item.avg_eff_sf}/SF<br>
            Occupancy: ${(100-item.vacancy_pct)}%
        `;

        const infoWindow = new google.maps.InfoWindow({
            content: infoContent
        });
        
        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });
    });

    // Once all markers have been added, adjust viewport to show all
    /* This probably causes an error if zero comps are available (again...) */
    map.fitBounds(bounds);
}
