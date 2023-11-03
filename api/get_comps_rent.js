const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

module.exports = async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radius = parseFloat(req.query.radius);

  if (!lat || !lng || !radius) {
    return res.status(400).send('Please provide lat, long, and radius in miles as query parameters.');
  }

  try {
    const query = `
      WITH Constants AS (
          SELECT 
              3959 AS EarthRadius -- in miles; use 6371 for kilometers
      )

      SELECT 
          ROUND(AVG(st_ask_rent_unit))::INT AS avg_st_ask_rent_unit,
          ROUND(AVG(one_bd_ask_rent_unit))::INT AS avg_one_bd_ask_rent_unit,
          ROUND(AVG(two_bd_ask_rent_unit))::INT AS avg_two_bd_ask_rent_unit,
          ROUND(AVG(three_bd_ask_rent_unit))::INT AS avg_three_bd_ask_rent_unit
      FROM 
          public.comps_data, Constants
      WHERE 
          building_status = 'Existing' AND
          EarthRadius * 2 * ASIN(SQRT(POWER(SIN((lat - $1) * PI() / 180 / 2), 2) + 
          COS(lat * PI() / 180) * COS($1 * PI() / 180) * 
          POWER(SIN((lng - $2) * PI() / 180 / 2), 2))) < $3
    `;
    
    const result = await pool.query(query, [lat, lng, radius]);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).send('Internal Server Error');
  }
};
