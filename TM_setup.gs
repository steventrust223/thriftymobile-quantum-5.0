/**
 * ===== FILE: TM_setup.gs =====
 * 📱💰 Thrifty Mobile Quantum 5.0 - Setup & Initialization
 *
 * This file contains the onOpen trigger, menu creation,
 * sheet setup, and formatting functions.
 */

// =============================================================================
// TRIGGERS & MENU
// =============================================================================

/**
 * onOpen trigger - Creates the custom menu
 * @param {Event} e - The onOpen event
 */
function onOpen(e) {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('📱 Thrifty Mobile Quantum')
    .addItem('🔧 Setup / Refresh Structure', 'TM_createOrUpdateSheets')
    .addSeparator()
    .addItem('🔄 Run Import → Master Sync', 'TM_runFullSync')
    .addItem('📊 Run Full Analysis (All Devices)', 'TM_runFullAnalysis')
    .addItem('🏅 Rebuild Verdict Sheet', 'TM_rebuildVerdictSheet')
    .addSeparator()
    .addItem('📈 Open Dashboards', 'TM_showDashboardSidebar')
    .addItem('🎛️ Control Center', 'TM_showControlCenter')
    .addItem('⚙️ Settings', 'TM_showSettingsDialog')
    .addItem('📚 Help / Overview', 'TM_showHelpDialog')
    .addItem('💬 Smart Outreach', 'TM_showSmartOutreach')
    .addToUi();

  // Log menu creation
  TM_logEvent(TM_LOG_TYPES.SYSTEM, 'onOpen', 'Menu created successfully');
}

// =============================================================================
// MAIN SETUP FUNCTION
// =============================================================================

/**
 * Create or update all sheets with proper structure and formatting
 */
function TM_createOrUpdateSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  TM_showToast('Setting up sheets...', 'Setup', 30);
  TM_logEvent(TM_LOG_TYPES.SYSTEM, 'TM_createOrUpdateSheets', 'Starting sheet setup');

  try {
    // Create Import sheets
    TM_IMPORT_SHEETS.forEach(function(sheetName) {
      TM_setupImportSheet(ss, sheetName);
    });

    // Create Core System sheets
    TM_setupMasterDeviceDb(ss);
    TM_setupGradingEngine(ss);
    TM_setupBuybackMatch(ss);
    TM_setupMaoEngine(ss);
    TM_setupVerdictSheet(ss);

    // Create Reference sheets
    TM_setupBuybackPartnerPricing(ss);

    // Create Supporting sheets
    TM_setupLeadsTracker(ss);
    TM_setupCrmIntegration(ss);
    TM_setupSettings(ss);
    TM_setupSystemLog(ss);
    TM_setupDashboardAnalytics(ss);

    TM_logEvent(TM_LOG_TYPES.SUCCESS, 'TM_createOrUpdateSheets', 'All sheets created/updated successfully');
    TM_showToast('Setup complete! All sheets are ready.', 'Success', 5);

  } catch (error) {
    TM_logEvent(TM_LOG_TYPES.ERROR, 'TM_createOrUpdateSheets', 'Setup failed: ' + error.message);
    TM_showAlert('Setup failed: ' + error.message);
  }
}

// =============================================================================
// IMPORT SHEET SETUP
// =============================================================================

/**
 * Setup an import sheet
 * @param {Spreadsheet} ss - The spreadsheet
 * @param {string} sheetName - Name of the import sheet
 */
function TM_setupImportSheet(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  // Set headers
  TM_ensureHeaders(sheet, TM_HEADERS_IMPORT);

  // Format header
  const headerRange = sheet.getRange(1, 1, 1, TM_HEADERS_IMPORT.length);
  headerRange.setBackground(TM_COLORS.IMPORT_HEADER);
  headerRange.setFontColor(TM_COLORS.HEADER_TEXT);
  headerRange.setFontWeight('bold');

  // Set column widths
  sheet.setColumnWidth(1, 140); // Timestamp
  sheet.setColumnWidth(2, 100); // Platform
  sheet.setColumnWidth(3, 250); // Listing URL
  sheet.setColumnWidth(4, 200); // Title
  sheet.setColumnWidth(5, 100); // Asking Price
  sheet.setColumnWidth(13, 300); // Description

  // Apply alternating colors
  TM_applyAlternatingColors(sheet, TM_HEADERS_IMPORT.length);

  // Freeze header
  sheet.setFrozenRows(1);
}

