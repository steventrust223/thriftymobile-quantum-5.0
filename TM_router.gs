/**
 * ===== FILE: TM_router.gs =====
 * 📱💰 Thrifty Mobile Quantum 5.0 - Transaction Routing Engine
 *
 * Transaction Router v1.0 — Thrifty Mobile Quantum
 *
 * Decides HOW a deal should be executed (payment / shipping method)
 * based on an Exposure Risk Score (ERS) and post-fee margin analysis.
 *
 * Inputs (read from active sheet, by header name):
 *   - Purchase Price
 *   - Resale Value
 *   - Seller Trust    (Unknown | Light Verified | Repeat Seller | Trusted)
 *   - Listing Source  (Craigslist | Facebook MP | OfferUp | Swappa | eBay | Referral)
 *
 * Outputs (written to active sheet, created if missing):
 *   - TM_Route_Method
 *   - TM_Route_Confidence
 *   - TM_Route_RiskScore
 *   - TM_Route_Reasoning
 *   - TM_Route_NextAction
 *   - TM_Route_PostFeeMargin
 */

// =============================================================================
// SCORING CONSTANTS — tune these to retune the router without touching logic
// =============================================================================

/**
 * Item value risk tiers. Higher-priced devices carry more exposure because a
 * bad deal hurts more and the incentive for counterparty fraud grows with
 * ticket size.
 */
const TM_ROUTE_VALUE_TIERS = [
  { max: 150,  score: 15 },
  { max: 400,  score: 40 },
  { max: 750,  score: 70 },
  { max: Infinity, score: 95 }
];

/**
 * Seller trust -> risk score. INVERTED on purpose: lower trust produces a
 * higher risk score so the composite ERS grows when we don't know who we're
 * dealing with.
 */
const TM_ROUTE_TRUST_SCORES = {
  'Unknown':        90,
  'Light Verified': 65,
  'Repeat Seller':  35,
  'Trusted':        10
};

/**
 * Listing source risk. Craigslist / FB Marketplace are the wild west;
 * Swappa / eBay have buyer protection baked in so exposure is much lower.
 */
const TM_ROUTE_SOURCE_SCORES = {
  'Craigslist':  90,
  'Facebook MP': 70,
  'OfferUp':     55,
  'Swappa':      30,
  'eBay':        15,
  'Referral':    20
};

/**
 * ERS = weighted sum of the three component scores. Weights sum to 1.0.
 * Value is the biggest lever (40%), then seller trust (35%), then source (25%).
 */
const TM_ROUTE_WEIGHTS = {
  value:  0.40,
  trust:  0.35,
  source: 0.25
};

/**
 * Fee assumptions used to compute post-fee margins. These are conservative
 * blended rates — not every category hits 13.15% on eBay, but this keeps the
 * router from recommending platform routing on deals that only barely clear.
 */
const TM_ROUTE_FEES = {
  PLATFORM_PCT: 0.1315,  // eBay blended (final value + payment processing)
  PAYPAL_PCT:   0.0349,  // PayPal Goods & Services percent
  PAYPAL_FLAT:  0.49     // PayPal Goods & Services flat fee per transaction
};

/**
 * Minimum post-fee margin % required to route through a platform. Below
 * this the time + shipping overhead eats the deal even if nominal margin
 * is positive, so we'd rather flip locally.
 */
const TM_ROUTE_PLATFORM_MARGIN_FLOOR_PCT = 8;

/**
 * Output column headers. Prefixed TM_Route_ so they never collide with
 * existing analysis columns and are easy to filter on.
 */
const TM_ROUTE_OUTPUT_HEADERS = [
  'TM_Route_Method',
  'TM_Route_Confidence',
  'TM_Route_RiskScore',
  'TM_Route_Reasoning',
  'TM_Route_NextAction',
  'TM_Route_PostFeeMargin'
];

/**
 * Input column headers we expect to find in row 1. If any are missing
 * routeTransaction() throws so the caller knows the sheet isn't wired up.
 */
const TM_ROUTE_INPUT_HEADERS = {
  price:  'Purchase Price',
  resale: 'Resale Value',
  trust:  'Seller Trust',
  source: 'Listing Source'
};

/**
 * Possible names for the gating verdict column used by the batch runner.
 * The first match wins; if none are found the batch processes everything
 * with price data.
 */
const TM_ROUTE_VERDICT_HEADERS = ['Verdict', 'Quantum Verdict', 'Final Verdict'];

/**
 * Method -> background/text colors for conditional formatting on the
 * TM_Route_Method column.
 */
