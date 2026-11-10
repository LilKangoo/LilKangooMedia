/* LilKangooMedia Phase 20.4 — stable submission IDs on all existing forms.
 * Minimal enhancement: no new tables, no changes to pricing or checkout.
 * The endpoint uses request_id as the primary key of contact_leads; retrying
 * the same form after an uncertain network result cannot insert it twice.
 */
(() => {
  'use strict';
  const supported = new Set(['bookingForm', 'contactForm', 'lkm20-quick-form']);
  const validId = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  function newId() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    if (!globalThis.crypto?.getRandomValues) return '';
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const s = [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
    return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20)}`;
  }
  function ensureId(form) {
    let field = form.querySelector('input[name="request_id"]');
    if (field && validId.test(field.value)) return;
    const id = newId();
    if (!id) return; // Older/insecure browsers still submit using existing flow.
    if (!field) {
      field = document.createElement('input');
      field.type = 'hidden';
      field.name = 'request_id';
      form.append(field);
    }
    field.value = id;
  }
  // Capture before the handlers in site.js and Phase 20.1 read FormData(form).
  document.addEventListener('submit', event => {
    const form = event.target;
    if (!form || !supported.has(form.id)) return;
    if (typeof form.reportValidity === 'function' && !form.reportValidity()) return;
    ensureId(form);
  }, true);
  // An edited enquiry is a NEW request. Keep the existing id only when the
  // client retries the unchanged form after a network failure.
  function clearOnEdit(event) {
    const field = event.target;
    if (field?.name === 'request_id') return;
    const form = field?.form || field?.closest?.('form');
    if (form && supported.has(form.id)) {
      form.querySelector('input[name="request_id"]')?.remove();
    }
  }
  document.addEventListener('input', clearOnEdit, true);
  document.addEventListener('change', clearOnEdit, true);
  // Quick Enquiry reuses the same <form> instance. A NEW dialog opening is
  // a NEW enquiry, so do not reuse the identifier from the preceding visit.
  document.addEventListener('click', event => {
    if (!event.target?.closest?.('[data-lkm20-slug]')) return;
    document.querySelector('#lkm20-quick-form input[name="request_id"]')?.remove();
  }, true);
})();
