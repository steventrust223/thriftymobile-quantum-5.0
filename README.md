# ThriftyMobile Quantum 5.0

> **Automated Phone Buyback Intelligence System**
> Device acquisition + AI intelligence + negotiation + CRM + profit engine with Google Sheets as the command center

---

## 🎯 What is ThriftyMobile?

ThriftyMobile is **not just a spreadsheet**—it's a complete device acquisition and intelligence platform that:

- **Scrapes** marketplace listings (Facebook, OfferUp, Craigslist, eBay)
- **Analyzes** device condition, pricing, and profitability
- **Grades** devices using industry partner pricing matrices
- **Calculates** maximum allowable offers (MAO) and profit margins
- **Uses AI** (Claude) for intelligent decision-making and negotiation
- **Automates** seller contact via SMS-iT CRM
- **Tracks** deals through OneHash ERP
- **Reports** analytics and KPIs in real-time

**Google Sheets = The Brain.** Everything flows through Sheets. Apps Script = The nervous system.

---

## 🏗️ System Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    GOOGLE SHEETS (Brain)                     │
│  Import Hub → Master Database → Verdict Sheet → Analytics   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  APPS SCRIPT (Nervous System)                │
│  Data Cleaning → Grading → Profit Calc → AI Analysis        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL INTEGRATIONS                       │
│  Browse AI → Claude AI → SMS-iT CRM → OneHash ERP          │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Browse AI** scrapes marketplace listings
2. **Import Sheets** receive raw data
3. **Data Cleaner** normalizes and validates
4. **Model Parser** extracts device info
5. **Grading Engine** evaluates condition & applies deductions
6. **Profit Engine** calculates MAO and margins
7. **AI Decision Engine** (Claude) makes buy/pass decisions
8. **Verdict Sheet** displays ranked opportunities
9. **SMS-iT** contacts sellers automatically
10. **OneHash** tracks inventory & accounting

---

## 📊 Google Sheets Structure

### Core Sheets

| Sheet | Purpose |
|-------|---------|
| **Import Hub** | Browse AI raw imports |
| **Master Database** | Cleaned, enriched, analyzed deals |
| **Verdict Sheet** | Ranked, actionable opportunities |
| **Buyback Matrix** | Partner pricing by model + grade |
| **Settings** | Configuration & API keys |
| **Analytics** | KPIs, profit metrics, performance |

### Grading System

| Grade | Description | Typical Buyback |
|-------|-------------|-----------------|
| **A** | Mint/Like New | Highest value |
| **B+** | Excellent, minor wear | 85-95% of A |
| **B** | Good condition | 70-85% of A |
| **C** | Fair, moderate wear | 50-70% of A |
| **D** | Poor, heavy damage | 30-50% of A |
| **DOA** | Blacklisted/broken | Rejected |

### Automatic Deductions

| Issue | Deduction |
|-------|-----------|
| Cracked back glass | -$180 |
| Cracked screen | -$90 |
| Cricket locked | -$100 |
| Demo unit | -$50-$90 |
| Blacklisted | ❌ Auto-reject |
| iCloud locked | ❌ Auto-reject |

---

## 🤖 AI Intelligence Layer

### What Claude AI Does

- **Analyzes** deal context (price, condition, description)
- **Detects** red flags and risks
- **Generates** personalized seller messages
- **Recommends** negotiation strategies
- **Assigns** confidence scores and verdicts

### AI Verdicts

- 🔥 **STRONG BUY** - Exceptional profit, act immediately
- ✅ **BUY** - Strong deal, negotiate gently
- 💬 **NEGOTIATE** - Good potential, negotiate 20-30% down
- 👀 **WATCH** - Overpriced, wait for price drop
- ❌ **PASS** - Not profitable or too risky

---

## 🚀 Quick Start

### Prerequisites

- Google Account with Google Sheets access
- Node.js 18+ (for development)
- Browse AI account (for scraping)
- Anthropic API key (for Claude AI)
- SMS-iT API key (optional, for automation)
- OneHash account (optional, for ERP)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/steventrust223/thriftymobile-quantum-5.0.git
   cd thriftymobile-quantum-5.0
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Google Apps Script**
   ```bash
   # Login to clasp (Google's Apps Script CLI)
   npx clasp login

   # Create a new Apps Script project
   npx clasp create --type sheets --title "ThriftyMobile Quantum 5.0"

   # This will generate a .clasp.json with your script ID
   ```

4. **Build and deploy**
   ```bash
   npm run build
   npm run push
   ```

5. **Open the spreadsheet**
   ```bash
   npm run open
   ```

6. **Initialize the system**
   - In Google Sheets, go to **⚡ ThriftyMobile → Setup → Initialize Sheets**
   - This creates all necessary sheets and structure

7. **Configure API keys**
   - Go to **⚡ ThriftyMobile → Settings → Configure API Keys**
   - Enter your Claude API key
   - (Optional) Add SMS-iT and OneHash keys

---

## 📖 Usage Guide

### 1. Data Import (Browse AI)

Set up Browse AI robots to scrape:
- Facebook Marketplace
- OfferUp
- Craigslist
- eBay

Configure Browse AI to export to Google Sheets → Import sheets

### 2. Process Imports

- **⚡ ThriftyMobile → Data Processing → Process New Imports**
- System will:
  - Clean and normalize data
  - Parse device models and storage
  - Detect issues and conditions
  - Calculate grades and deductions

### 3. Run AI Analysis

- **⚡ ThriftyMobile → Data Processing → Run AI Analysis**
- Claude analyzes each deal and provides:
  - Verdict (BUY/NEGOTIATE/PASS)
  - Confidence score
  - Suggested offer message
  - Risk assessment

### 4. Review Verdict Sheet

