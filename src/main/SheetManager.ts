/**
 * Sheet Management - Creates and manages Google Sheets structure
 */

import {
  SheetName,
  SheetSchema,
  MASTER_DATABASE_COLUMNS,
  VERDICT_SHEET_COLUMNS,
  BUYBACK_MATRIX_COLUMNS,
  SETTINGS_COLUMNS,
  DEFAULT_SETTINGS
} from '../types/Sheet';

export class SheetManager {
  private spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet;

  constructor() {
    this.spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  }

  /**
   * Initialize all required sheets
   */
  public initializeAllSheets(): void {
    Logger.log('Initializing ThriftyMobile sheet structure...');

    // Create core sheets
    this.createOrUpdateSheet(SheetName.MASTER_DATABASE, MASTER_DATABASE_COLUMNS);
    this.createOrUpdateSheet(SheetName.VERDICT_SHEET, VERDICT_SHEET_COLUMNS);
    this.createOrUpdateSheet(SheetName.BUYBACK_MATRIX, BUYBACK_MATRIX_COLUMNS);
    this.createOrUpdateSheet(SheetName.SETTINGS, SETTINGS_COLUMNS);

    // Create import sheets
    this.createSimpleSheet(SheetName.IMPORT_HUB);
    this.createSimpleSheet(SheetName.FACEBOOK_IMPORT);
    this.createSimpleSheet(SheetName.OFFERUP_IMPORT);
    this.createSimpleSheet(SheetName.CRAIGSLIST_IMPORT);
    this.createSimpleSheet(SheetName.EBAY_IMPORT);

    // Create tracking sheets
    this.createSimpleSheet(SheetName.SELLER_CRM);
    this.createSimpleSheet(SheetName.DEAL_PIPELINE);

    // Create analytics sheets
    this.createSimpleSheet(SheetName.DASHBOARD);
    this.createSimpleSheet(SheetName.ANALYTICS);

    // Create configuration sheets
    this.createSimpleSheet(SheetName.DEDUCTION_RULES);

    // Create log sheets
    this.createSimpleSheet(SheetName.SYSTEM_LOG);
    this.createSimpleSheet(SheetName.ERROR_LOG);

    // Initialize settings with defaults
    this.initializeSettings();

    // Apply formatting
    this.applyFormatting();

    Logger.log('Sheet initialization complete!');
    SpreadsheetApp.getUi().alert('✅ ThriftyMobile sheets initialized successfully!');
  }

  /**
   * Create or update a sheet with specified columns
   */
  private createOrUpdateSheet(name: string, columns: any[]): GoogleAppsScript.Spreadsheet.Sheet {
    let sheet = this.spreadsheet.getSheetByName(name);

    if (!sheet) {
      sheet = this.spreadsheet.insertSheet(name);
      Logger.log(`Created sheet: ${name}`);
    }

    // Set up headers
    const headers = columns.map(col => col.name);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);

    // Format headers
    headerRange
      .setBackground('#1a73e8')
      .setFontColor('#ffffff')
      .setFontWeight('bold')
      .setFontSize(11)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');

    // Set column widths
    columns.forEach((col, index) => {
      if (col.width) {
        sheet.setColumnWidth(index + 1, col.width);
      }
    });

    // Freeze header row
    sheet.setFrozenRows(1);

