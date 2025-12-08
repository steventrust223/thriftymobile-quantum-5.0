/**
 * ===== FILE: TM_buyback_logic.gs =====
 * 📱💰 Thrifty Mobile Quantum 5.0 - Buyback Matching & Deductions
 *
 * This file handles matching devices to partner buyback pricing,
 * applying deductions, and calculating final buyback values.
 */

// =============================================================================
// MAIN BUYBACK MATCHING
// =============================================================================

/**
 * Run buyback matching for all devices in MASTER_DEVICE_DB
 */
function TM_runBuybackMatchingForAll() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(TM_SHEETS.MASTER_DEVICE_DB);

  if (!masterSheet || masterSheet.getLastRow() < 2) {
    TM_logEvent(TM_LOG_TYPES.INFO, 'TM_runBuybackMatchingForAll', 'No devices to match');
    return;
  }

  // Load buyback pricing data
  const pricingData = TM_loadBuybackPricing(ss);
  if (pricingData.length === 0) {
    TM_logEvent(TM_LOG_TYPES.WARNING, 'TM_runBuybackMatchingForAll',
      'No buyback pricing data found. Please populate BUYBACK_PARTNER_PRICING sheet.');
    return;
  }

  TM_logEvent(TM_LOG_TYPES.ANALYSIS, 'TM_runBuybackMatchingForAll',
    `Starting buyback matching with ${pricingData.length} pricing entries`);

  const headerMap = TM_getHeaderMap(masterSheet);
  const data = TM_sheetToObjects(masterSheet);

  let matched = 0;
  let unmatched = 0;

  // Process each device
  data.forEach(function(device) {
    const matchResult = TM_matchDeviceToBuyback(device, pricingData);

    // Update device with match results
    device['Partner Base Price (Matched)'] = matchResult.basePrice;
    device['Applied Deductions'] = matchResult.deductionDetails;
    device['Matched Buyback Value'] = matchResult.finalValue;
    device['_matchConfidence'] = matchResult.matchConfidence; // Store confidence for logging
    device['_matchNotes'] = matchResult.matchNotes; // Store match notes for logging

    // Update notes if no match
    if (matchResult.basePrice === 0) {
      device['Auto Notes'] = (device['Auto Notes'] || '') + ' No buyback match found.';
      unmatched++;
    } else {
      matched++;
    }
  });

  // Write results back to sheet
  TM_updateMasterWithBuybackResults(masterSheet, data, headerMap);

  // Also log to BUYBACK_MATCH sheet for tracking
  TM_logBuybackMatches(ss, data);

  TM_logEvent(TM_LOG_TYPES.SUCCESS, 'TM_runBuybackMatchingForAll',
    `Matched ${matched} devices, ${unmatched} unmatched`);
}

/**
 * Load buyback pricing data from reference sheet
 * @param {Spreadsheet} ss - The spreadsheet
 * @returns {Array} Array of pricing objects
 */
function TM_loadBuybackPricing(ss) {
  const pricingSheet = ss.getSheetByName(TM_SHEETS.BUYBACK_PARTNER_PRICING);
  if (!pricingSheet || pricingSheet.getLastRow() < 2) {
    return [];
  }

  return TM_sheetToObjects(pricingSheet);
}

/**
 * Match a device to buyback pricing and apply deductions
 * @param {Object} device - Device data object
 * @param {Array} pricingData - Buyback pricing data
 * @returns {Object} Match result with basePrice, deductions, finalValue
 */
function TM_matchDeviceToBuyback(device, pricingData) {
  const result = {
    basePrice: 0,
    deductions: [],
    deductionTotal: 0,
    deductionDetails: '',
    finalValue: 0,
    matchConfidence: 0,
    matchNotes: ''
  };

  // Check for blacklisted device
  if (device['Final Grade'] === 'BLACKLISTED') {
    result.matchNotes = 'BLACKLISTED - Cannot purchase';
    return result;
  }

  // Find matching pricing entry
  const match = TM_findPricingMatch(device, pricingData);

  if (!match.entry) {
    result.matchNotes = 'No matching model found in pricing table';
    return result;
  }

  result.matchConfidence = match.confidence;

  // Get base price for the grade
  const grade = device['Final Grade'] || 'B';
  const gradeColumn = TM_getGradeColumnName(grade);
  const basePrice = TM_parsePrice(match.entry[gradeColumn]);

  if (basePrice === 0) {
    result.matchNotes = `No price for grade ${grade}`;
    return result;
  }

  result.basePrice = basePrice;

  // Apply deductions
  const deductionResult = TM_calculateDeductions(device);
  result.deductions = deductionResult.deductions;
  result.deductionTotal = deductionResult.total;
  result.deductionDetails = deductionResult.details;

  // Calculate final value
  result.finalValue = Math.max(0, basePrice - deductionResult.total);
  result.matchNotes = `Matched to ${match.entry['Brand']} ${match.entry['Model']} ${match.entry['Storage'] || ''}`.trim();

  return result;
}