// =============================================================================
// MASTER DEVICE DB SETUP
// =============================================================================

/**
 * Setup the Master Device Database sheet
 * @param {Spreadsheet} ss - The spreadsheet
 */
function TM_setupMasterDeviceDb(ss) {
  let sheet = ss.getSheetByName(TM_SHEETS.MASTER_DEVICE_DB);

  if (!sheet) {
    sheet = ss.insertSheet(TM_SHEETS.MASTER_DEVICE_DB);
  }

  // Set headers
  TM_ensureHeaders(sheet, TM_HEADERS_MASTER);

  // Format header
  const headerRange = sheet.getRange(1, 1, 1, TM_HEADERS_MASTER.length);
  headerRange.setBackground(TM_COLORS.MASTER_HEADER);
  headerRange.setFontColor(TM_COLORS.HEADER_TEXT);
  headerRange.setFontWeight('bold');

  // Set key column widths
  sheet.setColumnWidth(1, 120);  // ID
  sheet.setColumnWidth(2, 100);  // Platform
  sheet.setColumnWidth(3, 250);  // Listing URL
  sheet.setColumnWidth(5, 100);  // Brand
  sheet.setColumnWidth(6, 150);  // Model
  sheet.setColumnWidth(15, 100); // Asking Price

  // Apply alternating colors
  TM_applyAlternatingColors(sheet, TM_HEADERS_MASTER.length);

  // Add conditional formatting for Deal Class
  TM_applyDealClassFormatting(sheet);

  // Freeze header
  sheet.setFrozenRows(1);
}

// =============================================================================
// GRADING ENGINE SETUP
// =============================================================================

/**
 * Setup the Grading Engine sheet
 * @param {Spreadsheet} ss - The spreadsheet
 */
function TM_setupGradingEngine(ss) {
  let sheet = ss.getSheetByName(TM_SHEETS.GRADING_ENGINE);

  if (!sheet) {
    sheet = ss.insertSheet(TM_SHEETS.GRADING_ENGINE);
  }

  // Set headers
  TM_ensureHeaders(sheet, TM_HEADERS_GRADING);

  // Format header
  const headerRange = sheet.getRange(1, 1, 1, TM_HEADERS_GRADING.length);
  headerRange.setBackground(TM_COLORS.PRIMARY);
  headerRange.setFontColor(TM_COLORS.HEADER_TEXT);
  headerRange.setFontWeight('bold');

  // Populate default grading rules if empty
  if (sheet.getLastRow() < 2) {
    TM_populateDefaultGradingRules(sheet);
  }

  // Freeze header
  sheet.setFrozenRows(1);
}

/**
 * Populate default grading rules
 * @param {Sheet} sheet - The grading engine sheet
 */
function TM_populateDefaultGradingRules(sheet) {
  const rules = [];

  // Convert the condition mapping to sheet rows
  for (const condition in TM_CONDITION_TO_GRADE) {
    rules.push([
      condition,
      TM_CONDITION_TO_GRADE[condition],
      1,
      'Condition',
      ''
    ]);
  }

  if (rules.length > 0) {
    sheet.getRange(2, 1, rules.length, TM_HEADERS_GRADING.length).setValues(rules);
  }
}

// =============================================================================
// BUYBACK MATCH SETUP
// =============================================================================

/**
 * Setup the Buyback Match sheet
 * @param {Spreadsheet} ss - The spreadsheet
 */
