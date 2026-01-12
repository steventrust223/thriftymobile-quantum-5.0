# ThriftyMobile - Full System Architecture

## Overview

ThriftyMobile is a **device acquisition intelligence platform** that uses Google Sheets as the central command center. It combines web scraping, AI analysis, automated grading, profit calculation, and CRM integration into a single unified system.

## Core Principles

1. **Sheets = Brain** - All data, logic, and decisions flow through Google Sheets
2. **Apps Script = Nervous System** - Automation and processing layer
3. **AI = Judgment** - Claude provides human-level deal analysis
4. **CRM = Execution** - SMS-iT and OneHash handle operations
5. **Automation = Scale** - Zero manual babysitting required

---

## Data Pipeline

### Stage 1: Data Ingestion

**Source:** Browse AI robots scraping marketplaces

**Platforms:**
- Facebook Marketplace
- OfferUp
- Craigslist
- eBay
- Mercari

**Two-Robot Architecture (Critical):**
- **Robot A** → Listing pages (bulk scraping)
- **Robot B** → Individual listing detail pages (enrichment)

**Data Captured:**
- Title
- Model / Storage
- Asking price
- Description
- Seller location / ZIP
- Listing URL
- Platform
- Scrape timestamp
- Images (optional)

**Output:** Raw data → Import Sheets (one per platform)

---

### Stage 2: Cleaning & Normalization

**Module:** `DataCleaner.ts`

**Operations:**
1. Validate required fields (title, price)
2. Normalize price formats ($1,234.56)
3. Clean text (remove excess whitespace, special chars)
4. Validate URLs
5. Deduplicate by URL
6. Calculate data quality score (high/medium/low)

**Module:** `ModelParser.ts`

**Extraction Logic:**
- Device brand (Apple, Samsung, Google)
- Model name (iPhone 15 Pro Max)
- Storage capacity (256GB, 512GB, 1TB)
- Color (Titanium, Blue, etc.)
- Carrier (Unlocked, Verizon, AT&T, Cricket)
- Condition hints from description
- Issue detection (cracked screen, water damage, etc.)
- Location/ZIP parsing

**Output:** Cleaned data → Master Database

---

### Stage 3: Grading & Deduction Engine

**Module:** `GradingEngine.ts`

**Grading System:**
```
Grade A  → Mint/Like New
Grade B+ → Excellent
Grade B  → Good
Grade C  → Fair
Grade D  → Poor
DOA      → Dead on Arrival (auto-reject)
```

**Auto-Reject Conditions:**
- Blacklisted IMEI
- iCloud activation locked
- Reported stolen
- Total deductions > $300

**Deduction Rules:**
```typescript
DEVICE_ISSUES = {
  CRACKED_BACK: -$180,
  CRACKED_SCREEN: -$90,
  CRICKET_DEVICE: -$100,
  DEMO_UNIT: -$70,
  BLACKLISTED: AUTO_REJECT,
  ICLOUD_LOCKED: AUTO_REJECT,
  BATTERY_DEGRADED: -$30,
  WATER_DAMAGE: -$150,
  FACE_ID_BROKEN: -$80,
  CAMERA_BROKEN: -$60
}
```

**Partner Pricing Lookup:**
- Query Buyback Matrix sheet
- Match: Brand + Model + Storage + Grade
- Return: Partner buyback price

**Output:** Device grade, total deductions, partner buyback price

---

### Stage 4: Profit & MAO Calculation

**Module:** `ProfitEngine.ts`

**Core Formula:**

```
Adjusted Buyback = Partner Buyback - Total Deductions
MAO = (Adjusted Buyback / (1 + Min Profit Margin)) - Transaction Costs
Suggested Offer = MIN(Asking Price × 0.85, MAO)
Profit $ = Adjusted Buyback - Suggested Offer - Transaction Costs
Profit % = Profit $ / Suggested Offer
```

**Profit Tiers:**
- **Exceptional:** ≥100% margin
- **High:** ≥50% margin
- **Medium:** ≥25% margin
- **Low:** <25% margin

**Negotiation Strategy:**
```
IF Asking ≤ Suggested Offer → BUY NOW
IF Asking ≤ MAO × 1.1 → NEGOTIATE (10-15% down)
IF Asking ≤ MAO × 1.3 → NEGOTIATE (20-30% down)
ELSE → WATCH (wait for price drop)
```

