/**
 * ===== FILE: TM_sync.gs =====
 * 📱💰 Thrifty Mobile Quantum 5.0 - Data Synchronization
 *
 * This file handles normalizing data from IMPORT sheets into
 * MASTER_DEVICE_DB and deduplicating entries.
 */

// =============================================================================
// MAIN SYNC FUNCTION
// =============================================================================

/**
 * Run full sync from all IMPORT sheets to MASTER_DEVICE_DB
 */
function TM_runFullSync() {
  TM_showToast('Starting import sync...', 'Sync', 30);
  TM_logEvent(TM_LOG_TYPES.SYNC, 'TM_runFullSync', 'Starting full import sync');

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const masterSheet = ss.getSheetByName(TM_SHEETS.MASTER_DEVICE_DB);

    if (!masterSheet) {
      throw new Error('MASTER_DEVICE_DB sheet not found. Please run Setup first.');
    }

    // Get existing master data for deduplication
    const existingData = TM_getExistingMasterData(masterSheet);
    const existingKeys = new Set(existingData.map(row => row.dedupeKey));

    let totalImported = 0;
    let totalSkipped = 0;
    let totalDuplicates = 0;

    // Process each import sheet
    TM_IMPORT_SHEETS.forEach(function(sheetName) {
      const result = TM_processImportSheet(ss, sheetName, existingKeys, masterSheet);
      totalImported += result.imported;
      totalSkipped += result.skipped;
      totalDuplicates += result.duplicates;
    });

    // Log results
    const message = `Sync complete: ${totalImported} imported, ${totalDuplicates} duplicates skipped, ${totalSkipped} errors`;
    TM_logEvent(TM_LOG_TYPES.SUCCESS, 'TM_runFullSync', message);
    TM_showToast(message, 'Sync Complete', 5);

  } catch (error) {
    TM_logEvent(TM_LOG_TYPES.ERROR, 'TM_runFullSync', 'Sync failed: ' + error.message);
    TM_showAlert('Sync failed: ' + error.message);
  }
}

// =============================================================================
// IMPORT PROCESSING
// =============================================================================

/**
 * Process a single import sheet and add new records to master
 * @param {Spreadsheet} ss - The spreadsheet
 * @param {string} sheetName - Name of the import sheet
 * @param {Set} existingKeys - Set of existing deduplication keys
 * @param {Sheet} masterSheet - The master device DB sheet
 * @returns {Object} Counts of imported, skipped, duplicates
 */
function TM_processImportSheet(ss, sheetName, existingKeys, masterSheet) {
  const importSheet = ss.getSheetByName(sheetName);
  const result = {imported: 0, skipped: 0, duplicates: 0};

  if (!importSheet || importSheet.getLastRow() < 2) {
    return result;
  }

  // Get import data
  const importData = TM_sheetToObjects(importSheet);

  if (importData.length === 0) {
    return result;
  }

  // Get master header map for writing
  const masterHeaderMap = TM_getHeaderMap(masterSheet);

  // Process each row
  const newRows = [];

  importData.forEach(function(row) {
    try {
      // Create deduplication key
      const dedupeKey = TM_createDedupeKey(row);

      // Skip if duplicate
      if (existingKeys.has(dedupeKey)) {
        result.duplicates++;
        return;
      }

      // Normalize the row
      const normalizedRow = TM_normalizeImportRow(row, sheetName);

      // Convert to master format
      const masterRow = TM_createMasterRow(normalizedRow, masterHeaderMap);

      newRows.push(masterRow);
      existingKeys.add(dedupeKey); // Add to set to prevent duplicates within batch

      result.imported++;

    } catch (e) {
      TM_logEvent(TM_LOG_TYPES.WARNING, 'TM_processImportSheet',
        'Error processing row: ' + e.message,
        'Sheet: ' + sheetName + ', Row: ' + row._rowIndex);
      result.skipped++;
    }
  });

  // Batch append new rows
  if (newRows.length > 0) {
    const lastRow = masterSheet.getLastRow();
    masterSheet.getRange(lastRow + 1, 1, newRows.length, newRows[0].length)
               .setValues(newRows);
  }

  TM_logEvent(TM_LOG_TYPES.INFO, 'TM_processImportSheet',
    `Processed ${sheetName}: ${result.imported} new, ${result.duplicates} dupes`);

  return result;
}