function TM_setupBuybackMatch(ss) {
  let sheet = ss.getSheetByName(TM_SHEETS.BUYBACK_MATCH);

  if (!sheet) {
    sheet = ss.insertSheet(TM_SHEETS.BUYBACK_MATCH);
  }

  // Set headers
  TM_ensureHeaders(sheet, TM_HEADERS_BUYBACK_MATCH);

  // Format header
  const headerRange = sheet.getRange(1, 1, 1, TM_HEADERS_BUYBACK_MATCH.length);
  headerRange.setBackground(TM_COLORS.PRIMARY_DARK);
  headerRange.setFontColor(TM_COLORS.HEADER_TEXT);
  headerRange.setFontWeight('bold');

  // Apply alternating colors
  TM_applyAlternatingColors(sheet, TM_HEADERS_BUYBACK_MATCH.length);

  // Freeze header
  sheet.setFrozenRows(1);
}

// =============================================================================
// MAO ENGINE SETUP
// =============================================================================

/**
 * Setup the MAO Engine sheet
 * @param {Spreadsheet} ss - The spreadsheet
 */
function TM_setupMaoEngine(ss) {
  let sheet = ss.getSheetByName(TM_SHEETS.MAO_ENGINE);

  if (!sheet) {
    sheet = ss.insertSheet(TM_SHEETS.MAO_ENGINE);
  }

  // Set headers
  TM_ensureHeaders(sheet, TM_HEADERS_MAO);

  // Format header
  const headerRange = sheet.getRange(1, 1, 1, TM_HEADERS_MAO.length);
  headerRange.setBackground(TM_COLORS.PRIMARY_LIGHT);
  headerRange.setFontColor(TM_COLORS.HEADER_TEXT);
  headerRange.setFontWeight('bold');

  // Apply alternating colors
  TM_applyAlternatingColors(sheet, TM_HEADERS_MAO.length);

  // Freeze header
  sheet.setFrozenRows(1);
}

// =============================================================================
// VERDICT SHEET SETUP
// =============================================================================

/**
 * Setup the Verdict sheet
 * @param {Spreadsheet} ss - The spreadsheet
 */
function TM_setupVerdictSheet(ss) {
  let sheet = ss.getSheetByName(TM_SHEETS.VERDICT);

  if (!sheet) {
    sheet = ss.insertSheet(TM_SHEETS.VERDICT);
  }

  // Set headers
  TM_ensureHeaders(sheet, TM_HEADERS_VERDICT);

  // Format header
  const headerRange = sheet.getRange(1, 1, 1, TM_HEADERS_VERDICT.length);
  headerRange.setBackground(TM_COLORS.VERDICT_HEADER);
  headerRange.setFontColor(TM_COLORS.HEADER_TEXT);
  headerRange.setFontWeight('bold');

  // Set column widths
  sheet.setColumnWidth(1, 60);   // Rank
  sheet.setColumnWidth(2, 80);   // Deal Score
  sheet.setColumnWidth(3, 200);  // Title
  sheet.setColumnWidth(19, 250); // Listing URL
  sheet.setColumnWidth(20, 300); // Auto Seller Message

  // Apply alternating colors
  TM_applyAlternatingColors(sheet, TM_HEADERS_VERDICT.length);

  // Add conditional formatting for Deal Class
  TM_applyDealClassFormattingVerdict(sheet);

  // Freeze header
  sheet.setFrozenRows(1);
}

// =============================================================================
// BUYBACK PARTNER PRICING SETUP
// =============================================================================

/**
 * Setup the Buyback Partner Pricing reference sheet
 * @param {Spreadsheet} ss - The spreadsheet
 */
