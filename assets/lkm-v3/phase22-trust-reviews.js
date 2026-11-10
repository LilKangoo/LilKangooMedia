/* LilKangooMedia Phase 22.2 — public company feedback on service pages.
 * Uses only visible reviews from the existing archive. Individual comments are
 * NOT represented as service-specific endorsements. Read-only, no API secrets.
 */
(() => {
  'use strict';
  if (window.__lkmPhase222Loaded) return;
  window.__lkmPhase222Loaded = true;
  const root = document.getElementById('main');
  if (!root) return;
  const cfg = window.LKM_CONFIG || {};
  const base = String(cfg.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = String(cfg.SUPABASE_ANON_KEY || '');
  const google = 'https://www.google.com/maps/place/LilKangooMedia/@35.1688,33.4252,9z/data=!4m8!3m7!1s0x14e083213d8d68e1:0xc5fa68230e0cfed8!8m2!3d35.1688!4d33.4252!9m1!1b1!16s%2Fg%2F11n88nph87';
  const clean = (v, n = 800) => typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, n) : '';
  const el = (tag, cls, value) => {
    const item = document.createElement(tag);
    if (cls) item.className = cls;
    if (value !== undefined) item.textContent = value;
    return item;
  };
  const activeSlug = () => {
    const match = (location.hash || '').match(/^#\/service\/([^?#]+)/);
    if (!match) return '';
    try {
      const slug = decodeURIComponent(match[1]);
      return /^[a-z0-9-]{1,90}$/.test(slug) ? slug : '';
    } catch { return ''; }
  };
  function published(r) {
    return !!r && r.visible === true && Number.isInteger(Number(r.rating)) &&
      Number(r.rating) >= 1 && Number(r.rating) <= 5 && !!clean(r.body_en, 2000);
  }
  function normalize(r) {
    const id = clean(r.google_review_id || r.id, 150).replace(/[^A-Za-z0-9_-]/g, '');
    const d = Date.parse(r.reviewed_at || '');
    return {
      id,
      name: clean(r.reviewer_name, 95) || 'Client',
      rating: Number(r.rating),
      text: clean(r.body_en, 650),
      isTranslated: r.is_google_translation === true,
      isEdited: r.edited_for_site === true,
      date: Number.isFinite(d) ? new Date(d).toLocaleDateString('en-GB', {month: 'short', year: 'numeric'}) : '',
      timestamp: Number.isFinite(d) ? d : 0,
      featured: r.featured === true,
      order: Number.isFinite(Number(r.sort_order)) ? Number(r.sort_order) : 100,
      source: clean(r.source, 50)
    };
  }
  let reviewsPromise = null;
  function reviews() {
    if (reviewsPromise) return reviewsPromise;
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(base) || !key) {
      reviewsPromise = Promise.resolve([]);
      return reviewsPromise;
    }
    const path = '/rest/v1/lkm_reviews?select=id,google_review_id,reviewer_name,rating,body_en,visible,featured,sort_order,source,reviewed_at,is_google_translation,edited_for_site' +
      '&visible=eq.true&order=reviewed_at.desc&limit=500';
    reviewsPromise = fetch(base + path, {headers: {apikey:key, Accept:'application/json'}})
      .then(response => { if (!response.ok) throw Error('Reviews unavailable'); return response.json(); })
      .then(rows => Array.isArray(rows) ? rows.filter(published).map(normalize)
        .sort((a, b) => Number(b.featured) - Number(a.featured) || a.order - b.order || b.timestamp - a.timestamp)
        .slice(0, 3) : [])
      .catch(() => []);
    return reviewsPromise;
  }
  function createCard(r) {
    const item = el('article', 'lkm222-card');
    const top = el('div', 'lkm222-card-top');
    const stars = el('span', 'lkm222-stars', '★'.repeat(r.rating));
    stars.setAttribute('aria-label', r.rating + ' out of 5 stars');
    top.append(stars);
    if (r.date) top.append(el('span', 'lkm222-date', r.date));
    item.append(top, el('blockquote', 'lkm222-quote', r.text));
    const foot = el('div', 'lkm222-reviewer');
    const initials = r.name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
    const avatar = el('span', 'lkm222-avatar', initials || 'C');
    avatar.setAttribute('aria-hidden', 'true');
    const author = el('div', 'lkm222-author');
    author.append(el('strong', '', r.name));
    const sourceLabel = r.isEdited ? 'Edited for website' :
      r.isTranslated ? 'Translated by Google' :
      (r.source === 'google_takeout' || r.source === 'google_manual') ? 'Google review archive' : 'Client review';
    author.append(el('small', '', sourceLabel));
    foot.append(avatar, author);
    item.append(foot);
    if (r.id) {
      const link = el('a', 'lkm222-read', 'Read in review archive ↗');
      link.href = '/reviews.html#review-' + encodeURIComponent(r.id);
      item.append(link);
    }
    return item;
  }
  function createSection(items) {
    const section = el('section', 'lkm222-reviews');
    section.id = 'lkm222-reviews';
    section.setAttribute('aria-labelledby', 'lkm222-heading');
    const header = el('div', 'lkm222-head');
    const intro = el('div');
    intro.append(el('p', 'lkm222-eyebrow', 'CLIENT FEEDBACK'));
    const title = el('h2', '', 'What clients say about LilKangooMedia');
    title.id = 'lkm222-heading';
    intro.append(title, el('p', 'lkm222-lede', 'Feedback from our published company-wide review archive. These are not necessarily reviews of this particular service.'));
    header.append(intro);
    const view = el('a', 'lkm222-all', 'All reviews ↗');
    view.href = '/reviews.html';
    header.append(view);
    section.append(header);
    if (items.length) {
      const cards = el('div', 'lkm222-grid');
      for (const review of items) cards.append(createCard(review));
      section.append(cards);
      section.append(el('p','lkm222-disclaimer','Source: published LilKangooMedia review archive, including Google Business Profile export. This is not a live Google feed.'));
    } else {
      const empty = el('p','lkm222-fallback','Our saved review excerpts are not currently available. You can read our public Google Business Profile or visit our reviews page.');
      section.append(empty);
    }
    const next = el('div','lkm222-next');
    const msg = el('div');
    msg.append(el('strong','','Interested in this service?'));
    msg.append(el('p','','Tell us about your project and preferred date. Availability and final details are confirmed with our team.'));
    next.append(msg);
    const actions = el('div','lkm222-actions');
    const ask = el('a','lkm222-cta','Plan your project ↗');
    ask.href = '#/quote';
    const maps = el('a','lkm222-google','Google Business Profile ↗');
    maps.href = google;
    maps.target = '_blank';
    maps.rel = 'noopener noreferrer';
    actions.append(ask, maps);
    next.append(actions);
    section.append(next);
    return section;
  }
  function mount(slug, items) {
    if (activeSlug() !== slug) return;
    const wrap = root.querySelector('.lkm-v14[data-service-slug="' + slug + '"]');
    if (!wrap || wrap.querySelector('#lkm222-reviews')) return;
    const section = createSection(items);
    const projects = wrap.querySelector('#lkm22-projects');
    const anchor = wrap.querySelector('.lkm-v14-process, .lkm-v14-packages, .lkm-v14-checkout');
    if (projects) projects.after(section);
    else if (anchor) anchor.before(section);
    else wrap.append(section);
  }
  let queued = false;
  function enhance() {
    const slug = activeSlug();
    if (!slug) return;
    const wrap = root.querySelector('.lkm-v14[data-service-slug="' + slug + '"]');
    if (!wrap) return;
    const existing = wrap.querySelector('#lkm222-reviews');
    if (existing) {
      // Phase 22.1 loads its gallery asynchronously: keep our section AFTER it
      // regardless of the order in which the two Supabase requests finish.
      const projects = wrap.querySelector('#lkm22-projects');
      if (projects && projects.nextElementSibling !== existing) projects.after(existing);
      return;
    }
    void reviews().then(rows => mount(slug, rows));
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; enhance(); });
  }
  new MutationObserver(schedule).observe(root, {childList:true, subtree:true});
  window.addEventListener('hashchange', schedule);
  schedule();
})();
