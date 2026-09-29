/**
 * ===== FILE: TM_buyer_prices.gs =====
 * 📱💰 Thrifty Mobile Quantum 5.0 - Buyer Price Feed & Best Exit
 *
 * This file builds the BEST_EXIT derived view from the BUYER_PRICES raw
 * feed (top/second price per model+storage+grade, with staleness flagging),
 * and provides a one-time migration from the legacy single-buyer
 * BUYBACK_PARTNER_PRICING sheet into BUYER_PRICES.
 *
 * No prices are ever hardcoded here - everything is read from sheet cells
 * at run time and carries a buyer ID + sheet date.
 */

// =============================================================================
// BEST EXIT COMPUTATION
// =============================================================================

/**
 * Rebuild BEST_EXIT from BUYER_PRICES: for every Category+Brand+Model+Storage+Grade
 * group, find the top and second-highest price across all buyers, and flag the
 * result stale if the top price's Sheet Date is older than STALE_PRICE_DAYS.
 */
function TM_computeBestExit() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pricesSheet = ss.getSheetByName(TM_SHEETS.BUYER_PRICES);

  if (!pricesSheet || pricesSheet.getLastRow() < 2) {
    TM_showAlert('BUYER_PRICES sheet is empty. Enter buyer prices first (or run the legacy migration).', 'Best Exit');
    return;
  }

  const rows = TM_sheetToObjects(pricesSheet);
  const staleDays = TM_getNumericSetting('STALE_PRICE_DAYS', 14);
  const groups = {};

  rows.forEach(function(row) {
    const price = TM_parsePrice(row['Price']);
    const buyerId = row['Buyer ID'];
    if (!price || !buyerId) return; // skip incomplete rows

    const category = row['Category'] || '';
    const brand = row['Brand'] || '';
    const model = row['Model'] || '';
    const storage = row['Storage'] || '';
    const grade = row['Grade'] || '';
    const key = [category, brand, model, storage, grade].join('|');

    if (!groups[key]) {
      groups[key] = { category: category, brand: brand, model: model, storage: storage, grade: grade, entries: [] };
    }

    groups[key].entries.push({
      price: price,
      buyerId: buyerId,
      sheetDate: row['Sheet Date'] instanceof Date ? row['Sheet Date'] : null
    });
  });

  const outputRows = [];

  Object.keys(groups).forEach(function(key) {
    const group = groups[key];
    group.entries.sort(function(a, b) { return b.price - a.price; });

    const top = group.entries[0];
    const second = group.entries[1];
    const isStale = !top.sheetDate || !TM_isWithinDays(top.sheetDate, staleDays);

    outputRows.push([
      group.category,
      group.brand,
      group.model,
      group.storage,
      group.grade,
      top.price,
      top.buyerId,
      top.sheetDate || '',
      second ? second.price : '',
      second ? second.buyerId : '',
      isStale ? 'STALE' : 'FRESH',
      new Date()
    ]);
  });

  TM_setupBestExit(ss); // ensure the sheet (and headers/formatting) exist even on a brand-new setup
  const bestExitSheet = ss.getSheetByName(TM_SHEETS.BEST_EXIT);

  // Clear old data rows (keep header) before writing the fresh computation
  const lastRow = bestExitSheet.getLastRow();
  if (lastRow > 1) {
    bestExitSheet.getRange(2, 1, lastRow - 1, TM_HEADERS_BEST_EXIT.length).clearContent();
  }

  if (outputRows.length > 0) {
    bestExitSheet.getRange(2, 1, outputRows.length, TM_HEADERS_BEST_EXIT.length).setValues(outputRows);
  }

  TM_logEvent(TM_LOG_TYPES.SUCCESS, 'TM_computeBestExit',
    `Computed best exit for ${outputRows.length} model/storage/grade combinations`);
  TM_showToast(`Best Exit rebuilt: ${outputRows.length} combinations.`, 'Best Exit', 5);
}

/**
 * Look up the best-exit row for a given model+storage+grade, or null if none found.
 * Intended for use by MAO calculation logic.
 * @param {string} model
 * @param {string} storage
 * @param {string} grade
 * @returns {Object|null} { topPrice, topBuyer, topSheetDate, secondPrice, secondBuyer, isStale }
 */
function TM_getBestExit(model, storage, grade) {
  const sheet = TM_getSheet(TM_SHEETS.BEST_EXIT);
  if (!sheet || sheet.getLastRow() < 2) return null;

  const rows = TM_sheetToObjects(sheet);
  const match = rows.find(function(row) {
    return row['Model'] === model && row['Storage'] === storage && row['Grade'] === grade;
  });

  if (!match) return null;

  return {
    topPrice: TM_parsePrice(match['Top Price']),
    topBuyer: match['Top Buyer'],
    topSheetDate: match['Top Sheet Date'],
    secondPrice: TM_parsePrice(match['Second Price']),
    secondBuyer: match['Second Buyer'],
    isStale: match['Stale?'] === 'STALE'
  };
}

