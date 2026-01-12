/**
 * SMS-iT CRM Integration
 * Handles automated messaging and seller communication
 */

import { Config } from '../main/Config';
import { Deal } from '../types/Deal';

export interface SMSMessage {
  to: string;
  message: string;
  dealId: string;
}

export class SMSITIntegration {
  private static readonly API_BASE_URL = 'https://api.sms-it.com/v1';

  /**
   * Send SMS message to seller
   */
  public static sendMessage(phoneNumber: string, message: string, dealId?: string): boolean {
    try {
      const apiKey = Config.get('SMSIT_API_KEY');
      if (!apiKey) {
        Logger.log('SMS-iT API key not configured');
        return false;
      }

      const endpoint = `${this.API_BASE_URL}/sms/send`;

      const payload = {
        to: this.formatPhoneNumber(phoneNumber),
        message: message,
        from: Config.get('SMSIT_SENDER_ID') || 'ThriftyMobile',
        metadata: {
          dealId: dealId || '',
          source: 'thriftymobile-quantum'
        }
      };

      const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: 'post',
        contentType: 'application/json',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };

      const response = UrlFetchApp.fetch(endpoint, options);
      const responseCode = response.getResponseCode();

      if (responseCode === 200 || responseCode === 201) {
        Logger.log(`SMS sent successfully to ${phoneNumber} for deal ${dealId}`);
        this.logMessage(phoneNumber, message, dealId || '', 'sent');
        return true;
      } else {
        Logger.log(`SMS send failed: ${responseCode} - ${response.getContentText()}`);
        return false;
      }
    } catch (error) {
      Logger.log(`Error sending SMS: ${error}`);
      return false;
    }
  }

  /**
   * Send offer message for a deal
   */
  public static sendOfferMessage(deal: Deal): boolean {
    if (!deal.seller.phone) {
      Logger.log(`No phone number for deal ${deal.id}`);
      return false;
    }

    const message = deal.aiAnalysis.suggestedMessage;
    return this.sendMessage(deal.seller.phone, message, deal.id);
  }

  /**
   * Send bulk messages to multiple deals
   */
  public static sendBulkOffers(deals: Deal[]): { sent: number; failed: number } {
    let sent = 0;
    let failed = 0;

    for (const deal of deals) {
      if (this.sendOfferMessage(deal)) {
        sent++;
      } else {
        failed++;
      }

      // Rate limiting - 1 message per second
      Utilities.sleep(1000);
    }

    Logger.log(`Bulk send complete: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }

  /**
   * Format phone number
   */
  private static formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // Add +1 for US numbers if not present
    if (cleaned.length === 10) {
      cleaned = '1' + cleaned;
    }

    return '+' + cleaned;
  }

  /**
   * Log message to Seller CRM sheet
   */
  private static logMessage(phone: string, message: string, dealId: string, status: string): void {
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Seller CRM');
      if (!sheet) return;

      sheet.appendRow([
        new Date(),
        dealId,
        phone,
        'SMS',
        message.substring(0, 500),
        status,
        ''
      ]);
    } catch (error) {
      Logger.log(`Error logging message: ${error}`);
    }
  }

  /**
   * Create or update contact in SMS-iT
   */
  public static createContact(seller: any): boolean {
    try {
      const apiKey = Config.get('SMSIT_API_KEY');
      if (!apiKey) return false;

      const endpoint = `${this.API_BASE_URL}/contacts`;

      const payload = {
        phone: this.formatPhoneNumber(seller.phone),
        name: seller.name || 'Unknown',
        location: seller.location || '',
        tags: ['thriftymobile', 'phone-seller'],
        customFields: {
          averageResponseTime: seller.responseTime || '',
          previousDeals: seller.previousDeals || 0,
          isHotSeller: seller.isHotSeller || false
        }
      };

      const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: 'post',
        contentType: 'application/json',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };

      const response = UrlFetchApp.fetch(endpoint, options);
      return response.getResponseCode() === 200 || response.getResponseCode() === 201;
    } catch (error) {
      Logger.log(`Error creating contact: ${error}`);
      return false;
    }
  }

  /**
   * Get conversation history for a phone number
   */
  public static getConversationHistory(phoneNumber: string): any[] {
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Seller CRM');
      if (!sheet) return [];

      const data = sheet.getDataRange().getValues();
      const messages: any[] = [];

      for (let i = 1; i < data.length; i++) {
        if (data[i][2] === phoneNumber) {
          messages.push({
            timestamp: data[i][0],
            dealId: data[i][1],
            type: data[i][3],
            message: data[i][4],
            status: data[i][5]
          });
        }
      }

      return messages;
    } catch (error) {
      Logger.log(`Error getting conversation history: ${error}`);
      return [];
    }
  }

  /**
   * Send follow-up message
   */
  public static sendFollowUp(deal: Deal, customMessage?: string): boolean {
    const message = customMessage || this.generateFollowUpMessage(deal);
    return this.sendMessage(deal.seller.phone || '', message, deal.id);
  }

  /**
   * Generate follow-up message
   */
  private static generateFollowUpMessage(deal: Deal): string {
    return `Hi! Following up on the ${deal.device.brand} ${deal.device.model}. Still available? I'm ready to buy today with cash.`;
  }

  /**
   * Test SMS-iT connection
   */
  public static testConnection(): boolean {
    try {
      const apiKey = Config.get('SMSIT_API_KEY');
      if (!apiKey) return false;

      const endpoint = `${this.API_BASE_URL}/account`;

      const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: 'get',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        muteHttpExceptions: true
      };

      const response = UrlFetchApp.fetch(endpoint, options);
      return response.getResponseCode() === 200;
    } catch (error) {
      Logger.log(`SMS-iT connection test failed: ${error}`);
      return false;
    }
  }
}
