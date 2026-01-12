/**
 * OneHash CRM/ERP Integration
 * Syncs deals, inventory, and accounting data
 */

import { Config } from '../main/Config';
import { Deal, DealStatus } from '../types/Deal';

export class OneHashIntegration {
  private static readonly API_BASE_URL = 'https://api.onehash.ai/api/v1';

  /**
   * Sync a deal to OneHash CRM
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
   * Sync all purchased deals
   */
  public static syncPurchasedDeals(): { synced: number; failed: number } {
    // TODO: Read from Master Database where status = 'Purchased'
    Logger.log('Sync purchased deals to be implemented');
    return { synced: 0, failed: 0 };
  }

  /**
   * Test OneHash connection
   */
  public static testConnection(): boolean {
    try {
      const apiKey = Config.get('ONEHASH_API_KEY');
      if (!apiKey) return false;

      const endpoint = `${this.API_BASE_URL}/method/frappe.auth.get_logged_user`;

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
      Logger.log(`OneHash connection test failed: ${error}`);
      return false;
    }
  }
}
