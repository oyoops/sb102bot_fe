const ExcelJS = require('exceljs');
const logger = require('../logger');

module.exports = async (req, res) => {
    try {
        // Extract acreage from payload
        let acres = parseFloat(req.body.acres);
        acres = parseFloat(acres.toFixed(2));
        // Validate acreage
        if (typeof acres !== 'number' || acres <= 0) {
            logger.sendLog(`Invalid acres value received: ${acres}. Setting to default value of 9.99 acres.`);
            acres = 9.99;
        }
        logger.sendLog("Acres:", acres);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Proforma');
        const inputSheet = workbook.addWorksheet('INPUT');

        // Determine the building type (based on acres)
        let bldgType;
        if (acres < 3) {
            bldgType = "High-Rise";
        } else if (acres <= 10) {
            bldgType = "Midrise";
        } else {
            bldgType = "Garden";
        }

        // Set default input values based on building type
        const defaults = getDefaults(bldgType);

        // Initialize INPUT sheet with default values
        initializeInputSheet(inputSheet, defaults);

        // Define unit types
        const unitTypes = ['Studio', '1BD', '2BD', '3BD'];

        
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
            worksheet.getCell(`B${row}`).value = { formula: `INPUT!B${index + 2}` };
            worksheet.getCell(`C${row}`).value = { formula: `INPUT!B${index + 6}` };
            worksheet.getCell(`D${row}`).value = { formula: `INPUT!B${index + 10}` };
            worksheet.getCell(`E${row}`).value = { formula: `C${row}/D${row}` };
            worksheet.getCell(`F${row}`).value = { formula: `B${row}*C${row}*12` };
            row++;
        });


        // Add Development Cost Breakdown to Worksheet
        row += 2; // Skip a row for spacing
        worksheet.getCell(`A${row}`).value = "Land Cost Per Unit";
        worksheet.getCell(`B${row}`).value = { formula: 'INPUT!B1' }; // Corrected formula reference
        row++;

        worksheet.getCell(`A${row}`).value = "Total Land Cost";
        worksheet.getCell(`B${row}`).value = { formula: `B${row-1}*SUM(B2:B5)` }; // Land Cost Per Unit * Total Units
        row++;

        worksheet.getCell(`A${row}`).value = "Construction Cost Per SF A/C";
        worksheet.getCell(`B${row}`).value = { formula: 'INPUT!B2' }; // Corrected formula reference
        row++;

        worksheet.getCell(`A${row}`).value = "Total Construction Cost";
        worksheet.getCell(`B${row}`).value = { formula: `B${row-1}*SUMPRODUCT(B2:B5,D2:D5)` }; // Construction Cost Per SF * Total SF
        row++;

        worksheet.getCell(`A${row}`).value = "Indirect Cost Per Unit";
        worksheet.getCell(`B${row}`).value = { formula: 'INPUT!B3' }; // Corrected formula reference
        row++;

        worksheet.getCell(`A${row}`).value = "Total Indirect Cost";
        worksheet.getCell(`B${row}`).value = { formula: `B${row-1}*SUM(B2:B5)` }; // Indirect Cost Per Unit * Total Units
        row++;

        worksheet.getCell(`A${row}`).value = "Total Development Cost";
        worksheet.getCell(`B${row}`).value = { formula: `SUM(B${row-4},B${row-2},B${row})` }; // Sum of Land, Construction, and Indirect Costs
        row++;


        // LTV and Financing Section
        row += 2; // Skip a row for spacing
        worksheet.getCell(`A${row}`).value = "Loan to Value (LTV %)";
        worksheet.getCell(`B${row}`).value = { formula: 'INPUT!B5' }; // LTV from input sheet
        row++;

        worksheet.getCell(`A${row}`).value = "Loan Amount";
        worksheet.getCell(`B${row}`).value = { formula: `B${row-1}/100*B${row-3}` }; // LTV % * Total Development Cost
        row++;

        worksheet.getCell(`A${row}`).value = "Equity Investment";
        worksheet.getCell(`B${row}`).value = { formula: `B${row-3}-B${row-1}` }; // Total Development Cost - Loan Amount
        const equityInvestmentRow = row;
        row++;

        // Calculating Total Revenue from Units
        worksheet.getCell(`A${row}`).value = "Total Revenue from Units";
        worksheet.getCell(`F${row}`).value = { formula: `SUM(F2:F5)` };
        const totalRevenueRow = row;
        row++;

        // Other Financial Inputs
        worksheet.getCell(`A${row}`).value = "Interest Rate";
        worksheet.getCell(`B${row}`).value = { formula: 'INPUT!B5' }; // Corrected formula reference
        const interestRateRow = row;
        row++;

        worksheet.getCell(`A${row}`).value = "Project Duration (Years)";
        worksheet.getCell(`B${row}`).value = { formula: 'INPUT!B6' }; // Corrected formula reference
        const projectDurationRow = row;
        row++;


        // Calculations Section
        row += 2; // Skip a row for spacing

        // Total Project Cost
        worksheet.getCell(`A${row}`).value = "Total Project Cost";
        worksheet.getCell(`B${row}`).value = { formula: `B${totalProjectCostRow}` };
        const totalProjectCostRow = row;
        row++;

        // Total Project Revenue
        worksheet.getCell(`A${row}`).value = "Total Project Revenue";
        const totalProjectRevenueRow = row;
        worksheet.getCell(`B${row}`).value = { formula: `F${totalRevenueRow}` }; // Total Revenue from Units
        row++;


        // Return on Cost Calculation
        worksheet.getCell(`A${row}`).value = "Return on Cost";
        worksheet.getCell(`B${row}`).value = { formula: `(B${totalProjectRevenueRow}-B${totalProjectCostRow})/B${totalProjectCostRow}` }; // (Total Revenue - Total Cost) / Total Cost
        const returnOnCostRow = row;
        row++;

        // IRR Calculation
        worksheet.getCell(`A${row}`).value = "IRR";
        worksheet.getCell(`B${row}`).value = { formula: `(B${totalProjectRevenueRow}-B${totalProjectCostRow})/B${equityInvestmentRow}` };
        const irrRow = row;
        row++;

        // Outputs Section
        row += 2; // Skip a row for spacing
        worksheet.getCell(`A${row}`).value = "Est. IRR";
        worksheet.getCell(`B${row}`).value = { formula: `B${irrRow}` };
        row++;
        worksheet.getCell(`A${row}`).value = "Est. Return on Cost";
        worksheet.getCell(`B${row}`).value = { formula: `B${returnOnCostRow}` };

        // Apply styling to the workbook
        styleInputsSheet(inputSheet);
        applyStyling(workbook);

        // File Format Selection and Response
        const fileFormat = req.body.fileFormat || 'xlsx'; // Default to 'xlsx' if not specified
        const fileExtension = fileFormat === 'xlsm' ? 'xlsm' : 'xlsx';

        res.setHeader('Content-Type', `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`);
        res.setHeader('Content-Disposition', `attachment; filename=Proforma.${fileExtension}`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        logger.sendLog("Error generating Excel file:", error.message);
        logger.sendLog("Stack Trace:", error.stack);
        res.status(500).send("Internal Server Error: " + error.message + "\n\nFull Details:\n" + error.stack);
    }
};

