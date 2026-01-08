/**
 * Thrifty Mobile Quantum 5.0 - Automated Phone Buyback Analysis Engine
 * Google Apps Script Backend
 */

// ==================== CONFIGURATION ====================

const CONFIG = {
  SHEET_NAMES: {
    LEADS: 'Lead Management',
    INVENTORY: 'Phone Inventory',
    ANALYSIS: 'Buyback Analysis',
    PRICING: 'Market Pricing',
    SETTINGS: 'Settings'
  },
  HEADERS: {
    LEADS: ['Lead ID', 'Customer Name', 'Phone', 'Email', 'Device Model', 'Storage', 'Condition', 'Estimated Value',
            'Lead Source', 'Location/Distance', 'Inquiry Date', 'First Contact Date', 'Response Time (min)',
            'Lead Score', 'Priority', 'Stage', 'Offer Amount', 'Status', 'Notes', 'Last Updated'],
    INVENTORY: ['Phone Model', 'IMEI', 'Condition', 'Storage', 'Purchase Price', 'Date Added', 'Status', 'Lead ID', 'Customer Name', 'Notes'],
    ANALYSIS: ['Phone Model', 'Market Value', 'Purchase Price', 'Profit Margin', 'Margin %', 'Recommendation', 'Last Updated'],
    PRICING: ['Brand', 'Model', 'Storage', 'Condition', 'Market Price', 'Source', 'Last Updated'],
    SETTINGS: ['Setting', 'Value', 'Description']
  },
  CONDITIONS: ['Like New', 'Excellent', 'Good', 'Fair', 'Poor'],
  STORAGE_OPTIONS: ['64GB', '128GB', '256GB', '512GB', '1TB'],
  STATUS_OPTIONS: ['In Stock', 'Sold', 'Listed', 'Pending', 'Defective'],
  LEAD_SOURCES: ['Website', 'Walk-In', 'Phone Call', 'Email', 'Referral', 'Social Media', 'Advertisement', 'Other'],
  LEAD_STAGES: ['New Inquiry', 'Contacted', 'Offer Made', 'Negotiating', 'Accepted', 'Purchased', 'Lost'],
  LEAD_STATUS: ['Active', 'Follow-Up Needed', 'Waiting Response', 'Deal Closed', 'Lost/Declined'],
  PRIORITY_LEVELS: ['🔴 Hot', '🟠 Warm', '🟡 Medium', '🔵 Cold']
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
    .addSubMenu(ui.createMenu('📞 Lead Management')
      .addItem('🎯 Lead Dashboard', 'showLeadDashboard')
      .addItem('➕ Add New Lead', 'showAddLeadDialog')
      .addItem('📋 Manage Leads', 'showManageLeadsDialog')
      .addItem('🔄 Refresh Lead Scores', 'refreshLeadScores'))
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

/**
 * Shows lead dashboard
 */
function showLeadDashboard() {
  const html = HtmlService.createHtmlOutputFromFile('LeadDashboard')
    .setWidth(1200)
    .setHeight(800);
  SpreadsheetApp.getUi().showModalDialog(html, '🎯 Lead Management Dashboard');
}

/**
 * Shows add lead dialog
 */
function showAddLeadDialog() {
  const html = HtmlService.createHtmlOutputFromFile('AddLead')
    .setWidth(700)
    .setHeight(650);
  SpreadsheetApp.getUi().showModalDialog(html, '➕ Add New Lead');
}

/**
 * Shows manage leads dialog
 */
function showManageLeadsDialog() {
  const html = HtmlService.createHtmlOutputFromFile('ManageLeads')
    .setWidth(1200)
    .setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(html, '📋 Manage Leads');
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
    createOrUpdateSheet(ss, CONFIG.SHEET_NAMES.LEADS, CONFIG.HEADERS.LEADS);
    createOrUpdateSheet(ss, CONFIG.SHEET_NAMES.INVENTORY, CONFIG.HEADERS.INVENTORY);
    createOrUpdateSheet(ss, CONFIG.SHEET_NAMES.ANALYSIS, CONFIG.HEADERS.ANALYSIS);
    createOrUpdateSheet(ss, CONFIG.SHEET_NAMES.PRICING, CONFIG.HEADERS.PRICING);
    createOrUpdateSheet(ss, CONFIG.SHEET_NAMES.SETTINGS, CONFIG.HEADERS.SETTINGS);

    // Apply formatting
    formatLeadsSheet();
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
 * Formats the Leads sheet
 */
function formatLeadsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.LEADS);

  if (!sheet) return;

  // Set column widths
  sheet.setColumnWidth(1, 100);  // Lead ID
  sheet.setColumnWidth(2, 150);  // Customer Name
  sheet.setColumnWidth(3, 120);  // Phone
  sheet.setColumnWidth(4, 180);  // Email
  sheet.setColumnWidth(5, 180);  // Device Model
  sheet.setColumnWidth(6, 80);   // Storage
  sheet.setColumnWidth(7, 100);  // Condition
  sheet.setColumnWidth(8, 120);  // Estimated Value
  sheet.setColumnWidth(9, 120);  // Lead Source
  sheet.setColumnWidth(10, 150); // Location/Distance
  sheet.setColumnWidth(11, 150); // Inquiry Date
  sheet.setColumnWidth(12, 150); // First Contact Date
  sheet.setColumnWidth(13, 130); // Response Time
  sheet.setColumnWidth(14, 100); // Lead Score
  sheet.setColumnWidth(15, 100); // Priority
  sheet.setColumnWidth(16, 120); // Stage
  sheet.setColumnWidth(17, 120); // Offer Amount
  sheet.setColumnWidth(18, 120); // Status
  sheet.setColumnWidth(19, 200); // Notes
  sheet.setColumnWidth(20, 150); // Last Updated

  // Add data validation for Storage
  const storageRange = sheet.getRange('F2:F1000');
  const storageRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CONFIG.STORAGE_OPTIONS, true)
    .build();
  storageRange.setDataValidation(storageRule);

  // Add data validation for Condition
  const conditionRange = sheet.getRange('G2:G1000');
  const conditionRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CONFIG.CONDITIONS, true)
    .build();
  conditionRange.setDataValidation(conditionRule);

  // Add data validation for Lead Source
  const sourceRange = sheet.getRange('I2:I1000');
  const sourceRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CONFIG.LEAD_SOURCES, true)
    .build();
  sourceRange.setDataValidation(sourceRule);

  // Add data validation for Priority
  const priorityRange = sheet.getRange('O2:O1000');
  const priorityRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CONFIG.PRIORITY_LEVELS, true)
    .build();
  priorityRange.setDataValidation(priorityRule);

  // Add data validation for Stage
  const stageRange = sheet.getRange('P2:P1000');
  const stageRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CONFIG.LEAD_STAGES, true)
    .build();
  stageRange.setDataValidation(stageRule);

  // Add data validation for Status
  const statusRange = sheet.getRange('R2:R1000');
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CONFIG.LEAD_STATUS, true)
    .build();
  statusRange.setDataValidation(statusRule);

  // Format currency columns
  sheet.getRange('H2:H1000').setNumberFormat('$#,##0.00'); // Estimated Value
  sheet.getRange('Q2:Q1000').setNumberFormat('$#,##0.00'); // Offer Amount

  // Format date columns
  sheet.getRange('K2:K1000').setNumberFormat('yyyy-mm-dd hh:mm'); // Inquiry Date
  sheet.getRange('L2:L1000').setNumberFormat('yyyy-mm-dd hh:mm'); // First Contact Date
  sheet.getRange('T2:T1000').setNumberFormat('yyyy-mm-dd hh:mm'); // Last Updated

  // Format Response Time as number
  sheet.getRange('M2:M1000').setNumberFormat('0');

  // Add conditional formatting for Priority
  const hotRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('🔴 Hot')
    .setBackground('#F4CCCC')
    .setFontColor('#990000')
    .setRanges([sheet.getRange('O2:O1000')])
    .build();

  const warmRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('🟠 Warm')
    .setBackground('#FCE5CD')
    .setFontColor('#B45F06')
    .setRanges([sheet.getRange('O2:O1000')])
    .build();

  const rules = sheet.getConditionalFormatRules();
  rules.push(hotRule);
  rules.push(warmRule);
  sheet.setConditionalFormatRules(rules);

  // Add alternating row colors
  sheet.getRange('A2:T1000').applyRowBanding(SpreadsheetApp.BandingTheme.BLUE);
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
  sheet.setColumnWidth(8, 100); // Lead ID
  sheet.setColumnWidth(9, 150); // Customer Name
  sheet.setColumnWidth(10, 250); // Notes

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
  sheet.getRange('A2:J1000').applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY);
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
      phoneData.leadId || '',
      phoneData.customerName || '',
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

