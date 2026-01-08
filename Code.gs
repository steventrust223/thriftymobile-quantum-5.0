/**
 * Thrifty Mobile Quantum 5.0 - Automated Phone Buyback Analysis Engine
 * Google Apps Script Backend
 */

// ==================== CONFIGURATION ====================

const CONFIG = {
  SHEET_NAMES: {
    INVENTORY: 'Phone Inventory',
    ANALYSIS: 'Buyback Analysis',
    PRICING: 'Market Pricing',
    SETTINGS: 'Settings'
  },
  HEADERS: {
    INVENTORY: ['Phone Model', 'IMEI', 'Condition', 'Storage', 'Purchase Price', 'Date Added', 'Status', 'Notes'],
    ANALYSIS: ['Phone Model', 'Market Value', 'Purchase Price', 'Profit Margin', 'Margin %', 'Recommendation', 'Last Updated'],
    PRICING: ['Brand', 'Model', 'Storage', 'Condition', 'Market Price', 'Source', 'Last Updated'],
    SETTINGS: ['Setting', 'Value', 'Description']
  },
  CONDITIONS: ['Like New', 'Excellent', 'Good', 'Fair', 'Poor'],
  STORAGE_OPTIONS: ['64GB', '128GB', '256GB', '512GB', '1TB'],
  STATUS_OPTIONS: ['In Stock', 'Sold', 'Listed', 'Pending', 'Defective']
};

// ==================== MENU & UI ====================

/**
 * Adds custom menu on spreadsheet open
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 ThriftyMobile')
    .addItem('📊 Open Dashboard', 'showDashboard')
    .addSeparator()
    .addItem('⚡ Initialize Spreadsheet', 'initializeSpreadsheet')
    .addItem('🔄 Refresh Analysis', 'refreshAnalysis')
    .addItem('📈 Update Market Prices', 'updateMarketPrices')
    .addSeparator()
    .addItem('➕ Add New Phone', 'showAddPhoneDialog')
    .addItem('🔍 Search Inventory', 'showSearchDialog')
    .addSeparator()
    .addItem('⚙️ Settings', 'showSettings')
    .addToUi();

  // Auto-show dashboard on first open
  const props = PropertiesService.getDocumentProperties();
  if (!props.getProperty('initialized')) {
    showWelcomeDialog();
  }
}

/**
 * Shows welcome dialog with one-click setup
 */
function showWelcomeDialog() {
  const html = HtmlService.createHtmlOutputFromFile('Welcome')
    .setWidth(500)
    .setHeight(400);
  SpreadsheetApp.getUi().showModalDialog(html, '🎉 Welcome to ThriftyMobile Quantum 5.0');
}

/**
 * Shows main dashboard
 */
function showDashboard() {
  const html = HtmlService.createHtmlOutputFromFile('Dashboard')
    .setWidth(1200)
    .setHeight(800);
  SpreadsheetApp.getUi().showModalDialog(html, '📊 ThriftyMobile Dashboard');
}

/**
 * Shows add phone dialog
 */
function showAddPhoneDialog() {
  const html = HtmlService.createHtmlOutputFromFile('AddPhone')
    .setWidth(600)
    .setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(html, '➕ Add New Phone');
}

/**
 * Shows search dialog
 */
function showSearchDialog() {
  const html = HtmlService.createHtmlOutputFromFile('Search')
    .setWidth(800)
    .setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(html, '🔍 Search Inventory');
}

/**
 * Shows settings dialog
 */
function showSettings() {
  const html = HtmlService.createHtmlOutputFromFile('Settings')
    .setWidth(700)
    .setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(html, '⚙️ Settings');
}

// ==================== INITIALIZATION ====================

/**
 * One-click initialization of the entire spreadsheet
 */
function initializeSpreadsheet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ui = SpreadsheetApp.getUi();

    // Confirm initialization
    const response = ui.alert(
      'Initialize Spreadsheet',
      'This will set up all sheets with headers, formatting, and sample data. Continue?',
      ui.ButtonSet.YES_NO
    );

    if (response !== ui.Button.YES) {
      return;
    }

    // Create/update all sheets
    createOrUpdateSheet(ss, CONFIG.SHEET_NAMES.INVENTORY, CONFIG.HEADERS.INVENTORY);
    createOrUpdateSheet(ss, CONFIG.SHEET_NAMES.ANALYSIS, CONFIG.HEADERS.ANALYSIS);
    createOrUpdateSheet(ss, CONFIG.SHEET_NAMES.PRICING, CONFIG.HEADERS.PRICING);
    createOrUpdateSheet(ss, CONFIG.SHEET_NAMES.SETTINGS, CONFIG.HEADERS.SETTINGS);

    // Apply formatting
    formatInventorySheet();
    formatAnalysisSheet();
    formatPricingSheet();
    formatSettingsSheet();

    // Add sample data
    addSampleData();

    // Initialize settings
    initializeSettings();

    // Mark as initialized
    PropertiesService.getDocumentProperties().setProperty('initialized', 'true');
    PropertiesService.getDocumentProperties().setProperty('initDate', new Date().toISOString());

    ui.alert('✅ Success!', 'Spreadsheet initialized successfully!', ui.ButtonSet.OK);

    // Show dashboard
    showDashboard();

  } catch (error) {
    SpreadsheetApp.getUi().alert('Error: ' + error.toString());
  }
}

