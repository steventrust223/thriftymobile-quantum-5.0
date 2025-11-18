/**
 * ===== FILE: TM_utils.gs =====
 * 📱💰 Thrifty Mobile Quantum 5.0 - Utility Functions
 *
 * This file contains logging, header helpers, lookups,
 * and other reusable utility functions.
 */

// =============================================================================
// LOGGING FUNCTIONS
// =============================================================================

/**
 * Log an event to the SYSTEM_LOG sheet
 * @param {string} type - Log type (INFO, SUCCESS, WARNING, ERROR, etc.)
 * @param {string} source - Source function or module
 * @param {string} message - Log message
 * @param {string} [details] - Additional details (optional)
 */
function TM_logEvent(type, source, message, details) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName(TM_SHEETS.SYSTEM_LOG);

    if (!logSheet) {
      // Create log sheet if it doesn't exist
      logSheet = ss.insertSheet(TM_SHEETS.SYSTEM_LOG);
      TM_ensureHeaders(logSheet, TM_HEADERS_LOG);
    }

    const timestamp = new Date();
    const user = Session.getActiveUser().getEmail() || 'System';

    logSheet.appendRow([
      timestamp,
      type || TM_LOG_TYPES.INFO,
      source || 'Unknown',
      message || '',
      details || '',
      user
    ]);

    // Keep log manageable - trim to last 1000 entries
    const lastRow = logSheet.getLastRow();
    if (lastRow > 1001) {
      logSheet.deleteRows(2, lastRow - 1001);
    }

  } catch (e) {
    console.error('Logging error: ' + e.message);
  }
}

/**
 * Get the last N log entries
 * @param {number} count - Number of entries to retrieve
 * @returns {Array} Array of log entry objects
 */
function TM_getRecentLogs(count) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(TM_SHEETS.SYSTEM_LOG);

  if (!logSheet || logSheet.getLastRow() < 2) {
    return [];
  }

  const lastRow = logSheet.getLastRow();
  const startRow = Math.max(2, lastRow - count + 1);
  const numRows = lastRow - startRow + 1;

  const data = logSheet.getRange(startRow, 1, numRows, TM_HEADERS_LOG.length).getValues();
  const logs = [];

  for (let i = data.length - 1; i >= 0; i--) {
    logs.push({
      timestamp: data[i][0],
      type: data[i][1],
      source: data[i][2],
      message: data[i][3],
      details: data[i][4],
      user: data[i][5]
    });
  }

  return logs;
}

// =============================================================================
// HEADER & SHEET HELPERS
// =============================================================================

/**
 * Ensure a sheet has the correct headers
 * @param {Sheet} sheet - The sheet to update
 * @param {Array} headers - Array of header strings
 */
function TM_ensureHeaders(sheet, headers) {
  if (!sheet || !headers || headers.length === 0) return;

  const lastCol = sheet.getLastColumn();

  // If sheet is empty or has no columns, set headers
  if (lastCol === 0 || sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else {
    // Check if headers match
    const existingHeaders = sheet.getRange(1, 1, 1, Math.max(lastCol, headers.length)).getValues()[0];
    let needsUpdate = false;

    for (let i = 0; i < headers.length; i++) {
      if (existingHeaders[i] !== headers[i]) {
        needsUpdate = true;
        break;
      }
    }

    if (needsUpdate) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }

  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setWrap(true);

  // Freeze header row
  sheet.setFrozenRows(1);
}

/**
 * Get a header index map for a sheet
 * @param {Sheet} sheet - The sheet to map
 * @returns {Object} Map of header name to column index (1-based)
 */
function TM_getHeaderMap(sheet) {
  if (!sheet || sheet.getLastColumn() === 0) return {};

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};

  for (let i = 0; i < headers.length; i++) {
    if (headers[i]) {
      map[headers[i]] = i + 1; // 1-based index
    }
  }

  return map;
}

/**
 * Get column index by header name
 * @param {Sheet} sheet - The sheet to search
 * @param {string} headerName - Name of the header
 * @returns {number} Column index (1-based) or -1 if not found
 */
function TM_getColumnIndex(sheet, headerName) {
  const headerMap = TM_getHeaderMap(sheet);
  return headerMap[headerName] || -1;
}

