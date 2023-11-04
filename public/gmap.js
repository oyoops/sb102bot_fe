// gmap.js - Functions for the Google Map


/* FUNCTIONS */

// Load the Google Maps API dynamically
function initMap() {
    // Maps and Places APIs are now loaded and can be used.
}

// Load the Google Maps and Places APIs dynamically
function loadGoogleMapsAPI() {
    const script = document.createElement('script');
    script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDJlvljO-CVH5ax4paudEnj9RoERL6Xhbc&libraries=places,geometry&callback=initMap";
    document.body.appendChild(script);
}

/*
// For address autocomplete (not really map, per se...)
// Load the Google Places API dynamically
function loadGooglePlacesAPI() {
    const script = document.createElement('script');
    script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDJlvljO-CVH5ax4paudEnj9RoERL6Xhbc&libraries=geometry&callback=initPlaces";
    document.body.appendChild(script);
    // Places API is now loaded and can be used.
    console.log("Ring-ring... Places API called back for you on Line 2!");
}
function initPlaces() {
    const script = document.createElement('script');
    script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDJlvljO-CVH5ax4paudEnj9RoERL6Xhbc&libraries=geometry&callback=initPlaces";
    document.body.appendChild(script);
}
*/

// Initialize the Google Map
async function initializeMap(lat, lng) {
    console.log('Centering map on lat:', lat, ', lng:', lng);
    const mapOptions = {
        center: { lat: lat, lng: lng },
        zoom: 17,
        mapTypeId: google.maps.MapTypeId.SATELLITE
    };

    map = new google.maps.Map(mapDisplay, mapOptions);
    console.log('Map generated!');

    const userMarker = new google.maps.Marker({
        position: { lat: lat, lng: lng },
        map: map
    });

    const userInfowindow = new google.maps.InfoWindow({
        content: `<div style="text-align:center;"><strong>Subject</strong></div>`
    });

    userMarker.addListener('click', function() {
        userInfowindow.open(map, userMarker);
    });

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(new google.maps.LatLng(lat, lng));

    // Keep track of the tallest one
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

            // distance between subject-building
            const distanceInMeters = google.maps.geometry.spherical.computeDistanceBetween(
                new google.maps.LatLng(lat, lng),
                new google.maps.LatLng(buildingLat, buildingLng)
            );
            distanceInMilesToTallestBldg = distanceInMeters * 0.000621371;

            ///// NEW: Keep track of tallest
            const currentBuildingHeight = parseFloat(buildingHeight);
            if (currentBuildingHeight > maxHeight) {
                maxHeight = currentBuildingHeight;
                maxDistance = distanceInMilesToTallestBldg;
                //console.log(`New tallest = ${maxHeight}'`);
            }
            /////

            // distance line label
            const lineLabelPos = new google.maps.LatLng((lat + buildingLat) / 2, (lng + buildingLng) / 2);
            createStyledMarker(lineLabelPos, map, `${buildingHeight.toFixed(0)} feet tall\n${distanceInMilesToTallestBldg.toFixed(2)} miles away`);

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
function addCompsMarkersToMap(data) {
    data.forEach(item => {

        // Custom icon using SVG for a smaller and different-colored marker
        const customIcon = {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: 'blue', // Change this color as needed
            fillOpacity: 0.8,
            scale: 10,  // Adjust the size using the scale property
            strokeColor: 'white',
            strokeWeight: 2
        };

        const marker = new google.maps.Marker({
            position: { lat: item.lat, lng: item.lng }, // Comp location
            map: map,
            title: item.property_name, // Comp name
            icon: customIcon
        });

        // Info window content
        const infoContent = `
            <strong>${item.property_name}</strong><br>
            by ${item.dev_name} (${item.yr_built})<br>
            ${item.property_address}<br><br>

            ${item.num_of_units} units<br>
            ${item.num_of_stories} stories<br><br>

            $${item.avg_eff_sf}/SF = ${item.avg_unit_sf} SF @ $${item.avg_eff_unit}/mo.<br><br>

            ${item.style}
            ${(1-item.vacancy_pct)}% occupancy
        `;

        const infoWindow = new google.maps.InfoWindow({
            content: infoContent
        });
        
        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });
    });
}