const TM_ROUTE_METHOD_COLORS = {
  'PLATFORM':   { bg: '#DBEAFE', fg: '#1E40AF' }, // blue
  'PAYPAL G&S': { bg: '#FEF9C3', fg: '#92400E' }, // amber
  'LOCAL ONLY': { bg: '#FEE2E2', fg: '#991B1B' }, // red
  'LOCAL':      { bg: '#FFEDD5', fg: '#9A3412' }, // orange
  'DIRECT OK':  { bg: '#DCFCE7', fg: '#166534' }  // green
};

// =============================================================================
// PUBLIC API — call these from menus, triggers, or other scripts
// =============================================================================

/**
 * Route a single deal. If no row is passed, uses the currently selected row.
 *
 * @param {number} [row] 1-indexed row number on the active sheet
 * @return {Object|null} the routing decision, or null if the row had no data
 */
function routeTransaction(row) {
  const sheet = SpreadsheetApp.getActiveSheet();

  // Resolve the target row. Default to whatever the user has selected.
  if (row == null) {
    row = sheet.getActiveRange().getRow();
  }
  if (row < 2) {
    SpreadsheetApp.getUi().alert('Select a data row (not the header) before routing.');
    return null;
  }

  TM_showToast('Routing deal on row ' + row + '...', 'Transaction Router', 3);

  try {
    const cols = TM_Route_resolveColumns_(sheet);
    const decision = TM_Route_processRow_(sheet, row, cols);

    if (decision) {
      TM_Route_applyMethodFormatting_(sheet, cols.out.TM_Route_Method);
      TM_showToast('Routed: ' + decision.method, 'Transaction Router', 4);
    } else {
      TM_showToast('Row ' + row + ' has no price data — skipped.', 'Transaction Router', 4);
    }
    return decision;

  } catch (err) {
    Logger.log('routeTransaction error on row ' + row + ': ' + err.message);
    SpreadsheetApp.getUi().alert('Transaction Router error: ' + err.message);
    return null;
  }
}

/**
 * Batch version — routes every row whose verdict column indicates a passing
 * deal (BUY / STRONG / GO, case-insensitive). If no verdict column is present,
 * routes every row that has price + resale data.
 *
 * Errors on individual rows are logged but don't abort the batch.
 */
function routeAllTransactions() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('No data rows to route.');
    return;
  }

  let cols;
  try {
    cols = TM_Route_resolveColumns_(sheet);
  } catch (err) {
    SpreadsheetApp.getUi().alert('Transaction Router setup error: ' + err.message);
    return;
  }

  // Locate the verdict column once, up front. It's optional — if it's not
  // present we skip the gating check entirely.
  const verdictCol = TM_Route_findVerdictColumn_(sheet);

  TM_showToast('Routing all qualifying deals...', 'Transaction Router', 5);

  let routed = 0;
  let skipped = 0;
  let failed = 0;

  for (let r = 2; r <= lastRow; r++) {
    // Gate: if a verdict column exists, only route rows that passed.
    if (verdictCol) {
      const verdict = String(sheet.getRange(r, verdictCol).getValue() || '').toUpperCase();
      if (!verdict || !(verdict.indexOf('BUY') >= 0 ||
                        verdict.indexOf('STRONG') >= 0 ||
                        verdict.indexOf('GO') >= 0)) {
        skipped++;
        continue;
      }
    }

    try {
      const decision = TM_Route_processRow_(sheet, r, cols);
      if (decision) {
        routed++;
      } else {
        skipped++;
      }
    } catch (err) {
      // Log and keep going — one bad row shouldn't kill the batch.
      failed++;
      Logger.log('routeAllTransactions row ' + r + ' failed: ' + err.message);
    }
  }

  // Apply formatting once at the end instead of per-row for speed.
  TM_Route_applyMethodFormatting_(sheet, cols.out.TM_Route_Method);

  const msg = 'Complete: ' + routed + ' deals routed, ' +
              skipped + ' skipped, ' + failed + ' failed.';
  TM_showToast(msg, 'Transaction Router', 8);
  Logger.log(msg);
}

// =============================================================================
// CORE ENGINE — pure-ish helpers, easy to unit test in isolation
// =============================================================================

/**
 * Compute an ERS + margin analysis + routing decision for a single row.
 * Writes results back to the sheet and returns the decision object.
 *
 * Returns null if the row lacks a price or resale value (caller should skip).
 */
