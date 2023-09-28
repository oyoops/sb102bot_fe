const https = require('https');

module.exports = async (req, res) => {
    // Setting CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    try {
        const { lat, lng } = req.query;

        if (!lat || !lng) {
            return res.status(400).send({ error: 'Latitude and longitude are required.' });
        }

        const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
        const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`;

        https.get(endpoint, (response) => {
            let data = '';

            // A chunk of data has been received.
            response.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            response.on('end', () => {
                res.status(200).send(JSON.parse(data));
            });
        }).on("error", (err) => {
            res.status(500).send({ error: `OOPS! Failed to fetch data. ${err.message}` });
        });

    } catch (error) {
        res.status(500).send({ error: `Failed to fetch data. Please try again. ${error.message}` });
    }
};