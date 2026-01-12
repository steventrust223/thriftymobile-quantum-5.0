/**
 * Model Parser - Extracts device information from titles and descriptions
 */

import { Carrier } from '../types/Device';

export class ModelParser {
  private static readonly IPHONE_MODELS = [
    'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15',
    'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14',
    'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13 Mini', 'iPhone 13',
    'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12 Mini', 'iPhone 12',
    'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11',
    'iPhone XS Max', 'iPhone XS', 'iPhone XR', 'iPhone X',
    'iPhone SE 3', 'iPhone SE 2', 'iPhone SE'
  ];

  private static readonly SAMSUNG_MODELS = [
    'Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24',
    'Galaxy S23 Ultra', 'Galaxy S23+', 'Galaxy S23',
    'Galaxy S22 Ultra', 'Galaxy S22+', 'Galaxy S22',
    'Galaxy S21 Ultra', 'Galaxy S21+', 'Galaxy S21',
    'Galaxy Z Fold 5', 'Galaxy Z Fold 4', 'Galaxy Z Fold 3',
    'Galaxy Z Flip 5', 'Galaxy Z Flip 4', 'Galaxy Z Flip 3',
    'Galaxy Note 20 Ultra', 'Galaxy Note 20'
  ];

  private static readonly STORAGE_PATTERNS = [
    '1TB', '512GB', '256GB', '128GB', '64GB', '32GB', '16GB',
    '1 TB', '512 GB', '256 GB', '128 GB', '64 GB', '32 GB'
  ];

  private static readonly CARRIER_KEYWORDS: Record<string, Carrier> = {
    'unlocked': Carrier.UNLOCKED,
    'verizon': Carrier.VERIZON,
    'at&t': Carrier.ATT,
    'att': Carrier.ATT,
    't-mobile': Carrier.TMOBILE,
    'tmobile': Carrier.TMOBILE,
    'sprint': Carrier.SPRINT,
    'cricket': Carrier.CRICKET,
    'metro': Carrier.METRO,
    'boost': Carrier.BOOST
  };

  /**
   * Parse device model from title/description
   */
  public static parseModel(text: string): { brand: string; model: string } | null {
    const normalized = text.toLowerCase();

    // Check for iPhone
    for (const model of this.IPHONE_MODELS) {
      if (normalized.includes(model.toLowerCase())) {
        return { brand: 'Apple', model };
      }
    }

    // Check for Samsung
    for (const model of this.SAMSUNG_MODELS) {
      if (normalized.includes(model.toLowerCase())) {
        return { brand: 'Samsung', model };
      }
    }

    // Try generic patterns
    if (normalized.includes('iphone')) {
      const match = text.match(/iphone\s+(\d+\s*(?:pro\s*max|pro|plus|mini)?)/i);
      if (match) {
        return { brand: 'Apple', model: `iPhone ${match[1]}` };
      }
    }

    return null;
  }

  /**
   * Parse storage capacity
   */
  public static parseStorage(text: string): string {
    const normalized = text.toUpperCase().replace(/\s/g, '');

    for (const storage of this.STORAGE_PATTERNS) {
      const pattern = storage.replace(/\s/g, '');
      if (normalized.includes(pattern)) {
        return storage.replace(/\s/g, '');
      }
    }

    return 'Unknown';
  }

  /**
   * Parse carrier information
   */
  public static parseCarrier(text: string): Carrier {
    const normalized = text.toLowerCase();

    for (const [keyword, carrier] of Object.entries(this.CARRIER_KEYWORDS)) {
      if (normalized.includes(keyword)) {
        return carrier;
      }
    }

    return Carrier.UNKNOWN;
  }

  /**
   * Parse color
   */
  public static parseColor(text: string): string | undefined {
    const colors = [
      'Black', 'White', 'Silver', 'Gold', 'Rose Gold', 'Space Gray', 'Space Grey',
      'Graphite', 'Sierra Blue', 'Alpine Green', 'Red', 'Blue', 'Green', 'Purple',
      'Yellow', 'Pink', 'Midnight', 'Starlight', 'Titanium', 'Natural', 'Phantom'
    ];

    const normalized = text.toLowerCase();

    for (const color of colors) {
      if (normalized.includes(color.toLowerCase())) {
        return color;
      }
    }

    return undefined;
  }

