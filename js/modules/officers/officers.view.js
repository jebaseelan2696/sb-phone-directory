/**
 * officers.view.js
 * Renders officer cards. Handles both regular and vacant posts, and
 * displays whatever "context" fields the backend found for that role
 * (Unit/Wing, Sub Division, Police Station, ...) without needing to
 * know about them in advance.
 */

const OfficersView = (function () {
  function buildWhatsAppUrl(rawNumber) {
    const digits = (rawNumber || '').replace(/[^\d]/g, '');
    if (!digits) return null;
    const withCountry = digits.length === 10
      ? APP_CONFIG.WHATSAPP_COUNTRY_CODE + digits
      : digits;
    return 'https://wa.me/' + withCountry;
  }

  function phoneActionRow(label, number) {
    if (!number) return null;

    const callBtn = el('a', {
      class: 'icon-btn icon-btn--call',
      href: 'tel:' + number,
      title: 'Call ' + number,
      'aria-label': 'Call ' + number
    }, ['\u{1F4DE}']);

    const copyBtn = el('button', {
      class: 'icon-btn icon-btn--copy',
      type: 'button',
      title: 'Copy number',
      'aria-label': 'Copy ' + number,
      onClick: function (ev) {
        const btn = ev.currentTarget;
        navigator.clipboard.writeText(number).then(function () {
          UI.toast('Copied ' + number);
          btn.classList.add('is-copied');
          setTimeout(function () { btn.classList.remove('is-copied'); }, 1200);
        }).catch(function () {
          UI.toast('Could not copy number');
        });
      }
    }, ['\u{1F4CB}']);

    return el('div', { class: 'action-row' }, [
      el('span', { class: 'action-row__label' }, [label]),
      el('span', { class: 'action-row__number' }, [number]),
      callBtn,
      copyBtn
    ]);
  }

  function whatsappRow(rawNumber) {
    if (!rawNumber) return null;
    const url = buildWhatsAppUrl(rawNumber);
    if (!url) return null;

    return el('div', { class: 'action-row' }, [
      el('span', { class: 'action-row__label' }, ['WhatsApp']),
      el('span', { class: 'action-row__number' }, [rawNumber]),
      el('a', {
        class: 'icon-btn icon-btn--whatsapp',
        href: url,
        target: '_blank',
        rel: 'noopener',
        title: 'Open WhatsApp chat',
        'aria-label': 'Open WhatsApp chat with ' + rawNumber,
        html: WHATSAPP_ICON_SVG
      })
    ]);
  }

  function buildVCard(officer) {
    const savedName = officer.saveAs || officer.name;
    const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
    lines.push('N:;' + savedName + ';;;');
    lines.push('FN:' + savedName);

    const org = [APP_CONFIG.ORG_SUBTITLE, officer.typeLabel].filter(Boolean).join(';');
    if (org) lines.push('ORG:' + org);
    if (officer.rank) lines.push('TITLE:' + officer.rank);

    if (officer.cugNo) lines.push('TEL;TYPE=CELL:' + officer.cugNo);
    if (officer.addlNo1) lines.push('TEL;TYPE=CELL:' + officer.addlNo1);
    if (officer.addlNo2) lines.push('TEL;TYPE=CELL:' + officer.addlNo2);
    if (officer.email) lines.push('EMAIL:' + officer.email);

    lines.push('END:VCARD');
    return lines.join('\r\n');
  }

  function downloadContactsVCard(officers, fileName) {
    const combined = officers.map(buildVCard).join('\r\n');
    const blob = new Blob([combined], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = el('a', { href: url, download: fileName });
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function saveContactButton(officer) {
    const vcard = buildVCard(officer);
    const href = 'data:text/vcard;charset=utf-8,' + encodeURIComponent(vcard);
    const savedName = officer.saveAs || officer.name;
    const fileName = savedName.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_') + '.vcf';

    return el('a', {
      class: 'icon-btn icon-btn--save-contact',
      href: href,
      download: fileName,
      title: 'Save to Contacts',
      'aria-label': 'Save ' + officer.name + ' to Contacts'
    }, ['\u{1F4C7}']);
  }

  function card(officer) {
    const isVacant = (officer.postStatus || '').toLowerCase() === 'vacant';

    const metaChips = [
      officer.rank ? el('span', { class: 'chip chip--rank' }, [officer.rank]) : null,
      officer.mikeSignNo ? el('span', { class: 'chip' }, ['Mike Sign: ' + officer.mikeSignNo]) : null,
      isVacant ? el('span', { class: 'chip chip--vacant' }, ['VACANT']) : null
    ].filter(Boolean);

    const contextLines = (officer.context || []).map(function (c) {
      return el('div', { class: 'contact-card__posting' }, [
        el('span', { class: 'contact-card__posting-label' }, [c.label]),
        c.value
      ]);
    });

    let actionRows;
    if (isVacant) {
      actionRows = [
        officer.icOfficer ? el('div', { class: 'action-row' }, [
          el('span', { class: 'action-row__label' }, ['I/C Officer']),
          el('span', { class: 'action-row__number' }, [officer.icOfficer])
        ]) : null,
        phoneActionRow('I/C Contact', officer.icContactNo)
      ].filter(Boolean);
    } else {
      actionRows = [
        phoneActionRow('CUG No.', officer.cugNo),
        phoneActionRow('Mobile No. 1', officer.addlNo1),
        phoneActionRow('Mobile No. 2', officer.addlNo2),
        whatsappRow(officer.whatsappNo)
      ].filter(Boolean);
    }

    const children = [
      el('div', { class: 'contact-card__header' }, [
        el('div', { class: 'contact-card__name' }, [isVacant ? 'Vacant' : officer.name]),
        el('div', { class: 'contact-card__header-right' }, [
          el('div', { class: 'contact-card__id' }, [officer.id]),
          !isVacant ? saveContactButton(officer) : null
        ].filter(Boolean))
      ]),
      metaChips.length ? el('div', { class: 'contact-card__meta' }, metaChips) : null
    ].concat(contextLines).concat([
      actionRows.length ? el('div', { class: 'contact-card__actions' }, actionRows) : null,
      (!isVacant && officer.email) ? el('div', { class: 'contact-card__email' }, ['✉️ ' + officer.email]) : null
    ]).filter(Boolean);

    return el('div', { class: 'contact-card' + (isVacant ? ' contact-card--vacant' : '') }, children);
  }

  function sectionHeader(label) {
    return el('div', { class: 'section-header' }, [label]);
  }

  /** Finds the "Unit/Wing" context value for an officer, if present. */
  function groupingValue(officer) {
    const entry = (officer.context || []).find(function (c) { return c.label === 'Unit/Wing'; });
    return entry ? entry.value : null;
  }

  /**
   * Renders officers with a section header per Unit/Wing value, same
   * visual pattern as the SB Directory's Groupings feature — preserves
   * incoming order (already ID-sorted upstream) rather than alphabetizing.
   * Roles without a "Unit/Wing" context field (e.g. SHOs) just render as
   * a flat list, no grouping applied.
   */
  function renderList(container, officers) {
    container.innerHTML = '';
    const frag = document.createDocumentFragment();
    const groupable = officers.every(function (o) { return groupingValue(o) !== null; });
    let lastGroup = null;

    officers.forEach(function (o) {
      if (groupable) {
        const group = groupingValue(o);
        if (group !== lastGroup) {
          frag.appendChild(sectionHeader(group));
          lastGroup = group;
        }
      }
      frag.appendChild(card(o));
    });

    container.appendChild(frag);
  }

  return {
    renderList: renderList,
    downloadContactsVCard: downloadContactsVCard
  };
})();
