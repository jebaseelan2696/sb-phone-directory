/**
 * officers.js
 * Officers module controller. Which role (ADSsP, SDPOs, SHOs, Ministerial
 * Stfs) is shown is driven from the outside via setType() — the top-level
 * header nav owns the tab buttons, this module just filters to match.
 */

const OfficersModule = (function () {
  let allOfficers = [];
  let criteria = { query: '', type: '', rank: '' };
  let lastFiltered = [];
  let els = {};
  let ready = false;
  let pendingType = '';

  function buildShell(root) {
    root.innerHTML = '';

    const searchBar = el('div', { class: 'search-bar' }, [
      el('span', { class: 'search-bar__icon' }, ['\u{1F50D}']),
      el('input', {
        type: 'search',
        placeholder: 'Search by name, rank, or station...',
        'aria-label': 'Search officers',
        id: 'officers-search-input'
      }),
      el('button', { class: 'search-bar__clear', id: 'officers-search-clear', type: 'button', title: 'Clear search' }, ['✕'])
    ]);

    const filterBar = el('div', { class: 'filter-bar' }, [
      el('select', { id: 'officers-filter-rank' }, [el('option', { value: '' }, ['All Ranks'])]),
      el('button', { class: 'filter-bar__reset', id: 'officers-filter-reset', type: 'button' }, ['Reset'])
    ]);

    const summaryBar = el('div', { class: 'summary-bar' }, [
      el('div', { class: 'result-summary', id: 'officers-result-summary' }),
      el('button', { class: 'save-all-btn', id: 'officers-save-all-btn', type: 'button' }, ['\u{1F4C7} Save All to Contacts'])
    ]);

    const grid = el('div', { class: 'card-grid', id: 'officers-card-grid' });

    root.appendChild(searchBar);
    root.appendChild(filterBar);
    root.appendChild(summaryBar);
    root.appendChild(grid);

    els = {
      searchInput: $('#officers-search-input', root),
      searchClear: $('#officers-search-clear', root),
      filterRank: $('#officers-filter-rank', root),
      filterReset: $('#officers-filter-reset', root),
      summary: $('#officers-result-summary', root),
      saveAllBtn: $('#officers-save-all-btn', root),
      grid: $('#officers-card-grid', root)
    };
  }

  function populateSelect(select, values, currentValue) {
    while (select.options.length > 1) select.remove(1);
    values.forEach(function (v) {
      select.appendChild(el('option', { value: v }, [v]));
    });
    select.value = currentValue || '';
  }

  function refreshFilterOptions() {
    const scoped = criteria.type
      ? allOfficers.filter(function (o) { return o.typeKey === criteria.type; })
      : allOfficers;
    populateSelect(els.filterRank, OfficersFilter.distinctRanks(scoped), criteria.rank);
  }

  function updateResetVisibility() {
    const hasAny = criteria.query || criteria.rank;
    els.filterReset.classList.toggle('is-visible', !!hasAny);
    els.searchClear.classList.toggle('is-visible', !!criteria.query);
  }

  function render() {
    const filtered = OfficersFilter.apply(allOfficers, criteria);
    lastFiltered = filtered;

    els.summary.textContent = filtered.length === allOfficers.length
      ? filtered.length + ' officers'
      : filtered.length + ' officers';

    if (filtered.length === 0) {
      els.grid.innerHTML = '';
      els.grid.appendChild(UI.emptyState(
        criteria.type ? 'No entries found for this role yet.' : undefined
      ));
    } else {
      OfficersView.renderList(els.grid, filtered);
    }

    els.saveAllBtn.disabled = filtered.length === 0;
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

    els.filterReset.addEventListener('click', function () {
      criteria.query = '';
      criteria.rank = '';
      els.searchInput.value = '';
      els.filterRank.value = '';
      render();
    });

    els.saveAllBtn.addEventListener('click', function () {
      if (!lastFiltered.length) return;
      OfficersView.downloadContactsVCard(lastFiltered, 'SB_Officers_Contacts.vcf');
      UI.toast('Saved ' + lastFiltered.length + ' contacts');
    });
  }

  function showLoading(root) {
    root.innerHTML = '';
    root.appendChild(UI.loader('Loading officers...'));
  }

  function showError(root, message) {
    root.innerHTML = '';
    root.appendChild(UI.errorState(message, function () { init(root, { forceRefresh: true }); }));
  }

  function loadData(forceRefresh) {
    if (!forceRefresh) {
      const cached = OfficersStore.read();
      if (cached) return Promise.resolve(cached);
    }
    return Api.getOfficers().then(function (data) {
      OfficersStore.write(data);
      return data;
    });
  }

  let rootRef = null;

  function init(root, options) {
    rootRef = root;
    showLoading(root);

    loadData(options && options.forceRefresh)
      .then(function (data) {
        allOfficers = data.contacts || [];

        buildShell(root);
        criteria.type = pendingType;
        refreshFilterOptions();
        wireEvents();
        render();
        ready = true;
      })
      .catch(function (err) {
        showError(root, err && err.message);
      });
  }

  /** Called by the header nav to switch which role is shown. */
  function setType(typeKey) {
    pendingType = typeKey;
    if (!ready) return; // init() will pick up pendingType once loaded
    criteria.type = typeKey;
    criteria.query = '';
    criteria.rank = '';
    if (els.searchInput) els.searchInput.value = '';
    refreshFilterOptions();
    render();
  }

  return { init: init, setType: setType };
})();
