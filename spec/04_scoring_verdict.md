# 04 — Scoring & Verdict

## Buyback Matching (`TM_buyback_logic.gs`)

### Entry Point

`TM_runBuybackMatchingForAll()` — iterates `MASTER_DEVICE_DB`, matches each device to `BUYBACK_PARTNER_PRICING`, writes results back.

### Matching Logic

`TM_findPricingMatch(device, pricingData)` — fuzzy match on Brand (25 pts), Model (20-40 pts via `TM_fuzzyModelMatch`), Storage (10-25 pts via `TM_normalizeStorage`), Variant (0-10 pts). Returns best match with confidence score.

### Deductions

`TM_calculateDeductions(device)` — scans Title, Description, Condition (Raw), Device Flags, Auto Notes against `TM_ISSUE_KEYWORDS`. Amounts from `TM_DEDUCTIONS`:

| Deduction | Default $ |
|---|---|
| `CRACKED_BACK` | 180 |
| `CRACKED_LENS` | 90 |
| `CRICKET_CARRIER` | 100 |
| `DEMO_DEVICE` | 50 |
| `MISSING_STYLUS` | 25 |
| `HEAVY_SCRATCHES` | 30 |
| `BATTERY_HEALTH_LOW` | 40 |
| `NO_FACE_ID` | 100 |
| `NO_TOUCH_ID` | 75 |

Final buyback value = base price (by grade column) − total deductions (floored at 0).

Logged to `BUYBACK_MATCH` sheet via `TM_logBuybackMatches`.

## MAO & Profit Analysis (`TM_analysis.gs`)

### Entry Point

`TM_calculateMaoForAllDevices()` — calls `TM_analyzeDevice` per row, writes results to MASTER, logs to `MAO_ENGINE`.

### MAO Formula

```
MAO = Matched Buyback Value × (1 − TARGET_PROFIT_MARGIN)
```

Adjustments:
- Low risk (≤3): × `LOW_RISK_MULTIPLIER` (1.05)
- High risk (≥7): × `HIGH_RISK_MULTIPLIER` (0.90)
- Hot seller: × (1 + `HOT_SELLER_BONUS`) (1.03)
- Market advantage ≥20%: × (1 + `MARKET_ADV_BONUS`) (1.02)

`Offer Target = MAO × OFFER_TO_MAO_RATIO` (default 0.85), capped at 90% of asking price.

### Risk Scoring

`TM_calculateRiskScore(device)` — base 5, adjusted by grade (−2 to +3), deduction count, flag count, unknown/Cricket carrier, zero buyback value, hot seller (−1), distance. Clamped 1–10.

### Deal Classification

`TM_classifyDeal(profit, margin, riskScore)` — thresholds from `TM_DEAL_THRESHOLDS`:

| Class | Margin | Min Profit | Risk Constraint |
|---|---|---|---|
| `HOT DEAL` | ≥35% | ≥$100 | ≤5 (MEDIUM_RISK) |
| `SOLID DEAL` | ≥20% | ≥$50 | ≤7 (MAX_ACCEPTABLE_RISK) |
| `MARGINAL` | ≥10% | ≥$25 | ≤7 |
| `PASS` | below thresholds or risk >7 | — | — |

### Deal Score (for VERDICT ranking)

`TM_calculateDealScore(device)` — weighted from `TM_SCORE_WEIGHTS`:

| Component | Weight |
|---|---|
| `PROFIT_MARGIN` | 0.30 |
| `PROFIT_AMOUNT` | 0.25 |
| `RISK_INVERSE` | 0.20 |
| `MARKET_ADVANTAGE` | 0.15 |
| `HOT_SELLER` | 0.10 |

### Hot Seller Detection

`TM_detectHotSellers()` — counts qualifying deals (not PASS) per seller key. Threshold: `HOT_SELLER_MIN_DEALS` (default 3). Updates `Hot Seller?` column in MASTER and appends new sellers to `LEADS_TRACKER` via `TM_updateLeadsFromSellers`.

## Verdict Sheet (`TM_verdict.gs`)

### Entry Point

`TM_rebuildVerdictSheet()` — reads MASTER, scores/ranks all non-BLACKLISTED devices, writes to `VERDICT`.

### Action Determination

`TM_determineAction(device)` using `TM_ACTIONS`:

| Deal Class | Action |
|---|---|
| `HOT DEAL` | `CALL` (if contact exists) or `TEXT` |
| `SOLID DEAL` + hot seller | `CALL` |
| `SOLID DEAL` | `TEXT` |
| `MARGINAL` + low risk + hot seller | `TEXT` |
| `MARGINAL` | `HOLD` |
| `PASS` | `PASS` |

### Auto Seller Message

`TM_generateSellerMessage(entry, settings)` — fills template from `DEFAULT_SELLER_MESSAGE` setting with `{device}` and `${offer}` placeholders. Personalizes with first name for hot sellers.

### Action Updates

- `TM_markAsContacted(masterId)`
- `TM_markAsScheduled(masterId)`
- `TM_updateDealAction(masterId, newAction)`

### Data Access

- `TM_getTopDeals(count)`
- `TM_getDealsByClass(dealClass)`
- `TM_getActionableDeals()`
- `TM_getVerdictSummary()` — returns totals: hotDeals, solidDeals, marginal, pass, toCall, toText, totalProfit.
- `TM_getTopDealsForUi(count)` — formatted for HTML display.
