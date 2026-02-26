# 02 — Schemas

Column headers for every sheet, taken verbatim from `TM_config.gs`.

## TM_HEADERS_IMPORT (19 cols)

Used by all five IMPORT_* sheets.

```
Timestamp, Platform, Listing URL, Title, Asking Price, Location,
Device Type, Brand, Model, Storage, Carrier, Condition (Raw),
Description, Images, Seller Name, Seller Contact, Scrape Job Link,
Source Sheet, Seller ZIP / Location
```

## TM_HEADERS_MASTER (37 cols)

```
ID, Platform, Listing URL, Device Type, Brand, Model, Variant,
Storage, Carrier, Condition (Raw), Condition (Normalized),
Guessed Grade, Manual Grade, Final Grade, Asking Price,
Estimated Resale Value, Partner Base Price (Matched),
Applied Deductions, Matched Buyback Value, MAO, Offer Target,
Expected Profit, Profit Margin %, Risk Score, Deal Class,
Hot Seller?, Market Advantage Score, Sales Velocity Score,
Location, Seller ZIP, Distance (mi), Location Risk, Device Flags,
Auto Notes, Lead Synced?, CRM Status, Last Updated, Title,
Seller Name, Seller Contact
```

## TM_HEADERS_VERDICT (22 cols)

```
Rank, Deal Score, Title, Platform, Grade, Asking Price,
Offer Target, Matched Buyback Value, Expected Profit,
Profit Margin %, Deal Class, Risk Score, Hot Seller?,
Market Advantage, Distance (mi), Action, Seller Name,
Seller Contact, Listing URL, Auto Seller Message, Notes,
Master ID
```

## TM_HEADERS_BUYBACK_PRICING (11 cols)

```
Brand, Model, Variant, Storage, Grade A, Grade B+, Grade B,
Grade C, Grade D, DOA, Notes
```

## TM_HEADERS_BUYBACK_MATCH (12 cols)

```
Device ID, Brand, Model, Storage, Grade, Partner Base Price,
Deductions Applied, Deduction Details, Final Buyback Value,
Match Confidence, Match Notes, Timestamp
```

## TM_HEADERS_MAO (10 cols)

```
Device ID, Asking Price, Matched Buyback Value, Risk Score,
MAO, Offer Target, Expected Profit, Profit Margin %,
Calculation Notes, Timestamp
```

## TM_HEADERS_GRADING (5 cols)

```
Condition Keyword, Maps To Grade, Priority, Category, Notes
```

## TM_HEADERS_LEADS (13 cols)

```
Lead ID, Seller Name, Seller Contact, Platform, Total Deals,
Hot Seller?, First Seen, Last Contact, Contact Method, Status,
Notes, CRM ID, Last Updated
```

## TM_HEADERS_CRM (10 cols)

```
Sync ID, Timestamp, Action, Record Type, Local ID, External ID,
Status, Response, Error, Retry Count
```

## TM_HEADERS_SETTINGS (5 cols)

```
Setting Name, Value, Description, Category, Last Updated
```

## TM_HEADERS_LOG (6 cols)

```
Timestamp, Type, Source, Message, Details, User
```

## TM_HEADERS_DASHBOARD (5 cols)

```
Metric, Value, Period, Category, Last Updated
```
