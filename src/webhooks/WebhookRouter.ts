/**
 * Webhook Router
 * Routes incoming webhooks to appropriate handlers
 */

import { SMSITWebhook } from './SMSITWebhook';
import { OhmyLeadWebhook } from './OhmyLeadWebhook';
import { SignWellWebhook } from './SignWellWebhook';
import { SheetManager } from '../main/SheetManager';

/**
 * Main webhook entry point - called by Apps Script doPost
 */
function handleWebhookPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
  try {
    // Determine webhook source from endpoint parameter or headers
    const endpoint = e.parameter?.endpoint || e.parameter?.source;
    const contentType = e.postData?.type || 'application/json';

    Logger.log(`Webhook received - Endpoint: ${endpoint}, Type: ${contentType}`);

    // Parse payload
    let payload: any;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (error) {
      Logger.log(`Error parsing webhook payload: ${error}`);
      return createJsonResponse({ success: false, error: 'Invalid JSON payload' }, 400);
    }

    // Route to appropriate handler
    let result: any;

    switch (endpoint) {
      case 'smsit':
      case 'sms-it':
        result = SMSITWebhook.handleWebhook(payload);
        break;

      case 'ohmylead':
      case 'lead':
        result = OhmyLeadWebhook.handleWebhook(payload);
        break;

      case 'signwell':
      case 'sign':
        result = SignWellWebhook.handleWebhook(payload);
        break;

      default:
        // Try to auto-detect based on payload structure
        result = autoDetectAndRoute(payload);
        if (!result) {
          Logger.log(`Unknown webhook endpoint: ${endpoint}`);
          return createJsonResponse({
            success: false,
            error: 'Unknown webhook endpoint'
          }, 404);
        }
    }

    // Log successful webhook
    const sheetManager = new SheetManager();
    sheetManager.log(`Webhook processed: ${endpoint}`, 'INFO');

    return createJsonResponse(result, 200);

  } catch (error) {
    Logger.log(`Webhook router error: ${error}`);

    const sheetManager = new SheetManager();
    sheetManager.logError(error as Error, 'Webhook Router');

    return createJsonResponse({
      success: false,
      error: error.message
    }, 500);
  }
}

/**
 * Auto-detect webhook source based on payload structure
 */
function autoDetectAndRoute(payload: any): any | null {
  // SMS-iT webhooks typically have 'event' and 'contact' fields
  if (payload.event && (payload.contact || payload.phone || payload.message)) {
    Logger.log('Auto-detected SMS-iT webhook');
    return SMSITWebhook.handleWebhook(payload);
  }

  // OhmyLead webhooks have 'fields' or 'form_id'
  if (payload.fields || payload.form_id) {
    Logger.log('Auto-detected OhmyLead webhook');
    return OhmyLeadWebhook.handleWebhook(payload);
  }

  // SignWell webhooks have 'document_id' and 'event'
  if (payload.document_id && payload.event) {
    Logger.log('Auto-detected SignWell webhook');
    return SignWellWebhook.handleWebhook(payload);
  }

  return null;
}

/**
 * Create JSON response
 */
function createJsonResponse(data: any, statusCode: number = 200): GoogleAppsScript.Content.TextOutput {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);

  // Note: Apps Script doesn't support setting HTTP status codes directly
  // The status is always 200, but we include it in the response body
  if (statusCode !== 200) {
    data.http_status = statusCode;
  }

  return output;
}

/**
 * Handle GET requests (for webhook testing)
 */
function handleWebhookGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.Content.TextOutput {
  const endpoint = e.parameter?.endpoint || 'unknown';

  return createJsonResponse({
    success: true,
    message: 'ThriftyMobile Webhook Endpoint',
    endpoint: endpoint,
    timestamp: new Date().toISOString(),
    methods: ['POST'],
    supported_endpoints: ['smsit', 'ohmylead', 'signwell']
  });
}

// Export for global scope (Apps Script entry points)
(global as any).handleWebhookPost = handleWebhookPost;
(global as any).handleWebhookGet = handleWebhookGet;

// Also export as doPost/doGet for Apps Script
(global as any).doPost = handleWebhookPost;
(global as any).doGet = handleWebhookGet;
