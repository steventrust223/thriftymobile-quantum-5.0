/**
 * ===== FILE: TM_ui.gs =====
 * 📱💰 Thrifty Mobile Quantum 5.0 - UI Functions
 *
 * This file contains functions to display HTML sidebars and dialogs,
 * and server-side functions called from the UI.
 */

// =============================================================================
// MAIN UI DISPLAY FUNCTIONS
// =============================================================================

/**
 * Show the Control Center sidebar
 */
function TM_showControlCenter() {
  const html = HtmlService.createHtmlOutputFromFile('tm_control_center')
    .setTitle('📱💰 Control Center')
    .setWidth(350);

  SpreadsheetApp.getUi().showSidebar(html);

  TM_logEvent(TM_LOG_TYPES.INFO, 'TM_showControlCenter', 'Control Center opened');
}

/**
 * Show the Settings dialog
 */
function TM_showSettingsDialog() {
  const html = HtmlService.createHtmlOutputFromFile('tm_settings')
    .setWidth(500)
    .setHeight(500);

  SpreadsheetApp.getUi().showModalDialog(html, '⚙️ Settings');

  TM_logEvent(TM_LOG_TYPES.INFO, 'TM_showSettingsDialog', 'Settings dialog opened');
}

/**
 * Show the Help dialog
 */
function TM_showHelpDialog() {
  const html = HtmlService.createHtmlOutputFromFile('tm_help')
    .setWidth(550)
    .setHeight(500);

  SpreadsheetApp.getUi().showModalDialog(html, '📚 Help & Overview');
}

/**
 * Show the Smart Outreach sidebar
 */
function TM_showSmartOutreach() {
  const html = HtmlService.createHtmlOutputFromFile('tm_smart_outreach')
    .setTitle('💬 Smart Outreach')
    .setWidth(400);

  SpreadsheetApp.getUi().showSidebar(html);

  TM_logEvent(TM_LOG_TYPES.INFO, 'TM_showSmartOutreach', 'Smart Outreach opened');
}

// =============================================================================
// SERVER-SIDE FUNCTIONS FOR UI
// =============================================================================

/**
 * Get recent logs for Control Center display
 * @returns {Array} Recent log entries
 */
function TM_getRecentLogsForUi() {
  const logs = TM_getRecentLogs(10);

  return logs.map(function(log) {
    return {
      timestamp: TM_formatDateShort(log.timestamp),
      type: log.type,
      message: log.message.substring(0, 100)
    };
  });
}

/**
 * Get current settings for Settings dialog
 * @returns {Array} Settings array
 */
function TM_getSettingsForUi() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName(TM_SHEETS.SETTINGS);

  if (!settingsSheet || settingsSheet.getLastRow() < 2) {
    return TM_DEFAULT_SETTINGS.map(function(row) {
      return {
        name: row[0],
        value: row[1],
        description: row[2],
        category: row[3]
      };
    });
  }

  const data = TM_sheetToObjects(settingsSheet);

  return data.map(function(row) {
    return {
      name: row['Setting Name'],
      value: row['Value'],
      description: row['Description'],
      category: row['Category']
    };
  });
}

/**
 * Save settings from UI
 * @param {Object} formData - Form data from settings dialog
 * @returns {Object} Result
 */
function TM_saveSettingsFromUi(formData) {
  try {
    for (const key in formData) {
      if (formData.hasOwnProperty(key)) {
        TM_updateSetting(key, formData[key]);
      }
    }

    TM_logEvent(TM_LOG_TYPES.SUCCESS, 'TM_saveSettingsFromUi', 'Settings saved');
    return {success: true, message: 'Settings saved successfully'};

  } catch (error) {
    TM_logEvent(TM_LOG_TYPES.ERROR, 'TM_saveSettingsFromUi', error.message);
    return {success: false, message: error.message};
  }
}

/**
 * Run sync from UI
 * @returns {Object} Result
 */
function TM_runSyncFromUi() {
  try {
    TM_runFullSync();
    return {success: true, message: 'Sync completed successfully'};
  } catch (error) {
    return {success: false, message: error.message};
  }
}