function TM_Route_processRow_(sheet, row, cols) {
  const priceRaw  = sheet.getRange(row, cols.in.price).getValue();
  const resaleRaw = sheet.getRange(row, cols.in.resale).getValue();
  const trustRaw  = sheet.getRange(row, cols.in.trust).getValue();
  const sourceRaw = sheet.getRange(row, cols.in.source).getValue();

  const purchasePrice = Number(priceRaw)  || 0;
  const resaleValue   = Number(resaleRaw) || 0;

  // Empty / zero row -> nothing to route. Caller counts this as a skip.
  if (purchasePrice <= 0 || resaleValue <= 0) {
    return null;
  }

  const decision = TM_Route_decide_({
    purchasePrice: purchasePrice,
    resaleValue:   resaleValue,
    sellerTrust:   String(trustRaw || '').trim(),
    listingSource: String(sourceRaw || '').trim()
  });

  // Write outputs in one go per cell — Apps Script is snappy enough here and
  // writing the whole row in a single setValues() would force us to reorder
  // by absolute column index.
  sheet.getRange(row, cols.out.TM_Route_Method).setValue(decision.method);
  sheet.getRange(row, cols.out.TM_Route_Confidence).setValue(decision.confidence);
  sheet.getRange(row, cols.out.TM_Route_RiskScore).setValue(decision.ers);
  sheet.getRange(row, cols.out.TM_Route_Reasoning).setValue(decision.reasoning);
  sheet.getRange(row, cols.out.TM_Route_NextAction).setValue(decision.nextAction);
  sheet.getRange(row, cols.out.TM_Route_PostFeeMargin).setValue(decision.postFeeMargin);

  Logger.log('Row ' + row + ' routed: ERS=' + decision.ers +
             ' method=' + decision.method +
             ' confidence=' + decision.confidence +
             ' postFeeMargin=$' + decision.postFeeMargin.toFixed(2));

  return decision;
}

/**
 * Pure decision function. Given deal facts, produces a routing verdict.
 * Kept separate from sheet I/O so it can be unit tested and reused.
 *
 * @param {{purchasePrice:number, resaleValue:number,
 *          sellerTrust:string, listingSource:string}} deal
 * @return {{ers:number, method:string, confidence:string,
 *           reasoning:string, nextAction:string, postFeeMargin:number}}
 */
