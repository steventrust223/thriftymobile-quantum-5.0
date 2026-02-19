# ThriftyMobile Quantum 5.0 - Complete Technical Configuration Guide

## 📋 Table of Contents
1. [Google Sheets Configuration](#google-sheets-configuration)
2. [Data Sheet Specifications](#data-sheet-specifications)
3. [Field Definitions & Data Types](#field-definitions--data-types)
4. [Data Validation Rules](#data-validation-rules)
5. [Conditional Formatting Rules](#conditional-formatting-rules)
6. [Formulas & Calculations](#formulas--calculations)
7. [Relations & Linkages](#relations--linkages)
8. [Apps Script Configuration](#apps-script-configuration)
9. [Menu Structure](#menu-structure)
10. [Implementation Checklist](#implementation-checklist)

---

## 🗂️ Google Sheets Configuration

### Spreadsheet Properties
- **Name:** ThriftyMobile Quantum 5.0
- **Locale:** United States
- **Time Zone:** America/New_York (or your timezone)
- **Recalculation:** On change and every hour
- **Iterative Calculation:** Off

### Sheet Order (Left to Right)
1. Lead Management
2. Phone Inventory
3. Buyback Analysis
4. Market Pricing
5. Settings

---

## 📊 Data Sheet Specifications

### Sheet 1: Lead Management

#### Sheet Properties
- **Name:** `Lead Management` (exact name, case-sensitive)
- **Tab Color:** RGB(66, 133, 244) - Blue
- **Protected Range:** Row 1 (Header) - locked
- **Frozen Rows:** 1
- **Frozen Columns:** 0

#### Dimensions
- **Total Columns:** 20
- **Starting Rows:** 1000 (pre-formatted)
- **Header Row:** Row 1

#### Column Specifications

| Col | Header Name | Width (px) | Data Type | Format | Validation | Required | Formula/Auto |
|-----|-------------|------------|-----------|--------|------------|----------|--------------|
| A | Lead ID | 100 | Text | Plain text | None | ✅ | Auto-generated |
| B | Customer Name | 150 | Text | Plain text | None | ✅ | Manual |
| C | Phone | 120 | Text | Phone number | Phone format | ✅ | Manual |
| D | Email | 180 | Text | Email | Email format | ❌ | Manual |
| E | Device Model | 180 | Text | Plain text | None | ✅ | Manual |
| F | Storage | 80 | List | Plain text | Dropdown list | ✅ | Manual |
| G | Condition | 100 | List | Plain text | Dropdown list | ✅ | Manual |
| H | Estimated Value | 120 | Number | Currency | Min: 0 | ✅ | Manual |
| I | Lead Source | 120 | List | Plain text | Dropdown list | ✅ | Manual |
| J | Location/Distance | 150 | Text | Plain text | None | ❌ | Manual |
| K | Inquiry Date | 150 | Date/Time | yyyy-mm-dd hh:mm | None | ✅ | Auto-filled |
| L | First Contact Date | 150 | Date/Time | yyyy-mm-dd hh:mm | None | ❌ | Manual |
| M | Response Time (min) | 130 | Number | Number | Min: 0 | ❌ | Auto-calculated |
| N | Lead Score | 100 | Number | Number | 0-100 | ❌ | Auto-calculated |
| O | Priority | 100 | List | Plain text | Dropdown list | ❌ | Auto-assigned |
| P | Stage | 120 | List | Plain text | Dropdown list | ✅ | Manual |
| Q | Offer Amount | 120 | Number | Currency | Min: 0 | ❌ | Manual |
| R | Status | 120 | List | Plain text | Dropdown list | ✅ | Manual |
| S | Notes | 200 | Text | Wrap text | None | ❌ | Manual |
| T | Last Updated | 150 | Date/Time | yyyy-mm-dd hh:mm | None | ❌ | Auto-updated |

#### Header Formatting (Row 1)
```
Background Color: #4285F4 (RGB: 66, 133, 244)
Font Color: #FFFFFF (RGB: 255, 255, 255)
Font Weight: Bold
Font Size: 11pt
Font Family: Arial
Horizontal Alignment: Center
Vertical Alignment: Middle
Text Wrap: None
Border: None
```

#### Data Row Formatting (Rows 2-1000)
```
Background Color: Alternating (#FFFFFF, #F3F3F3) - Use row banding
Font Color: #000000
Font Size: 10pt
Font Family: Arial
Horizontal Alignment: Left (text), Right (numbers), Center (dropdowns)
Vertical Alignment: Top
Text Wrap: Enabled for Notes column only
```

#### Data Validation Details

**Column F - Storage:**
```
Type: List from range
Values: ["64GB", "128GB", "256GB", "512GB", "1TB"]
On invalid data: Reject input
Show dropdown: Yes
Show validation help text: "Select device storage capacity"
```

**Column G - Condition:**
```
Type: List from range
Values: ["Like New", "Excellent", "Good", "Fair", "Poor"]
On invalid data: Reject input
Show dropdown: Yes
Show validation help text: "Select device condition"
```

**Column I - Lead Source:**
```
Type: List from range
Values: ["Website", "Walk-In", "Phone Call", "Email", "Referral", "Social Media", "Advertisement", "Other"]
On invalid data: Reject input
Show dropdown: Yes
Show validation help text: "How did this lead find you?"
```

**Column O - Priority:**
```
Type: List from range
Values: ["🔴 Hot", "🟠 Warm", "🟡 Medium", "🔵 Cold"]
On invalid data: Reject input
Show dropdown: Yes
Show validation help text: "Lead priority level (auto-assigned)"
```

**Column P - Stage:**
```
Type: List from range
Values: ["New Inquiry", "Contacted", "Offer Made", "Negotiating", "Accepted", "Purchased", "Lost"]
On invalid data: Reject input
Show dropdown: Yes
Show validation help text: "Current stage in sales pipeline"
```

**Column R - Status:**
```
Type: List from range
Values: ["Active", "Follow-Up Needed", "Waiting Response", "Deal Closed", "Lost/Declined"]
On invalid data: Reject input
Show dropdown: Yes
Show validation help text: "Current lead status"
```

#### Conditional Formatting Rules (Lead Management)

**Rule 1: Hot Priority Highlighting**
```
Apply to range: O2:O1000
Format cells if: Text contains "🔴 Hot"
Background color: #F4CCCC (RGB: 244, 204, 204)
Text color: #990000 (RGB: 153, 0, 0)
Text style: Bold
```

**Rule 2: Warm Priority Highlighting**
```
Apply to range: O2:O1000
Format cells if: Text contains "🟠 Warm"
Background color: #FCE5CD (RGB: 252, 229, 205)
Text color: #B45F06 (RGB: 180, 95, 6)
Text style: Bold
```

**Rule 3: Purchased Stage Highlighting**
```
Apply to range: P2:P1000
Format cells if: Text contains "Purchased"
Background color: #D9EAD3 (RGB: 217, 234, 211)
Text color: #38761D (RGB: 56, 118, 29)
Text style: Bold
```

**Rule 4: Lost Stage Highlighting**
```
Apply to range: P2:P1000
Format cells if: Text contains "Lost"
Background color: #F4CCCC (RGB: 244, 204, 204)
Text color: #CC0000 (RGB: 204, 0, 0)
Text style: Normal
```

**Rule 5: High Response Time Alert**
```
Apply to range: M2:M1000
Format cells if: Greater than 30
Background color: #FFF4C3 (RGB: 255, 244, 195)
Text color: #BF9000 (RGB: 191, 144, 0)
Text style: Bold
```

#### Number Formats

**Column H (Estimated Value):**
```
Format: Custom
Pattern: $#,##0.00
Example: $799.00
```

**Column M (Response Time):**
```
Format: Number
Pattern: 0
Decimal places: 0
Example: 25
```

**Column N (Lead Score):**
```
Format: Number
Pattern: 0
Decimal places: 0
Example: 87
```

**Column Q (Offer Amount):**
```
Format: Custom
Pattern: $#,##0.00
Example: $650.00
```

**Columns K, L, T (Date/Time):**
```
Format: Custom
Pattern: yyyy-mm-dd hh:mm
Example: 2026-01-13 14:30
```

---

### Sheet 2: Phone Inventory

#### Sheet Properties
- **Name:** `Phone Inventory` (exact name, case-sensitive)
- **Tab Color:** RGB(147, 196, 125) - Light Green
- **Protected Range:** Row 1 (Header) - locked
- **Frozen Rows:** 1
- **Frozen Columns:** 0

#### Dimensions
- **Total Columns:** 10
- **Starting Rows:** 1000 (pre-formatted)
- **Header Row:** Row 1

#### Column Specifications

| Col | Header Name | Width (px) | Data Type | Format | Validation | Required | Formula/Auto |
|-----|-------------|------------|-----------|--------|------------|----------|--------------|
| A | Phone Model | 200 | Text | Plain text | None | ✅ | Manual |
| B | IMEI | 150 | Text | Plain text | 15 digits | ✅ | Manual |
| C | Condition | 100 | List | Plain text | Dropdown list | ✅ | Manual |
| D | Storage | 80 | List | Plain text | Dropdown list | ✅ | Manual |
| E | Purchase Price | 120 | Number | Currency | Min: 0 | ✅ | Manual |
| F | Date Added | 110 | Date | yyyy-mm-dd | None | ✅ | Auto-filled |
| G | Status | 100 | List | Plain text | Dropdown list | ✅ | Manual |
| H | Lead ID | 100 | Text | Plain text | None | ❌ | Manual/Auto |
| I | Customer Name | 150 | Text | Plain text | None | ❌ | Manual/Auto |
| J | Notes | 250 | Text | Wrap text | None | ❌ | Manual |

#### Header Formatting (Row 1)
```
Background Color: #4285F4
Font Color: #FFFFFF
Font Weight: Bold
Font Size: 11pt
Horizontal Alignment: Center
Vertical Alignment: Middle
```

#### Data Validation Details

**Column B - IMEI:**
```
Type: Custom formula
Formula: =AND(LEN(B2)=15, ISNUMBER(B2))
On invalid data: Show warning
Show validation help text: "IMEI must be exactly 15 digits"
```

**Column C - Condition:**
```
Type: List from range
Values: ["Like New", "Excellent", "Good", "Fair", "Poor"]
On invalid data: Reject input
Show dropdown: Yes
```

**Column D - Storage:**
```
Type: List from range
Values: ["64GB", "128GB", "256GB", "512GB", "1TB"]
On invalid data: Reject input
Show dropdown: Yes
```

**Column G - Status:**
```
Type: List from range
Values: ["In Stock", "Sold", "Listed", "Pending", "Defective"]
On invalid data: Reject input
Show dropdown: Yes
```

#### Conditional Formatting Rules (Phone Inventory)

**Rule 1: Sold Status**
```
Apply to range: G2:G1000
Format cells if: Text is exactly "Sold"
Background color: #D9EAD3
Text color: #38761D
Text style: Bold
```

**Rule 2: Defective Status**
```
Apply to range: G2:G1000
Format cells if: Text is exactly "Defective"
Background color: #F4CCCC
Text color: #CC0000
Text style: Bold
```

**Rule 3: Row Banding**
```
Apply to range: A2:J1000
Color 1: #FFFFFF (white)
Color 2: #F3F3F3 (light gray)
Header: No
Footer: No
```

#### Number Formats

**Column E (Purchase Price):**
```
Format: Currency
Pattern: $#,##0.00
```

**Column F (Date Added):**
```
Format: Custom
Pattern: yyyy-mm-dd
```

---

### Sheet 3: Buyback Analysis

#### Sheet Properties
- **Name:** `Buyback Analysis` (exact name, case-sensitive)
- **Tab Color:** RGB(0, 188, 212) - Cyan
- **Protected Range:** Row 1 (Header) - locked
- **Frozen Rows:** 1
- **Frozen Columns:** 0

#### Dimensions
- **Total Columns:** 7
- **Starting Rows:** 1000 (pre-formatted)
- **Header Row:** Row 1

#### Column Specifications

| Col | Header Name | Width (px) | Data Type | Format | Validation | Required | Formula/Auto |
|-----|-------------|------------|-----------|--------|------------|----------|--------------|
| A | Phone Model | 200 | Text | Plain text | None | ❌ | Formula-linked |
| B | Market Value | 120 | Number | Currency | Min: 0 | ❌ | Formula-lookup |
| C | Purchase Price | 120 | Number | Currency | Min: 0 | ❌ | Formula-linked |
| D | Profit Margin | 120 | Number | Currency | None | ❌ | Formula-calculated |
| E | Margin % | 100 | Number | Percentage | None | ❌ | Formula-calculated |
| F | Recommendation | 150 | Text | Plain text | None | ❌ | Formula-assigned |
| G | Last Updated | 150 | Date/Time | yyyy-mm-dd hh:mm | None | ❌ | Formula-timestamp |

#### Formula Specifications

**Column A (Phone Model) - Row 2:**
```
Formula: ='Phone Inventory'!A2
Copy down: To row 1000
Purpose: Link to inventory phone model
```

**Column B (Market Value) - Row 2:**
```
Formula: =IFERROR(INDEX('Market Pricing'!E:E, MATCH(1, ('Market Pricing'!B:B=A2)*('Market Pricing'!C:C='Phone Inventory'!D2)*('Market Pricing'!D:D='Phone Inventory'!C2), 0)), 0)
Copy down: To row 1000
Purpose: VLOOKUP market price based on model, storage, and condition
```

**Column C (Purchase Price) - Row 2:**
```
Formula: ='Phone Inventory'!E2
Copy down: To row 1000
Purpose: Link to inventory purchase price
```

**Column D (Profit Margin) - Row 2:**
```
Formula: =IF(B2>0, B2-C2, 0)
Copy down: To row 1000
Purpose: Calculate profit (market value - purchase price)
```

**Column E (Margin %) - Row 2:**
```
Formula: =IF(C2>0, D2/C2, 0)
Copy down: To row 1000
Purpose: Calculate profit percentage
```

**Column F (Recommendation) - Row 2:**
```
Formula: =IF(E2>=0.3, "🟢 Excellent Deal", IF(E2>=0.2, "🟡 Good Deal", IF(E2>=0.1, "🟠 Fair Deal", IF(E2>=0, "🔴 Low Margin", "❌ Loss"))))
Copy down: To row 1000
Purpose: Auto-assign deal quality rating
```

**Column G (Last Updated) - Row 2:**
```
Formula: =NOW()
Copy down: To row 1000
Purpose: Timestamp of last calculation
Note: Set to recalculate on change
```

#### Conditional Formatting Rules (Buyback Analysis)

**Rule 1: Positive Profit**
```
Apply to range: D2:D1000
Format cells if: Greater than 0
Background color: #D9EAD3
Text color: #38761D
Text style: Bold
```

**Rule 2: Negative Profit (Loss)**
```
Apply to range: D2:D1000
Format cells if: Less than 0
Background color: #F4CCCC
Text color: #CC0000
Text style: Bold
```

**Rule 3: High Margin (30%+)**
```
Apply to range: E2:E1000
Format cells if: Greater than or equal to 0.3
Background color: #D9EAD3
Text color: #38761D
Text style: Bold
```

**Rule 4: Row Banding**
```
Apply to range: A2:G1000
Theme: Cyan
```

#### Number Formats

**Columns B, C, D (Currency):**
```
Format: Currency
Pattern: $#,##0.00
```

**Column E (Percentage):**
```
Format: Percentage
Pattern: 0.0%
Decimal places: 1
```

**Column G (Date/Time):**
```
Format: Custom
Pattern: yyyy-mm-dd hh:mm
```

---

### Sheet 4: Market Pricing

#### Sheet Properties
- **Name:** `Market Pricing` (exact name, case-sensitive)
- **Tab Color:** RGB(129, 199, 132) - Green
- **Protected Range:** Row 1 (Header) - locked
- **Frozen Rows:** 1
- **Frozen Columns:** 0

#### Dimensions
- **Total Columns:** 7
- **Starting Rows:** 1000 (pre-formatted)
- **Header Row:** Row 1

#### Column Specifications

| Col | Header Name | Width (px) | Data Type | Format | Validation | Required | Formula/Auto |
|-----|-------------|------------|-----------|--------|------------|----------|--------------|
| A | Brand | 120 | Text | Plain text | None | ✅ | Manual |
| B | Model | 200 | Text | Plain text | None | ✅ | Manual |
| C | Storage | 80 | List | Plain text | Dropdown list | ✅ | Manual |
| D | Condition | 100 | List | Plain text | Dropdown list | ✅ | Manual |
| E | Market Price | 120 | Number | Currency | Min: 0 | ✅ | Manual |
| F | Source | 150 | Text | Plain text | None | ❌ | Manual |
| G | Last Updated | 150 | Date/Time | yyyy-mm-dd hh:mm | None | ❌ | Auto-updated |

#### Header Formatting
```
Background Color: #4285F4
Font Color: #FFFFFF
Font Weight: Bold
Font Size: 11pt
```

#### Data Validation Details

**Column C - Storage:**
```
Type: List from range
Values: ["64GB", "128GB", "256GB", "512GB", "1TB"]
```

**Column D - Condition:**
```
Type: List from range
Values: ["Like New", "Excellent", "Good", "Fair", "Poor"]
```

#### Number Formats

**Column E (Market Price):**
```
Format: Currency
Pattern: $#,##0.00
```

**Column G (Last Updated):**
```
Format: Custom
Pattern: yyyy-mm-dd hh:mm
```

---

### Sheet 5: Settings

#### Sheet Properties
- **Name:** `Settings` (exact name, case-sensitive)
- **Tab Color:** RGB(255, 152, 0) - Orange
- **Protected Range:** Columns A & C (labels) - locked
- **Frozen Rows:** 1
- **Frozen Columns:** 0

#### Dimensions
- **Total Columns:** 3
- **Starting Rows:** 20
- **Header Row:** Row 1

#### Column Specifications

| Col | Header Name | Width (px) | Data Type | Format | Validation | Required | Formula/Auto |
|-----|-------------|------------|-----------|--------|------------|----------|--------------|
| A | Setting | 200 | Text | Plain text | None | ✅ | Pre-filled |
| B | Value | 150 | Text/Number | Various | Various | ✅ | User-editable |
| C | Description | 400 | Text | Wrap text | None | ❌ | Pre-filled |

#### Pre-filled Settings Rows

**Row 2:**
```
Setting: Minimum Profit Margin %
Value: 20%
Description: Minimum acceptable profit margin percentage for deals
```

**Row 3:**
```
Setting: Auto-Refresh Analysis
Value: Daily
Description: Frequency of automatic analysis refresh
```

**Row 4:**
```
Setting: Currency
Value: USD
Description: Default currency for pricing
```

**Row 5:**
```
Setting: Business Name
Value: ThriftyMobile
Description: Your business name
```

**Row 6:**
```
Setting: Price Update Source
Value: Manual
Description: Source for market price updates (Manual, API, etc.)
```

**Row 7:**
```
Setting: Low Stock Alert
Value: 5
Description: Alert when inventory falls below this number
```

**Row 8:**
```
Setting: High Value Threshold
Value: 1000
Description: Items above this price require special handling
```

**Row 9:**
```
Setting: Lead Response SLA (minutes)
Value: 5
Description: Target response time for new leads
```

**Row 10:**
```
Setting: Hot Lead Score Threshold
Value: 80
Description: Minimum score to be classified as Hot lead
```

---

## 🔗 Relations & Linkages

### Primary Keys & Foreign Keys

#### Lead Management → Phone Inventory
```
Type: One-to-Many
Primary Key: Lead Management!A (Lead ID)
Foreign Key: Phone Inventory!H (Lead ID)
Relationship: One lead can generate multiple phone purchases
Usage: Track which leads converted to inventory
```

#### Phone Inventory → Buyback Analysis
```
Type: One-to-One
Primary Key: Phone Inventory!A (Phone Model) + Row Number
Foreign Key: Buyback Analysis!A (Phone Model) + Row Number
Relationship: Each inventory item has one analysis entry
Usage: Automatic profit calculation linkage
```

#### Phone Inventory → Market Pricing
```
Type: Many-to-One
Lookup Keys:
  - Phone Inventory!A (Phone Model) → Market Pricing!B (Model)
  - Phone Inventory!D (Storage) → Market Pricing!C (Storage)
  - Phone Inventory!C (Condition) → Market Pricing!D (Condition)
Relationship: Multiple inventory items reference same market price
Usage: VLOOKUP/INDEX-MATCH for price comparison
```

### Data Flow Diagram

```
[Customer Inquiry]
       ↓
[Lead Management Sheet] ← Add Lead Dialog
       ↓ (Lead Score Calculated)
       ↓ (Priority Assigned)
       ↓
[Lead Dashboard] ← Display Hot Leads
       ↓
[Lead Converted to Purchase]
       ↓
[Phone Inventory Sheet] ← Add Phone Dialog
       ↓ (Auto-linked to Lead ID)
       ↓
[Buyback Analysis Sheet] ← Auto-calculation via formulas
       ↓ (Lookup Market Pricing)
       ↓
[Market Pricing Sheet] → Reference data
       ↓
[Dashboard] ← Display Analytics
```

---

## ⚙️ Apps Script Configuration

### Script Properties

```javascript
// Document Properties (Persistent storage)
Key: "initialized"
Value: "true" | "false"
Type: String

Key: "initDate"
Value: ISO 8601 DateTime string
Type: String
Example: "2026-01-13T14:30:00.000Z"

Key: "lastLeadId"
Value: Number
Type: String (stored as string, parsed as number)
```

### Script Files Structure

```
Project Files:
├── Code.gs (Main backend - 1287 lines)
├── Dashboard.html (Main dashboard UI)
├── Welcome.html (Welcome wizard)
├── AddPhone.html (Add phone dialog)
├── AddLead.html (Add lead dialog)
├── LeadDashboard.html (Lead management dashboard)
├── ManageLeads.html (Lead management interface)
├── Search.html (Inventory search)
└── Settings.html (Settings panel)

Configuration Files:
└── appsscript.json (Apps Script manifest)
```

### appsscript.json Configuration

```json
{
  "timeZone": "America/New_York",
  "dependencies": {
    "enabledAdvancedServices": []
  },
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "executionApi": {
    "access": "ANYONE"
  }
}
```

### Function Triggers

#### Time-Driven Triggers (Optional)

**Daily Analysis Refresh:**
```
Function: refreshAnalysis
Trigger Type: Time-driven
Event Source: Day timer
Time of day: 12am to 1am
Frequency: Every day
Failure notification: Notify me daily
```

**Lead Score Refresh:**
```
Function: refreshLeadScores
Trigger Type: Time-driven
Event Source: Day timer
Time of day: 6am to 7am
Frequency: Every day
```

#### Event-Driven Triggers

**Spreadsheet Open:**
```
Function: onOpen
Trigger Type: On open
Event Source: From spreadsheet
Failure notification: Notify me daily
```

---

## 🎨 Conditional Formatting - Complete Specifications

### Lead Management Sheet

#### Priority Color Coding

**Hot Leads (Red):**
```
Range: O2:O1000
Condition: Text contains "🔴 Hot"
Format:
  - Background: #F4CCCC (RGB: 244, 204, 204)
  - Text: #990000 (RGB: 153, 0, 0)
  - Bold: Yes
  - Font size: 10pt
Priority: 1 (highest)
```

**Warm Leads (Orange):**
```
Range: O2:O1000
Condition: Text contains "🟠 Warm"
Format:
  - Background: #FCE5CD (RGB: 252, 229, 205)
  - Text: #B45F06 (RGB: 180, 95, 6)
  - Bold: Yes
Priority: 2
```

**Response Time Alert (Yellow):**
```
Range: M2:M1000
Condition: Greater than 30
Format:
  - Background: #FFF4C3 (RGB: 255, 244, 195)
  - Text: #BF9000 (RGB: 191, 144, 0)
  - Bold: Yes
Priority: 3
```

### Phone Inventory Sheet

**Sold Items (Green):**
```
Range: G2:G1000
Condition: Text is exactly "Sold"
Format:
  - Background: #D9EAD3
  - Text: #38761D
  - Bold: Yes
```

**Defective Items (Red):**
```
Range: G2:G1000
Condition: Text is exactly "Defective"
Format:
  - Background: #F4CCCC
  - Text: #CC0000
  - Bold: Yes
```

### Buyback Analysis Sheet

**Profit (Green):**
```
Range: D2:D1000
Condition: Greater than 0
Format:
  - Background: #D9EAD3
  - Text: #38761D
  - Bold: Yes
```

**Loss (Red):**
```
Range: D2:D1000
Condition: Less than 0
Format:
  - Background: #F4CCCC
  - Text: #CC0000
  - Bold: Yes
```

**High Margin (Green):**
```
Range: E2:E1000
Condition: Greater than or equal to 0.3
Format:
  - Background: #D9EAD3
  - Text: #38761D
  - Bold: Yes
```

---

## 📱 Apps Script Function Reference

### Configuration Constants

```javascript
const CONFIG = {
  SHEET_NAMES: {
    LEADS: 'Lead Management',              // Exact name
    INVENTORY: 'Phone Inventory',          // Exact name
    ANALYSIS: 'Buyback Analysis',          // Exact name
    PRICING: 'Market Pricing',             // Exact name
    SETTINGS: 'Settings'                   // Exact name
  },
  HEADERS: {
    LEADS: [/* 20 columns as specified */],
    INVENTORY: [/* 10 columns */],
    ANALYSIS: [/* 7 columns */],
    PRICING: [/* 7 columns */],
    SETTINGS: [/* 3 columns */]
  },
  CONDITIONS: ['Like New', 'Excellent', 'Good', 'Fair', 'Poor'],
  STORAGE_OPTIONS: ['64GB', '128GB', '256GB', '512GB', '1TB'],
  STATUS_OPTIONS: ['In Stock', 'Sold', 'Listed', 'Pending', 'Defective'],
  LEAD_SOURCES: ['Website', 'Walk-In', 'Phone Call', 'Email', 'Referral', 'Social Media', 'Advertisement', 'Other'],
  LEAD_STAGES: ['New Inquiry', 'Contacted', 'Offer Made', 'Negotiating', 'Accepted', 'Purchased', 'Lost'],
  LEAD_STATUS: ['Active', 'Follow-Up Needed', 'Waiting Response', 'Deal Closed', 'Lost/Declined'],
  PRIORITY_LEVELS: ['🔴 Hot', '🟠 Warm', '🟡 Medium', '🔵 Cold']
};
```

### Lead Scoring Formula

```javascript
function calculateLeadScore(leadData) {
  let score = 0;

  // Device Value (0-40 points)
  const value = leadData.estimatedValue || 0;
  if (value >= 1000) score += 40;
  else if (value >= 700) score += 30;
  else if (value >= 400) score += 20;
  else if (value >= 200) score += 10;

  // Condition (0-25 points)
  const conditionScores = {
    'Like New': 25,
    'Excellent': 20,
    'Good': 15,
    'Fair': 10,
    'Poor': 5
  };
  score += conditionScores[leadData.condition] || 0;

  // Lead Source (0-15 points)
  const sourceScores = {
    'Referral': 15,
    'Website': 12,
    'Walk-In': 10,
    'Social Media': 8,
    'Phone Call': 8,
    'Email': 7,
    'Advertisement': 5,
    'Other': 3
  };
  score += sourceScores[leadData.leadSource] || 0;

  // Distance (0-10 points)
  if (leadData.distance) {
    const dist = parseFloat(leadData.distance);
    if (dist <= 5) score += 10;
    else if (dist <= 15) score += 7;
    else if (dist <= 30) score += 4;
    else if (dist <= 50) score += 2;
  }

  // Urgency (0-10 points)
  const inquiryDate = new Date(leadData.inquiryDate);
  const now = new Date();
  const hoursSince = (now - inquiryDate) / (1000 * 60 * 60);
  if (hoursSince <= 1) score += 10;
  else if (hoursSince <= 4) score += 8;
  else if (hoursSince <= 24) score += 5;
  else if (hoursSince <= 48) score += 2;

  return Math.min(100, score);
}
```

### Priority Assignment Logic

```javascript
function getPriorityLevel(score) {
  if (score >= 80) return '🔴 Hot';      // 80-100
  if (score >= 60) return '🟠 Warm';     // 60-79
  if (score >= 40) return '🟡 Medium';   // 40-59
  return '🔵 Cold';                       // 0-39
}
```

### Response Time Calculation

```javascript
function calculateResponseTime(inquiryDate, firstContactDate) {
  if (!firstContactDate || !inquiryDate) return null;

  const inquiry = new Date(inquiryDate);
  const contact = new Date(firstContactDate);
  const diffMs = contact - inquiry;

  // Convert milliseconds to minutes
  return Math.round(diffMs / (1000 * 60));
}
```

---

## 🎯 Implementation Checklist

### Phase 1: Spreadsheet Setup
- [ ] Create new Google Spreadsheet named "ThriftyMobile Quantum 5.0"
- [ ] Set locale to United States
- [ ] Set timezone to your region
- [ ] Create 5 sheets with exact names (case-sensitive)
- [ ] Set sheet tab colors as specified
- [ ] Reorder sheets: Leads, Inventory, Analysis, Pricing, Settings

### Phase 2: Lead Management Sheet
- [ ] Set frozen rows to 1
- [ ] Add 20 column headers (exact names)
- [ ] Set column widths as specified
- [ ] Format header row (blue background, white text, bold)
- [ ] Apply row banding (blue theme)
- [ ] Add data validation for columns F, G, I, O, P, R
- [ ] Add conditional formatting (5 rules)
- [ ] Set number formats for columns H, K, L, M, N, Q, T
- [ ] Protect header row from editing

### Phase 3: Phone Inventory Sheet
- [ ] Set frozen rows to 1
- [ ] Add 10 column headers
- [ ] Set column widths
- [ ] Format header row
- [ ] Apply row banding (light grey theme)
- [ ] Add data validation for columns B, C, D, G
- [ ] Add conditional formatting (3 rules)
- [ ] Set number formats for columns E, F
- [ ] Protect header row

### Phase 4: Buyback Analysis Sheet
- [ ] Set frozen rows to 1
- [ ] Add 7 column headers
- [ ] Set column widths
- [ ] Format header row
- [ ] Apply row banding (cyan theme)
- [ ] Add formulas to row 2 (all columns)
- [ ] Copy formulas down to row 1000
- [ ] Add conditional formatting (4 rules)
- [ ] Set number formats for columns B, C, D, E, G
- [ ] Protect header row and formula columns

### Phase 5: Market Pricing Sheet
- [ ] Set frozen rows to 1
- [ ] Add 7 column headers
- [ ] Set column widths
- [ ] Format header row
- [ ] Apply row banding (green theme)
- [ ] Add data validation for columns C, D
- [ ] Set number formats for columns E, G
- [ ] Add sample data (5-10 common phone models)
- [ ] Protect header row

### Phase 6: Settings Sheet
- [ ] Set frozen rows to 1
- [ ] Add 3 column headers
- [ ] Set column widths
- [ ] Format header row
- [ ] Apply row banding (orange theme)
- [ ] Add pre-filled settings (10 rows)
- [ ] Protect columns A and C (labels only)
- [ ] Leave column B editable

### Phase 7: Apps Script Setup
- [ ] Open Apps Script editor (Extensions → Apps Script)
- [ ] Delete default Code.gs content
- [ ] Copy and paste Code.gs content (1287 lines)
- [ ] Save project as "ThriftyMobile Backend"
- [ ] Create HTML files (8 files total)
- [ ] Copy content for each HTML file
- [ ] Save all files
- [ ] Update appsscript.json with configuration

### Phase 8: HTML Files
- [ ] Create Dashboard.html
- [ ] Create Welcome.html
- [ ] Create AddPhone.html
- [ ] Create AddLead.html
- [ ] Create LeadDashboard.html
- [ ] Create ManageLeads.html
- [ ] Create Search.html
- [ ] Create Settings.html

### Phase 9: Testing
- [ ] Close and reopen spreadsheet
- [ ] Verify custom menu appears
- [ ] Click "Initialize Spreadsheet"
- [ ] Verify all sheets are formatted correctly
- [ ] Test "Add New Lead" dialog
- [ ] Verify lead score calculation
- [ ] Test "Add New Phone" dialog
- [ ] Verify inventory-to-analysis linkage
- [ ] Check "Lead Dashboard" displays correctly
- [ ] Test "Manage Leads" filtering
- [ ] Verify conditional formatting works
- [ ] Test search functionality

### Phase 10: Data Population
- [ ] Add 5-10 sample leads
- [ ] Add 3-5 sample phones to inventory
- [ ] Add 10-20 market pricing entries
- [ ] Verify analysis calculations are correct
- [ ] Check dashboard statistics
- [ ] Test lead conversion to sale
- [ ] Verify response time tracking

### Phase 11: Optional Enhancements
- [ ] Set up time-driven triggers (daily refresh)
- [ ] Configure email notifications
- [ ] Add additional market pricing data
- [ ] Customize settings values
- [ ] Create backup copy of spreadsheet

---

## 🔧 Troubleshooting Common Issues

### Issue 1: Menu Not Appearing
**Solution:**
1. Refresh the spreadsheet
2. Check Apps Script authorization (Run → onOpen)
3. Grant required permissions
4. Clear browser cache

### Issue 2: Formulas Not Working
**Solution:**
1. Verify sheet names are exact (case-sensitive)
2. Check formula syntax
3. Ensure source ranges exist
4. Verify ARRAYFORMULA usage

### Issue 3: Data Validation Not Working
**Solution:**
1. Check dropdown list values match exactly
2. Verify range specifications
3. Ensure "Reject input" is selected
4. Re-apply validation rules

### Issue 4: Lead Score Not Calculating
**Solution:**
1. Check Apps Script is saved
2. Verify function permissions
3. Test calculateLeadScore() manually
4. Check browser console for errors

---

## 📞 Support & Configuration Help

For configuration assistance:
1. Verify all sheet names match exactly (case-sensitive)
2. Double-check column headers match specifications
3. Ensure data types and formats are correct
4. Review Apps Script console for errors
5. Test each component individually

---

**Configuration Complete!**
Follow this guide step-by-step for exact implementation of ThriftyMobile Quantum 5.0.
