# Google Sheet Template — SB Phone Directory

Create one Google Sheet with three tabs, exactly named as below.

## Tab 1: `Directory`

Row 1 = headers, exactly as written (used by the API to map columns):

| ID | Name | Rank | General No. | Category | Groupings | Nature of Duty / Posting | CUG No. | Addl. No. I | Addl. No. II | WhatsApp No. | Email | Photo URL | Active | Updated At | Remarks |
|----|------|------|------------|----------|-----------|--------------------------|---------|-------------|--------------|--------------|-------|-----------|--------|------------|---------|

**Groupings column (F) notes:**
- Free text, entirely up to you — this is whatever heading you want cards to be grouped and separated under in the app (e.g. a sub-division name, a wing name, "Headquarters", or any label you choose).
- Rows sharing the same Groupings text will appear together under one section header, in the order your IDs already put them in.
- Leave it blank only if you don't want that row to have a distinct section (it'll fall under an "Unassigned" heading).

**Important formatting steps:**
1. Select columns **H, I, J, K** (CUG No., Addl. No. I, Addl. No. II, WhatsApp No.) → Format → Number → **Plain text**. This prevents Sheets from mangling phone numbers (dropping leading zeros, scientific notation).
2. Column **A (ID)**: use the pattern `SB-0001`, `SB-0002`, ... in the exact display order you want (HQ staff first grouped by duty, then field staff grouped by Sub-Division → Police Station).
3. Column **N (Active)**: insert a checkbox (Insert → Checkbox) so it stores TRUE/FALSE cleanly.
4. Column **C (Rank)**: Data → Data validation → List from range → `Lookups!A2:A`.
5. Column **E (Category)**: Data → Data validation → List from range → `Lookups!B2:B`.
6. Column **O (Updated At)**: leave blank — auto-filled by the `onEditDirectory` trigger once installed.

## Tab 2: `Lookups`

| Ranks | Categories |
|-------|------------|
| DySP | SB Headquarters Staff |
| Inspector | SB Field Staff |
| Sub Inspector | SB S/D SI/SSI |
| ... | Others |

List every rank you use, in the seniority order you want filter dropdowns to show. Same for Categories.

## Tab 3: `Meta`

Two columns, no header row needed — just key/value pairs:

| AppVersion | 1.0.0 |
|------------|-------|
| LastUpdated | (leave blank; update manually if you want a banner date) |
| Notice | (optional short message shown in the app, e.g. "Data as of July 2026") |

## After creating the sheet

1. Copy the Sheet ID from its URL: `https://docs.google.com/spreadsheets/d/<THIS_PART>/edit`
2. Paste it into `backend/Config.gs` → `SHEET_ID`.
3. See `DEPLOYMENT.md` for Apps Script deployment steps.
