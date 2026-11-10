/* LilKangooMedia Phase 21.1 — booking request preferences.
   This is NOT a live availability calendar and takes NO payment.
   Works on top of Phase 20.1–20.5 without a new Supabase migration. */
(() => {
  'use strict';
  if (window.__lkmPhase211Loaded) return;
  window.__lkmPhase211Loaded = true;
  const root = document.getElementById('main');
  if (!root) return;

  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  function todayCyprus() {
    try {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Nicosia', year:'numeric', month:'2-digit', day:'2-digit'
      }).formatToParts(new Date());
      const part = name => parts.find(x => x.type === name)?.value || '';
      return `${part('year')}-${part('month')}-${part('day')}`;
    } catch (_) {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  }
  const FIELD_TIME = 'booking_time';
  const FIELD_ALT = 'booking_alternative_date';
  const FIELD_LOCATION = 'booking_location';
  const timeLabels = {
    flexible: 'Flexible — any time', morning: 'Morning (08:00–12:00)',
    afternoon: 'Afternoon (12:00–17:00)', evening: 'Evening (17:00–22:00)'
  };

  function field(labelText, input, hint) {
    const wrapper = make('div','field lkm21-field');
    const label = make('label', '', labelText);
    label.htmlFor = input.id;
    wrapper.append(label, input);
    if (hint) wrapper.append(make('small','lkm21-field-hint',hint));
    return wrapper;
  }
  function enhanceRequest() {
    if (!/^#\/request(?:[?]|$)/.test(location.hash)) return;
    const form = root.querySelector('#bookingForm');
    if (!form || form.querySelector('#lkm21-preferences')) return;
    const date = form.querySelector('#requestDate');
    const dateField = date?.closest('.field');
    if (!dateField) return;
    date.min = todayCyprus();
    const group = make('section','lkm21-preferences');
    group.id = 'lkm21-preferences';
    group.setAttribute('aria-labelledby','lkm21-preferences-title');
    group.append(make('h3','', 'When and where?'));
    group.append(make('p','lkm21-subtitle','Share your preferred time and location. We will confirm availability and any travel costs before booking.'));

    const grid = make('div','lkm21-preference-grid');
    const time = make('select');time.id='lkm21-time';time.name=FIELD_TIME;
    Object.entries(timeLabels).forEach(([value,title]) => {
      const option=make('option','',title);option.value=value;time.append(option);
    });
    const alt = make('input');alt.type='date';alt.id='lkm21-alternative-date';alt.name=FIELD_ALT;alt.min=todayCyprus();
    const loc = make('input');loc.type='text';loc.id='lkm21-location';loc.name=FIELD_LOCATION;
    loc.maxLength=160;loc.autocomplete='off';loc.placeholder='e.g. Larnaca, hotel, venue or online';
    grid.append(field('Preferred time',time),field('Alternative date (optional)',alt,'A second possible date helps us find a suitable slot.'));
    group.append(grid,field('Location / area (optional)',loc,'We work across Cyprus. You can give the exact address later.'));
    dateField.after(group);

    const note = make('p','lkm21-booking-notice','Your enquiry is not a confirmed reservation. We will reply with the available options and final quote.');
    group.after(note);
    const summary = make('section','lkm21-booking-summary');
    summary.id='lkm21-booking-summary';
    summary.setAttribute('aria-label','Requested booking preferences');
    summary.append(make('h4','', 'Your preferred schedule'));
    const content=make('p','lkm21-booking-summary-text');summary.append(content);
    const aside = root.querySelector('.form-grid > aside');
    if (aside) aside.append(summary);

    const refresh=()=>{
      const entries=[
        date.value ? `Date: ${date.value}` : 'Date: flexible / to discuss',
        `Time: ${timeLabels[time.value] || timeLabels.flexible}`,
      ];
      if (alt.value) entries.push(`Alternative: ${alt.value}`);
      if (loc.value.trim()) entries.push(`Location: ${loc.value.trim()}`);
      content.replaceChildren();
      entries.forEach(text=>content.append(make('span','',text)));
      alt.min=todayCyprus();
      if (alt.value && date.value && alt.value===date.value) alt.setCustomValidity('Choose another date or leave this field empty.');
      else alt.setCustomValidity('');
    };
    [date,time,alt,loc].forEach(input=>{
      input.addEventListener('input',refresh);
      input.addEventListener('change',refresh);
    });
    refresh();
  }
  function protectCheckout() {
    if (!/^#\/request(?:[?]|$)/.test(location.hash)) return;
    // This Netlify site does not yet ship a verified /api/checkout + webhook pair.
    // Keep the functioning enquiry journey and avoid a broken payment CTA.
    const pay = root.querySelector('#checkoutButton');
    if (!pay || pay.dataset.lkm21Disabled) return;
    pay.dataset.lkm21Disabled = 'true';
    pay.disabled = true;
    pay.hidden = true;
    pay.style.display = 'none';
  }
  // Defense in depth: intercept any pre-existing legacy checkout click even if a
  // click occurs before the SPA enhancement has hidden its button.
  document.addEventListener('click', event => {
    if (!event.target?.closest?.('#checkoutButton')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    protectCheckout();
  }, true);
  let queued=false;
  function schedule() {
    if (queued) return;queued=true;
    requestAnimationFrame(()=>{queued=false;enhanceRequest();protectCheckout();});
  }
  // The SPA swaps the direct children of #main when navigating.
  new MutationObserver(schedule).observe(root,{childList:true});
  window.addEventListener('hashchange',schedule);
  schedule();
})();
