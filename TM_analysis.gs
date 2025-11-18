/**
 * ===== FILE: TM_analysis.gs =====
 * 📱💰 Thrifty Mobile Quantum 5.0 - Analysis Engine
 *
 * This file handles MAO calculations, profit analysis,
 * risk scoring, hot seller detection, and market advantage.
 */

// =============================================================================
// MAIN MAO CALCULATION
// =============================================================================

/**
 * Calculate MAO and profits for all devices in MASTER_DEVICE_DB
 */
function TM_calculateMaoForAllDevices() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(TM_SHEETS.MASTER_DEVICE_DB);

  if (!masterSheet || masterSheet.getLastRow() < 2) {
    TM_logEvent(TM_LOG_TYPES.INFO, 'TM_calculateMaoForAllDevices', 'No devices to analyze');
    return;
  }

  TM_logEvent(TM_LOG_TYPES.ANALYSIS, 'TM_calculateMaoForAllDevices', 'Starting MAO calculations');

  const headerMap = TM_getHeaderMap(masterSheet);
  const data = TM_sheetToObjects(masterSheet);
  const settings = TM_getSettingsMap();

  // Process each device
  data.forEach(function(device) {
    const analysis = TM_analyzeDevice(device, settings);

    // Update device with analysis results
    device['MAO'] = analysis.mao;
    device['Offer Target'] = analysis.offerTarget;
    device['Expected Profit'] = analysis.expectedProfit;
    device['Profit Margin %'] = analysis.profitMarginPercent;
    device['Risk Score'] = analysis.riskScore;
    device['Deal Class'] = analysis.dealClass;
    device['Market Advantage Score'] = analysis.marketAdvantage;
    device['Estimated Resale Value'] = analysis.estimatedResale;
  });

  // Write results back to sheet
  TM_updateMasterWithAnalysis(masterSheet, data, headerMap);

  // Log to MAO_ENGINE sheet
  TM_logMaoCalculations(ss, data);

  TM_logEvent(TM_LOG_TYPES.SUCCESS, 'TM_calculateMaoForAllDevices',
    `Analyzed ${data.length} devices`);
}

/**
 * Analyze a single device
 * @param {Object} device - Device data
 * @param {Object} settings - Settings map
 * @returns {Object} Analysis results
 */
function TM_analyzeDevice(device, settings) {
  const result = {
    mao: 0,
    offerTarget: 0,
    expectedProfit: 0,
    profitMarginPercent: 0,
    riskScore: 5,
    dealClass: 'PASS',
    marketAdvantage: 0,
    estimatedResale: 0
  };

  const askingPrice = TM_parsePrice(device['Asking Price']);
  const buybackValue = TM_parsePrice(device['Matched Buyback Value']);

  // If no buyback value or blacklisted, return defaults
  if (buybackValue === 0 || device['Final Grade'] === 'BLACKLISTED') {
    result.dealClass = 'PASS';
    result.riskScore = 10;
    return result;
  }

  // Get parameters from settings
  const targetMargin = parseFloat(settings['TARGET_PROFIT_MARGIN']) || TM_MAO_PARAMS.DEFAULT_TARGET_MARGIN;
  const minMargin = parseFloat(settings['MIN_PROFIT_MARGIN']) || TM_MAO_PARAMS.MIN_ACCEPTABLE_MARGIN;
  const minProfit = parseFloat(settings['MIN_PROFIT_AMOUNT']) || 25;
  const offerRatio = parseFloat(settings['OFFER_TO_MAO_RATIO']) || TM_MAO_PARAMS.OFFER_TO_MAO_RATIO;

  // Calculate risk score
  result.riskScore = TM_calculateRiskScore(device);

  // Calculate market advantage
  result.marketAdvantage = TM_calculateMarketAdvantage(askingPrice, buybackValue);

  // Calculate estimated resale (slightly above buyback for direct sales)
  result.estimatedResale = buybackValue * 1.1;

  // Calculate MAO (Maximum Allowable Offer)
  // MAO = Buyback Value * (1 - Target Margin) adjusted for risk
  let mao = buybackValue * (1 - targetMargin);

  // Adjust MAO for risk
  if (result.riskScore <= TM_DEAL_THRESHOLDS.LOW_RISK) {
    mao *= TM_MAO_PARAMS.LOW_RISK_MULTIPLIER;
  } else if (result.riskScore >= TM_DEAL_THRESHOLDS.HIGH_RISK) {
    mao *= TM_MAO_PARAMS.HIGH_RISK_MULTIPLIER;
  }

  // Apply hot seller bonus
  if (device['Hot Seller?'] === 'YES') {
    mao *= (1 + TM_MAO_PARAMS.HOT_SELLER_BONUS);
  }

  // Apply market advantage bonus
  if (result.marketAdvantage >= TM_MAO_PARAMS.MARKET_ADV_BONUS_THRESHOLD) {
    mao *= (1 + TM_MAO_PARAMS.MARKET_ADV_BONUS);
  }

  result.mao = Math.round(mao);

  // Calculate offer target (what we actually send first)
  result.offerTarget = Math.round(mao * offerRatio);

  // Make sure offer doesn't exceed asking price (but can be close)
  if (result.offerTarget > askingPrice * 0.95) {
    result.offerTarget = Math.round(askingPrice * 0.90);
  }

  // Calculate expected profit (if we buy at offer target)
  result.expectedProfit = buybackValue - result.offerTarget;

  // Calculate profit margin
  if (buybackValue > 0) {
    result.profitMarginPercent = result.expectedProfit / buybackValue;
  }

  // Determine deal class
  result.dealClass = TM_classifyDeal(result.expectedProfit, result.profitMarginPercent, result.riskScore);

  return result;
}

