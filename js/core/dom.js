/**
 * dom.js
 * Tiny DOM helpers used across modules.
 */

function $(selector, scope) {
  return (scope || document).querySelector(selector);
}

function $all(selector, scope) {
  return Array.from((scope || document).querySelectorAll(selector));
}

function el(tag, attrs, children) {
  const node = document.createElement(tag);
  if (attrs) {
    Object.keys(attrs).forEach(function (key) {
      if (key === 'class') {
        node.className = attrs[key];
      } else if (key === 'html') {
        node.innerHTML = attrs[key];
      } else if (key.indexOf('on') === 0 && typeof attrs[key] === 'function') {
        node.addEventListener(key.slice(2).toLowerCase(), attrs[key]);
      } else {
        node.setAttribute(key, attrs[key]);
      }
    });
  }
  (children || []).forEach(function (child) {
    if (child) node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  });
  return node;
}

function debounce(fn, wait) {
  let timer = null;
  return function () {
    const args = arguments;
    const context = this;
    clearTimeout(timer);
    timer = setTimeout(function () {
      fn.apply(context, args);
    }, wait);
  };
}

/** Escapes text for safe insertion into innerHTML. */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}
