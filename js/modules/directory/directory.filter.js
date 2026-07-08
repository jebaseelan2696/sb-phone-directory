/**
 * directory.filter.js
 * Client-side search + filter logic over the in-memory contacts array.
 * Search covers Name and Nature of Duty/Posting only (per spec),
 * case-insensitive, partial match. Filters (Rank/Category/Posting)
 * narrow the same list and combine with search via AND logic.
 */

const DirectoryFilter = (function () {
  function normalize(str) {
    return (str || '').toString().toLowerCase();
  }

  /**
   * Returns the distinct, sorted list of postings actually present in
   * the data — used to populate the Posting filter dynamically, since
   * postings mix HQ duties and PS names and have no fixed lookup list.
   */
  function distinctPostings(contacts) {
    const set = new Set();
    contacts.forEach(function (c) {
      if (c.posting) set.add(c.posting);
    });
    return Array.from(set).sort(function (a, b) {
      return a.localeCompare(b);
    });
  }

  function apply(contacts, criteria) {
    const query = normalize(criteria.query).trim();
    const rank = criteria.rank || '';
    const category = criteria.category || '';
    const posting = criteria.posting || '';

    return contacts.filter(function (c) {
      if (rank && c.rank !== rank) return false;
      if (category && c.category !== category) return false;
      if (posting && c.posting !== posting) return false;

      if (query) {
        const name = normalize(c.name);
        const posting2 = normalize(c.posting);
        if (name.indexOf(query) === -1 && posting2.indexOf(query) === -1) {
          return false;
        }
      }

      return true;
    });
  }

  return { apply: apply, distinctPostings: distinctPostings };
})();
