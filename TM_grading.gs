/**
 * ===== FILE: TM_grading.gs =====
 * 📱💰 Thrifty Mobile Quantum 5.0 - Grading Engine
 *
 * This file contains the device grading logic including
 * condition normalization, grade assignment, and overrides.
 */

// =============================================================================
// MAIN GRADING FUNCTIONS
// =============================================================================

/**
 * Apply grading to all devices in MASTER_DEVICE_DB
 */
function TM_applyGradingToAllDevices() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(TM_SHEETS.MASTER_DEVICE_DB);

  if (!masterSheet || masterSheet.getLastRow() < 2) {
    TM_logEvent(TM_LOG_TYPES.INFO, 'TM_applyGradingToAllDevices', 'No devices to grade');
    return;
  }

  TM_logEvent(TM_LOG_TYPES.ANALYSIS, 'TM_applyGradingToAllDevices', 'Starting grading process');

  const headerMap = TM_getHeaderMap(masterSheet);
  const data = masterSheet.getDataRange().getValues();
  const headers = data[0];

  // Get column indices
  const conditionRawCol = headerMap['Condition (Raw)'];
  const conditionNormCol = headerMap['Condition (Normalized)'];
  const guessedGradeCol = headerMap['Guessed Grade'];
  const manualGradeCol = headerMap['Manual Grade'];
  const finalGradeCol = headerMap['Final Grade'];
  const descriptionCol = headerMap['Description'] || -1;
  const titleCol = headerMap['Title'] || -1;
  const deviceFlagsCol = headerMap['Device Flags'];
  const autoNotesCol = headerMap['Auto Notes'];

  // Process each row
  const updates = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    // Get relevant text for grading
    const conditionRaw = row[conditionRawCol - 1] || '';
    let conditionNorm = row[conditionNormCol - 1] || '';
    const description = descriptionCol > 0 ? (row[descriptionCol - 1] || '') : '';
    const title = titleCol > 0 ? (row[titleCol - 1] || '') : '';
    const manualGrade = row[manualGradeCol - 1] || '';

    // Normalize condition if not already done
    if (!conditionNorm) {
      conditionNorm = TM_normalizeCondition(conditionRaw);
    }

    // Guess grade from condition and description
    const gradeResult = TM_guessGrade(conditionRaw, conditionNorm, description, title);

    // Final grade is manual override or guessed
    const finalGrade = manualGrade || gradeResult.grade;

    // Prepare update array
    const updateRow = new Array(headers.length).fill(null);
    updateRow[conditionNormCol - 1] = conditionNorm;
    updateRow[guessedGradeCol - 1] = gradeResult.grade;
    updateRow[finalGradeCol - 1] = finalGrade;
    if (deviceFlagsCol) updateRow[deviceFlagsCol - 1] = gradeResult.flags.join(', ');
    if (autoNotesCol) updateRow[autoNotesCol - 1] = gradeResult.notes;

    updates.push({row: i + 1, data: updateRow});
  }

  // Batch update the sheet
  updates.forEach(function(update) {
    // Only update non-null cells
    update.data.forEach(function(value, colIndex) {
      if (value !== null) {
        masterSheet.getRange(update.row, colIndex + 1).setValue(value);
      }
    });
  });

  TM_logEvent(TM_LOG_TYPES.SUCCESS, 'TM_applyGradingToAllDevices',
    `Graded ${updates.length} devices`);
}

/**
 * Guess grade based on condition and description
 * @param {string} conditionRaw - Raw condition text
 * @param {string} conditionNorm - Normalized condition
 * @param {string} description - Description text
 * @param {string} title - Title text
 * @returns {Object} Grade result with grade, flags, and notes
 */
function TM_guessGrade(conditionRaw, conditionNorm, description, title) {
  const result = {
    grade: 'B',  // Default to B
    flags: [],
    notes: ''
  };

  const allText = (conditionRaw + ' ' + conditionNorm + ' ' + description + ' ' + title).toLowerCase();

  // Check for blacklist first
  if (TM_isBlacklisted(allText)) {
    result.grade = 'BLACKLISTED';
    result.flags.push('BLACKLISTED');
    result.notes = 'Device has blacklist indicators - DO NOT PURCHASE';
    return result;
  }

  // Check for DOA indicators
  const doaIndicators = ['broken', 'for parts', 'not working', 'dead', 'doa', 'cracked screen', 'shattered screen', 'no power', 'water damage'];
  for (const indicator of doaIndicators) {
    if (allText.includes(indicator)) {
      result.grade = 'DOA';
      result.flags.push('DOA');
      result.notes = 'Device appears non-functional: ' + indicator;
      return result;
    }
  }

  // Base grade from normalized condition
  const baseGrade = TM_getBaseGradeFromCondition(conditionNorm);
  result.grade = baseGrade;

  // Check for grade modifiers (issues that might downgrade)
  const modifiers = TM_checkGradeModifiers(allText);
  result.flags = modifiers.flags;

  // Downgrade based on issues
  if (modifiers.downgradeLevel > 0) {
    result.grade = TM_downgradeGrade(baseGrade, modifiers.downgradeLevel);
    result.notes = 'Downgraded due to: ' + modifiers.reasons.join(', ');
  }

  // Check for upgrade indicators
  if (modifiers.upgradeIndicators > 0 && modifiers.downgradeLevel === 0) {
    result.grade = TM_upgradeGrade(baseGrade, 1);
    result.notes = 'Good condition indicators found';
  }

  return result;
}