- Open **Verdict Sheet** tab
- Deals are ranked by profit potential
- Focus on STRONG BUY and BUY verdicts

### 5. Contact Sellers

- Manual: Copy suggested message, text seller
- Automated: **⚡ ThriftyMobile → CRM & Messaging → Send Offers to Hot Deals**

### 6. Track in CRM

- Deal updates sync to OneHash
- Seller communications logged in Seller CRM sheet

---

## ⚙️ Configuration

### Settings Sheet

| Setting | Description | Default |
|---------|-------------|---------|
| `MIN_PROFIT_PERCENT` | Minimum acceptable profit | 25% |
| `TARGET_PROFIT_PERCENT` | Target profit for good deals | 50% |
| `EXCEPTIONAL_PROFIT_PERCENT` | Exceptional deal threshold | 100% |
| `CLAUDE_API_KEY` | Anthropic API key | (required) |
| `ENABLE_AI_ANALYSIS` | Enable Claude AI | TRUE |
| `ENABLE_AUTO_MESSAGING` | Auto-contact sellers | FALSE |
| `AUTO_CONTACT_THRESHOLD` | Min confidence for auto-contact | 75% |
| `MAX_RADIUS_MILES` | Maximum travel distance | 50 |

### Buyback Matrix Setup

1. Open **Buyback Matrix** sheet
2. Add rows for each device model
3. Enter partner pricing for each grade (A, B+, B, C, D)
4. System automatically looks up pricing

Example:
```
Brand  | Model         | Storage | Grade A | Grade B+ | Grade B | Grade C | Grade D
Apple  | iPhone 15 Pro | 256GB   | $850    | $750     | $650    | $500    | $350
```

---

## 🔌 Integrations

### Browse AI (Data Collection)

- Set up robots for each marketplace
- Configure to export to Google Sheets
- Map fields: title, price, description, location, URL

### Claude AI (Intelligence)

- Provides intelligent analysis and decision-making
- Generates personalized seller messages
- Uses `claude-3-5-sonnet-20241022` model

### SMS-iT CRM (Communication)

- Automated seller contact
- Conversation tracking
- Follow-up scheduling

### OneHash (ERP/Accounting)

- Lead/opportunity tracking
- Inventory management
- Purchase invoicing
- Profit/loss reporting

---

## 📈 Analytics & KPIs

The Dashboard shows:
- **Profit by platform** (Facebook vs OfferUp vs Craigslist)
- **Average margin** (per deal, per platform)
- **Deal velocity** (listings per day)
- **Conversion rate** (contacted → purchased)
- **Seller quality scores**
- **Source ROI** (which platforms are most profitable)

---

## 🛠️ Development

### Project Structure

```
src/
├── main/
│   ├── Code.ts           # Entry point, menu setup
│   ├── Config.ts         # Settings management
│   └── SheetManager.ts   # Sheet creation/formatting
├── processing/
│   ├── DataCleaner.ts    # Data validation
│   ├── ModelParser.ts    # Device info extraction
│   └── DataNormalizer.ts # Data normalization
├── grading/
│   ├── GradingEngine.ts  # Device grading logic
│   └── DeductionRules.ts # Pricing deductions
├── calculations/
│   ├── ProfitEngine.ts   # Profit & MAO calculations
│   └── MAOCalculator.ts  # Maximum allowable offer
├── intelligence/
│   ├── ClaudeAPI.ts      # Claude API client
│   └── AIDecisionEngine.ts # AI analysis logic
├── crm/
│   ├── SMSITIntegration.ts  # SMS-iT API
│   └── OneHashIntegration.ts # OneHash API
└── types/
    ├── Deal.ts           # Deal type definitions
    ├── Device.ts         # Device type definitions
    └── Sheet.ts          # Sheet schemas
```

### Build Commands

```bash
npm run build       # Compile TypeScript
npm run watch       # Watch mode
npm run push        # Deploy to Apps Script
npm run deploy      # Build + deploy
npm run lint        # Run linter
npm run test        # Run tests (coming soon)
```

### Adding New Features

1. Create TypeScript files in `src/`
2. Build: `npm run build`
3. Push to Apps Script: `npm run push`
4. Test in Google Sheets

---

## 🔐 Security Notes

- **NEVER** commit API keys to Git
- Store sensitive settings in Google Sheets Settings tab
- Use Apps Script Properties Service for secrets (advanced)
- Enable 2FA on all integrated accounts

---

## 🐛 Troubleshooting

### Issue: "Settings sheet not found"
**Solution:** Run **⚡ ThriftyMobile → Setup → Initialize Sheets**

### Issue: "Claude API key not configured"
**Solution:** Add API key via **⚡ ThriftyMobile → Settings → Configure API Keys**

### Issue: "No buyback price found"
**Solution:** Add device model to **Buyback Matrix** sheet

### Issue: "Import sheets empty"
**Solution:** Configure Browse AI robots to export to Import sheets

---

## 📄 License

Proprietary - ThriftyMobile Team

---

## 🤝 Support

For questions or issues:
1. Check the troubleshooting section
2. Review system logs in **System Log** sheet
3. Contact support team

---

## 🎉 Why ThriftyMobile is Different

**Not Airtable. Not Shopify. Not a generic CRM.**

ThriftyMobile is purpose-built for phone buyback arbitrage:
- **Google Sheets** = accessible, shareable, powerful
- **Apps Script** = automation without servers
- **Claude AI** = human-level judgment at scale
- **Real-time pricing** = dynamic partner buyback matrix
- **Grading engine** = industry-standard device evaluation
- **Profit intelligence** = never overpay again

**This is the competitive advantage.**

---

**Built with ⚡ by the ThriftyMobile Team**
