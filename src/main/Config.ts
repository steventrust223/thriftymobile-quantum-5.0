/**
 * Configuration and Settings Management
 * Manages system settings stored in Google Sheets Settings tab
 */

export class Config {
  private static settings: Map<string, string> | null = null;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static lastCacheTime = 0;

  /**
   * Get a setting value
   */
  public static get(key: string): string | null {
    this.refreshCache();
    return this.settings?.get(key) || null;
  }

  /**
   * Get a setting as a number
   */
  public static getNumber(key: string, defaultValue = 0): number {
    const value = this.get(key);
    if (!value) return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Get a setting as a boolean
   */
  public static getBoolean(key: string, defaultValue = false): boolean {
    const value = this.get(key);
    if (!value) return defaultValue;
    return value.toUpperCase() === 'TRUE';
  }

  /**
   * Set a setting value
   */
  public static set(key: string, value: string): void {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Settings');
    if (!sheet) {
      throw new Error('Settings sheet not found');
    }

    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;

    // Find the row with this setting
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex > 0) {
      // Update existing setting
      sheet.getRange(rowIndex, 2).setValue(value);
    } else {
      // Add new setting
      sheet.appendRow([key, value, '', '']);
    }

    // Clear cache to force reload
    this.settings = null;
  }

  /**
   * Refresh settings cache if needed
   */
  private static refreshCache(): void {
    const now = Date.now();
    if (this.settings && (now - this.lastCacheTime) < this.CACHE_DURATION) {
      return; // Cache still valid
    }

    this.loadSettings();
    this.lastCacheTime = now;
  }

  /**
   * Load all settings from the Settings sheet
   */
  private static loadSettings(): void {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Settings');
    if (!sheet) {
      Logger.log('Warning: Settings sheet not found');
      this.settings = new Map();
      return;
    }

    const data = sheet.getDataRange().getValues();
    this.settings = new Map();

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const key = data[i][0];
      const value = data[i][1];
      if (key) {
        this.settings.set(key, value?.toString() || '');
      }
    }
  }

  /**
   * Get Claude API configuration
   */
  public static getClaudeConfig() {
    return {
      apiKey: this.get('CLAUDE_API_KEY') || '',
      model: this.get('CLAUDE_MODEL') || 'claude-3-5-sonnet-20241022',
      maxTokens: this.getNumber('CLAUDE_MAX_TOKENS', 4096)
    };
  }

  /**
   * Get profit thresholds
   */
  public static getProfitThresholds() {
    return {
      minimum: this.getNumber('MIN_PROFIT_PERCENT', 25),
      target: this.getNumber('TARGET_PROFIT_PERCENT', 50),
      exceptional: this.getNumber('EXCEPTIONAL_PROFIT_PERCENT', 100)
    };
  }

  /**
   * Get automation settings
   */
  public static getAutomationConfig() {
    return {
      enableAI: this.getBoolean('ENABLE_AI_ANALYSIS', true),
      enableAutoMessaging: this.getBoolean('ENABLE_AUTO_MESSAGING', false),
      autoContactThreshold: this.getNumber('AUTO_CONTACT_THRESHOLD', 75),
      autoRejectBlacklisted: this.getBoolean('AUTO_REJECT_BLACKLISTED', true),
      autoRejectICloudLocked: this.getBoolean('AUTO_REJECT_ICLOUD_LOCKED', true)
    };
  }

  /**
   * Get geographic settings
   */
  public static getGeographicConfig() {
    return {
      maxRadiusMiles: this.getNumber('MAX_RADIUS_MILES', 50),
      preferredZips: (this.get('PREFERRED_ZIPS') || '').split(',').map(z => z.trim()),
      baseZip: this.get('BASE_ZIP') || ''
    };
  }

  /**
   * Clear the cache (useful for testing)
   */
  public static clearCache(): void {
    this.settings = null;
    this.lastCacheTime = 0;
  }
}
