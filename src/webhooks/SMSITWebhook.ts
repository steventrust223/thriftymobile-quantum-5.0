/**
 * SMS-iT Webhook Handler
 * Receives and processes SMS-iT events (messages, delivery status, etc.)
 */

import { OneHashIntegration } from '../crm/OneHashIntegration';
import { SheetManager } from '../main/SheetManager';

export class SMSITWebhook {
  /**
   * Handle incoming webhook from SMS-iT
   */
  public static handleWebhook(payload: any): any {
    try {
      const eventType = payload.event || payload.type;

      Logger.log(`SMS-iT webhook received: ${eventType}`);

      switch (eventType) {
        case 'message.sent':
          return this.handleMessageSent(payload);

        case 'message.delivered':
          return this.handleMessageDelivered(payload);

        case 'message.received':
          return this.handleMessageReceived(payload);

        case 'message.read':
          return this.handleMessageRead(payload);

        case 'contact.updated':
          return this.handleContactUpdated(payload);

        default:
          Logger.log(`Unknown SMS-iT event type: ${eventType}`);
          return { success: true, message: 'Event type not handled' };
      }
    } catch (error) {
      Logger.log(`SMS-iT webhook error: ${error}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle message sent event
   */
  private static handleMessageSent(payload: any): any {
    const dealId = payload.custom_fields?.deal_id || payload.metadata?.dealId;
    const phone = payload.contact?.phone || payload.phone;
    const message = payload.message || payload.body;
    const timestamp = payload.timestamp || new Date().toISOString();

    if (!dealId) {
      Logger.log('No deal_id in message.sent event');
      return { success: true };
    }

    // Log to OneHash TM_Conversation
    OneHashIntegration.logConversation({
      dealId: dealId,
      direction: 'OUTBOUND',
      channel: 'SMS',
      messageBody: message,
      sentAt: timestamp
    });

    // Update Master Database "Last Contacted" column
    this.updateDealColumn(dealId, 'Last Contacted', timestamp);

    return { success: true };
  }

  /**
   * Handle message delivered event
   */
  private static handleMessageDelivered(payload: any): any {
    // Update delivery status in OneHash if needed
    Logger.log('Message delivered');
    return { success: true };
  }

  /**
   * Handle incoming message from seller
   */
  private static handleMessageReceived(payload: any): any {
    const dealId = payload.custom_fields?.deal_id || payload.metadata?.dealId;
    const phone = payload.contact?.phone || payload.from || payload.phone;
    const message = payload.message || payload.body || '';
    const timestamp = payload.timestamp || new Date().toISOString();

    Logger.log(`Received message from ${phone}: ${message}`);

    if (!dealId) {
      Logger.log('No deal_id in message.received event');
      return { success: true };
    }

    // Log to OneHash TM_Conversation
    OneHashIntegration.logConversation({
      dealId: dealId,
      direction: 'INBOUND',
      channel: 'SMS',
      messageBody: message,
      sentAt: timestamp
    });

    // Classify intent
    const intent = this.classifyIntent(message);
    const containsPrice = /\$?\d+/.test(message);
    const extractedPrice = containsPrice ? this.extractPrice(message) : null;

    // Update conversation with intent
    if (intent) {
      OneHashIntegration.logConversation({
        dealId: dealId,
        direction: 'INBOUND',
        channel: 'SMS',
        messageBody: message,
        sentAt: timestamp,
        intentDetected: intent,
        containsPrice: containsPrice,
        extractedPrice: extractedPrice
      });
    }

    // Handle intent-specific actions
    this.handleIntent(dealId, intent, extractedPrice);

    // Update Master Database "Last Response" column
    this.updateDealColumn(dealId, 'Last Response', timestamp);

    return { success: true, intent: intent };
  }

  /**
   * Handle message read event
   */
  private static handleMessageRead(payload: any): any {
    Logger.log('Message read by recipient');
    return { success: true };
  }

  /**
   * Handle contact updated event
   */
  private static handleContactUpdated(payload: any): any {
    // Sync contact fields back to OneHash if needed
    Logger.log('Contact updated');
    return { success: true };
  }

  /**
   * Classify message intent
   */
  private static classifyIntent(message: string): string {
    const lower = message.toLowerCase();

    // Agreement indicators
    if (/\b(yes|sure|okay|ok|deal|sounds good|works for me|i'll take it|let's do it)\b/.test(lower)) {
      return 'INTERESTED';
    }

    // Counter offer indicators
    if (/(too low|more|higher|can you do|what about|how about|\$\d+)/.test(lower)) {
      return 'NEGOTIATING';
    }

    // Scam indicators
    if (/(cashapp|zelle first|venmo first|paypal first|send money|western union|gift card|bitcoin|crypto)/.test(lower)) {
      return 'SCAM_DETECTED';
    }

    // Rejection indicators
    if (/\b(no|not interested|sold|changed mind|too late|already sold|not selling)\b/.test(lower)) {
      return 'REJECTED';
    }

    // Question indicators
    if (/\b(how|what|when|where|why|can you|could you|is it|does it|will you)\b/.test(lower)) {
      return 'OBJECTING';
    }

    // Appointment indicators
    if (/\b(meet|today|tomorrow|tonight|this week|available|free|location|address|where)\b/.test(lower)) {
      return 'APPOINTMENT_REQUEST';
    }

    return 'RESPONDED';
  }

  /**
   * Extract price from message
   */
  private static extractPrice(message: string): number | null {
    const match = message.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    if (match) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
    return null;
  }

  /**
   * Handle intent-specific actions
   */
  private static handleIntent(dealId: string, intent: string, extractedPrice?: number | null): void {
    switch (intent) {
      case 'INTERESTED':
        // Update deal status to NEGOTIATING
        OneHashIntegration.updateDealStatus(dealId, 'NEGOTIATING' as any);
        this.updateDealColumn(dealId, 'Status', 'Negotiating');
        break;

      case 'NEGOTIATING':
        if (extractedPrice) {
          // Log counter offer
          Logger.log(`Counter offer: $${extractedPrice} for deal ${dealId}`);
          // Could trigger approval workflow if over MAO
        }
        break;

      case 'SCAM_DETECTED':
        // Flag deal and seller
        this.updateDealColumn(dealId, 'Notes', 'SCAM INDICATOR DETECTED');
        this.updateDealColumn(dealId, 'Status', 'Passed');
        Logger.log(`⚠️ SCAM DETECTED for deal ${dealId}`);
        break;

      case 'REJECTED':
        // Update status to LOST
        OneHashIntegration.updateDealStatus(dealId, 'LOST' as any);
        this.updateDealColumn(dealId, 'Status', 'Lost');
        break;

      case 'APPOINTMENT_REQUEST':
        // Could trigger calendar invite workflow
        Logger.log(`Appointment requested for deal ${dealId}`);
        break;
    }
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