/**
 * Get base grade from normalized condition
 * @param {string} conditionNorm - Normalized condition
 * @returns {string} Base grade
 */
function TM_getBaseGradeFromCondition(conditionNorm) {
  const lower = conditionNorm.toLowerCase();

  if (lower === 'like new' || lower === 'mint' || lower === 'new') return 'A';
  if (lower === 'excellent') return 'B+';
  if (lower === 'good') return 'B';
  if (lower === 'fair') return 'C';
  if (lower === 'poor') return 'D';
  if (lower === 'broken/doa' || lower === 'broken' || lower === 'doa') return 'DOA';

  // Default based on keywords
  for (const condition in TM_CONDITION_TO_GRADE) {
    if (lower.includes(condition)) {
      return TM_CONDITION_TO_GRADE[condition];
    }
  }

  return 'B'; // Default
}

/**
 * Check for grade modifiers in text
 * @param {string} text - Text to check
 * @returns {Object} Modifier results
 */
function TM_checkGradeModifiers(text) {
  const result = {
    flags: [],
    reasons: [],
    downgradeLevel: 0,
    upgradeIndicators: 0
  };

  // Severe issues (2 level downgrade)
  const severeIssues = [
    'cracked screen', 'lcd damage', 'touch not working', 'ghost touch',
    'burn-in', 'burn in', 'dead pixels', 'screen bleed'
  ];

  // Moderate issues (1 level downgrade)
  const moderateIssues = [
    'cracked back', 'back cracked', 'cracked lens',
    'dent', 'bent', 'warped', 'deep scratch',
    'battery issue', 'battery health', 'battery low'
  ];

  // Minor issues (0.5 level downgrade, round up)
  const minorIssues = [
    'scratches', 'scuff', 'wear', 'small crack',
    'missing', 'no box', 'no charger'
  ];

  // Positive indicators
  const positiveIndicators = [
    'perfect', 'pristine', 'flawless', 'excellent',
    'like new', 'mint', 'with box', 'original box',
    'all accessories', 'clean', 'apple care', 'warranty'
  ];

  // Check severe issues
  for (const issue of severeIssues) {
    if (text.includes(issue)) {
      result.flags.push(issue.toUpperCase().replace(' ', '_'));
      result.reasons.push(issue);
      result.downgradeLevel += 2;
    }
  }

  // Check moderate issues
  for (const issue of moderateIssues) {
    if (text.includes(issue)) {
      result.flags.push(issue.toUpperCase().replace(' ', '_'));
      result.reasons.push(issue);
      result.downgradeLevel += 1;
    }
  }

  // Check minor issues
  for (const issue of minorIssues) {
    if (text.includes(issue)) {
      result.downgradeLevel += 0.5;
    }
  }

  // Check positive indicators
  for (const indicator of positiveIndicators) {
    if (text.includes(indicator)) {
      result.upgradeIndicators += 1;
    }
  }

  // Round downgrade level
  result.downgradeLevel = Math.ceil(result.downgradeLevel);

  return result;
}

/**
 * Downgrade a grade by a number of levels
 * @param {string} grade - Current grade
 * @param {number} levels - Number of levels to downgrade
 * @returns {string} New grade
 */
function TM_downgradeGrade(grade, levels) {
  const gradeOrder = ['A', 'B+', 'B', 'C', 'D', 'DOA'];
  let currentIndex = gradeOrder.indexOf(grade);

  if (currentIndex === -1) currentIndex = 2; // Default to B

  const newIndex = Math.min(currentIndex + levels, gradeOrder.length - 1);
  return gradeOrder[newIndex];
}

/**
 * Upgrade a grade by a number of levels
 * @param {string} grade - Current grade
 * @param {number} levels - Number of levels to upgrade
 * @returns {string} New grade
 */
function TM_upgradeGrade(grade, levels) {
  const gradeOrder = ['A', 'B+', 'B', 'C', 'D', 'DOA'];
  let currentIndex = gradeOrder.indexOf(grade);

  if (currentIndex === -1) currentIndex = 2; // Default to B

  const newIndex = Math.max(currentIndex - levels, 0);
  return gradeOrder[newIndex];
}

