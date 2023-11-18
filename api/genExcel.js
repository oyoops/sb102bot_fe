// api/genExcel.js
const ExcelJS = require('exceljs');

module.exports = async (req, res) => {
    const workbook = new ExcelJS.Workbook();

    // Create the 'Proforma' worksheet
    const worksheet = workbook.addWorksheet('Proforma');

    // Create the 'INPUT' worksheet for user inputs
    const inputSheet = workbook.addWorksheet('INPUT');

    // Set up the Inputs on the INPUT sheet
    inputSheet.getCell('A1').value = "Description";
    inputSheet.getCell('B1').value = "Value";

    const inputs = [
        'Land Cost Per Unit',
        'Construction Cost Per SF A/C',
        'Indirect Cost Per Unit',
        'Loan to Value (LTV %)',
        'Interest Rate',
        'Project Duration (Years)'
    ];

    inputs.forEach((input, index) => {
        inputSheet.getCell(`A${index + 2}`).value = input;
        inputSheet.getCell(`B${index + 2}`).value = 0; // Default values, to be filled in by the user
    });

    // Add unit types to the INPUT sheet
    const unitTypes = ['Studio', '1BD', '2BD', '3BD'];
    unitTypes.forEach((type, index) => {
        inputSheet.getCell(`A${index + 8}`).value = `${type} - Quantity`;
        inputSheet.getCell(`B${index + 8}`).value = 0;

        inputSheet.getCell(`A${index + 12}`).value = `${type} - Average Rent`;
        inputSheet.getCell(`B${index + 12}`).value = 0;

        inputSheet.getCell(`A${index + 16}`).value = `${type} - Size (SF)`;
        inputSheet.getCell(`B${index + 16}`).value = 0;
    });

    // Set up the Inputs Section for Unit Mix on the Proforma sheet
    worksheet.getCell('A1').value = "Unit Type";
    worksheet.getCell('B1').value = "Quantity";
    worksheet.getCell('C1').value = "Average Rent";
    worksheet.getCell('D1').value = "Size (SF)";
    worksheet.getCell('E1').value = "Rent per SF";
    worksheet.getCell('F1').value = "Total Revenue";

    let row = 2;
    unitTypes.forEach((type, index) => {
        worksheet.getCell(`A${row}`).value = type;
        worksheet.getCell(`B${row}`).value = { formula: `INPUT!B${index + 8}` }; // Quantity from input sheet
        worksheet.getCell(`C${row}`).value = { formula: `INPUT!B${index + 12}` }; // Average Rent from input sheet
        worksheet.getCell(`D${row}`).value = { formula: `INPUT!B${index + 16}` }; // Size (SF) from input sheet
        worksheet.getCell(`E${row}`).formula = `C${row}/D${row}`; // Average Rent / Size (SF)
        worksheet.getCell(`F${row}`).formula = `B${row}*C${row}*12`; // Monthly rent * quantity * 12 months
        row++;
    });

    // Add Development Cost Breakdown to Worksheet
    row += 2; // Skip a row for spacing
    worksheet.getCell(`A${row}`).value = "Land Cost Per Unit";
    worksheet.getCell(`B${row}`).value = { formula: 'INPUT!B2' }; // Land Cost per Unit from input sheet
    row++;

    worksheet.getCell(`A${row}`).value = "Total Land Cost";
    worksheet.getCell(`B${row}`).formula = `B${row-1}*SUM(B2:B5)`; // Land Cost Per Unit * Total Units
    row++;

    worksheet.getCell(`A${row}`).value = "Construction Cost Per SF A/C";
    worksheet.getCell(`B${row}`).value = { formula: 'INPUT!C2' }; // GMP per sq. ft. A/C from input sheet
    row++;

    worksheet.getCell(`A${row}`).value = "Total Construction Cost";
    worksheet.getCell(`B${row}`).formula = `B${row-1}*SUMPRODUCT(B2:B5,D2:D5)`; // Construction Cost Per SF * Total SF
    row++;

    worksheet.getCell(`A${row}`).value = "Indirect Cost Per Unit";
    worksheet.getCell(`B${row}`).value = { formula: 'INPUT!D2' }; // Indirect Costs per unit from input sheet
    row++;

    worksheet.getCell(`A${row}`).value = "Total Indirect Cost";
    worksheet.getCell(`B${row}`).formula = `B${row-1}*SUM(B2:B5)`; // Indirect Cost Per Unit * Total Units
    row++;

    worksheet.getCell(`A${row}`).value = "Total Development Cost";
    worksheet.getCell(`B${row}`).formula = `SUM(B${row-4},B${row-2},B${row})`; // Sum of Land, Construction, and Indirect Costs
    row++;

    // LTV and Financing Section
    row += 2; // Skip a row for spacing
    worksheet.getCell(`A${row}`).value = "Loan to Value (LTV %)";
    worksheet.getCell(`B${row}`).value = { formula: 'INPUT!E2' }; // LTV from input sheet
    row++;

    worksheet.getCell(`A${row}`).value = "Loan Amount";
    worksheet.getCell(`B${row}`).formula = `B${row-1}/100*B${row-3}`; // LTV % * Total Development Cost
    row++;

    worksheet.getCell(`A${row}`).value = "Equity Investment";
    worksheet.getCell(`B${row}`).formula = `B${row-3}-B${row-1}`; // Total Development Cost - Loan Amount
    row++;

    // Calculating Total Revenue from Units
    worksheet.getCell(`A${row}`).value = "Total Revenue from Units";
    worksheet.getCell(`F${row}`).formula = `SUM(F2:F5)`; // Sum of all unit revenues
    const totalRevenueRow = row;

    // Other Financial Inputs
    row += 2; // Skip a row for spacing
    worksheet.getCell(`A${row}`).value = "Interest Rate";
    worksheet.getCell(`B${row}`).value = { formula: 'INPUT!F2' }; // Interest Rate from input sheet
    row++;

    worksheet.getCell(`A${row}`).value = "Project Duration (Years)";
    worksheet.getCell(`B${row}`).value = { formula: 'INPUT!G2' }; // Project Duration from input sheet
    row++;

    // Calculations Section
    row += 2; // Skip a row for spacing
    worksheet.getCell(`A${row}`).value = "Total Project Cost";
    worksheet.getCell(`B${row}`).formula = `B${totalRevenueRow-1}+B${totalRevenueRow+1}`; // Total Development Cost + Loan Amount
    row++;

    worksheet.getCell(`A${row}`).value = "Total Project Revenue";
    worksheet.getCell(`B${row}`).formula = `F${totalRevenueRow}`; // Total Revenue from Units
    row++;

    worksheet.getCell(`A${row}`).value = "Return on Cost";
    worksheet.getCell(`B${row}`).formula = `(B${row-1}-B${row-2})/B${row-2}`; // (Total Revenue - Total Cost) / Total Cost
    row++;

    // IRR Calculation
    worksheet.getCell(`A${row}`).value = "Internal Rate of Return (IRR)";
    worksheet.getCell(`B${row}`).formula = `(B${row-2}-B${row-3})/B${totalRevenueRow+3}`; // (Total Revenue - Total Cost) / Equity Investment
    row++;

    // Outputs Section
    row += 2; // Skip a row for spacing
    worksheet.getCell(`A${row}`).value = "Estimated IRR";
    worksheet.getCell(`B${row}`).formula = `B${row-2}`; // IRR
    row++;

    worksheet.getCell(`A${row}`).value = "Estimated Return on Cost";
    worksheet.getCell(`B${row}`).formula = `B${row-3}`; // Return on Cost

    // File Format Selection and Response
    const fileFormat = req.body.fileFormat || 'xlsx'; // Default to 'xlsx' if not specified
    const fileExtension = fileFormat === 'xlsm' ? 'xlsm' : 'xlsx';
    
    res.setHeader('Content-Type', `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`);
    res.setHeader('Content-Disposition', `attachment; filename=Proforma.${fileExtension}`);
    
    if (fileExtension === 'xlsm') {
        await workbook.xlsx.write(res);
    } else {
        await workbook.xlsx.write(res);
    }
    res.end();
};