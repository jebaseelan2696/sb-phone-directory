/**
 * theme.js
 * Dark/light mode toggle, persisted in localStorage. Falls back to the
 * OS-level prefers-color-scheme when the user hasn't chosen explicitly.
 */

const Theme = (function () {
  const STORAGE_KEY = 'sb_directory_theme';

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  function getStored() {
    return localStorage.getItem(STORAGE_KEY);
  }

  function getSystemPreference() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function init() {
    const stored = getStored();
    apply(stored || getSystemPreference());
  }

  function toggle() {
    const current = document.documentElement.getAttribute('data-theme') || getSystemPreference();
    const next = current === 'dark' ? 'light' : 'dark';
    apply(next);
    localStorage.setItem(STORAGE_KEY, next);
    return next;
  }

  function current() {
    return document.documentElement.getAttribute('data-theme') || getSystemPreference();
  }

  return { init, toggle, current };
})();
