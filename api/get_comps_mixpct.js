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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
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
          ROUND(AVG(pct_st::numeric) / 100, 2) AS avg_pct_st,
          ROUND(AVG(pct_1bd::numeric) / 100, 2) AS avg_pct_1bd,
          ROUND(AVG(pct_2bd::numeric) / 100, 2) AS avg_pct_2bd,
          ROUND(AVG(pct_3bd::numeric) / 100, 2) AS avg_pct_3bd
      FROM 
          public.comps_data, Constants
      WHERE 
          EarthRadius * 2 * ASIN(SQRT(POWER(SIN((lat - $1) * PI() / 180 / 2), 2) + 
          COS(lat * PI() / 180) * COS($1 * PI() / 180) * 
          POWER(SIN((lng - $2) * PI() / 180 / 2), 2))) < $3 
          AND building_status = 'Existing'
    `;
    
    const result = await pool.query(query, [lat, lng, radius]);
    const parsedResult = {
      avg_pct_st: parseFloat(result.rows[0].avg_pct_st),
      avg_pct_1bd: parseFloat(result.rows[0].avg_pct_1bd),
      avg_pct_2bd: parseFloat(result.rows[0].avg_pct_2bd),
      avg_pct_3bd: parseFloat(result.rows[0].avg_pct_3bd)
    };
    res.status(200).json(parsedResult);
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
};
