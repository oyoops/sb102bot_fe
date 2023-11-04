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
    res.status(204).send();
    return;
  }
  
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radius = parseFloat(req.query.radius); // radius in miles
  const limit = parseInt(req.query.limit); // max result rows

  console.log('Received new comps request:\n', {
    lat: lat,
    lng: lng,
    radius: radius
  });

  // Validate if latitude and longitude are within Florida bounds
  if (lat < 24.396308 || lat > 31.001056 || lng < -87.634938 || lng > -80.031362) {
    return res.status(400).send('Please provide a valid lat and long for Florida.');
  }

  if (!lat || !lng || !radius) {
    console.warn('Invalid lat/lng for Florida received:', { lat: lat, lng: lng });
    return res.status(400).send('Please provide lat, long, and radius in miles as query parameters.');
  }

  try {
    const distanceFormula = `
      EarthRadius * 2 * ASIN(SQRT(POWER(SIN((lat - $1) * PI() / 180 / 2), 2) + 
      COS(lat * PI() / 180) * COS($1 * PI() / 180) * 
      POWER(SIN((lng - $2) * PI() / 180 / 2), 2)))
    `;

    let query = `
      WITH Constants AS (
          SELECT 
              3959 AS EarthRadius -- in miles; use 6371 for kilometers
      )

      SELECT 
          *
      FROM 
          public.comps_data, Constants
      WHERE 
          ${distanceFormula} < $3
      ORDER BY 
          ${distanceFormula} ASC  -- Sort by closest distance first
    `;

    if (limit) {
      query += ` LIMIT $4`;
    }

    const queryParams = limit ? [lat, lng, radius, limit] : [lat, lng, radius];
    const result = await pool.query(query, queryParams);
    console.log('Database returned', result.rows.length, 'rows.');
    console.log('Comp #1:\n', result.rows.slice(0, 1));

    let weightedSums = {
      studio: 0,
      oneBd: 0,
      twoBd: 0,
      threeBd: 0
    };
  
    result.rows.forEach(row => {
      weightedSums.studio += (row.st_eff_rent_unit || 0) * (row.pct_st || 0) / 100;
      weightedSums.oneBd += (row.one_bd_eff_rent_unit || 0) * (row.pct_1bd || 0) / 100;
      weightedSums.twoBd += (row.two_bd_eff_rent_unit || 0) * (row.pct_2bd || 0) / 100;
      weightedSums.threeBd += (row.three_bd_eff_rent_unit || 0) * (row.pct_3bd || 0) / 100;
    });
  
    console.log('\nWeighted Effective Rents:');
    console.log('Studio:', weightedSums.studio / result.rows.length);
    console.log('1 Bedroom:', weightedSums.oneBd / result.rows.length);
    console.log('2 Bedrooms:', weightedSums.twoBd / result.rows.length);
    console.log('3 Bedrooms:', weightedSums.threeBd / result.rows.length);  

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error encountered:', err);
    res.status(500).send('Internal Server Error');
  }
};
