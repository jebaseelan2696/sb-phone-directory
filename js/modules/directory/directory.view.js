/**
 * directory.view.js
 * Pure rendering: contact data -> card DOM. Every field is only rendered
 * if it has a value — no blank labels or empty rows are ever produced.
 */

const DirectoryView = (function () {
  function buildWhatsAppUrl(rawNumber) {
    const digits = (rawNumber || '').replace(/[^\d]/g, '');
    if (!digits) return null;
    // If already looks like it includes a country code (11+ digits with
    // leading country prefix), use as-is; otherwise prepend the default.
    const withCountry = digits.length === 10
      ? APP_CONFIG.WHATSAPP_COUNTRY_CODE + digits
      : digits;
    return 'https://wa.me/' + withCountry;
  }

  function phoneActionRow(label, number) {
    if (!number) return null;

    const numberSpan = el('span', { class: 'action-row__number' }, [number]);

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
      numberSpan,
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
        'aria-label': 'Open WhatsApp chat with ' + rawNumber
      }, ['\u{1F4AC}'])
    ]);
  }

  function card(contact) {
    const metaChips = [
      contact.rank ? el('span', { class: 'chip chip--rank' }, [contact.rank]) : null,
      contact.generalNo ? el('span', { class: 'chip' }, ['Gen. No: ' + contact.generalNo]) : null,
      contact.category ? el('span', { class: 'chip chip--category' }, [contact.category]) : null
    ].filter(Boolean);

    const actionRows = [
      phoneActionRow('CUG', contact.cugNo),
      phoneActionRow('Addl. I', contact.addlNo1),
      phoneActionRow('Addl. II', contact.addlNo2),
      whatsappRow(contact.whatsappNo)
    ].filter(Boolean);

    const children = [
      el('div', { class: 'contact-card__header' }, [
        el('div', { class: 'contact-card__name' }, [contact.name]),
        el('div', { class: 'contact-card__id' }, [contact.id])
      ]),
      metaChips.length ? el('div', { class: 'contact-card__meta' }, metaChips) : null,
      contact.posting ? el('div', { class: 'contact-card__posting' }, [
        el('span', { class: 'contact-card__posting-label' }, ['Nature of Duty / Posting']),
        contact.posting
      ]) : null,
      actionRows.length ? el('div', { class: 'contact-card__actions' }, actionRows) : null,
      contact.email ? el('div', { class: 'contact-card__email' }, ['✉️ ' + contact.email]) : null
    ].filter(Boolean);

    return el('div', { class: 'contact-card' }, children);
  }

  function sectionHeader(label) {
    return el('div', { class: 'section-header' }, [label]);
  }

  /**
   * Renders contacts grouped into sections by the "Groupings" field,
   * preserving the incoming order (already ID-sorted upstream) rather
   * than alphabetizing — so sections appear in whatever sequence the
   * ID numbering scheme implies.
   */
  function renderGroupedList(container, contacts) {
    container.innerHTML = '';
    const frag = document.createDocumentFragment();
    let lastGroup = null;

    contacts.forEach(function (c) {
      const group = c.grouping || 'Unassigned';
      if (group !== lastGroup) {
        frag.appendChild(sectionHeader(group));
        lastGroup = group;
      }
      frag.appendChild(card(c));
    });

    container.appendChild(frag);
  }

  return { renderGroupedList: renderGroupedList };
})();
