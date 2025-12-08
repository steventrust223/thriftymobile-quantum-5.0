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
// CRM INTEGRATION
// =============================================================================

/**
 * CRM Integration configuration
 * Supports: SMS-iT, OneHash, OhmyLead, or custom webhook
 */
const TM_CRM_CONFIG = {
  // CRM Provider types
  PROVIDERS: {
    SMSIT: 'smsit',
    ONEHASH: 'onehash',
    OHMYLEAD: 'ohmylead',
    WEBHOOK: 'webhook',
    NONE: 'none'
  }
};

/**
 * Get CRM configuration from settings
 * @returns {Object} CRM configuration
 */
function TM_getCrmConfig() {
  const settings = TM_getSettingsMap();

  return {
    provider: settings['CRM_PROVIDER'] || TM_CRM_CONFIG.PROVIDERS.NONE,
    apiKey: settings['CRM_API_KEY'] || '',
    apiSecret: settings['CRM_API_SECRET'] || '',
    webhookUrl: settings['CRM_WEBHOOK_URL'] || '',
    enabled: settings['CRM_ENABLED'] === 'TRUE'
  };
}

/**
 * Sync a lead to external CRM
 * Supports multiple CRM providers with configurable settings
 * @param {Object} leadData - Lead data to sync
 * @returns {Object} Sync result with success status and external ID
 */
function TM_syncToCrm(leadData) {
  const config = TM_getCrmConfig();
  const timestamp = new Date();

  // Validate lead data
  if (!leadData || (!leadData.sellerContact && !leadData.sellerName)) {
    return {
      success: false,
      message: 'Invalid lead data: missing seller contact information',
      externalId: null
    };
  }

  // Check if CRM is enabled
  if (!config.enabled || config.provider === TM_CRM_CONFIG.PROVIDERS.NONE) {
    // Log to CRM_INTEGRATION sheet for tracking
    TM_logCrmAction('SYNC_SKIPPED', 'LEAD', leadData.deviceId || '', null,
      'CRM integration not enabled', null);

    return {
      success: true,
      message: 'CRM integration not enabled - lead logged locally',
      externalId: null,
      localOnly: true
    };
  }

  // Build standardized payload
  const payload = TM_buildCrmPayload(leadData);

  try {
    let result;

    switch (config.provider) {
      case TM_CRM_CONFIG.PROVIDERS.SMSIT:
        result = TM_syncToSmsIt(payload, config);
        break;
      case TM_CRM_CONFIG.PROVIDERS.ONEHASH:
        result = TM_syncToOneHash(payload, config);
        break;
      case TM_CRM_CONFIG.PROVIDERS.OHMYLEAD:
        result = TM_syncToOhmyLead(payload, config);
        break;
      case TM_CRM_CONFIG.PROVIDERS.WEBHOOK:
        result = TM_syncToWebhook(payload, config);
        break;
      default:
        result = { success: false, message: 'Unknown CRM provider', externalId: null };
    }

    // Log the sync action
    TM_logCrmAction('SYNC', 'LEAD', leadData.deviceId || '', result.externalId,
      result.success ? 'SUCCESS' : 'FAILED', result.message);

    TM_logEvent(
      result.success ? TM_LOG_TYPES.SUCCESS : TM_LOG_TYPES.ERROR,
      'TM_syncToCrm',
      `CRM sync ${result.success ? 'succeeded' : 'failed'}: ${result.message}`,
      JSON.stringify({ provider: config.provider, leadId: leadData.deviceId })
    );

    return result;

  } catch (error) {
    TM_logCrmAction('SYNC', 'LEAD', leadData.deviceId || '', null, 'ERROR', error.message);
    TM_logEvent(TM_LOG_TYPES.ERROR, 'TM_syncToCrm', 'CRM sync error: ' + error.message);

    return {
      success: false,
      message: 'CRM sync error: ' + error.message,
      externalId: null
    };
  }
}