function initializeInputSheet(inputSheet, defaults) {
    // Add headers
    inputSheet.getCell('A1').value = "Proforma Input";
    inputSheet.getCell('B1').value = "Value";

    // Start adding data from the second row
    let row = 2;
    for (const [key, value] of Object.entries(defaults)) {
        inputSheet.getCell(`A${row}`).value = key;
        inputSheet.getCell(`B${row}`).value = value;
        row++;
    }
}

function applyStyling(workbook) {
    // Loop through sheets
    workbook.eachSheet((sheet, id) => {
        // Set 1st column width
        sheet.getColumn('A').width = 30;

        // Style rest of rows
        sheet.eachRow((row, rowNumber) => {
            if (rowNumber !== 1) { // Skip header row
                row.eachCell((cell) => {
                    cell.alignment = { vertical: 'middle', horizontal: 'left' };
                });
            }
        });
    });
}

// Apply advanced styling to the Workbook
function styleInputsSheet(inputSheet) {
    // Set column widths
    inputSheet.getColumn('A').width = 25; // Description column
    inputSheet.getColumn('B').width = 15; // Value column

    // Assuming the header is in the first row, start styling from the second row.
    let startRow = 3;  // Data starts from the third row (including header and a sub-header or title)
    let endRow = inputSheet.rowCount; // Adjust based on the actual number of rows

    // Apply styles to each row based on the type of data
    try {
        for (let i = startRow; i <= endRow; i++) {
            let cellFormat;
            let row = inputSheet.getRow(i);
            
            // Adjust the switch-case logic as per your requirements
            switch (i - startRow) { // Adjust the index to start from 0
                case 0:
                case 2:
                case 10:
                case 11:
                case 12:
                case 13:
                    // Currency format, no decimals
                    cellFormat = { numFmt: '$#,##0', font: { color: { argb: 'FF0000FF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } } };
                    break;
                case 3:
                case 4:
                    // Percentage format, no decimals
                    cellFormat = { numFmt: '0%', font: { color: { argb: 'FF0000FF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } } };
                    break;
                case 5:
                case 6:
                case 7:
                case 8:
                case 9:
                case 14:
                case 15:
                case 16:
                case 17:
                    // Number format, no decimals
                    cellFormat = { numFmt: '#,##0', font: { color: { argb: 'FF0000FF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } } };
                    break;
                case 1:
                    // Number format (for construction cost), no decimals
                    cellFormat = { numFmt: '#,##0', font: { color: { argb: 'FF0000FF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } } };
                    break;
                default:
                    // Default format for other rows
                    cellFormat = { numFmt: '@', font: { color: { argb: 'FF000000' } }, fill: { type: 'pattern', pattern: 'none' } };
                    break;
            }
    
            row.getCell(2).numFmt = cellFormat.numFmt;
            row.getCell(2).font = cellFormat.font;
            row.getCell(2).fill = cellFormat.fill;
        }
    } catch (error) {
        logger.sendLog("Error applying styles:", error.message);
        // Handle the error appropriately
    }
}


function getDefaults(bldgType) {
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
    return defaults[bldgType];
}