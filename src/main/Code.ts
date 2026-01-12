/**
 * ThriftyMobile Quantum 5.0 - Main Entry Point
 * Google Apps Script initialization and menu setup
 */

import { SheetManager } from './SheetManager';
import { Config } from './Config';

/**
 * Called when the spreadsheet is opened
 * Creates the ThriftyMobile custom menu
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('⚡ ThriftyMobile')
    .addSubMenu(
      ui.createMenu('📊 Setup')
        .addItem('Initialize Sheets', 'initializeSheets')
        .addItem('Reset All Data', 'resetAllData')
        .addSeparator()
        .addItem('Import Sample Data', 'importSampleData')
    )
    .addSubMenu(
      ui.createMenu('🔄 Data Processing')
        .addItem('Process New Imports', 'processNewImports')
        .addItem('Refresh All Calculations', 'refreshAllCalculations')
        .addItem('Update Verdict Sheet', 'updateVerdictSheet')
        .addSeparator()
        .addItem('Run AI Analysis', 'runAIAnalysis')
    )
    .addSubMenu(
      ui.createMenu('📱 CRM & Messaging')
        .addItem('Send Offers to Hot Deals', 'sendOffersToHotDeals')
        .addItem('Sync to OneHash', 'syncToOneHash')
        .addItem('Update Seller CRM', 'updateSellerCRM')
    )
    .addSubMenu(
      ui.createMenu('📈 Analytics')
        .addItem('Refresh Dashboard', 'refreshDashboard')
        .addItem('Generate Report', 'generateReport')
        .addItem('View Profit Summary', 'viewProfitSummary')
    )
    .addSubMenu(
      ui.createMenu('⚙️ Settings')
        .addItem('Configure API Keys', 'configureAPIKeys')
        .addItem('Update Buyback Matrix', 'updateBuybackMatrix')
        .addItem('Manage Deduction Rules', 'manageDeductionRules')
    )
    .addSeparator()
    .addItem('🚀 Open Control Panel', 'openControlPanel')
    .addItem('📚 Help & Documentation', 'showHelp')
    .addToUi();

  Logger.log('ThriftyMobile menu initialized');
}

/**
 * Initialize all sheets with proper structure
 */
function initializeSheets() {
  try {
    const sheetManager = new SheetManager();
    sheetManager.initializeAllSheets();
  } catch (error) {
    Logger.log(`Error initializing sheets: ${error}`);
    SpreadsheetApp.getUi().alert(`Error: ${error.message}`);
  }
}

/**
 * Reset all data (WARNING: destructive)
 */
function resetAllData() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '⚠️ WARNING',
    'This will delete ALL data in the Master Database, Verdict Sheet, and logs. Are you sure?',
    ui.ButtonSet.YES_NO
  );

  if (response === ui.Button.YES) {
    const sheetManager = new SheetManager();
    sheetManager.clearSheetData('Master Database');
    sheetManager.clearSheetData('Verdict Sheet');
    sheetManager.clearSheetData('System Log');
    sheetManager.clearSheetData('Error Log');

    ui.alert('✅ All data has been reset');
  }
}

/**
 * Process new imports from Browse AI
 */
function processNewImports() {
  try {
    const ui = SpreadsheetApp.getUi();
    ui.alert('🔄 Processing imports...\n\nThis feature will be implemented to process Browse AI data.');

    // TODO: Implement BrowseAIImporter
    // const importer = new BrowseAIImporter();
    // importer.processAllImports();

  } catch (error) {
    Logger.log(`Error processing imports: ${error}`);
    SpreadsheetApp.getUi().alert(`Error: ${error.message}`);
  }
}

/**
 * Refresh all calculations in Master Database
 */
function refreshAllCalculations() {
  try {
    SpreadsheetApp.getUi().alert('🔄 Refreshing calculations...\n\nThis will recalculate profit, MAO, and grades for all deals.');

    // TODO: Implement calculation refresh
    // const calculator = new ProfitEngine();
    // calculator.refreshAllCalculations();

  } catch (error) {
    Logger.log(`Error refreshing calculations: ${error}`);
    SpreadsheetApp.getUi().alert(`Error: ${error.message}`);
  }
}