/**
 * Build standardized CRM payload from lead data
 * @param {Object} leadData - Raw lead data
 * @returns {Object} Standardized CRM payload
 */
function TM_buildCrmPayload(leadData) {
  return {
    contact: {
      name: leadData.sellerName || '',
      phone: TM_normalizePhone(leadData.sellerContact),
      email: TM_isValidEmail(leadData.sellerContact) ? leadData.sellerContact : ''
    },
    lead: {
      source: 'Thrifty Mobile Quantum',
      sourceId: leadData.deviceId || TM_generateId(),
      platform: leadData.platform || 'Unknown',
      status: 'NEW',
      value: leadData.offerTarget || 0,
      notes: TM_buildLeadNotes(leadData)
    },
    device: {
      title: leadData.deviceTitle || '',
      askingPrice: leadData.askingPrice || 0,
      offerTarget: leadData.offerTarget || 0,
      dealClass: leadData.dealClass || '',
      listingUrl: leadData.listingUrl || ''
    },
    metadata: {
      syncedAt: new Date().toISOString(),
      version: TM_VERSION.VERSION
    }
  };
}

/**
 * Build lead notes from lead data
 * @param {Object} leadData - Lead data
 * @returns {string} Formatted notes
 */
function TM_buildLeadNotes(leadData) {
  const notes = [];
  if (leadData.deviceTitle) notes.push('Device: ' + leadData.deviceTitle);
  if (leadData.askingPrice) notes.push('Asking: $' + leadData.askingPrice);
  if (leadData.offerTarget) notes.push('Offer: $' + leadData.offerTarget);
  if (leadData.dealClass) notes.push('Deal Class: ' + leadData.dealClass);
  if (leadData.platform) notes.push('Platform: ' + leadData.platform);
  return notes.join(' | ');
}

/**
 * Normalize phone number for CRM
 * @param {string} phone - Raw phone number
 * @returns {string} Normalized phone number
 */
function TM_normalizePhone(phone) {
  if (!phone) return '';
  // Remove all non-digits
  const digits = String(phone).replace(/\D/g, '');
  // Format as +1XXXXXXXXXX for US numbers
  if (digits.length === 10) {
    return '+1' + digits;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return '+' + digits;
  }
  return digits;
}

/**
 * Sync to SMS-iT CRM
 * @param {Object} payload - Standardized CRM payload
 * @param {Object} config - CRM configuration
 * @returns {Object} Sync result
 */
function TM_syncToSmsIt(payload, config) {
  if (!config.apiKey) {
    return { success: false, message: 'SMS-iT API key not configured', externalId: null };
  }

  const endpoint = 'https://api.sms-it.io/v1/contacts';

  const smsitPayload = {
    phone: payload.contact.phone,
    first_name: payload.contact.name.split(' ')[0] || '',
    last_name: payload.contact.name.split(' ').slice(1).join(' ') || '',
    tags: ['thrifty-mobile', payload.lead.platform.toLowerCase()],
    custom_fields: {
      lead_source: payload.lead.source,
      device: payload.device.title,
      asking_price: payload.device.askingPrice,
      offer_target: payload.device.offerTarget,
      deal_class: payload.device.dealClass
    }
  };

  try {
    const response = UrlFetchApp.fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + config.apiKey,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(smsitPayload),
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());

    if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
      return {
        success: true,
        message: 'Contact synced to SMS-iT',
        externalId: result.id || result.contact_id
      };
    } else {
      return {
        success: false,
        message: 'SMS-iT error: ' + (result.message || response.getContentText()),
        externalId: null
      };
    }
  } catch (error) {
    return { success: false, message: 'SMS-iT request failed: ' + error.message, externalId: null };
  }
}

/**
 * Sync to OneHash CRM
 * @param {Object} payload - Standardized CRM payload
 * @param {Object} config - CRM configuration
 * @returns {Object} Sync result
 */