/**
 * Create a deduplication key for a row
 * @param {Object} row - Row data object
 * @returns {string} Deduplication key
 */
function TM_createDedupeKey(row) {
  // Use Platform + Listing URL + Title (or portions thereof)
  const platform = TM_cleanString(row['Platform'] || '');
  const url = TM_cleanString(row['Listing URL'] || '');
  const title = TM_cleanString(row['Title'] || '').substring(0, 50);

  return `${platform}|${url}|${title}`;
}

/**
 * Get existing master data for deduplication
 * @param {Sheet} masterSheet - The master device DB sheet
 * @returns {Array} Array of row objects with dedupeKey
 */
function TM_getExistingMasterData(masterSheet) {
  if (masterSheet.getLastRow() < 2) {
    return [];
  }

  const data = TM_sheetToObjects(masterSheet);

  return data.map(function(row) {
    return {
      id: row['ID'],
      dedupeKey: TM_createDedupeKey({
        'Platform': row['Platform'],
        'Listing URL': row['Listing URL'],
        'Title': row['Title']
      })
    };
  });
}

// =============================================================================
// DATA NORMALIZATION
// =============================================================================

/**
 * Normalize an import row to standard format
 * @param {Object} row - Raw import row
 * @param {string} sourceSheet - Name of the source import sheet
 * @returns {Object} Normalized row data
 */
function TM_normalizeImportRow(row, sourceSheet) {
  const normalized = {};

  // Generate unique ID
  normalized.id = TM_generateId();

  // Platform detection
  normalized.platform = TM_detectPlatform(row['Platform'], sourceSheet);

  // Basic fields
  normalized.listingUrl = row['Listing URL'] || '';
  normalized.title = row['Title'] || '';
  normalized.askingPrice = TM_parsePrice(row['Asking Price']);
  normalized.location = row['Location'] || row['Seller ZIP / Location'] || '';
  normalized.sellerZip = TM_extractZip(row['Seller ZIP / Location'] || row['Location'] || '');
  normalized.description = row['Description'] || '';

  // Device info - try to extract from title if not provided
  normalized.deviceType = row['Device Type'] || TM_guessDeviceType(row['Title']);
  normalized.brand = row['Brand'] || TM_guessBrand(row['Title']);
  normalized.model = row['Model'] || TM_guessModel(row['Title'], normalized.brand);
  normalized.variant = TM_guessVariant(row['Title'], normalized.model);
  normalized.storage = row['Storage'] || TM_extractStorage(row['Title']);
  normalized.carrier = row['Carrier'] || TM_extractCarrier(row['Title'] + ' ' + row['Description']);

  // Condition
  normalized.conditionRaw = row['Condition (Raw)'] || TM_guessConditionFromDescription(row['Description']);
  normalized.conditionNormalized = TM_normalizeCondition(normalized.conditionRaw);

  // Seller info
  normalized.sellerName = row['Seller Name'] || '';
  normalized.sellerContact = row['Seller Contact'] || '';

  // Metadata
  normalized.timestamp = row['Timestamp'] || new Date();
  normalized.sourceSheet = sourceSheet;
  normalized.images = row['Images'] || '';
  normalized.scrapeJobLink = row['Scrape Job Link'] || '';

  return normalized;
}

/**
 * Create a master row array from normalized data
 * @param {Object} normalized - Normalized row data
 * @param {Object} headerMap - Master sheet header map
 * @returns {Array} Row array for master sheet
 */