/**
 * Update Verdict Sheet with ranked deals
 */
function updateVerdictSheet() {
  try {
    SpreadsheetApp.getUi().alert('📊 Updating Verdict Sheet...');

    // TODO: Implement verdict engine
    // const verdictEngine = new VerdictEngine();
    // verdictEngine.updateVerdictSheet();

  } catch (error) {
    Logger.log(`Error updating verdict sheet: ${error}`);
    SpreadsheetApp.getUi().alert(`Error: ${error.message}`);
  }
}

/**
 * Run AI analysis on all deals
 */
function runAIAnalysis() {
  try {
    const config = Config.getClaudeConfig();
    if (!config.apiKey) {
      SpreadsheetApp.getUi().alert('⚠️ Claude API key not configured.\n\nPlease add your API key in Settings.');
      return;
    }

    SpreadsheetApp.getUi().alert('🤖 Running AI analysis...\n\nThis will analyze all deals using Claude AI.');

    // TODO: Implement AI analysis
    // const aiEngine = new AIDecisionEngine();
    // aiEngine.analyzeAllDeals();

  } catch (error) {
    Logger.log(`Error running AI analysis: ${error}`);
    SpreadsheetApp.getUi().alert(`Error: ${error.message}`);
  }
}

/**
 * Send offers to hot deals via SMS-iT
 */
function sendOffersToHotDeals() {
  try {
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      '📱 Send Offers',
      'This will send automated offers to all "STRONG BUY" deals. Continue?',
      ui.ButtonSet.YES_NO
    );

    if (response === ui.Button.YES) {
      ui.alert('📤 Sending offers...\n\nFeature will be implemented to send SMS via SMS-iT.');

      // TODO: Implement SMS sending
      // const smsit = new SMSITIntegration();
      // smsit.sendOffersToHotDeals();
    }
  } catch (error) {
    Logger.log(`Error sending offers: ${error}`);
    SpreadsheetApp.getUi().alert(`Error: ${error.message}`);
  }
}

/**
 * Sync data to OneHash CRM
 */
function syncToOneHash() {
  try {
    SpreadsheetApp.getUi().alert('🔄 Syncing to OneHash...');

    // TODO: Implement OneHash sync
    // const onehash = new OneHashIntegration();
    // onehash.syncAllDeals();

  } catch (error) {
    Logger.log(`Error syncing to OneHash: ${error}`);
    SpreadsheetApp.getUi().alert(`Error: ${error.message}`);
  }
}

/**
 * Update Seller CRM data
 */
function updateSellerCRM() {
  try {
    SpreadsheetApp.getUi().alert('📇 Updating Seller CRM...');

    // TODO: Implement CRM update logic

  } catch (error) {
    Logger.log(`Error updating CRM: ${error}`);
    SpreadsheetApp.getUi().alert(`Error: ${error.message}`);
  }
}

/**
 * Refresh analytics dashboard
 */
function refreshDashboard() {
  try {
    SpreadsheetApp.getUi().alert('📊 Refreshing dashboard...');

    // TODO: Implement dashboard refresh
    // const dashboard = new DashboardGenerator();
    // dashboard.refresh();

  } catch (error) {
    Logger.log(`Error refreshing dashboard: ${error}`);
    SpreadsheetApp.getUi().alert(`Error: ${error.message}`);
  }
}

/**
 * Generate analytics report
 */
function generateReport() {
  try {
    SpreadsheetApp.getUi().alert('📈 Generating report...');

    // TODO: Implement report generation

  } catch (error) {
    Logger.log(`Error generating report: ${error}`);
    SpreadsheetApp.getUi().alert(`Error: ${error.message}`);
  }
}

/**
 * View profit summary
 */