    return sheet;
  }

  /**
   * Create a simple sheet with just a name
   */
  private createSimpleSheet(name: string): GoogleAppsScript.Spreadsheet.Sheet {
    let sheet = this.spreadsheet.getSheetByName(name);

    if (!sheet) {
      sheet = this.spreadsheet.insertSheet(name);
      Logger.log(`Created sheet: ${name}`);
    }

    return sheet;
  }

  /**
   * Initialize Settings sheet with default values
   */
  private initializeSettings(): void {
    const sheet = this.spreadsheet.getSheetByName(SheetName.SETTINGS);
    if (!sheet) return;

    // Check if already populated
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      Logger.log('Settings already initialized');
      return;
    }

    // Add default settings
    const startRow = 2;
    sheet.getRange(startRow, 1, DEFAULT_SETTINGS.length, 4).setValues(DEFAULT_SETTINGS);

    Logger.log('Settings initialized with defaults');
  }

  /**
   * Apply conditional formatting and data validation
   */
  private applyFormatting(): void {
    this.formatMasterDatabase();
    this.formatVerdictSheet();
    this.formatBuybackMatrix();
  }

  /**
   * Format Master Database sheet
   */
  private formatMasterDatabase(): void {
    const sheet = this.spreadsheet.getSheetByName(SheetName.MASTER_DATABASE);
    if (!sheet) return;

    // Alternate row colors for better readability
    const lastRow = Math.max(sheet.getLastRow(), 100);
    const lastCol = sheet.getLastColumn();

    if (lastRow > 1) {
      const dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);

      // Add banding
      dataRange.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY);
    }

    // Set number formats for currency columns
    this.setCurrencyFormat(sheet, 'Asking Price');
    this.setCurrencyFormat(sheet, 'Total Deductions');
    this.setCurrencyFormat(sheet, 'Partner Buyback Price');
    this.setCurrencyFormat(sheet, 'MAO');
    this.setCurrencyFormat(sheet, 'Suggested Offer');
    this.setCurrencyFormat(sheet, 'Profit $');

    // Set percentage format
    this.setPercentFormat(sheet, 'Profit %');
    this.setPercentFormat(sheet, 'Confidence Score');
  }

  /**
   * Format Verdict Sheet
   */
  private formatVerdictSheet(): void {
    const sheet = this.spreadsheet.getSheetByName(SheetName.VERDICT_SHEET);
    if (!sheet) return;

    const lastRow = Math.max(sheet.getLastRow(), 100);

    if (lastRow > 1) {
      const dataRange = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
      dataRange.applyRowBanding(SpreadsheetApp.BandingTheme.CYAN);
    }

    // Format currency and percentage columns
    this.setCurrencyFormat(sheet, 'Asking Price');
    this.setCurrencyFormat(sheet, 'Suggested Offer');
    this.setCurrencyFormat(sheet, 'Profit $');
    this.setPercentFormat(sheet, 'Profit %');
    this.setPercentFormat(sheet, 'Confidence');
  }

  /**
   * Format Buyback Matrix
   */
  private formatBuybackMatrix(): void {
    const sheet = this.spreadsheet.getSheetByName(SheetName.BUYBACK_MATRIX);
    if (!sheet) return;

    // Format all grade columns as currency
    const gradeColumns = ['Grade A', 'Grade B+', 'Grade B', 'Grade C', 'Grade D'];
    gradeColumns.forEach(col => this.setCurrencyFormat(sheet, col));
  }

  /**
   * Set currency format for a column
   */
  private setCurrencyFormat(sheet: GoogleAppsScript.Spreadsheet.Sheet, columnName: string): void {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const colIndex = headers.indexOf(columnName);

    if (colIndex >= 0) {
      const lastRow = Math.max(sheet.getLastRow(), 100);
      if (lastRow > 1) {
        sheet.getRange(2, colIndex + 1, lastRow - 1, 1).setNumberFormat('$#,##0.00');
      }
    }
  }

  /**
   * Set percentage format for a column
   */
  private setPercentFormat(sheet: GoogleAppsScript.Spreadsheet.Sheet, columnName: string): void {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const colIndex = headers.indexOf(columnName);

    if (colIndex >= 0) {
      const lastRow = Math.max(sheet.getLastRow(), 100);
      if (lastRow > 1) {
        sheet.getRange(2, colIndex + 1, lastRow - 1, 1).setNumberFormat('0.0%');
      }
    }
  }

  /**
   * Get or create a sheet
   */
  public getOrCreateSheet(name: string): GoogleAppsScript.Spreadsheet.Sheet {
    let sheet = this.spreadsheet.getSheetByName(name);
    if (!sheet) {
      sheet = this.spreadsheet.insertSheet(name);
    }
    return sheet;
  }

  /**
   * Clear a sheet's data (keep headers)
   */
  public clearSheetData(sheetName: string): void {
    const sheet = this.spreadsheet.getSheetByName(sheetName);
    if (!sheet) return;

    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    }
  }

  /**
   * Log to system log sheet
   */
  public log(message: string, level: 'INFO' | 'WARNING' | 'ERROR' = 'INFO'): void {
    const sheet = this.getOrCreateSheet(SheetName.SYSTEM_LOG);
    sheet.appendRow([new Date(), level, message]);

    // Also log to Apps Script logger
    Logger.log(`[${level}] ${message}`);
  }

  /**
   * Log error to error log sheet
   */
  public logError(error: Error, context?: string): void {
    const sheet = this.getOrCreateSheet(SheetName.ERROR_LOG);
    sheet.appendRow([
      new Date(),
      error.name,
      error.message,
      error.stack || '',
      context || ''
    ]);

    Logger.log(`ERROR: ${error.message}`);
  }
}
