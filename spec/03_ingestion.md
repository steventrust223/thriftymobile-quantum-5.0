# 03 — Ingestion

## Data Source

External scrape data (Browse.AI or manual paste) is placed into one of five IMPORT sheets defined in `TM_IMPORT_SHEETS`:

- `IMPORT_FB` — Facebook Marketplace
- `IMPORT_CL` — Craigslist
- `IMPORT_OU` — OfferUp
- `IMPORT_EBAY` — eBay
- `IMPORT_OTHER` — Any other platform

All share the `TM_HEADERS_IMPORT` schema (19 columns).

## Platform Mapping

Defined in `TM_config.gs` → `TM_PLATFORMS`:

| Key | Name | Code | Sheet |
|---|---|---|---|
| `FACEBOOK` | Facebook | FB | `IMPORT_FB` |
| `CRAIGSLIST` | Craigslist | CL | `IMPORT_CL` |
| `OFFERUP` | OfferUp | OU | `IMPORT_OU` |
| `EBAY` | eBay | EBAY | `IMPORT_EBAY` |
| `OTHER` | Other | OTHER | `IMPORT_OTHER` |

## Import → Master Sync

The sync function that reads IMPORT sheets and normalizes rows into `MASTER_DEVICE_DB` is referenced in `tm_help.html` (step 3: "Run Import → Master Sync") but the actual sync function is **NOT FOUND IN REPO**. No `TM_syncImports`, `TM_importToMaster`, or similar function exists in any `.gs` file.

## Grading During Ingestion

Condition normalization uses `TM_CONDITION_TO_GRADE` (in `TM_config.gs`), mapping raw text to grades A / B+ / B / C / D / DOA.

Issue detection uses `TM_ISSUE_KEYWORDS` for deduction flags (cracked back, cracked lens, Cricket carrier, demo unit, missing stylus, heavy scratches, low battery, no Face ID, no Touch ID).

Blacklist rejection uses `TM_BLACKLIST_KEYWORDS` (iCloud lock, activation lock, FRP lock, blacklisted, bad ESN, bad IMEI, reported lost/stolen, MDM lock, passcode lock, disabled).

## Grading Engine Sheet

`GRADING_ENGINE` (`TM_HEADERS_GRADING`) stores keyword-to-grade mappings as a sheet-based lookup, but the function that populates or reads this sheet is **NOT FOUND IN REPO**.

## Device Types & Brands

`TM_DEVICE_TYPES`: iPhone, Samsung Galaxy, Google Pixel, OnePlus, iPad, Samsung Tablet, MacBook, Apple Watch, Samsung Watch, AirPods, Other.

`TM_BRANDS`: Apple, Samsung, Google, OnePlus, Motorola, LG, Sony, Huawei, Xiaomi, Other.
