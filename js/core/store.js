/**
 * store.js
 * In-memory + localStorage-backed cache for the directory payload, with
 * a simple TTL so the app works instantly on repeat visits and only
 * re-fetches when the cache is stale or the user forces a refresh.
 */

const Store = (function () {
  const STORAGE_KEY = 'sb_directory_cache_v1';

  function read() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const ageMs = Date.now() - parsed.savedAt;
      const ttlMs = APP_CONFIG.CACHE_TTL_MINUTES * 60 * 1000;
      if (ageMs > ttlMs) return null;
      return parsed.payload;
    } catch (err) {
      return null;
    }
  }

  function write(payload) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        savedAt: Date.now(),
        payload: payload
      }));
    } catch (err) {
      // Storage full or unavailable — non-fatal, app still works in-memory.
    }
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY);
  }

  return { read, write, clear };
})();
