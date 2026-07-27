/**
 * OfficersService.gs
 * Generic reader for the officer-role tabs (ADSsP, SDPOs, and any future
 * role added to OFFICER_SHEETS in Config.gs). One function serves every
 * tab: common columns (Name, Rank, phones, vacancy fields, etc.) are
 * mapped to fixed keys, while any other column found on that specific
 * tab (e.g. "Unit/Wing" on ADSsP, "Sub Division" on SDPOs) is carried
 * through generically as a "context" field — so a new role tab with a
 * different extra column works with zero code changes, as long as its
 * common columns match the shared pattern.
 */

// Columns handled explicitly below; anything else found in a sheet's
// header row is treated as a generic "context" field (role-specific info
// like Unit/Wing, Police Station, Sub Division).
var OFFICER_COMMON_HEADERS_ = [
  'ID', 'Name', 'Rank', 'Mike Sign No.', 'CUG No.', 'Mobile No. 1',
  'Mobile No. 2', 'WhatsApp No.', 'Email', 'Photo URL', 'Active',
  'Updated At', 'Remarks', 'Save As', 'Post Status', 'I/C Officer',
  'I/C Contact No.'
];

function buildOfficersPayload_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(OFFICERS_CACHE_KEY);
  if (cached) {
    return JSON.parse(cached);
  }

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const contacts = [];

  OFFICER_SHEETS.forEach(function (roleConfig) {
    const rows = readOfficerSheet_(ss, roleConfig);
    contacts.push.apply(contacts, rows);
  });

  const payload = {
    contacts: contacts,
    types: OFFICER_SHEETS.map(function (r) { return { key: r.key, label: r.label }; })
  };

  cache.put(OFFICERS_CACHE_KEY, JSON.stringify(payload), CACHE_TTL_SECONDS);
  return payload;
}

function readOfficerSheet_(ss, roleConfig) {
  const sheet = ss.getSheetByName(roleConfig.sheetName);
  if (!sheet) return []; // tab not created yet — skip silently, not an error

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0].map(function (h) { return String(h).trim(); });
  const colIndex = {};
  headers.forEach(function (h, i) { colIndex[h] = i; });

  const contextHeaders = headers.filter(function (h) {
    return h && OFFICER_COMMON_HEADERS_.indexOf(h) === -1;
  });

  const rows = values.slice(1);
  const contacts = [];

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const isActive = colIndex['Active'] === undefined
      || row[colIndex['Active']] === true
      || String(row[colIndex['Active']]).toUpperCase() === 'TRUE';
    const id = colIndex['ID'] !== undefined ? trimVal_(row[colIndex['ID']]) : '';
    const name = colIndex['Name'] !== undefined ? trimVal_(row[colIndex['Name']]) : '';

    if (!isActive || !id || !name) continue;

    const context = contextHeaders
      .map(function (h) { return { label: h, value: trimVal_(row[colIndex[h]]) }; })
      .filter(function (c) { return c.value; });

    contacts.push({
      id: id,
      typeKey: roleConfig.key,
      typeLabel: roleConfig.label,
      name: name,
      saveAs: colIndex['Save As'] !== undefined ? trimVal_(row[colIndex['Save As']]) : '',
      rank: colIndex['Rank'] !== undefined ? trimVal_(row[colIndex['Rank']]) : '',
      mikeSignNo: colIndex['Mike Sign No.'] !== undefined ? trimVal_(row[colIndex['Mike Sign No.']]) : '',
      cugNo: colIndex['CUG No.'] !== undefined ? normalizePhone_(row[colIndex['CUG No.']]) : '',
      addlNo1: colIndex['Mobile No. 1'] !== undefined ? normalizePhone_(row[colIndex['Mobile No. 1']]) : '',
      addlNo2: colIndex['Mobile No. 2'] !== undefined ? normalizePhone_(row[colIndex['Mobile No. 2']]) : '',
      whatsappNo: colIndex['WhatsApp No.'] !== undefined ? normalizePhone_(row[colIndex['WhatsApp No.']]) : '',
      email: colIndex['Email'] !== undefined ? trimVal_(row[colIndex['Email']]) : '',
      photoUrl: colIndex['Photo URL'] !== undefined ? trimVal_(row[colIndex['Photo URL']]) : '',
      postStatus: colIndex['Post Status'] !== undefined ? trimVal_(row[colIndex['Post Status']]) : 'Regular',
      icOfficer: colIndex['I/C Officer'] !== undefined ? trimVal_(row[colIndex['I/C Officer']]) : '',
      icContactNo: colIndex['I/C Contact No.'] !== undefined ? normalizePhone_(row[colIndex['I/C Contact No.']]) : '',
      context: context
      // Remarks intentionally excluded — internal-only, not sent to client.
    });
  }

  contacts.sort(function (a, b) {
    return a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' });
  });

  return contacts;
}
