// api/genExcel.js
const ExcelJS = require('exceljs');

module.exports = async (req, res) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Proforma');

    // Inputs for each unit type
    const unitTypes = ['Studio', '1BD', '2BD', '3BD'];
    const unitInputs = {
        'Studio': { quantity: 50, averageRent: 2100, size: 525, rentPerSF: 4.00 },
        '1BD': { quantity: 100, averageRent: 2400, size: 700, rentPerSF: 3.43 },
        '2BD': { quantity: 75, averageRent: 2700, size: 900, rentPerSF: 3.00 },
        '3BD': { quantity: 25, averageRent: 3000, size: 1200, rentPerSF: 2.50 }
    };

    // Financial Inputs for Development Cost Calculation
    const landCostPerUnit = 22500; // Land Cost per Unit ($)
    const constructionCostPerSF = 175; // GMP per sq. ft. A/C ($)
    const indirectCostPerUnit = 37500; // Indirect Costs per unit ($)

    // Calculating Development Costs
    const totalUnits = unitTypes.reduce((total, type) => total + unitInputs[type].quantity, 0);
    const totalSF = unitTypes.reduce((total, type) => total + (unitInputs[type].quantity * unitInputs[type].size), 0);

    const totalLandCost = landCostPerUnit * totalUnits;
    const totalConstructionCost = constructionCostPerSF * totalSF;
    const totalIndirectCost = indirectCostPerUnit * totalUnits;

    const totalDevelopmentCost = totalLandCost + totalConstructionCost + totalIndirectCost;

    // LTV Input and Calculation
    const loanToValuePercentage = 0.55; // Default LTV 55%
    const loanAmount = totalDevelopmentCost * loanToValuePercentage;
    const equityInvestment = totalDevelopmentCost - loanAmount;


    const interestRate = 0.06; // Interest Rate (6%)
    const projectDurationYears = 4; // Project Duration in Years

    // Set up the Inputs Section for Unit Mix
    worksheet.getCell('A1').value = "Unit Type";
    worksheet.getCell('B1').value = "Quantity";
    worksheet.getCell('C1').value = "Average Rent";
    worksheet.getCell('D1').value = "Size (SF)";
    worksheet.getCell('E1').value = "Rent per SF";
    worksheet.getCell('F1').value = "Total Revenue";

    let row = 2;
    for (const type of unitTypes) {
        const unit = unitInputs[type];
        worksheet.getCell(`A${row}`).value = type;
        worksheet.getCell(`B${row}`).value = unit.quantity;
        worksheet.getCell(`C${row}`).value = unit.averageRent;
        worksheet.getCell(`D${row}`).value = unit.size;
        worksheet.getCell(`E${row}`).value = unit.rentPerSF;
        worksheet.getCell(`F${row}`).formula = `B${row}*C${row}*12`; // Monthly rent * quantity * 12 months
        row++;
    }

    
    // Add Development Cost Breakdown to Worksheet
    row += 2; // Skip a row for spacing
    worksheet.getCell(`A${row}`).value = "Land Cost Per Unit";
    worksheet.getCell(`B${row}`).value = landCostPerUnit;
    row++;

    worksheet.getCell(`A${row}`).value = "Total Land Cost";
    worksheet.getCell(`B${row}`).formula = `B${row-1}*${totalUnits}`;
    row++;

    worksheet.getCell(`A${row}`).value = "Construction Cost Per SF A/C";
    worksheet.getCell(`B${row}`).value = constructionCostPerSF;
    row++;

    worksheet.getCell(`A${row}`).value = "Total Construction Cost";
    worksheet.getCell(`B${row}`).formula = `B${row-1}*${totalSF}`;
    row++;

    worksheet.getCell(`A${row}`).value = "Indirect Cost Per Unit";
    worksheet.getCell(`B${row}`).value = indirectCostPerUnit;
    row++;

    worksheet.getCell(`A${row}`).value = "Total Indirect Cost";
    worksheet.getCell(`B${row}`).formula = `B${row-1}*${totalUnits}`;
    row++;

    worksheet.getCell(`A${row}`).value = "Total Development Cost";
    worksheet.getCell(`B${row}`).formula = `SUM(B${row-4},B${row-2},B${row})`;
    row++;

    // Adjustments for LTV and Financing
    row += 2; // Skip a row for spacing
    worksheet.getCell(`A${row}`).value = "Loan to Value (LTV %)";
    worksheet.getCell(`B${row}`).value = loanToValuePercentage * 100;
    row++;

    worksheet.getCell(`A${row}`).value = "Loan Amount";
    worksheet.getCell(`B${row}`).value = loanAmount;
    row++;

    worksheet.getCell(`A${row}`).value = "Equity Investment";
    worksheet.getCell(`B${row}`).value = equityInvestment;
    row++;

    // Calculating Total Revenue from Units
    worksheet.getCell(`A${row}`).value = "Total Revenue from Units";
    worksheet.getCell(`F${row}`).formula = `SUM(F2:F${row-1})`; // Sum of all unit revenues

    const totalRevenueRow = row;

    // Other Financial Inputs
    row += 2; // Skip a row for spacing
    worksheet.getCell(`A${row}`).value = "Total Development Cost";
    worksheet.getCell(`B${row}`).value = totalDevelopmentCost;
    row++;

    worksheet.getCell(`A${row}`).value = "Equity Investment";
    worksheet.getCell(`B${row}`).value = equityInvestment;
    row++;

    worksheet.getCell(`A${row}`).value = "Loan Amount";
    worksheet.getCell(`B${row}`).value = loanAmount;
    row++;

    worksheet.getCell(`A${row}`).value = "Interest Rate";
    worksheet.getCell(`B${row}`).value = interestRate;
    row++;

    worksheet.getCell(`A${row}`).value = "Project Duration (Years)";
    worksheet.getCell(`B${row}`).value = projectDurationYears;
    row++;

    // Calculations Section
    row += 2; // Skip a row for spacing
    worksheet.getCell(`A${row}`).value = "Total Project Cost";
    worksheet.getCell(`B${row}`).formula = `SUM(B${totalRevenueRow+2}:B${totalRevenueRow+4})`; // Sum of Development Cost and Loan Amount
    row++;

    worksheet.getCell(`A${row}`).value = "Total Project Revenue";
    worksheet.getCell(`B${row}`).value = { formula: `F${totalRevenueRow}` };
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
    worksheet.getCell(`B${row}`).value = { formula: `B${row-2}` };
    row++;

    worksheet.getCell(`A${row}`).value = "Estimated Return on Cost";
    worksheet.getCell(`B${row}`).value = { formula: `B${row-3}` };

    // File Format Selection
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