function TM_syncToOneHash(payload, config) {
  if (!config.apiKey || !config.webhookUrl) {
    return { success: false, message: 'OneHash configuration incomplete', externalId: null };
  }

  const onehashPayload = {
    doctype: 'Lead',
    lead_name: payload.contact.name || 'Unknown',
    mobile_no: payload.contact.phone,
    email_id: payload.contact.email,
    source: 'Thrifty Mobile',
    notes: payload.lead.notes,
    custom_device_title: payload.device.title,
    custom_asking_price: payload.device.askingPrice,
    custom_offer_target: payload.device.offerTarget
  };

  try {
    const response = UrlFetchApp.fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'token ' + config.apiKey + ':' + config.apiSecret,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(onehashPayload),
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());

    if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
      return {
        success: true,
        message: 'Lead synced to OneHash',
        externalId: result.name || result.data?.name
      };
    } else {
      return {
        success: false,
        message: 'OneHash error: ' + (result.message || response.getContentText()),
        externalId: null
      };
    }
  } catch (error) {
    return { success: false, message: 'OneHash request failed: ' + error.message, externalId: null };
  }
}

/**
 * Sync to OhmyLead CRM
 * @param {Object} payload - Standardized CRM payload
 * @param {Object} config - CRM configuration
 * @returns {Object} Sync result
 */
function TM_syncToOhmyLead(payload, config) {
  if (!config.apiKey || !config.webhookUrl) {
    return { success: false, message: 'OhmyLead configuration incomplete', externalId: null };
  }

  const ohmyleadPayload = {
    api_key: config.apiKey,
    name: payload.contact.name,
    phone: payload.contact.phone,
    email: payload.contact.email,
    source: 'Thrifty Mobile Quantum',
    tags: 'phone-buyback,' + payload.lead.platform.toLowerCase(),
    notes: payload.lead.notes,
    custom: {
      device: payload.device.title,
      asking_price: payload.device.askingPrice,
      offer_target: payload.device.offerTarget,
      deal_class: payload.device.dealClass
    }
  };

  try {
    const response = UrlFetchApp.fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify(ohmyleadPayload),
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());

    if (response.getResponseCode() >= 200 && response.getResponseCode() < 300 && result.success) {
      return {
        success: true,
        message: 'Lead synced to OhmyLead',
        externalId: result.lead_id || result.id
      };
    } else {
      return {
        success: false,
        message: 'OhmyLead error: ' + (result.error || result.message || 'Unknown error'),
        externalId: null
      };
    }
  } catch (error) {
    return { success: false, message: 'OhmyLead request failed: ' + error.message, externalId: null };
  }
}

/**
 * Sync to generic webhook endpoint
 * @param {Object} payload - Standardized CRM payload
 * @param {Object} config - CRM configuration
 * @returns {Object} Sync result
 */
function TM_syncToWebhook(payload, config) {
  if (!config.webhookUrl) {
    return { success: false, message: 'Webhook URL not configured', externalId: null };
  }

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (config.apiKey) {
      headers['Authorization'] = 'Bearer ' + config.apiKey;
    }

    const response = UrlFetchApp.fetch(config.webhookUrl, {
      method: 'POST',
      headers: headers,
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
      let externalId = null;
      try {
        const result = JSON.parse(response.getContentText());
        externalId = result.id || result.externalId || result.lead_id;
      } catch (e) { /* Response may not be JSON */ }

      return {
        success: true,
        message: 'Lead synced via webhook',
        externalId: externalId
      };
    } else {
      return {
        success: false,
        message: 'Webhook error: HTTP ' + response.getResponseCode(),
        externalId: null
      };
    }
  } catch (error) {
    return { success: false, message: 'Webhook request failed: ' + error.message, externalId: null };
  }
}

/**
 * Log CRM action to CRM_INTEGRATION sheet
 * @param {string} action - Action type (SYNC, SMS, ESIGN)
 * @param {string} recordType - Record type (LEAD, CONTACT, DOCUMENT)
 * @param {string} localId - Local ID
 * @param {string} externalId - External CRM ID
 * @param {string} status - Status (SUCCESS, FAILED, ERROR)
 * @param {string} details - Additional details
 */
