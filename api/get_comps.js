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

    let counts = {
      studio: { rent: 0, sqft: 0, rentPerSqft: 0 },
      oneBd: { rent: 0, sqft: 0, rentPerSqft: 0 },
      twoBd: { rent: 0, sqft: 0, rentPerSqft: 0 },
      threeBd: { rent: 0, sqft: 0, rentPerSqft: 0 }
    };

    let weightedSums = {
      studio: {
        rent: 0,
        sqft: 0,
        rentPerSqft: 0
      },
      oneBd: {
        rent: 0,
        sqft: 0,
        rentPerSqft: 0
      },
      twoBd: {
        rent: 0,
        sqft: 0,
        rentPerSqft: 0
      },
      threeBd: {
        rent: 0,
        sqft: 0,
        rentPerSqft: 0
      }
    };

    result.rows.forEach(row => {
        if (row.st_eff_rent_unit && row.pct_st) {
            weightedSums.studio.rent += row.st_eff_rent_unit * row.pct_st / 100;
            counts.studio.rent++;
        }
        if (row.st_avg_sf && row.pct_st) {
            weightedSums.studio.sqft += row.st_avg_sf * row.pct_st / 100;
            counts.studio.sqft++;
        }
        if (row.st_eff_rent_sf && row.pct_st) {
            weightedSums.studio.rentPerSqft += row.st_eff_rent_sf * row.pct_st / 100;
            counts.studio.rentPerSqft++;
        }
    
        if (row.one_bd_eff_rent_unit && row.pct_1bd) {
            weightedSums.oneBd.rent += row.one_bd_eff_rent_unit * row.pct_1bd / 100;
            counts.oneBd.rent++;
        }
        if (row.one_bd_avg_sf && row.pct_1bd) {
            weightedSums.oneBd.sqft += row.one_bd_avg_sf * row.pct_1bd / 100;
            counts.oneBd.sqft++;
        }
        if (row.one_bd_eff_rent_sf && row.pct_1bd) {
            weightedSums.oneBd.rentPerSqft += row.one_bd_eff_rent_sf * row.pct_1bd / 100;
            counts.oneBd.rentPerSqft++;
        }
    
        if (row.two_bd_eff_rent_unit && row.pct_2bd) {
            weightedSums.twoBd.rent += row.two_bd_eff_rent_unit * row.pct_2bd / 100;
            counts.twoBd.rent++;
        }
        if (row.two_bd_avg_sf && row.pct_2bd) {
            weightedSums.twoBd.sqft += row.two_bd_avg_sf * row.pct_2bd / 100;
            counts.twoBd.sqft++;
        }
        if (row.two_bd_eff_rent_sf && row.pct_2bd) {
            weightedSums.twoBd.rentPerSqft += row.two_bd_eff_rent_sf * row.pct_2bd / 100;
            counts.twoBd.rentPerSqft++;
        }
    
        if (row.three_bd_eff_rent_unit && row.pct_3bd) {
            weightedSums.threeBd.rent += row.three_bd_eff_rent_unit * row.pct_3bd / 100;
            counts.threeBd.rent++;
        }
        if (row.three_bd_avg_sf && row.pct_3bd) {
            weightedSums.threeBd.sqft += row.three_bd_avg_sf * row.pct_3bd / 100;
            counts.threeBd.sqft++;
        }
        if (row.three_bd_eff_rent_sf && row.pct_3bd) {
            weightedSums.threeBd.rentPerSqft += row.three_bd_eff_rent_sf * row.pct_3bd / 100;
            counts.threeBd.rentPerSqft++;
        }
    });
  

    console.log('Weighted Effective Rents:');
    console.log('Studio:', counts.studio.rent ? (weightedSums.studio.rent / counts.studio.rent) : 0);
    console.log('1 Bed: ', counts.oneBd.rent ? (weightedSums.oneBd.rent / counts.oneBd.rent) : 0);
    console.log('2 Bed: ', counts.twoBd.rent ? (weightedSums.twoBd.rent / counts.twoBd.rent) : 0);
    console.log('3 Bed: ', counts.threeBd.rent ? (weightedSums.threeBd.rent / counts.threeBd.rent) : 0);
    
    console.log('\nWeighted Average Square Footages:');
    console.log('Studio:', counts.studio.sqft ? (weightedSums.studio.sqft / counts.studio.sqft) : 0);
    console.log('1 Bed: ', counts.oneBd.sqft ? (weightedSums.oneBd.sqft / counts.oneBd.sqft) : 0);
    console.log('2 Bed: ', counts.twoBd.sqft ? (weightedSums.twoBd.sqft / counts.twoBd.sqft) : 0);
    console.log('3 Bed: ', counts.threeBd.sqft ? (weightedSums.threeBd.sqft / counts.threeBd.sqft) : 0);

    console.log('\nWeighted Effective Rent per Square Foot:');
    console.log('Studio:', counts.studio.rentPerSqft ? (weightedSums.studio.rentPerSqft / counts.studio.rentPerSqft) : 0);
    console.log('1 Bed: ', counts.oneBd.rentPerSqft ? (weightedSums.oneBd.rentPerSqft / counts.oneBd.rentPerSqft) : 0);
    console.log('2 Bed: ', counts.twoBd.rentPerSqft ? (weightedSums.twoBd.rentPerSqft / counts.twoBd.rentPerSqft) : 0);
    console.log('3 Bed: ', counts.threeBd.rentPerSqft ? (weightedSums.threeBd.rentPerSqft / counts.threeBd.rentPerSqft) : 0);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error encountered:', err);
    res.status(500).send('Internal Server Error');
  }
};
