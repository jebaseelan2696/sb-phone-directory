/**
 * api.js
 * Thin fetch wrapper around the Apps Script Web App. GET-only, with a
 * timeout, and consistent error handling around the JSON envelope.
 */

const Api = (function () {
  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise(function (_, reject) {
        setTimeout(function () { reject(new Error('Request timed out.')); }, ms);
      })
    ]);
  }

  function getDirectory() {
    const url = APP_CONFIG.API_BASE_URL + '?action=directory';
    return withTimeout(fetch(url), APP_CONFIG.API_TIMEOUT_MS)
      .then(function (res) {
        if (!res.ok) throw new Error('Server returned status ' + res.status);
        return res.json();
      })
      .then(function (envelope) {
        if (envelope.status !== 'success') {
          throw new Error((envelope.error && envelope.error.message) || 'Unknown server error.');
        }
        return envelope.data;
      });
  }

  return { getDirectory: getDirectory };
})();
