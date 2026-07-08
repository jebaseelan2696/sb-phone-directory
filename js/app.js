/**
 * app.js
 * Bootstraps the app shell: theme, header controls, and the (currently
 * single) Directory module. When more modules are added, this is where
 * a router would dispatch to the active one based on location.hash.
 */

document.addEventListener('DOMContentLoaded', function () {
  Theme.init();

  $('#org-name').textContent = APP_CONFIG.ORG_NAME;
  $('#org-subtitle').textContent = APP_CONFIG.ORG_SUBTITLE;

  $('#theme-toggle').addEventListener('click', function () {
    const next = Theme.toggle();
    $('#theme-toggle').textContent = next === 'dark' ? '☀️' : '\u{1F319}';
  });
  $('#theme-toggle').textContent = Theme.current() === 'dark' ? '☀️' : '\u{1F319}';

  DirectoryModule.init($('#app-content'));
});
