
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
    // Setting CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);

    // Check if lat and lng are valid numbers
    if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).send('Invalid latitude or longitude values provided.');
    }

    try {
        const countyQuery = `
        SELECT county_name 
        FROM florida_counties 
        WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326));
        `;

        const countyResult = await pool.query(countyQuery, [lng, lat]);
        const countyName = countyResult.rows[0].county_name;

        const dataQuery = `
        SELECT 
            fc.county_name, 
            fc.area_median_income, 
            fc.millage_rate,
            ca.area_median_income AS county_amis_income,
            cm.millage AS county_millage
        FROM florida_counties AS fc
        LEFT JOIN county_amis AS ca ON fc.county_name = ca.county_name
        LEFT JOIN county_millages AS cm ON fc.county_name = cm.county_name
        WHERE fc.county_name = $1;
        `;

        const dataResult = await pool.query(dataQuery, [countyName]);

        res.status(200).json(dataResult.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send(`Error: ${err.message}`);
    }
    
};
