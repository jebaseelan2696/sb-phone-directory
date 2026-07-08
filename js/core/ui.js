/**
 * ui.js
 * Shared UI feedback components: loader, toast, empty/error state panels.
 */

const UI = (function () {
  let toastTimer = null;

  function toast(message) {
    let node = $('.toast');
    if (!node) {
      node = el('div', { class: 'toast', role: 'status' });
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      node.classList.remove('is-visible');
    }, 1800);
  }

  function loader() {
    return el('div', { class: 'loader' }, [
      el('div', { class: 'loader__spinner' }),
      el('p', {}, ['Loading directory...'])
    ]);
  }

  function emptyState(message) {
    return el('div', { class: 'state-panel' }, [
      el('div', { class: 'state-panel__icon' }, ['\u{1F50D}']),
      el('div', { class: 'state-panel__title' }, ['No results found']),
      el('p', {}, [message || 'Try a different search term or clear the filters.'])
    ]);
  }

  function errorState(message, onRetry) {
    const retryBtn = el('button', { class: 'state-panel__retry', onClick: onRetry }, ['Try again']);
    return el('div', { class: 'state-panel' }, [
      el('div', { class: 'state-panel__icon' }, ['⚠️']),
      el('div', { class: 'state-panel__title' }, ['Unable to load directory']),
      el('p', {}, [message || 'Please check your internet connection.']),
      retryBtn
    ]);
  }

  return { toast, loader, emptyState, errorState };
})();
