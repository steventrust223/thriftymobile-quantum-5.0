# 00 — Manifest

## Project

Thrifty Mobile Quantum 5.0 — Automated Phone Buyback Analysis Engine built on Google Apps Script.

## Repository Files

| File | Purpose |
|---|---|
| `Code.gs` | Menu/UI, initialization, data ops (inventory CRUD, lead CRUD, dashboard stats). Legacy `CONFIG` object lives here. |
| `TM_config.gs` | Canonical configuration: sheet names (`TM_SHEETS`), all header arrays, deduction constants, grading maps, deal thresholds, MAO params, score weights, colors, default settings, platform/brand maps, action types, log types, version info. |
| `TM_analysis.gs` | MAO calculation, risk scoring, market advantage, deal classification, hot-seller detection, deal-score ranking. |
| `TM_buyback_logic.gs` | Buyback partner price matching (fuzzy), deduction engine, buyback summary. |
| `TM_verdict.gs` | Builds the ranked VERDICT sheet, determines actions (CALL/TEXT/PASS/HOLD), generates auto seller messages. |
| `TM_dashboard.gs` | Populates DASHBOARD_ANALYTICS, gathers KPIs, chart creation, daily summary report, sidebar/dialog display. |
| `AddLead.html` | Add-lead dialog UI (calls `addLead` in `Code.gs`). |
| `Welcome.html` | First-run welcome dialog (calls `initializeSpreadsheet`). |
| `tm_help.html` | Quick-start guide & help sidebar. |
| `tm_settings.html` | Settings editor sidebar (calls `TM_getSettingsForUi`, `TM_saveSettingsFromUi`). |
| `.clasp.json` | Clasp deployment config (empty `scriptId`). |

## Dual Config Note

`Code.gs` defines a legacy `CONFIG` object (sheet names like `'Lead Management'`, `'Phone Inventory'`).
`TM_config.gs` defines the Quantum 5.0 `TM_SHEETS` object (sheet names like `'MASTER_DEVICE_DB'`, `'VERDICT'`).
The two config sets are **not reconciled**; the TM_* pipeline exclusively uses `TM_SHEETS`.
