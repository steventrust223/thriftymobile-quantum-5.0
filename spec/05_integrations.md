# 05 — Integrations

## CRM Integration

Settings defined in `TM_config.gs` → `TM_DEFAULT_SETTINGS`:

| Setting | Default | Description |
|---|---|---|
| `CRM_ENABLED` | `FALSE` | Master toggle |
| `CRM_PROVIDER` | `none` | Options: `smsit`, `onehash`, `ohmylead`, `webhook`, `none` |
| `CRM_API_KEY` | (empty) | Provider API key |
| `CRM_API_SECRET` | (empty) | Provider API secret |
| `CRM_WEBHOOK_URL` | (empty) | Webhook endpoint |

Sheet: `CRM_INTEGRATION` (`TM_HEADERS_CRM`) tracks sync events with columns: Sync ID, Timestamp, Action, Record Type, Local ID, External ID, Status, Response, Error, Retry Count.

MASTER_DEVICE_DB has `Lead Synced?` and `CRM Status` columns for per-device sync tracking.

**Actual CRM sync functions are NOT FOUND IN REPO.** No `TM_syncToCrm`, `TM_pushToCrm`, or HTTP call functions exist.

## SMS Integration

Settings:

| Setting | Default |
|---|---|
| `SMS_ENABLED` | `FALSE` |
| `SMS_PROVIDER` | `none` (options: `smsit`, `twilio`, `webhook`, `none`) |
| `SMS_API_KEY` | (empty) |
| `SMS_API_SECRET` | (empty) |
| `SMS_FROM_NUMBER` | (empty) |
| `SMS_WEBHOOK_URL` | (empty) |

**Actual SMS send functions are NOT FOUND IN REPO.**

## E-Signature Integration

Settings:

| Setting | Default |
|---|---|
| `ESIGN_ENABLED` | `FALSE` |
| `ESIGN_PROVIDER` | `none` (options: `signwell`, `webhook`, `none`) |
| `SIGNWELL_API_KEY` | (empty) |
| `SIGNWELL_TEMPLATE_ID` | (empty) |
| `ESIGN_WEBHOOK_URL` | (empty) |

**Actual e-signature functions are NOT FOUND IN REPO.**

## Leads Tracker

`LEADS_TRACKER` (`TM_HEADERS_LEADS`) is populated by `TM_updateLeadsFromSellers` (in `TM_analysis.gs`) when hot-seller detection runs. New sellers not already present are appended with Lead ID, name, contact, platform, deal count, hot status, and timestamps.

## System Log

`SYSTEM_LOG` (`TM_HEADERS_LOG`) is written to by `TM_logEvent` (called throughout TM_* files). Log types from `TM_LOG_TYPES`: INFO, SUCCESS, WARNING, ERROR, SYNC, ANALYSIS, OUTREACH, SYSTEM.

**`TM_logEvent` function definition is NOT FOUND IN REPO** (called but never defined in any `.gs` file).

## External Data Source

`tm_help.html` references "Browse.AI data" as the external scrape source for IMPORT sheets. No Browse.AI API integration code exists — data is pasted manually.
