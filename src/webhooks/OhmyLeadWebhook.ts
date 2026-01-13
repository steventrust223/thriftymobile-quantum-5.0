/**
 * OhmyLead Webhook Handler
 * Receives form submissions from OhmyLead and processes them into Master Database
 */

import { OneHashIntegration } from '../crm/OneHashIntegration';
import { SMSITIntegration } from '../crm/SMSITIntegration';
import { SheetManager } from '../main/SheetManager';

export class OhmyLeadWebhook {
  /**
   * Handle incoming webhook from OhmyLead
   */
  public static handleWebhook(payload: any): any {
    try {
      Logger.log('OhmyLead webhook received');

      // Validate signature if provided
      if (!this.validateSignature(payload)) {
        Logger.log('Invalid OhmyLead signature');
        return { success: false, error: 'Invalid signature' };
      }

      const fields = payload.fields || payload.data || payload;

      // Generate unique deal ID
      const dealId = Utilities.getUuid();
      const timestamp = new Date();

      // Prepare row for Master Database
      const row = this.prepareSheetRow(dealId, timestamp, fields);

      // Insert into Master Database
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Master Database');
      if (!sheet) {
        throw new Error('Master Database sheet not found');
      }

      sheet.appendRow(row);
      Logger.log(`OhmyLead submission added to Master Database: ${dealId}`);

      // Create seller in OneHash
      this.createOneHashSellerFromLead(dealId, fields);

      // Create contact in SMS-iT (if phone provided and auto-messaging enabled)
      if (fields.phone) {
        this.createSMSITContactFromLead(dealId, fields);
      }

      // TODO: Trigger processing pipeline
      // This would normally call processNewImports() to run grading, profit calc, AI analysis

      return {
        success: true,
        deal_id: dealId,
        message: 'Lead captured successfully'
      };

    } catch (error) {
      Logger.log(`OhmyLead webhook error: ${error}`);

      // Log to Error Log sheet
      const sheetManager = new SheetManager();
      sheetManager.logError(error as Error, 'OhmyLead Webhook');

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate webhook signature (HMAC SHA256)
   */
  private static validateSignature(payload: any): boolean {
    // In production, validate HMAC signature from headers
    // For now, return true (implement when OhmyLead provides signature)
    return true;
  }

  /**
   * Prepare row for Master Database sheet
   */
  private static prepareSheetRow(dealId: string, timestamp: Date, fields: any): any[] {
    // Generate title from device info
    const title = `${fields.device_brand || ''} ${fields.device_model || ''} ${fields.device_storage || ''}`.trim();

    // Build description from damage notes and accessories
    let description = fields.any_damage || '';
    if (fields.has_box) {
      description += (description ? '; ' : '') + 'Includes box';
    }
    if (fields.has_accessories) {
      description += (description ? '; ' : '') + 'Includes accessories';
    }

    // Add UTM parameters to notes
    let notes = `Phone: ${fields.phone || 'N/A'}, Email: ${fields.email || 'N/A'}, `;
    notes += `Preferred contact: ${fields.preferred_contact || 'Text'}`;
    if (fields.utm_source) {
      notes += `; UTM Source: ${fields.utm_source}`;
    }
    if (fields.utm_campaign) {
      notes += `; UTM Campaign: ${fields.utm_campaign}`;
    }
    if (fields.notes) {
      notes += `; Notes: ${fields.notes}`;
    }

    // Map to Master Database columns (42 columns total)
    return [
      dealId,                                    // ID
      timestamp,                                 // Timestamp
      'OhmyLead',                               // Platform
      'NEW',                                     // Status
      title,                                     // Title
      description,                               // Description
      fields.asking_price || 0,                  // Asking Price
      '',                                        // Listing URL (empty for direct leads)
      fields.device_brand || '',                 // Brand
      fields.device_model || '',                 // Model
      fields.device_storage || '',               // Storage
      fields.device_color || '',                 // Color
      fields.device_carrier || '',               // Carrier
      fields.device_condition || '',             // Condition
      fields.seller_name || '',                  // Seller Name
      '',                                        // Location (geocode from ZIP later)
      fields.location_zip || '',                 // ZIP
      '',                                        // Hot Seller (to be calculated)
      '',                                        // Estimated Grade (to be calculated)
      fields.any_damage || 'None',               // Issues Detected
      '',                                        // Total Deductions (to be calculated)
      '',                                        // Auto-Reject
      '',                                        // Partner Buyback Price (to be calculated)
      '',                                        // MAO (to be calculated)
      '',                                        // Suggested Offer (to be calculated)
      '',                                        // Profit $
      '',                                        // Profit %
      '',                                        // Verdict (to be assigned by AI)
      '',                                        // Confidence Score
      '',                                        // Risk Score
      '',                                        // Market Advantage
      '',                                        // Sales Velocity
      '',                                        // AI Notes
      '',                                        // Suggested Message
      '',                                        // Assigned To
      '',                                        // Last Contacted
      notes,                                     // Notes
      'high'                                     // Data Quality (direct leads are high quality)
    ];
  }

  /**
   * Create seller in OneHash from lead
   */
  private static createOneHashSellerFromLead(dealId: string, fields: any): void {
    try {
      const sellerData = {
        phone: fields.phone || '',
        name: fields.seller_name || '',
        email: fields.email || '',
        location: '', // Will geocode from ZIP
        dealIdFirst: dealId,
        sellerType: 'Individual',
        notes: `Lead from OhmyLead. Preferred contact: ${fields.preferred_contact || 'Text'}`
      };

      OneHashIntegration.upsertSeller(sellerData);
      Logger.log('Seller created in OneHash from OhmyLead');
    } catch (error) {
      Logger.log(`Error creating OneHash seller: ${error}`);
    }
  }

  /**
   * Create contact in SMS-iT from lead
   */
  private static createSMSITContactFromLead(dealId: string, fields: any): void {
    try {
      const contactData = {
        phone: fields.phone,
        firstName: (fields.seller_name || '').split(' ')[0],
        lastName: (fields.seller_name || '').split(' ').slice(1).join(' '),
        email: fields.email || '',
        customFields: {
          deal_id: dealId,
          platform: 'OhmyLead',
          device_model: `${fields.device_brand} ${fields.device_model}`,
          asking_price: fields.asking_price,
          location: fields.location_zip,
          preferred_contact: fields.preferred_contact || 'Text'
        }
      };

      SMSITIntegration.createContact(contactData);
      Logger.log('Contact created in SMS-iT from OhmyLead');
    } catch (error) {
      Logger.log(`Error creating SMS-iT contact: ${error}`);
    }
  }

  /**
   * Geocode ZIP code to location (optional enhancement)
   */
  private static geocodeZip(zip: string): { city: string; state: string; } | null {
    // In production, use Google Maps Geocoding API or ZIP code database
    // For now, return null
    return null;
  }
}
