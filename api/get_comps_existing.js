const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  // Check for preflight request
  if (req.method === 'OPTIONS') {
    // Preflight request. Reply successfully:
    res.status(204).send();
    return;
  }
  
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
          *
      FROM 
          public.comps_data, Constants
      WHERE 
          building_status = 'Existing' AND
          EarthRadius * 2 * ASIN(SQRT(POWER(SIN((lat - $1) * PI() / 180 / 2), 2) + 
          COS(lat * PI() / 180) * COS($1 * PI() / 180) * 
          POWER(SIN((lng - $2) * PI() / 180 / 2), 2))) < $3
    `;

    const result = await pool.query(query, [lat, lng, radius]);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).send('Internal Server Error');
  }
};
