function initMap() {
    // Maps API is now loaded and can be used.
}

let lat;
let lng;
let countyData;
let cityData;
let parcelData;
let acres;

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
    const aiContainer = document.getElementById('aiContainer');

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
            lat = geocodeData.results[0].geometry.location.lat;
            lng = geocodeData.results[0].geometry.location.lng;
            
            
            // Initialize & show the Google Map using lat/lng instead of user input
            initializeMap(lat, lng);


            // Check if the address is within a city
            const cityCheckEndpoint = `/api/check_city?lat=${lat}&lng=${lng}`;
            const cityCheckResponse = await fetch(cityCheckEndpoint);
            
            cityData = await cityCheckResponse.json();
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
            
            countyData = await countyDataResponse.json();
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
            
            parcelData = await parcelDataResponse.json();
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

            // Use code lookup dictionary
            const useCodeLookup = {
                "000": "Vacant Residential",
                "001": "Single Family",
                "002": "Mobile Homes",
                "004": "Condominiums",
                "005": "Cooperatives",
                "006": "Retirement Homes not eligible for exemption",
                "007": "Miscellaneous Residential (migrant camps, boarding homes, etc.)",
                "008": "Residential Multifamily (<10 units)",
                "009": "Residential Common Elements/Areas",
                "003": "'Commercial Multifamily' (10+ units)",
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

            const maybeEligibleCodes = ['003'];

            const eligibleCodes = ['010', '011', '012', '013', '014', '015', '016', '017', '018', '019', 
                                    '020', '021', '022', '023', '024', '025', '026', '027', '028', '029', '030', 
                                    '031', '032', '033', '034', '035', '036', '037', '038', '039', '040', '041', 
                                    '042', '043', '044', '045', '046', '047', '048', '049'];

            const eligibilityDiv = document.getElementById("eligibilityStatus");
            
            if (maybeEligibleCodes.includes(parcelData.dor_uc)) {
                eligibilityDiv.innerHTML = "This parcel is <b>PROBABLY <u>NOT</u> ELIGIBLE</b> for Live Local Act development.";
                eligibilityDiv.style.color = "orange";
                eligibilityDiv.style.fontSize = "20px";
            } else if (eligibleCodes.includes(parcelData.dor_uc)) {
                eligibilityDiv.innerHTML = "This parcel is likely <b><u>ELIGIBLE</u></b> for Live Local Act development!";
                eligibilityDiv.style.color = "green";
                eligibilityDiv.style.fontSize = "22px";
            } else {
                eligibilityDiv.innerHTML = "This parcel is <b><u>NOT ELIGIBLE</u></b> for Live Local Act development.";
                eligibilityDiv.style.color = "red";
                eligibilityDiv.style.fontSize = "22px";
            }

            // compute acreage from SF area
            acres = parseFloat(parcelData.lnd_sqfoot) / 43560;
            
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



            // Call acreageCalculation.js to calculate initial maximum units using default values
            //calculateWeightedAverageSizes();


            






            /* INPUTS SECTION: */

            // Unhide Tables and I/O Sections:

            // Display the parcel data table now that we have data
            document.getElementById('parcelDataTable').style.display = 'table'; // Display the parcel data table            
            // Display the 'Development Program' inputs section
            document.getElementById('developmentProgramInputSection').style.display = 'block';
            // Display the 'Unit count' table
            document.getElementById('unitCalculationTable').style.display = 'block';
            // Show market rate inputs
            document.getElementById('marketRateInputSection').style.display = 'block';
            // Show the rent/SqFt table section
            document.getElementById('rentPerSqFtTableSection').style.display = 'block';
            // Show the abatement table
            document.getElementById('abatementTable').style.display = 'block';

            // Define DOM references
            const affordablePercentageSlider = document.getElementById("affordablePctSlider");
            const affordablePctDisplay = document.getElementById('affordablePctDisplay');
            const sizeInputs = document.querySelectorAll('.sizeInput')
            const marketInputs = document.querySelectorAll('.marketSizeInput');
            const affordableSizeInputs = document.querySelectorAll('.affordableSizeInput');
            const marketRateInputs = document.querySelectorAll('.marketRateInput');
            const acreageInput = document.getElementById("acreageInput");
            const densityInput = document.getElementById('densityInput');
            const matchAffordableSizesCheckbox = document.getElementById('matchAffordableSizes');

            // Set default input acreage
            acreageInput.value = acres.toFixed(2);

            // Show affordable % slider
            affordablePercentageSlider.value = 0.10; // Set the default value of the slider to N% upon initial load
            affordablePercentageSlider.oninput = function() {
                calculateWeightedAverageSizes(); // Recalculate units when the slider value changes.
                updateRentPerSqFtTable();
            }


            /* Event Listeners: */

            // Set up an event listener for the acreage input to recalculate values in real-time
            acreageInput.addEventListener('input', function() {
                calculateMaximumUnits();
                updateRentPerSqFtTable();
            });
            // Set up an event listener for the density input to recalculate values in real-time
            densityInput.addEventListener('input', function() {
                calculateMaximumUnits();
                updateRentPerSqFtTable();
            });
            // Set up an event listener for the affordable percentage slider to recalculate values in real-time
            affordablePercentageSlider.addEventListener('input', function() {
                affordablePctDisplay.innerText = `${this.value}%`;
                calculateMaximumUnits();
                updateRentPerSqFtTable();
            });
            // Event listeners for all size inputs to recalculate weighted averages in real-time
            sizeInputs.forEach(input => {
                input.addEventListener('input', () => {
                    calculateMaximumUnits(); // unnecessary?
                    calculateWeightedAverageSizes();
                    updateRentPerSqFtTable();
                });
            });
            // Event listeners for Market size inputs to set equal Affordable sizes (if checkbox is checked)
            // and then recalculate weighted averages in real-time
            marketInputs.forEach((input, index) => {
                input.addEventListener('input', () => {
                    if (matchAffordableSizesCheckbox.checked) {
                        affordableSizeInputs[index].value = input.value;
                        calculateWeightedAverageSizes();
                    }
                });
            });

            // Event listeners for market-rate rent inputs
            marketRateInputs.forEach(input => {
                input.addEventListener('input', function() {
                    updateRentPerSqFtTable();
                    // Update Revenue Table
                });
            });


            // Checkbox logic to set affordable units to the market unit sizes
            matchAffordableSizesCheckbox.addEventListener('change', function() {
                const affordableInputs = affordableSizeInputs;
                
                // If checkbox is checked
                if (this.checked) {
                    affordableInputs.forEach((input, index) => {
                        input.value = marketInputs[index].value;  // Set affordable value to match market value
                        input.disabled = true;  // Disable the input
                    });
                } else {
                    // If checkbox is unchecked
                    affordableInputs.forEach(input => input.disabled = false);  // Re-enable the input
                }
                
                // Recalculate units and sizes
                calculateMaximumUnits();
                calculateWeightedAverageSizes();
                updateRentPerSqFtTable();
                // Update Revenue Table
            });



            // ...



            /* AI OUTPUT: */


            /*
                Params: 
                    address, 
                    county, 
                    acreage, 
                    totalUnits, 
                    affordablePct, 
                    marketRent, 
                    textModifier
            */
            aiContainer.innerHTML = "Drafting your investment memo...";
            aiContainer.style.display = 'block';
            const icMemoEndpoint = `/api/ask_ai?address=${encodeURIComponent(address)}&county=${countyData.county_name}&acreage=${acreageValue}&totalUnits=${totalUnits}&affordablePct=${affordablePct}&marketRent=${marketRate}&textModifier=${textMod}`;            
            const icMemoResponse = await fetch(icMemoEndpoint);
            icMemo = await icMemoResponse.json();
            console.log("IC Memo Received:", icMemo);
          



            // ...



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


//           //
/* Functions */
//           //

// Function to update the Rent per Sq. Ft. table
function updateRentPerSqFtTable() {

    // Create functions getMarketRatePerSqFt and getAffordableRatePerSqFt to calculate these values
    document.getElementById('marketRateStudioPerSqFt').innerText = getMarketRatePerSqFt('Studio');
    document.getElementById('affordableStudioPerSqFt').innerText = getAffordableRatePerSqFt('Studio');
    document.getElementById('marketRate1BDPerSqFt').innerText = getMarketRatePerSqFt('1BD');
    document.getElementById('affordable1BDPerSqFt').innerText = getAffordableRatePerSqFt('1BD');
    document.getElementById('marketRate2BDPerSqFt').innerText = getMarketRatePerSqFt('2BD');
    document.getElementById('affordable2BDPerSqFt').innerText = getAffordableRatePerSqFt('2BD');
    document.getElementById('marketRate3BDPerSqFt').innerText = getMarketRatePerSqFt('3BD');
    document.getElementById('affordable3BDPerSqFt').innerText = getAffordableRatePerSqFt('3BD');
}

// Calculate maximum units and show them in a table
function calculateMaximumUnits() {
    // Acreage, density, and affordable percentage inputs
    const acreageValue = parseFloat(document.getElementById('acreageInput').value);
    const densityValue = parseFloat(document.getElementById('densityInput').value) || 10; // Default to 10 if not provided
    const affordablePctSlider = document.getElementById('affordablePctSlider');
    const affordablePctDisplay = document.getElementById('affordablePctDisplay');
    const affordablePct = parseFloat(affordablePctSlider.value) / 100;

    // Calculate unit counts
    const totalUnits = Math.floor(acreageValue * densityValue);
    const affordableUnits = Math.ceil(affordablePct * totalUnits);
    const marketUnits = totalUnits - affordableUnits;

    // Update the table with unit counts
    const tableBody = document.getElementById('unitCalculationTableBody');
    tableBody.innerHTML = `
        <tr>
            <td>${affordableUnits}</td>
            <td>${marketUnits}</td>
            <td>${totalUnits}</td>
        </tr>
    `;
    // Display the unit calculation table now that we have data
    document.getElementById('unitCalculationTable').style.display = 'block';

    // Update abatement
    const abatementValue = Math.round(0.75 * (affordableUnits / totalUnits) * 100);
    const abatementTableBody = document.getElementById('abatementTableBody');
    abatementTableBody.innerHTML = `
        <tr>
            <td>${abatementValue}% of ad valorem property taxes</td>
        </tr>
    `;

    // Check for warnings
    const warningContainer = document.getElementById('warningContainer');
    warningContainer.innerHTML = "";  // Clear previous warnings
    if (affordableUnits < 70) {
        document.getElementById('warningContainer').style.display = 'block';
        warningContainer.innerHTML += '<p style="color: red;">Need at least 70 affordable units for the steamroll option!</p>';
    }
    if (affordablePct < 0.4) {
        document.getElementById('warningContainer').style.display = 'block';
        warningContainer.innerHTML += '<p style="color: orange;">Not at 40% affordable threshold!</p>';
    } 
    if (affordablePct < 0.1) {
        warningContainer.innerHTML += '<p style="color: red;">Not at 10% affordable threshold!</p>';
        document.getElementById('warningContainer').style.display = 'block';
    }
    if (affordableUnits >= 70 && affordablePct >= 0.4) {
        document.getElementById('warningContainer').style.display = 'none';
    }

    calculateWeightedAverageSizes(); // Run it
}

// Function to calculate Market Rate per Sq. Ft.
function getMarketRatePerSqFt(unitType) {
    const marketRate = parseFloat(document.getElementById(`marketRate${unitType}`).value) || 0;
    const unitSize = parseFloat(document.getElementById(`market${unitType}Size`).value) || 0;
    // Debugging Step 4: Print if unit size is zero
    if (unitSize === 0) {
        console.log(`Unit size for ${unitType} is zero.`);
    }
    return (unitSize === 0) ? 'N/A' : (marketRate / unitSize).toFixed(2);
}


// Function to calculate Affordable Rate per Sq. Ft.
function getAffordableRatePerSqFt(unitType) {
    // Debugging Step 3: Check if the function is waiting for main.js to populate data
    if (typeof countyData === 'undefined') {
        console.log("countyData is not available yet.");
        return 'N/A';
    }
    
    let affordableRate = 0;
  
    // Remove the dollar sign and convert to floats
    const maxRent0bd = parseFloat(countyData.max_rent_0bd_120ami);
    const maxRent1bd = parseFloat(countyData.max_rent_1bd_120ami);
    const maxRent2bd = parseFloat(countyData.max_rent_2bd_120ami);
    const maxRent3bd = parseFloat(countyData.max_rent_3bd_120ami);

    // Select the appropriate affordable rate based on unit type
    switch (unitType) {
        case 'Studio':
            affordableRate = maxRent0bd;
            break;
        case '1BD':
            affordableRate = maxRent1bd;
            break;
        case '2BD':
            affordableRate = maxRent2bd;
            break;
        case '3BD':
            affordableRate = maxRent3bd;
            break;
        default:
            console.error("Invalid unit type");
            return 'N/A';
    }
    
    const unitSize = parseFloat(document.getElementById(`affordable${unitType}Size`).value) || 0;
    
    // Debugging Step 4: Print if unit size is zero
    if (unitSize === 0) {
        console.log(`Unit size for ${unitType} is zero.`);
    }
    console.log(`Affordable Rate for ${unitType}: ${affordableRate}`);
    console.log(`Unit Size for ${unitType}: ${unitSize}`);
    
    return (unitSize === 0) ? 'N/A' : (affordableRate / unitSize).toFixed(2);
}


// Function to calculate weighted average sizes
function calculateWeightedAverageSizes() {
    const affordablePctSlider = document.getElementById('affordablePctSlider');
    const affordablePct = parseFloat(affordablePctSlider.value) / 100;
    const acreageValue = parseFloat(document.getElementById('acreageInput').value);
    const densityValue = parseFloat(document.getElementById('densityInput').value) || 10;

    const totalUnits = Math.floor(acreageValue * densityValue);
    const affordableUnits = Math.ceil(affordablePct * totalUnits);
    const marketUnits = totalUnits - affordableUnits;

    const marketStudioSize = parseFloat(document.getElementById('marketStudioSize').value) || 0;
    const market1BDSize = parseFloat(document.getElementById('market1BDSize').value) || 0;
    const market2BDSize = parseFloat(document.getElementById('market2BDSize').value) || 0;
    const market3BDSize = parseFloat(document.getElementById('market3BDSize').value) || 0;

    const affordableStudioSize = parseFloat(document.getElementById('affordableStudioSize').value) || 0;
    const affordable1BDSize = parseFloat(document.getElementById('affordable1BDSize').value) || 0;
    const affordable2BDSize = parseFloat(document.getElementById('affordable2BDSize').value) || 0;
    const affordable3BDSize = parseFloat(document.getElementById('affordable3BDSize').value) || 0;

    // Calculate the weighted average sizes for market, affordable, and total units
    const avgMarketSize = (marketStudioSize + market1BDSize + market2BDSize + market3BDSize) / 4;
    const avgAffordableSize = (affordableStudioSize + affordable1BDSize + affordable2BDSize + affordable3BDSize) / 4;
    const avgTotalSize = (avgMarketSize * marketUnits + avgAffordableSize * affordableUnits) / totalUnits;

    // Display these values
    document.getElementById('avgMarketSizeDisplay').innerText = avgMarketSize.toFixed(0);
    document.getElementById('avgAffordableSizeDisplay').innerText = avgAffordableSize.toFixed(0);
    document.getElementById('avgTotalSizeDisplay').innerText = avgTotalSize.toFixed(0);
}