function TM_createMasterRow(normalized, headerMap) {
  // Create row array with all columns
  const row = new Array(Object.keys(headerMap).length).fill('');

  // Map normalized data to row positions
  if (headerMap['ID']) row[headerMap['ID'] - 1] = normalized.id;
  if (headerMap['Platform']) row[headerMap['Platform'] - 1] = normalized.platform;
  if (headerMap['Listing URL']) row[headerMap['Listing URL'] - 1] = normalized.listingUrl;
  if (headerMap['Device Type']) row[headerMap['Device Type'] - 1] = normalized.deviceType;
  if (headerMap['Brand']) row[headerMap['Brand'] - 1] = normalized.brand;
  if (headerMap['Model']) row[headerMap['Model'] - 1] = normalized.model;
  if (headerMap['Variant']) row[headerMap['Variant'] - 1] = normalized.variant;
  if (headerMap['Storage']) row[headerMap['Storage'] - 1] = normalized.storage;
  if (headerMap['Carrier']) row[headerMap['Carrier'] - 1] = normalized.carrier;
  if (headerMap['Condition (Raw)']) row[headerMap['Condition (Raw)'] - 1] = normalized.conditionRaw;
  if (headerMap['Condition (Normalized)']) row[headerMap['Condition (Normalized)'] - 1] = normalized.conditionNormalized;
  if (headerMap['Asking Price']) row[headerMap['Asking Price'] - 1] = normalized.askingPrice;
  if (headerMap['Location']) row[headerMap['Location'] - 1] = normalized.location;
  if (headerMap['Seller ZIP']) row[headerMap['Seller ZIP'] - 1] = normalized.sellerZip;
  if (headerMap['Title']) row[headerMap['Title'] - 1] = normalized.title;
  if (headerMap['Seller Name']) row[headerMap['Seller Name'] - 1] = normalized.sellerName;
  if (headerMap['Seller Contact']) row[headerMap['Seller Contact'] - 1] = normalized.sellerContact;
  if (headerMap['Last Updated']) row[headerMap['Last Updated'] - 1] = new Date();

  // Initialize analysis fields with defaults
  if (headerMap['Lead Synced?']) row[headerMap['Lead Synced?'] - 1] = 'NO';
  if (headerMap['CRM Status']) row[headerMap['CRM Status'] - 1] = 'NEW';
  if (headerMap['Hot Seller?']) row[headerMap['Hot Seller?'] - 1] = 'NO';

  return row;
}

// =============================================================================
// PLATFORM & DEVICE DETECTION
// =============================================================================

/**
 * Detect platform from text or source sheet
 * @param {string} platformText - Platform text from import
 * @param {string} sourceSheet - Source sheet name
 * @returns {string} Detected platform name
 */
function TM_detectPlatform(platformText, sourceSheet) {
  if (platformText) {
    const lower = platformText.toLowerCase();
    if (lower.includes('facebook') || lower.includes('fb')) return 'Facebook';
    if (lower.includes('craigslist') || lower.includes('cl')) return 'Craigslist';
    if (lower.includes('offerup') || lower.includes('offer up')) return 'OfferUp';
    if (lower.includes('ebay')) return 'eBay';
  }

  // Detect from source sheet name
  if (sourceSheet.includes('FB')) return 'Facebook';
  if (sourceSheet.includes('CL')) return 'Craigslist';
  if (sourceSheet.includes('OU')) return 'OfferUp';
  if (sourceSheet.includes('EBAY')) return 'eBay';

  return 'Other';
}

/**
 * Guess device type from title
 * @param {string} title - Listing title
 * @returns {string} Device type
 */
function TM_guessDeviceType(title) {
  if (!title) return 'Unknown';
  const lower = title.toLowerCase();

  if (lower.includes('iphone')) return 'iPhone';
  if (lower.includes('ipad')) return 'iPad';
  if (lower.includes('macbook')) return 'MacBook';
  if (lower.includes('airpods')) return 'AirPods';
  if (lower.includes('apple watch')) return 'Apple Watch';
  if (lower.includes('galaxy watch')) return 'Samsung Watch';
  if (lower.includes('galaxy tab')) return 'Samsung Tablet';
  if (lower.includes('galaxy') || lower.includes('samsung')) return 'Samsung Galaxy';
  if (lower.includes('pixel')) return 'Google Pixel';
  if (lower.includes('oneplus')) return 'OnePlus';

  return 'Other';
}

/**
 * Guess brand from title
 * @param {string} title - Listing title
 * @returns {string} Brand name
 */
