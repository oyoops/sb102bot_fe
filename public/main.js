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
            const geocodeEndpoint = `/api/geocode?address=${encodeURIComponent(address)}`;
            const geocodeResponse = await fetch(geocodeEndpoint);
            if (!geocodeResponse.ok) {
                throw new Error(`Server responded with ${geocodeResponse.status}: ${await geocodeResponse.text()}`);
            }
            const geocodeData = await geocodeResponse.json();
            if (!geocodeData.results || geocodeData.results.length === 0) {
                throw new Error('No parcel found at that address.');
            }

            const lat = geocodeData.results[0].geometry.location.lat;
            const lng = geocodeData.results[0].geometry.location.lng;

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

            console.log('Data populated successfully.');

            // Display tables
            document.getElementById('countyDataTable').style.display = 'table'; // Display the county data table
            document.getElementById('countyMaxRentsTable').style.display = 'table'; // Display the county max rents table
            document.getElementById('acreageSection').style.display = 'block'; // Display the acreage input section

            // DONE with Part 1


            // After successfully populating the tables...
            //...display the acreage input section
            document.getElementById('countyDataTable').style.display = 'table'; // Display the county data table
            document.getElementById('countyMaxRentsTable').style.display = 'table'; // Display the county max rents table
            document.getElementById('acreageSection').style.display = 'block'; // Display the acreage input section

            //...show affordable % slider
            const affordablePercentageSlider = document.getElementById("affordablePercentageSlider");
            const affordablePercentageValue = document.getElementById("affordablePercentageValue");
            affordablePercentageSlider.oninput = function() {
                affordablePercentageValue.textContent = this.value + '%';
                calculateUnits(); // Recalculate units when the slider value changes.
            }


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