/**
 * Creates or updates a sheet with headers
 */
function createOrUpdateSheet(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  // Set headers
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);

  // Format headers - sticky, bold, colored
  headerRange
    .setBackground('#4285F4')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontSize(11)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  // Freeze header row (sticky header)
  sheet.setFrozenRows(1);

  // Auto-resize columns
  for (let i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }

  return sheet;
}

/**
 * Formats the Inventory sheet
 */
function formatInventorySheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.INVENTORY);

  if (!sheet) return;

  // Set column widths
  sheet.setColumnWidth(1, 200); // Phone Model
  sheet.setColumnWidth(2, 150); // IMEI
  sheet.setColumnWidth(3, 100); // Condition
  sheet.setColumnWidth(4, 80);  // Storage
  sheet.setColumnWidth(5, 120); // Purchase Price
  sheet.setColumnWidth(6, 110); // Date Added
  sheet.setColumnWidth(7, 100); // Status
  sheet.setColumnWidth(8, 250); // Notes

  // Add data validation for Condition (column 3)
  const conditionRange = sheet.getRange('C2:C1000');
  const conditionRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CONFIG.CONDITIONS, true)
    .build();
  conditionRange.setDataValidation(conditionRule);

  // Add data validation for Storage (column 4)
  const storageRange = sheet.getRange('D2:D1000');
  const storageRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CONFIG.STORAGE_OPTIONS, true)
    .build();
  storageRange.setDataValidation(storageRule);

  // Add data validation for Status (column 7)
  const statusRange = sheet.getRange('G2:G1000');
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CONFIG.STATUS_OPTIONS, true)
    .build();
  statusRange.setDataValidation(statusRule);

  // Format price columns as currency
  sheet.getRange('E2:E1000').setNumberFormat('$#,##0.00');

  // Format date column
  sheet.getRange('F2:F1000').setNumberFormat('yyyy-mm-dd');

  // Add alternating row colors
  sheet.getRange('A2:H1000').applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY);
}

/**
 * Formats the Analysis sheet
 */
function formatAnalysisSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ANALYSIS);

  if (!sheet) return;

  // Set column widths
  sheet.setColumnWidth(1, 200); // Phone Model
  sheet.setColumnWidth(2, 120); // Market Value
  sheet.setColumnWidth(3, 120); // Purchase Price
  sheet.setColumnWidth(4, 120); // Profit Margin
  sheet.setColumnWidth(5, 100); // Margin %
  sheet.setColumnWidth(6, 150); // Recommendation
  sheet.setColumnWidth(7, 150); // Last Updated

  // Format currency columns
  sheet.getRange('B2:D1000').setNumberFormat('$#,##0.00');

  // Format percentage column
  sheet.getRange('E2:E1000').setNumberFormat('0.0%');

  // Format date column
  sheet.getRange('G2:G1000').setNumberFormat('yyyy-mm-dd hh:mm');

  // Add conditional formatting for profit margins
  const profitRange = sheet.getRange('D2:D1000');

  // Green for positive profits
  const greenRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThan(0)
    .setBackground('#D9EAD3')
    .setRanges([profitRange])
    .build();

  // Red for negative profits
  const redRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(0)
    .setBackground('#F4CCCC')
    .setRanges([profitRange])
    .build();

  const rules = sheet.getConditionalFormatRules();
  rules.push(greenRule);
  rules.push(redRule);
  sheet.setConditionalFormatRules(rules);

  // Add alternating row colors
  sheet.getRange('A2:G1000').applyRowBanding(SpreadsheetApp.BandingTheme.CYAN);
}

/**
 * Formats the Pricing sheet
 */
function formatPricingSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PRICING);

  if (!sheet) return;

  // Set column widths
  sheet.setColumnWidth(1, 120); // Brand
  sheet.setColumnWidth(2, 200); // Model
  sheet.setColumnWidth(3, 80);  // Storage
  sheet.setColumnWidth(4, 100); // Condition
  sheet.setColumnWidth(5, 120); // Market Price
  sheet.setColumnWidth(6, 150); // Source
  sheet.setColumnWidth(7, 150); // Last Updated

  // Format price column
  sheet.getRange('E2:E1000').setNumberFormat('$#,##0.00');

  // Format date column
  sheet.getRange('G2:G1000').setNumberFormat('yyyy-mm-dd hh:mm');

  // Add alternating row colors
  sheet.getRange('A2:G1000').applyRowBanding(SpreadsheetApp.BandingTheme.GREEN);
}