// =============================================================================
// RISK SCORING
// =============================================================================

/**
 * Calculate risk score for a device (1-10, lower is better)
 * @param {Object} device - Device data
 * @returns {number} Risk score
 */
function TM_calculateRiskScore(device) {
  let riskScore = 5; // Start at neutral

  // Grade-based risk
  const grade = device['Final Grade'] || 'B';
  const gradeRisk = {
    'A': -2,
    'B+': -1,
    'B': 0,
    'C': 1,
    'D': 2,
    'DOA': 3
  };
  riskScore += gradeRisk[grade] || 0;

  // Deductions increase risk
  if (device['Applied Deductions']) {
    const deductionCount = (device['Applied Deductions'].match(/;/g) || []).length + 1;
    riskScore += Math.min(deductionCount, 2);
  }

  // Device flags increase risk
  if (device['Device Flags']) {
    const flagCount = (device['Device Flags'].match(/,/g) || []).length + 1;
    riskScore += Math.min(flagCount * 0.5, 2);
  }

  // Unknown carrier adds risk
  if (device['Carrier'] === 'Unknown') {
    riskScore += 1;
  }

  // Cricket carrier adds risk
  if ((device['Carrier'] || '').toLowerCase().includes('cricket')) {
    riskScore += 1;
  }

  // No match (low buyback value) is risky
  const buybackValue = TM_parsePrice(device['Matched Buyback Value']);
  if (buybackValue === 0) {
    riskScore += 3;
  }

  // Seller history can reduce risk (hot seller)
  if (device['Hot Seller?'] === 'YES') {
    riskScore -= 1;
  }

  // Distance can add risk
  const distance = parseFloat(device['Distance (mi)']) || 0;
  if (distance > TM_DEAL_THRESHOLDS.MAX_DISTANCE) {
    riskScore += 2;
  } else if (distance > TM_DEAL_THRESHOLDS.REGIONAL_DISTANCE) {
    riskScore += 1;
  }

  // Clamp to 1-10 range
  return Math.max(1, Math.min(10, Math.round(riskScore)));
}

// =============================================================================
// MARKET ADVANTAGE
// =============================================================================

/**
 * Calculate market advantage score
 * @param {number} askingPrice - Seller's asking price
 * @param {number} buybackValue - Our buyback value
 * @returns {number} Market advantage score (0-100)
 */