function TM_Route_decide_(deal) {
  // --- Step 1: component risk scores ----------------------------------------
  const valueScore  = TM_Route_scoreValue_(deal.purchasePrice);
  const trustScore  = TM_Route_lookupScore_(
      TM_ROUTE_TRUST_SCORES, deal.sellerTrust, 90); // unknown trust = max risk
  const sourceScore = TM_Route_lookupScore_(
      TM_ROUTE_SOURCE_SCORES, deal.listingSource, 70); // unknown source = FB-ish

  // --- Step 2: weighted composite, rounded to an integer --------------------
  const ersRaw =
      valueScore  * TM_ROUTE_WEIGHTS.value  +
      trustScore  * TM_ROUTE_WEIGHTS.trust  +
      sourceScore * TM_ROUTE_WEIGHTS.source;
  const ers = Math.round(ersRaw);

  // --- Step 3: margin constraint check --------------------------------------
  const rawMargin      = deal.resaleValue - deal.purchasePrice;
  const marginPct      = (rawMargin / deal.purchasePrice) * 100;
  const platformMargin = rawMargin - (deal.purchasePrice * TM_ROUTE_FEES.PLATFORM_PCT);
  const paypalMargin   = rawMargin -
      (deal.purchasePrice * TM_ROUTE_FEES.PAYPAL_PCT + TM_ROUTE_FEES.PAYPAL_FLAT);

  const platformMarginPct = (platformMargin / deal.purchasePrice) * 100;
  const canAffordPlatform = platformMargin > 0 &&
                            platformMarginPct >= TM_ROUTE_PLATFORM_MARGIN_FLOOR_PCT;
  const canAffordPaypal   = paypalMargin > 0;

  // --- Step 4: route based on ERS band + margin constraints -----------------
  let method, confidence, reasoning;

  if (ers >= 76) {
    // Critical risk — we want maximum buyer protection if margin allows.
    if (canAffordPlatform) {
      method = 'PLATFORM (eBay/Mercari)';
      confidence = 'HIGH';
      reasoning = 'Critical exposure risk (ERS ' + ers + '). ' +
                  'Platform routing covers us with buyer protection and ' +
                  'margin (' + platformMarginPct.toFixed(1) + '%) absorbs fees.';
    } else {
      method = 'LOCAL ONLY';
      confidence = 'HIGH';
      reasoning = 'Critical exposure risk (ERS ' + ers + ') and margin ' +
                  'cannot absorb platform fees (' +
                  platformMarginPct.toFixed(1) + '% post-fee). ' +
                  'Local cash only — do not ship.';
    }

  } else if (ers >= 51) {
    // High risk — prefer platform, fall back to PayPal G&S, then local.
    if (canAffordPlatform) {
      method = 'PLATFORM (eBay/Mercari)';
      confidence = 'MEDIUM';
      reasoning = 'High risk (ERS ' + ers + '). Platform routing preferred ' +
                  'and margin allows it (' +
                  platformMarginPct.toFixed(1) + '% post-fee).';
    } else if (canAffordPaypal) {
      method = 'PAYPAL G&S';
      confidence = 'MEDIUM';
      reasoning = 'High risk (ERS ' + ers + ') but platform margin too thin ' +
                  '(' + platformMarginPct.toFixed(1) + '%). ' +
                  'PayPal G&S gives partial protection and still clears.';
    } else {
      method = 'LOCAL ONLY';
      confidence = 'HIGH';
      reasoning = 'High risk (ERS ' + ers + ') and margin cannot absorb any ' +
                  'protected-payment fees. Local cash only.';
    }

  } else if (ers >= 26) {
    // Moderate risk — PayPal G&S is enough unless margin is too tight.
    if (canAffordPaypal) {
      method = 'PAYPAL G&S';
      confidence = 'MEDIUM';
      reasoning = 'Moderate risk (ERS ' + ers + '). PayPal G&S protection ' +
                  'is sufficient at this exposure level.';
    } else {
      method = 'LOCAL';
      confidence = 'LOW';
      reasoning = 'Moderate risk (ERS ' + ers + ') but PayPal fees wipe ' +
                  'out the margin. Prefer local cash handoff.';
    }

  } else {
    // Low risk — direct is fine if margin is fat; otherwise cheap PayPal G&S.
    if (marginPct >= 25) {
      method = 'DIRECT OK';
      confidence = 'MEDIUM';
      reasoning = 'Low risk (ERS ' + ers + ') and healthy margin ' +
                  '(' + marginPct.toFixed(1) + '%). Direct payment acceptable.';
    } else {
      method = 'PAYPAL G&S';
      confidence = 'LOW';
      reasoning = 'Low risk (ERS ' + ers + ') but thin margin ' +
                  '(' + marginPct.toFixed(1) + '%). PayPal G&S adds cheap ' +
                  'insurance without eating the spread.';
    }
  }

  // --- Step 5: next action text --------------------------------------------
  let nextAction;
  if (ers >= 51) {
    nextAction = 'Request seller list on platform or send PayPal G&S invoice. ' +
                 'Verify IMEI before exchange.';
  } else if (ers >= 26) {
    nextAction = 'Proceed with ' + method + '. Verify IMEI. ' +
                 'Document device condition with photos.';
  } else {
    nextAction = 'Proceed with ' + method + '. Standard IMEI check.';
  }

  // --- Step 6: post-fee margin matching the selected method -----------------
  let postFeeMargin;
  if (method.indexOf('PLATFORM') === 0) {
    postFeeMargin = platformMargin;
  } else if (method === 'PAYPAL G&S') {
    postFeeMargin = paypalMargin;
  } else {
    // LOCAL, LOCAL ONLY, DIRECT OK — no platform / processor fees.
    postFeeMargin = rawMargin;
  }

  return {
    ers: ers,
    method: method,
    confidence: confidence,
    reasoning: reasoning,
    nextAction: nextAction,
    postFeeMargin: Math.round(postFeeMargin * 100) / 100
  };
}

/**
 * Walk the value tiers table and return the first matching score. Tiers
 * are defined as "<= max" thresholds so they're easy to read top to bottom.
 */
function TM_Route_scoreValue_(price) {
  for (let i = 0; i < TM_ROUTE_VALUE_TIERS.length; i++) {
    if (price <= TM_ROUTE_VALUE_TIERS[i].max) {
      return TM_ROUTE_VALUE_TIERS[i].score;
    }
  }
  return TM_ROUTE_VALUE_TIERS[TM_ROUTE_VALUE_TIERS.length - 1].score;
}

/**
 * Case-sensitive lookup with a fallback for unknown / misspelled values.
 * Falling back to a conservative default keeps the router from silently
 * scoring a typo as zero risk.
 */
