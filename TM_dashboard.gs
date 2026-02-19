/**
 * ===== FILE: TM_dashboard.gs =====
 * 📱💰 Thrifty Mobile Quantum 5.0 - Dashboard & Analytics
 *
 * This file handles populating the DASHBOARD_ANALYTICS sheet
 * with KPIs and summary statistics.
 */

// =============================================================================
// MAIN DASHBOARD UPDATE
// =============================================================================

/**
 * Update the dashboard analytics sheet
 */
function TM_updateDashboardAnalytics() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dashboardSheet = ss.getSheetByName(TM_SHEETS.DASHBOARD_ANALYTICS);

  if (!dashboardSheet) {
    TM_logEvent(TM_LOG_TYPES.WARNING, 'TM_updateDashboardAnalytics',
      'Dashboard sheet not found');
    return;
  }

  TM_logEvent(TM_LOG_TYPES.INFO, 'TM_updateDashboardAnalytics', 'Updating dashboard');

  // Gather all metrics
  const metrics = TM_gatherAllMetrics();

  // Convert to sheet data
  const dashboardData = [];
  const timestamp = new Date();

  for (const category in metrics) {
    for (const metric in metrics[category]) {
      dashboardData.push([
        metric,
        metrics[category][metric],
        'Current',
        category,
        timestamp
      ]);
    }
  }

  // Clear and populate
  TM_clearAndPopulate(dashboardSheet, TM_HEADERS_DASHBOARD, dashboardData);

  TM_logEvent(TM_LOG_TYPES.SUCCESS, 'TM_updateDashboardAnalytics',
    `Updated ${dashboardData.length} metrics`);
}

/**
 * Gather all metrics for dashboard
 * @returns {Object} Categorized metrics
 */
function TM_gatherAllMetrics() {
  const metrics = {
    'Overview': {},
    'Deal Analysis': {},
    'Financial': {},
    'Sellers': {},
    'Platforms': {},
    'Risk': {}
  };

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Get data from various sources
  const masterData = TM_getMasterData(ss);
  const verdictSummary = TM_getVerdictSummary();
  const buybackSummary = TM_getBuybackSummary();

  // Overview metrics
  metrics['Overview']['Total Devices'] = masterData.length;
  metrics['Overview']['Devices with Matches'] = buybackSummary.matched;
  metrics['Overview']['Devices without Matches'] = buybackSummary.unmatched;
  metrics['Overview']['Match Rate'] = masterData.length > 0 ?
    TM_formatPercent(buybackSummary.matched / masterData.length) : '0%';

  // Deal Analysis metrics
  metrics['Deal Analysis']['HOT DEALS'] = verdictSummary.hotDeals;
  metrics['Deal Analysis']['SOLID DEALS'] = verdictSummary.solidDeals;
  metrics['Deal Analysis']['MARGINAL'] = verdictSummary.marginal;
  metrics['Deal Analysis']['PASS'] = verdictSummary.pass;
  metrics['Deal Analysis']['Actionable Deals'] = verdictSummary.hotDeals +
    verdictSummary.solidDeals + verdictSummary.marginal;

  // Financial metrics
  metrics['Financial']['Total Potential Profit'] = TM_formatCurrency(verdictSummary.totalProfit);
  metrics['Financial']['Avg Profit per Deal'] = verdictSummary.hotDeals + verdictSummary.solidDeals > 0 ?
    TM_formatCurrency(verdictSummary.totalProfit / (verdictSummary.hotDeals + verdictSummary.solidDeals)) : '$0';
  metrics['Financial']['Total Buyback Value'] = TM_formatCurrency(buybackSummary.totalValue);
  metrics['Financial']['Avg Buyback Value'] = TM_formatCurrency(buybackSummary.avgValue);

  // Seller metrics
  const sellerStats = TM_getSellerStats(masterData);
  metrics['Sellers']['Total Sellers'] = sellerStats.totalSellers;
  metrics['Sellers']['Hot Sellers'] = sellerStats.hotSellers;
  metrics['Sellers']['Avg Deals per Seller'] = sellerStats.avgDealsPerSeller.toFixed(1);

  // Platform metrics
  const platformStats = TM_getPlatformStats(masterData);
  for (const platform in platformStats) {
    metrics['Platforms'][platform + ' Devices'] = platformStats[platform];
  }

  // Risk metrics
  const riskStats = TM_getRiskStats(masterData);
  metrics['Risk']['Low Risk Deals'] = riskStats.lowRisk;
  metrics['Risk']['Medium Risk Deals'] = riskStats.mediumRisk;
  metrics['Risk']['High Risk Deals'] = riskStats.highRisk;
  metrics['Risk']['Avg Risk Score'] = riskStats.avgRisk.toFixed(1);

  return metrics;
}

// =============================================================================
// DATA GATHERING HELPERS
// =============================================================================

/**
 * Get master device data
 * @param {Spreadsheet} ss - The spreadsheet
 * @returns {Array} Master data objects
 */