// ==================== LEAD MANAGEMENT ====================

/**
 * Generates unique lead ID
 */
function generateLeadId() {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000);
  return `LEAD-${timestamp}-${random}`;
}

/**
 * Calculates lead score based on multiple factors
 */
function calculateLeadScore(leadData) {
  let score = 0;

  // Device value (0-40 points)
  const estimatedValue = leadData.estimatedValue || 0;
  if (estimatedValue >= 1000) score += 40;
  else if (estimatedValue >= 700) score += 30;
  else if (estimatedValue >= 400) score += 20;
  else if (estimatedValue >= 200) score += 10;

  // Condition (0-25 points)
  const conditionScores = {
    'Like New': 25,
    'Excellent': 20,
    'Good': 15,
    'Fair': 10,
    'Poor': 5
  };
  score += conditionScores[leadData.condition] || 0;

  // Lead source (0-15 points) - higher value sources
  const sourceScores = {
    'Referral': 15,
    'Website': 12,
    'Walk-In': 10,
    'Social Media': 8,
    'Phone Call': 8,
    'Email': 7,
    'Advertisement': 5,
    'Other': 3
  };
  score += sourceScores[leadData.leadSource] || 0;

  // Distance/Location (0-10 points) - closer is better
  if (leadData.distance) {
    const distance = parseFloat(leadData.distance);
    if (distance <= 5) score += 10;
    else if (distance <= 15) score += 7;
    else if (distance <= 30) score += 4;
    else if (distance <= 50) score += 2;
  } else if (leadData.location && leadData.location.toLowerCase().includes('local')) {
    score += 10;
  } else if (leadData.location) {
    score += 5;
  }

  // Urgency/Recency (0-10 points)
  const inquiryDate = new Date(leadData.inquiryDate);
  const now = new Date();
  const hoursSinceInquiry = (now - inquiryDate) / (1000 * 60 * 60);
  if (hoursSinceInquiry <= 1) score += 10;
  else if (hoursSinceInquiry <= 4) score += 8;
  else if (hoursSinceInquiry <= 24) score += 5;
  else if (hoursSinceInquiry <= 48) score += 2;

  return Math.min(100, score); // Cap at 100
}

