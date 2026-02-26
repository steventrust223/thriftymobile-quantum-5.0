# 01 — Sheets

All sheet names are defined in `TM_config.gs` → `TM_SHEETS`.

## Import / Staging Sheets

| Constant | Sheet Name | Header Array | Purpose |
|---|---|---|---|
| `IMPORT_FB` | `IMPORT_FB` | `TM_HEADERS_IMPORT` | Facebook Marketplace listings |
| `IMPORT_CL` | `IMPORT_CL` | `TM_HEADERS_IMPORT` | Craigslist listings |
| `IMPORT_OU` | `IMPORT_OU` | `TM_HEADERS_IMPORT` | OfferUp listings |
| `IMPORT_EBAY` | `IMPORT_EBAY` | `TM_HEADERS_IMPORT` | eBay listings |
| `IMPORT_OTHER` | `IMPORT_OTHER` | `TM_HEADERS_IMPORT` | Other platform listings |

All five are also collected in the `TM_IMPORT_SHEETS` array for iteration.

## Core System Sheets

| Constant | Sheet Name | Header Array |
|---|---|---|
| `MASTER_DEVICE_DB` | `MASTER_DEVICE_DB` | `TM_HEADERS_MASTER` (37 columns) |
| `GRADING_ENGINE` | `GRADING_ENGINE` | `TM_HEADERS_GRADING` |
| `BUYBACK_MATCH` | `BUYBACK_MATCH` | `TM_HEADERS_BUYBACK_MATCH` |
| `MAO_ENGINE` | `MAO_ENGINE` | `TM_HEADERS_MAO` |
| `VERDICT` | `VERDICT` | `TM_HEADERS_VERDICT` (22 columns) |

## Reference Sheet

| Constant | Sheet Name | Header Array |
|---|---|---|
| `BUYBACK_PARTNER_PRICING` | `BUYBACK_PARTNER_PRICING` | `TM_HEADERS_BUYBACK_PRICING` |

## Supporting Sheets

| Constant | Sheet Name | Header Array |
|---|---|---|
| `LEADS_TRACKER` | `LEADS_TRACKER` | `TM_HEADERS_LEADS` |
| `CRM_INTEGRATION` | `CRM_INTEGRATION` | `TM_HEADERS_CRM` |
| `SETTINGS` | `SETTINGS` | `TM_HEADERS_SETTINGS` |
| `SYSTEM_LOG` | `SYSTEM_LOG` | `TM_HEADERS_LOG` |
| `DASHBOARD_ANALYTICS` | `DASHBOARD_ANALYTICS` | `TM_HEADERS_DASHBOARD` |

## Legacy Sheets (Code.gs CONFIG)

`Code.gs` defines a separate `CONFIG.SHEET_NAMES` with: `'Lead Management'`, `'Phone Inventory'`, `'Buyback Analysis'`, `'Market Pricing'`, `'Settings'`. These are used only by the legacy functions in `Code.gs` and are **not** referenced by the TM_* pipeline.
