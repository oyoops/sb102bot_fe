const fetch = require('node-fetch');

module.exports = async (req, res) => {
    const lat = req.query.lat;
    const lng = req.query.lng;
    const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`;

    try {
        const response = await fetch(endpoint);
        const data = await response.json();
        
        if (data.status === "OK") {
            res.status(200).json(data.results[0]);
        } else {
            res.status(400).send(`Geocoding error: ${data.status}`);
        }
    } catch (error) {
        res.status(500).send(`Failed to reverse geocode: ${error}`);
    }
};