**Output:** MAO, suggested offer, profit $, profit %, deal score

---

### Stage 5: AI Intelligence Layer

**Module:** `AIDecisionEngine.ts` + `ClaudeAPI.ts`

**Claude API Integration:**
- Model: `claude-3-5-sonnet-20241022`
- API: Anthropic Messages API
- Temperature: 0.7 (balanced creativity/consistency)

**AI Analysis Input:**
```json
{
  "device": { "model": "...", "condition": "..." },
  "pricing": { "asking": 500, "mao": 450, "profit": 150 },
  "description": "Full listing description...",
  "issues": ["Cracked back", "Demo unit"],
  "dataQuality": "high",
  "isHotSeller": false
}
```

**AI Analysis Output:**
```json
{
  "verdict": "STRONG BUY",
  "confidenceScore": 85,
  "riskScore": 2,
  "marketAdvantageScore": 8,
  "salesVelocityScore": 7,
  "suggestedMessage": "Hi! Interested in your iPhone...",
  "negotiationStrategy": "Move fast, slight discount acceptable",
  "notes": ["Exceptional profit margin", "Good description quality"],
  "redFlags": []
}
```

**AI-Generated Columns:**
- Verdict (BUY/STRONG BUY/NEGOTIATE/WATCH/PASS)
- Confidence Score (0-100%)
- Risk Score (0-10)
- Suggested Message (personalized SMS)
- Negotiation Strategy
- Notes & Red Flags

**Fallback Logic:**
If AI fails or disabled → rule-based analysis using profit tiers and thresholds

**Output:** Enriched deal with AI insights → Verdict Sheet

---

### Stage 6: Verdict Engine

**Module:** `VerdictGenerator.ts` (to be implemented)

**Ranking Algorithm:**
```
Deal Score =
  Profit Score (50 pts) +
  Price Competitiveness (20 pts) +
  Data Quality (15 pts) +
  Seller Rating (10 pts) +
  Distance Factor (5 pts)
```

**Filters:**
- Profitable deals only
- Confidence ≥ threshold (default 50%)
- Not auto-rejected
- Within max radius (default 50 miles)

**Sorting:**
1. Verdict (STRONG BUY → BUY → NEGOTIATE → WATCH)
2. Deal Score (highest first)
3. Profit $ (highest first)

**Output:** Verdict Sheet (ranked, filtered, actionable deals)

---

### Stage 7: CRM & Communication

**SMS-iT Integration** (`SMSITIntegration.ts`)

**Capabilities:**
- Send SMS to sellers
- Auto-contact high-confidence deals
- Log conversation history
- Track response times
- Manage seller contacts

**Message Generation:**
- AI-generated personalized messages
- Fallback templates
- Follow-up automation

**OneHash Integration** (`OneHashIntegration.ts`)

**Capabilities:**
- Sync deals as Leads
- Create inventory items (when purchased)
- Generate purchase invoices
- Track deal lifecycle
- Accounting integration

---

### Stage 8: Automation & Triggers

**Module:** `TriggerManager.ts` (to be implemented)

**Event Triggers:**
- **onOpen** → Initialize menu
- **New row in Import Sheets** → Process import
- **Status change** → Update CRM
- **High-profit detected** → Flag for immediate action
- **Time-based** → Refresh pricing, cleanup old data

**Automated Actions:**
- Process new imports
- Run AI analysis
- Send SMS offers
- Update verdict sheet
- Sync to CRM
- Generate reports

---

### Stage 9: Analytics & Dashboard

**Module:** `DashboardGenerator.ts` (to be implemented)

**KPIs Tracked:**
- Total deals processed
- Profit by platform (Facebook, OfferUp, etc.)
- Average profit margin
- Conversion rate (contacted → purchased)
- Deal velocity (listings/day)
- Seller quality scores
- Source ROI

**Visualization:**
- Pivot tables
- Charts (profit trends, platform comparison)
- Conditional formatting
- Real-time metrics

---

## Sheet Structure Details

### Master Database Columns (42 columns)

**Metadata (4):**
- ID, Timestamp, Platform, Status

**Raw Data (4):**
- Title, Description, Asking Price, Listing URL

**Device Info (7):**
- Brand, Model, Storage, Color, Carrier, Condition, Estimated Grade

