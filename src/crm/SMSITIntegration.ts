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
   * Upsert contact with full deal context
   */
  public static upsertContact(deal: Deal): string | null {
    try {
      const apiKey = Config.get('SMSIT_API_KEY');
      if (!apiKey || !deal.seller.phone) return null;

      const endpoint = `${this.API_BASE_URL}/contacts`;

      const payload = {
        phone: this.formatPhoneNumber(deal.seller.phone),
        first_name: (deal.seller.name || 'Seller').split(' ')[0],
        last_name: (deal.seller.name || '').split(' ').slice(1).join(' '),
        email: deal.seller.email || '',
        custom_fields: {
          deal_id: deal.id,
          deal_ids: deal.id, // Will accumulate
          seller_id: '', // Will be set by OneHash
          platform: deal.platform,
          location: deal.seller.location || '',
          seller_type: 'Individual',
          is_hot_seller: deal.seller.isHotSeller || false,
          lifetime_deals: 1,
          lifetime_purchases: 0,
          risk_score: deal.aiAnalysis.riskScore,
          current_verdict: deal.aiAnalysis.verdict,
          current_confidence: deal.aiAnalysis.confidenceScore * 100,
          current_offer: deal.pricing.suggestedOffer,
          mao: deal.pricing.maxAllowableOffer,
          intent_status: 'COLD'
        },
        tags: this.generateTags(deal)
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
      if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
        const data = JSON.parse(response.getContentText());
        return data.contact_id || data.id || null;
      }

      return null;
    } catch (error) {
      Logger.log(`Error upserting contact: ${error}`);
      return null;
    }
  }

  /**
   * Generate tags for contact based on deal
   */
  private static generateTags(deal: Deal): string[] {
    const tags: string[] = ['thriftymobile'];

    // Verdict tags
    tags.push(`verdict:${deal.aiAnalysis.verdict.toLowerCase().replace('_', '-')}`);

    // Profit tier tags
    tags.push(`profit:${deal.pricing.profitTier}`);

    // Seller tags
    if (deal.seller.isHotSeller) {
      tags.push('seller:hot-seller');
    }
    tags.push('seller:new');

    // Lifecycle tags
    tags.push('lifecycle:cold');

    return tags;
  }

  /**
   * Add tag to contact
   */
  public static addTag(contactId: string, tag: string): boolean {
    try {
      const apiKey = Config.get('SMSIT_API_KEY');
      if (!apiKey) return false;

      const endpoint = `${this.API_BASE_URL}/contacts/${contactId}/tags`;

      const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: 'post',
        contentType: 'application/json',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        payload: JSON.stringify({ tag }),
        muteHttpExceptions: true
      };

      const response = UrlFetchApp.fetch(endpoint, options);
      return response.getResponseCode() >= 200 && response.getResponseCode() < 300;
    } catch (error) {
      Logger.log(`Error adding tag: ${error}`);
      return false;
    }
  }

  /**
   * Remove tag from contact
   */
  public static removeTag(contactId: string, tag: string): boolean {
    try {
      const apiKey = Config.get('SMSIT_API_KEY');
      if (!apiKey) return false;

      const endpoint = `${this.API_BASE_URL}/contacts/${contactId}/tags/${encodeURIComponent(tag)}`;

      const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: 'delete',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        muteHttpExceptions: true
      };

      const response = UrlFetchApp.fetch(endpoint, options);
      return response.getResponseCode() >= 200 && response.getResponseCode() < 300;
    } catch (error) {
      Logger.log(`Error removing tag: ${error}`);
      return false;
    }
  }

  /**
   * Enroll contact in campaign
   */
  public static enrollInCampaign(contactId: string, campaignId: string, deal: Deal): boolean {
    try {
      const apiKey = Config.get('SMSIT_API_KEY');
      if (!apiKey) return false;

      const endpoint = `${this.API_BASE_URL}/campaigns/${campaignId}/contacts`;

      const payload = {
        contact_id: contactId,
        variables: {
          device_model: `${deal.device.brand} ${deal.device.model}`,
          platform: deal.platform,
          current_offer: `$${deal.pricing.suggestedOffer.toFixed(0)}`,
          mao: `$${deal.pricing.maxAllowableOffer.toFixed(0)}`,
          first_name: (deal.seller.name || 'there').split(' ')[0]
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
      return response.getResponseCode() >= 200 && response.getResponseCode() < 300;
    } catch (error) {
      Logger.log(`Error enrolling in campaign: ${error}`);
      return false;
    }
  }

  /**
   * Trigger automated outreach for high-value deals
   */
  public static triggerAutomatedOutreach(deal: Deal): boolean {
    const config = Config.getAutomationConfig();

    if (!config.enableAutoMessaging) {
      Logger.log('Auto-messaging disabled');
      return false;
    }

    // Only auto-contact if confidence is high enough
    if (deal.aiAnalysis.confidenceScore < (config.autoContactThreshold / 100)) {
      Logger.log(`Confidence too low for auto-contact: ${deal.aiAnalysis.confidenceScore}`);
      return false;
    }

    // Create/update contact
    const contactId = this.upsertContact(deal);
    if (!contactId) {
      Logger.log('Failed to create contact');
      return false;
    }

    // Determine campaign based on verdict
    let campaignId: string | null = null;

    if (deal.aiAnalysis.verdict === 'STRONG_BUY') {
      campaignId = Config.get('SMSIT_CAMPAIGN_STRONG_BUY');
      this.addTag(contactId, 'lifecycle:contacted');
    } else if (deal.aiAnalysis.verdict === 'BUY') {
      campaignId = Config.get('SMSIT_CAMPAIGN_BUY');
      this.addTag(contactId, 'lifecycle:contacted');
    }

    if (!campaignId) {
      Logger.log('No campaign configured for verdict');
      // Fall back to direct message
      return this.sendOfferMessage(deal);
    }

    // Enroll in campaign
    return this.enrollInCampaign(campaignId, contactId, deal);
  }

  /**
   * Test SMS-iT connection
   */
  public static testConnection(): boolean {
    try {
      const apiKey = Config.get('SMSIT_API_KEY');
      if (!apiKey) {
        Logger.log('SMS-iT API key not configured');
        return false;
      }

      const endpoint = `${this.API_BASE_URL}/account`;

      const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: 'get',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        muteHttpExceptions: true
      };

      const response = UrlFetchApp.fetch(endpoint, options);
      const success = response.getResponseCode() === 200;

      if (success) {
        Logger.log('✅ SMS-iT connection successful');
      } else {
        Logger.log(`❌ SMS-iT connection failed: ${response.getResponseCode()}`);
      }

      return success;
    } catch (error) {
      Logger.log(`SMS-iT connection test failed: ${error}`);
      return false;
    }
  }
}
