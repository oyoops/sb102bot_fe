function initMap() {
    // Maps API is now loaded and can be used.
}

document.addEventListener('DOMContentLoaded', function() {
    window.scrollTo(0, 0);

    document.getElementById('map').style.display = 'none';
    
    const tryAgainButton = document.getElementById("tryAgainButton");    
    tryAgainButton.addEventListener("click", function() {
        location.reload();
    });

    const form = document.querySelector('#searchForm');
    const countyTableBody = document.querySelector('#countyDataTable tbody');
    const rentsTableBody = document.querySelector('#countyMaxRentsTable tbody');  // Select the max rents table's tbody
    const parcelDataTableBody = document.querySelector('#parcelDataTable tbody');  // Select the parcel data table's tbody
    

    function initializeMap(lat, lng) {
        console.log('Initializing map with lat:', lat, ', lng:', lng);
        const mapOptions = {
            center: { lat: lat, lng: lng },
            zoom: 17,
            mapTypeId: google.maps.MapTypeId.SATELLITE
        };
    
        const map = new google.maps.Map(document.getElementById('map'), mapOptions);
        console.log('Map initialized.');
    
        // Add a marker at the specified location
        new google.maps.Marker({
            position: { lat: lat, lng: lng },
            map: map
        });

        // Show the Google Map element
        document.getElementById('map').style.display = 'block';
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

            // Hide the loading indicator
            document.querySelector('.loading').style.display = 'none';
            document.querySelector('#tryAgainButton').style.display = 'block';  // Show try again button
            document.querySelector('#initialContent').style.display = 'none';  // Hide initial content
            

            // Get the lat/long from the geocode data
            const lat = geocodeData.results[0].geometry.location.lat;
            const lng = geocodeData.results[0].geometry.location.lng;
            
            //// Show the Google Map container
            //document.getElementById('mapContainer').style.display = 'block';
            
            // Initialize & show the Google Map using lat/lng instead of user input
            initializeMap(lat, lng);




            // Check if the address is within a city
            const cityCheckEndpoint = `/api/check_city?lat=${lat}&lng=${lng}`;
            const cityCheckResponse = await fetch(cityCheckEndpoint);
            const cityData = await cityCheckResponse.json();
            console.log("City Data Received:", cityData);

            if (cityData.isInCity) {
                console.log(`The address is within the city: ${cityData.cityName}`);
            } else {
                console.log('The address is not within a city. Defaulting to "Unincorporated".');
                cityData.cityName = 'Unincorporated';
            }
            
            // Query the PostgreSQL database for the county at the geocoded lat/long, derived from address
            const countyDataEndpoint = `/api/load_county_table?lat=${lat}&lng=${lng}`;
            const countyDataResponse = await fetch(countyDataEndpoint);
            const countyData = await countyDataResponse.json();
            console.log("County Data Received:", countyData);

            // Check if PostgreSQL database returned county data
            if (!countyData.county_name) {
                throw new Error('No data available for the selected location.');
            }

            // Only proceeds if we successfully got county data
            // (which means we got a match at this lat/long in the database)


            // Look up parcel data in PostgreSQL database
            const parcelDataEndpoint = `/api/load_parcel_data?lat=${lat}&lng=${lng}&county_name=${countyData.county_name}`;
            const parcelDataResponse = await fetch(parcelDataEndpoint);
            const parcelData = await parcelDataResponse.json();
            console.log("Parcel Data Received:", parcelData);

            // If cityname is null, make cityName = 'Unincorporated'
            if (!cityData.cityName) {
                console.log(cityData);
                cityData.cityName = 'Unincorporated';
            }
                        
            // Populate the municipal data table
            const countyRow = `
                <tr>
                    <td>${countyData.county_name}</td>
                    <td>${cityData.cityName}</td>
                    <td>$${countyData.county_amis_income}</td>
                    <td>${countyData.county_millage}</td>
                </tr>
            `;
            countyTableBody.innerHTML = countyRow;

            // Display the municipal Data table (city, AMI & Millage rate) now that we have data
            document.getElementById('countyDataTable').style.display = 'table'; // Display the county data table
            
            // Populate the max rents table
            const rentsRow = `
                <tr>
                    <td>$${countyData.max_rent_0bd_120ami}</td>
                    <td>$${countyData.max_rent_1bd_120ami}</td>
                    <td>$${countyData.max_rent_2bd_120ami}</td>
                    <td>$${countyData.max_rent_3bd_120ami}</td>
                </tr>
            `;
            rentsTableBody.innerHTML = rentsRow;

            // Display the county Max Rents table now that we have data
            document.getElementById('countyMaxRentsTable').style.display = 'table'; // Display the county max rents table

            //////// Display the Parcel Data table now that we have data
            //////document.getElementById('parcelDataTable').style.display = 'table'; // Display the parcel data table

            const useCodeLookup = {
                "000": "Vacant Residential",
                "001": "Single Family",
                "002": "Mobile Homes",
                "004": "Condominiums",
                "005": "Cooperatives",
                "006": "Retirement Homes not eligible for exemption",
                "007": "Miscellaneous Residential (migrant camps, boarding homes, etc.)",
                "008": "Multi-family - fewer than 10 units",
                "009": "Residential Common Elements/Areas",
                "003": "Multi-family - 10 units or more",
                "010": "Vacant Commercial",
                "011": "Stores, one story",
                "012": "Mixed use - store and office or store and residential combination",
                "013": "Department Stores",
                "014": "Supermarkets",
                "015": "Regional Shopping Centers",
                "016": "Community Shopping Centers",
                "017": "Office buildings, non-professional service buildings, one story",
                "018": "Office buildings, non-professional service buildings, multi-story",
                "019": "Professional service buildings",
                "020": "Airports (private or commercial), bus terminals, marine terminals, piers, marinas",
                "021": "Restaurants, cafeterias",
                "022": "Drive-in Restaurants",
                "023": "Financial institutions (banks, saving and loan companies, mortgage companies, credit services)",
                "024": "Insurance company offices",
                "025": "Repair service shops (excluding automotive), radio and T.V. repair, refrigeration service, electric repair, laundries, Laundromats",
                "026": "Service stations",
                "027": "Auto sales, auto repair and storage, auto service shops, body and fender shops, commercial garages, farm and machinery sales and services, auto rental, marine equipment, trailers and related equipment, mobile home sales, motorcycles, construction vehicle sales",
                "028": "Parking lots (commercial or patron), mobile home parks",
                "029": "Wholesale outlets, produce houses, manufacturing outlets",
                "030": "Florists, greenhouses",
                "031": "Drive-in theaters, open stadiums",
                "032": "Enclosed theaters, enclosed auditoriums",
                "033": "Nightclubs, cocktail lounges, bars",
                "034": "Bowling alleys, skating rinks, pool halls, enclosed arenas",
                "035": "Tourist attractions, permanent exhibits, other entertainment facilities, fairgrounds (privately owned)",
                "036": "Camps",
                "037": "Race tracks (horse, auto, or dog)",
                "038": "Golf courses, driving ranges",
                "039": "Hotels, motels",
                "040": "Vacant Industrial",
                "041": "Light manufacturing, small equipment manufacturing plants, small machine shops, instrument manufacturing, printing plants",
                "042": "Heavy industrial, heavy equipment manufacturing, large machine shops, foundries, steel fabricating plants, auto or aircraft plants",
                "043": "Lumber yards, sawmills, planing mills",
                "044": "Packing plants, fruit and vegetable packing plants, meat packing plants",
                "045": "Canneries, fruit and vegetable, bottlers and brewers, distilleries, wineries",
                "046": "Other food processing, candy factories, bakeries, potato chip factories",
                "047": "Mineral processing, phosphate processing, cement plants, refineries, clay plants, rock and gravel plants",
                "048": "Warehousing, distribution terminals, trucking terminals, van and storage warehousing",
                "049": "Open storage, new and used building supplies, junk yards, auto wrecking, fuel storage, equipment and material storage",
                "050": "Improved agricultural",
                "051": "Cropland soil capability Class I",
                "052": "Cropland soil capability Class II",
                "053": "Cropland soil capability Class III",
                "054": "Timberland - site index 90 and above",
                "055": "Timberland - site index 80 to 89",
                "056": "Timberland - site index 70 to 79",
                "057": "Timberland - site index 60 to 69",
                "058": "Timberland - site index 50 to 59",
                "059": "Timberland not classified by site index to Pines",
                "060": "Grazing land soil capability Class I",
                "061": "Grazing land soil capability Class II",
                "062": "Grazing land soil capability Class III",
                "063": "Grazing land soil capability Class IV",
                "064": "Grazing land soil capability Class V",
                "065": "Grazing land soil capability Class VI",
                "066": "Orchard Groves, citrus, etc.",
                "067": "Poultry, bees, tropical fish, rabbits, etc.",
                "068": "Dairies, feed lots",
                "069": "Ornamentals, miscellaneous agricultural",
                "070": "Vacant Institutional, with or without extra features",
                "071": "Churches",
                "072": "Private schools and colleges",
                "073": "Privately owned hospitals",
                "074": "Homes for the aged",
                "075": "Orphanages, other non-profit or charitable services",
                "076": "Mortuaries, cemeteries, crematoriums",
                "077": "Clubs, lodges, union halls",
                "078": "Sanitariums, convalescent and rest homes",
                "079": "Cultural organizations, facilities",
                "080": "Vacant Governmental",
                "081": "Military",
                "082": "Forest, parks, recreational areas",
                "083": "Public county schools - including all property of Board of Public Instruction",
                "084": "Colleges (non-private)",
                "085": "Hospitals (non-private)",
                "086": "Counties (other than public schools, colleges, hospitals) including non-municipal government",
                "087": "State, other than military, forests, parks, recreational areas, colleges, hospitals",
                "088": "Federal, other than military, forests, parks, recreational areas, hospitals, colleges",
                "089": "Municipal, other than parks, recreational areas, colleges, hospitals",
                "090": "Leasehold interests (government-owned property leased by a non-governmental lessee)",
                "091": "Utility, gas and electricity, telephone and telegraph, locally assessed railroads, water and sewer service, pipelines, canals, radio/television communication",
                "092": "Mining lands, petroleum lands, or gas lands",
                "093": "Subsurface rights",
                "094": "Right-of-way, streets, roads, irrigation channel, ditch, etc.",
                "095": "Rivers and lakes, submerged lands",
                "096": "Sewage disposal, solid waste, borrow pits, drainage reservoirs, waste land, marsh, sand dunes, swamps",
                "097": "Outdoor recreational or parkland, or high-water recharge subject to classified use assessment",
                "098": "Centrally assessed",
                "099": "Acreage not zoned agricultural with or without extra features"
            };
                        
            const eligibleCodes = ['003', '010', '011', '012', '013', '014', '015', '016', '017', '018', '019', 
                                    '020', '021', '022', '023', '024', '025', '026', '027', '028', '029', '030', 
                                    '031', '032', '033', '034', '035', '036', '037', '038', '039', '040', '041', 
                                    '042', '043', '044', '045', '046', '047', '048', '049'];

            const eligibilityDiv = document.getElementById("eligibilityStatus");
            
            if (eligibleCodes.includes(parcelData.dor_uc)) {
                eligibilityDiv.innerHTML = "This parcel is ELIGIBLE for Live Local Act development";
                eligibilityDiv.style.color = "green";
                eligibilityDiv.style.fontSize = "24px";
            } else {
                eligibilityDiv.innerHTML = "This parcel is NOT ELIGIBLE for Live Local Act development";
                eligibilityDiv.style.color = "red";
                eligibilityDiv.style.fontSize = "24px";
            }

            // compute acreage from SF area
            const acres = parseFloat(parcelData.lnd_sqfoot) / 43560;
            // set default placeholder acreage
            document.getElementById("acreageInput").value = acres.toFixed(2);
            
            // Populate the parcel data table
            const parcelDataRow = `
                <tr>
                    <td>${parcelData.parcel_id}</td>
                    <td>${acres.toFixed(2)}</td>
                    <td>${parcelData.own_name}</td>
                    <td>${useCodeLookup[parcelData.dor_uc] || parcelData.dor_uc}</td>
                </tr>
            `;
            parcelDataTableBody.innerHTML = parcelDataRow;

            // Display the parcel data table now that we have data
            document.getElementById('parcelDataTable').style.display = 'table'; // Display the parcel data table

            // DONE with Part 1
            console.log('End: Part 1 -- Geocoding + Database Lookup -> County Data');

            // Prep for Part 2:
            // Display the 'Development Program' inputs section (Part 2) after successfully populating the tables
            document.getElementById('developmentProgramInputSection').style.display = 'block';

            // Display the 'Unit count' table
            document.getElementById('unitCalculationTable').style.display = 'block';
            
            // Call acreageCalculation.js to calculate initial maximum units using default values
            calculateWeightedAverageSizes(); // this might not work...

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

    // Dynamically load the Google Maps API
    function loadGoogleMapsAPI() {
        const script = document.createElement('script');
        script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDJlvljO-CVH5ax4paudEnj9RoERL6Xhbc&callback=initMap";
        document.body.appendChild(script);
    }

    loadGoogleMapsAPI();

});