function TM_getMasterData(ss) {
  const masterSheet = ss.getSheetByName(TM_SHEETS.MASTER_DEVICE_DB);
  if (!masterSheet || masterSheet.getLastRow() < 2) {
    return [];
  }
  return TM_sheetToObjects(masterSheet);
}

/**
 * Get seller statistics
 * @param {Array} masterData - Master device data
 * @returns {Object} Seller stats
 */
function TM_getSellerStats(masterData) {
  const sellers = {};
  let hotSellers = 0;

  masterData.forEach(function(device) {
    const sellerId = TM_getSellerKey(device);
    if (sellerId) {
      if (!sellers[sellerId]) {
        sellers[sellerId] = {count: 0, isHot: false};
      }
      sellers[sellerId].count++;

      if (device['Hot Seller?'] === 'YES') {
        sellers[sellerId].isHot = true;
      }
    }
  });

  let totalDeals = 0;
  for (const sellerId in sellers) {
    totalDeals += sellers[sellerId].count;
    if (sellers[sellerId].isHot) {
      hotSellers++;
    }
  }

  const sellerCount = Object.keys(sellers).length;

  return {
    totalSellers: sellerCount,
    hotSellers: hotSellers,
    avgDealsPerSeller: sellerCount > 0 ? totalDeals / sellerCount : 0
  };
}

/**
 * Get platform statistics
 * @param {Array} masterData - Master device data
 * @returns {Object} Platform counts
 */
function TM_getPlatformStats(masterData) {
  const platforms = {};

  masterData.forEach(function(device) {
    const platform = device['Platform'] || 'Unknown';
    platforms[platform] = (platforms[platform] || 0) + 1;
  });

  return platforms;
}

/**
 * Get risk statistics
 * @param {Array} masterData - Master device data
 * @returns {Object} Risk stats
 */
function TM_getRiskStats(masterData) {
  let lowRisk = 0, mediumRisk = 0, highRisk = 0;
  let totalRisk = 0;
  let riskCount = 0;

  masterData.forEach(function(device) {
    const risk = parseInt(device['Risk Score']) || 5;

    if (risk <= TM_DEAL_THRESHOLDS.LOW_RISK) {
      lowRisk++;
    } else if (risk <= TM_DEAL_THRESHOLDS.MEDIUM_RISK) {
      mediumRisk++;
    } else {
      highRisk++;
    }

    totalRisk += risk;
    riskCount++;
  });

  return {
    lowRisk: lowRisk,
    mediumRisk: mediumRisk,
    highRisk: highRisk,
    avgRisk: riskCount > 0 ? totalRisk / riskCount : 5
  };
}

// =============================================================================
// DASHBOARD DISPLAY
// =============================================================================

/**
 * Get dashboard data for UI display
 * @returns {Object} Formatted dashboard data
 */
function TM_getDashboardDataForUi() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dashboardSheet = ss.getSheetByName(TM_SHEETS.DASHBOARD_ANALYTICS);

  if (!dashboardSheet || dashboardSheet.getLastRow() < 2) {
    return {categories: {}, lastUpdated: null};
  }

  const data = TM_sheetToObjects(dashboardSheet);
  const categories = {};

  data.forEach(function(row) {
    const category = row['Category'] || 'Other';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push({
      metric: row['Metric'],
      value: row['Value']
    });
  });

  return {
    categories: categories,
    lastUpdated: data.length > 0 ? data[0]['Last Updated'] : null
  };
}

/**
 * Get quick stats for control center
 * @returns {Object} Quick stats
 */
function TM_getQuickStats() {
  const verdict = TM_getVerdictSummary();
  const buyback = TM_getBuybackSummary();

  return {
    totalDevices: buyback.total,
    hotDeals: verdict.hotDeals,
    solidDeals: verdict.solidDeals,
    totalProfit: TM_formatCurrency(verdict.totalProfit),
    toCall: verdict.toCall,
    toText: verdict.toText,
    matchRate: buyback.total > 0 ?
      Math.round((buyback.matched / buyback.total) * 100) + '%' : '0%'
  };
}

// =============================================================================
// CHART CREATION (OPTIONAL)
// =============================================================================

/**
 * Create a deal class distribution chart
 * (Call manually if you want to add charts)
 */
function TM_createDealClassChart() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dashboardSheet = ss.getSheetByName(TM_SHEETS.DASHBOARD_ANALYTICS);

  if (!dashboardSheet) return;

  // Get deal class data
  const verdict = TM_getVerdictSummary();

  // Create a temporary data range for the chart
  const chartData = [
    ['Deal Class', 'Count'],
    ['HOT DEAL', verdict.hotDeals],
    ['SOLID DEAL', verdict.solidDeals],
    ['MARGINAL', verdict.marginal],
    ['PASS', verdict.pass]
  ];

  // Find a spot to put the chart data
  const startCol = dashboardSheet.getLastColumn() + 2;
  dashboardSheet.getRange(1, startCol, chartData.length, 2).setValues(chartData);

  // Create pie chart
  const chartBuilder = dashboardSheet.newChart()
    .setChartType(Charts.ChartType.PIE)
    .addRange(dashboardSheet.getRange(1, startCol, chartData.length, 2))
    .setPosition(5, 1, 0, 0)
    .setOption('title', 'Deal Class Distribution')
    .setOption('pieSliceText', 'percentage')
    .setOption('colors', [
      TM_COLORS.HOT_DEAL,
      TM_COLORS.SOLID_DEAL,
      TM_COLORS.MARGINAL_DEAL,
      TM_COLORS.PASS_DEAL
    ]);

  dashboardSheet.insertChart(chartBuilder.build());

  TM_logEvent(TM_LOG_TYPES.INFO, 'TM_createDealClassChart', 'Deal class chart created');
}

