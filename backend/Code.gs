/**
 * Code.gs
 * Entry point for the Apps Script Web App. Routes GET requests by
 * ?action=... to the appropriate handler and always returns a JSON
 * envelope, even on error, so the frontend never has to parse HTML.
 */

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || '';

  try {
    switch (action) {
      case 'clearcache':
        CacheService.getScriptCache().remove(CACHE_KEY);
        return jsonResponse_(successEnvelope_({ cleared: true }));
      case 'directory':
        return jsonResponse_(successEnvelope_(buildDirectoryPayload_()));
      case 'ping':
        return jsonResponse_(successEnvelope_({
          appVersion: APP_VERSION,
          lastUpdated: readMetaSafe_()
        }));
      default:
        return jsonResponse_(errorEnvelope_('UNKNOWN_ACTION', 'Unknown or missing action: "' + action + '".'));
    }
  } catch (err) {
    return jsonResponse_(errorEnvelope_('SERVER_ERROR', err && err.message ? err.message : String(err)));
  }
}

function readMetaSafe_() {
  try {
    return readMeta_(SpreadsheetApp.openById(SHEET_ID)).lastUpdated;
  } catch (err) {
    return '';
  }
}

function successEnvelope_(data) {
  return {
    status: 'success',
    version: APP_VERSION,
    generatedAt: new Date().toISOString(),
    data: data,
    error: null
  };
}

function errorEnvelope_(code, message) {
  return {
    status: 'error',
    version: APP_VERSION,
    generatedAt: new Date().toISOString(),
    data: null,
    error: { code: code, message: message }
  };
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
