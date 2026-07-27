/**
 * app.js
 * Bootstraps the app shell: theme, header controls, and the flat
 * 5-tab header nav (SB | ADSsP | SDPOs | SHOs | Ministerial Stfs).
 * The four officer tabs all share one Officers module instance and
 * just switch which role it's filtered to; SB uses its own Directory
 * module. Each module is fetched/initialized only once, the first
 * time any of its tabs is opened.
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

  const directoryContent = $('#directory-content');
  const officersContent = $('#officers-content');
  let directoryStarted = false;
  let officersStarted = false;

  function activateTab(btn) {
    $all('.module-nav__btn').forEach(function (b) { b.classList.remove('is-active'); });
    btn.classList.add('is-active');
  }

  function showModule(moduleKey, typeKey) {
    if (moduleKey === 'directory') {
      directoryContent.style.display = '';
      officersContent.style.display = 'none';
      if (!directoryStarted) {
        directoryStarted = true;
        DirectoryModule.init(directoryContent);
      }
    } else {
      directoryContent.style.display = 'none';
      officersContent.style.display = '';
      if (!officersStarted) {
        officersStarted = true;
        OfficersModule.setType(typeKey || '');
        OfficersModule.init(officersContent);
      } else {
        OfficersModule.setType(typeKey || '');
      }
    }
  }

  $all('.module-nav__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      activateTab(btn);
      showModule(btn.getAttribute('data-module'), btn.getAttribute('data-type'));
    });
  });

  showModule('directory');
});