/**
 * Create a platform distribution chart
 */
function TM_createPlatformChart() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dashboardSheet = ss.getSheetByName(TM_SHEETS.DASHBOARD_ANALYTICS);
  const masterData = TM_getMasterData(ss);

  if (!dashboardSheet || masterData.length === 0) return;

  const platformStats = TM_getPlatformStats(masterData);

  const chartData = [['Platform', 'Count']];
  for (const platform in platformStats) {
    chartData.push([platform, platformStats[platform]]);
  }

  // Find a spot to put the chart data
  const startCol = dashboardSheet.getLastColumn() + 2;
  dashboardSheet.getRange(1, startCol, chartData.length, 2).setValues(chartData);

  // Create bar chart
  const chartBuilder = dashboardSheet.newChart()
    .setChartType(Charts.ChartType.BAR)
    .addRange(dashboardSheet.getRange(1, startCol, chartData.length, 2))
    .setPosition(5, 6, 0, 0)
    .setOption('title', 'Devices by Platform')
    .setOption('legend', {position: 'none'});

  dashboardSheet.insertChart(chartBuilder.build());

  TM_logEvent(TM_LOG_TYPES.INFO, 'TM_createPlatformChart', 'Platform chart created');
}

// =============================================================================
// REPORTING
// =============================================================================

/**
 * Generate a daily summary report
 * @returns {string} Report text
 */
function TM_generateDailySummary() {
  const verdict = TM_getVerdictSummary();
  const buyback = TM_getBuybackSummary();
  const quickStats = TM_getQuickStats();

  let report = '📱💰 Thrifty Mobile Quantum - Daily Summary\n';
  report += '=' .repeat(50) + '\n\n';

  report += '📊 OVERVIEW\n';
  report += `Total Devices: ${buyback.total}\n`;
  report += `Match Rate: ${quickStats.matchRate}\n\n`;

  report += '🎯 DEAL BREAKDOWN\n';
  report += `HOT DEALS: ${verdict.hotDeals}\n`;
  report += `SOLID DEALS: ${verdict.solidDeals}\n`;
  report += `MARGINAL: ${verdict.marginal}\n`;
  report += `PASS: ${verdict.pass}\n\n`;

  report += '💰 FINANCIAL\n';
  report += `Total Potential Profit: ${quickStats.totalProfit}\n\n`;

  report += '📞 ACTIONS NEEDED\n';
  report += `Deals to Call: ${verdict.toCall}\n`;
  report += `Deals to Text: ${verdict.toText}\n`;

  return report;
}

/**
 * Show daily summary in a dialog
 */
function TM_showDailySummaryDialog() {
  const report = TM_generateDailySummary();

  const htmlOutput = HtmlService.createHtmlOutput(
    '<pre style="font-family: monospace; font-size: 12px;">' +
    report.replace(/\n/g, '<br>') +
    '</pre>'
  )
  .setWidth(400)
  .setHeight(400);

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Daily Summary');
}

/**
 * Show dashboard sidebar
 */
function TM_showDashboardSidebar() {
  // Update analytics data first
  TM_updateDashboardAnalytics();

  // Show the dashboard sidebar
  const html = HtmlService.createHtmlOutputFromFile('tm_dashboard')
    .setTitle('Dashboard Analytics')
    .setWidth(350);

  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Update dashboard and return result for UI
 * @returns {Object} Update result with success status
 */
function TM_updateDashboardFromUi() {
  try {
    TM_updateDashboardAnalytics();
    return { success: true, message: 'Dashboard updated successfully' };
  } catch (error) {
    TM_logEvent(TM_LOG_TYPES.ERROR, 'TM_updateDashboardFromUi', 'Update failed: ' + error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Open a specific sheet by name (for UI navigation)
 * @param {string} sheetKey - Sheet key from TM_SHEETS constant or sheet name
 */
function TM_openSheet(sheetKey) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Try to get sheet name from TM_SHEETS constant, otherwise use key directly
  const sheetName = TM_SHEETS[sheetKey] || sheetKey;
  const sheet = ss.getSheetByName(sheetName);

  if (sheet) {
    SpreadsheetApp.setActiveSheet(sheet);
  } else {
    TM_showToast('Sheet "' + sheetName + '" not found', 'Error', 3);
  }
}