/**
 * Find best matching pricing entry for a device
 * @param {Object} device - Device data
 * @param {Array} pricingData - Pricing entries
 * @returns {Object} Best match with entry and confidence
 */
function TM_findPricingMatch(device, pricingData) {
  let bestMatch = {entry: null, confidence: 0};

  const deviceBrand = TM_cleanString(device['Brand']);
  const deviceModel = TM_cleanString(device['Model']);
  const deviceStorage = TM_cleanString(device['Storage']);
  const deviceVariant = TM_cleanString(device['Variant'] || '');

  for (let i = 0; i < pricingData.length; i++) {
    const pricing = pricingData[i];
    let confidence = 0;

    const pricingBrand = TM_cleanString(pricing['Brand']);
    const pricingModel = TM_cleanString(pricing['Model']);
    const pricingStorage = TM_cleanString(pricing['Storage']);
    const pricingVariant = TM_cleanString(pricing['Variant'] || '');

    // Brand must match
    if (deviceBrand !== pricingBrand && !deviceBrand.includes(pricingBrand) && !pricingBrand.includes(deviceBrand)) {
      continue;
    }
    confidence += 25;

    // Model matching (fuzzy)
    if (deviceModel === pricingModel) {
      confidence += 40;
    } else if (deviceModel.includes(pricingModel) || pricingModel.includes(deviceModel)) {
      confidence += 30;
    } else if (TM_fuzzyModelMatch(deviceModel, pricingModel)) {
      confidence += 20;
    } else {
      continue; // Model must at least fuzzy match
    }

    // Storage matching
    if (deviceStorage && pricingStorage) {
      if (deviceStorage === pricingStorage) {
        confidence += 25;
      } else if (TM_normalizeStorage(deviceStorage) === TM_normalizeStorage(pricingStorage)) {
        confidence += 20;
      }
    } else if (!pricingStorage) {
      // Pricing has no storage specified (matches all)
      confidence += 10;
    }

    // Variant matching (if specified)
    if (deviceVariant && pricingVariant) {
      if (deviceVariant === pricingVariant) {
        confidence += 10;
      }
    }

    // Update best match
    if (confidence > bestMatch.confidence) {
      bestMatch = {entry: pricing, confidence: confidence};
    }
  }

  return bestMatch;
}

/**
 * Fuzzy model matching
 * @param {string} model1 - First model
 * @param {string} model2 - Second model
 * @returns {boolean} True if fuzzy match
 */
function TM_fuzzyModelMatch(model1, model2) {
  // Remove common prefixes/suffixes and compare
  const normalize = function(m) {
    return m.replace(/\s+/g, '')
            .replace(/plus/gi, '+')
            .replace(/ultra/gi, 'u')
            .replace(/pro/gi, 'p')
            .replace(/max/gi, 'm');
  };

  const n1 = normalize(model1);
  const n2 = normalize(model2);

  // Check if core numbers match
  const nums1 = n1.match(/\d+/g) || [];
  const nums2 = n2.match(/\d+/g) || [];

  if (nums1.length > 0 && nums2.length > 0) {
    return nums1[0] === nums2[0];
  }

  return n1.includes(n2) || n2.includes(n1);
}

/**
 * Normalize storage string
 * @param {string} storage - Storage string
 * @returns {string} Normalized storage
 */
function TM_normalizeStorage(storage) {
  if (!storage) return '';

  const lower = storage.toLowerCase();
  const match = lower.match(/(\d+)\s*(gb|tb)/);

  if (match) {
    const num = parseInt(match[1]);
    const unit = match[2];

    if (unit === 'tb') {
      return (num * 1000) + 'gb';
    }
    return num + 'gb';
  }

  return lower.replace(/\s+/g, '');
}

// =============================================================================
// DEDUCTION CALCULATIONS
// =============================================================================

/**
 * Calculate deductions for a device
 * @param {Object} device - Device data
 * @returns {Object} Deduction result with list and total
 */
