document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('#searchForm');
    const tableBody = document.querySelector('#countyDataTable tbody');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const addressInput = document.querySelector('#addressInput');
        const address = addressInput.value;

        if (!address) {
            alert('Please enter an address.');
            return;
        }

        try {
            // First, geocode the address
            const geocodeEndpoint = `/api/geocode?address=${encodeURIComponent(address)}`;
            const geocodeResponse = await fetch(geocodeEndpoint);
            console.log("A");
            if (!geocodeResponse.ok) {
                throw new Error(`Server responded with ${geocodeResponse.status}: ${await geocodeResponse.text()}`);
            }
            console.log("B");
            const geocodeData = await geocodeResponse.json();
            console.log("C");
            if (!geocodeData.results || geocodeData.results.length === 0) {
                console.log("Input Address: " + address);
                throw new Error('No matching location found for the provided address.\n');
            }
            console.log("D");

            const lat = geocodeData.results[0].geometry.location.lat;
            const lng = geocodeData.results[0].geometry.location.lng;

            console.log("E");

            // Fetch county data using the new endpoint
            console.log("F");
            const countyDataEndpoint = `/api/load_county_table?lat=${lat}&lng=${lng}`;
            console.log("G");
            const countyDataResponse = await fetch(countyDataEndpoint); /////////////
            console.log("H");
            const countyData = await countyDataResponse.json();
            console.log("I");

            if (!countyData.county_name) {
                throw new Error('No data available for the selected location.');
            }
            console.log("J");

            // Populate the table with the fetched data
            const row = `
                <tr>
                    <td>${countyData.county_name}</td>
                    <td>${countyData.county_amis_income}</td>
                    <td>${countyData.county_millage}</td>
                </tr>
            `;
            tableBody.innerHTML = row;
            console.log("K");
        } catch (error) {
            console.log("L");
            if (error.message.startsWith("Server responded with")) {
                // This is an HTTP error from our server
                console.error('Server error:', error);
                alert('There was an error with the server. Please try again later.');
            } else {
                console.log("M");
                // This is some other kind of error (e.g., network issue, JSON parsing issue)
                console.error('Error:', error);
                alert('Failed to fetch data. Please try again.');
            }
            console.log("N");
        }
    });
    console.log("O");
});
