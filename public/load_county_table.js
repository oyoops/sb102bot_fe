// Assuming you have an endpoint like /api/aggregate_county_data?lat=xx&lng=yy
//const endpoint = '/api/aggregate_county_data?lat=27.9944024&lng=-81.7602544';  // Replace with your actual endpoint
const endpoint = '/api/aggregate_county_data?lat=27.9944024&lng=-81.7602544';  // Replace with your actual endpoint

fetch(endpoint)
    .then(response => response.json())
    .then(data => {
        const tableBody = document.querySelector('#countyDataTable tbody');
        const row = `
            <tr>
                <td>${data.county_name}</td>
                <td>${data.area_median_income}</td>
                <td>${data.millage_rate}</td>
                <td>${data.county_amis_income}</td>
                <td>${data.county_millage}</td>
            </tr>
        `;
        tableBody.innerHTML = row;
    })
    .catch(error => {
        console.error('Error fetching data:', error);
    });