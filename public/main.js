document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('#searchForm');
    const countyTableBody = document.querySelector('#countyDataTable tbody');
    const rentsTableBody = document.querySelector('#countyMaxRentsTable tbody');  // Select the new table's tbody

    function initializeMap(lat, lng) {
        const mapOptions = {
            center: { lat: lat, lng: lng },
            zoom: 17,
            mapTypeId: google.maps.MapTypeId.SATELLITE
        };
    
        const map = new google.maps.Map(document.getElementById('map'), mapOptions);
    
        // Add a marker at the specified location
        new google.maps.Marker({
            position: { lat: lat, lng: lng },
            map: map
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const addressInput = document.querySelector('#addressInput');
        const address = addressInput.value;

        if (!address) {
            alert('Please enter an address.');
            return;
        }

        try {
            console.log('Start: Part 1 -- Geocoding + Database Lookup -> County Data');

            // Call the geocode API on input address
            const geocodeEndpoint = `/api/geocode?address=${encodeURIComponent(address)}`;
            document.querySelector('.loading').style.display = 'block';  // Show loading indicator
            const geocodeResponse = await fetch(geocodeEndpoint);
            
            // Check if fetch went through successfully
            if (!geocodeResponse.ok) {
                console.log('ERROR! Geocode API call failed.');
                throw new Error(`Server responded with ${geocodeResponse.status}: ${await geocodeResponse.text()}`);
            }

            // Get the geocode data
            const geocodeData = await geocodeResponse.json();

            // Check if geocode successfully returned any result(s)
            if (!geocodeData.results || geocodeData.results.length === 0) {
                throw new Error('WHOOPS!!!!!!!!\nNo parcel found there.');
            }

            // Only proceeds if geocode was successful
            // (so even if we never get an address, we can still do lat/long stuff)

            // Get the lat/long from the geocode data
            const lat = geocodeData.results[0].geometry.location.lat;
            const lng = geocodeData.results[0].geometry.location.lng;
            
            // Dynamically create a div for the map
            const mapDiv = document.createElement('div');
            mapDiv.id = 'map';
            mapDiv.style.width = '100%';
            mapDiv.style.height = '400px';
            document.querySelector('#result').appendChild(mapDiv);

            // Show the Google Map container
            document.getElementById('mapContainer').style.display = 'block';
            
            // Initialize map using lat/lng instead of user input address
            initializeMap(lat, lng);

            // Check the PostgreSQL database for the county at this location (geocoded lat/long derived from address)
            const countyDataEndpoint = `/api/load_county_table?lat=${lat}&lng=${lng}`;
            const countyDataResponse = await fetch(countyDataEndpoint);
            const countyData = await countyDataResponse.json();

            // Check if PostgreSQL database successfully got the county at this location (geocoded lat/long derived from address)
            if (!countyData.county_name) {
                throw new Error('No data available for the selected location.');
            }

            // Only proceeds if we successfully got county data
            // (which means we got a match at this lat/long in the database)

            // Populate the county data table
            const countyRow = `
                <tr>
                    <td>${countyData.county_name}</td>
                    <td>${countyData.county_amis_income}</td>
                    <td>${countyData.county_millage}</td>
                </tr>
            `;
            countyTableBody.innerHTML = countyRow;

            // Display the county Data table (AMI & Millage rate) now that we have data
            ////document.getElementById('countyDataTable').style.display = 'block';
            document.getElementById('countyDataTable').style.display = 'table'; // Display the county data table
            
            // Populate the max rents table
            const rentsRow = `
                <tr>
                    <td>${countyData.max_rent_0bd_120ami}</td>
                    <td>${countyData.max_rent_1bd_120ami}</td>
                    <td>${countyData.max_rent_2bd_120ami}</td>
                    <td>${countyData.max_rent_3bd_120ami}</td>
                </tr>
            `;
            rentsTableBody.innerHTML = rentsRow;

            // Display the county Max Rents table now that we have data
            ////document.getElementById('countyMaxRentsTable').style.display = 'block';
            document.getElementById('countyMaxRentsTable').style.display = 'table'; // Display the county max rents table
            
            // DONE with Part 1
            console.log('End: Part 1 -- Geocoding + Database Lookup -> County Data');

            // Display the 'Development Program' inputs section (Part 2) after successfully populating the tables
            document.getElementById('developmentProgramInputSection').style.display = 'block';

        } catch (error) {
            if (error.message.startsWith("Server responded with")) {
                console.error('Server error:', error);
                alert('There was an error with the server. Please try again later.');
            } else {
                console.error('Error:', error);
                // TO-DO: Reset loading indicator (currently gets left hanging if error occurs before Part 1 is complete)
                alert('Failed to fetch data.\nPlease try again in a few minutes.');
            }
        }
    });
});


