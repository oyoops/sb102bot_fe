
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env("DB_USER"),
    host: process.env("DB_HOST"),
    database: process.env("DB_NAME"),
    password: process.env("DB_PASS"),
    port: process.env("DB_PORT"),
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = async (req, res) => {
    const lat = req.query.lat;
    const lng = req.query.lng;

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
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};