/**
 * Determines priority level based on score
 */
function getPriorityLevel(score) {
  if (score >= 80) return '🔴 Hot';
  if (score >= 60) return '🟠 Warm';
  if (score >= 40) return '🟡 Medium';
  return '🔵 Cold';
}

/**
 * Calculates response time in minutes
 */
function calculateResponseTime(inquiryDate, firstContactDate) {
  if (!firstContactDate || !inquiryDate) return null;

  const inquiry = new Date(inquiryDate);
  const contact = new Date(firstContactDate);
  const diffMs = contact - inquiry;
  return Math.round(diffMs / (1000 * 60)); // Convert to minutes
}

/**
 * Adds a new lead to the system
 */
function addLead(leadData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.LEADS);

    // Generate lead ID
    const leadId = generateLeadId();

    // Set inquiry date if not provided
    const inquiryDate = leadData.inquiryDate || new Date();

    // Calculate lead score
    const leadScore = calculateLeadScore({
      ...leadData,
      inquiryDate
    });

    // Determine priority
    const priority = getPriorityLevel(leadScore);

    // Calculate response time if first contact date provided
    const responseTime = leadData.firstContactDate ?
      calculateResponseTime(inquiryDate, leadData.firstContactDate) : null;

    // Prepare row data
    const newRow = [
      leadId,
      leadData.customerName || '',
      leadData.phone || '',
      leadData.email || '',
      leadData.deviceModel || '',
      leadData.storage || '',
      leadData.condition || '',
      leadData.estimatedValue || 0,
      leadData.leadSource || '',
      leadData.location || '',
      inquiryDate,
      leadData.firstContactDate || '',
      responseTime,
      leadScore,
      priority,
      leadData.stage || 'New Inquiry',
      leadData.offerAmount || '',
      leadData.status || 'Active',
      leadData.notes || '',
      new Date()
    ];

    sheet.appendRow(newRow);

    return {
      success: true,
      message: 'Lead added successfully!',
      leadId: leadId,
      score: leadScore,
      priority: priority
    };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Updates a lead's information
 */
