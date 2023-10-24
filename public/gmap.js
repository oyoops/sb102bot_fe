// gmap.js - Functions for the Google Map


/* FUNCTIONS */

// url callback (?)
function initMap() {
    // Maps and Places APIs are now loaded and can be used.
}

// Load the Google Maps and Places APIs dynamically
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
        zoom: 17,
        mapTypeId: google.maps.MapTypeId.SATELLITE
    };

    const map = new google.maps.Map(mapDisplay, mapOptions);
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

    // Fetch data on tallest buildings within radius
    tallestBuildingsData = await fetchTallestBuilding(lat, lng, LIVE_LOCAL_BLDG_RADIUS_MILES);

    // Parse buildings and add to map
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
            // distance line label
            const lineLabelPos = new google.maps.LatLng((lat + buildingLat) / 2, (lng + buildingLng) / 2);
            createStyledMarker(lineLabelPos, map, `${buildingHeight.toFixed(0)} feet tall\n${distanceInMilesToTallestBldg.toFixed(2)} miles away`);

            bounds.extend(new google.maps.LatLng(buildingLat, buildingLng));
        } catch (error) {
            console.error(`Error processing tallest building #${index}:`, error);
        }
    });

    if (bounds.getNorthEast() !== bounds.getSouthWest()) {
        map.fitBounds(bounds);
    }
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
