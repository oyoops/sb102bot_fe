const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radiusMiles = parseFloat(req.query.radius ?? 1); 
    const radiusMeters = radiusMiles * 1609.34;

    console.log(`Received coordinates: Latitude = ${lat}, Longitude = ${lng}, Radius = ${radiusMiles} miles`);

    if (isNaN(lat) || isNaN(lng) || isNaN(radiusMiles)) {
        return res.status(400).send('Invalid latitude, longitude, or radius value(s).');
    }

    try {
        const overpassQuery = `
            [out:json];
            (
                way["building"](around:${radiusMeters},${lat},${lng});
            );
            out body;
        `;
        
        console.log("Querying Overpass API for buildings");
        const overpassResult = await axios.get('https://overpass-api.de/api/interpreter', {
            params: { data: overpassQuery }
        });

        const buildings = overpassResult.data.elements;
        console.log(`Fetched ${buildings.length} buildings`);

        if (buildings.length === 0) {
            return res.status(404).send('No buildings found within the specified radius.');
        }

        let tallestBuilding = buildings[0];
        buildings.forEach(building => {
            if (building.tags && building.tags.height && tallestBuilding.tags && tallestBuilding.tags.height) {
                if (parseFloat(building.tags.height) > parseFloat(tallestBuilding.tags.height)) {
                    tallestBuilding = building;
                }
            }
        });

        const nodeQuery = `
            [out:json];
            (
                node(w:${tallestBuilding.id});
            );
            out body;
        `;

        console.log("Querying Overpass API for nodes of tallest building");
        const nodeResult = await axios.get('https://overpass-api.de/api/interpreter', {
            params: { data: nodeQuery }
        });

        const nodes = nodeResult.data.elements;
        console.log(`Fetched ${nodes.length} nodes for tallest building`);
        
        let sumLat = 0, sumLon = 0;
        nodes.forEach(node => {
            sumLat += node.lat;
            sumLon += node.lon;
        });

        const avgLat = sumLat / nodes.length;
        const avgLon = sumLon / nodes.length;

        // Prepare the final tallestBuilding object to return
        let result = {
            lat: avgLat,
            lng: avgLon,
            height: tallestBuilding.tags.height ? parseFloat(tallestBuilding.tags.height) * 3.28084 : null, // Convert meters to feet
            name: tallestBuilding.tags.name || null,
            address: tallestBuilding.tags['addr:street'] || null
        };

        res.status(200).json(result);
    } catch (err) {
        console.error(`Error encountered: ${err.message}`);
        res.status(500).send(`Error: ${err.message}`);
    }
};