function TM_guessBrand(title) {
  if (!title) return 'Unknown';
  const lower = title.toLowerCase();

  if (lower.includes('iphone') || lower.includes('ipad') ||
      lower.includes('apple') || lower.includes('macbook') ||
      lower.includes('airpods')) return 'Apple';
  if (lower.includes('samsung') || lower.includes('galaxy')) return 'Samsung';
  if (lower.includes('google') || lower.includes('pixel')) return 'Google';
  if (lower.includes('oneplus')) return 'OnePlus';
  if (lower.includes('motorola') || lower.includes('moto')) return 'Motorola';
  if (lower.includes('lg')) return 'LG';
  if (lower.includes('sony') || lower.includes('xperia')) return 'Sony';

  return 'Unknown';
}

/**
 * Guess model from title
 * @param {string} title - Listing title
 * @param {string} brand - Detected brand
 * @returns {string} Model name
 */
function TM_guessModel(title, brand) {
  if (!title) return 'Unknown';

  // iPhone patterns
  const iphoneMatch = title.match(/iphone\s*(\d+)?\s*(pro)?\s*(max|plus)?/i);
  if (iphoneMatch) {
    let model = 'iPhone';
    if (iphoneMatch[1]) model += ' ' + iphoneMatch[1];
    if (iphoneMatch[2]) model += ' ' + iphoneMatch[2];
    if (iphoneMatch[3]) model += ' ' + iphoneMatch[3];
    return model.trim();
  }

  // Samsung Galaxy patterns
  const galaxyMatch = title.match(/galaxy\s*(s|a|z|note)?\s*(\d+)?\s*(ultra|plus|\+|fold|flip)?/i);
  if (galaxyMatch) {
    let model = 'Galaxy';
    if (galaxyMatch[1]) model += ' ' + galaxyMatch[1].toUpperCase();
    if (galaxyMatch[2]) model += galaxyMatch[2];
    if (galaxyMatch[3]) {
      const suffix = galaxyMatch[3].toLowerCase();
      if (suffix === '+') model += '+';
      else model += ' ' + galaxyMatch[3].charAt(0).toUpperCase() + galaxyMatch[3].slice(1);
    }
    return model.trim();
  }

  // Google Pixel patterns
  const pixelMatch = title.match(/pixel\s*(\d+)?\s*(a|pro|xl)?/i);
  if (pixelMatch) {
    let model = 'Pixel';
    if (pixelMatch[1]) model += ' ' + pixelMatch[1];
    if (pixelMatch[2]) model += ' ' + pixelMatch[2];
    return model.trim();
  }

  return 'Unknown';
}

/**
 * Guess variant from title/model
 * @param {string} title - Listing title
 * @param {string} model - Detected model
 * @returns {string} Variant or empty string
 */
function TM_guessVariant(title, model) {
  // For most devices, variant is empty
  // Could be used for color or special editions
  return '';
}

/**
 * Extract ZIP code from location text
 * @param {string} text - Location text
 * @returns {string} ZIP code or empty string
 */
function TM_extractZip(text) {
  if (!text) return '';

  // US ZIP code pattern (5 digits, optionally with -4)
  const zipMatch = text.match(/\b(\d{5})(?:-\d{4})?\b/);
  if (zipMatch) {
    return zipMatch[1];
  }

  return '';
}

/**
 * Guess condition from description text
 * @param {string} description - Listing description
 * @returns {string} Guessed condition
 */
function TM_guessConditionFromDescription(description) {
  if (!description) return 'Unknown';
  const lower = description.toLowerCase();

  // Check for condition keywords
  for (const condition in TM_CONDITION_TO_GRADE) {
    if (lower.includes(condition)) {
      // Return a more readable version
      return condition.charAt(0).toUpperCase() + condition.slice(1);
    }
  }

  return 'Unknown';
}

/**
 * Normalize condition text to standard format
 * @param {string} condition - Raw condition text
 * @returns {string} Normalized condition
 */
