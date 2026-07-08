/**
 * directory.js
 * Directory module controller. Owns its own DOM subtree inside
 * #app-content, fetches/caches data, and wires up search + filters.
 */

const DirectoryModule = (function () {
  let allContacts = [];
  let lookups = { ranks: [], categories: [] };
  let criteria = { query: '', rank: '', category: '', posting: '' };

  let els = {};

  function buildShell(root) {
    root.innerHTML = '';

    const searchBar = el('div', { class: 'search-bar' }, [
      el('span', { class: 'search-bar__icon' }, ['\u{1F50D}']),
      el('input', {
        type: 'search',
        placeholder: 'Search by name or duty / posting...',
        'aria-label': 'Search directory',
        id: 'search-input'
      }),
      el('button', { class: 'search-bar__clear', id: 'search-clear', type: 'button', title: 'Clear search' }, ['✕'])
    ]);

    const filterBar = el('div', { class: 'filter-bar' }, [
      el('select', { id: 'filter-rank' }, [el('option', { value: '' }, ['All Ranks'])]),
      el('select', { id: 'filter-category' }, [el('option', { value: '' }, ['All Categories'])]),
      el('select', { id: 'filter-posting' }, [el('option', { value: '' }, ['All Postings'])]),
      el('button', { class: 'filter-bar__reset', id: 'filter-reset', type: 'button' }, ['Reset'])
    ]);

    const summary = el('div', { class: 'result-summary', id: 'result-summary' });
    const grid = el('div', { class: 'card-grid', id: 'card-grid' });

    root.appendChild(searchBar);
    root.appendChild(filterBar);
    root.appendChild(summary);
    root.appendChild(grid);

    els = {
      searchInput: $('#search-input', root),
      searchClear: $('#search-clear', root),
      filterRank: $('#filter-rank', root),
      filterCategory: $('#filter-category', root),
      filterPosting: $('#filter-posting', root),
      filterReset: $('#filter-reset', root),
      summary: $('#result-summary', root),
      grid: $('#card-grid', root)
    };
  }

  function populateSelect(select, values, currentValue) {
    // Keep the first "All ..." option, replace the rest.
    while (select.options.length > 1) select.remove(1);
    values.forEach(function (v) {
      select.appendChild(el('option', { value: v }, [v]));
    });
    select.value = currentValue || '';
  }

  function refreshFilterOptions() {
    populateSelect(els.filterRank, lookups.ranks, criteria.rank);
    populateSelect(els.filterCategory, lookups.categories, criteria.category);
    populateSelect(els.filterPosting, DirectoryFilter.distinctPostings(allContacts), criteria.posting);
  }

  function updateResetVisibility() {
    const hasAny = criteria.query || criteria.rank || criteria.category || criteria.posting;
    els.filterReset.classList.toggle('is-visible', !!hasAny);
    els.searchClear.classList.toggle('is-visible', !!criteria.query);
  }

  function render() {
    const filtered = DirectoryFilter.apply(allContacts, criteria);

    els.summary.textContent = filtered.length === allContacts.length
      ? filtered.length + ' personnel'
      : 'Showing ' + filtered.length + ' of ' + allContacts.length + ' personnel';

    if (filtered.length === 0) {
      els.grid.innerHTML = '';
      els.grid.appendChild(UI.emptyState());
    } else {
      DirectoryView.renderGroupedList(els.grid, filtered);
    }

    updateResetVisibility();
  }

  function wireEvents() {
    els.searchInput.addEventListener('input', debounce(function () {
      criteria.query = els.searchInput.value;
      render();
    }, 120));

    els.searchClear.addEventListener('click', function () {
      els.searchInput.value = '';
      criteria.query = '';
      render();
      els.searchInput.focus();
    });

    els.filterRank.addEventListener('change', function () {
      criteria.rank = els.filterRank.value;
      render();
    });

    els.filterCategory.addEventListener('change', function () {
      criteria.category = els.filterCategory.value;
      render();
    });

    els.filterPosting.addEventListener('change', function () {
      criteria.posting = els.filterPosting.value;
      render();
    });

    els.filterReset.addEventListener('click', function () {
      criteria = { query: '', rank: '', category: '', posting: '' };
      els.searchInput.value = '';
      els.filterRank.value = '';
      els.filterCategory.value = '';
      els.filterPosting.value = '';
      render();
    });
  }

  function showLoading(root) {
    root.innerHTML = '';
    root.appendChild(UI.loader());
  }

  function showError(root, message) {
    root.innerHTML = '';
    root.appendChild(UI.errorState(message, function () { init(root, { forceRefresh: true }); }));
  }

  function loadData(forceRefresh) {
    if (!forceRefresh) {
      const cached = Store.read();
      if (cached) return Promise.resolve(cached);
    }
    return Api.getDirectory().then(function (data) {
      Store.write(data);
      return data;
    });
  }

  function init(root, options) {
    showLoading(root);

    loadData(options && options.forceRefresh)
      .then(function (data) {
        allContacts = data.contacts || [];
        lookups = data.lookups || { ranks: [], categories: [] };

        buildShell(root);
        refreshFilterOptions();
        wireEvents();
        render();
      })
      .catch(function (err) {
        showError(root, err && err.message);
      });
  }

  return { init: init };
})();
