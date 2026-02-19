# 📱 ThriftyMobile Quantum 5.0

**Automated Phone Buyback Analysis Engine** — A powerful Google Apps Script + HTML system for managing phone inventory, analyzing profit margins, and making smarter buyback decisions.

![Version](https://img.shields.io/badge/version-5.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Google%20Apps%20Script-yellow)

## ✨ Features

### 🚀 Plug & Play Installation
- **One-Click Setup** — Initialize the entire system with a single button click
- **Auto-Configuration** — Automatically creates all sheets with proper formatting
- **Sample Data Included** — Get started immediately with pre-populated examples
- **Zero Manual Setup** — No need to create headers or configure sheets manually

### 📊 Professional UI/UX
- **Sticky Headers** — Column headers stay visible while scrolling
- **Color-Coded Data** — Profit margins highlighted (green = profit, red = loss)
- **Responsive Design** — Works beautifully on desktop and mobile
- **Modern Interface** — Beautiful gradients and smooth animations
- **Alternating Row Colors** — Easy-to-read data tables

### 🎯 Smart Features
- **Automatic Profit Analysis** — Real-time calculation of profit margins and ROI
- **Market Price Tracking** — Compare purchase prices against market values
- **Deal Recommendations** — AI-powered suggestions (Excellent, Good, Fair, Low Margin, Loss)
- **Inventory Search** — Quick search across all fields (model, IMEI, condition, etc.)
- **Data Validation** — Dropdown menus for conditions, storage, and status
- **Dashboard Analytics** — Real-time stats and top opportunities

### 📞 Lead Management & CRM
- **Lead Tracking** — Capture and manage customer inquiries from first contact
- **Intelligent Lead Scoring** — Automatic 0-100 scoring based on device value, condition, source, distance, and urgency
- **Speed to Lead Metrics** — Track response time in minutes for every inquiry
- **Distance/Location Tracking** — Monitor customer proximity and optimize for local deals
- **Full Sales Pipeline** — Track leads through stages: New Inquiry → Contacted → Offer Made → Negotiating → Purchased
- **Priority Rankings** — Auto-categorized as 🔴 Hot, 🟠 Warm, 🟡 Medium, or 🔵 Cold
- **Conversion Analytics** — Track conversion rates, average response time, and deal velocity
- **Hot Lead Dashboard** — Prioritized list of high-value opportunities requiring immediate attention

### 🛠️ User-Friendly Tools
- **Quick Add Dialog** — Add new phones with a simple form
- **Search Dialog** — Find any phone in seconds
- **Settings Panel** — Configure system behavior
- **Custom Menu** — All features accessible from the spreadsheet menu
- **Lead Dashboard** — Complete CRM analytics with pipeline visualization
- **Add Lead Dialog** — Capture new customer inquiries with automatic scoring
- **Manage Leads** — View, filter, and update all leads in one interface

## 📋 What's Included

### Data Sheets
1. **Lead Management** — Complete CRM with inquiry tracking, scoring, and pipeline management
2. **Phone Inventory** — Track all your phones with IMEI, condition, pricing, customer linkage
3. **Buyback Analysis** — Automated profit calculations and deal recommendations
4. **Market Pricing** — Reference prices for different models and conditions
5. **Settings** — Configurable system parameters

### HTML Interfaces
- **Lead Dashboard** — CRM analytics with hot leads, conversion metrics, and response times
- **Add Lead Dialog** — Capture new inquiries with automatic lead scoring
- **Manage Leads** — Comprehensive lead management with filtering and stage updates
- **Dashboard** — Main analytics and overview interface
- **Welcome Screen** — One-click initialization wizard
- **Add Phone Dialog** — User-friendly form for adding inventory
- **Search Dialog** — Powerful inventory search tool
- **Settings Dialog** — System configuration interface

### Backend Functions
- `initializeSpreadsheet()` — One-click setup
- `addPhone()` — Add new inventory items
- `searchInventory()` — Search functionality
- `refreshAnalysis()` — Update profit calculations
- `getDashboardStats()` — Real-time analytics
- And many more helper functions...

## 🚀 Quick Start Guide

### Method 1: Direct Google Sheets Deployment (Recommended)

1. **Create a New Google Spreadsheet**
   - Go to [Google Sheets](https://sheets.google.com)
   - Create a new blank spreadsheet
   - Name it "ThriftyMobile Quantum 5.0"

2. **Open Apps Script Editor**
   - Click **Extensions** → **Apps Script**
   - This opens the script editor

3. **Add the Code Files**
   - Delete the default `Code.gs` content
   - Copy the contents of `Code.gs` from this repository
   - Paste into the Apps Script editor

4. **Add HTML Files**
   - Click the **+** next to Files
   - Select **HTML**
   - Create these files and paste their contents:
     - `Dashboard.html`
     - `Welcome.html`
     - `AddPhone.html`
     - `Search.html`
     - `Settings.html`

5. **Save and Run**
   - Click **Save Project** (💾 icon)
   - Name your project "ThriftyMobile"
   - Close the Apps Script tab
   - Refresh your Google Spreadsheet

6. **Initialize the System**
   - You'll see a new menu: **🚀 ThriftyMobile**
   - Click **ThriftyMobile** → **⚡ Initialize Spreadsheet**
   - Click **Yes** to confirm
   - Wait for the setup to complete
   - The dashboard will open automatically!

### Method 2: Using Clasp (For Developers)

```bash
# Install clasp globally
npm install -g @google/clasp

# Clone this repository
git clone https://github.com/steventrust223/thriftymobile-quantum-5.0.git
cd thriftymobile-quantum-5.0

# Login to Google
clasp login

# Create a new Apps Script project
clasp create --type sheets --title "ThriftyMobile Quantum 5.0"

# Push the code
clasp push

# Open in browser
clasp open
```

Then follow steps 6 from Method 1 to initialize.

## 📖 User Guide

### Adding a New Phone

1. Click **ThriftyMobile** → **➕ Add New Phone**
2. Fill in the form:
   - **Phone Model** (required) — e.g., "iPhone 14 Pro Max"
   - **IMEI** (required) — 15-digit identifier
   - **Condition** (required) — Select from dropdown
   - **Storage** (required) — Select from dropdown
   - **Purchase Price** (required) — Amount paid
   - **Status** — Current status (defaults to "In Stock")
   - **Notes** — Any additional information
3. Click **Add Phone**
4. Analysis automatically updates!

### Searching Inventory

1. Click **ThriftyMobile** → **🔍 Search Inventory**
2. Enter any search term (model, IMEI, condition, etc.)
3. Click **Search** or press Enter
4. View results with full details
5. Click row numbers to locate items

### Viewing Analytics

1. Click **ThriftyMobile** → **📊 Open Dashboard**
2. View key metrics:
   - Total inventory count
   - Items in stock
   - Total investment
   - Market value
   - Potential profit
   - Average margin
3. Review recent inventory additions
4. Check top profit opportunities

### Refreshing Analysis

1. Click **ThriftyMobile** → **🔄 Refresh Analysis**
2. System recalculates all profit margins
3. Updates recommendations
4. Refreshes dashboard statistics

### Configuring Settings

1. Click **ThriftyMobile** → **⚙️ Settings**
2. View current configuration
3. To modify settings:
   - Go to the **Settings** sheet
   - Edit values directly in the sheet
   - Settings apply immediately

## 🎨 UI/UX Highlights

### Sticky Headers
All data tables feature sticky headers that remain visible while scrolling — making it easy to navigate large datasets.

### Color Coding
- **Green backgrounds** — Positive profit margins
- **Red backgrounds** — Negative profit margins (losses)
- **Status badges** — Color-coded by status (In Stock, Sold, Listed, etc.)
- **Alternating rows** — Easy-to-read tables with banding

### Responsive Design
- Works on desktop, tablet, and mobile
- Touch-friendly buttons and controls
- Adaptive layouts for different screen sizes

### Professional Styling
- Modern gradient backgrounds
- Smooth hover animations
- Card-based layouts
- Clean typography
- Intuitive iconography

## 🔧 Configuration Options

Edit these in the **Settings** sheet:

| Setting | Default | Description |
|---------|---------|-------------|
| Minimum Profit Margin % | 20% | Minimum acceptable profit |
| Auto-Refresh Analysis | Daily | How often to update analysis |
| Currency | USD | Default currency |
| Business Name | ThriftyMobile | Your business name |
| Low Stock Alert | 5 | Alert threshold |
| High Value Threshold | 1000 | Special handling threshold |

## 📊 Data Validation

The system includes smart data validation:

- **Condition** — Dropdown: Like New, Excellent, Good, Fair, Poor
- **Storage** — Dropdown: 64GB, 128GB, 256GB, 512GB, 1TB
- **Status** — Dropdown: In Stock, Sold, Listed, Pending, Defective
- **IMEI** — Must be exactly 15 digits
- **Purchase Price** — Must be a positive number
- **Date Added** — Automatically formatted as YYYY-MM-DD

## 🎯 Deal Recommendations

The system automatically categorizes deals:

- 🟢 **Excellent Deal** — 30%+ profit margin
- 🟡 **Good Deal** — 20-30% profit margin
- 🟠 **Fair Deal** — 10-20% profit margin
- 🔴 **Low Margin** — 0-10% profit margin
- ❌ **Loss** — Negative profit margin

## 📞 Lead Management & Scoring System

### Lead Scoring Algorithm (0-100 Points)

The system automatically scores every lead based on five key factors:

**1. Device Value (0-40 points)**
- $1000+: 40 points
- $700-999: 30 points
- $400-699: 20 points
- $200-399: 10 points

**2. Condition (0-25 points)**
- Like New: 25 points
- Excellent: 20 points
- Good: 15 points
- Fair: 10 points
- Poor: 5 points

**3. Lead Source (0-15 points)**
- Referral: 15 points (highest quality)
- Website: 12 points
- Walk-In: 10 points
- Social Media/Phone: 8 points
- Email: 7 points
- Advertisement: 5 points
- Other: 3 points

**4. Distance/Location (0-10 points)**
- 0-5 miles: 10 points
- 6-15 miles: 7 points
- 16-30 miles: 4 points
- 31-50 miles: 2 points
- 50+ miles or unknown: 0 points

**5. Urgency/Recency (0-10 points)**
- < 1 hour old: 10 points
- 1-4 hours old: 8 points
- 4-24 hours old: 5 points
- 24-48 hours old: 2 points
- 48+ hours old: 0 points

### Priority Levels

Based on the total score, leads are automatically categorized:

- 🔴 **Hot** (80-100 points) — High-value, immediate action required
- 🟠 **Warm** (60-79 points) — Strong opportunity, contact soon
- 🟡 **Medium** (40-59 points) — Moderate priority
- 🔵 **Cold** (0-39 points) — Low priority

### Speed to Lead Tracking

Response time is automatically calculated:
- Tracks minutes from inquiry to first contact
- Displays on Lead Dashboard
- Helps optimize response processes
- Industry best practice: respond within 5 minutes

### Lead Pipeline Stages

1. **New Inquiry** — Initial customer contact
2. **Contacted** — First response sent
3. **Offer Made** — Price quote provided
4. **Negotiating** — Back-and-forth on price
5. **Accepted** — Deal agreed upon
6. **Purchased** — Phone acquired, moved to inventory
7. **Lost** — Customer declined or went elsewhere

### Lead Analytics

The Lead Dashboard tracks:
- Total leads in system
- Active leads (not closed)
- Hot leads requiring attention
- Average response time
- Conversion rate (purchased / total)
- Total estimated value of pipeline
- Leads received today
- Average lead score

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check that you've initialized the spreadsheet
2. Ensure all HTML files are uploaded
3. Verify the Apps Script has permissions
4. Try refreshing the spreadsheet

For additional help, open an issue on GitHub.

## 🙏 Acknowledgments

Built with ❤️ using:
- Google Apps Script
- HTML5 & CSS3
- Modern JavaScript (ES6+)

---

**Made by ThriftyMobile** | Version 5.0.0 | © 2026