function TM_setupBuybackPartnerPricing(ss) {
  let sheet = ss.getSheetByName(TM_SHEETS.BUYBACK_PARTNER_PRICING);

  if (!sheet) {
    sheet = ss.insertSheet(TM_SHEETS.BUYBACK_PARTNER_PRICING);
  }

  // Set headers
  TM_ensureHeaders(sheet, TM_HEADERS_BUYBACK_PRICING);

  // Format header
  const headerRange = sheet.getRange(1, 1, 1, TM_HEADERS_BUYBACK_PRICING.length);
  headerRange.setBackground('#00695c');
  headerRange.setFontColor(TM_COLORS.HEADER_TEXT);
  headerRange.setFontWeight('bold');

  // Set column widths
  sheet.setColumnWidth(1, 100);  // Brand
  sheet.setColumnWidth(2, 180);  // Model
  sheet.setColumnWidth(3, 120);  // Variant
  sheet.setColumnWidth(4, 80);   // Storage

  // Apply alternating colors
  TM_applyAlternatingColors(sheet, TM_HEADERS_BUYBACK_PRICING.length);

  // Add sample data if empty
  if (sheet.getLastRow() < 2) {
    TM_addSampleBuybackPricing(sheet);
  }

  // Freeze header
  sheet.setFrozenRows(1);
}

/**
 * Add sample buyback pricing data
 * @param {Sheet} sheet - The buyback pricing sheet
 */
function TM_addSampleBuybackPricing(sheet) {
  const sampleData = [
    ['Apple', 'iPhone 15 Pro Max', '', '256GB', 850, 780, 700, 550, 400, 150, ''],
    ['Apple', 'iPhone 15 Pro Max', '', '512GB', 900, 830, 750, 600, 450, 175, ''],
    ['Apple', 'iPhone 15 Pro', '', '128GB', 700, 650, 580, 450, 320, 120, ''],
    ['Apple', 'iPhone 15 Pro', '', '256GB', 750, 700, 620, 480, 350, 130, ''],
    ['Apple', 'iPhone 15', '', '128GB', 550, 500, 450, 350, 250, 100, ''],
    ['Apple', 'iPhone 15', '', '256GB', 600, 550, 490, 380, 280, 110, ''],
    ['Apple', 'iPhone 14 Pro Max', '', '128GB', 650, 600, 540, 420, 300, 120, ''],
    ['Apple', 'iPhone 14 Pro Max', '', '256GB', 700, 650, 580, 450, 320, 130, ''],
    ['Apple', 'iPhone 14 Pro', '', '128GB', 550, 500, 450, 350, 250, 100, ''],
    ['Apple', 'iPhone 14', '', '128GB', 450, 400, 360, 280, 200, 80, ''],
    ['Apple', 'iPhone 13 Pro Max', '', '128GB', 500, 450, 400, 310, 220, 90, ''],
    ['Apple', 'iPhone 13', '', '128GB', 350, 320, 280, 220, 160, 60, ''],
    ['Samsung', 'Galaxy S24 Ultra', '', '256GB', 750, 690, 620, 480, 350, 140, ''],
    ['Samsung', 'Galaxy S24 Ultra', '', '512GB', 800, 740, 670, 520, 380, 150, ''],
    ['Samsung', 'Galaxy S24+', '', '256GB', 550, 500, 450, 350, 250, 100, ''],
    ['Samsung', 'Galaxy S24', '', '128GB', 450, 410, 370, 290, 200, 80, ''],
    ['Samsung', 'Galaxy S23 Ultra', '', '256GB', 600, 550, 490, 380, 280, 110, ''],
    ['Samsung', 'Galaxy Z Fold5', '', '256GB', 900, 830, 750, 580, 420, 170, ''],
    ['Samsung', 'Galaxy Z Flip5', '', '256GB', 500, 460, 410, 320, 230, 90, ''],
    ['Google', 'Pixel 8 Pro', '', '128GB', 500, 460, 410, 320, 230, 90, ''],
    ['Google', 'Pixel 8', '', '128GB', 400, 360, 320, 250, 180, 70, ''],
    ['Google', 'Pixel 7 Pro', '', '128GB', 350, 320, 280, 220, 160, 60, '']
  ];

  sheet.getRange(2, 1, sampleData.length, TM_HEADERS_BUYBACK_PRICING.length).setValues(sampleData);
}

