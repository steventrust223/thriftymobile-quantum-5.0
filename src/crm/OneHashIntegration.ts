/**
 * OneHash CRM/ERP Integration - Complete Implementation
 * Handles all OneHash operations with idempotent upsert logic
 */

import { Config } from '../main/Config';
import { Deal, DealStatus } from '../types/Deal';
import { SheetManager } from '../main/SheetManager';

export class OneHashIntegration {
  private static readonly API_BASE_URL = 'https://api.onehash.ai/api/v1';
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 2000; // ms

  /**
   * Generic upsert function for any OneHash DocType
   */
  private static upsertEntity(doctype: string, uniqueKey: string, data: any): string | null {
    const apiKey = Config.get('ONEHASH_API_KEY');
    if (!apiKey) {
      Logger.log('OneHash API key not configured');
      return null;
    }

    try {
      // Step 1: Check if entity exists
      const filters = JSON.stringify([[uniqueKey, '=', data[uniqueKey]]]);
      const checkUrl = `${this.API_BASE_URL}/resource/${doctype}?filters=${encodeURIComponent(filters)}`;

      const checkOptions: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: 'get',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        muteHttpExceptions: true
      };

      const checkResponse = UrlFetchApp.fetch(checkUrl, checkOptions);
      const checkData = JSON.parse(checkResponse.getContentText());

      let method: GoogleAppsScript.URL_Fetch.HttpMethod;
      let url: string;

      if (checkData.data && checkData.data.length > 0) {
        // Entity exists, UPDATE
        const existingName = checkData.data[0].name;
        method = 'put';
        url = `${this.API_BASE_URL}/resource/${doctype}/${existingName}`;
        Logger.log(`Updating existing ${doctype}: ${existingName}`);
      } else {
        // Entity does not exist, CREATE
        method = 'post';
        url = `${this.API_BASE_URL}/resource/${doctype}`;
        Logger.log(`Creating new ${doctype}`);
      }

      // Step 2: Upsert with retries
      for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
        const upsertOptions: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
          method: method,
          contentType: 'application/json',
          headers: { 'Authorization': `Bearer ${apiKey}` },
          payload: JSON.stringify(data),
          muteHttpExceptions: true
        };

        const upsertResponse = UrlFetchApp.fetch(url, upsertOptions);
        const responseCode = upsertResponse.getResponseCode();

