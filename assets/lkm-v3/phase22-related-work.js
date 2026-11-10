/* LilKangooMedia Phase 22.1 — service-related REAL portfolio projects.
 * Uses the existing public portfolio_galleries.related_service_slug.
 * No invented reviews, projects or prices. No Supabase writes or secrets.
 */
(() => {
  'use strict';
  if (window.__lkm22RelatedWorkLoaded) return;
  window.__lkm22RelatedWorkLoaded = true;
  const root = document.getElementById('main');
  if (!root) return;
  const cfg = window.LKM_CONFIG || {};
  const base = String(cfg.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = String(cfg.SUPABASE_ANON_KEY || '');
  const cache = new Map();
  let queued = false;
  const node = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const trim = (x, max = 220) => typeof x === 'string' ? x.trim().slice(0, max) : '';
  const validSlug = x => /^[a-z0-9-]{1,90}$/.test(x || '');
  const safeImage = x => {
    const url = trim(x, 1700);
    if (/^https:\/\/[^\s<>"']+$/.test(url)) return url;
    if (/^\/assets\/[a-zA-Z0-9%._/-]+$/.test(url) && !url.includes('..') && !url.includes('//')) return url;
    return '';
  };
  const videoThumb = x => /^[A-Za-z0-9_-]{11}$/.test(x || '') ? `https://i.ytimg.com/vi/${x}/hqdefault.jpg` : '';
  function currentSlug() {
    const found = location.hash.match(/^#\/service\/([^?#]+)/);
    if (!found) return '';
    try { const s = decodeURIComponent(found[1]); return validSlug(s) ? s : ''; }
    catch { return ''; }
  }
  async function get(path) {
    const res = await fetch(`${base}/rest/v1/${path}`, {
      headers: {apikey: key, Accept: 'application/json'}, cache: 'no-store'
    });
    if (!res.ok) throw Error('Portfolio temporarily unavailable');
    const rows = await res.json();
    if (!Array.isArray(rows)) throw Error('Invalid portfolio response');
    return rows;
  }
  async function load(slug) {
    if (!base.startsWith('https://') || !key || !validSlug(slug)) return [];
    // Only published galleries genuinely assigned to THIS service. Never infer assignments.
    const galleries = await get('portfolio_galleries?select=id,slug,title,category,description,client_name,related_service_slug,cover_image_id,display_order'
      + '&related_service_slug=eq.' + encodeURIComponent(slug)
      + '&visibility=eq.public&order=display_order.asc&limit=12');
    const actual = galleries.filter(g => validSlug(g.slug) && g.related_service_slug === slug && /^[0-9a-f-]{36}$/i.test(g.id || ''));
    if (!actual.length) return [];
    const ids = actual.map(g => g.id).join(',');
    // Both gallery and individual media must be public. Fail gracefully if videos are unavailable.
    const photosPromise = get('portfolio_images?select=id,gallery_id,image_url,alt_text,caption,display_order'
      + '&gallery_id=in.(' + ids + ')&visibility=eq.public&order=display_order.asc&limit=150').catch(() => []);
    const videoPromise = get('media_videos?select=id,gallery_id,youtube_id,title,display_order'
      + '&gallery_id=in.(' + ids + ')&visibility=eq.public&order=display_order.asc&limit=100').catch(() => []);
    // Public RLS hides drafts. If the new table is not installed yet, keep Phase 22.1 working.
    const storyPromise = get('lkm_case_studies?select=gallery_id&is_published=eq.true&gallery_id=in.(' + ids + ')&limit=12').catch(() => []);
    const [photos, videos, stories] = await Promise.all([photosPromise, videoPromise, storyPromise]);
    const storyIds = new Set(stories.map(s => s.gallery_id));
    return actual.map(g => {
      const matched = photos.filter(p => p.gallery_id === g.id && safeImage(p.image_url));
      const cover = matched.find(p => p.id === g.cover_image_id) || matched[0];
      const clip = videos.find(v => v.gallery_id === g.id && videoThumb(v.youtube_id));
      const image = cover ? safeImage(cover.image_url) : clip ? videoThumb(clip.youtube_id) : '';
      return {slug: g.slug, title: trim(g.title, 170), category: trim(g.category, 100),
        description: trim(g.description, 175), client: trim(g.client_name, 100),
        image, alt: cover ? trim(cover.alt_text, 180) || trim(g.title, 170) : trim(clip?.title, 180),
        count: matched.length + videos.filter(v => v.gallery_id === g.id && videoThumb(v.youtube_id)).length,
        isVideo: !cover && Boolean(clip), hasStory: storyIds.has(g.id)};
    }).filter(g => g.title && g.image && g.count > 0).slice(0, 4);
  }
  function projectsFor(slug) {
    let item = cache.get(slug);
    if (!item) {
      item = load(slug).catch(() => []);
      cache.set(slug, item);
    }
    return item;
  }
  function render(slug, projects) {
    const wrap = root.querySelector('.lkm-v14[data-service-slug]');
    if (!wrap || wrap.dataset.serviceSlug !== slug || currentSlug() !== slug || wrap.querySelector('#lkm22-projects')) return;
    const section = node('section', 'lkm22-projects');
    section.id = 'lkm22-projects';
    section.setAttribute('aria-labelledby', 'lkm22-projects-title');
    const head = node('div', 'lkm22-head');
    const title = node('div', 'lkm22-title');
    title.append(node('p','lkm22-eyebrow', projects.length ? 'SELECTED PROJECTS' : 'EXPLORE OUR WORK'));
    const h2 = node('h2','', projects.length ? 'See this service in action' : 'Explore our portfolio');
    h2.id = 'lkm22-projects-title';
    title.append(h2);
    title.append(node('p','lkm22-muted', projects.length
      ? 'Published work linked to this service by our team.'
      : 'Browse projects across photography, film and creative services.'));
    head.append(title);
    const browse = node('a', 'lkm22-browse', 'All projects ↗');
    browse.href = '/portfolio.html';
    head.append(browse);
    section.append(head);
    if (projects.length) {
      const list = node('div', 'lkm22-grid');
      for (const project of projects) {
        const card = node('a', 'lkm22-card');
        card.href = project.hasStory ? `/portfolio.html#/story/${encodeURIComponent(project.slug)}` : `/portfolio.html#/gallery/${encodeURIComponent(project.slug)}`;
        const visual = node('div','lkm22-image-wrap');
        const img = node('img');
        img.src = project.image;
        img.alt = project.alt || project.title;
        img.loading = 'lazy';
        img.decoding = 'async';
        visual.append(img);
        if (project.isVideo) visual.append(node('span','lkm22-video-tag','▶ Video'));
        card.append(visual);
        const info = node('div','lkm22-info');
        info.append(node('span','lkm22-type',project.category || 'Project'));
        info.append(node('h3','',project.title));
        if (project.description) info.append(node('p','',project.description));
        if (project.client) info.append(node('span','lkm22-client',project.client));
        info.append(node('span','lkm22-view',project.hasStory ? 'Read project story ↗' : 'View project ↗'));
        card.append(info);
        list.append(card);
      }
      section.append(list);
    }
    const trust = node('div','lkm22-trust');
    trust.append(node('p','', 'Want to know what working with us is like? Read feedback from our clients.'));
    const reviews = node('a','','Read client reviews ↗');
    reviews.href='/reviews.html';
    trust.append(reviews);
    section.append(trust);
    const anchor = wrap.querySelector('.lkm-v14-packages, .lkm-v14-process, .lkm-v14-checkout');
    if (anchor) anchor.before(section);
    else wrap.append(section);
  }
  function enhance() {
    const slug = currentSlug();
    if (!slug || !root.querySelector('.lkm-v14[data-service-slug="'+slug+'"]')) return;
    if (root.querySelector('.lkm-v14[data-service-slug="'+slug+'"] #lkm22-projects')) return;
    void projectsFor(slug).then(projects => render(slug, projects));
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; enhance(); });
  }
  // Phase 16 may assemble the detail page inside an existing #main child.
  new MutationObserver(schedule).observe(root, {childList: true, subtree: true});
  window.addEventListener('hashchange', schedule);
  schedule();
})();