/**
 * Run full analysis from UI
 * @returns {Object} Result
 */
function TM_runAnalysisFromUi() {
  try {
    TM_runFullAnalysis();
    return {success: true, message: 'Analysis completed successfully'};
  } catch (error) {
    return {success: false, message: error.message};
  }
}

/**
 * Rebuild verdict from UI
 * @returns {Object} Result
 */
function TM_rebuildVerdictFromUi() {
  try {
    TM_rebuildVerdictSheet();
    return {success: true, message: 'Verdict sheet rebuilt successfully'};
  } catch (error) {
    return {success: false, message: error.message};
  }
}

/**
 * Update dashboard from UI
 * @returns {Object} Result
 */
function TM_updateDashboardFromUi() {
  try {
    TM_updateDashboardAnalytics();
    return {success: true, message: 'Dashboard updated successfully'};
  } catch (error) {
    return {success: false, message: error.message};
  }
}

// =============================================================================
// OUTREACH UI FUNCTIONS
// =============================================================================

/**
 * Mark deal as contacted from UI
 * @param {string} masterId - Device master ID
 * @returns {Object} Result
 */
function TM_markContactedFromUi(masterId) {
  try {
    TM_markAsContacted(masterId);
    return {success: true, message: 'Marked as contacted'};
  } catch (error) {
    return {success: false, message: error.message};
  }
}

/**
 * Mark deal as scheduled from UI
 * @param {string} masterId - Device master ID
 * @returns {Object} Result
 */
function TM_markScheduledFromUi(masterId) {
  try {
    TM_markAsScheduled(masterId);
    return {success: true, message: 'Marked as scheduled'};
  } catch (error) {
    return {success: false, message: error.message};
  }
}

/**
 * Update lead status
 * @param {string} masterId - Device master ID
 * @param {string} status - New status
 * @param {string} notes - Optional notes
 * @returns {Object} Result
 */
function TM_updateLeadStatusFromUi(masterId, status, notes) {
  try {
    // Update in master sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const masterSheet = ss.getSheetByName(TM_SHEETS.MASTER_DEVICE_DB);

    if (!masterSheet) {
      return {success: false, message: 'Master sheet not found'};
    }

    const headerMap = TM_getHeaderMap(masterSheet);
    const idCol = headerMap['ID'];
    const statusCol = headerMap['CRM Status'];
    const notesCol = headerMap['Auto Notes'];

    if (!idCol) return {success: false, message: 'ID column not found'};

    const ids = masterSheet.getRange(2, idCol, masterSheet.getLastRow() - 1, 1).getValues();

    for (let i = 0; i < ids.length; i++) {
      if (ids[i][0] === masterId) {
        if (statusCol) {
          masterSheet.getRange(i + 2, statusCol).setValue(status);
        }
        if (notesCol && notes) {
          const existingNotes = masterSheet.getRange(i + 2, notesCol).getValue() || '';
          masterSheet.getRange(i + 2, notesCol).setValue(existingNotes + ' ' + notes);
        }
        break;
      }
    }

    TM_logEvent(TM_LOG_TYPES.OUTREACH, 'TM_updateLeadStatusFromUi',
      `Updated status to ${status} for ${masterId}`);

    return {success: true, message: 'Lead status updated'};

  } catch (error) {
    return {success: false, message: error.message};
  }
}

// =============================================================================
// INTEGRATION FUNCTIONS (called from UI)
// =============================================================================

/**
 * Send SMS from Smart Outreach UI
 * Uses configured SMS provider (SMS-iT, Twilio, or webhook)
 * @param {string} masterId - Device master ID
 * @returns {Object} Result with success status and message details
 */
