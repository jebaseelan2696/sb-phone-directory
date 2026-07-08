/**
 * directory.view.js
 * Pure rendering: contact data -> card DOM. Every field is only rendered
 * if it has a value — no blank labels or empty rows are ever produced.
 */

const WHATSAPP_ICON_SVG = '<svg viewBox="0 0 32 32" width="18" height="18" fill="currentColor" aria-hidden="true">'
  + '<path d="M16.004 3C9.376 3 4 8.373 4 15c0 2.386.702 4.61 1.912 6.475L4 29l7.72-1.86A11.94 11.94 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3zm0 21.75a9.7 9.7 0 0 1-4.95-1.354l-.355-.21-4.583 1.104 1.127-4.463-.232-.365A9.69 9.69 0 0 1 5.25 15c0-5.93 4.822-10.75 10.754-10.75S26.75 9.07 26.75 15 21.936 24.75 16.004 24.75z"/>'
  + '<path d="M21.61 17.61c-.303-.152-1.792-.884-2.07-.985-.278-.101-.48-.152-.682.152-.202.303-.782.985-.959 1.187-.177.202-.354.227-.657.076-.303-.152-1.28-.472-2.438-1.505-.901-.804-1.51-1.797-1.687-2.1-.177-.303-.019-.467.133-.618.136-.136.303-.354.455-.53.152-.177.202-.303.303-.505.101-.202.05-.379-.025-.53-.076-.152-.682-1.646-.935-2.253-.246-.591-.497-.511-.682-.52l-.581-.01a1.115 1.115 0 0 0-.808.379c-.278.303-1.06 1.036-1.06 2.53s1.085 2.936 1.237 3.14c.152.202 2.135 3.26 5.173 4.57.723.312 1.286.499 1.727.638.725.23 1.385.198 1.907.12.582-.087 1.792-.733 2.045-1.44.253-.708.253-1.314.177-1.44-.076-.126-.278-.202-.581-.354z"/>'
  + '</svg>';

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
        'aria-label': 'Open WhatsApp chat with ' + rawNumber,
        html: WHATSAPP_ICON_SVG
      })
    ]);
  }

  function card(contact) {
    const metaChips = [
      contact.rank ? el('span', { class: 'chip chip--rank' }, [contact.rank]) : null,
      contact.generalNo ? el('span', { class: 'chip' }, ['Gen. No: ' + contact.generalNo]) : null,
      contact.category ? el('span', { class: 'chip chip--category' }, [contact.category]) : null
    ].filter(Boolean);

    const actionRows = [
      phoneActionRow('CUG No.', contact.cugNo),
      phoneActionRow('Mobile No. 1', contact.addlNo1),
      phoneActionRow('Mobile No. 2', contact.addlNo2),
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
