const ExcelJS = require('exceljs');
const logger = require('../logger');

module.exports = async (req, res) => {
    try {
        // Extract acreage from payload
        let acres = parseFloat(req.body.acres);
        // Validate acreage
        if (typeof acres !== 'number' || acres <= 0) {
            logger.sendLog(`Invalid acres value received: ${acres}. Setting to default value of 9.99 acres.`);
            acres = 9.99;
        }
        logger.sendLog("Generating Excel workbook for address: \n" + req.body.phy_addr1 + ", " + req.body.phy_city);

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

        // Override initial INPUT sheet values wherever possible
        // -- Comp rents, unit sizes, and % mix:
        worksheet.getCell('W1').value = "[Subject Property]";
        worksheet.getCell('W2').value = req.body.phy_addr1;
        worksheet.getCell('W3').value = req.body.phy_city;

        worksheet.getCell('W5').value = parseFloat(req.body.comps_percentages.studio)/100;
        worksheet.getCell('W6').value = parseFloat(req.body.comps_percentages.oneBd)/100;
        worksheet.getCell('W7').value = parseFloat(req.body.comps_percentages.twoBd)/100;
        worksheet.getCell('W8').value = 1 - (parseFloat(req.body.comps_percentages.studio)/100 + parseFloat(req.body.comps_percentages.oneBd)/100 + parseFloat(req.body.comps_percentages.twoBd)/100);

        worksheet.getCell('C2').value = parseFloat(req.body.comps_averages.rents.studio);
        worksheet.getCell('C3').value = parseFloat(req.body.comps_averages.rents.oneBd);
        worksheet.getCell('C4').value = parseFloat(req.body.comps_averages.rents.twoBd);
        worksheet.getCell('C5').value = parseFloat(req.body.comps_averages.rents.threeBd);
        
        worksheet.getCell('D2').value = parseFloat(req.body.comps_averages.sqfts.studio);
        worksheet.getCell('D3').value = parseFloat(req.body.comps_averages.sqfts.oneBd);
        worksheet.getCell('D4').value = parseFloat(req.body.comps_averages.sqfts.twoBd);
        worksheet.getCell('D5').value = parseFloat(req.body.comps_averages.sqfts.threeBd);
        
        worksheet.getCell('Z5').value = parseFloat(req.body.comps_averages.rentPerSqfts.studio);
        worksheet.getCell('Z6').value = parseFloat(req.body.comps_averages.rentPerSqfts.oneBd);
        worksheet.getCell('Z7').value = parseFloat(req.body.comps_averages.rentPerSqfts.twoBd);
        worksheet.getCell('Z8').value = parseFloat(req.body.comps_averages.rentPerSqfts.threeBd);
        
        
        console.log("ALL AVAILABLE DATA:", req.body);


        // Define unit types
        const unitTypes = ['Studio', '1BD', '2BD', '3BD'];

        // Set up the Inputs Section for Unit Mix on the Proforma sheet
        worksheet.getCell('A1').value = "Unit Type";
        worksheet.getCell('B1').value = "Quantity";
        worksheet.getCell('C1').value = "Average Rent";
        worksheet.getCell('D1').value = "Size (SF)";
        worksheet.getCell('E1').value = "Rent per SF";
        worksheet.getCell('F1').value = "Annual Revenue";

        let row = 2;
        unitTypes.forEach((type, index) => {
            worksheet.getCell(`A${row}`).value = type;
            worksheet.getCell(`B${row}`).value = { formula: `W${index + 5}*300` }; //{ formula: `INPUT!B${index + 2 + 6}` };
            ////worksheet.getCell(`C${row}`).value = { formula: `INPUT!B${index + 6 + 6}` };
            ////worksheet.getCell(`D${row}`).value = { formula: `INPUT!B${index + 10 + 6}` };
            worksheet.getCell(`E${row}`).value = { formula: `C${row}/D${row}` };
            worksheet.getCell(`F${row}`).value = { formula: `B${row}*C${row}*12` };
            row++;
        });

        // Add Development Cost Breakdown to Worksheet
        row += 2; // Skip a row for spacing
        worksheet.getCell(`A${row}`).value = "Land Cost Per Unit";
        worksheet.getCell(`B${row}`).value = { formula: 'INPUT!B2' };
        row++;

        worksheet.getCell(`A${row}`).value = "Total Land Cost";
        worksheet.getCell(`B${row}`).value = { formula: `B${row-1}*SUM(B2:B5)` }; // Land Cost Per Unit * Total Units
        row++;

        worksheet.getCell(`A${row}`).value = "Construction Cost Per SF A/C";
        worksheet.getCell(`B${row}`).value = { formula: 'INPUT!B3' }; // Corrected formula reference
        row++;

        worksheet.getCell(`A${row}`).value = "Total Construction Cost";
        worksheet.getCell(`B${row}`).value = { formula: `B${row-1}*SUMPRODUCT(B2:B5,D2:D5)` }; // Construction Cost Per SF * Total SF
        row++;

        worksheet.getCell(`A${row}`).value = "Indirect Cost Per Unit";
        worksheet.getCell(`B${row}`).value = { formula: 'INPUT!B4' }; // Corrected formula reference
        row++;

        worksheet.getCell(`A${row}`).value = "Total Indirect Cost";
        worksheet.getCell(`B${row}`).value = { formula: `B${row-1}*SUM(B2:B5)` }; // Indirect Cost Per Unit * Total Units
        row++;

        worksheet.getCell(`A${row}`).value = "Total Development Cost";
        worksheet.getCell(`B${row}`).value = { formula: `SUM(B${row-5},B${row-3},B${row-1})` }; // Sum of Land, Construction, and Indirect Costs
        row++;

        // LTV and Financing Section
        row += 2; // Skip a row for spacing
        worksheet.getCell(`A${row}`).value = "Loan to Value (LTV %)";
        worksheet.getCell(`B${row}`).value = { formula: 'INPUT!B5' }; // LTV from input sheet
        row++;

        worksheet.getCell(`A${row}`).value = "Loan Amount";
        worksheet.getCell(`B${row}`).value = { formula: `B${row-1}/100*B${row-4}` }; // LTV % * Total Development Cost
        row++;

        worksheet.getCell(`A${row}`).value = "Equity Investment";
        worksheet.getCell(`B${row}`).value = { formula: `B${row-5}-B${row-1}` }; // Total Development Cost - Loan Amount
        const equityInvestmentRow = row;
        row++;

        // Calculating Annual Revenue from Units
        worksheet.getCell(`A${row}`).value = "Annual Rental Revenue";
        worksheet.getCell(`B${row}`).value = { formula: `SUM(F2:F5)` };
        const annualRevenueRow = row;
        row++;

        // Other Financial Inputs
        worksheet.getCell(`A${row}`).value = "Interest Rate";
        worksheet.getCell(`B${row}`).value = { formula: 'INPUT!B6' }; // Corrected formula reference
        const interestRateRow = row;
        row++;

        worksheet.getCell(`A${row}`).value = "Project Duration (Years)";
        worksheet.getCell(`B${row}`).value = { formula: 'INPUT!B7' }; // Corrected formula reference
        const projectDurationRow = row;
        row++;

        // Calculations Section
        row += 2; // Skip a row for spacing

        // Total Project Cost
        const totalProjectCostRow = row;
        worksheet.getCell(`A${row}`).value = "Total Project Cost";
        ////worksheet.getCell(`B${row}`).value = { formula: `SUM(B${row-5},B${row-3},B${row-1})` }; // Sum of Land, Construction, and Indirect Costs
        worksheet.getCell(`B${row}`).value = { formula: `ROUND(B${row-11}, -3)` }; // Sum of Land, Construction, and Indirect Costs
        row++;

        // Total Project Revenue
        const annualProjectRevenueRow = row;
        worksheet.getCell(`A${row}`).value = "Annual Project Revenue";
        worksheet.getCell(`B${row}`).value = { formula: `B${annualRevenueRow}` }; // Annual Revenue from Units
        row++;


        // Return on Cost Calculation
        worksheet.getCell(`A${row}`).value = "Return on Cost";
        worksheet.getCell(`B${row}`).value = { formula: `(B${annualProjectRevenueRow}*0.601)/B${totalProjectCostRow}` }; // (Annual Revenue / TDC)
        const returnOnCostRow = row;
        row++;

        ////const rocValue = toString(worksheet.getCell(`B${returnOnCostRow}`).value);
        ////logger.sendLog("ROC %: " + toString(rocValue*100).toFixed(2) + "%");

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
        logger.sendLog("Error generating Excel file: " + error.message);
        logger.sendLog("Stack Trace: " + error.stack);
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

function styleInputsSheet(inputSheet) {
    // Set column widths
    inputSheet.getColumn('A').width = 25; // Description column
    inputSheet.getColumn('B').width = 15; // Value column

    // Assuming the header is in the first row, start styling from the second row.
    let startRow = 2;  // Data starts from the third row (including header and a sub-header or title)
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
        logger.sendLog("Error applying styles: " + error.message);
        // Handle the error appropriately
    }
}

function getDefaults(bldgType) {
    // Default values based on building type
    const defaults = {
        'Garden': {
            "Land Cost Per Unit": 30000,
            "Construction Cost Per SF A/C": 200,
            "Indirect Cost Per Unit": 50000,
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
            "Land Cost Per Unit": 30000,
            "Construction Cost Per SF A/C": 260,
            "Indirect Cost Per Unit": 50000,
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
            "Land Cost Per Unit": 30000,
            "Construction Cost Per SF A/C": 325,
            "Indirect Cost Per Unit": 50000,
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