function updateLead(leadId, updates) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.LEADS);

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // Find the lead row
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === leadId) {
        // Update specified columns
        Object.keys(updates).forEach(key => {
          const columnIndex = headers.indexOf(key);
          if (columnIndex !== -1) {
            sheet.getRange(i + 1, columnIndex + 1).setValue(updates[key]);
          }
        });

        // Update Last Updated column
        const lastUpdatedIndex = headers.indexOf('Last Updated');
        if (lastUpdatedIndex !== -1) {
          sheet.getRange(i + 1, lastUpdatedIndex + 1).setValue(new Date());
        }

        // Recalculate score if relevant fields changed
        if (updates['First Contact Date']) {
          const inquiryDate = data[i][headers.indexOf('Inquiry Date')];
          const responseTime = calculateResponseTime(inquiryDate, updates['First Contact Date']);
          const responseTimeIndex = headers.indexOf('Response Time (min)');
          sheet.getRange(i + 1, responseTimeIndex + 1).setValue(responseTime);
        }

        return { success: true, message: 'Lead updated successfully!' };
      }
    }

    return { success: false, message: 'Lead not found!' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Refreshes all lead scores
 */
function refreshLeadScores() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.LEADS);

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    let updated = 0;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const leadData = {
        estimatedValue: row[headers.indexOf('Estimated Value')],
        condition: row[headers.indexOf('Condition')],
        leadSource: row[headers.indexOf('Lead Source')],
        location: row[headers.indexOf('Location/Distance')],
        inquiryDate: row[headers.indexOf('Inquiry Date')]
      };

      // Recalculate score
      const newScore = calculateLeadScore(leadData);
      const newPriority = getPriorityLevel(newScore);

      // Update score and priority
      sheet.getRange(i + 1, headers.indexOf('Lead Score') + 1).setValue(newScore);
      sheet.getRange(i + 1, headers.indexOf('Priority') + 1).setValue(newPriority);

      updated++;
    }

    SpreadsheetApp.getUi().alert(`✅ Refreshed ${updated} lead scores!`);
    return { success: true, count: updated };
  } catch (error) {
    SpreadsheetApp.getUi().alert('Error: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * Gets lead management statistics
 */
function getLeadStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.LEADS);

  if (!sheet || sheet.getLastRow() <= 1) {
    return {
      totalLeads: 0,
      activeLeads: 0,
      hotLeads: 0,
      avgResponseTime: 0,
      conversionRate: 0,
      totalEstimatedValue: 0,
      leadsToday: 0,
      avgLeadScore: 0
    };
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  let totalLeads = data.length - 1;
  let activeLeads = 0;
  let hotLeads = 0;
  let totalResponseTime = 0;
  let responseTimeCount = 0;
  let purchased = 0;
  let totalEstimatedValue = 0;
  let leadsToday = 0;
  let totalScore = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const status = row[headers.indexOf('Status')];
    const priority = row[headers.indexOf('Priority')];
    const responseTime = row[headers.indexOf('Response Time (min)')];
    const stage = row[headers.indexOf('Stage')];
    const estimatedValue = row[headers.indexOf('Estimated Value')] || 0;
    const inquiryDate = new Date(row[headers.indexOf('Inquiry Date')]);
    const leadScore = row[headers.indexOf('Lead Score')] || 0;

    if (status === 'Active' || status === 'Follow-Up Needed' || status === 'Waiting Response') {
      activeLeads++;
    }

    if (priority === '🔴 Hot') {
      hotLeads++;
    }

    if (responseTime && responseTime > 0) {
      totalResponseTime += responseTime;
      responseTimeCount++;
    }

    if (stage === 'Purchased') {
      purchased++;
    }

    totalEstimatedValue += estimatedValue;

    inquiryDate.setHours(0, 0, 0, 0);
    if (inquiryDate.getTime() === today.getTime()) {
      leadsToday++;
    }

    totalScore += leadScore;
  }

  const avgResponseTime = responseTimeCount > 0 ? Math.round(totalResponseTime / responseTimeCount) : 0;
  const conversionRate = totalLeads > 0 ? (purchased / totalLeads) * 100 : 0;
  const avgLeadScore = totalLeads > 0 ? Math.round(totalScore / totalLeads) : 0;

  return {
    totalLeads,
    activeLeads,
    hotLeads,
    avgResponseTime,
    conversionRate,
    totalEstimatedValue,
    leadsToday,
    avgLeadScore
  };
}

