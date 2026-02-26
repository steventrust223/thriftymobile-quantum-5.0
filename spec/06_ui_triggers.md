# 06 — UI & Triggers

## Custom Menu (`Code.gs` → `onOpen`)

Menu label: `ThriftyMobile`

| Menu Item | Function Called |
|---|---|
| Open Dashboard | `showDashboard()` |
| **Lead Management** (submenu) | |
| → Lead Dashboard | `showLeadDashboard()` |
| → Add New Lead | `showAddLeadDialog()` |
| → Manage Leads | `showManageLeadsDialog()` |
| → Refresh Lead Scores | `refreshLeadScores()` |
| Initialize Spreadsheet | `initializeSpreadsheet()` |
| Refresh Analysis | `refreshAnalysis()` |
| Update Market Prices | `updateMarketPrices()` |
| Add New Phone | `showAddPhoneDialog()` |
| Search Inventory | `showSearchDialog()` |
| Settings | `showSettings()` |

Note: The TM_* pipeline menu (referenced in `tm_help.html` as "Setup / Refresh Structure", "Run Import → Master Sync", "Run Full Analysis") is **NOT FOUND IN REPO**. No second `onOpen` or menu-building function for the Quantum pipeline exists.

## HTML Dialogs & Sidebars

| File | Opened By | Type | Size |
|---|---|---|---|
| `Welcome.html` | `showWelcomeDialog()` | Modal | 500×400 |
| `AddLead.html` | `showAddLeadDialog()` | Modal | 700×650 |
| `tm_help.html` | NOT FOUND IN REPO (no function opens it as a dialog) | — | — |
| `tm_settings.html` | NOT FOUND IN REPO (no function passes this filename to `HtmlService`) | — | — |

### Dialogs Referenced But HTML Files NOT FOUND IN REPO

| Function | Expected HTML File |
|---|---|
| `showDashboard()` | `Dashboard` (no `Dashboard.html` in repo) |
| `showAddPhoneDialog()` | `AddPhone` (no `AddPhone.html` in repo) |
| `showSearchDialog()` | `Search` (no `Search.html` in repo) |
| `showSettings()` | `Settings` (no `Settings.html` in repo) |
| `showLeadDashboard()` | `LeadDashboard` (no `LeadDashboard.html` in repo) |
| `showManageLeadsDialog()` | `ManageLeads` (no `ManageLeads.html` in repo) |

### TM_dashboard.gs Sidebar

`TM_showDashboardSidebar()` opens `tm_dashboard` — but `tm_dashboard.html` is **NOT FOUND IN REPO**.

## Triggers

`onOpen()` is the only trigger defined. It fires on spreadsheet open:
1. Builds the custom menu.
2. If `DocumentProperties.initialized` is not set, calls `showWelcomeDialog()`.

No time-driven triggers, `onEdit`, or installable triggers are defined in the repo.

## Server-Side Functions Called from HTML

| HTML File | Calls |
|---|---|
| `Welcome.html` | `initializeSpreadsheet()` |
| `AddLead.html` | `addLead(leadData)` |
| `tm_settings.html` | `TM_getSettingsForUi()`, `TM_saveSettingsFromUi(settingsData)` |

`TM_getSettingsForUi` and `TM_saveSettingsFromUi` are **NOT FOUND IN REPO** (called from `tm_settings.html` but never defined).

## Utility Functions Called But NOT FOUND IN REPO

The following are invoked across TM_* files but have no definition in any `.gs` file:

- `TM_logEvent(type, source, message)`
- `TM_sheetToObjects(sheet)`
- `TM_getHeaderMap(sheet)`
- `TM_getSettingsMap()`
- `TM_clearAndPopulate(sheet, headers, data)`
- `TM_parsePrice(value)`
- `TM_cleanString(str)`
- `TM_formatCurrency(amount)`
- `TM_formatPercent(value)`
- `TM_generateId()`
- `TM_showToast(message, title, seconds)`
- `TM_showAlert(message)`
- `TM_getGradeColumnName(grade)`
- `TM_applyDealClassFormattingVerdict(sheet)`
- `TM_getSettingsForUi()`
- `TM_saveSettingsFromUi(data)`
- `TM_getBuybackSummary` is defined in `TM_buyback_logic.gs` (confirmed present)