function TM_calculateDeductions(device) {
  const result = {
    deductions: [],
    total: 0,
    details: ''
  };

  // Get all text to search for issues
  const allText = [
    device['Title'] || '',
    device['Description'] || '',
    device['Condition (Raw)'] || '',
    device['Device Flags'] || '',
    device['Auto Notes'] || ''
  ].join(' ').toLowerCase();

  // Load deduction amounts from settings (or use defaults)
  const deductionAmounts = TM_getDeductionAmounts();

  // Check for cracked back
  if (TM_textContainsAny(allText, TM_ISSUE_KEYWORDS.CRACKED_BACK)) {
    result.deductions.push({reason: 'Cracked Back', amount: deductionAmounts.CRACKED_BACK});
    result.total += deductionAmounts.CRACKED_BACK;
  }

  // Check for cracked lens
  if (TM_textContainsAny(allText, TM_ISSUE_KEYWORDS.CRACKED_LENS)) {
    result.deductions.push({reason: 'Cracked Lens', amount: deductionAmounts.CRACKED_LENS});
    result.total += deductionAmounts.CRACKED_LENS;
  }

  // Check for Cricket carrier
  const carrier = (device['Carrier'] || '').toLowerCase();
  if (carrier.includes('cricket') || TM_textContainsAny(allText, TM_ISSUE_KEYWORDS.CRICKET)) {
    result.deductions.push({reason: 'Cricket Carrier', amount: deductionAmounts.CRICKET_CARRIER});
    result.total += deductionAmounts.CRICKET_CARRIER;
  }

  // Check for demo device
  if (TM_textContainsAny(allText, TM_ISSUE_KEYWORDS.DEMO)) {
    result.deductions.push({reason: 'Demo Unit', amount: deductionAmounts.DEMO_DEVICE});
    result.total += deductionAmounts.DEMO_DEVICE;
  }

  // Check for missing stylus (Samsung Notes, etc.)
  if (TM_textContainsAny(allText, TM_ISSUE_KEYWORDS.MISSING_STYLUS)) {
    result.deductions.push({reason: 'Missing Stylus', amount: deductionAmounts.MISSING_STYLUS});
    result.total += deductionAmounts.MISSING_STYLUS;
  }

  // Check for heavy scratches
  if (TM_textContainsAny(allText, TM_ISSUE_KEYWORDS.HEAVY_SCRATCHES)) {
    result.deductions.push({reason: 'Heavy Scratches', amount: deductionAmounts.HEAVY_SCRATCHES});
    result.total += deductionAmounts.HEAVY_SCRATCHES;
  }

  // Check for battery issues
  if (TM_textContainsAny(allText, TM_ISSUE_KEYWORDS.BATTERY_LOW)) {
    result.deductions.push({reason: 'Low Battery Health', amount: deductionAmounts.BATTERY_HEALTH_LOW});
    result.total += deductionAmounts.BATTERY_HEALTH_LOW;
  }

  // Check for Face ID issues
  if (TM_textContainsAny(allText, TM_ISSUE_KEYWORDS.NO_FACE_ID)) {
    result.deductions.push({reason: 'No Face ID', amount: deductionAmounts.NO_FACE_ID});
    result.total += deductionAmounts.NO_FACE_ID;
  }

  // Check for Touch ID issues
  if (TM_textContainsAny(allText, TM_ISSUE_KEYWORDS.NO_TOUCH_ID)) {
    result.deductions.push({reason: 'No Touch ID', amount: deductionAmounts.NO_TOUCH_ID});
    result.total += deductionAmounts.NO_TOUCH_ID;
  }

  // Format details string
  if (result.deductions.length > 0) {
    result.details = result.deductions.map(function(d) {
      return d.reason + ' (-$' + d.amount + ')';
    }).join('; ');
  }

  return result;
}

/**
 * Get deduction amounts from settings or defaults
 * @returns {Object} Deduction amounts
 */
function TM_getDeductionAmounts() {
  const settings = TM_getSettingsMap();

  return {
    CRACKED_BACK: TM_parsePrice(settings['DEDUCTION_CRACKED_BACK']) || TM_DEDUCTIONS.CRACKED_BACK,
    CRACKED_LENS: TM_parsePrice(settings['DEDUCTION_CRACKED_LENS']) || TM_DEDUCTIONS.CRACKED_LENS,
    CRICKET_CARRIER: TM_parsePrice(settings['DEDUCTION_CRICKET']) || TM_DEDUCTIONS.CRICKET_CARRIER,
    DEMO_DEVICE: TM_parsePrice(settings['DEDUCTION_DEMO']) || TM_DEDUCTIONS.DEMO_DEVICE,
    MISSING_STYLUS: TM_DEDUCTIONS.MISSING_STYLUS,
    HEAVY_SCRATCHES: TM_DEDUCTIONS.HEAVY_SCRATCHES,
    BATTERY_HEALTH_LOW: TM_DEDUCTIONS.BATTERY_HEALTH_LOW,
    NO_FACE_ID: TM_DEDUCTIONS.NO_FACE_ID,
    NO_TOUCH_ID: TM_DEDUCTIONS.NO_TOUCH_ID
  };
}

/**
 * Check if text contains any of the keywords
 * @param {string} text - Text to search
 * @param {Array} keywords - Keywords to find
 * @returns {boolean} True if any keyword found
 */
function TM_textContainsAny(text, keywords) {
  for (let i = 0; i < keywords.length; i++) {
    if (text.includes(keywords[i])) {
      return true;
    }
  }
  return false;
}