function TM_sendSmsFromUi(masterId) {
  try {
    // Get deal info
    const deals = TM_getTopDeals(100);
    const deal = deals.find(function(d) {
      return d['Master ID'] === masterId;
    });

    if (!deal) {
      return {success: false, message: 'Deal not found'};
    }

    const contact = {
      phone: deal['Seller Contact'],
      name: deal['Seller Name']
    };

    const message = deal['Auto Seller Message'];

    // Validate contact info
    if (!contact.phone) {
      return {success: false, message: 'No phone number available for this seller'};
    }

    // Send SMS using the configured provider
    const result = TM_sendSms(contact, message);

    // Update lead status if SMS was sent or prepared
    if (result.success) {
      TM_markContactedFromUi(masterId);
    }

    return {
      success: result.success,
      message: result.message,
      messageId: result.messageId,
      manualOnly: result.manualOnly || false,
      payload: result.payload || null
    };

  } catch (error) {
    TM_logEvent(TM_LOG_TYPES.ERROR, 'TM_sendSmsFromUi', 'SMS failed: ' + error.message);
    return {success: false, message: 'SMS error: ' + error.message};
  }
}

/**
 * Sync lead to CRM from UI
 * Uses configured CRM provider (SMS-iT, OneHash, OhmyLead, or webhook)
 * @param {string} masterId - Device master ID
 * @returns {Object} Result with success status and external ID
 */
function TM_syncToCrmFromUi(masterId) {
  try {
    // Get device info from master sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const masterSheet = ss.getSheetByName(TM_SHEETS.MASTER_DEVICE_DB);

    if (!masterSheet) {
      return {success: false, message: 'Master sheet not found'};
    }

    const data = TM_sheetToObjects(masterSheet);
    const device = data.find(function(d) {
      return d['ID'] === masterId;
    });

    if (!device) {
      return {success: false, message: 'Device not found'};
    }

    // Validate seller info
    if (!device['Seller Contact'] && !device['Seller Name']) {
      return {success: false, message: 'No seller contact information available'};
    }

    // Build lead data for CRM
    const leadData = {
      deviceId: masterId,
      sellerName: device['Seller Name'],
      sellerContact: device['Seller Contact'],
      deviceTitle: TM_createDeviceTitle(device),
      askingPrice: TM_parsePrice(device['Asking Price']),
      offerTarget: TM_parsePrice(device['Offer Target']),
      dealClass: device['Deal Class'] || '',
      platform: device['Platform'] || '',
      listingUrl: device['Listing URL'] || ''
    };

    // Sync to CRM using configured provider
    const result = TM_syncToCrm(leadData);

    // Update sync status in master sheet if successful
    if (result.success) {
      const headerMap = TM_getHeaderMap(masterSheet);
      const syncCol = headerMap['Lead Synced?'];
      const crmStatusCol = headerMap['CRM Status'];

      if (syncCol || crmStatusCol) {
        const ids = masterSheet.getRange(2, headerMap['ID'], masterSheet.getLastRow() - 1, 1).getValues();
        for (let i = 0; i < ids.length; i++) {
          if (ids[i][0] === masterId) {
            if (syncCol) masterSheet.getRange(i + 2, syncCol).setValue('YES');
            if (crmStatusCol) masterSheet.getRange(i + 2, crmStatusCol).setValue('SYNCED');
            break;
          }
        }
      }
    }

    return {
      success: result.success,
      message: result.message,
      externalId: result.externalId,
      localOnly: result.localOnly || false
    };

  } catch (error) {
    TM_logEvent(TM_LOG_TYPES.ERROR, 'TM_syncToCrmFromUi', 'CRM sync failed: ' + error.message);
    return {success: false, message: 'CRM sync error: ' + error.message};
  }
}

/**
 * Create e-signature document from UI
 * @param {string} masterId - Device master ID
 * @returns {Object} Result with success status and document URL
 */
