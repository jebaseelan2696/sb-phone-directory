/**
 * store.js
 * In-memory + localStorage-backed cache factory, with a simple TTL so
 * the app works instantly on repeat visits and only re-fetches when the
 * cache is stale or the user forces a refresh. Each module gets its own
 * cache instance (own storage key) so their data never clashes.
 */

function createCacheStore_(storageKey) {
  function read() {
    try {
      const raw = localStorage.getItem(storageKey);
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
      localStorage.setItem(storageKey, JSON.stringify({
        savedAt: Date.now(),
        payload: payload
      }));
    } catch (err) {
      // Storage full or unavailable — non-fatal, app still works in-memory.
    }
  }

  function clear() {
    localStorage.removeItem(storageKey);
  }

  return { read: read, write: write, clear: clear };
}

const Store = createCacheStore_('sb_directory_cache_v1');
const OfficersStore = createCacheStore_('sb_officers_cache_v1');
