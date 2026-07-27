/**
 * officers.filter.js
 * Search + filter logic for officers: search by Name and Rank, filter
 * by Type (ADSsP/SDPOs/...), Rank, and Post Status.
 */

const OfficersFilter = (function () {
  function normalize(str) {
    return (str || '').toString().toLowerCase();
  }

  function distinctRanks(officers) {
    const set = new Set();
    officers.forEach(function (o) { if (o.rank) set.add(o.rank); });
    return Array.from(set).sort(function (a, b) { return a.localeCompare(b); });
  }

  function apply(officers, criteria) {
    const query = normalize(criteria.query).trim();
    const type = criteria.type || '';
    const rank = criteria.rank || '';

    return officers.filter(function (o) {
      if (type && o.typeKey !== type) return false;
      if (rank && o.rank !== rank) return false;

      if (query) {
        const name = normalize(o.name);
        const rankText = normalize(o.rank);
        if (name.indexOf(query) === -1 && rankText.indexOf(query) === -1) {
          return false;
        }
      }

      return true;
    });
  }

  return { apply: apply, distinctRanks: distinctRanks };
})();