// =============================================================================
// GRADE APPLICATION TO SINGLE ROW
// =============================================================================

/**
 * Apply grading to a single row object
 * @param {Object} rowObj - Row data object
 * @returns {Object} Updated row object with grades
 */
function TM_applyGradingToRow(rowObj) {
  const conditionRaw = rowObj['Condition (Raw)'] || '';
  const conditionNorm = rowObj['Condition (Normalized)'] || TM_normalizeCondition(conditionRaw);
  const description = rowObj['Description'] || '';
  const title = rowObj['Title'] || '';
  const manualGrade = rowObj['Manual Grade'] || '';

  const gradeResult = TM_guessGrade(conditionRaw, conditionNorm, description, title);

  rowObj['Condition (Normalized)'] = conditionNorm;
  rowObj['Guessed Grade'] = gradeResult.grade;
  rowObj['Final Grade'] = manualGrade || gradeResult.grade;
  rowObj['Device Flags'] = gradeResult.flags.join(', ');
  rowObj['Auto Notes'] = gradeResult.notes;

  return rowObj;
}

// =============================================================================
// MANUAL GRADE OVERRIDE
// =============================================================================

/**
 * Set manual grade for a device by ID
 * @param {string} deviceId - Device ID
 * @param {string} grade - Manual grade to set
 */
function TM_setManualGrade(deviceId, grade) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(TM_SHEETS.MASTER_DEVICE_DB);

  if (!masterSheet || masterSheet.getLastRow() < 2) return;

  const headerMap = TM_getHeaderMap(masterSheet);
  const idCol = headerMap['ID'];
  const manualGradeCol = headerMap['Manual Grade'];
  const finalGradeCol = headerMap['Final Grade'];

  if (!idCol || !manualGradeCol) return;

  // Find the row with this ID
  const ids = masterSheet.getRange(2, idCol, masterSheet.getLastRow() - 1, 1).getValues();

  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === deviceId) {
      const rowNum = i + 2;
      masterSheet.getRange(rowNum, manualGradeCol).setValue(grade);
      masterSheet.getRange(rowNum, finalGradeCol).setValue(grade);

      TM_logEvent(TM_LOG_TYPES.INFO, 'TM_setManualGrade',
        `Set manual grade ${grade} for device ${deviceId}`);
      return;
    }
  }
}

// =============================================================================
// GRADING UTILITIES
// =============================================================================

/**
 * Get grade display info (color, description)
 * @param {string} grade - Grade letter
 * @returns {Object} Grade display information
 */
function TM_getGradeInfo(grade) {
  const gradeInfo = {
    'A': {
      color: '#00c853',
      bgColor: '#c8e6c9',
      description: 'Like New - Pristine condition',
      multiplier: 1.0
    },
    'B+': {
      color: '#2196f3',
      bgColor: '#bbdefb',
      description: 'Excellent - Minor signs of use',
      multiplier: 0.92
    },
    'B': {
      color: '#4caf50',
      bgColor: '#dcedc8',
      description: 'Good - Normal wear',
      multiplier: 0.85
    },
    'C': {
      color: '#ff9800',
      bgColor: '#ffe0b2',
      description: 'Fair - Visible wear/cosmetic issues',
      multiplier: 0.70
    },
    'D': {
      color: '#f44336',
      bgColor: '#ffcdd2',
      description: 'Poor - Heavy wear or damage',
      multiplier: 0.50
    },
    'DOA': {
      color: '#b71c1c',
      bgColor: '#ffebee',
      description: 'Dead/Non-functional - Parts only',
      multiplier: 0.20
    },
    'BLACKLISTED': {
      color: '#000000',
      bgColor: '#f5f5f5',
      description: 'BLACKLISTED - Do not purchase',
      multiplier: 0
    }
  };

  return gradeInfo[grade] || gradeInfo['B'];
}

/**
 * Validate if a grade is valid
 * @param {string} grade - Grade to validate
 * @returns {boolean} True if valid
 */
function TM_isValidGrade(grade) {
  const validGrades = ['A', 'B+', 'B', 'C', 'D', 'DOA', 'BLACKLISTED'];
  return validGrades.includes(grade);
}

/**
 * Get grade column name for buyback lookup
 * @param {string} grade - Grade letter
 * @returns {string} Column name in BUYBACK_PARTNER_PRICING
 */
function TM_getGradeColumnName(grade) {
  const mapping = {
    'A': 'Grade A',
    'B+': 'Grade B+',
    'B': 'Grade B',
    'C': 'Grade C',
    'D': 'Grade D',
    'DOA': 'DOA'
  };

  return mapping[grade] || 'Grade B';
}
