// api/generate-excel.js
const ExcelJS = require('exceljs');

module.exports = async (req, res) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Worksheet69');

    // Assuming req.body contains the data
    const data = req.body;
    const acres = data.acres;

    // Populate the worksheet with data
    worksheet.getCell('A1').value = "PROFORMA TEST";
    worksheet.getCell('A3').value = "Acres:";
    worksheet.getCell('B3').value = acres;

    // (more code to manipulate the workbook as needed)

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
};
