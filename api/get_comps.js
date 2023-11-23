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

  const COMPS_COUNT_CAP = 10;

  // Check for preflight request
  if (req.method === 'OPTIONS') {
    res.status(204).send();
    return;
  }
  
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radius = parseFloat(req.query.radius);
  const limit = parseInt(req.query.limit);
  
  // Validate and cap the comps quantity
  if (limit > COMPS_COUNT_CAP) {
    console.warn('Comps limit exceeds the allowed value; capping to ' + COMPS_COUNT_CAP + '.');
    limit = COMPS_COUNT_CAP;
  }
  /* (still will produce unlimited results if no limit provided - potentially a huge problem) */

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
    //console.log('Database returned', result.rows.length, 'rows.');

    let totalUnitsByType = {
      studio: 0,
      oneBd: 0,
      twoBd: 0,
      threeBd: 0
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
    
        // Increment the total units by type
        totalUnitsByType.studio += studioUnits;
        totalUnitsByType.oneBd += oneBdUnits;
        totalUnitsByType.twoBd += twoBdUnits;
        totalUnitsByType.threeBd += threeBdUnits;
        
        //console.log(`\nProperty: ${row.property_name}\n  - Total Units: ${totalUnits.toFixed(0)}\n  - Studio Units: ${studioUnits.toFixed(0)}\n  - One Bedroom Units: ${oneBdUnits.toFixed(0)}\n  - Two Bedroom Units: ${twoBdUnits.toFixed(0)}\n  - Three Bedroom Units: ${threeBdUnits.toFixed(0)}\n`);

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
        
        //console.log(`Accumulated Weighted Sums for PropertyID: ${row.propertyid}`, JSON.stringify(weightedSums));
    });

    // Total number of units from all properties
    const totalUnitsAllProperties = totalUnitsByType.studio + totalUnitsByType.oneBd + totalUnitsByType.twoBd + totalUnitsByType.threeBd;

    // Calculate the weighted percentages by unit type
    const weightedPercentages = {
      studio: (totalUnitsByType.studio / totalUnitsAllProperties * 100).toFixed(1),
      oneBd: (totalUnitsByType.oneBd / totalUnitsAllProperties * 100).toFixed(1),
      twoBd: (totalUnitsByType.twoBd / totalUnitsAllProperties * 100).toFixed(1),
      threeBd: (totalUnitsByType.threeBd / totalUnitsAllProperties * 100).toFixed(1)
    };

    console.log('\nWeighted Percentages by Unit Type:');
    console.log('Studio: ' + weightedPercentages.studio + '%');
    console.log('1 Bed: ' + weightedPercentages.oneBd + '%');
    console.log('2 Bed: ' + weightedPercentages.twoBd + '%');
    console.log('3 Bed: ' + weightedPercentages.threeBd + '%');

    console.log('\nWeighted Effective Rents:');
    console.log('Studio:', totalUnitsByType.studio ? parseFloat((weightedSums.studio.rent / totalUnitsByType.studio).toFixed(0)) : 0);
    console.log('1 Bed: ', totalUnitsByType.oneBd ? parseFloat((weightedSums.oneBd.rent / totalUnitsByType.oneBd).toFixed(0)) : 0);
    console.log('2 Bed: ', totalUnitsByType.twoBd ? parseFloat((weightedSums.twoBd.rent / totalUnitsByType.twoBd).toFixed(0)) : 0);
    console.log('3 Bed: ', totalUnitsByType.threeBd ? parseFloat((weightedSums.threeBd.rent / totalUnitsByType.threeBd).toFixed(0)) : 0);

    console.log('\nWeighted Average Square Footages:');
    console.log('Studio:', totalUnitsByType.studio ? parseFloat((weightedSums.studio.sqft / totalUnitsByType.studio).toFixed(0)) : 0);
    console.log('1 Bed: ', totalUnitsByType.oneBd ? parseFloat((weightedSums.oneBd.sqft / totalUnitsByType.oneBd).toFixed(0)) : 0);
    console.log('2 Bed: ', totalUnitsByType.twoBd ? parseFloat((weightedSums.twoBd.sqft / totalUnitsByType.twoBd).toFixed(0)) : 0);
    console.log('3 Bed: ', totalUnitsByType.threeBd ? parseFloat((weightedSums.threeBd.sqft / totalUnitsByType.threeBd).toFixed(0)) : 0);

    console.log('\nWeighted Effective Rent per Square Foot:');
    console.log('Studio:', totalUnitsByType.studio ? parseFloat((weightedSums.studio.rentPerSqft / totalUnitsByType.studio).toFixed(2)) : 0);
    console.log('1 Bed: ', totalUnitsByType.oneBd ? parseFloat((weightedSums.oneBd.rentPerSqft / totalUnitsByType.oneBd).toFixed(2)) : 0);
    console.log('2 Bed: ', totalUnitsByType.twoBd ? parseFloat((weightedSums.twoBd.rentPerSqft / totalUnitsByType.twoBd).toFixed(2)) : 0);
    console.log('3 Bed: ', totalUnitsByType.threeBd ? parseFloat((weightedSums.threeBd.rentPerSqft / totalUnitsByType.threeBd).toFixed(2)) : 0);
    
    // Calculate the averages
    const averages = {
      rents: {
        studio: totalUnitsByType.studio ? parseFloat((weightedSums.studio.rent / totalUnitsByType.studio).toFixed(0)) : 0,
        oneBd: totalUnitsByType.oneBd ? parseFloat((weightedSums.oneBd.rent / totalUnitsByType.oneBd).toFixed(0)) : 0,
        twoBd: totalUnitsByType.twoBd ? parseFloat((weightedSums.twoBd.rent / totalUnitsByType.twoBd).toFixed(0)) : 0,
        threeBd: totalUnitsByType.threeBd ? parseFloat((weightedSums.threeBd.rent / totalUnitsByType.threeBd).toFixed(0)) : 0
      },
      sqfts: {
        studio: totalUnitsByType.studio ? parseFloat((weightedSums.studio.sqft / totalUnitsByType.studio).toFixed(0)) : 0,
        oneBd: totalUnitsByType.oneBd ? parseFloat((weightedSums.oneBd.sqft / totalUnitsByType.oneBd).toFixed(0)) : 0,
        twoBd: totalUnitsByType.twoBd ? parseFloat((weightedSums.twoBd.sqft / totalUnitsByType.twoBd).toFixed(0)) : 0,
        threeBd: totalUnitsByType.threeBd ? parseFloat((weightedSums.threeBd.sqft / totalUnitsByType.threeBd).toFixed(0)) : 0
      },
      rentPerSqfts: {
        studio: totalUnitsByType.studio ? parseFloat((weightedSums.studio.rentPerSqft / totalUnitsByType.studio).toFixed(2)) : 0,
        oneBd: totalUnitsByType.oneBd ? parseFloat((weightedSums.oneBd.rentPerSqft / totalUnitsByType.oneBd).toFixed(2)) : 0,
        twoBd: totalUnitsByType.twoBd ? parseFloat((weightedSums.twoBd.rentPerSqft / totalUnitsByType.twoBd).toFixed(2)) : 0,
        threeBd: totalUnitsByType.threeBd ? parseFloat((weightedSums.threeBd.rentPerSqft / totalUnitsByType.threeBd).toFixed(2)) : 0
      }
    };

    // Return the averages in the response
    res.status(200).json({
        data: result.rows,
        averages: averages,
        percentages: weightedPercentages
    });
  } catch (err) {
    console.error('Error encountered:', err);
    res.status(500).send('Internal Server Error');
  }
};
