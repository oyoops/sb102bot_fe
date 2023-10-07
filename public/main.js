import './utilities.js';

function initMap() {
    // Maps API is now loaded and can be used.
}

let address;
let lat;
let lng;
let countyData;
let cityData;
let parcelData;
let acres;

let totalUnits;
let affordableUnits;
let marketUnits;
let affordablePct;

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
    //const aiContainer = document.getElementById('aiContainer');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const addressInput = document.querySelector('#addressInput');
        address = addressInput.value; // global

        if (!address) {
            alert('Please enter an address.');
            return;
        }

        try {
            // show loading
            document.querySelector('.loading').style.display = 'block';
            // geocode the input address
            const geocodeEndpoint = `/api/geocode?address=${encodeURIComponent(address)}`;
            const geocodeResponse = await fetch(geocodeEndpoint);
            // check success
            if (!geocodeResponse.ok) {
                console.log('ERROR: Geocode failed.');
                throw new Error(`Server responded with ${geocodeResponse.status}: ${await geocodeResponse.text()}`);
            }
            const geocodeData = await geocodeResponse.json();
            if (!geocodeData.results || geocodeData.results.length === 0) {
                throw new Error(`Whoops! That address isn't in my coverage area.\nI only know about Florida (and only the good counties at that).`);
            }

            /* Geocode was successful */
            
            // get coordinates from results
            lat = geocodeData.results[0].geometry.location.lat; // global
            lng = geocodeData.results[0].geometry.location.lng; // global
            
            // show map w/ two placemarks: (1) input address; center of map, and (2) the tallest bldg. within a 1-mi radius
            initializeMap(lat, lng);

            // fetch the city of the address (Lat,Lng = CityData || CityName = Unincorporated if not in a city)
            const cityCheckEndpoint = `/api/check_city?lat=${lat}&lng=${lng}`;
            const cityCheckResponse = await fetch(cityCheckEndpoint);
            cityData = await cityCheckResponse.json(); // global
            console.log("City Data Received:", cityData);
            if (cityData.isInCity) {
                console.log(`Address is within city: ${cityData.cityName}`);
            } else {
                console.log('Address is unincorporated.');
                cityData.cityName = 'Unincorporated';
            }
            
            // fetch the county data for the address (Lat,Lng = CountyData)
            const countyDataEndpoint = `/api/load_county_table?lat=${lat}&lng=${lng}`;
            const countyDataResponse = await fetch(countyDataEndpoint);
            countyData = await countyDataResponse.json(); // global
            console.log("County Data Received:", countyData);
            if (!countyData.county_name) {
                throw new Error('No county data available for the address.');
            }

            /* PostgreSQL match found */

            // fetch the parcel data for the address (Lat,Lng + County = ParcelData)
            const parcelDataEndpoint = `/api/load_parcel_data?lat=${lat}&lng=${lng}&county_name=${countyData.county_name}`;
            const parcelDataResponse = await fetch(parcelDataEndpoint);
            parcelData = await parcelDataResponse.json(); // global
            console.log("Parcel Data Received:", parcelData);

            
            // done loading main content
            document.querySelector('.loading').style.display = 'none'; // hide loading indicator
            document.querySelector('#tryAgainButton').style.display = 'block';  // show try again button
            document.querySelector('#initialContent').style.display = 'none';  // hide initial content
                        

                        
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
            document.getElementById('countyDataTable').style.display = 'table'; // Unhide
            
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
            document.getElementById('countyMaxRentsTable').style.display = 'table'; // Unhide

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
                eligibilityDiv.innerHTML = "This parcel is <b><u>PROBABLY NOT</u> ELIGIBLE</b> for Live Local Act development.";
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

            // convert land sq. ft. to acres
            acres = parseFloat(parcelData.lnd_sqfoot) / 43560; // global
            
            // Populate parcel data table
            const parcelDataRow = `
                <tr>
                    <td>${parcelData.parcel_id}</td>
                    <td>${acres.toFixed(2)}</td>
                    <td>${parcelData.own_name}</td>
                    <td>${useCodeLookup[parcelData.dor_uc] || parcelData.dor_uc}</td>
                </tr>
            `;
            parcelDataTableBody.innerHTML = parcelDataRow;


            /* USER INPUTS SECTION START */

            // DOM references
            const parcelDataTable = document.getElementById('parcelDataTable');
            const developmentProgramInputSection = document.getElementById('developmentProgramInputSection');
            const affordablePercentageSlider = document.getElementById("affordablePctSlider");
            const affordablePctDisplay = document.getElementById('affordablePctDisplay');
            const unitCalculationTable = document.getElementById('unitCalculationTable');
            const sizeInputs = document.querySelectorAll('.sizeInput');
            const marketInputs = document.querySelectorAll('.marketSizeInput');
            const affordableSizeInputs = document.querySelectorAll('.affordableSizeInput');
            const marketRateInputSection = document.getElementById('marketRateInputSection');
            const marketRateInputs = document.querySelectorAll('.marketRateInput');
            const acreageInput = document.getElementById("acreageInput");
            const densityInput = document.getElementById('densityInput');
            const matchAffordableSizesCheckbox = document.getElementById('matchAffordableSizes');
            const rentPerSqFtTableSection = document.getElementById('rentPerSqFtTableSection');
            const abatementTable = document.getElementById('abatementTable');

            // unhide tables and I/O sections            
            parcelDataTable.style.display = 'table'; // parcel data
            developmentProgramInputSection.style.display = 'block'; // development program inputs (??)
            unitCalculationTable.style.display = 'block'; // unit counts
            marketRateInputSection.style.display = 'block'; // market-rate rent inputs
            rentPerSqFtTableSection.style.display = 'block'; // rent/SqFt
            abatementTable.style.display = 'block'; // property tax abatement
            
            // set acreage input placeholder
            acreageInput.value = acres.toFixed(2);

            // affordable percentage slider
            affordablePercentageSlider.value = 0.40; // default = 40% affordable units
            affordablePercentageSlider.oninput = function() {
                // Recalculate unit sizes and revenues on slider change
                calculateWeightedAverageSizes();
                updateRentPerSqFtTable();
                
            }


            /* Event Listeners: */

            // on acreage [A ac.] input:
            acreageInput.addEventListener('input', function() {
                // Recalculate unit counts and revenues
                calculateMaximumUnits();
                updateRentPerSqFtTable();
                
            });
            // on density [D units/ac.] input:
            densityInput.addEventListener('input', function() {
                // Recalculate unit counts and revenues
                calculateMaximumUnits();
                updateRentPerSqFtTable();
                
            });
            // on affordable % slider [%aff] change:
            affordablePercentageSlider.addEventListener('input', function() {
                affordablePctDisplay.innerText = `${this.value}%`;
                // Recalculate unit counts and revenues
                calculateMaximumUnits();
                updateRentPerSqFtTable();
                
            });
            // on all SqFt/unit [s SqFt] inputs:
            sizeInputs.forEach(input => {
                input.addEventListener('input', () => {
                    // Recalculate unit counts, unit sizes, and revenues
                    calculateMaximumUnits(); // unnecessary?
                    calculateWeightedAverageSizes();
                    updateRentPerSqFtTable();
                    
                });
            });
            // on market-rate SqFt/unit [s SqFt(mkt)] inputs: (if checkbox = checked)
            marketInputs.forEach((input, index) => {
                input.addEventListener('input', () => {
                    if (matchAffordableSizesCheckbox.checked) {
                        affordableSizeInputs[index].value = input.value;
                        // Recalculate unit sizes
                        calculateWeightedAverageSizes();
                    }
                });
            });
            // on market-rate rent per unit [$ Rent(mkt)] inputs:
            marketRateInputs.forEach(input => {
                input.addEventListener('input', function() {
                    // Recalculate revenues
                    updateRentPerSqFtTable();
                    
                });
            });
            // on checkbox change:
            matchAffordableSizesCheckbox.addEventListener('change', function() {
                const affordableInputs = affordableSizeInputs;    
                //      Checked   = Lock affordable avg. size inputs; keep them matched to corresponding market-rate sizes.
                //      Unchecked = Unlock affordable avg. size inputs; allow affordable units to have different avg. sizes.
                if (this.checked) {
                    // checkbox = checked
                    affordableInputs.forEach((input, index) => {
                        input.value = marketInputs[index].value;
                        input.disabled = true;
                    });
                } else {
                    // checkbox = unchecked
                    affordableInputs.forEach(input => input.disabled = false);
                }
                // Recalculate unit counts, unit sizes, and revenues
                calculateMaximumUnits();
                calculateWeightedAverageSizes();
                updateRentPerSqFtTable();
                
            });

            // initial calculations using loaded + default values
            calculateMaximumUnits();
            calculateWeightedAverageSizes();
            updateRentPerSqFtTable();
            
            /* USER INPUTS SECTION END. */

            /* AI SECTION START */

            const runAIButton = document.getElementById("runAIButton");
            runAIButton.addEventListener('click', runAISection);
            /* ENDPOINT PARAMS:
                    ASK_AI: 
                        address, 
                        county, 
                        acreage, 
                        totalUnits, 
                        affordablePct,
                        affStudio,
                        aff1BD,
                        aff2BD,
                        aff3BD,
                        textModifier */

            /* AI SECTION END */

        } catch (error) {
            if (error.message.startsWith("Server responded with")) {
                console.error('Server error:', error);
                alert('There was an error with the server. Please try again later.');
            } else {
                console.error('Error:', error);
                // to-do: significantly improve error handling.
                alert('Whoops, something bad happened and I broke.\nEither try again or give up. The choice is yours!');
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