function TM_logCrmAction(action, recordType, localId, externalId, status, details) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const crmSheet = ss.getSheetByName(TM_SHEETS.CRM_INTEGRATION);

  if (!crmSheet) return;

  const syncId = TM_generateId();
  const timestamp = new Date();

  crmSheet.appendRow([
    syncId,
    timestamp,
    action,
    recordType,
    localId || '',
    externalId || '',
    status,
    details || '',
    '',  // Error
    0    // Retry Count
  ]);
}

// Backwards compatibility alias
function TM_syncToCrmStub(leadData) {
  return TM_syncToCrm(leadData);
}

// =============================================================================
// SMS INTEGRATION
// =============================================================================

/**
 * SMS Integration configuration
 */
const TM_SMS_CONFIG = {
  PROVIDERS: {
    SMSIT: 'smsit',
    TWILIO: 'twilio',
    WEBHOOK: 'webhook',
    NONE: 'none'
  }
};

/**
 * Get SMS configuration from settings
 * @returns {Object} SMS configuration
 */
function TM_getSmsConfig() {
  const settings = TM_getSettingsMap();

  return {
    provider: settings['SMS_PROVIDER'] || TM_SMS_CONFIG.PROVIDERS.NONE,
    apiKey: settings['SMS_API_KEY'] || '',
    apiSecret: settings['SMS_API_SECRET'] || '',
    fromNumber: settings['SMS_FROM_NUMBER'] || '',
    webhookUrl: settings['SMS_WEBHOOK_URL'] || '',
    enabled: settings['SMS_ENABLED'] === 'TRUE'
  };
}

/**
 * Send SMS message to contact
 * Supports multiple SMS providers with configurable settings
 * @param {Object} contact - Contact information (phone, name)
 * @param {string} message - Message to send
 * @returns {Object} SMS result with success status and message ID
 */
function TM_sendSms(contact, message) {
  const config = TM_getSmsConfig();

  // Validate inputs
  if (!contact || !contact.phone) {
    return { success: false, message: 'Invalid contact: missing phone number', messageId: null };
  }

  if (!message || message.trim() === '') {
    return { success: false, message: 'Invalid message: empty content', messageId: null };
  }

  // Normalize phone number
  const phone = TM_normalizePhone(contact.phone);
  if (!phone || phone.length < 10) {
    return { success: false, message: 'Invalid phone number format', messageId: null };
  }

  // Check if SMS is enabled
  if (!config.enabled || config.provider === TM_SMS_CONFIG.PROVIDERS.NONE) {
    // Log the prepared message for manual sending
    TM_logCrmAction('SMS_PREPARED', 'MESSAGE', '', null, 'MANUAL',
      `To: ${phone} | Message: ${message.substring(0, 100)}...`);

    return {
      success: true,
      message: 'SMS prepared for manual sending (SMS integration not enabled)',
      messageId: null,
      manualOnly: true,
      payload: { to: phone, message: message }
    };
  }

  try {
    let result;

    switch (config.provider) {
      case TM_SMS_CONFIG.PROVIDERS.SMSIT:
        result = TM_sendSmsViaSmsIt(phone, message, contact.name, config);
        break;
      case TM_SMS_CONFIG.PROVIDERS.TWILIO:
        result = TM_sendSmsViaTwilio(phone, message, config);
        break;
      case TM_SMS_CONFIG.PROVIDERS.WEBHOOK:
        result = TM_sendSmsViaWebhook(phone, message, contact, config);
        break;
      default:
        result = { success: false, message: 'Unknown SMS provider', messageId: null };
    }

    // Log the SMS action
    TM_logCrmAction('SMS', 'MESSAGE', '', result.messageId || '',
      result.success ? 'SENT' : 'FAILED',
      `To: ${phone} | ${result.message}`);

    TM_logEvent(
      result.success ? TM_LOG_TYPES.OUTREACH : TM_LOG_TYPES.ERROR,
      'TM_sendSms',
      `SMS ${result.success ? 'sent' : 'failed'}: ${result.message}`,
      JSON.stringify({ provider: config.provider, to: phone })
    );

    return result;

  } catch (error) {
    TM_logCrmAction('SMS', 'MESSAGE', '', null, 'ERROR', error.message);
    TM_logEvent(TM_LOG_TYPES.ERROR, 'TM_sendSms', 'SMS error: ' + error.message);

    return { success: false, message: 'SMS error: ' + error.message, messageId: null };
  }
}

