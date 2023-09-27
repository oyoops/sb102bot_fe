
const { connect_to_database } = require('../database');

module.exports = async (req, res) => {
    const county_name = req.query.county_name;
    const conn = await connect_to_database();

    try {
        const county_data = await conn.query("SELECT * FROM florida_counties WHERE county_name = $1", [county_name]);
        const amis_data = await conn.query("SELECT * FROM county_amis WHERE county_name = $1", [county_name]);
        const max_incomes_data = await conn.query("SELECT * FROM county_max_incomes WHERE county_name = $1", [county_name]);
        const max_rents_data = await conn.query("SELECT * FROM county_max_rents WHERE county_name = $1", [county_name]);

        res.json({
            county_data: county_data.rows[0],
            amis_data: amis_data.rows[0],
            max_incomes_data: max_incomes_data.rows[0],
            max_rents_data: max_rents_data.rows[0]
        });
    } catch (error) {
        res.json({ error: "Error fetching data from the database." });
    } finally {
        conn.end();
    }
};
