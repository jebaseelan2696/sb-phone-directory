/**
 * DirectoryService.gs
 * Reads the Directory / Lookups / Meta sheets and builds the JSON payload
 * returned by the API. Maps columns by header name (not position), so
 * admins can reorder columns in the sheet without breaking the API.
 */

/**
 * Builds the full directory payload: contacts + lookups + meta.
 * Result is cached in CacheService to avoid re-reading the sheet on
 * every request.
 */
function buildDirectoryPayload_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(CACHE_KEY);
  if (cached) {
    return JSON.parse(cached);
  }

  const ss = SpreadsheetApp.openById(SHEET_ID);

  const contacts = readContacts_(ss);
  const lookups = readLookups_(ss);
  const meta = readMeta_(ss);

  const payload = {
    contacts: contacts,
    lookups: lookups,
    meta: meta
  };

  cache.put(CACHE_KEY, JSON.stringify(payload), CACHE_TTL_SECONDS);
  return payload;
}

/**
 * Reads the Directory sheet, maps by header name, filters to Active rows,
 * normalizes phone-like fields, and sorts ascending by ID.
 */
function readContacts_(ss) {
  const sheet = ss.getSheetByName(SHEET_NAMES.DIRECTORY);
  if (!sheet) {
    throw new Error('Sheet "' + SHEET_NAMES.DIRECTORY + '" not found.');
  }

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0].map(function (h) { return String(h).trim(); });
  const colIndex = {};
  headers.forEach(function (h, i) { colIndex[h] = i; });

  const required = [
    'ID', 'Name', 'Rank', 'General No.', 'Category', 'Groupings',
    'Nature of Duty / Posting', 'CUG No.', 'Addl. No. I', 'Addl. No. II',
    'WhatsApp No.', 'Email', 'Photo URL', 'Active', 'Updated At', 'Remarks'
  ];
  required.forEach(function (col) {
    if (!(col in colIndex)) {
      throw new Error('Expected column "' + col + '" not found in Directory sheet.');
    }
  });

  const rows = values.slice(1);
  const contacts = [];

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const isActive = row[colIndex['Active']] === true || String(row[colIndex['Active']]).toUpperCase() === 'TRUE';
    const id = trimVal_(row[colIndex['ID']]);
    const name = trimVal_(row[colIndex['Name']]);

    if (!isActive || !id || !name) continue; // skip inactive/blank rows

    contacts.push({
      id: id,
      name: name,
      rank: trimVal_(row[colIndex['Rank']]),
      generalNo: trimVal_(row[colIndex['General No.']]),
      category: trimVal_(row[colIndex['Category']]),
      grouping: trimVal_(row[colIndex['Groupings']]),
      posting: trimVal_(row[colIndex['Nature of Duty / Posting']]),
      cugNo: normalizePhone_(row[colIndex['CUG No.']]),
      addlNo1: normalizePhone_(row[colIndex['Addl. No. I']]),
      addlNo2: normalizePhone_(row[colIndex['Addl. No. II']]),
      whatsappNo: normalizePhone_(row[colIndex['WhatsApp No.']]),
      email: trimVal_(row[colIndex['Email']]),
      photoUrl: trimVal_(row[colIndex['Photo URL']])
      // Remarks intentionally excluded — internal-only, not sent to client.
    });
  }

  // Sort ascending by ID (string-aware, handles e.g. SB-0002 vs SB-0010).
  contacts.sort(function (a, b) {
    return a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' });
  });

  return contacts;
}

/**
 * Reads the Lookups sheet: columns "Ranks" and "Categories".
 * Returns arrays of non-blank values in sheet order.
 */
function readLookups_(ss) {
  const sheet = ss.getSheetByName(SHEET_NAMES.LOOKUPS);
  const result = { ranks: [], categories: [] };
  if (!sheet) return result;

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return result;

  const headers = values[0].map(function (h) { return String(h).trim(); });
  const rankCol = headers.indexOf('Ranks');
  const catCol = headers.indexOf('Categories');

  for (let r = 1; r < values.length; r++) {
    if (rankCol > -1) {
      const v = trimVal_(values[r][rankCol]);
      if (v) result.ranks.push(v);
    }
    if (catCol > -1) {
      const v = trimVal_(values[r][catCol]);
      if (v) result.categories.push(v);
    }
  }

  return result;
}

/**
 * Reads the Meta sheet as simple key/value pairs (column A = key, B = value).
 */
function readMeta_(ss) {
  const sheet = ss.getSheetByName(SHEET_NAMES.META);
  const meta = { appVersion: APP_VERSION, lastUpdated: '', notice: '' };
  if (!sheet) return meta;

  const values = sheet.getDataRange().getValues();
  for (let r = 0; r < values.length; r++) {
    const key = trimVal_(values[r][0]);
    const val = values[r][1];
    if (key === 'AppVersion') meta.appVersion = trimVal_(val) || APP_VERSION;
    if (key === 'LastUpdated') meta.lastUpdated = formatDate_(val);
    if (key === 'Notice') meta.notice = trimVal_(val);
  }
  return meta;
}

/** Trims a cell value to a string; returns '' for null/undefined. */
function trimVal_(v) {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

/**
 * Normalizes a phone-like cell value to a plain digit string.
 * Prevents Sheets' numeric/scientific-notation quirks and stray formatting
 * (spaces, dashes, +) from leaking into the API.
 */
function normalizePhone_(v) {
  const s = trimVal_(v);
  if (!s) return '';
  return s.replace(/[^\d]/g, '');
}

/** Formats a Date value as an ISO-like string; passes through strings as-is. */
function formatDate_(v) {
  if (!v) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
  }
  return String(v);
}

/**
 * onEdit trigger: auto-stamps the "Updated At" column whenever a row
 * in the Directory sheet is edited. Install as an installable trigger
 * (Triggers > Add Trigger > onEditDirectory > From spreadsheet > On edit)
 * so it has permission to write back to the sheet.
 */
function onEditDirectory(e) {
  try {
    const sheet = e.range.getSheet();
    if (sheet.getName() !== SHEET_NAMES.DIRECTORY) return;
    if (e.range.getRow() === 1) return; // header row

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      .map(function (h) { return String(h).trim(); });
    const updatedAtCol = headers.indexOf('Updated At') + 1;
    if (updatedAtCol < 1) return;

    // Avoid re-triggering when the edit was to the Updated At column itself.
    if (e.range.getColumn() === updatedAtCol) return;

    sheet.getRange(e.range.getRow(), updatedAtCol).setValue(new Date());
  } catch (err) {
    // Never let a trigger error interrupt the user's editing.
  }
}