function TM_normalizeCondition(condition) {
  if (!condition) return 'Unknown';

  const lower = TM_cleanString(condition);

  // Map to standard conditions
  for (const key in TM_CONDITION_TO_GRADE) {
    if (lower.includes(key)) {
      // Return the standard condition name
      if (key.includes('new') || key === 'mint' || key === 'pristine' || key === 'flawless' || key === 'sealed') {
        return 'Like New';
      }
      if (key.includes('excellent') || key.includes('near') || key.includes('great') || key === 'very good') {
        return 'Excellent';
      }
      if (key.includes('good') || key.includes('minor') || key.includes('normal')) {
        return 'Good';
      }
      if (key.includes('fair') || key.includes('acceptable') || key.includes('moderate') || key.includes('cosmetic')) {
        return 'Fair';
      }
      if (key.includes('poor') || key.includes('rough') || key.includes('used') || key === 'damaged') {
        return 'Poor';
      }
      if (key.includes('broken') || key.includes('parts') || key.includes('dead') || key.includes('shattered')) {
        return 'Broken/DOA';
      }
    }
  }

  return 'Unknown';
}

// =============================================================================
// DEDUPLICATION
// =============================================================================

/**
 * Remove duplicate entries from MASTER_DEVICE_DB
 * Call this manually if needed to clean up duplicates
 */
function TM_removeDuplicates() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(TM_SHEETS.MASTER_DEVICE_DB);

  if (!masterSheet || masterSheet.getLastRow() < 2) {
    TM_showToast('No data to deduplicate', 'Info');
    return;
  }

  TM_showToast('Removing duplicates...', 'Deduplication', 30);

  const data = TM_sheetToObjects(masterSheet);
  const seen = new Set();
  const unique = [];
  let duplicates = 0;

  data.forEach(function(row) {
    const key = TM_createDedupeKey(row);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(row);
    } else {
      duplicates++;
    }
  });

  if (duplicates === 0) {
    TM_showToast('No duplicates found', 'Info');
    return;
  }

  // Rebuild sheet with unique rows
  const headers = TM_HEADERS_MASTER;
  const uniqueData = TM_objectsToArray(unique, headers);

  TM_clearAndPopulate(masterSheet, headers, uniqueData);

  TM_logEvent(TM_LOG_TYPES.SUCCESS, 'TM_removeDuplicates',
    `Removed ${duplicates} duplicate entries`);
  TM_showToast(`Removed ${duplicates} duplicates`, 'Success', 5);
}

// =============================================================================
// SYNC FROM SPECIFIC SHEET
// =============================================================================

/**
 * Sync from a specific import sheet only
 * @param {string} sheetName - Name of the import sheet
 */
function TM_syncFromSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(TM_SHEETS.MASTER_DEVICE_DB);

  if (!masterSheet) {
    TM_showAlert('MASTER_DEVICE_DB sheet not found. Please run Setup first.');
    return;
  }

  const existingData = TM_getExistingMasterData(masterSheet);
  const existingKeys = new Set(existingData.map(row => row.dedupeKey));

  const result = TM_processImportSheet(ss, sheetName, existingKeys, masterSheet);

  const message = `Synced ${sheetName}: ${result.imported} new, ${result.duplicates} duplicates`;
  TM_logEvent(TM_LOG_TYPES.SUCCESS, 'TM_syncFromSheet', message);
  TM_showToast(message, 'Sync Complete', 5);
}

/**
 * Clear master database (use with caution)
 */
function TM_clearMasterDatabase() {
  const confirmed = TM_showConfirm(
    'This will delete ALL data in MASTER_DEVICE_DB. Are you sure?',
    'Clear Master Database'
  );

  if (!confirmed) {
    TM_showToast('Operation cancelled', 'Info');
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(TM_SHEETS.MASTER_DEVICE_DB);

  if (!masterSheet) return;

  if (masterSheet.getLastRow() > 1) {
    masterSheet.getRange(2, 1, masterSheet.getLastRow() - 1, masterSheet.getLastColumn())
               .clearContent();
  }

  TM_logEvent(TM_LOG_TYPES.WARNING, 'TM_clearMasterDatabase', 'Master database cleared');
  TM_showToast('Master database cleared', 'Complete', 5);
}