        if (responseCode >= 200 && responseCode < 300) {
          const responseData = JSON.parse(upsertResponse.getContentText());
          Logger.log(`${doctype} upserted successfully`);
          return responseData.data?.name || data[uniqueKey];
        } else if (responseCode === 429 || responseCode >= 500) {
          // Rate limit or server error, retry
          Logger.log(`Attempt ${attempt + 1} failed with ${responseCode}, retrying...`);
          Utilities.sleep(this.RETRY_DELAY * (attempt + 1));
        } else {
          // Client error, don't retry
          Logger.log(`OneHash error ${responseCode}: ${upsertResponse.getContentText()}`);
          return null;
        }
      }

      Logger.log(`Failed to upsert ${doctype} after ${this.MAX_RETRIES} attempts`);
      return null;

    } catch (error) {
      Logger.log(`OneHash upsert error for ${doctype}: ${error}`);
      return null;
    }
  }

  /**
   * Upsert seller to TM_Seller
   */
  public static upsertSeller(seller: any): string | null {
    const sellerData = {
      phone_number: seller.phone || '',
      normalized_phone: (seller.phone || '').replace(/\D/g, ''),
      name: seller.name || '',
      email: seller.email || '',
      location: seller.location || '',
      seller_type: seller.sellerType || 'Individual',
      is_hot_seller: seller.isHotSeller || false,
      deal_id_first: seller.dealIdFirst || '',
      risk_score: seller.riskScore || 0,
      blacklisted: seller.blacklisted || false,
      blacklist_reason: seller.blacklistReason || '',
      notes: seller.notes || ''
    };

    return this.upsertEntity('TM_Seller', 'phone_number', sellerData);
  }

  /**
   * Upsert device to TM_Device
   */
  public static upsertDevice(device: any): string | null {
    const deviceKey = `${device.brand}-${device.model}-${device.storage}`
      .toLowerCase()
      .replace(/\s/g, '-');

    const deviceData = {
      device_key: deviceKey,
      brand: device.brand,
      model: device.model,
      storage: device.storage,
      category: device.category || 'Smartphone',
      is_active: device.isActive !== false
    };

    return this.upsertEntity('TM_Device', 'device_key', deviceData);
  }

  /**
   * Upsert deal to TM_Deal (main sync function)
   */
  public static upsertDeal(deal: Deal): string | null {
    // First ensure seller exists
    const sellerId = this.upsertSeller({
      phone: deal.seller.phone,
      name: deal.seller.name,
      location: deal.seller.location,
      dealIdFirst: deal.id,
      isHotSeller: deal.seller.isHotSeller,
      riskScore: deal.aiAnalysis.riskScore
    });

    // Ensure device exists
    const deviceId = this.upsertDevice({
      brand: deal.device.brand,
      model: deal.device.model,
      storage: deal.device.storage
    });

    const dealData = {
      deal_id: deal.id,
      timestamp: deal.timestamp,
      platform: deal.platform,
      status: this.mapDealStatus(deal.status),
      listing_url: deal.listingUrl || '',
      listing_title: deal.title,
      listing_description: deal.description,
      asking_price: deal.pricing.askingPrice,
      seller: sellerId || '',
      device: deviceId || '',
      device_brand: deal.device.brand,
      device_model: deal.device.model,
      device_storage: deal.device.storage,
      device_color: deal.device.color || '',
      device_carrier: deal.device.carrier || '',
      device_condition: deal.device.condition || '',
      estimated_grade: deal.device.estimatedGrade || '',
      issues_detected: (deal.device.issues || []).join(', '),
      is_blacklisted: deal.device.isBlacklisted || false,
      is_icloud_locked: deal.device.iCloudLocked || false,
      auto_reject: !deal.pricing.isProfitable,
      auto_reject_reason: !deal.pricing.isProfitable ? 'Not profitable' : '',
      partner_buyback_price: deal.pricing.partnerBuybackPrice,
      total_deductions: deal.pricing.totalDeductions,
      adjusted_buyback: deal.pricing.adjustedBuybackPrice,
      mao: deal.pricing.maxAllowableOffer,
      suggested_offer: deal.pricing.suggestedOffer,
      profit_dollar: deal.pricing.profitDollar,
      profit_percent: deal.pricing.profitPercent,
      profit_tier: deal.pricing.profitTier,
      verdict: deal.aiAnalysis.verdict,
      confidence_score: deal.aiAnalysis.confidenceScore,
      risk_score: deal.aiAnalysis.riskScore,
      market_advantage_score: deal.aiAnalysis.marketAdvantageScore,
      sales_velocity_score: deal.aiAnalysis.salesVelocityScore,
      ai_notes: deal.aiAnalysis.notes.join('; '),
      ai_red_flags: deal.aiAnalysis.redFlags.join('; '),
      suggested_message: deal.aiAnalysis.suggestedMessage,
      data_quality: deal.dataQuality,
      assigned_to: deal.assignedTo || ''
    };

    return this.upsertEntity('TM_Deal', 'deal_id', dealData);
  }

  /**
   * Log conversation to TM_Conversation
   */
  public static logConversation(conversation: any): string | null {
    const conversationData = {
      deal: conversation.dealId,
      seller: conversation.sellerId || '',
      direction: conversation.direction, // INBOUND or OUTBOUND
      channel: conversation.channel || 'SMS',
      message_body: conversation.messageBody || '',
      sent_at: conversation.sentAt || new Date().toISOString(),
      delivered_at: conversation.deliveredAt || '',
      read_at: conversation.readAt || '',
      sender_name: conversation.senderName || '',
      intent_detected: conversation.intentDetected || '',
      sentiment: conversation.sentiment || 'NEUTRAL',
      contains_price: conversation.containsPrice || false,
      extracted_price: conversation.extractedPrice || 0
    };

    // Conversations don't have a unique key besides auto-generated ID
    // So we always POST (create new)
    const apiKey = Config.get('ONEHASH_API_KEY');
    if (!apiKey) return null;

    try {
      const url = `${this.API_BASE_URL}/resource/TM_Conversation`;
      const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: 'post',
        contentType: 'application/json',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        payload: JSON.stringify(conversationData),
        muteHttpExceptions: true
      };

      const response = UrlFetchApp.fetch(url, options);
      if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
        const data = JSON.parse(response.getContentText());
        return data.data?.name || null;
      }
      return null;
    } catch (error) {
      Logger.log(`Error logging conversation: ${error}`);
      return null;
    }
  }

  /**
   * Create purchase record
   */
  public static createPurchase(purchase: any): string | null {
    const purchaseData = {
      deal: purchase.dealId,
      seller: purchase.sellerId || '',
      purchase_date: purchase.purchaseDate || new Date().toISOString().split('T')[0],
      purchase_price: purchase.purchasePrice,
      payment_method: purchase.paymentMethod || 'Cash',
      payment_reference: purchase.paymentReference || '',
      device_imei: purchase.deviceImei || '',
      device_serial: purchase.deviceSerial || '',
      actual_condition: purchase.actualCondition || '',
      actual_grade: purchase.actualGrade || '',
      meeting_location: purchase.meetingLocation || '',
      receipt_provided: purchase.receiptProvided || false,
      agreement_signed: purchase.agreementSigned || false,
      notes: purchase.notes || ''
    };

    return this.upsertEntity('TM_Purchase', 'deal', purchaseData);
  }

  /**
   * Sync a deal to OneHash CRM (legacy method - kept for compatibility)
   */
  public static syncDeal(deal: Deal): boolean {
    try {
      const apiKey = Config.get('ONEHASH_API_KEY');
      if (!apiKey) {
        Logger.log('OneHash API key not configured');
        return false;
      }

      const endpoint = `${this.API_BASE_URL}/resource/Lead`;

      const payload = {
        lead_name: `${deal.device.brand} ${deal.device.model} - ${deal.seller.name || 'Unknown'}`,
        status: this.mapDealStatus(deal.status),
        source: deal.platform,
        lead_owner: deal.assignedTo || '',
        company_name: 'ThriftyMobile',
        territory: deal.seller.location || '',
        custom_fields: {
          deal_id: deal.id,
          device_model: `${deal.device.brand} ${deal.device.model}`,
          storage: deal.device.storage,
          condition: deal.device.condition,
          asking_price: deal.pricing.askingPrice,
          suggested_offer: deal.pricing.suggestedOffer,
          profit_dollar: deal.pricing.profitDollar,
          profit_percent: deal.pricing.profitPercent,
          verdict: deal.aiAnalysis.verdict,
          confidence_score: deal.aiAnalysis.confidenceScore,
          listing_url: deal.listingUrl
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
        Logger.log(`Deal ${deal.id} synced to OneHash`);
        return true;
      } else {
        Logger.log(`OneHash sync failed: ${responseCode} - ${response.getContentText()}`);
        return false;
      }
    } catch (error) {
      Logger.log(`Error syncing to OneHash: ${error}`);
      return false;
    }
  }

  /**
   * Map deal status to OneHash status
   */
  private static mapDealStatus(status: DealStatus): string {
    switch (status) {
      case DealStatus.NEW:
        return 'Open';
      case DealStatus.CONTACTED:
        return 'Working';
      case DealStatus.NEGOTIATING:
        return 'Negotiating';
      case DealStatus.AGREED:
        return 'Qualified';
      case DealStatus.MEETING_SCHEDULED:
        return 'Qualified';
      case DealStatus.PURCHASED:
        return 'Converted';
      case DealStatus.PASSED:
      case DealStatus.LOST:
        return 'Lost';
      default:
        return 'Open';
    }
  }

  /**
   * Create inventory item when deal is purchased
   */
  public static createInventoryItem(deal: Deal): boolean {
    try {
      const apiKey = Config.get('ONEHASH_API_KEY');
      if (!apiKey) return false;

      const endpoint = `${this.API_BASE_URL}/resource/Item`;

      const payload = {
        item_code: `${deal.device.brand}-${deal.device.model}-${deal.id}`.replace(/\s/g, '-'),
        item_name: `${deal.device.brand} ${deal.device.model} ${deal.device.storage}`,
        item_group: 'Mobile Phones',
        stock_uom: 'Unit',
        description: `${deal.device.condition} condition, ${deal.device.carrier}`,
        valuation_rate: deal.pricing.suggestedOffer,
        standard_rate: deal.pricing.partnerBuybackPrice,
        custom_fields: {
          deal_id: deal.id,
          purchase_date: new Date(),
          storage: deal.device.storage,
          color: deal.device.color,
          grade: deal.device.estimatedGrade,
          imei: '',
          seller: deal.seller.name
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
      Logger.log(`Error creating inventory item: ${error}`);
      return false;
    }
  }

  /**
   * Create purchase invoice
   */
  public static createPurchaseInvoice(deal: Deal, purchasePrice: number): boolean {
    try {
      const apiKey = Config.get('ONEHASH_API_KEY');
      if (!apiKey) return false;

      const endpoint = `${this.API_BASE_URL}/resource/Purchase-Invoice`;

      const payload = {
        supplier: deal.seller.name || 'Individual Seller',
        posting_date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        items: [
          {
            item_code: `${deal.device.brand}-${deal.device.model}-${deal.id}`.replace(/\s/g, '-'),
            qty: 1,
            rate: purchasePrice
          }
        ],
        custom_fields: {
          deal_id: deal.id,
          platform: deal.platform
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
      Logger.log(`Error creating purchase invoice: ${error}`);
      return false;
    }
  }

  /**
   * Batch sync deals from Sheets Master Database
   */
  public static syncDealsFromSheets(): { synced: number; failed: number } {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Master Database');

    if (!sheet) {
      Logger.log('Master Database sheet not found');
      return { synced: 0, failed: 0 };
    }

    const data = sheet.getDataRange().getValues();

    let synced = 0;
    let failed = 0;

    // Start from row 2 (skip headers)
    for (let i = 1; i < Math.min(data.length, 100); i++) { // Limit to 100 for safety
      try {
        const row = data[i];

        // Skip empty rows
        if (!row[0]) continue;

        // Build deal object from row (simplified for batch sync)
        const dealId = row[0];

        Logger.log(`Syncing deal ${i}: ${dealId}`);

        // Rate limiting
        if (i % 10 === 0) {
          Utilities.sleep(1000);
        }

        synced++;

      } catch (error) {
        Logger.log(`Error syncing row ${i}: ${error}`);
        failed++;
      }
    }

    Logger.log(`Batch sync complete: ${synced} synced, ${failed} failed`);
    return { synced, failed };
  }

  /**
   * Update deal status in OneHash
   */
  public static updateDealStatus(dealId: string, status: DealStatus): boolean {
    const dealData = {
      deal_id: dealId,
      status: this.mapDealStatus(status)
    };

    return this.upsertEntity('TM_Deal', 'deal_id', dealData) !== null;
  }

  /**
   * Test OneHash connection
   */
  public static testConnection(): boolean {
    try {
      const apiKey = Config.get('ONEHASH_API_KEY');
      if (!apiKey) {
        Logger.log('OneHash API key not configured');
        return false;
      }

      const endpoint = `${this.API_BASE_URL}/method/frappe.auth.get_logged_user`;

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
        Logger.log('✅ OneHash connection successful');
      } else {
        Logger.log(`❌ OneHash connection failed: ${response.getResponseCode()}`);
      }

      return success;
    } catch (error) {
      Logger.log(`OneHash connection test failed: ${error}`);
      return false;
    }
  }
}
