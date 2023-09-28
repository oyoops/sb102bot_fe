const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false
    }
});


module.exports = async (req, res) => {
    const lat = req.query.lat;
    const lng = req.query.lng;
    const minAcreage = req.query.min_acreage || 0;
    const maxAcreage = req.query.max_acreage || 10;

    try {
        // Note: Assuming the parcels_master table has an 'acreage' column. If not, this query needs adjustment.
        const query = `
        SELECT parcelno, county_name 
        FROM parcels_master 
        WHERE acreage BETWEEN $1 AND $2
        ORDER BY geom <-> ST_SetSRID(ST_MakePoint($3, $4), 4326) ASC
        LIMIT 50;
        `;

        const result = await pool.query(query, [minAcreage, maxAcreage, lng, lat]);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).send('Error fetching parcels based on acreage from the database.');
    }
};