**Seller Info (4):**
- Seller Name, Location, ZIP, Hot Seller?

**Grading (4):**
- Issues Detected, Total Deductions, Auto-Reject?, Partner Buyback Price

**Pricing (5):**
- MAO, Suggested Offer, Profit $, Profit %, Profit Tier

**AI Analysis (7):**
- Verdict, Confidence Score, Risk Score, Market Advantage, Sales Velocity, AI Notes, Suggested Message

**Tracking (4):**
- Assigned To, Last Contacted, Notes, Data Quality

### Verdict Sheet (Filtered View)

- Shows only actionable deals
- Ranked by deal score
- Quick actions: URL, suggested offer, message

### Settings Sheet

- Config key-value store
- API keys (Claude, SMS-iT, OneHash)
- Thresholds (profit %, max distance)
- Feature flags (enable AI, auto-messaging)

---

## Security Architecture

### API Key Management

**Storage:** Google Sheets Settings tab (not version controlled)

**Access:**
- Config.ts reads from Settings sheet
- Cached for 5 minutes
- Never logged or exposed

**Best Practices:**
- Use environment-specific keys
- Rotate keys regularly
- Enable IP restrictions where possible

### Data Privacy

- No PII stored in version control
- Seller info only in Sheets (access-controlled)
- SMS logs kept in CRM sheet

---

## Performance Considerations

### Caching Strategy

- Settings cached for 5 minutes
- Buyback Matrix cached per session
- API responses not cached (real-time analysis)

### Rate Limiting

- Claude API: 1 request/second
- SMS-iT: 1 message/second
- Batch processing with delays

### Sheet Optimization

- Frozen header rows
- Limited to 10,000 rows per sheet
- Archived old deals monthly
- Indexed columns (ID, Platform, Status)

---

## Error Handling

### Graceful Degradation

1. **AI fails** → Use rule-based analysis
2. **Buyback Matrix missing** → Log warning, skip pricing
3. **SMS-iT down** → Queue messages, retry later
4. **Invalid data** → Log to Error Log sheet, skip row

### Logging

- **System Log** → All operations (INFO, WARNING, ERROR)
- **Error Log** → Exceptions with stack traces
- Apps Script Logger → Development debugging

---

## Deployment Architecture

### Development Workflow

1. Code in TypeScript (`src/`)
2. Build to JavaScript (`dist/`)
3. Push to Apps Script via clasp
4. Test in Google Sheets
5. Deploy to production script

### Version Control

- Git repository for code
- Google Sheets for data (not version controlled)
- Apps Script versioned deployments

---

## Extension Points

### Adding New Platforms

1. Create new Import Sheet
2. Map Browse AI fields
3. Update Platform enum
4. No code changes needed

### Adding New Device Types

1. Update MODEL_PARSER patterns
2. Add to Buyback Matrix
3. Define issue types
4. Test grading logic

### Custom Grading Rules

1. Edit Deduction Rules sheet
2. Add to DEVICE_ISSUES map
3. Update GradingEngine logic

---

## Future Enhancements

### Planned Features

- [ ] Real-time Browse AI webhooks
- [ ] Mobile app (React Native)
- [ ] SMS reply parsing (sentiment analysis)
- [ ] Predictive pricing (ML model)
- [ ] Multi-user collaboration
- [ ] Geofencing alerts
- [ ] Automated scheduling (Google Calendar)
- [ ] Voice assistant integration

---

## Technical Stack Summary

**Frontend:**
- Google Sheets (UI)
- HTML/CSS/JS (Sidebar)

**Backend:**
- Google Apps Script (Node.js-like, V8 runtime)
- TypeScript (compiled to Apps Script JS)

**APIs:**
- Anthropic Claude API
- SMS-iT API
- OneHash API
- Browse AI (indirect via Sheets)

**Tools:**
- clasp (Apps Script CLI)
- TypeScript compiler
- npm (package management)

---

**This architecture is designed for:**
- ✅ Scale (1000+ deals/day)
- ✅ Reliability (graceful degradation)
- ✅ Maintainability (modular TypeScript)
- ✅ Extensibility (plugin-based integrations)
- ✅ Intelligence (AI-first decision making)

**Result:** A competitive advantage in phone buyback arbitrage.
