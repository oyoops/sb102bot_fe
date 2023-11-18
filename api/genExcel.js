// api/genExcel.js
const ExcelJS = require('exceljs');

module.exports = async (req, res) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Proforma');
    const inputSheet = workbook.addWorksheet('INPUT');

    // Determine the building type based on acres
    const acres = req.body.acres; // Assuming acres is received from the request body
    let bldgType;
    if (acres < 3) {
        bldgType = "High-Rise";
    } else if (acres <= 10) {
        bldgType = "Midrise";
    } else {
        bldgType = "Garden";
    }

    // Default values based on building type
    const defaults = {
        'Garden': {
            "Land Cost Per Unit": 25000,
            "Construction Cost Per SF A/C": 180,
            "Indirect Cost Per Unit": 35000,
            "Loan to Value (LTV %)": 60,
            "Interest Rate": 6.50,
            "Project Duration (Years)": 4,
            "Studio - Quantity": 25,
            "1BD - Quantity": 125,
            "2BD - Quantity": 100,
            "3BD - Quantity": 50,
            "Studio - Average Rent": 1900,
            "1BD - Average Rent": 2200,
            "2BD - Average Rent": 2500,
            "3BD - Average Rent": 2800,
            "Studio - Size (SF)": 600,
            "1BD - Size (SF)": 800,
            "2BD - Size (SF)": 1050,
            "3BD - Size (SF)": 1350
        },
        'Midrise': {
            "Land Cost Per Unit": 25000,
            "Construction Cost Per SF A/C": 240,
            "Indirect Cost Per Unit": 30000,
            "Loan to Value (LTV %)": 55,
            "Interest Rate": 6.50,
            "Project Duration (Years)": 4,
            "Studio - Quantity": 50,
            "1BD - Quantity": 150,
            "2BD - Quantity": 75,
            "3BD - Quantity": 25,
            "Studio - Average Rent": 2100,
            "1BD - Average Rent": 2400,
            "2BD - Average Rent": 2700,
            "3BD - Average Rent": 3000,
            "Studio - Size (SF)": 550,
            "1BD - Size (SF)": 725,
            "2BD - Size (SF)": 900,
            "3BD - Size (SF)": 1150
        },
        'High-Rise': {
            "Land Cost Per Unit": 35000,
            "Construction Cost Per SF A/C": 325,
            "Indirect Cost Per Unit": 25000,
            "Loan to Value (LTV %)": 50,
            "Interest Rate": 6.50,
            "Project Duration (Years)": 4,
            "Studio - Quantity": 75,
            "1BD - Quantity": 150,
            "2BD - Quantity": 50,
            "3BD - Quantity": 25,
            "Studio - Average Rent": 2300,
            "1BD - Average Rent": 2600,
            "2BD - Average Rent": 2900,
            "3BD - Average Rent": 3200,
            "Studio - Size (SF)": 525,
            "1BD - Size (SF)": 700,
            "2BD - Size (SF)": 875,
            "3BD - Size (SF)": 1125
        }
    };

    
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
    worksheet.getCell(`B${row}`).value = { formula: 'INPUT!B3' }; // GMP per sq. ft. A/C from input sheet
    row++;

    worksheet.getCell(`A${row}`).value = "Total Construction Cost";
    worksheet.getCell(`B${row}`).formula = `B${row-1}*SUMPRODUCT(B2:B5,D2:D5)`; // Construction Cost Per SF * Total SF
    row++;

    worksheet.getCell(`A${row}`).value = "Indirect Cost Per Unit";
    worksheet.getCell(`B${row}`).value = { formula: 'INPUT!B4' }; // Indirect Costs per unit from input sheet
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
    worksheet.getCell(`B${row}`).value = { formula: 'INPUT!B5' }; // LTV from input sheet
    row++;

    worksheet.getCell(`A${row}`).value = "Loan Amount";
    worksheet.getCell(`B${row}`).formula = `B${row-1}/100*B${row-3}`; // LTV % * Total Development Cost
    row++;

    worksheet.getCell(`A${row}`).value = "Equity Investment";
    worksheet.getCell(`B${row}`).formula = `B${row-3}-B${row-1}`; // Total Development Cost - Loan Amount
    const equityInvestmentRow = row;
    row++;

    // Calculating Total Revenue from Units
    worksheet.getCell(`A${row}`).value = "Total Revenue from Units";
    worksheet.getCell(`F${row}`).formula = `SUM(F2:F5)`; // Sum of all unit revenues
    const totalRevenueRow = row;
    row++;

    // Other Financial Inputs
    worksheet.getCell(`A${row}`).value = "Interest Rate";
    worksheet.getCell(`B${row}`).value = { formula: 'INPUT!B6' }; // Interest Rate from input sheet
    const interestRateRow = row;
    row++;

    worksheet.getCell(`A${row}`).value = "Project Duration (Years)";
    worksheet.getCell(`B${row}`).value = { formula: 'INPUT!B7' }; // Project Duration from input sheet
    const projectDurationRow = row;
    row++;

    // Calculations Section
    row += 2; // Skip a row for spacing
    worksheet.getCell(`A${row}`).value = "Total Project Cost";
    worksheet.getCell(`B${row}`).formula = `B${totalRevenueRow-1}+B${equityInvestmentRow}`; // Total Development Cost + Equity Investment
    const totalProjectCostRow = row;
    row++;

    worksheet.getCell(`A${row}`).value = "Total Project Revenue";
    worksheet.getCell(`B${row}`).formula = `F${totalRevenueRow}`; // Total Revenue from Units
    const totalProjectRevenueRow = row;
    row++;

    worksheet.getCell(`A${row}`).value = "Return on Cost";
    worksheet.getCell(`B${row}`).formula = `(B${totalProjectRevenueRow}-B${totalProjectCostRow})/B${totalProjectCostRow}`; // (Total Revenue - Total Cost) / Total Cost
    const returnOnCostRow = row;
    row++;

    // IRR Calculation
    worksheet.getCell(`A${row}`).value = "Internal Rate of Return (IRR)";
    worksheet.getCell(`B${row}`).formula = `(B${totalProjectRevenueRow}-B${totalProjectCostRow})/B${equityInvestmentRow}`; // (Total Revenue - Total Cost) / Equity Investment
    const irrRow = row;
    row++;

    // Outputs Section
    row += 2; // Skip a row for spacing
    worksheet.getCell(`A${row}`).value = "Estimated IRR";
    worksheet.getCell(`B${row}`).formula = `B${irrRow}`; // IRR
    row++;

    worksheet.getCell(`A${row}`).value = "Estimated Return on Cost";
    worksheet.getCell(`B${row}`).formula = `B${returnOnCostRow}`; // Return on Cost

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