// =============================================================================
// LEGACY MIGRATION
// =============================================================================

/**
 * One-time migration: expand the legacy single-buyer BUYBACK_PARTNER_PRICING
 * sheet (Brand/Model/Variant/Storage/Grade A.../DOA columns) into individual
 * BUYER_PRICES rows tagged with a buyer ID and sheet date supplied by the user.
 * Prices are read from the sheet, never hardcoded here.
 */
function TM_migrateLegacyBuybackPricingToBuyerPrices() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const legacySheet = ss.getSheetByName(TM_SHEETS.BUYBACK_PARTNER_PRICING);

  if (!legacySheet || legacySheet.getLastRow() < 2) {
    TM_showAlert('BUYBACK_PARTNER_PRICING has no data to migrate.', 'Migrate Legacy Pricing');
    return;
  }

  const ui = SpreadsheetApp.getUi();

  const buyerResponse = ui.prompt('Migrate Legacy Pricing', 'Buyer ID for this price sheet (e.g. Atlas Mobile):', ui.ButtonSet.OK_CANCEL);
  if (buyerResponse.getSelectedButton() !== ui.Button.OK) return;
  const buyerId = buyerResponse.getResponseText().trim();
  if (!buyerId) {
    TM_showAlert('Buyer ID is required.', 'Migrate Legacy Pricing');
    return;
  }

  const dateResponse = ui.prompt('Migrate Legacy Pricing',
    'Sheet date these prices are from (YYYY-MM-DD). Leave blank for today:', ui.ButtonSet.OK_CANCEL);
  if (dateResponse.getSelectedButton() !== ui.Button.OK) return;
  const dateText = dateResponse.getResponseText().trim();
  const sheetDate = dateText ? new Date(dateText) : new Date();
  if (isNaN(sheetDate.getTime())) {
    TM_showAlert('Could not parse that date. Use YYYY-MM-DD.', 'Migrate Legacy Pricing');
    return;
  }

  const gradeColumnMap = {
    'A': 'Grade A',
    'B+': 'Grade B+',
    'B': 'Grade B',
    'C': 'Grade C',
    'D': 'Grade D',
    'DOA': 'DOA'
  };

  const legacyRows = TM_sheetToObjects(legacySheet);
  const newRows = [];

  legacyRows.forEach(function(row) {
    const brand = row['Brand'] || '';
    const model = row['Model'] || '';
    const storage = row['Storage'] || '';
    const notes = row['Notes'] || '';
    const category = TM_inferCategoryFromBrand(brand, model);

    TM_GRADES.forEach(function(grade) {
      const price = TM_parsePrice(row[gradeColumnMap[grade]]);
      if (!price) return; // skip blank/zero cells rather than writing a fake price

      newRows.push([
        category,
        brand,
        model,
        storage,
        'Unlocked',
        'Used',
        grade,
        buyerId,
        price,
        sheetDate,
        'Sheets Link',
        notes,
        new Date()
      ]);
    });
  });

  if (newRows.length === 0) {
    TM_showAlert('No priced grades found to migrate.', 'Migrate Legacy Pricing');
    return;
  }

  TM_setupBuyerPrices(ss); // ensure the sheet (and headers/formatting) exist even on a brand-new setup
  const buyerPricesSheet = ss.getSheetByName(TM_SHEETS.BUYER_PRICES);
  const startRow = buyerPricesSheet.getLastRow() + 1;
  buyerPricesSheet.getRange(startRow, 1, newRows.length, TM_HEADERS_BUYER_PRICES.length).setValues(newRows);

  TM_logEvent(TM_LOG_TYPES.SUCCESS, 'TM_migrateLegacyBuybackPricingToBuyerPrices',
    `Migrated ${newRows.length} price rows for buyer "${buyerId}"`);
  TM_showAlert(`Migrated ${newRows.length} price rows into BUYER_PRICES for buyer "${buyerId}".\n\nRun "Recalculate Best Exit Prices" next.`, 'Migrate Legacy Pricing');
}

/**
 * Infer a device category from brand/model text using the existing TM_DEVICE_TYPES list.
 * @param {string} brand
 * @param {string} model
 * @returns {string} One of TM_DEVICE_TYPES
 */
function TM_inferCategoryFromBrand(brand, model) {
  const b = (brand || '').toLowerCase();
  const m = (model || '').toLowerCase();

  if (b === 'apple') {
    if (m.indexOf('ipad') !== -1) return 'iPad';
    if (m.indexOf('macbook') !== -1) return 'MacBook';
    if (m.indexOf('watch') !== -1) return 'Apple Watch';
    if (m.indexOf('airpods') !== -1) return 'AirPods';
    return 'iPhone';
  }
  if (b === 'samsung') {
    if (m.indexOf('watch') !== -1) return 'Samsung Watch';
    if (m.indexOf('tab') !== -1) return 'Samsung Tablet';
    return 'Samsung Galaxy';
  }
  if (b === 'google') return 'Google Pixel';
  if (b === 'oneplus') return 'OnePlus';

  return 'Other';
}
