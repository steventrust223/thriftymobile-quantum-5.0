# TRUTH SPEC PACK LITE — Thrifty Mobile Quantum v5.0

---

## PART 1 — FILE INVENTORY

### .gs Files (11)

| File | Purpose |
|---|---|
| `Code.gs` | Legacy backend: CONFIG object, onOpen menu, initialization, inventory CRUD, lead management |
| `TM_config.gs` | All constants: TM_SHEETS, headers, deductions, grading maps, deal thresholds, MAO params, score weights, colors, default settings |
| `TM_setup.gs` | Active onOpen trigger, menu creation, sheet setup/formatting for all 16 sheets, `TM_runFullAnalysis` orchestrator |
| `TM_sync.gs` | Import-to-Master sync: normalize data from 5 IMPORT sheets into MASTER_DEVICE_DB with deduplication |
| `TM_grading.gs` | Device grading engine: condition-to-grade mapping, blacklist detection, grade modifiers, manual override |
| `TM_buyback_logic.gs` | Buyback price matching: fuzzy model matching against BUYBACK_PARTNER_PRICING, deduction calculations |
| `TM_analysis.gs` | MAO calculation, risk scoring (1-10), market advantage, deal classification, hot seller detection, deal scoring |
| `TM_verdict.gs` | Builds ranked VERDICT sheet: deal scoring, action recommendations (CALL/TEXT/HOLD/PASS), auto seller messages |
| `TM_dashboard.gs` | Dashboard analytics: gathers KPIs (overview, financial, sellers, platforms, risk), chart creation, daily summary |
| `TM_ui.gs` | UI launchers (sidebars/dialogs), server-side functions for UI calls, integration wrappers (CRM, SMS, e-sign) |
| `TM_utils.gs` | Utilities: logging, sheet helpers, parsing, validation; CRM integration (SMS-iT, OneHash, OhmyLead), SMS (SMS-iT, Twilio), SignWell e-sign |

### .html Files (13)

| File | Purpose |
|---|---|
| `Welcome.html` | Onboarding dialog with one-click setup |
| `Dashboard.html` | Legacy inventory dashboard (stats, recent inventory, top opportunities) |
| `AddPhone.html` | Add phone to inventory form |
| `AddLead.html` | Add new lead form |
| `LeadDashboard.html` | Lead management dashboard (stats, hot leads) |
| `ManageLeads.html` | Browse/filter all leads |
| `Search.html` | Search inventory dialog |
| `Settings.html` | Legacy settings dialog |
| `tm_control_center.html` | Main control center sidebar (quick stats, logs, action buttons) |
| `tm_dashboard.html` | Analytics dashboard sidebar |
| `tm_settings.html` | TM_ system settings dialog |
| `tm_help.html` | Help/overview dialog (static content) |
| `tm_smart_outreach.html` | Smart outreach sidebar (top deals, contact actions) |

---

## PART 2 — ENTRYPOINTS & TRIGGERS

### onOpen (CONFLICT — two definitions exist)

- **Code.gs:39** — Legacy. Creates "ThriftyMobile" menu. Auto-shows Welcome dialog if `initialized` property not set.
- **TM_setup.gs:17** — Active TM_ system. Creates "Thrifty Mobile Quantum" menu with: Setup, Sync, Analysis, Verdict, Dashboards, Control Center, Settings, Help, Smart Outreach.

**TRUTH:** GAS loads files alphabetically. `TM_setup.gs` loads after `Code.gs`, so the TM_ `onOpen` **overwrites** the legacy one. Only the TM_ menu appears at runtime.

### Setup / Install

- `initializeSpreadsheet()` — Code.gs:152 — Legacy one-click setup (5 sheets).
- `TM_createOrUpdateSheets()` — TM_setup.gs:45 — TM_ system setup (creates all 16 sheets).

### Triggers (time-based, onEdit)

**NONE.** No installable triggers in the code. Everything is manual/menu-driven. The `AUTO_SYNC_ENABLED` setting exists in defaults but no onEdit trigger reads it.

### doGet / doPost

**NONE.** No web app endpoints exist.

---

## PART 3 — SHEETS & DATA MODEL (CORE ONLY)

### Sheet Names — TM_SHEETS (TM_config.gs)

**Import/Staging (5):** IMPORT_FB, IMPORT_CL, IMPORT_OU, IMPORT_EBAY, IMPORT_OTHER
**Core System (5):** MASTER_DEVICE_DB, GRADING_ENGINE, BUYBACK_MATCH, MAO_ENGINE, VERDICT
**Reference (1):** BUYBACK_PARTNER_PRICING
**Supporting (5):** LEADS_TRACKER, CRM_INTEGRATION, SETTINGS, SYSTEM_LOG, DASHBOARD_ANALYTICS

### Legacy Sheet Names — CONFIG (Code.gs)

Lead Management, Phone Inventory, Buyback Analysis, Market Pricing, Settings

### MASTER_DEVICE_DB — Key Columns (grouped, 20 of 38)

| Group | Columns |
|---|---|
| Identity | ID, Platform, Listing URL, Title |
| Device | Brand, Model, Storage, Carrier |
| Condition | Condition (Raw), Condition (Normalized), Final Grade |
| Pricing | Asking Price, Partner Base Price (Matched), Matched Buyback Value |
| Analysis | MAO, Offer Target, Expected Profit, Profit Margin %, Deal Class |
| Seller | Seller Name, Seller Contact, Hot Seller? |

### VERDICT — Key Columns (grouped, 20 of 22)