function TM_Route_lookupScore_(table, key, fallback) {
  if (table.hasOwnProperty(key)) {
    return table[key];
  }
  return fallback;
}

// =============================================================================
// SHEET I/O HELPERS
// =============================================================================

/**
 * Resolve input and output column positions by header name. Creates any
 * missing output headers by appending to the right of existing data.
 *
 * Returns:
 *   { in:  { price, resale, trust, source },
 *     out: { TM_Route_Method, TM_Route_Confidence, ... } }
 */
function TM_Route_resolveColumns_(sheet) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  // Build a header -> column number map so lookups are O(1).
  const headerMap = {};
  for (let c = 0; c < headerRow.length; c++) {
    const h = String(headerRow[c] || '').trim();
    if (h) headerMap[h] = c + 1;
  }

  // --- Inputs: required, throw if missing ----------------------------------
  const input = {};
  Object.keys(TM_ROUTE_INPUT_HEADERS).forEach(function(key) {
    const headerText = TM_ROUTE_INPUT_HEADERS[key];
    if (!headerMap[headerText]) {
      throw new Error('Missing required input column: "' + headerText + '". ' +
                      'Add it to row 1 of the active sheet.');
    }
    input[key] = headerMap[headerText];
  });

  // --- Outputs: create any that are missing, then return positions ---------
  const output = {};
  let nextCol = lastCol + 1;
  TM_ROUTE_OUTPUT_HEADERS.forEach(function(h) {
    if (headerMap[h]) {
      output[h] = headerMap[h];
    } else {
      sheet.getRange(1, nextCol).setValue(h)
          .setFontWeight('bold')
          .setBackground('#1F2937')
          .setFontColor('#FFFFFF');
      output[h] = nextCol;
      headerMap[h] = nextCol;
      nextCol++;
    }
  });

  return { in: input, out: output };
}

/**
 * Find the column index of the first matching verdict header, or 0 if none.
 */
function TM_Route_findVerdictColumn_(sheet) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  for (let c = 0; c < headerRow.length; c++) {
    const h = String(headerRow[c] || '').trim();
    for (let i = 0; i < TM_ROUTE_VERDICT_HEADERS.length; i++) {
      if (h === TM_ROUTE_VERDICT_HEADERS[i]) return c + 1;
    }
  }
  return 0;
}

/**
 * Paint the TM_Route_Method column with a simple color scheme so humans
 * can scan the sheet at a glance. Clears and reapplies each run.
 */
function TM_Route_applyMethodFormatting_(sheet, methodCol) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const range = sheet.getRange(2, methodCol, lastRow - 1, 1);
  const values = range.getValues();

  const bgs = [];
  const fgs = [];

  for (let i = 0; i < values.length; i++) {
    const v = String(values[i][0] || '');
    let colors = null;

    // Order matters: "PAYPAL G&S" must be checked before "LOCAL" since the
    // substring search walks the color table keys.
    if (v.indexOf('PLATFORM') === 0) {
      colors = TM_ROUTE_METHOD_COLORS['PLATFORM'];
    } else if (v === 'PAYPAL G&S') {
      colors = TM_ROUTE_METHOD_COLORS['PAYPAL G&S'];
    } else if (v === 'LOCAL ONLY') {
      colors = TM_ROUTE_METHOD_COLORS['LOCAL ONLY'];
    } else if (v === 'LOCAL') {
      colors = TM_ROUTE_METHOD_COLORS['LOCAL'];
    } else if (v === 'DIRECT OK') {
      colors = TM_ROUTE_METHOD_COLORS['DIRECT OK'];
    }

    if (colors) {
      bgs.push([colors.bg]);
      fgs.push([colors.fg]);
    } else {
      bgs.push([null]);
      fgs.push([null]);
    }
  }

  range.setBackgrounds(bgs);
  range.setFontColors(fgs);
}

// =============================================================================
// SELF-TEST — run TM_Route_selfTest() from the script editor to sanity-check
// the engine without touching the sheet.
// =============================================================================

/**
 * Runs the canonical worked example through TM_Route_decide_() and logs
 * the result. Expected: ERS 77, method PLATFORM (eBay/Mercari), HIGH conf.
 */
function TM_Route_selfTest() {
  const deal = {
    purchasePrice: 700,
    resaleValue:   950,
    sellerTrust:   'Unknown',
    listingSource: 'Facebook MP'
  };
  const decision = TM_Route_decide_(deal);
  Logger.log('Self-test deal: ' + JSON.stringify(deal));
  Logger.log('Self-test result: ' + JSON.stringify(decision));
  return decision;
}