/**
 * Safely get a sheet by name, or null if it doesn't exist
 * @param {string} sheetName - Name of the sheet
 * @returns {Sheet|null} The sheet or null
 */
function TM_getSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(sheetName);
}

/**
 * Get or create a sheet
 * @param {string} sheetName - Name of the sheet
 * @returns {Sheet} The sheet
 */
function TM_getOrCreateSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  return sheet;
}

// =============================================================================
// SETTINGS HELPERS
// =============================================================================

/**
 * Get all settings as a map
 * @returns {Object} Map of setting name to value
 */
function TM_getSettingsMap() {
  const sheet = TM_getSheet(TM_SHEETS.SETTINGS);
  if (!sheet || sheet.getLastRow() < 2) {
    return TM_getDefaultSettingsMap();
  }

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  const map = {};

  for (let i = 0; i < data.length; i++) {
    if (data[i][0]) {
      map[data[i][0]] = data[i][1];
    }
  }

  return map;
}

/**
 * Get default settings as a map
 * @returns {Object} Map of default setting name to value
 */
function TM_getDefaultSettingsMap() {
  const map = {};
  for (let i = 0; i < TM_DEFAULT_SETTINGS.length; i++) {
    map[TM_DEFAULT_SETTINGS[i][0]] = TM_DEFAULT_SETTINGS[i][1];
  }
  return map;
}

/**
 * Get a specific setting value
 * @param {string} settingName - Name of the setting
 * @param {*} defaultValue - Default value if not found
 * @returns {*} The setting value
 */
function TM_getSetting(settingName, defaultValue) {
  const settings = TM_getSettingsMap();
  return settings[settingName] !== undefined ? settings[settingName] : defaultValue;
}

/**
 * Get a numeric setting value
 * @param {string} settingName - Name of the setting
 * @param {number} defaultValue - Default value if not found
 * @returns {number} The numeric setting value
 */
