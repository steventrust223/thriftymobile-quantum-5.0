/**
 * Data Cleaner - Cleans and validates raw import data
 */

import { ImportedListing } from '../types/Deal';

export class DataCleaner {
  /**
   * Clean a raw imported listing
   */
  public static cleanListing(raw: any): ImportedListing | null {
    try {
      // Validate required fields
      if (!raw.title || !raw.price) {
        return null;
      }

      return {
        timestamp: this.cleanTimestamp(raw.timestamp),
        platform: this.cleanPlatform(raw.platform),
        title: this.cleanText(raw.title),
        price: this.cleanPrice(raw.price),
        description: this.cleanText(raw.description || ''),
        location: this.cleanText(raw.location || ''),
        url: this.cleanUrl(raw.url || ''),
        sellerName: this.cleanText(raw.sellerName || raw.seller || ''),
        images: this.cleanImages(raw.images || []),
        scrapedAt: new Date()
      };
    } catch (error) {
      Logger.log(`Error cleaning listing: ${error}`);
      return null;
    }
  }

  /**
   * Clean timestamp
   */
  private static cleanTimestamp(timestamp: any): string {
    if (!timestamp) return new Date().toISOString();

    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    }

    if (typeof timestamp === 'string') {
      return timestamp;
    }

    return new Date().toISOString();
  }

  /**
   * Clean platform name
   */
  private static cleanPlatform(platform: any): string {
    if (!platform) return 'Other';

    const normalized = platform.toString().toLowerCase();

    if (normalized.includes('facebook')) return 'Facebook Marketplace';
    if (normalized.includes('offerup')) return 'OfferUp';
    if (normalized.includes('craigslist')) return 'Craigslist';
    if (normalized.includes('ebay')) return 'eBay';
    if (normalized.includes('mercari')) return 'Mercari';

    return platform.toString();
  }

  /**
   * Clean text fields
   */
  private static cleanText(text: any): string {
    if (!text) return '';

    return text
      .toString()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[\r\n]+/g, ' ')
      .substring(0, 5000); // Limit length
  }

  /**
   * Clean price field
   */
  private static cleanPrice(price: any): string {
    if (!price) return '$0';

    const str = price.toString();

    // Already has currency symbol
    if (str.includes('$')) {
      return str.replace(/[^\d$.,]/g, '');
    }

    // Plain number
    const num = parseFloat(str.replace(/[^\d.]/g, ''));
    if (!isNaN(num)) {
      return `$${num.toFixed(2)}`;
    }

    return '$0';
  }

  /**
   * Clean URL
   */
  private static cleanUrl(url: any): string {
    if (!url) return '';

    const str = url.toString().trim();

    // Validate URL format
    try {
      new URL(str);
      return str;
    } catch {
      return '';
    }
  }

  /**
   * Clean images array
   */
  private static cleanImages(images: any): string[] {
    if (!Array.isArray(images)) return [];

    return images
      .filter(img => img && typeof img === 'string')
      .map(img => this.cleanUrl(img))
      .filter(url => url.length > 0)
      .slice(0, 10); // Limit to 10 images
  }

  /**
   * Deduplicate listings by URL
   */
  public static deduplicateListings(listings: ImportedListing[]): ImportedListing[] {
    const seen = new Set<string>();
    const unique: ImportedListing[] = [];

    for (const listing of listings) {
      if (!listing.url) {
        unique.push(listing);
        continue;
      }

      if (!seen.has(listing.url)) {
        seen.add(listing.url);
        unique.push(listing);
      }
    }

    return unique;
  }

  /**
   * Filter out invalid listings
   */
  public static filterValidListings(listings: ImportedListing[]): ImportedListing[] {
    return listings.filter(listing => {
      // Must have title
      if (!listing.title || listing.title.length < 5) return false;

      // Must have reasonable price
      const price = parseFloat(listing.price.replace(/[^\d.]/g, ''));
      if (isNaN(price) || price < 10 || price > 10000) return false;

      // Must have platform
      if (!listing.platform) return false;

      return true;
    });
  }

  /**
   * Calculate data quality score
   */
  public static calculateDataQuality(listing: ImportedListing): {
    score: number;
    quality: 'high' | 'medium' | 'low';
    missingFields: string[];
  } {
    let score = 100;
    const missingFields: string[] = [];

    // Essential fields (20 points each)
    if (!listing.title) {
      score -= 20;
      missingFields.push('title');
    }
    if (!listing.price) {
      score -= 20;
      missingFields.push('price');
    }

    // Important fields (10 points each)
    if (!listing.description || listing.description.length < 20) {
      score -= 10;
      missingFields.push('description');
    }
    if (!listing.location) {
      score -= 10;
      missingFields.push('location');
    }
    if (!listing.url) {
      score -= 10;
      missingFields.push('url');
    }

    // Nice-to-have fields (5 points each)
    if (!listing.sellerName) {
      score -= 5;
      missingFields.push('sellerName');
    }
    if (!listing.images || listing.images.length === 0) {
      score -= 5;
      missingFields.push('images');
    }

    // Determine quality tier
    let quality: 'high' | 'medium' | 'low';
    if (score >= 80) quality = 'high';
    else if (score >= 50) quality = 'medium';
    else quality = 'low';

    return { score, quality, missingFields };
  }

  /**
   * Sanitize text for sheet insertion
   */
  public static sanitizeForSheet(text: string): string {
    if (!text) return '';

    return text
      .replace(/'/g, "'")
      .replace(/"/g, '"')
      .replace(/[\r\n]+/g, ' ')
      .trim()
      .substring(0, 50000); // Google Sheets cell limit
  }
}