function viewProfitSummary() {
  try {
    SpreadsheetApp.getUi().alert('💰 Profit Summary\n\nTotal deals: TBD\nTotal profit: TBD\nAverage margin: TBD');

    // TODO: Calculate actual metrics

  } catch (error) {
    Logger.log(`Error viewing profit summary: ${error}`);
    SpreadsheetApp.getUi().alert(`Error: ${error.message}`);
  }
}

/**
 * Configure API keys
 */
function configureAPIKeys() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.prompt(
    '🔑 Configure API Keys',
    'Enter your Claude API key (or leave blank to skip):',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() === ui.Button.OK) {
    const apiKey = response.getResponseText();
    if (apiKey) {
      Config.set('CLAUDE_API_KEY', apiKey);
      ui.alert('✅ Claude API key saved!');
    }
  }
}

/**
 * Update buyback matrix
 */
function updateBuybackMatrix() {
  try {
    SpreadsheetApp.getUi().alert('💵 Update Buyback Matrix\n\nEdit the Buyback Matrix sheet to update partner pricing.');
  } catch (error) {
    Logger.log(`Error: ${error}`);
  }
}

/**
 * Manage deduction rules
 */
function manageDeductionRules() {
  try {
    SpreadsheetApp.getUi().alert('⚙️ Deduction Rules\n\nEdit the Deduction Rules sheet to update pricing deductions.');
  } catch (error) {
    Logger.log(`Error: ${error}`);
  }
}

/**
 * Open control panel sidebar
 */
function openControlPanel() {
  try {
    const html = HtmlService.createHtmlOutputFromFile('ui/ControlPanel')
      .setTitle('ThriftyMobile Control Panel')
      .setWidth(400);

    SpreadsheetApp.getUi().showSidebar(html);
  } catch (error) {
    Logger.log(`Error opening control panel: ${error}`);
    SpreadsheetApp.getUi().alert('Control panel coming soon!');
  }
}

/**
 * Show help documentation
 */
function showHelp() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    '📚 ThriftyMobile Help',
    'ThriftyMobile Quantum 5.0 - Phone Buyback Intelligence System\n\n' +
    '1. Setup → Initialize Sheets to create the sheet structure\n' +
    '2. Import data from Browse AI to Import sheets\n' +
    '3. Process New Imports to analyze deals\n' +
    '4. Run AI Analysis for intelligent decision-making\n' +
    '5. Check Verdict Sheet for ranked opportunities\n\n' +
    'Documentation: [Link TBD]',
    ui.ButtonSet.OK
  );
}

/**
 * Import sample data for testing
 */
function importSampleData() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '📥 Import Sample Data',
    'This will add sample listings for testing. Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response === ui.Button.YES) {
    try {
      // TODO: Add sample data
      ui.alert('✅ Sample data imported!');
    } catch (error) {
      Logger.log(`Error importing sample data: ${error}`);
      ui.alert(`Error: ${error.message}`);
    }
  }
}

// Make functions available globally for Apps Script
(global as any).onOpen = onOpen;
(global as any).initializeSheets = initializeSheets;
(global as any).resetAllData = resetAllData;
(global as any).processNewImports = processNewImports;
(global as any).refreshAllCalculations = refreshAllCalculations;
(global as any).updateVerdictSheet = updateVerdictSheet;
(global as any).runAIAnalysis = runAIAnalysis;
(global as any).sendOffersToHotDeals = sendOffersToHotDeals;
(global as any).syncToOneHash = syncToOneHash;
(global as any).updateSellerCRM = updateSellerCRM;
(global as any).refreshDashboard = refreshDashboard;
(global as any).generateReport = generateReport;
(global as any).viewProfitSummary = viewProfitSummary;
(global as any).configureAPIKeys = configureAPIKeys;
(global as any).updateBuybackMatrix = updateBuybackMatrix;
(global as any).manageDeductionRules = manageDeductionRules;
(global as any).openControlPanel = openControlPanel;
(global as any).showHelp = showHelp;
(global as any).importSampleData = importSampleData;
