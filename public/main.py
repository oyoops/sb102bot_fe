
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('#addressForm');
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
            const geocodeData = await geocodeResponse.json();

            const lat = geocodeData.latitude;
            const lng = geocodeData.longitude;

            // Fetch county data using the new endpoint
            const countyDataEndpoint = `/api/load_county_table?lat=${lat}&lng=${lng}`;
            const countyDataResponse = await fetch(countyDataEndpoint);
            const countyData = await countyDataResponse.json();

            // Populate the table with the fetched data
            const row = `
                <tr>
                    <td>${countyData.county_name}</td>
                    <td>${countyData.area_median_income}</td>
                    <td>${countyData.millage_rate}</td>
                    <td>${countyData.county_amis_income}</td>
                    <td>${countyData.county_millage}</td>
                </tr>
            `;
            tableBody.innerHTML = row;
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to fetch data. Please try again.');
        }
    });
});
