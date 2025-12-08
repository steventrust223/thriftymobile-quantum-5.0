/**
 * ===== FILE: TM_verdict.gs =====
 * 📱💰 Thrifty Mobile Quantum 5.0 - Verdict Sheet Builder
 *
 * This file handles building the VERDICT sheet with ranked deals,
 * recommended actions, and auto-generated seller messages.
 */

// =============================================================================
// MAIN VERDICT BUILDER
// =============================================================================

/**
 * Rebuild the VERDICT sheet with ranked deals
 */
function TM_rebuildVerdictSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(TM_SHEETS.MASTER_DEVICE_DB);
  const verdictSheet = ss.getSheetByName(TM_SHEETS.VERDICT);

  if (!masterSheet || masterSheet.getLastRow() < 2) {
    TM_logEvent(TM_LOG_TYPES.INFO, 'TM_rebuildVerdictSheet', 'No devices to process');
    TM_showToast('No devices found. Run sync first.', 'Info');
    return;
  }

  if (!verdictSheet) {
    TM_showAlert('VERDICT sheet not found. Please run Setup first.');
    return;
  }

  TM_logEvent(TM_LOG_TYPES.ANALYSIS, 'TM_rebuildVerdictSheet', 'Building verdict sheet');

  const data = TM_sheetToObjects(masterSheet);
  const settings = TM_getSettingsMap();

  // Filter and score deals
  const scoredDeals = [];

  data.forEach(function(device) {
    // Skip blacklisted devices
    if (device['Final Grade'] === 'BLACKLISTED') return;

    // Skip devices with no buyback value (unless we want to show them as PASS)
    // For now, include all for visibility

    // Calculate deal score
    const dealScore = TM_calculateDealScore(device);

    // Create verdict entry
    const verdictEntry = TM_createVerdictEntry(device, dealScore, settings);

    scoredDeals.push(verdictEntry);
  });

  // Sort by deal score (descending)
  scoredDeals.sort(function(a, b) {
    return b.dealScore - a.dealScore;
  });

  // Assign ranks
  scoredDeals.forEach(function(deal, index) {
    deal.rank = index + 1;
  });

  // Convert to sheet data
  const verdictData = scoredDeals.map(function(deal) {
    return [
      deal.rank,
      deal.dealScore,
      deal.title,
      deal.platform,
      deal.grade,
      deal.askingPrice,
      deal.offerTarget,
      deal.matchedBuyback,
      deal.expectedProfit,
      deal.profitMargin,
      deal.dealClass,
      deal.riskScore,
      deal.hotSeller,
      deal.marketAdvantage,
      deal.distance,
      deal.action,
      deal.sellerName,
      deal.sellerContact,
      deal.listingUrl,
      deal.autoMessage,
      deal.notes,
      deal.masterId
    ];
  });

  // Clear and populate verdict sheet
  TM_clearAndPopulate(verdictSheet, TM_HEADERS_VERDICT, verdictData);

  // Apply formatting
  TM_applyVerdictFormatting(verdictSheet);

  TM_logEvent(TM_LOG_TYPES.SUCCESS, 'TM_rebuildVerdictSheet',
    `Built verdict sheet with ${scoredDeals.length} deals`);
  TM_showToast(`Verdict sheet updated with ${scoredDeals.length} deals`, 'Success', 5);
}

/**
 * Create a verdict entry from a device
 * @param {Object} device - Device data
 * @param {number} dealScore - Calculated deal score
 * @param {Object} settings - Settings map
 * @returns {Object} Verdict entry
 */
function TM_createVerdictEntry(device, dealScore, settings) {
  const entry = {
    rank: 0,
    dealScore: dealScore,
    title: TM_createDeviceTitle(device),
    platform: device['Platform'] || '',
    grade: device['Final Grade'] || '',
    askingPrice: TM_parsePrice(device['Asking Price']),
    offerTarget: TM_parsePrice(device['Offer Target']),
    matchedBuyback: TM_parsePrice(device['Matched Buyback Value']),
    expectedProfit: TM_parsePrice(device['Expected Profit']),
    profitMargin: parseFloat(device['Profit Margin %']) || 0,
    dealClass: device['Deal Class'] || 'PASS',
    riskScore: parseInt(device['Risk Score']) || 5,
    hotSeller: device['Hot Seller?'] || 'NO',
    marketAdvantage: parseFloat(device['Market Advantage Score']) || 0,
    distance: parseFloat(device['Distance (mi)']) || 0,
    action: TM_determineAction(device),
    sellerName: device['Seller Name'] || '',
    sellerContact: device['Seller Contact'] || '',
    listingUrl: device['Listing URL'] || '',
    autoMessage: '',
    notes: device['Auto Notes'] || '',
    masterId: device['ID'] || ''
  };

  // Generate auto message
  entry.autoMessage = TM_generateSellerMessage(entry, settings);

  return entry;
}

/**
 * Create a device title (Brand + Model + Storage)
 * @param {Object} device - Device data
 * @returns {string} Device title
 */