function TM_createEsignFromUi(masterId) {
  try {
    // Get device info
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const masterSheet = ss.getSheetByName(TM_SHEETS.MASTER_DEVICE_DB);

    if (!masterSheet) {
      return {success: false, message: 'Master sheet not found'};
    }

    const data = TM_sheetToObjects(masterSheet);
    const device = data.find(function(d) {
      return d['ID'] === masterId;
    });

    if (!device) {
      return {success: false, message: 'Device not found'};
    }

    // Build deal data for e-signature
    const dealData = {
      id: masterId,
      deviceTitle: TM_createDeviceTitle(device),
      sellerName: device['Seller Name'],
      sellerContact: device['Seller Contact'],
      askingPrice: TM_parsePrice(device['Asking Price']),
      offerTarget: TM_parsePrice(device['Offer Target'])
    };

    // Create e-signature document
    const result = TM_createEsignDocument(dealData);

    return {
      success: result.success,
      message: result.message,
      documentId: result.documentId,
      documentUrl: result.documentUrl,
      localOnly: result.localOnly || false
    };

  } catch (error) {
    TM_logEvent(TM_LOG_TYPES.ERROR, 'TM_createEsignFromUi', 'E-sign failed: ' + error.message);
    return {success: false, message: 'E-sign error: ' + error.message};
  }
}

/**
 * Get integration status for UI display
 * @returns {Object} Integration status for CRM, SMS, and E-sign
 */
function TM_getIntegrationStatus() {
  const crmConfig = TM_getCrmConfig();
  const smsConfig = TM_getSmsConfig();
  const esignConfig = TM_getSignWellConfig();

  return {
    crm: {
      enabled: crmConfig.enabled,
      provider: crmConfig.provider,
      configured: crmConfig.apiKey || crmConfig.webhookUrl ? true : false
    },
    sms: {
      enabled: smsConfig.enabled,
      provider: smsConfig.provider,
      configured: smsConfig.apiKey || smsConfig.webhookUrl ? true : false
    },
    esign: {
      enabled: esignConfig.enabled,
      provider: esignConfig.provider,
      configured: esignConfig.apiKey || esignConfig.webhookUrl ? true : false
    }
  };
}

// =============================================================================
// UI HELPER FUNCTIONS
// =============================================================================

/**
 * Get version info for UI
 * @returns {Object} Version info
 */
function TM_getVersionInfo() {
  return TM_VERSION;
}

/**
 * Open a specific sheet
 * @param {string} sheetName - Name of sheet to open
 */
function TM_openSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);

  if (sheet) {
    ss.setActiveSheet(sheet);
  }
}

/**
 * Get help topics for help dialog
 * @returns {Array} Help topics
 */
function TM_getHelpTopics() {
  return [
    {
      title: 'Getting Started',
      content: '1. Run Setup to create all sheets\n2. Import data to IMPORT sheets\n3. Run Sync to normalize data\n4. Run Analysis to grade and match\n5. Check VERDICT for results'
    },
    {
      title: 'Import Data',
      content: 'Data comes from Browse.AI scrapes. Paste into the appropriate IMPORT sheet (FB, CL, OU, EBAY, OTHER) matching the column headers.'
    },
    {
      title: 'Grading System',
      content: 'Grades: A (Like New), B+ (Excellent), B (Good), C (Fair), D (Poor), DOA (Dead/Parts). Manual overrides are supported.'
    },
    {
      title: 'Deal Classes',
      content: 'HOT DEAL: 35%+ margin, $100+ profit\nSOLID DEAL: 20%+ margin, $50+ profit\nMARGINAL: 10%+ margin\nPASS: Below thresholds'
    },
    {
      title: 'Hot Sellers',
      content: 'Sellers with 3+ qualifying deals are marked as Hot Sellers and get priority in outreach.'
    }
  ];
}

/**
 * Check if setup has been run
 * @returns {boolean} True if sheets exist
 */
function TM_checkSetupComplete() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const requiredSheets = [
    TM_SHEETS.MASTER_DEVICE_DB,
    TM_SHEETS.VERDICT,
    TM_SHEETS.SETTINGS
  ];

  for (let i = 0; i < requiredSheets.length; i++) {
    if (!ss.getSheetByName(requiredSheets[i])) {
      return false;
    }
  }

  return true;
}

/**
 * Run initial setup if needed
 * @returns {Object} Result
 */
function TM_runSetupIfNeeded() {
  if (!TM_checkSetupComplete()) {
    TM_createOrUpdateSheets();
    return {success: true, message: 'Setup completed'};
  }
  return {success: true, message: 'Setup already complete'};
}