/**
 * Send SMS via SMS-iT
 * @param {string} phone - Phone number
 * @param {string} message - Message content
 * @param {string} name - Contact name
 * @param {Object} config - SMS configuration
 * @returns {Object} SMS result
 */
function TM_sendSmsViaSmsIt(phone, message, name, config) {
  if (!config.apiKey) {
    return { success: false, message: 'SMS-iT API key not configured', messageId: null };
  }

  const endpoint = 'https://api.sms-it.io/v1/messages';

  try {
    const response = UrlFetchApp.fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + config.apiKey,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        to: phone,
        message: message,
        from: config.fromNumber || undefined
      }),
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());

    if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
      return {
        success: true,
        message: 'SMS sent via SMS-iT',
        messageId: result.message_id || result.id
      };
    } else {
      return {
        success: false,
        message: 'SMS-iT error: ' + (result.message || result.error),
        messageId: null
      };
    }
  } catch (error) {
    return { success: false, message: 'SMS-iT request failed: ' + error.message, messageId: null };
  }
}

/**
 * Send SMS via Twilio
 * @param {string} phone - Phone number
 * @param {string} message - Message content
 * @param {Object} config - SMS configuration
 * @returns {Object} SMS result
 */
function TM_sendSmsViaTwilio(phone, message, config) {
  if (!config.apiKey || !config.apiSecret || !config.fromNumber) {
    return { success: false, message: 'Twilio configuration incomplete', messageId: null };
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${config.apiKey}/Messages.json`;

  try {
    const response = UrlFetchApp.fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Utilities.base64Encode(config.apiKey + ':' + config.apiSecret),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      payload: {
        To: phone,
        From: config.fromNumber,
        Body: message
      },
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());

    if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
      return {
        success: true,
        message: 'SMS sent via Twilio',
        messageId: result.sid
      };
    } else {
      return {
        success: false,
        message: 'Twilio error: ' + (result.message || result.error_message),
        messageId: null
      };
    }
  } catch (error) {
    return { success: false, message: 'Twilio request failed: ' + error.message, messageId: null };
  }
}

/**
 * Send SMS via generic webhook
 * @param {string} phone - Phone number
 * @param {string} message - Message content
 * @param {Object} contact - Contact info
 * @param {Object} config - SMS configuration
 * @returns {Object} SMS result
 */
function TM_sendSmsViaWebhook(phone, message, contact, config) {
  if (!config.webhookUrl) {
    return { success: false, message: 'SMS webhook URL not configured', messageId: null };
  }

  try {
    const response = UrlFetchApp.fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify({
        to: phone,
        message: message,
        contact_name: contact.name || '',
        from: config.fromNumber || '',
        source: 'Thrifty Mobile Quantum'
      }),
      muteHttpExceptions: true
    });

    if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
      let messageId = null;
      try {
        const result = JSON.parse(response.getContentText());
        messageId = result.id || result.message_id;
      } catch (e) { /* Response may not be JSON */ }

      return { success: true, message: 'SMS sent via webhook', messageId: messageId };
    } else {
      return { success: false, message: 'Webhook error: HTTP ' + response.getResponseCode(), messageId: null };
    }
  } catch (error) {
    return { success: false, message: 'Webhook request failed: ' + error.message, messageId: null };
  }
}

/**
 * Prepare SMS payload (for review before sending)
 * @param {Object} contact - Contact information
 * @param {string} message - Message to send
 * @returns {Object} Prepared SMS payload
 */
function TM_prepareSmsPayload(contact, message) {
  const phone = TM_normalizePhone(contact.phone);

  return {
    to: phone,
    message: message,
    contactName: contact.name || '',
    status: 'prepared',
    preparedAt: new Date().toISOString()
  };
}

// Backwards compatibility alias
function TM_prepareSmsPayloadStub(contact, message) {
  return TM_prepareSmsPayload(contact, message);
}

// =============================================================================
// SIGNWELL E-SIGNATURE INTEGRATION
// =============================================================================

/**
 * SignWell Integration configuration
 */
const TM_SIGNWELL_CONFIG = {
  API_BASE: 'https://www.signwell.com/api/v1',
  PROVIDERS: {
    SIGNWELL: 'signwell',
    DOCUSIGN: 'docusign',
    WEBHOOK: 'webhook',
    NONE: 'none'
  }
};

/**
 * Get SignWell configuration from settings
 * @returns {Object} SignWell configuration
 */
function TM_getSignWellConfig() {
  const settings = TM_getSettingsMap();

  return {
    provider: settings['ESIGN_PROVIDER'] || TM_SIGNWELL_CONFIG.PROVIDERS.NONE,
    apiKey: settings['SIGNWELL_API_KEY'] || '',
    templateId: settings['SIGNWELL_TEMPLATE_ID'] || '',
    webhookUrl: settings['ESIGN_WEBHOOK_URL'] || '',
    enabled: settings['ESIGN_ENABLED'] === 'TRUE'
  };
}

/**
 * Create e-signature document for a deal
 * @param {Object} dealData - Deal data for document
 * @returns {Object} Document creation result
 */
function TM_createEsignDocument(dealData) {
  const config = TM_getSignWellConfig();

  // Validate deal data
  if (!dealData || !dealData.id) {
    return { success: false, message: 'Invalid deal data', documentId: null, documentUrl: null };
  }

  // Check if e-signature is enabled
  if (!config.enabled || config.provider === TM_SIGNWELL_CONFIG.PROVIDERS.NONE) {
    TM_logCrmAction('ESIGN_SKIPPED', 'DOCUMENT', dealData.id, null,
      'E-signature not enabled', null);

    return {
      success: true,
      message: 'E-signature not enabled - document not created',
      documentId: null,
      documentUrl: null,
      localOnly: true
    };
  }

  try {
    let result;

    switch (config.provider) {
      case TM_SIGNWELL_CONFIG.PROVIDERS.SIGNWELL:
        result = TM_createSignWellDocument(dealData, config);
        break;
      case TM_SIGNWELL_CONFIG.PROVIDERS.WEBHOOK:
        result = TM_createEsignViaWebhook(dealData, config);
        break;
      default:
        result = { success: false, message: 'Unknown e-sign provider', documentId: null };
    }

    // Log the action
    TM_logCrmAction('ESIGN', 'DOCUMENT', dealData.id, result.documentId,
      result.success ? 'CREATED' : 'FAILED', result.message);

    TM_logEvent(
      result.success ? TM_LOG_TYPES.SUCCESS : TM_LOG_TYPES.ERROR,
      'TM_createEsignDocument',
      `E-sign document ${result.success ? 'created' : 'failed'}: ${result.message}`,
      JSON.stringify({ provider: config.provider, dealId: dealData.id })
    );

    return result;

  } catch (error) {
    TM_logCrmAction('ESIGN', 'DOCUMENT', dealData.id, null, 'ERROR', error.message);
    TM_logEvent(TM_LOG_TYPES.ERROR, 'TM_createEsignDocument', 'E-sign error: ' + error.message);

    return { success: false, message: 'E-sign error: ' + error.message, documentId: null };
  }
}

/**
 * Create document via SignWell API
 * @param {Object} dealData - Deal data
 * @param {Object} config - SignWell configuration
 * @returns {Object} Creation result
 */
function TM_createSignWellDocument(dealData, config) {
  if (!config.apiKey) {
    return { success: false, message: 'SignWell API key not configured', documentId: null };
  }

  const endpoint = TM_SIGNWELL_CONFIG.API_BASE + '/documents';

  // Build document payload
  const documentPayload = {
    template_id: config.templateId || undefined,
    name: `Device Purchase Agreement - ${dealData.deviceTitle || 'Unknown Device'}`,
    subject: 'Device Purchase Agreement from Thrifty Mobile',
    message: 'Please review and sign this device purchase agreement.',
    recipients: [
      {
        id: 'seller',
        email: TM_isValidEmail(dealData.sellerContact) ? dealData.sellerContact : '',
        name: dealData.sellerName || 'Seller',
        send_email: true
      }
    ],
    fields: [
      { name: 'device_title', value: dealData.deviceTitle || '' },
      { name: 'asking_price', value: String(dealData.askingPrice || 0) },
      { name: 'offer_amount', value: String(dealData.offerTarget || 0) },
      { name: 'seller_name', value: dealData.sellerName || '' },
      { name: 'date', value: new Date().toLocaleDateString() }
    ],
    metadata: {
      deal_id: dealData.id,
      source: 'Thrifty Mobile Quantum'
    }
  };

  try {
    const response = UrlFetchApp.fetch(endpoint, {
      method: 'POST',
      headers: {
        'X-Api-Key': config.apiKey,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(documentPayload),
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());

    if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
      return {
        success: true,
        message: 'Document created in SignWell',
        documentId: result.id,
        documentUrl: result.url || result.document_url
      };
    } else {
      return {
        success: false,
        message: 'SignWell error: ' + (result.message || result.error),
        documentId: null
      };
    }
  } catch (error) {
    return { success: false, message: 'SignWell request failed: ' + error.message, documentId: null };
  }
}

/**
 * Create e-sign document via generic webhook
 * @param {Object} dealData - Deal data
 * @param {Object} config - Configuration
 * @returns {Object} Creation result
 */
function TM_createEsignViaWebhook(dealData, config) {
  if (!config.webhookUrl) {
    return { success: false, message: 'E-sign webhook URL not configured', documentId: null };
  }

  try {
    const response = UrlFetchApp.fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify({
        action: 'create_document',
        deal: dealData,
        source: 'Thrifty Mobile Quantum',
        timestamp: new Date().toISOString()
      }),
      muteHttpExceptions: true
    });

    if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
      let documentId = null;
      try {
        const result = JSON.parse(response.getContentText());
        documentId = result.document_id || result.id;
      } catch (e) { /* Response may not be JSON */ }

      return { success: true, message: 'E-sign webhook triggered', documentId: documentId };
    } else {
      return { success: false, message: 'Webhook error: HTTP ' + response.getResponseCode(), documentId: null };
    }
  } catch (error) {
    return { success: false, message: 'Webhook request failed: ' + error.message, documentId: null };
  }
}

/**
 * Prepare SignWell document (for review before sending)
 * @param {Object} dealData - Deal data for document
 * @returns {Object} Prepared document data
 */
function TM_prepareSignWellDoc(dealData) {
  return {
    dealId: dealData.id || '',
    deviceTitle: dealData.deviceTitle || '',
    sellerName: dealData.sellerName || '',
    sellerContact: dealData.sellerContact || '',
    askingPrice: dealData.askingPrice || 0,
    offerTarget: dealData.offerTarget || 0,
    status: 'prepared',
    preparedAt: new Date().toISOString()
  };
}

// Backwards compatibility alias
function TM_prepareSignWellDocStub(dealData) {
  return TM_prepareSignWellDoc(dealData);
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