/**
 * Formats the Settings sheet
 */
function formatSettingsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SETTINGS);

  if (!sheet) return;

  // Set column widths
  sheet.setColumnWidth(1, 200); // Setting
  sheet.setColumnWidth(2, 150); // Value
  sheet.setColumnWidth(3, 400); // Description

  // Add alternating row colors
  sheet.getRange('A2:C1000').applyRowBanding(SpreadsheetApp.BandingTheme.ORANGE);
}

/**
 * Adds sample data for demonstration
 */
function addSampleData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Sample inventory data
  const inventorySheet = ss.getSheetByName(CONFIG.SHEET_NAMES.INVENTORY);
  const inventoryData = [
    ['iPhone 14 Pro Max', '123456789012345', 'Excellent', '256GB', 899, new Date(), 'In Stock', 'Clean condition, minor scratches'],
    ['Samsung Galaxy S23 Ultra', '234567890123456', 'Like New', '512GB', 1099, new Date(), 'In Stock', 'Pristine condition'],
    ['iPhone 13', '345678901234567', 'Good', '128GB', 599, new Date(), 'Sold', 'Some wear on corners'],
    ['Google Pixel 7 Pro', '456789012345678', 'Excellent', '256GB', 699, new Date(), 'Listed', 'Excellent screen'],
    ['iPhone 14', '567890123456789', 'Fair', '128GB', 649, new Date(), 'In Stock', 'Screen has minor scratches']
  ];

  if (inventorySheet.getLastRow() <= 1) {
    inventorySheet.getRange(2, 1, inventoryData.length, inventoryData[0].length).setValues(inventoryData);
  }

  // Sample pricing data
  const pricingSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PRICING);
  const pricingData = [
    ['Apple', 'iPhone 14 Pro Max', '256GB', 'Excellent', 1049, 'Market Average', new Date()],
    ['Samsung', 'Galaxy S23 Ultra', '512GB', 'Like New', 1299, 'Market Average', new Date()],
    ['Apple', 'iPhone 13', '128GB', 'Good', 749, 'Market Average', new Date()],
    ['Google', 'Pixel 7 Pro', '256GB', 'Excellent', 849, 'Market Average', new Date()],
    ['Apple', 'iPhone 14', '128GB', 'Fair', 799, 'Market Average', new Date()]
  ];

  if (pricingSheet.getLastRow() <= 1) {
    pricingSheet.getRange(2, 1, pricingData.length, pricingData[0].length).setValues(pricingData);
  }
}

/**
 * Initializes default settings
 */
function initializeSettings() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SETTINGS);

  const settings = [
    ['Minimum Profit Margin %', '20%', 'Minimum acceptable profit margin percentage'],
    ['Auto-Refresh Analysis', 'Daily', 'Frequency of automatic analysis refresh'],
    ['Currency', 'USD', 'Default currency for pricing'],
    ['Business Name', 'ThriftyMobile', 'Your business name'],
    ['Price Update Source', 'Manual', 'Source for market price updates'],
    ['Low Stock Alert', '5', 'Alert when inventory falls below this number'],
    ['High Value Threshold', '1000', 'Items above this price require special handling']
  ];

  if (sheet.getLastRow() <= 1) {
    sheet.getRange(2, 1, settings.length, settings[0].length).setValues(settings);
  }
}

// ==================== DATA OPERATIONS ====================

/**
 * Adds a new phone to inventory
 */
function addPhone(phoneData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.INVENTORY);

    // Add date if not provided
    phoneData.dateAdded = phoneData.dateAdded || new Date();

    // Append to sheet
    const newRow = [
      phoneData.model,
      phoneData.imei,
      phoneData.condition,
      phoneData.storage,
      phoneData.purchasePrice,
      phoneData.dateAdded,
      phoneData.status || 'In Stock',
      phoneData.notes || ''
    ];

    sheet.appendRow(newRow);

    // Refresh analysis
    refreshAnalysis();

    return { success: true, message: 'Phone added successfully!' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Searches inventory
 */
function searchInventory(searchTerm) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.INVENTORY);

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const results = [];

  // Search all rows (skip header)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowString = row.join(' ').toLowerCase();

    if (rowString.includes(searchTerm.toLowerCase())) {
      const rowObject = {};
      headers.forEach((header, index) => {
        rowObject[header] = row[index];
      });
      rowObject.rowNumber = i + 1;
      results.push(rowObject);
    }
  }

  return results;
}

/**
 * Refreshes the buyback analysis
 */
