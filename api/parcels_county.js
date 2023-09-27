const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
});

module.exports = async (req, res) => {
    const lat = req.query.lat;
    const lng = req.query.lng;
    const county = req.query.county;

    try {
        const query = `
        SELECT parcelno, county_name 
        FROM parcels_master 
        WHERE county_name = $1
        ORDER BY geom <-> ST_SetSRID(ST_MakePoint($2, $3), 4326) ASC
        LIMIT 50;
        `;

        const result = await pool.query(query, [county, lng, lat]);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).send('Error fetching parcels within the specified county from the database.');
    }
};
