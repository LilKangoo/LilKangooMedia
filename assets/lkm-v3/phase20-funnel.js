/* LilKangooMedia Phase 20.2 — consent-aware GA4 sales funnel measurement.
   Additive instrumentation. Never sends names, emails, phone numbers, message text,
   URL query strings or payment details. Does not record conversions itself:
   existing successful enquiry handlers already emit generate_lead. */
(() => {
  'use strict';
  if (window.__LKMPhase20FunnelLoaded) return;
  window.__LKMPhase20FunnelLoaded = true;

  const allowedSlug = value => String(value || '').slice(0, 120).replace(/[^a-zA-Z0-9_-]/g, '');
  const slugFromHref = href => {
    const m = String(href || '').match(/#\/service\/([^?#]+)/);
    if (!m) return '';
    try { return allowedSlug(decodeURIComponent(m[1])); } catch (_) { return ''; }
  };
  const currentSlug = () => {
    const fromHash = slugFromHref(location.hash);
    if (fromHash) return fromHash;
    try { return allowedSlug(sessionStorage.getItem('lkm_selected_service')); }
    catch (_) { return ''; }
  };
  const consentGranted = () => {
    try { return localStorage.getItem('lkm_analytics_consent') === 'yes'; }
    catch (_) { return false; }
  };
  const emit = (event, params) => {
    // Existing site.js initializes gtag after consent; don't load GA or create IDs here.
    if (!consentGranted() || typeof window.gtag !== 'function') return;
    try { window.gtag('event', event, params); }
    catch (_) { /* Analytics must never block users. */ }
  };
  let lastQuickSlug = '';
  const serviceFrom = target => {
    if (target.closest('#lkm20-quick-form')) return lastQuickSlug;
    const trigger = target.closest('[data-lkm20-slug]');
    if (trigger) return allowedSlug(trigger.dataset.lkm20Slug);
    const card = target.closest('.service-card');
    if (card) return slugFromHref(card.querySelector('.service-photo[href]')?.getAttribute('href'));
    return currentSlug();
  };
  const common = (slug) => slug ? {service_id: slug} : {service_id: 'general'};
  const typeFromForm = form => ({
    bookingForm: 'service_enquiry',
    contactForm: 'contact_enquiry',
    'lkm20-quick-form': 'quick_enquiry',
  })[form?.id] || '';
  const isInput = element => element?.matches?.('input:not([type="hidden"]):not([type="checkbox"]),select,textarea');
  const firstFocus = new WeakSet();
  const lastInvalid = new WeakMap();

  // Clicks — classify only actual actionable controls; don't infer a completed purchase.
  document.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const target = event.target;
    const slug = serviceFrom(target);

    const quick = target.closest('[data-lkm20-slug]');
    if (quick) {
      lastQuickSlug = allowedSlug(quick.dataset.lkm20Slug);
      emit('lkm_cta_click', {...common(slug), action_type: 'quick_enquiry', placement:
        quick.closest('.service-card') ? 'service_card' : quick.closest('#lkm20-sticky') ? 'mobile_sticky' : 'service_detail'});
      return; // Phase 20.1 separately tracks opening the modal.
    }

    const serviceLink = target.closest('.service-card .service-photo[href],.service-card .small-arrow[href]');
    if (serviceLink) {
      const id = slugFromHref(serviceLink.getAttribute('href'));
      if (id) {
        emit('select_item', {item_list_name: 'services', items: [{item_id: id}]});
        emit('lkm_cta_click', {...common(id), action_type: 'view_service', placement: 'service_card'});
      }
      return;
    }

    const packageChoice = target.closest('[data-package]');
    if (packageChoice) {
      emit('lkm_package_select', {...common(slug), package_id: allowedSlug(packageChoice.dataset.package)});
      return;
    }

    const submit = target.closest('#bookingForm button[type="submit"], #contactForm button[type="submit"], #lkm20-quick-form button[type="submit"]');
    if (submit) return; // Count the form's submit event, not the button click.

    const control = target.closest('a[href],button');
    if (!control) return;
    const rawHref = control.getAttribute('href') || '';
    const inSticky = !!control.closest('#lkm20-sticky');
    let action = '';
    if (rawHref === '#/quote' || rawHref === '/#/quote') action = 'configure_quote';
    else if (rawHref === '#/request' || rawHref === '/#/request') action = 'continue_enquiry';
    else if (rawHref === '#/contact' || rawHref === '/#/contact') action = 'contact';
    else if (/^mailto:/i.test(rawHref)) action = 'email';
    else if (/^tel:/i.test(rawHref)) action = 'call';
    else if (/^https:\/\/(?:wa\.me|api\.whatsapp\.com)\//i.test(rawHref)) action = 'whatsapp';
    else if (control.id === 'checkoutButton') action = 'checkout_request';
    if (action) {
      emit('lkm_cta_click', {...common(slug), action_type: action, placement: inSticky ? 'mobile_sticky' : 'page'});
    }
  }, true);

  // Form starts and attempts — no form field values are observed or sent.
  document.addEventListener('focusin', event => {
    if (!isInput(event.target)) return;
    const form = event.target.closest('form');
    const formType = typeFromForm(form);
    if (!formType || firstFocus.has(form)) return;
    firstFocus.add(form);
    emit('lkm_form_start', {...common(formType === 'contact_enquiry' ? '' : serviceFrom(form)), form_type: formType});
  }, true);

  document.addEventListener('submit', event => {
    const form = event.target;
    const formType = typeFromForm(form);
    if (!formType) return;
    emit('lkm_form_submit_attempt', {...common(formType === 'contact_enquiry' ? '' : serviceFrom(form)), form_type: formType});
    // Do NOT emit generate_lead here: existing handlers do so only after server success.
  }, true);

  document.addEventListener('invalid', event => {
    const form = event.target?.closest?.('form');
    const formType = typeFromForm(form);
    if (!formType) return;
    const now = Date.now();
    if (now - (lastInvalid.get(form) || 0) < 1500) return;
    lastInvalid.set(form, now);
    emit('lkm_form_validation_error', {...common(formType === 'contact_enquiry' ? '' : serviceFrom(form)), form_type: formType});
  }, true);

  // Page funnel step: one event per actual SPA route transition, not per DOM rerender.
  let lastRoute = null;
  function trackRoute() {
    const hash = String(location.hash || '#/');
    if (hash === lastRoute) return;
    lastRoute = hash;
    const slug = currentSlug();
    if (/^#\/quote(?:[?#]|$)/.test(hash)) emit('lkm_quote_view', common(slug));
    if (/^#\/request(?:[?#]|$)/.test(hash)) emit('lkm_request_view', common(slug));
    // view_item and page_view are already sent from the original site.js.
  }
  window.addEventListener('hashchange', trackRoute);
  trackRoute();
})();