// =============================================================================
// UPDATE FUNCTIONS
// =============================================================================

/**
 * Update master sheet with buyback results
 * @param {Sheet} masterSheet - The master sheet
 * @param {Array} data - Updated data objects
 * @param {Object} headerMap - Header map
 */
function TM_updateMasterWithBuybackResults(masterSheet, data, headerMap) {
  const basePriceCol = headerMap['Partner Base Price (Matched)'];
  const deductionsCol = headerMap['Applied Deductions'];
  const finalValueCol = headerMap['Matched Buyback Value'];

  if (!basePriceCol || !deductionsCol || !finalValueCol) return;

  // Build update arrays
  const basePrices = [];
  const deductions = [];
  const finalValues = [];

  data.forEach(function(device) {
    basePrices.push([device['Partner Base Price (Matched)'] || 0]);
    deductions.push([device['Applied Deductions'] || '']);
    finalValues.push([device['Matched Buyback Value'] || 0]);
  });

  // Batch update
  if (data.length > 0) {
    masterSheet.getRange(2, basePriceCol, data.length, 1).setValues(basePrices);
    masterSheet.getRange(2, deductionsCol, data.length, 1).setValues(deductions);
    masterSheet.getRange(2, finalValueCol, data.length, 1).setValues(finalValues);
  }
}

/**
 * Log buyback matches to tracking sheet
 * @param {Spreadsheet} ss - The spreadsheet
 * @param {Array} data - Device data with matches
 */
function TM_logBuybackMatches(ss, data) {
  const matchSheet = ss.getSheetByName(TM_SHEETS.BUYBACK_MATCH);
  if (!matchSheet) return;

  // Clear existing matches (optional - keep history by commenting this out)
  if (matchSheet.getLastRow() > 1) {
    matchSheet.getRange(2, 1, matchSheet.getLastRow() - 1, matchSheet.getLastColumn())
              .clearContent();
  }

  // Build match log entries
  const logEntries = [];
  const timestamp = new Date();

  data.forEach(function(device) {
    if (device['Matched Buyback Value'] > 0) {
      // Use actual match confidence from the matching algorithm
      const matchConfidence = device['_matchConfidence'] || 0;
      const matchNotes = device['_matchNotes'] || '';

      logEntries.push([
        device['ID'],
        device['Brand'],
        device['Model'],
        device['Storage'],
        device['Final Grade'],
        device['Partner Base Price (Matched)'],
        device['Applied Deductions'] ? 'YES' : 'NO',
        device['Applied Deductions'],
        device['Matched Buyback Value'],
        matchConfidence, // Actual match confidence from TM_findPricingMatch
        matchNotes,
        timestamp
      ]);
    }
  });

  // Write log entries
  if (logEntries.length > 0) {
    matchSheet.getRange(2, 1, logEntries.length, TM_HEADERS_BUYBACK_MATCH.length)
              .setValues(logEntries);
  }
}

// =============================================================================
// MANUAL BUYBACK OPERATIONS
// =============================================================================

/**
 * Manually set buyback value for a device
 * @param {string} deviceId - Device ID
 * @param {number} value - Buyback value
 */
function TM_setManualBuybackValue(deviceId, value) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(TM_SHEETS.MASTER_DEVICE_DB);

  if (!masterSheet || masterSheet.getLastRow() < 2) return;

  const headerMap = TM_getHeaderMap(masterSheet);
  const idCol = headerMap['ID'];
  const valueCol = headerMap['Matched Buyback Value'];

  if (!idCol || !valueCol) return;

  const ids = masterSheet.getRange(2, idCol, masterSheet.getLastRow() - 1, 1).getValues();

  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === deviceId) {
      masterSheet.getRange(i + 2, valueCol).setValue(value);

      TM_logEvent(TM_LOG_TYPES.INFO, 'TM_setManualBuybackValue',
        `Set manual buyback value $${value} for device ${deviceId}`);
      return;
    }
  }
}

/**
 * Get buyback summary statistics
 * @returns {Object} Summary stats
 */
function TM_getBuybackSummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(TM_SHEETS.MASTER_DEVICE_DB);

  if (!masterSheet || masterSheet.getLastRow() < 2) {
    return {total: 0, matched: 0, unmatched: 0, totalValue: 0, avgValue: 0};
  }

  const data = TM_sheetToObjects(masterSheet);

  let matched = 0;
  let totalValue = 0;

  data.forEach(function(device) {
    const value = TM_parsePrice(device['Matched Buyback Value']);
    if (value > 0) {
      matched++;
      totalValue += value;
    }
  });

  return {
    total: data.length,
    matched: matched,
    unmatched: data.length - matched,
    totalValue: totalValue,
    avgValue: matched > 0 ? totalValue / matched : 0
  };
}
