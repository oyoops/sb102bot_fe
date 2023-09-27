
const { connect_to_database } = require('../database');

module.exports = async (req, res) => {
    const { lat, lng } = req.query;
    const radius = 1000;  // Default radius set to 1000 meters
    const conn = await connect_to_database();

    try {
        const query = `
            SELECT parcelno, county_name 
            FROM parcels_master 
            WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326), $3);
        `;
        const parcels = await conn.query(query, [lng, lat, radius]);
        res.json({ parcels: parcels.rows });
    } catch (error) {
        res.json({ error: "Error fetching nearby parcels from the database." });
    } finally {
        conn.end();
    }
};