function TM_getNumericSetting(settingName, defaultValue) {
  const value = TM_getSetting(settingName, defaultValue);
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Update a setting value
 * @param {string} settingName - Name of the setting
 * @param {*} value - New value
 */
function TM_updateSetting(settingName, value) {
  const sheet = TM_getSheet(TM_SHEETS.SETTINGS);
  if (!sheet) return;

  const headerMap = TM_getHeaderMap(sheet);
  const nameCol = headerMap['Setting Name'];
  const valueCol = headerMap['Value'];
  const updatedCol = headerMap['Last Updated'];

  if (!nameCol || !valueCol) return;

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const names = sheet.getRange(2, nameCol, lastRow - 1, 1).getValues();

  for (let i = 0; i < names.length; i++) {
    if (names[i][0] === settingName) {
      sheet.getRange(i + 2, valueCol).setValue(value);
      if (updatedCol) {
        sheet.getRange(i + 2, updatedCol).setValue(new Date());
      }
      return;
    }
  }
}

// =============================================================================
// DATA CONVERSION HELPERS
// =============================================================================

/**
 * Convert sheet data to array of objects
 * @param {Sheet} sheet - The sheet to convert
 * @returns {Array} Array of row objects
 */
function TM_sheetToObjects(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const objects = [];

  for (let i = 1; i < data.length; i++) {
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    obj._rowIndex = i + 1; // Store original row number (1-based)
    objects.push(obj);
  }

  return objects;
}

/**
 * Convert array of objects to 2D array for sheet
 * @param {Array} objects - Array of row objects
 * @param {Array} headers - Array of header names
 * @returns {Array} 2D array for sheet
 */
function TM_objectsToArray(objects, headers) {
  const result = [];

  for (let i = 0; i < objects.length; i++) {
    const row = [];
    for (let j = 0; j < headers.length; j++) {
      row.push(objects[i][headers[j]] || '');
    }
    result.push(row);
  }

  return result;
}

// =============================================================================
// STRING & PARSING HELPERS
// =============================================================================

/**
 * Parse a price string to a number
 * @param {string|number} priceStr - Price string (e.g., "$150", "150.00")
 * @returns {number} Parsed price or 0
 */
function TM_parsePrice(priceStr) {
  if (typeof priceStr === 'number') return priceStr;
  if (!priceStr) return 0;

  // Remove currency symbols, commas, and whitespace
  const cleaned = String(priceStr).replace(/[$,\s]/g, '');
  const num = parseFloat(cleaned);

  return isNaN(num) ? 0 : num;
}

/**
 * Format a number as currency
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
function TM_formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
  return '$' + parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format a number as percentage
 * @param {number} decimal - Decimal to format (e.g., 0.25 for 25%)
 * @returns {string} Formatted percentage string
 */
function TM_formatPercent(decimal) {
  if (decimal === null || decimal === undefined || isNaN(decimal)) return '0%';
  return (decimal * 100).toFixed(1) + '%';
}

/**
 * Clean and normalize a string
 * @param {string} str - String to clean
 * @returns {string} Cleaned string
 */
function TM_cleanString(str) {
  if (!str) return '';
  return String(str).trim().toLowerCase();
}

/**
 * Generate a unique ID
 * @returns {string} Unique ID string
 */
function TM_generateId() {
  return 'TM' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
}

/**
 * Extract storage size from text
 * @param {string} text - Text containing storage info
 * @returns {string} Storage size (e.g., "128GB") or empty string
 */
function TM_extractStorage(text) {
  if (!text) return '';

  const match = String(text).match(/(\d+)\s*(?:gb|tb)/i);
  if (match) {
    const size = parseInt(match[1]);
    if (size >= 1000) {
      return (size / 1000) + 'TB';
    }
    return size + 'GB';
  }

  return '';
}

/**
 * Extract carrier from text
 * @param {string} text - Text containing carrier info
 * @returns {string} Carrier name or "Unlocked"
 */
function TM_extractCarrier(text) {
  if (!text) return 'Unknown';

  const str = String(text).toLowerCase();

  const carriers = {
    'unlocked': 'Unlocked',
    'at&t': 'AT&T',
    'att': 'AT&T',
    'verizon': 'Verizon',
    't-mobile': 'T-Mobile',
    'tmobile': 'T-Mobile',
    'sprint': 'Sprint',
    'cricket': 'Cricket',
    'metro': 'Metro',
    'boost': 'Boost',
    'straight talk': 'Straight Talk',
    'tracfone': 'TracFone',
    'us cellular': 'US Cellular'
  };

  for (const key in carriers) {
    if (str.includes(key)) {
      return carriers[key];
    }
  }

  return 'Unknown';
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Check if a value is empty
 * @param {*} value - Value to check
 * @returns {boolean} True if empty
 */
function TM_isEmpty(value) {
  return value === null || value === undefined || value === '' ||
         (typeof value === 'string' && value.trim() === '');
}

/**
 * Check if text contains any blacklist keywords
 * @param {string} text - Text to check
 * @returns {boolean} True if contains blacklist keyword
 */
function TM_isBlacklisted(text) {
  if (!text) return false;

  const str = String(text).toLowerCase();

  for (let i = 0; i < TM_BLACKLIST_KEYWORDS.length; i++) {
    if (str.includes(TM_BLACKLIST_KEYWORDS[i])) {
      return true;
    }
  }

  return false;
}

/**
 * Validate an email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
function TM_isValidEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email).trim());
}

/**
 * Validate a phone number (basic validation)
 * @param {string} phone - Phone to validate
 * @returns {boolean} True if valid phone
 */
function TM_isValidPhone(phone) {
  if (!phone) return false;
  // Remove all non-digits
  const digits = String(phone).replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

// =============================================================================
// DATE HELPERS
// =============================================================================

/**
 * Format a date for display
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function TM_formatDate(date) {
  if (!date || !(date instanceof Date)) return '';

  return Utilities.formatDate(date,
    Session.getScriptTimeZone(),
    'yyyy-MM-dd HH:mm:ss'
  );
}

/**
 * Format a date for short display
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function TM_formatDateShort(date) {
  if (!date || !(date instanceof Date)) return '';

  return Utilities.formatDate(date,
    Session.getScriptTimeZone(),
    'MM/dd HH:mm'
  );
}

/**
 * Check if a date is within the last N days
 * @param {Date} date - Date to check
 * @param {number} days - Number of days
 * @returns {boolean} True if within range
 */
function TM_isWithinDays(date, days) {
  if (!date || !(date instanceof Date)) return false;

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  return diff <= (days * dayMs);
}

// =============================================================================
// UI HELPERS
// =============================================================================

/**
 * Show a toast notification
 * @param {string} message - Message to show
 * @param {string} [title] - Optional title
 * @param {number} [timeout] - Timeout in seconds (default 5)
 */
function TM_showToast(message, title, timeout) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.toast(message, title || TM_VERSION.FULL_NAME, timeout || 5);
}

/**
 * Show an alert dialog
 * @param {string} message - Message to show
 * @param {string} [title] - Optional title
 */
function TM_showAlert(message, title) {
  const ui = SpreadsheetApp.getUi();
  ui.alert(title || TM_VERSION.FULL_NAME, message, ui.ButtonSet.OK);
}

/**
 * Show a confirmation dialog
 * @param {string} message - Message to show
 * @param {string} [title] - Optional title
 * @returns {boolean} True if user clicked Yes
 */
function TM_showConfirm(message, title) {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    title || TM_VERSION.FULL_NAME,
    message,
    ui.ButtonSet.YES_NO
  );

  return response === ui.Button.YES;
}

// =============================================================================
// CRM/INTEGRATION STUBS
// =============================================================================

/**
 * STUB: Sync a lead to external CRM
 * This is a placeholder for future integration with SMS-iT, OneHash, etc.
 * @param {Object} leadData - Lead data to sync
 * @returns {Object} Sync result
 */
function TM_syncToCrmStub(leadData) {
  // TODO: Implement actual CRM integration
  // This would connect to SMS-iT, OneHash, OhmyLead, etc.

  TM_logEvent(
    TM_LOG_TYPES.INFO,
    'TM_syncToCrmStub',
    'CRM sync stub called',
    JSON.stringify(leadData)
  );

  return {
    success: true,
    message: 'CRM sync stub - no action taken',
    externalId: null
  };
}

/**
 * STUB: Prepare SMS payload for outreach
 * This is a placeholder for future SMS-iT integration
 * @param {Object} contact - Contact information
 * @param {string} message - Message to send
 * @returns {Object} SMS payload
 */
function TM_prepareSmsPayloadStub(contact, message) {
  // TODO: Implement actual SMS-iT integration

  TM_logEvent(
    TM_LOG_TYPES.INFO,
    'TM_prepareSmsPayloadStub',
    'SMS payload stub called',
    'Contact: ' + (contact.phone || contact.name)
  );

  return {
    to: contact.phone,
    message: message,
    status: 'pending',
    note: 'SMS stub - no message sent'
  };
}

/**
 * STUB: Prepare document for SignWell e-signature
 * This is a placeholder for future SignWell integration
 * @param {Object} dealData - Deal data for document
 * @returns {Object} Document preparation result
 */
function TM_prepareSignWellDocStub(dealData) {
  // TODO: Implement actual SignWell integration

  TM_logEvent(
    TM_LOG_TYPES.INFO,
    'TM_prepareSignWellDocStub',
    'SignWell doc stub called',
    'Deal ID: ' + (dealData.id || 'unknown')
  );

  return {
    success: true,
    documentId: null,
    message: 'SignWell stub - no document created'
  };
}

// =============================================================================
// PERFORMANCE HELPERS
// =============================================================================

/**
 * Batch update rows efficiently
 * @param {Sheet} sheet - Sheet to update
 * @param {Array} data - 2D array of data
 * @param {number} startRow - Starting row
 * @param {number} startCol - Starting column
 */
function TM_batchUpdate(sheet, data, startRow, startCol) {
  if (!data || data.length === 0) return;

  const numRows = data.length;
  const numCols = data[0].length;

  sheet.getRange(startRow, startCol, numRows, numCols).setValues(data);
}

/**
 * Clear and repopulate a sheet (more efficient than row-by-row)
 * @param {Sheet} sheet - Sheet to clear and populate
 * @param {Array} headers - Header array
 * @param {Array} data - 2D array of data (without headers)
 */
function TM_clearAndPopulate(sheet, headers, data) {
  // Clear all except header row
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
  }

  // Ensure headers
  TM_ensureHeaders(sheet, headers);

  // Add data if present
  if (data && data.length > 0) {
    sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  }
}
