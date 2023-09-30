document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('#searchForm');
    const countyTableBody = document.querySelector('#countyDataTable tbody');
    const rentsTableBody = document.querySelector('#countyMaxRentsTable tbody');  // Select the new table's tbody

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const addressInput = document.querySelector('#addressInput');
        const address = addressInput.value;

        if (!address) {
            alert('Please enter an address.');
            return;
        }

        try {
            // Call the geocode API on input address
            const geocodeEndpoint = `/api/geocode?address=${encodeURIComponent(address)}`;
            document.querySelector('.loading').style.display = 'block';  // Show loading indicator
            const geocodeResponse = await fetch(geocodeEndpoint);
            document.querySelector('.loading').style.display = 'none';  // Hide loading indicator
            if (!geocodeResponse.ok) {
                throw new Error(`Server responded with ${geocodeResponse.status}: ${await geocodeResponse.text()}`);
            }
            const geocodeData = await geocodeResponse.json();
            if (!geocodeData.results || geocodeData.results.length === 0) {
                throw new Error('WHOOPS!!!!!!!!\nNo parcel found there.');
            }

            // only proceed if we have lat/lng
            const lat = geocodeData.results[0].geometry.location.lat;
            const lng = geocodeData.results[0].geometry.location.lng;

            // Initialize the map
            const mapOptions = {
                center: { lat: lat, lng: lng },
                zoom: 15,
                mapTypeId: 'satellite'
            };
            const map = new google.maps.Map(document.getElementById("map"), mapOptions);



            // only proceed if we have county data
            const countyDataEndpoint = `/api/load_county_table?lat=${lat}&lng=${lng}`;
            const countyDataResponse = await fetch(countyDataEndpoint);
            const countyData = await countyDataResponse.json();
            
            if (!countyData.county_name) {
                throw new Error('No data available for the selected location.');
            }

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
            console.log('Part 1 -- Data successfully populated.');

            // After successfully populating the tables,
            // display the 'Development Program' inputs section (Part 2)
            document.getElementById('developmentProgramInputSection').style.display = 'block';

        } catch (error) {
            if (error.message.startsWith("Server responded with")) {
                console.error('Server error:', error);
                alert('There was an error with the server. Please try again later.');
            } else {
                console.error('Error:', error);
                alert('Failed to fetch data. Please try again.');
            }
        }
    });
});