// =============================================================================
// SUPPORTING SHEETS SETUP
// =============================================================================

/**
 * Setup the Leads Tracker sheet
 * @param {Spreadsheet} ss - The spreadsheet
 */
function TM_setupLeadsTracker(ss) {
  let sheet = ss.getSheetByName(TM_SHEETS.LEADS_TRACKER);

  if (!sheet) {
    sheet = ss.insertSheet(TM_SHEETS.LEADS_TRACKER);
  }

  TM_ensureHeaders(sheet, TM_HEADERS_LEADS);

  const headerRange = sheet.getRange(1, 1, 1, TM_HEADERS_LEADS.length);
  headerRange.setBackground(TM_COLORS.PRIMARY);
  headerRange.setFontColor(TM_COLORS.HEADER_TEXT);
  headerRange.setFontWeight('bold');

  TM_applyAlternatingColors(sheet, TM_HEADERS_LEADS.length);
  sheet.setFrozenRows(1);
}

/**
 * Setup the CRM Integration sheet
 * @param {Spreadsheet} ss - The spreadsheet
 */
function TM_setupCrmIntegration(ss) {
  let sheet = ss.getSheetByName(TM_SHEETS.CRM_INTEGRATION);

  if (!sheet) {
    sheet = ss.insertSheet(TM_SHEETS.CRM_INTEGRATION);
  }

  TM_ensureHeaders(sheet, TM_HEADERS_CRM);

  const headerRange = sheet.getRange(1, 1, 1, TM_HEADERS_CRM.length);
  headerRange.setBackground(TM_COLORS.LOG_HEADER);
  headerRange.setFontColor(TM_COLORS.HEADER_TEXT);
  headerRange.setFontWeight('bold');

  TM_applyAlternatingColors(sheet, TM_HEADERS_CRM.length);
  sheet.setFrozenRows(1);
}

/**
 * Setup the Settings sheet
 * @param {Spreadsheet} ss - The spreadsheet
 */
function TM_setupSettings(ss) {
  let sheet = ss.getSheetByName(TM_SHEETS.SETTINGS);

  if (!sheet) {
    sheet = ss.insertSheet(TM_SHEETS.SETTINGS);
  }

  TM_ensureHeaders(sheet, TM_HEADERS_SETTINGS);

  const headerRange = sheet.getRange(1, 1, 1, TM_HEADERS_SETTINGS.length);
  headerRange.setBackground(TM_COLORS.SETTINGS_HEADER);
  headerRange.setFontColor(TM_COLORS.HEADER_TEXT);
  headerRange.setFontWeight('bold');

  // Populate default settings if empty
  if (sheet.getLastRow() < 2) {
    sheet.getRange(2, 1, TM_DEFAULT_SETTINGS.length, TM_HEADERS_SETTINGS.length)
         .setValues(TM_DEFAULT_SETTINGS);
  }

  // Set column widths
  sheet.setColumnWidth(1, 200);  // Setting Name
  sheet.setColumnWidth(2, 150);  // Value
  sheet.setColumnWidth(3, 350);  // Description

  TM_applyAlternatingColors(sheet, TM_HEADERS_SETTINGS.length);
  sheet.setFrozenRows(1);
}

/**
 * Setup the System Log sheet
 * @param {Spreadsheet} ss - The spreadsheet
 */
function TM_setupSystemLog(ss) {
  let sheet = ss.getSheetByName(TM_SHEETS.SYSTEM_LOG);

  if (!sheet) {
    sheet = ss.insertSheet(TM_SHEETS.SYSTEM_LOG);
  }

  TM_ensureHeaders(sheet, TM_HEADERS_LOG);

  const headerRange = sheet.getRange(1, 1, 1, TM_HEADERS_LOG.length);
  headerRange.setBackground(TM_COLORS.LOG_HEADER);
  headerRange.setFontColor(TM_COLORS.HEADER_TEXT);
  headerRange.setFontWeight('bold');

  // Set column widths
  sheet.setColumnWidth(1, 160);  // Timestamp
  sheet.setColumnWidth(3, 180);  // Source
  sheet.setColumnWidth(4, 350);  // Message
  sheet.setColumnWidth(5, 300);  // Details

  sheet.setFrozenRows(1);
}

