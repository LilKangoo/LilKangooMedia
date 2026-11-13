/* Phase 32: one unambiguous link per item in Admin Links Library.
 * Small additive enhancement: does not alter the existing data loader,
 * Supabase permissions, search/filter system or the Command Center.
 */
(() => {
  'use strict';
  const root = document.getElementById('lkmLinksAdmin');
  if (!root || root.dataset.lkm32Loaded) return;
  root.dataset.lkm32Loaded = 'true';
  const SITE = 'https://lilkangoomedia.com';
  const safeSlug = s => /^[a-z0-9][a-z0-9_-]{0,119}$/i.test(String(s || ''));
  const pages = Object.freeze({
    '/': 'home',
    '/portfolio.html': 'portfolio',
    '/blog.html': 'articles',
    '/reviews.html': 'reviews',
    '/FAQ.html': 'faq'
  });
  const socials = Object.freeze({
    'www.instagram.com': 'instagram',
    'www.facebook.com': 'facebook',
    'www.youtube.com': 'youtube',
    'wa.me': 'whatsapp',
    'g.page': 'leave-google-review',
    'www.google.com': 'google-reviews'
  });
  const make = (kind, slug) => SITE + '/share/' + kind + '/' + encodeURIComponent(slug);
  function fromPage(original) {
    let parsed;
    try { parsed = new URL(original, SITE); } catch { return ''; }
    if (parsed.origin !== SITE) return '';
    if (parsed.pathname === '/') {
      const hash = parsed.hash || '';
      if (hash.startsWith('#/services')) {
        const text = decodeURIComponent(hash);
        if (text.includes('audience=personal')) return make('page','personal');
        if (text.includes('audience=business')) return make('page','business');
        return make('page','services');
      }
      if (hash.startsWith('#/about')) return make('page','about');
      if (hash.startsWith('#/contact')) return make('page','contact');
      if (!hash || hash === '#/' || hash === '#') return make('page','home');
    }
    const slug = pages[parsed.pathname];
    return slug ? make('page',slug) : '';
  }
  function linkFor(card) {
    const id = card.dataset.linkId || '';
    const separator = id.indexOf(':');
    const kind = separator > 0 ? id.slice(0, separator) : '';
    const identifier = separator > 0 ? id.slice(separator + 1) : '';
    const previous = card.querySelector('.lkm-link-open')?.getAttribute('href') || '';
    if (['service','gallery','article'].includes(kind) && safeSlug(identifier)) return make(kind,identifier);
    if (kind === 'page') return fromPage(identifier) || previous;
    if (kind === 'external') {
      try {
        const url = new URL(previous);
        const slug = socials[url.hostname.toLowerCase()];
        return slug ? make('social',slug) : previous;
      } catch { return previous; }
    }
    return previous;
  }
  function patch(card) {
    if (card.dataset.lkm32Ready) return;
    const href = linkFor(card);
    if (!href || !/^https:\/\//.test(href)) return;
    const area = card.querySelector('.lkm-link-card-main');
    const actions = card.querySelector('.lkm-link-actions');
    const primaryButton = actions?.querySelector('[data-action="copy"]');
    if (!area || !primaryButton) return;
    card.dataset.lkm32Ready = '1';
    card.dataset.lkm32Share = href;
    const anchor = document.createElement('a');
    anchor.className = 'lkm-link-card-main lkm32-project-link';
    anchor.href = href;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.title = 'Open the page';
    anchor.setAttribute('aria-label', 'Open ' + (area.querySelector('h3')?.textContent || 'this link'));
    while (area.firstChild) anchor.appendChild(area.firstChild);
    area.replaceWith(anchor);
    const path = anchor.querySelector('.lkm-link-path');
    if (path) {
      const link = new URL(href);
      path.textContent = link.hostname + link.pathname;
      path.title = href;
    }
    // Only one copy action. Opening the page is handled by the card itself.
    for (const other of [...actions.children]) {
      if (other !== primaryButton) other.remove();
    }
    primaryButton.textContent = 'Copy link';
    primaryButton.setAttribute('aria-label', 'Copy share link for ' + (anchor.querySelector('h3')?.textContent || 'this page'));
    card.querySelectorAll('[data-action="direct"], [data-action="message"]').forEach(b => b.remove());
    card.querySelectorAll('.lkm-link-details').forEach(d => {
      const summary = d.querySelector('summary');
      if (summary) summary.textContent = 'Page metadata';
    });
  }
  let pending = false;
  function update() {
    pending = false;
    root.querySelectorAll('.lkm-link-card:not([data-lkm32-ready])').forEach(patch);
  }
  function schedule() {
    if (pending) return;
    pending = true;
    queueMicrotask(update);
  }
  new MutationObserver(schedule).observe(root, {subtree:true,childList:true});
  function showMessage(msg) {
    const notice = document.getElementById('toast');
    if (notice) {
      notice.textContent = msg;
      notice.hidden = false;
      clearTimeout(notice._lkm32Timer);
      notice._lkm32Timer = setTimeout(() => { notice.hidden = true; }, 2800);
    }
  }
  async function copyLink(link) {
    try {
      await navigator.clipboard.writeText(link);
      showMessage('Link copied. Ready to share.');
    } catch {
      const field = document.createElement('textarea');
      field.value = link;
      field.readOnly = true;
      field.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
      document.body.append(field);
      field.select();
      let copied = false;
      try { copied = document.execCommand('copy'); } catch {}
      field.remove();
      showMessage(copied ? 'Link copied. Ready to share.' : 'Copy blocked. Click the project title to open its page.');
    }
  }
  // Capture ahead of the legacy bubble listener, so it cannot copy an old URL.
  root.addEventListener('click', event => {
    const button = event.target.closest('.lkm-link-card[data-lkm32-ready] [data-action="copy"]');
    if (!button) return;
    const card = button.closest('.lkm-link-card');
    if (!card?.dataset.lkm32Share) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void copyLink(card.dataset.lkm32Share);
  }, true);
  schedule();
})();
