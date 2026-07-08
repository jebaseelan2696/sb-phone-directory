/**
 * Config.gs
 * Central configuration for the SB Phone Directory backend.
 * Edit SHEET_ID after creating the Google Sheet from the template.
 */

// The ID of the Google Sheet acting as the database (from its URL).
const SHEET_ID = 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE';

const SHEET_NAMES = {
  DIRECTORY: 'Directory',
  LOOKUPS: 'Lookups',
  META: 'Meta'
};

// How long (seconds) the server-side cache holds the built JSON payload.
const CACHE_TTL_SECONDS = 600; // 10 minutes

const CACHE_KEY = 'sb_directory_payload_v1';

const APP_VERSION = '1.0.0';