function TM_createDeviceTitle(device) {
  const parts = [];

  if (device['Brand']) parts.push(device['Brand']);
  if (device['Model']) parts.push(device['Model']);
  if (device['Storage']) parts.push(device['Storage']);

  if (parts.length === 0 && device['Title']) {
    return device['Title'].substring(0, 50);
  }

  return parts.join(' ') || 'Unknown Device';
}

/**
 * Determine recommended action for a deal
 * @param {Object} device - Device data
 * @returns {string} Recommended action
 */
function TM_determineAction(device) {
  const dealClass = device['Deal Class'] || 'PASS';
  const riskScore = parseInt(device['Risk Score']) || 5;
  const isHotSeller = device['Hot Seller?'] === 'YES';
  const hasContact = device['Seller Contact'] || device['Seller Name'];

  // PASS deals get no action
  if (dealClass === 'PASS') {
    return TM_ACTIONS.PASS;
  }

  // HOT DEALS get immediate call action
  if (dealClass === 'HOT DEAL') {
    return hasContact ? TM_ACTIONS.CALL : TM_ACTIONS.TEXT;
  }

  // SOLID DEALS get text action
  if (dealClass === 'SOLID DEAL') {
    if (isHotSeller) {
      return TM_ACTIONS.CALL;
    }
    return TM_ACTIONS.TEXT;
  }

  // MARGINAL deals get hold or pass based on risk
  if (dealClass === 'MARGINAL') {
    if (riskScore <= TM_DEAL_THRESHOLDS.LOW_RISK && isHotSeller) {
      return TM_ACTIONS.TEXT;
    }
    return TM_ACTIONS.HOLD;
  }

  return TM_ACTIONS.PASS;
}

/**
 * Generate auto seller message
 * @param {Object} entry - Verdict entry
 * @param {Object} settings - Settings map
 * @returns {string} Seller message
 */
function TM_generateSellerMessage(entry, settings) {
  // Get template from settings
  let template = settings['DEFAULT_SELLER_MESSAGE'] ||
    'Hi! I\'m interested in your {device}. Would you consider ${offer} for it? I can pick up today and pay cash. Let me know!';

  // Replace placeholders
  let message = template
    .replace('{device}', entry.title)
    .replace('{offer}', entry.offerTarget)
    .replace('${offer}', '$' + entry.offerTarget);

  // Add personalization for hot sellers
  if (entry.hotSeller === 'YES') {
    message = message.replace('Hi!', 'Hi ' + (entry.sellerName.split(' ')[0] || '') + '!');
  }

  return message;
}

// =============================================================================
// VERDICT FORMATTING
// =============================================================================

/**
 * Apply formatting to verdict sheet
 * @param {Sheet} verdictSheet - The verdict sheet
 */
function TM_applyVerdictFormatting(verdictSheet) {
  const lastRow = verdictSheet.getLastRow();
  if (lastRow < 2) return;

  const headerMap = TM_getHeaderMap(verdictSheet);

  // Format number columns
  const priceColumns = ['Asking Price', 'Offer Target', 'Matched Buyback Value', 'Expected Profit'];
  priceColumns.forEach(function(col) {
    const colIndex = headerMap[col];
    if (colIndex && lastRow > 1) {
      verdictSheet.getRange(2, colIndex, lastRow - 1, 1).setNumberFormat('$#,##0');
    }
  });

  // Format percentage column
  const marginCol = headerMap['Profit Margin %'];
  if (marginCol && lastRow > 1) {
    verdictSheet.getRange(2, marginCol, lastRow - 1, 1).setNumberFormat('0.0%');
  }

  // Format distance column
  const distanceCol = headerMap['Distance (mi)'];
  if (distanceCol && lastRow > 1) {
    verdictSheet.getRange(2, distanceCol, lastRow - 1, 1).setNumberFormat('0.0');
  }

  // Apply conditional formatting for Deal Class
  TM_applyDealClassFormattingVerdict(verdictSheet);

  // Auto-resize columns
  verdictSheet.autoResizeColumns(1, verdictSheet.getLastColumn());

  // Set specific column widths for better readability
  verdictSheet.setColumnWidth(headerMap['Auto Seller Message'], 300);
  verdictSheet.setColumnWidth(headerMap['Listing URL'], 200);
}

// =============================================================================
// VERDICT DATA ACCESS
// =============================================================================

/**
 * Get top deals from verdict sheet
 * @param {number} count - Number of deals to return
 * @returns {Array} Array of top deal objects
 */
function TM_getTopDeals(count) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const verdictSheet = ss.getSheetByName(TM_SHEETS.VERDICT);

  if (!verdictSheet || verdictSheet.getLastRow() < 2) {
    return [];
  }

  const data = TM_sheetToObjects(verdictSheet);

  // Return top N deals (already sorted by rank)
  return data.slice(0, count || 10);
}

/**
 * Get deals by class
 * @param {string} dealClass - Deal class to filter by
 * @returns {Array} Array of matching deals
 */