| Group | Columns |
|---|---|
| Ranking | Rank, Deal Score |
| Device | Title, Platform, Grade |
| Pricing | Asking Price, Offer Target, Matched Buyback Value |
| Profit | Expected Profit, Profit Margin %, Deal Class |
| Risk/Intel | Risk Score, Hot Seller?, Market Advantage, Distance (mi) |
| Outreach | Action, Seller Name, Seller Contact, Auto Seller Message |
| Reference | Listing URL, Master ID |

---

## PART 4 — HTML → SERVER MAP

### Legacy HTML Files (→ Code.gs functions)

| HTML File | google.script.run calls | Defined In |
|---|---|---|
| `Welcome.html` | `initializeSpreadsheet()` | Code.gs:152 |
| `Dashboard.html` | `getDashboardStats()`, `getRecentInventory(10)`, `getTopOpportunities(5)`, `refreshAnalysis()`, `showAddPhoneDialog()`, `showSearchDialog()`, `updateMarketPrices()` | Code.gs |
| `AddPhone.html` | `addPhone(phoneData)` | Code.gs:558 |
| `AddLead.html` | `addLead(leadData)` | Code.gs:910 |
| `LeadDashboard.html` | `getLeadStats()`, `getHotLeads(10)`, `showAddLeadDialog()`, `showManageLeadsDialog()` | Code.gs |
| `ManageLeads.html` | `getAllLeads()`, `showAddLeadDialog()` | Code.gs |
| `Search.html` | `searchInventory(searchTerm)` | Code.gs:594 |
| `Settings.html` | `initializeSpreadsheet()`, `showDashboard()` | Code.gs |

### TM_ HTML Files (→ TM_*.gs functions)

| HTML File | google.script.run calls | Defined In |
|---|---|---|
| `tm_control_center.html` | `TM_getQuickStats()`, `TM_getRecentLogsForUi()`, `TM_runSyncFromUi()`, `TM_runAnalysisFromUi()`, `TM_rebuildVerdictFromUi()`, `TM_showDashboardSidebar()`, `TM_showSettingsDialog()`, `TM_showSmartOutreach()`, `TM_showHelpDialog()` | TM_dashboard.gs, TM_ui.gs |
| `tm_dashboard.html` | `TM_getDashboardDataForUi()`, `TM_updateDashboardFromUi()`, `TM_openSheet('DASHBOARD_ANALYTICS')` | TM_dashboard.gs |
| `tm_settings.html` | `TM_getSettingsForUi()`, `TM_saveSettingsFromUi(settingsData)` | TM_ui.gs |
| `tm_help.html` | *(none — static content)* | — |
| `tm_smart_outreach.html` | `TM_getTopDealsForUi(10)`, `TM_markContactedFromUi(masterId)`, `TM_markScheduledFromUi(masterId)` | TM_verdict.gs, TM_ui.gs |

---

## PART 5 — INTEGRATIONS TRUTH

### SMS-iT

**CRM Sync** — `TM_syncToSmsIt()` @ TM_utils.gs:777
- Endpoint: `https://api.sms-it.io/v1/contacts`
- Auth: `Bearer {CRM_API_KEY}`
- Payload: `phone`, `first_name`, `last_name`, `tags[]`, `custom_fields{lead_source, device, asking_price, offer_target, deal_class}`

**SMS Send** — `TM_sendSmsViaSmsIt()` @ TM_utils.gs:1143
- Endpoint: `https://api.sms-it.io/v1/messages`
- Auth: `Bearer {SMS_API_KEY}`
- Payload: `to`, `message`, `from`

**Config:** SETTINGS sheet keys: `CRM_API_KEY`, `SMS_API_KEY`, `SMS_FROM_NUMBER`

### OneHash

**CRM Sync** — `TM_syncToOneHash()` @ TM_utils.gs:835
- Endpoint: user-provided `CRM_WEBHOOK_URL`
- Auth: `token {CRM_API_KEY}:{CRM_API_SECRET}`
- Payload: `doctype='Lead'`, `lead_name`, `mobile_no`, `email_id`, `source`, `notes`, `custom_device_title`, `custom_asking_price`, `custom_offer_target`

**Config:** SETTINGS sheet keys: `CRM_API_KEY`, `CRM_API_SECRET`, `CRM_WEBHOOK_URL`

### OhmyLead

**CRM Sync** — `TM_syncToOhmyLead()` @ TM_utils.gs:889
- Endpoint: user-provided `CRM_WEBHOOK_URL`
- Auth: `api_key` in payload body (no header auth)
- Payload: `api_key`, `name`, `phone`, `email`, `source`, `tags`, `notes`, `custom{device, asking_price, offer_target, deal_class}`

**Config:** SETTINGS sheet keys: `CRM_API_KEY`, `CRM_WEBHOOK_URL`

### SignWell

**E-Sign** — `TM_createSignWellDocument()` @ TM_utils.gs:1401
- Endpoint: `https://www.signwell.com/api/v1/documents`
- Auth: `X-Api-Key: {SIGNWELL_API_KEY}`
- Payload: `template_id`, `name`, `subject`, `message`, `recipients[{id, email, name, send_email}]`, `fields[{device_title, asking_price, offer_amount, seller_name, date}]`, `metadata{deal_id, source}`

**Config:** SETTINGS sheet keys: `SIGNWELL_API_KEY`, `SIGNWELL_TEMPLATE_ID`, `ESIGN_WEBHOOK_URL`

### Config Storage (ALL integrations)

**ALL keys/config stored in the SETTINGS sheet** (sheet name: `SETTINGS`), read via `TM_getSettingsMap()` @ TM_utils.gs. **No Script Properties used.** Config functions: `TM_getCrmConfig()`, `TM_getSmsConfig()`, `TM_getSignWellConfig()`.

---

END.