function TM_calculateMarketAdvantage(askingPrice, buybackValue) {
  if (askingPrice === 0 || buybackValue === 0) return 0;

  // Market advantage = how much below buyback the asking price is
  const advantage = ((buybackValue - askingPrice) / buybackValue) * 100;

  // Normalize to 0-100 scale
  // 0% = no advantage, 50%+ = maximum advantage
  return Math.max(0, Math.min(100, advantage * 2));
}

// =============================================================================
// DEAL CLASSIFICATION
// =============================================================================

/**
 * Classify a deal based on profit metrics
 * @param {number} profit - Expected profit amount
 * @param {number} margin - Profit margin as decimal
 * @param {number} riskScore - Risk score
 * @returns {string} Deal class
 */
function TM_classifyDeal(profit, margin, riskScore) {
  // Pass on high risk deals
  if (riskScore > TM_DEAL_THRESHOLDS.MAX_ACCEPTABLE_RISK) {
    return 'PASS';
  }

  // HOT DEAL: High margin AND good profit AND low risk
  if (margin >= TM_DEAL_THRESHOLDS.HOT_DEAL_MARGIN &&
      profit >= TM_DEAL_THRESHOLDS.HOT_DEAL_MIN_PROFIT &&
      riskScore <= TM_DEAL_THRESHOLDS.MEDIUM_RISK) {
    return 'HOT DEAL';
  }

  // SOLID DEAL: Good margin AND decent profit
  if (margin >= TM_DEAL_THRESHOLDS.SOLID_DEAL_MARGIN &&
      profit >= TM_DEAL_THRESHOLDS.SOLID_DEAL_MIN_PROFIT) {
    return 'SOLID DEAL';
  }

  // MARGINAL: Meets minimum requirements
  if (margin >= TM_DEAL_THRESHOLDS.MARGINAL_DEAL_MARGIN &&
      profit >= TM_DEAL_THRESHOLDS.MARGINAL_DEAL_MIN_PROFIT) {
    return 'MARGINAL';
  }

  return 'PASS';
}

// =============================================================================
// HOT SELLER DETECTION
// =============================================================================

/**
 * Detect hot sellers across all devices
 */
function TM_detectHotSellers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(TM_SHEETS.MASTER_DEVICE_DB);

  if (!masterSheet || masterSheet.getLastRow() < 2) return;

  const settings = TM_getSettingsMap();
  const minDeals = parseInt(settings['HOT_SELLER_MIN_DEALS']) || TM_DEAL_THRESHOLDS.HOT_SELLER_MIN_DEALS;

  const headerMap = TM_getHeaderMap(masterSheet);
  const data = TM_sheetToObjects(masterSheet);

  // Count deals per seller
  const sellerCounts = {};
  const sellerDeals = {};

  data.forEach(function(device) {
    const sellerId = TM_getSellerKey(device);
    if (!sellerId) return;

    if (!sellerCounts[sellerId]) {
      sellerCounts[sellerId] = 0;
      sellerDeals[sellerId] = [];
    }

    // Only count qualifying deals (not PASS)
    if (device['Deal Class'] && device['Deal Class'] !== 'PASS') {
      sellerCounts[sellerId]++;
      sellerDeals[sellerId].push(device);
    }
  });

  // Mark hot sellers
  const hotSellerCol = headerMap['Hot Seller?'];
  if (!hotSellerCol) return;

  const updates = [];

  data.forEach(function(device) {
    const sellerId = TM_getSellerKey(device);
    const isHot = sellerId && sellerCounts[sellerId] >= minDeals;
    updates.push([isHot ? 'YES' : 'NO']);
  });

  // Batch update
  if (updates.length > 0) {
    masterSheet.getRange(2, hotSellerCol, updates.length, 1).setValues(updates);
  }

  // Count hot sellers found
  const hotSellerCount = Object.keys(sellerCounts).filter(function(id) {
    return sellerCounts[id] >= minDeals;
  }).length;

  TM_logEvent(TM_LOG_TYPES.SUCCESS, 'TM_detectHotSellers',
    `Found ${hotSellerCount} hot sellers`);

  // Update leads tracker
  TM_updateLeadsFromSellers(ss, sellerCounts, sellerDeals, minDeals);
}