/**
 * Setup the Dashboard Analytics sheet
 * @param {Spreadsheet} ss - The spreadsheet
 */
function TM_setupDashboardAnalytics(ss) {
  let sheet = ss.getSheetByName(TM_SHEETS.DASHBOARD_ANALYTICS);

  if (!sheet) {
    sheet = ss.insertSheet(TM_SHEETS.DASHBOARD_ANALYTICS);
  }

  TM_ensureHeaders(sheet, TM_HEADERS_DASHBOARD);

  const headerRange = sheet.getRange(1, 1, 1, TM_HEADERS_DASHBOARD.length);
  headerRange.setBackground(TM_COLORS.PRIMARY);
  headerRange.setFontColor(TM_COLORS.HEADER_TEXT);
  headerRange.setFontWeight('bold');

  // Set column widths
  sheet.setColumnWidth(1, 250);  // Metric
  sheet.setColumnWidth(2, 150);  // Value

  TM_applyAlternatingColors(sheet, TM_HEADERS_DASHBOARD.length);
  sheet.setFrozenRows(1);
}

// =============================================================================
// FORMATTING HELPERS
// =============================================================================

/**
 * Apply alternating row colors to a sheet
 * @param {Sheet} sheet - The sheet to format
 * @param {number} numCols - Number of columns
 */
function TM_applyAlternatingColors(sheet, numCols) {
  // Remove existing banding
  const bandings = sheet.getBandings();
  bandings.forEach(function(banding) {
    banding.remove();
  });

  // Get data range (excluding header)
  const lastRow = Math.max(sheet.getLastRow(), 100); // At least 100 rows

  const range = sheet.getRange(2, 1, lastRow - 1, numCols);

  // Apply new banding
  range.applyRowBanding(
    SpreadsheetApp.BandingTheme.LIGHT_GREY,
    true,   // Show header
    false   // Show footer
  );
}

/**
 * Apply conditional formatting for Deal Class column
 * @param {Sheet} sheet - The sheet to format
 */
function TM_applyDealClassFormatting(sheet) {
  const headerMap = TM_getHeaderMap(sheet);
  const dealClassCol = headerMap['Deal Class'];

  if (!dealClassCol) return;

  // Clear existing conditional format rules for this column
  const rules = sheet.getConditionalFormatRules();
  const newRules = rules.filter(function(rule) {
    const ranges = rule.getRanges();
    return !ranges.some(function(range) {
      return range.getColumn() === dealClassCol;
    });
  });

  // Get range for Deal Class column
  const range = sheet.getRange(2, dealClassCol, sheet.getMaxRows() - 1, 1);

  // HOT DEAL - Green
  const hotDealRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('HOT DEAL')
    .setBackground(TM_COLORS.HOT_DEAL_BG)
    .setFontColor('#1b5e20')
    .setBold(true)
    .setRanges([range])
    .build();

  // SOLID DEAL - Blue
  const solidDealRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('SOLID DEAL')
    .setBackground(TM_COLORS.SOLID_DEAL_BG)
    .setFontColor('#0d47a1')
    .setRanges([range])
    .build();

  // MARGINAL - Orange
  const marginalRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('MARGINAL')
    .setBackground(TM_COLORS.MARGINAL_DEAL_BG)
    .setFontColor('#e65100')
    .setRanges([range])
    .build();

  // PASS - Red
  const passRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('PASS')
    .setBackground(TM_COLORS.PASS_DEAL_BG)
    .setFontColor('#b71c1c')
    .setRanges([range])
    .build();

  newRules.push(hotDealRule, solidDealRule, marginalRule, passRule);
  sheet.setConditionalFormatRules(newRules);
}