function refreshAnalysis() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const inventorySheet = ss.getSheetByName(CONFIG.SHEET_NAMES.INVENTORY);
    const pricingSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PRICING);
    const analysisSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ANALYSIS);

    // Clear existing analysis (keep headers)
    if (analysisSheet.getLastRow() > 1) {
      analysisSheet.getRange(2, 1, analysisSheet.getLastRow() - 1, analysisSheet.getLastColumn()).clearContent();
    }

    // Get inventory and pricing data
    const inventoryData = inventorySheet.getDataRange().getValues();
    const pricingData = pricingSheet.getDataRange().getValues();

    // Create pricing lookup map
    const pricingMap = {};
    for (let i = 1; i < pricingData.length; i++) {
      const key = `${pricingData[i][1]}_${pricingData[i][2]}_${pricingData[i][3]}`;
      pricingMap[key] = pricingData[i][4];
    }

    // Analyze each inventory item
    const analysisData = [];
    for (let i = 1; i < inventoryData.length; i++) {
      const model = inventoryData[i][0];
      const storage = inventoryData[i][3];
      const condition = inventoryData[i][2];
      const purchasePrice = inventoryData[i][4];

      // Look up market value
      const key = `${model}_${storage}_${condition}`;
      const marketValue = pricingMap[key] || 0;

      const profitMargin = marketValue - purchasePrice;
      const marginPercent = purchasePrice > 0 ? profitMargin / purchasePrice : 0;

      let recommendation = '';
      if (marginPercent >= 0.3) {
        recommendation = '🟢 Excellent Deal';
      } else if (marginPercent >= 0.2) {
        recommendation = '🟡 Good Deal';
      } else if (marginPercent >= 0.1) {
        recommendation = '🟠 Fair Deal';
      } else if (marginPercent >= 0) {
        recommendation = '🔴 Low Margin';
      } else {
        recommendation = '❌ Loss';
      }

      analysisData.push([
        model,
        marketValue,
        purchasePrice,
        profitMargin,
        marginPercent,
        recommendation,
        new Date()
      ]);
    }

    // Write analysis data
    if (analysisData.length > 0) {
      analysisSheet.getRange(2, 1, analysisData.length, analysisData[0].length).setValues(analysisData);
    }

    return { success: true, message: 'Analysis refreshed successfully!' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Updates market prices (placeholder for external API integration)
 */
function updateMarketPrices() {
  SpreadsheetApp.getUi().alert(
    'Market Price Update',
    'This feature will integrate with external pricing APIs in the future. For now, please update prices manually in the Market Pricing sheet.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Gets dashboard statistics
 */
function getDashboardStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const inventorySheet = ss.getSheetByName(CONFIG.SHEET_NAMES.INVENTORY);
  const analysisSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ANALYSIS);

  const inventoryData = inventorySheet.getDataRange().getValues();
  const analysisData = analysisSheet.getDataRange().getValues();

  // Calculate statistics
  let totalInventory = inventoryData.length - 1; // Exclude header
  let inStock = 0;
  let sold = 0;
  let totalInvestment = 0;
  let totalMarketValue = 0;
  let totalProfit = 0;

  for (let i = 1; i < inventoryData.length; i++) {
    const status = inventoryData[i][6];
    const purchasePrice = inventoryData[i][4];

    if (status === 'In Stock') inStock++;
    if (status === 'Sold') sold++;

    totalInvestment += purchasePrice || 0;
  }

  for (let i = 1; i < analysisData.length; i++) {
    totalMarketValue += analysisData[i][1] || 0;
    totalProfit += analysisData[i][3] || 0;
  }

  const avgProfitMargin = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;

  return {
    totalInventory,
    inStock,
    sold,
    totalInvestment,
    totalMarketValue,
    totalProfit,
    avgProfitMargin
  };
}

/**
 * Gets recent inventory items
 */
function getRecentInventory(limit = 10) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.INVENTORY);

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const results = [];

  // Get last N items (most recent)
  const startRow = Math.max(1, data.length - limit);
  for (let i = data.length - 1; i >= startRow && results.length < limit; i--) {
    if (i > 0) { // Skip header
      const rowObject = {};
      headers.forEach((header, index) => {
        rowObject[header] = data[i][index];
      });
      results.push(rowObject);
    }
  }

  return results;
}

/**
 * Gets top profit opportunities
 */
function getTopOpportunities(limit = 5) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ANALYSIS);

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const results = [];

  // Collect all items with profit data
  for (let i = 1; i < data.length; i++) {
    const rowObject = {};
    headers.forEach((header, index) => {
      rowObject[header] = data[i][index];
    });
    results.push(rowObject);
  }

  // Sort by profit margin percentage (descending)
  results.sort((a, b) => (b['Margin %'] || 0) - (a['Margin %'] || 0));

  return results.slice(0, limit);
}

/**
 * Gets configuration options for forms
 */
function getConfig() {
  return CONFIG;
}
