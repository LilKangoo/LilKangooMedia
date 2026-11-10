/* LilKangooMedia Phase 20.1: lightweight enquiries and mobile service CTA.
   Additive only: uses existing /api/enquiry, catalogue and pricing/booking flow. */
(() => {
  'use strict';
  const root = document.getElementById('main');
  if (!root) return;

  const escSlug = (hash) => {
    const match = String(hash || '').match(/^#\/service\/([^?#]+)/);
    if (!match) return '';
    try { return decodeURIComponent(match[1]); } catch { return match[1]; }
  };
  const activeServiceSlug = () => escSlug(location.hash);
  const track = (name, params = {}) => {
    try {
      if (localStorage.getItem('lkm_analytics_consent') === 'yes' && typeof window.gtag === 'function') {
        window.gtag('event', name, params);
      }
    } catch (_) { /* Analytics must never interrupt an enquiry. */ }
  };
  const button = (label, slug, cls = '') => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'lkm20-quick-trigger ' + cls;
    el.textContent = label;
    el.dataset.lkm20Slug = slug;
    return el;
  };

  let dialog = null;
  let turnstileId = null;
  let turnstileToken = '';
  let submitting = false;
  let currentSlug = '';

  function makeDialog() {
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'lkm20-quick-dialog';
    dialog.className = 'lkm20-dialog';
    dialog.setAttribute('aria-labelledby', 'lkm20-title');
    dialog.innerHTML = '<div class="lkm20-dialog-top">' +
      '<div><p class="lkm20-kicker">Quick enquiry</p><h2 id="lkm20-title">Ask about this service</h2></div>' +
      '<button type="button" class="lkm20-close" aria-label="Close enquiry" data-lkm20-close>×</button></div>' +
      '<p id="lkm20-service" class="lkm20-service"></p>' +
      '<form id="lkm20-quick-form">' +
      '<div class="lkm20-two"><label>Full name *<input name="name" autocomplete="name" required maxlength="100"></label>' +
      '<label>Email *<input name="email" type="email" autocomplete="email" required maxlength="200"></label></div>' +
      '<div class="lkm20-two"><label>Phone (optional)<input name="phone" type="tel" autocomplete="tel" maxlength="40"></label>' +
      '<label>Preferred date (optional)<input name="preferred_date" type="date"></label></div>' +
      '<label>What would you like to know? *<textarea name="message" rows="4" minlength="6" maxlength="3000" required placeholder="Tell us what you need, where and when..."></textarea></label>' +
      '<div class="lkm20-honeypot" aria-hidden="true"><label>Do not fill this field<input name="website" autocomplete="off" tabindex="-1"></label></div>' +
      '<label class="lkm20-consent"><input name="consent" type="checkbox" required> <span>I agree to be contacted about this enquiry. Read our <a href="/FAQ.html" target="_blank" rel="noopener">Privacy Policy</a>.</span></label>' +
      '<div id="lkm20-captcha"></div>' +
      '<button type="submit" class="button button-dark lkm20-submit">Send quick enquiry →</button>' +
      '<p class="lkm20-footnote">No payment or confirmed reservation is made with this enquiry.</p></form>' +
      '<p id="lkm20-status" role="status" aria-live="polite"></p>';
    document.body.append(dialog);
    dialog.querySelector('[data-lkm20-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.querySelector('form').addEventListener('submit', submitQuickEnquiry);
    return dialog;
  }

  function mountTurnstile() {
    const siteKey = String(window.LKM_CONFIG?.TURNSTILE_SITE_KEY || '').trim();
    if (!siteKey) return;
    const target = dialog.querySelector('#lkm20-captcha');
    if (turnstileId !== null && window.turnstile?.remove) {
      try { window.turnstile.remove(turnstileId); } catch (_) { /* ignore */ }
    }
    target.replaceChildren();
    turnstileId = null;
    turnstileToken = '';
    const render = () => {
      if (!dialog?.open || !window.turnstile) return;
      try {
        turnstileId = window.turnstile.render(target, {
          sitekey: siteKey,
          callback: (value) => { turnstileToken = value; },
          'expired-callback': () => { turnstileToken = ''; },
          'error-callback': () => { turnstileToken = ''; },
        });
      } catch (_) {
        dialog.querySelector('#lkm20-status').textContent = 'Verification could not load. Please try again or use the full contact form.';
      }
    };
    if (window.turnstile) return render();
    let script = document.querySelector('script[src*="challenges.cloudflare.com/turnstile/v0/api.js"]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      document.head.append(script);
    }
    script.addEventListener('load', render, {once: true});
    // Another form may have loaded the script just before the listener was attached.
    if (window.turnstile) render();
  }

  function openQuickEnquiry(slug, title) {
    const node = makeDialog();
    currentSlug = slug || '';
    node.querySelector('#lkm20-service').textContent = title || 'General project enquiry';
    node.querySelector('form').hidden = false;
    node.querySelector('form').reset();
    node.querySelector('#lkm20-status').textContent = '';
    node.querySelector('.lkm20-submit').disabled = false;
    node.querySelector('.lkm20-submit').textContent = 'Send quick enquiry →';
    node.querySelector('#lkm20-captcha').replaceChildren();
    node.showModal();
    mountTurnstile();
    node.querySelector('[name="name"]').focus();
    track('lkm_quick_enquiry_open', {service_id: currentSlug});
  }

  async function submitQuickEnquiry(event) {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const status = dialog.querySelector('#lkm20-status');
    const siteKey = String(window.LKM_CONFIG?.TURNSTILE_SITE_KEY || '').trim();
    if (siteKey && !turnstileToken) {
      status.textContent = 'Please complete the anti-spam verification.';
      return;
    }
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.service_slug = currentSlug;
    payload.type = 'quick_enquiry';
    payload.turnstile_token = turnstileToken;
    const send = dialog.querySelector('.lkm20-submit');
    submitting = true;
    send.disabled = true;
    send.textContent = 'Sending…';
    status.textContent = '';
    try {
      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        if (result.saved === true) {
          form.hidden = true;
          status.textContent = 'Your enquiry was saved, but the email notification failed. Please email photo@lilkangoomedia.com to confirm.';
          track('generate_lead', {lead_type: 'quick_enquiry', service_id: currentSlug});
          return;
        }
        throw new Error(result.error || 'Could not send your enquiry.');
      }
      form.hidden = true;
      status.textContent = 'Thank you! Your enquiry has been received. We will reply by email.';
      track('generate_lead', {lead_type: 'quick_enquiry', service_id: currentSlug});
    } catch (error) {
      status.textContent = (error?.message || 'Could not send your enquiry.') + ' You can also email photo@lilkangoomedia.com.';
      if (turnstileId !== null && window.turnstile) {
        try { window.turnstile.reset(turnstileId); } catch (_) { /* ignore */ }
      }
      turnstileToken = '';
      send.disabled = false;
      send.textContent = 'Try again →';
    } finally { submitting = false; }
  }

  const sticky = document.createElement('div');
  sticky.id = 'lkm20-sticky';
  sticky.setAttribute('aria-label', 'Service actions');
  sticky.innerHTML = '<a class="lkm20-sticky-primary" href="#/quote">Configure package →</a>' +
    '<button class="lkm20-sticky-secondary" type="button">Ask a question</button>';
  document.body.append(sticky);

  function enhance() {
    root.querySelectorAll('.service-card').forEach((card) => {
      if (card.querySelector('[data-lkm20-slug]')) return;
      const href = card.querySelector('.service-photo')?.getAttribute('href') || '';
      const slug = escSlug(href);
      const body = card.querySelector('.service-body');
      if (!slug || !body) return;
      const ask = button('Quick enquiry ↗', slug, 'lkm20-card-ask');
      ask.dataset.lkm20Title = card.querySelector('h3')?.textContent || 'Service enquiry';
      body.append(ask);
    });
    const slug = activeServiceSlug();
    const booking = root.querySelector('.lkm-v14-booking-action');
    if (slug && booking && !booking.querySelector('[data-lkm20-slug]')) {
      const ask = button('Have a question? Send a quick enquiry', slug, 'lkm20-detail-ask');
      ask.dataset.lkm20Title = root.querySelector('.lkm-v14-title')?.textContent || 'Service enquiry';
      booking.append(ask);
    }
    const isDetail = Boolean(slug && (root.querySelector('.lkm-v14') || root.querySelector('.detail-grid')));
    sticky.hidden = !isDetail;
    document.body.classList.toggle('lkm20-has-sticky', isDetail);
    if (isDetail) sticky.querySelector('.lkm20-sticky-secondary').dataset.lkm20Slug = slug;
  }

  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; enhance(); });
  }
  const observer = new MutationObserver(schedule);
  observer.observe(root, {childList: true, subtree: true});
  window.addEventListener('hashchange', schedule);
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-lkm20-slug]');
    if (!trigger) return;
    event.preventDefault();
    const title = trigger.dataset.lkm20Title || root.querySelector('.lkm-v14-title')?.textContent || 'Service enquiry';
    openQuickEnquiry(trigger.dataset.lkm20Slug, title);
  });
  schedule();
})();
