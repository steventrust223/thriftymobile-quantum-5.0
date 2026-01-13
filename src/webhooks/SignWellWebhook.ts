/**
 * SignWell Webhook Handler
 * Receives document signing events from SignWell
 */

import { OneHashIntegration } from '../crm/OneHashIntegration';
import { SheetManager } from '../main/SheetManager';

export class SignWellWebhook {
  private static readonly PROCESSED_EVENTS_CACHE_KEY = 'signwell_processed_events';

  /**
   * Handle incoming webhook from SignWell
   */
  public static handleWebhook(payload: any): any {
    try {
      const eventId = payload.event_id || `${payload.document_id}_${payload.timestamp}`;

      // Check if already processed (idempotency)
      if (this.isEventProcessed(eventId)) {
        Logger.log(`SignWell event ${eventId} already processed, skipping`);
        return { success: true, message: 'Already processed' };
      }

      const eventType = payload.event || payload.type;
      Logger.log(`SignWell webhook received: ${eventType}`);

      let result: any;

      switch (eventType) {
        case 'document.sent':
          result = this.handleDocumentSent(payload);
          break;

        case 'document.viewed':
          result = this.handleDocumentViewed(payload);
          break;

        case 'document.signed':
          result = this.handleDocumentSigned(payload);
          break;

        case 'document.completed':
          result = this.handleDocumentCompleted(payload);
          break;

        case 'document.declined':
          result = this.handleDocumentDeclined(payload);
          break;

        default:
          Logger.log(`Unknown SignWell event type: ${eventType}`);
          return { success: true, message: 'Event type not handled' };
      }

      // Mark as processed
      this.markEventProcessed(eventId);

      return result;

    } catch (error) {
      Logger.log(`SignWell webhook error: ${error}`);

      const sheetManager = new SheetManager();
      sheetManager.logError(error as Error, 'SignWell Webhook');

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle document sent event
   */
  private static handleDocumentSent(payload: any): any {
    const dealId = payload.metadata?.deal_id;
    const documentId = payload.document_id;
    const timestamp = payload.timestamp || new Date().toISOString();

    if (!dealId) {
      Logger.log('No deal_id in document.sent event');
      return { success: true };
    }

    // Update Master Database
    this.updateDealColumn(dealId, 'Notes', `Agreement sent (${documentId})`);

    // Log to system
    const sheetManager = new SheetManager();
    sheetManager.log(`SignWell agreement sent for deal ${dealId}`, 'INFO');

    return { success: true };
  }

  /**
   * Handle document viewed event
   */
  private static handleDocumentViewed(payload: any): any {
    const dealId = payload.metadata?.deal_id;
    const timestamp = payload.timestamp || new Date().toISOString();

    if (!dealId) {
      Logger.log('No deal_id in document.viewed event');
      return { success: true };
    }

    // Update OneHash
    // Could add a viewed_at field to TM_Purchase

    Logger.log(`Agreement viewed for deal ${dealId}`);

    return { success: true };
  }

  /**
   * Handle document signed event
   */
  private static handleDocumentSigned(payload: any): any {
    const dealId = payload.metadata?.deal_id;
    const purchaseId = payload.metadata?.purchase_id;
    const recipientName = payload.recipient_name || '';
    const timestamp = payload.timestamp || new Date().toISOString();

    if (!dealId) {
      Logger.log('No deal_id in document.signed event');
      return { success: true };
    }

    Logger.log(`Agreement signed by ${recipientName} for deal ${dealId}`);

    // Update OneHash TM_Purchase
    if (purchaseId) {
      // Update purchase record with agreement_signed = true
      OneHashIntegration.createPurchase({
        dealId: dealId,
        agreementSigned: true,
        notes: `Agreement signed by ${recipientName} at ${timestamp}`
      });
    }

    // Update Master Database
    this.updateDealColumn(dealId, 'Status', 'Purchased');
    this.updateDealColumn(dealId, 'Notes', `Agreement signed: ${timestamp}`);

    // Log to system
    const sheetManager = new SheetManager();
    sheetManager.log(`Agreement signed for deal ${dealId}`, 'INFO');

    return { success: true };
  }

  /**
   * Handle document completed event (all parties signed)
   */
  private static handleDocumentCompleted(payload: any): any {
    const dealId = payload.metadata?.deal_id;
    const purchaseId = payload.metadata?.purchase_id;
    const documentUrl = payload.document_url || '';
    const timestamp = payload.timestamp || new Date().toISOString();

    if (!dealId) {
      Logger.log('No deal_id in document.completed event');
      return { success: true };
    }

    Logger.log(`Agreement completed for deal ${dealId}`);

    // Update OneHash TM_Purchase with signed document URL
    if (purchaseId) {
      OneHashIntegration.createPurchase({
        dealId: dealId,
        agreementSigned: true,
        notes: `Signed document: ${documentUrl}`
      });
    }

    // Trigger inventory creation if not already created
    // Could call OneHashIntegration.createInventoryItem() here

    // Update Master Database
    this.updateDealColumn(dealId, 'Notes', `Agreement completed: ${documentUrl}`);

    // Log to system
    const sheetManager = new SheetManager();
    sheetManager.log(`Agreement completed for deal ${dealId}`, 'INFO');

    return { success: true };
  }

  /**
   * Handle document declined event
   */
  private static handleDocumentDeclined(payload: any): any {
    const dealId = payload.metadata?.deal_id;
    const recipientName = payload.recipient_name || '';
    const timestamp = payload.timestamp || new Date().toISOString();

    if (!dealId) {
      Logger.log('No deal_id in document.declined event');
      return { success: true };
    }

    Logger.log(`⚠️ Agreement declined by ${recipientName} for deal ${dealId}`);

    // Update OneHash deal status
    OneHashIntegration.updateDealStatus(dealId, 'LOST' as any);

    // Update Master Database
    this.updateDealColumn(dealId, 'Status', 'Lost');
    this.updateDealColumn(dealId, 'Notes', `Agreement declined by ${recipientName}`);

    // Log to system
    const sheetManager = new SheetManager();
    sheetManager.log(`Agreement declined for deal ${dealId}`, 'WARNING');

    return { success: true };
  }

  /**
   * Check if event has been processed (idempotency)
   */
  private static isEventProcessed(eventId: string): boolean {
    const cache = CacheService.getScriptCache();
    const cacheKey = `${this.PROCESSED_EVENTS_CACHE_KEY}_${eventId}`;
    return cache.get(cacheKey) !== null;
  }

  /**
   * Mark event as processed (cache for 24 hours)
   */
  private static markEventProcessed(eventId: string): void {
    const cache = CacheService.getScriptCache();
    const cacheKey = `${this.PROCESSED_EVENTS_CACHE_KEY}_${eventId}`;
    cache.put(cacheKey, 'true', 86400); // 24 hours
  }

  /**
   * Update deal column in Master Database
   */
  private static updateDealColumn(dealId: string, columnName: string, value: any): void {
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Master Database');
      if (!sheet) return;

      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const colIndex = headers.indexOf(columnName);

      if (colIndex === -1) {
        Logger.log(`Column not found: ${columnName}`);
        return;
      }

      // Find row with deal_id
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === dealId) {
          sheet.getRange(i + 1, colIndex + 1).setValue(value);
          Logger.log(`Updated ${columnName} for deal ${dealId}`);
          return;
        }
      }

      Logger.log(`Deal not found: ${dealId}`);
    } catch (error) {
      Logger.log(`Error updating deal column: ${error}`);
    }
  }
}