function TM_getDealsByClass(dealClass) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const verdictSheet = ss.getSheetByName(TM_SHEETS.VERDICT);

  if (!verdictSheet || verdictSheet.getLastRow() < 2) {
    return [];
  }

  const data = TM_sheetToObjects(verdictSheet);

  return data.filter(function(deal) {
    return deal['Deal Class'] === dealClass;
  });
}

/**
 * Get actionable deals (not PASS)
 * @returns {Array} Array of actionable deals
 */
function TM_getActionableDeals() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const verdictSheet = ss.getSheetByName(TM_SHEETS.VERDICT);

  if (!verdictSheet || verdictSheet.getLastRow() < 2) {
    return [];
  }

  const data = TM_sheetToObjects(verdictSheet);

  return data.filter(function(deal) {
    return deal['Action'] !== TM_ACTIONS.PASS;
  });
}

// =============================================================================
// VERDICT ACTIONS
// =============================================================================

/**
 * Mark a deal as contacted
 * @param {string} masterId - Master device ID
 */
function TM_markAsContacted(masterId) {
  TM_updateDealAction(masterId, TM_ACTIONS.CONTACTED);
  TM_logEvent(TM_LOG_TYPES.OUTREACH, 'TM_markAsContacted',
    `Marked deal ${masterId} as contacted`);
}

/**
 * Mark a deal as scheduled
 * @param {string} masterId - Master device ID
 */
function TM_markAsScheduled(masterId) {
  TM_updateDealAction(masterId, TM_ACTIONS.SCHEDULED);
  TM_logEvent(TM_LOG_TYPES.OUTREACH, 'TM_markAsScheduled',
    `Marked deal ${masterId} as scheduled`);
}

/**
 * Update deal action in verdict sheet
 * @param {string} masterId - Master device ID
 * @param {string} newAction - New action value
 */
function TM_updateDealAction(masterId, newAction) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const verdictSheet = ss.getSheetByName(TM_SHEETS.VERDICT);

  if (!verdictSheet || verdictSheet.getLastRow() < 2) return;

  const headerMap = TM_getHeaderMap(verdictSheet);
  const masterIdCol = headerMap['Master ID'];
  const actionCol = headerMap['Action'];

  if (!masterIdCol || !actionCol) return;

  const ids = verdictSheet.getRange(2, masterIdCol, verdictSheet.getLastRow() - 1, 1).getValues();

  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === masterId) {
      verdictSheet.getRange(i + 2, actionCol).setValue(newAction);
      return;
    }
  }
}

/**
 * Get verdict summary
 * @returns {Object} Summary statistics
 */
function TM_getVerdictSummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const verdictSheet = ss.getSheetByName(TM_SHEETS.VERDICT);

  if (!verdictSheet || verdictSheet.getLastRow() < 2) {
    return {
      total: 0,
      hotDeals: 0,
      solidDeals: 0,
      marginal: 0,
      pass: 0,
      toCall: 0,
      toText: 0,
      totalProfit: 0
    };
  }

  const data = TM_sheetToObjects(verdictSheet);

  let hotDeals = 0, solidDeals = 0, marginal = 0, pass = 0;
  let toCall = 0, toText = 0;
  let totalProfit = 0;

  data.forEach(function(deal) {
    const dealClass = deal['Deal Class'];
    if (dealClass === 'HOT DEAL') hotDeals++;
    else if (dealClass === 'SOLID DEAL') solidDeals++;
    else if (dealClass === 'MARGINAL') marginal++;
    else pass++;

    const action = deal['Action'];
    if (action === TM_ACTIONS.CALL) toCall++;
    else if (action === TM_ACTIONS.TEXT) toText++;

    totalProfit += TM_parsePrice(deal['Expected Profit']);
  });

  return {
    total: data.length,
    hotDeals: hotDeals,
    solidDeals: solidDeals,
    marginal: marginal,
    pass: pass,
    toCall: toCall,
    toText: toText,
    totalProfit: totalProfit
  };
}

// =============================================================================
// EXPORT FUNCTIONS FOR UI
// =============================================================================

/**
 * Get formatted top deals for UI display
 * @param {number} count - Number of deals to return
 * @returns {Array} Formatted deal objects
 */
function TM_getTopDealsForUi(count) {
  const deals = TM_getTopDeals(count || 5);

  return deals.map(function(deal) {
    return {
      rank: deal['Rank'],
      title: deal['Title'],
      dealClass: deal['Deal Class'],
      askingPrice: TM_formatCurrency(TM_parsePrice(deal['Asking Price'])),
      offerTarget: TM_formatCurrency(TM_parsePrice(deal['Offer Target'])),
      expectedProfit: TM_formatCurrency(TM_parsePrice(deal['Expected Profit'])),
      profitMargin: TM_formatPercent(parseFloat(deal['Profit Margin %']) || 0),
      action: deal['Action'],
      sellerName: deal['Seller Name'],
      sellerContact: deal['Seller Contact'],
      autoMessage: deal['Auto Seller Message'],
      masterId: deal['Master ID'],
      listingUrl: deal['Listing URL'],
      hotSeller: deal['Hot Seller?']
    };
  });
}
