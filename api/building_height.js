const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radiusMiles = parseFloat(req.query.radius ?? 1); // Default to 1 mile if no radius provided
    const radiusMeters = radiusMiles * 1609.34; // convert to meters for API

    // Check if lat, lng, and radius are valid numbers
    if (isNaN(lat) || isNaN(lng) || isNaN(radiusMiles)) {
        return res.status(400).send('Invalid latitude, longitude, or radius value(s).');
    }

    try {
        console.log('Starting TALLEST BUILDING query...');

        // Query Overpass API to find buildings within N mile radius of lat and lng
        const overpassQuery = `
            [out:json];
            (
                way["building"](around:${radiusMeters},${lat},${lng});
            );
            out body;
        `;
        
        const overpassResult = await axios.get('https://overpass-api.de/api/interpreter', {
            params: { data: overpassQuery }
        });

        const buildings = overpassResult.data.elements;
        if (buildings.length === 0) {
            return res.status(404).send('No buildings found within the specified radius.');
        }

        // Find the tallest building
        let tallestBuilding = buildings[0];
        buildings.forEach(building => {
            if (building.tags && building.tags.height && tallestBuilding.tags && tallestBuilding.tags.height) {
                if (parseFloat(building.tags.height) > parseFloat(tallestBuilding.tags.height)) {
                    tallestBuilding = building;
                }
            }
        });

        console.log('Tallest building query complete.');
        console.log(`Tallest building within radius: ${JSON.stringify(tallestBuilding)}`);

        res.status(200).json(tallestBuilding);

        /* Typical format of return object (some info may be missing):
            {
                "type": "way",
                "id": 123456789,
                "nodes": [1001, 1002, 1003, 1004, 1001],
                "tags": {
                    "addr:city": "New York",
                    "addr:street": "Example Street",
                    "addr:postcode": "10001",
                    "building": "yes",
                    "height": "200.5",
                    "name": "Example Tower",
                    "architect": "John Doe",
                    ...
                }
            } */
    } catch (err) {
        console.error(`Error encountered: ${err.message}`);
        res.status(500).send(`Error: ${err.message}`);
    }
};
