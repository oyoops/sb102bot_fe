const ExcelJS = require('exceljs');

module.exports = async (req, res) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Worksheet69');

    // Assuming req.body contains the data
    const data = req.body;
    const acres = parseFloat(data.acres); // Ensure it's a float
    const format = data.format || 'xlsx'; // Default to xlsx if format isn't provided

    // Populate the worksheet with data
    worksheet.getCell('A1').value = "PROFORMA TEST";
    worksheet.getCell('A3').value = "Acres:";
    worksheet.getCell('B3').value = acres; // Now as a number
    worksheet.getCell('B4').value = { formula: "B3*25" }; // Cell with formula

    // Set the correct content type based on the format
    const contentType = format === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/vnd.ms-excel.sheet.macroEnabled.12';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=report.${format}`);

    // Write the workbook in the correct format
    if (format === 'xlsx') {
        await workbook.xlsx.write(res);
    } else {
        await workbook.xlsx.write(res); // You will need to change this to a macro-enabled write method if using actual macros
    }
    
    res.end();
};