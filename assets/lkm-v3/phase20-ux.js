/* LilKangooMedia Phase 20.3 — catalogue & enquiry usability.
   Additive, no database/checkout changes. Compatible with Phase 20.1 and 20.2.
   All data rendered into new DOM nodes through textContent (not user-provided HTML). */
(() => {
  'use strict';
  if (window.__LKMPhase203Loaded) return;
  window.__LKMPhase203Loaded = true;
  const root = document.getElementById('main');
  if (!root) return;
  const create = (tag, cls, value) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (value !== undefined) node.textContent = value;
    return node;
  };
  const isServiceRoute = () => /^#\/service\/[^?#]+/.test(location.hash);
  const isCatalogueRoute = () => /^#\/services(?:\?|$)/.test(location.hash);
  const getQuery = () => root.querySelector('#serviceSearch');
  const currentCategory = () => root.querySelector('.chip-row [data-category].active')?.dataset.category || 'All';
  const currentAudience = () => root.querySelector('.segmented [data-audience].active')?.dataset.audience || 'business';
  const todayLocal = () => {
    const d = new Date();
    return [String(d.getFullYear()), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  };
  let allServices = [];
  let storeReady = false;
  const normalize = value => String(value || '').toLocaleLowerCase().trim();
  const slugUrl = slug => '#/service/' + encodeURIComponent(slug);

  function addHelpLink(parent, text, href) {
    const link = create('a', 'lkm203-help-link', text);
    link.href = href;
    parent.append(link);
    return link;
  }

  function resultsHelper() {
    const grid = root.querySelector('#catalogGrid');
    const input = getQuery();
    const helper = root.querySelector('#lkm203-search-help');
    if (!grid || !input || !helper) return;
    const search = normalize(input.value);
    const activeCount = Array.from(grid.querySelectorAll('.service-card')).filter(card => card.style.display !== 'none').length;
    const category = currentCategory();
    const audience = currentAudience();
    const outside = search.length >= 2 && storeReady ? allServices.filter(service =>
      service?.active !== false && service?.audience === audience &&
      (category === 'All' || service?.category !== category) &&
      [service?.title, service?.summary, service?.category].some(value => normalize(value).includes(search))
    ).slice(0, 4) : [];
    const signature = [search, activeCount, category, audience, storeReady,
      ...outside.map(service => service.slug)].join('|');
    if (helper.dataset.lkm203Signature === signature) return;
    helper.dataset.lkm203Signature = signature;
    helper.replaceChildren();
    if (!search) { helper.hidden = true; return; }
    if (activeCount > 0 && category === 'All') { helper.hidden = true; return; }
    if (activeCount > 0 && category !== 'All' && outside.length === 0) { helper.hidden = true; return; }
    helper.hidden = false;
    const lead = create('p', 'lkm203-help-heading', activeCount === 0 ?
      (category === 'All' ? 'No matches in this service list.' : 'No matches in this category.') :
      'You are searching in one category.');
    helper.append(lead);
    if (category !== 'All') {
      const allButton = create('button', 'lkm203-reset-category', 'Search all categories');
      allButton.type = 'button';
      allButton.dataset.lkm203Action = 'all-categories';
      helper.append(allButton);
    }
    if (outside.length) {
      const note = create('p', 'lkm203-outside-label', 'Other matching services:');
      helper.append(note);
      const list = create('div', 'lkm203-other-links');
      outside.forEach(service => {
        const link = create('a', '', service.title || service.slug);
        link.href = slugUrl(service.slug);
        list.append(link);
      });
      helper.append(list);
    } else if (activeCount === 0) {
      addHelpLink(helper, 'Not sure what to choose? Ask us for advice →', '#/contact');
    }
  }

  function enhanceCatalogue() {
    const bar = root.querySelector('.search-bar');
    const grid = root.querySelector('#catalogGrid');
    const input = getQuery();
    if (!bar || !grid || !input) return;
    if (!bar.querySelector('#lkm203-clear')) {
      const clear = create('button', 'lkm203-clear', 'Clear');
      clear.type = 'button';
      clear.id = 'lkm203-clear';
      clear.setAttribute('aria-label', 'Clear service search');
      bar.insertBefore(clear, bar.querySelector('#searchButton'));
    }
    const clear = bar.querySelector('#lkm203-clear');
    clear.hidden = !input.value.trim();
    const submit = bar.querySelector('#searchButton');
    if (submit) {
      submit.type = 'button';
      submit.setAttribute('aria-label', 'Show matching services');
    }
    input.setAttribute('autocomplete', 'off');
    const resultCount = root.querySelector('#catalogCount');
    if (resultCount) {
      resultCount.setAttribute('role', 'status');
      resultCount.setAttribute('aria-live', 'polite');
      resultCount.setAttribute('aria-atomic', 'true');
    }
    if (!root.querySelector('#lkm203-search-help')) {
      const helper = create('div', 'lkm203-search-help');
      helper.id = 'lkm203-search-help';
      helper.hidden = true;
      grid.after(helper);
    }
    if (!bar.querySelector('.lkm203-shortcut')) {
      const note = create('span', 'lkm203-shortcut', 'Press / to search');
      note.setAttribute('aria-hidden', 'true');
      bar.append(note);
    }
    root.querySelectorAll('#catalogGrid .service-card').forEach(card => {
      const title = card.querySelector('.service-body h3');
      const link = card.querySelector('.service-photo[href]');
      if (title && link && !title.querySelector('a')) {
        const a = create('a', 'small-arrow lkm203-card-title', title.textContent.trim());
        a.href = link.getAttribute('href');
        title.replaceChildren(a);
      }
    });
    resultsHelper();
    const selectedChip = root.querySelector('.chip-row [data-category].active');
    if (selectedChip && selectedChip.dataset.lkm203Visible !== 'yes') {
      selectedChip.dataset.lkm203Visible = 'yes';
      if (window.innerWidth < 740 && currentCategory() !== 'All') {
        selectedChip.scrollIntoView({block: 'nearest', inline: 'nearest'});
      }
    }
  }

  function dateHint(input) {
    if (!input) return;
    input.min = todayLocal();
    if (!input.dataset.lkm203Hinted) {
      input.dataset.lkm203Hinted = 'yes';
      const hint = create('small', 'lkm203-date-hint', 'Tell us your preferred date; availability is confirmed by our team.');
      hint.id = 'lkm203-hint-' + (input.id || 'quick');
      input.setAttribute('aria-describedby', hint.id);
      input.after(hint);
    }
  }

  function enhanceDetail() {
    if (!isServiceRoute()) return;
    const intro = root.querySelector('.lkm-v14-intro');
    const packages = root.querySelector('#lkm-v14-packages');
    const booking = root.querySelector('#lkm-v14-booking');
    if (!intro || (!packages && !booking) || intro.querySelector('.lkm203-detail-jump')) return;
    const actions = create('div', 'lkm203-detail-jump');
    const jump = create('button', '', packages ? 'Jump to packages ↓' : 'How to enquire ↓');
    jump.type = 'button';
    jump.dataset.lkm203Action = 'jump';
    jump.dataset.lkm203Target = packages ? 'lkm-v14-packages' : 'lkm-v14-booking';
    actions.append(jump);
    const browse = create('a', '', 'Browse services');
    browse.href = '#/services?audience=' + (intro.querySelector('.lkm-v14-eyebrow')?.textContent?.toLowerCase().includes('personal') ? 'personal' : 'business');
    actions.append(browse);
    intro.append(actions);
  }

  function enhanceContact() {
    const contact = root.querySelector('.contact-info');
    if (!contact || contact.querySelector('.lkm203-whatsapp')) return;
    const a = create('a', 'lkm203-whatsapp', 'Prefer WhatsApp? Message us →');
    a.href = 'https://wa.me/35799005924';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    contact.querySelector('p a[href^="tel:"]')?.closest('p')?.after(a);
  }

  function enhance() {
    if (isCatalogueRoute()) enhanceCatalogue();
    if (isServiceRoute()) enhanceDetail();
    dateHint(root.querySelector('#requestDate'));
    dateHint(document.querySelector('#lkm20-quick-dialog input[name="preferred_date"]'));
    if (/^#\/contact(?:[?#]|$)/.test(location.hash)) enhanceContact();
  }
  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; enhance(); });
  };

  root.addEventListener('input', event => {
    if (event.target.id !== 'serviceSearch') return;
    const clear = root.querySelector('#lkm203-clear');
    if (clear) clear.hidden = !event.target.value.trim();
    resultsHelper();
  });
  root.addEventListener('click', event => {
    const button = event.target.closest('[data-lkm203-action],#lkm203-clear,#searchButton');
    if (!button) return;
    if (button.id === 'lkm203-clear') {
      const input = getQuery();
      if (!input) return;
      input.value = '';
      input.dispatchEvent(new Event('input', {bubbles: true}));
      input.focus({preventScroll:true});
      return;
    }
    if (button.dataset.lkm203Action === 'all-categories') {
      const chip = root.querySelector('.chip-row [data-category="All"]');
      if (!chip) return;
      const value = getQuery()?.value || '';
      chip.click(); // Reuse the site's existing catalogue filtering, no shadow state.
      requestAnimationFrame(() => {
        const input = getQuery();
        if (input && input.value !== value) {
          input.value = value;
          input.dispatchEvent(new Event('input',{bubbles:true}));
        }
        input?.focus({preventScroll:true});
      });
      return;
    }
    if (button.id === 'searchButton') {
      event.preventDefault();
      const first = Array.from(root.querySelectorAll('#catalogGrid .service-card')).find(card => card.style.display !== 'none');
      if (first) first.scrollIntoView({behavior: 'smooth', block: 'start'});
      else root.querySelector('#lkm203-search-help')?.scrollIntoView({behavior: 'smooth', block: 'center'});
      return;
    }
    if (button.dataset.lkm203Action === 'jump') {
      const destination = root.querySelector('#' + button.dataset.lkm203Target);
      destination?.scrollIntoView({behavior:'smooth',block:'start'});
    }
  });
  root.addEventListener('keydown', event => {
    if (event.target.id === 'serviceSearch' && event.key === 'Enter') {
      event.preventDefault();
      root.querySelector('#searchButton')?.click();
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    const tag = event.target?.tagName?.toLowerCase();
    if (['input','textarea','select'].includes(tag) || event.target?.isContentEditable || !isCatalogueRoute()) return;
    const input = getQuery();
    if (input) { event.preventDefault(); input.focus(); }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('[data-lkm20-slug]')) return;
    // Phase 20.1 opens the native <dialog> in its own delegated click listener.
    requestAnimationFrame(() => dateHint(document.querySelector('#lkm20-quick-dialog input[name="preferred_date"]')));
  });
  new MutationObserver(schedule).observe(root, {childList: true, subtree: true});
  window.addEventListener('hashchange', schedule);
  const store = window.LKMStore;
  if (store?.publicServices) {
    Promise.resolve(store.publicServices()).then(services => {
      allServices = Array.isArray(services) ? services : [];
      storeReady = true;
      schedule();
    }).catch(() => { storeReady = true; schedule(); });
  }
  schedule();
})();