/**
 * Get unique seller key from device
 * @param {Object} device - Device data
 * @returns {string} Seller key
 */
function TM_getSellerKey(device) {
  // Use contact if available, otherwise name
  const contact = TM_cleanString(device['Seller Contact']);
  const name = TM_cleanString(device['Seller Name']);

  if (contact) return contact;
  if (name) return name;

  return '';
}

/**
 * Update leads tracker with seller info
 * @param {Spreadsheet} ss - The spreadsheet
 * @param {Object} sellerCounts - Seller deal counts
 * @param {Object} sellerDeals - Seller deals
 * @param {number} minDeals - Minimum for hot seller
 */
function TM_updateLeadsFromSellers(ss, sellerCounts, sellerDeals, minDeals) {
  const leadsSheet = ss.getSheetByName(TM_SHEETS.LEADS_TRACKER);
  if (!leadsSheet) return;

  const existingLeads = TM_sheetToObjects(leadsSheet);
  const existingKeys = new Set(existingLeads.map(function(l) {
    return TM_cleanString(l['Seller Contact'] || l['Seller Name']);
  }));

  const newLeads = [];
  const timestamp = new Date();

  for (const sellerId in sellerCounts) {
    if (existingKeys.has(sellerId)) continue;

    const deals = sellerDeals[sellerId];
    if (deals.length === 0) continue;

    const firstDeal = deals[0];
    const isHot = sellerCounts[sellerId] >= minDeals;

    newLeads.push([
      TM_generateId(),                              // Lead ID
      firstDeal['Seller Name'] || '',               // Seller Name
      firstDeal['Seller Contact'] || '',            // Seller Contact
      firstDeal['Platform'] || '',                  // Platform
      sellerCounts[sellerId],                       // Total Deals
      isHot ? 'YES' : 'NO',                         // Hot Seller?
      timestamp,                                    // First Seen
      '',                                           // Last Contact
      '',                                           // Contact Method
      'NEW',                                        // Status
      '',                                           // Notes
      '',                                           // CRM ID
      timestamp                                     // Last Updated
    ]);
  }

  // Append new leads
  if (newLeads.length > 0) {
    const lastRow = leadsSheet.getLastRow();
    leadsSheet.getRange(lastRow + 1, 1, newLeads.length, TM_HEADERS_LEADS.length)
              .setValues(newLeads);
  }
}

// =============================================================================
// UPDATE FUNCTIONS
// =============================================================================

/**
 * Update master sheet with analysis results
 * @param {Sheet} masterSheet - The master sheet
 * @param {Array} data - Updated data objects
 * @param {Object} headerMap - Header map
 */
function TM_updateMasterWithAnalysis(masterSheet, data, headerMap) {
  const columns = [
    'MAO',
    'Offer Target',
    'Expected Profit',
    'Profit Margin %',
    'Risk Score',
    'Deal Class',
    'Market Advantage Score',
    'Estimated Resale Value'
  ];

  columns.forEach(function(colName) {
    const colIndex = headerMap[colName];
    if (!colIndex) return;

    const values = data.map(function(device) {
      return [device[colName] || ''];
    });

    if (values.length > 0) {
      masterSheet.getRange(2, colIndex, values.length, 1).setValues(values);
    }
  });
}

/**
 * Log MAO calculations to MAO_ENGINE sheet
 * @param {Spreadsheet} ss - The spreadsheet
 * @param {Array} data - Device data with calculations
 */
function TM_logMaoCalculations(ss, data) {
  const maoSheet = ss.getSheetByName(TM_SHEETS.MAO_ENGINE);
  if (!maoSheet) return;

  // Clear existing (or keep history)
  if (maoSheet.getLastRow() > 1) {
    maoSheet.getRange(2, 1, maoSheet.getLastRow() - 1, maoSheet.getLastColumn())
            .clearContent();
  }

  const logEntries = [];
  const timestamp = new Date();

  data.forEach(function(device) {
    logEntries.push([
      device['ID'],
      device['Asking Price'],
      device['Matched Buyback Value'],
      device['Risk Score'],
      device['MAO'],
      device['Offer Target'],
      device['Expected Profit'],
      device['Profit Margin %'],
      device['Deal Class'],
      timestamp
    ]);
  });

  if (logEntries.length > 0) {
    maoSheet.getRange(2, 1, logEntries.length, TM_HEADERS_MAO.length)
            .setValues(logEntries);
  }
}