/**
 * Apply conditional formatting for Deal Class in Verdict sheet
 * @param {Sheet} sheet - The verdict sheet
 */
function TM_applyDealClassFormattingVerdict(sheet) {
  const headerMap = TM_getHeaderMap(sheet);
  const dealClassCol = headerMap['Deal Class'];

  if (!dealClassCol) return;

  // Clear existing rules
  const rules = sheet.getConditionalFormatRules();
  const newRules = [];

  // Get range for Deal Class column
  const range = sheet.getRange(2, dealClassCol, sheet.getMaxRows() - 1, 1);

  // HOT DEAL - Green
  newRules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('HOT DEAL')
    .setBackground(TM_COLORS.HOT_DEAL_BG)
    .setFontColor('#1b5e20')
    .setBold(true)
    .setRanges([range])
    .build());

  // SOLID DEAL - Blue
  newRules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('SOLID DEAL')
    .setBackground(TM_COLORS.SOLID_DEAL_BG)
    .setFontColor('#0d47a1')
    .setRanges([range])
    .build());

  // MARGINAL - Orange
  newRules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('MARGINAL')
    .setBackground(TM_COLORS.MARGINAL_DEAL_BG)
    .setFontColor('#e65100')
    .setRanges([range])
    .build());

  // PASS - Red
  newRules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('PASS')
    .setBackground(TM_COLORS.PASS_DEAL_BG)
    .setFontColor('#b71c1c')
    .setRanges([range])
    .build());

  // Also format Hot Seller column
  const hotSellerCol = headerMap['Hot Seller?'];
  if (hotSellerCol) {
    const hotSellerRange = sheet.getRange(2, hotSellerCol, sheet.getMaxRows() - 1, 1);
    newRules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('YES')
      .setBackground('#fff9c4')
      .setFontColor('#f57f17')
      .setBold(true)
      .setRanges([hotSellerRange])
      .build());
  }

  sheet.setConditionalFormatRules(newRules);
}

// =============================================================================
// ORCHESTRATION FUNCTIONS
// =============================================================================

/**
 * Main analysis orchestrator - runs all analysis steps
 */
function TM_runFullAnalysis() {
  TM_showToast('Starting full analysis...', 'Analysis', 30);
  TM_logEvent(TM_LOG_TYPES.ANALYSIS, 'TM_runFullAnalysis', 'Starting full analysis pipeline');

  try {
    // Step 1: Apply grading to all devices
    TM_showToast('Applying grades...', 'Analysis', 10);
    TM_applyGradingToAllDevices();

    // Step 2: Run buyback matching
    TM_showToast('Matching buyback prices...', 'Analysis', 10);
    TM_runBuybackMatchingForAll();

    // Step 3: Calculate MAO and profits
    TM_showToast('Calculating MAO and profits...', 'Analysis', 10);
    TM_calculateMaoForAllDevices();

    // Step 4: Detect hot sellers
    TM_showToast('Detecting hot sellers...', 'Analysis', 10);
    TM_detectHotSellers();

    // Step 5: Rebuild verdict sheet
    TM_showToast('Building verdict sheet...', 'Analysis', 10);
    TM_rebuildVerdictSheet();

    // Step 6: Update dashboard
    TM_showToast('Updating dashboard...', 'Analysis', 10);
    TM_updateDashboardAnalytics();

    TM_logEvent(TM_LOG_TYPES.SUCCESS, 'TM_runFullAnalysis', 'Full analysis completed successfully');
    TM_showToast('Analysis complete! Check VERDICT sheet for results.', 'Success', 5);

  } catch (error) {
    TM_logEvent(TM_LOG_TYPES.ERROR, 'TM_runFullAnalysis', 'Analysis failed: ' + error.message);
    TM_showAlert('Analysis failed: ' + error.message);
  }
}