  /**
   * Parse price from various formats
   */
  public static parsePrice(priceText: string): number {
    if (!priceText) return 0;

    // Remove currency symbols, commas, and extract number
    const cleaned = priceText.replace(/[$,]/g, '').trim();
    const match = cleaned.match(/(\d+(?:\.\d{2})?)/);

    if (match) {
      return parseFloat(match[1]);
    }

    return 0;
  }

  /**
   * Detect if device is a demo unit
   */
  public static isDemo(text: string): boolean {
    const normalized = text.toLowerCase();
    const demoKeywords = ['demo', 'display', 'store display', 'display unit', 'retail display'];

    return demoKeywords.some(keyword => normalized.includes(keyword));
  }

  /**
   * Detect potential issues from description
   */
  public static detectIssues(text: string): string[] {
    const issues: string[] = [];
    const normalized = text.toLowerCase();

    const issuePatterns: Record<string, string[]> = {
      'Cracked Screen': ['cracked screen', 'screen crack', 'broken screen', 'shattered screen'],
      'Cracked Back': ['cracked back', 'back crack', 'broken back glass', 'back glass crack'],
      'Water Damage': ['water damage', 'water damaged', 'liquid damage'],
      'Face ID Issue': ['face id not working', 'face id broken', 'no face id'],
      'Battery Issue': ['battery', 'battery health', 'needs new battery', 'battery degraded'],
      'Camera Issue': ['camera not working', 'camera broken', 'camera issue'],
      'iCloud Locked': ['icloud', 'activation lock', 'locked to icloud', 'find my iphone'],
      'Blacklisted': ['blacklisted', 'blocked', 'bad esn', 'bad imei'],
      'Scratches': ['scratches', 'scratched', 'scuffed'],
      'Dents': ['dents', 'dented', 'dings']
    };

    for (const [issue, patterns] of Object.entries(issuePatterns)) {
      if (patterns.some(pattern => normalized.includes(pattern))) {
        issues.push(issue);
      }
    }

    return issues;
  }

  /**
   * Infer condition from description
   */
  public static inferCondition(text: string): string {
    const normalized = text.toLowerCase();

    const conditionKeywords = {
      'Mint': ['mint', 'brand new', 'new condition', 'like new', 'flawless'],
      'Excellent': ['excellent', 'great condition', 'pristine', 'near mint'],
      'Good': ['good', 'minor wear', 'light scratches', 'normal wear'],
      'Fair': ['fair', 'moderate wear', 'scratches', 'used'],
      'Poor': ['poor', 'heavy wear', 'cracked', 'broken'],
      'For Parts': ['for parts', 'parts only', 'not working', 'broken']
    };

    for (const [condition, keywords] of Object.entries(conditionKeywords)) {
      if (keywords.some(keyword => normalized.includes(keyword))) {
        return condition;
      }
    }

    return 'Unknown';
  }

  /**
   * Extract location/ZIP from text
   */
  public static parseLocation(text: string): { location?: string; zip?: string } {
    // Try to find ZIP code (5 digits)
    const zipMatch = text.match(/\b(\d{5})\b/);
    const zip = zipMatch ? zipMatch[1] : undefined;

    // Try to find city, state patterns
    const locationMatch = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*([A-Z]{2})/);
    const location = locationMatch ? `${locationMatch[1]}, ${locationMatch[2]}` : undefined;

    return { location, zip };
  }

  /**
   * Generate a unique deal ID
   */
  public static generateDealId(platform: string, timestamp: Date): string {
    const dateStr = timestamp.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const platformCode = platform.substring(0, 2).toUpperCase();

    return `${platformCode}-${dateStr}-${randomStr}`;
  }

  /**
   * Normalize model name for lookups
   */
  public static normalizeModelName(model: string): string {
    return model
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/iPhone\s+(\d+)\s+Pro\s+Max/i, 'iPhone $1 Pro Max')
      .replace(/Galaxy\s+S(\d+)\s+Ultra/i, 'Galaxy S$1 Ultra');
  }
}
