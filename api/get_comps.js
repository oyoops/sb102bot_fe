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
  const radius = parseFloat(req.query.radius);
  const limit = parseInt(req.query.limit);

  console.log('Received new comps request:\n', {
    lat: lat,
    lng: lng,
    radius: radius
  });

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
              3959 AS EarthRadius
      )

      SELECT 
          *
      FROM 
          public.comps_data, Constants
      WHERE 
          ${distanceFormula} < $3
      ORDER BY 
          ${distanceFormula} ASC
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
        const totalUnits = row.num_of_units;
        
        const studioUnits = totalUnits * (row.pct_st || 0) / 100;
        const oneBdUnits = totalUnits * (row.pct_1bd || 0) / 100;
        const twoBdUnits = totalUnits * (row.pct_2bd || 0) / 100;
        const threeBdUnits = totalUnits * (row.pct_3bd || 0) / 100;

        weightedSums.studio.rent += (row.st_eff_rent_unit || 0) * studioUnits;
        weightedSums.studio.sqft += (row.st_avg_sf || 0) * studioUnits;
        weightedSums.studio.rentPerSqft += (row.st_eff_rent_sf || 0) * studioUnits;
        
        weightedSums.oneBd.rent += (row.one_bd_eff_rent_unit || 0) * oneBdUnits;
        weightedSums.oneBd.sqft += (row.one_bd_avg_sf || 0) * oneBdUnits;
        weightedSums.oneBd.rentPerSqft += (row.one_bd_eff_rent_sf || 0) * oneBdUnits;
        
        weightedSums.twoBd.rent += (row.two_bd_eff_rent_unit || 0) * twoBdUnits;
        weightedSums.twoBd.sqft += (row.two_bd_avg_sf || 0) * twoBdUnits;
        weightedSums.twoBd.rentPerSqft += (row.two_bd_eff_rent_sf || 0) * twoBdUnits;
        
        weightedSums.threeBd.rent += (row.three_bd_eff_rent_unit || 0) * threeBdUnits;
        weightedSums.threeBd.sqft += (row.three_bd_avg_sf || 0) * threeBdUnits;
        weightedSums.threeBd.rentPerSqft += (row.three_bd_eff_rent_sf || 0) * threeBdUnits;
    });

    const totalUnitsInResult = result.rows.reduce((acc, row) => acc + row.num_of_units, 0);

    console.log('Weighted Effective Rents:');
    console.log('Studio:', totalUnitsInResult ? (weightedSums.studio.rent / totalUnitsInResult) : 0);
    console.log('1 Bed: ', totalUnitsInResult ? (weightedSums.oneBd.rent / totalUnitsInResult) : 0);
    console.log('2 Bed: ', totalUnitsInResult ? (weightedSums.twoBd.rent / totalUnitsInResult) : 0);
    console.log('3 Bed: ', totalUnitsInResult ? (weightedSums.threeBd.rent / totalUnitsInResult) : 0);
    
    console.log('\nWeighted Average Square Footages:');
    console.log('Studio:', totalUnitsInResult ? (weightedSums.studio.sqft / totalUnitsInResult) : 0);
    console.log('1 Bed: ', totalUnitsInResult ? (weightedSums.oneBd.sqft / totalUnitsInResult) : 0);
    console.log('2 Bed: ', totalUnitsInResult ? (weightedSums.twoBd.sqft / totalUnitsInResult) : 0);
    console.log('3 Bed: ', totalUnitsInResult ? (weightedSums.threeBd.sqft / totalUnitsInResult) : 0);

    console.log('\nWeighted Effective Rent per Square Foot:');
    console.log('Studio:', totalUnitsInResult ? (weightedSums.studio.rentPerSqft / totalUnitsInResult) : 0);
    console.log('1 Bed: ', totalUnitsInResult ? (weightedSums.oneBd.rentPerSqft / totalUnitsInResult) : 0);
    console.log('2 Bed: ', totalUnitsInResult ? (weightedSums.twoBd.rentPerSqft / totalUnitsInResult) : 0);
    console.log('3 Bed: ', totalUnitsInResult ? (weightedSums.threeBd.rentPerSqft / totalUnitsInResult) : 0);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error encountered:', err);
    res.status(500).send('Internal Server Error');
  }
};