// =============================================================================
// DEAL SCORING (for VERDICT ranking)
// =============================================================================

/**
 * Calculate deal score for ranking
 * @param {Object} device - Device data
 * @returns {number} Deal score (0-100)
 */
function TM_calculateDealScore(device) {
  const profit = TM_parsePrice(device['Expected Profit']);
  const margin = parseFloat(device['Profit Margin %']) || 0;
  const riskScore = parseInt(device['Risk Score']) || 5;
  const marketAdv = parseFloat(device['Market Advantage Score']) || 0;
  const isHotSeller = device['Hot Seller?'] === 'YES';

  // Normalize components to 0-100 scale
  const profitScore = Math.min(100, (profit / 200) * 100);  // $200 profit = 100
  const marginScore = Math.min(100, margin * 200);          // 50% margin = 100
  const riskInverse = ((10 - riskScore) / 9) * 100;         // Lower risk = higher score
  const marketScore = marketAdv;
  const hotSellerBonus = isHotSeller ? 100 : 0;

  // Weighted combination
  const score = (
    (profitScore * TM_SCORE_WEIGHTS.PROFIT_AMOUNT) +
    (marginScore * TM_SCORE_WEIGHTS.PROFIT_MARGIN) +
    (riskInverse * TM_SCORE_WEIGHTS.RISK_INVERSE) +
    (marketScore * TM_SCORE_WEIGHTS.MARKET_ADVANTAGE) +
    (hotSellerBonus * TM_SCORE_WEIGHTS.HOT_SELLER)
  );

  return Math.round(score);
}

// =============================================================================
// ANALYSIS UTILITIES
// =============================================================================

/**
 * Get analysis summary statistics
 * @returns {Object} Summary statistics
 */
function TM_getAnalysisSummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(TM_SHEETS.MASTER_DEVICE_DB);

  if (!masterSheet || masterSheet.getLastRow() < 2) {
    return {
      totalDevices: 0,
      hotDeals: 0,
      solidDeals: 0,
      marginalDeals: 0,
      passDeals: 0,
      totalPotentialProfit: 0,
      avgProfit: 0,
      avgMargin: 0,
      hotSellers: 0
    };
  }

  const data = TM_sheetToObjects(masterSheet);

  let hotDeals = 0, solidDeals = 0, marginalDeals = 0, passDeals = 0;
  let totalProfit = 0;
  let totalMargin = 0;
  let profitCount = 0;
  let hotSellers = new Set();

  data.forEach(function(device) {
    const dealClass = device['Deal Class'];
    if (dealClass === 'HOT DEAL') hotDeals++;
    else if (dealClass === 'SOLID DEAL') solidDeals++;
    else if (dealClass === 'MARGINAL') marginalDeals++;
    else passDeals++;

    const profit = TM_parsePrice(device['Expected Profit']);
    if (profit > 0) {
      totalProfit += profit;
      profitCount++;
    }

    const margin = parseFloat(device['Profit Margin %']) || 0;
    if (margin > 0) {
      totalMargin += margin;
    }

    if (device['Hot Seller?'] === 'YES' && device['Seller Contact']) {
      hotSellers.add(device['Seller Contact']);
    }
  });

  return {
    totalDevices: data.length,
    hotDeals: hotDeals,
    solidDeals: solidDeals,
    marginalDeals: marginalDeals,
    passDeals: passDeals,
    totalPotentialProfit: totalProfit,
    avgProfit: profitCount > 0 ? totalProfit / profitCount : 0,
    avgMargin: profitCount > 0 ? totalMargin / profitCount : 0,
    hotSellers: hotSellers.size
  };
}