/**
 * Gets hot leads (high priority, not contacted yet)
 */
function getHotLeads(limit = 10) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.LEADS);

  if (!sheet || sheet.getLastRow() <= 1) {
    return [];
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const results = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const status = row[headers.indexOf('Status')];
    const stage = row[headers.indexOf('Stage')];

    // Only include active leads that haven't been purchased or lost
    if ((status === 'Active' || status === 'Follow-Up Needed') &&
        stage !== 'Purchased' && stage !== 'Lost') {
      const rowObject = {};
      headers.forEach((header, index) => {
        rowObject[header] = row[index];
      });
      rowObject.rowNumber = i + 1;
      results.push(rowObject);
    }
  }

  // Sort by lead score (descending)
  results.sort((a, b) => (b['Lead Score'] || 0) - (a['Lead Score'] || 0));

  return results.slice(0, limit);
}

/**
 * Gets leads by stage
 */
function getLeadsByStage(stage) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.LEADS);

  if (!sheet || sheet.getLastRow() <= 1) {
    return [];
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const results = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[headers.indexOf('Stage')] === stage) {
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
 * Gets all leads with optional filtering
 */
function getAllLeads(filterStatus = null) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.LEADS);

  if (!sheet || sheet.getLastRow() <= 1) {
    return [];
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const results = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    if (filterStatus && row[headers.indexOf('Status')] !== filterStatus) {
      continue;
    }

    const rowObject = {};
    headers.forEach((header, index) => {
      rowObject[header] = row[index];
    });
    rowObject.rowNumber = i + 1;
    results.push(rowObject);
  }

  // Sort by inquiry date (newest first)
  results.sort((a, b) => new Date(b['Inquiry Date']) - new Date(a['Inquiry Date']));

  return results;
}

/**
 * Converts lead to inventory purchase
 */
function convertLeadToSale(leadId, purchaseData) {
  try {
    // Add phone to inventory
    const phoneResult = addPhone({
      model: purchaseData.model,
      imei: purchaseData.imei,
      condition: purchaseData.condition,
      storage: purchaseData.storage,
      purchasePrice: purchaseData.purchasePrice,
      status: 'In Stock',
      leadId: leadId,
      customerName: purchaseData.customerName,
      notes: purchaseData.notes
    });

    if (!phoneResult.success) {
      return phoneResult;
    }

    // Update lead status
    updateLead(leadId, {
      'Stage': 'Purchased',
      'Status': 'Deal Closed',
      'Offer Amount': purchaseData.purchasePrice
    });

    return { success: true, message: 'Lead converted to sale successfully!' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}
