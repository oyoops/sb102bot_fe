
const { connect_to_database } = require('../database');

module.exports = async (req, res) => {
    const { lat, lng } = req.query;
    const conn = await connect_to_database();

    try {
        const query = `
            SELECT parcelno, county_name 
            FROM parcels_master 
            WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326), 10)
            LIMIT 1;
        `;
        const parcel = await conn.query(query, [lng, lat]);
        res.json({ parcel: parcel.rows[0] });
    } catch (error) {
        res.json({ error: "Error fetching parcel information from the database." });
    } finally {
        conn.end();
    }
};
