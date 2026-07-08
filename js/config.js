/**
 * config.js
 * The ONLY file that needs editing when connecting to a real backend
 * deployment or rebranding the app.
 */

const APP_CONFIG = {
  // Apps Script Web App URL (ends in /exec). Paste your deployment URL here.
  API_BASE_URL: 'https://script.google.com/macros/s/AKfycbylgMEvv4XOJReIfogDGEnk2DhgUvVogKRlMHE8fsdM-TBm87bF3V6wyaPB5YjqAU7C/exec',

  ORG_NAME: 'District Special Branch',
  ORG_SUBTITLE: 'Thoothukudi District Police',

  // How long (minutes) the fetched directory stays cached in the browser
  // before a background refresh is triggered automatically.
  CACHE_TTL_MINUTES: 360, // 6 hours

  // Country code prepended to 10-digit WhatsApp numbers.
  WHATSAPP_COUNTRY_CODE: '91',

  // Request timeout for the API call (ms).
  API_TIMEOUT_MS: 15000
};
