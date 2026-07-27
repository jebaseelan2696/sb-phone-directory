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

/**
 * Officer-role tabs read generically by OfficersService.gs. To add a new
 * role later (e.g. SHOs, Ministerial Staffs), just add one entry here —
 * no other backend or frontend code needs to change, as long as the new
 * sheet tab follows the same common-column pattern as ADSsP/SDPOs.
 */
const OFFICER_SHEETS = [
  { key: 'adsp', label: 'ADSsP', sheetName: 'ADSsP' },
  { key: 'sdpo', label: 'SDPOs', sheetName: 'SDPOs' },
  { key: 'sho', label: 'SHOs', sheetName: 'SHOs' },
  { key: 'ministerial', label: 'Ministerial Stfs', sheetName: 'Ministerial Staffs' }
];

// How long (seconds) the server-side cache holds each built JSON payload.
const CACHE_TTL_SECONDS = 600; // 10 minutes

const CACHE_KEY = 'sb_directory_payload_v1';
const OFFICERS_CACHE_KEY = 'sb_officers_payload_v1';

const APP_VERSION = '1.0.0';
