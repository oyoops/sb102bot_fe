let fetch;

// Dynamically import node-fetch
import('node-fetch').then(nodeFetch => {
    fetch = nodeFetch.default;
});

export default async (req, res) => {
    if (req.method === 'POST') {
        const { address } = req.body;
        
        if (!address) {
            return res.status(400).json({ error: "Address is required" });
        }
        
        const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
        const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
        
        try {
            const response = await fetch(endpoint);
            const data = await response.json();
            if (data.status === "OK") {
                const location = data.results[0].geometry.location;
                return res.status(200).json(location);
            } else {
                return res.status(400).json({ error: "Geocoding error", message: data.status });
            }
        } catch (error) {
            return res.status(500).json({ error: "Failed to fetch geocoding data" });
        }
    } else {
        return res.status(405).json({ error: "Method not allowed" });  // Only POST requests are accepted
    }
};
