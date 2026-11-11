/* LilKangooMedia Phase 29.4 — homepage navy/gold presentation and navigation.
 * Additive only. Moves existing HOME sections into one continuous stage; original
 * routes, service cards, Supabase pricing, review carousel and forms are preserved.
 */
(() => {
  'use strict';
  if (window.__lkm29HomeLoaded) return;
  window.__lkm29HomeLoaded = true;
  const root = document.getElementById('main');
  const header = document.getElementById('siteHeader');
  if (!root || !header) return;
  const create = (tag, cls) => { const n = document.createElement(tag); if (cls) n.className = cls; return n; };
  const isHome = () => !location.hash || location.hash === '#' || location.hash === '#/' || location.hash === '#/home';
  let queued = false;
  let rafScroll = false;
  let motionObserver = null;
  const observed = new WeakSet();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Keep the already-existing, verified href values of ALL original navigation links.
  function improveNavigation() {
    const nav = header.querySelector('.desktop-nav');
    const mobileNav = header.querySelector('#mobileNav');
    const identity = header.querySelector('.identity[href]');
    if (!nav || !mobileNav || !identity) return;
    if (!nav.querySelector('.lkm29-home-nav')) {
      const home = create('a', 'lkm29-home-nav');
      home.href = identity.getAttribute('href');
      home.textContent = 'Home';
      nav.prepend(home);
    }
    if (!nav.querySelector('.lkm29-service-group')) {
      const services = [...nav.children].find(a => a.matches?.('a[href="#/services"]'));
      if (services) {
        const group = create('span', 'lkm29-service-group');
        const button = create('button', 'lkm29-service-toggle');
        button.type = 'button';
        button.textContent = '⌄';
        button.setAttribute('aria-label', 'Show Personal and Business Services');
        button.setAttribute('aria-expanded', 'false');
        const dropdown = create('span', 'lkm29-service-dropdown');
        dropdown.id = 'lkm29-service-dropdown';
        button.setAttribute('aria-controls', dropdown.id);
        for (const [label, audience] of [['Personal Services', 'personal'], ['Business Services', 'business']]) {
          const a = create('a');
          // These are the exact audience routes used by site.js on the catalogue.
          const existing = root.querySelector('.audience-card[href*="audience=' + audience + '"]');
          a.href = existing?.getAttribute('href') || '#/services?audience=' + audience;
          a.textContent = label;
          dropdown.append(a);
        }
        services.before(group);
        group.append(services, button, dropdown);
        button.addEventListener('click', () => {
          const open = group.classList.toggle('lkm29-open');
          button.setAttribute('aria-expanded', String(open));
        });
        group.addEventListener('keydown', e => {
          if (e.key === 'Escape') {
            group.classList.remove('lkm29-open');
            button.setAttribute('aria-expanded', 'false');
            button.focus({preventScroll:true});
          }
        });
        document.addEventListener('click', e => {
          if (!group.contains(e.target)) {
            group.classList.remove('lkm29-open');
            button.setAttribute('aria-expanded', 'false');
          }
        });
      }
    }
    if (!mobileNav.querySelector('.lkm29-mobile-home')) {
      const home = create('a', 'lkm29-mobile-home');
      home.href = identity.getAttribute('href');
      home.textContent = 'Home';
      mobileNav.prepend(home);
      const serviceLink = [...mobileNav.querySelectorAll('a')].find(a => a.getAttribute('href') === '#/services');
      if (serviceLink) {
        const personal = create('a', 'lkm29-mobile-subnav');
        const business = create('a', 'lkm29-mobile-subnav');
        personal.href = '#/services?audience=personal';
        business.href = '#/services?audience=business';
        personal.textContent = 'Personal Services';
        business.textContent = 'Business Services';
        serviceLink.after(personal, business);
      }
    }
    const hash = location.hash;
    for (const a of nav.querySelectorAll('a')) {
      const href = a.getAttribute('href');
      const active = href === '#/' ? isHome() : href === '#/services' ? /^#\/services(?:\?|$)|^#\/service\//.test(hash) : false;
      a.classList.toggle('lkm29-current', active);
      if (active) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    }
    const group = nav.querySelector('.lkm29-service-group');
    const parentLink = group?.querySelector('a[href="#/services"]');
    if (parentLink) parentLink.classList.toggle('lkm29-current', /^#\/(?:services|service\/)/.test(hash));
  }

  function compactHeroTitle(hero) {
    const title = hero.querySelector('.hero-title h1');
    if (!title || title.dataset.lkm29Compact === '1') return;
    // Original hero wording verified in site.js; preserve it exactly while
    // adding explicit flex items so desktop spacing is actually visible.
    const existing = title.textContent.replace(/\s+/g, '').toUpperCase();
    if (existing !== 'CREATE.CAPTURE.GROW.') return;
    const makeWord = (tag, label) => { const n = document.createElement(tag); n.textContent = label; return n; };
    title.replaceChildren(makeWord('span','CREATE.'), makeWord('span','CAPTURE.'), makeWord('em','GROW.'));
    title.dataset.lkm29Compact = '1';
  }
  function ensureStage() {
    const proof = [...root.children].find(el => el.classList?.contains('proof-strip'));
    const hero = [...root.children].find(el => el.classList?.contains('hero'));
    if (!isHome() || !proof || !hero) {
      document.body.classList.remove('lkm29-home', 'lkm29-motion-ready');
      motionObserver?.disconnect();
      motionObserver = null;
      return;
    }
    document.body.classList.add('lkm29-home');
    compactHeroTitle(hero);
    // One real kangaroo watermark spanning the whole Home, from HERO through CTA.
    // The white proof strip and navigation are layered in front of it.
    if (!root.querySelector(':scope > .lkm29-global-watermark')) {
      const mark = create('div', 'lkm29-global-watermark');
      mark.setAttribute('aria-hidden', 'true');
      const logoImage = document.createElement('img');
      logoImage.src = '/assets/lkm-v3/brand/logo-orange.png';
      logoImage.alt = '';
      logoImage.decoding = 'async';
      mark.append(logoImage);
      root.prepend(mark);
    }
    let stage = root.querySelector(':scope > .lkm29-stage');
    if (!stage) {
      stage = create('div', 'lkm29-stage');
      stage.id = 'lkm29-stage';
      const bokeh = create('div', 'lkm29-bokeh');
      bokeh.setAttribute('aria-hidden', 'true');
      stage.append(bokeh);
      proof.after(stage);
    }
    // Review module inserts the real reviews after the existing portfolio section.
    // Collect each source section without cloning, preserving event handlers and data.
    const siblings = [...root.children];
    const proofPos = siblings.indexOf(proof);
    for (const item of siblings.slice(proofPos + 1)) {
      if (item !== stage) stage.append(item);
    }
    const reviews = root.querySelector('#lkmReviewsHome');
    const cta = stage.querySelector(':scope > section.dark-panel');
    if (reviews && cta && reviews.nextElementSibling !== cta) cta.before(reviews);
    setupMotion(hero, stage);
    scheduleScroll();
  }
  function render() {
    queued = false;
    improveNavigation();
    ensureStage();
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(render);
  }
  // Entrance animations use only opacity & transforms; repeat in both directions.
  // One observer handles the existing sections and asynchronous review cards.
  function setupMotion(hero, stage) {
    if (!('IntersectionObserver' in window) || reduced.matches) {
      document.body.classList.remove('lkm29-motion-ready');
      motionObserver?.disconnect();
      motionObserver = null;
      return;
    }
    if (!motionObserver) {
      motionObserver = new IntersectionObserver(entries => {
        for (const entry of entries) {
          entry.target.classList.toggle('lkm29-inview', entry.isIntersecting);
        }
      }, { threshold: 0.09, rootMargin: '0px 0px -5% 0px' });
    }
    const targets = [
      ...hero.querySelectorAll('.audience-card'),
      ...stage.querySelectorAll('.section-head, .service-card, .feature-wide > .wide-media, .feature-wide > .wide-copy, .portfolio-tile, #lkmReviewsHome .lkm-review-heading, #lkmReviewsHome .lkm-review-rating, #lkmReviewsHome .lkm-review-card, #lkmReviewsHome .lkm-review-actions, .dark-panel .section-head')
    ];
    for (const [i, node] of targets.entries()) {
      if (observed.has(node)) continue;
      observed.add(node);
      node.classList.add('lkm29-entrance');
      node.style.setProperty('--lkm29-delay', (i % 3) * 55 + 'ms');
      node.classList.add(i % 3 === 0 ? 'lkm29-rise' : i % 3 === 1 ? 'lkm29-from-left' : 'lkm29-from-right');
      // Content already inside the viewport should stay immediately accessible.
      if (node.getBoundingClientRect().top < innerHeight * .75 && node.getBoundingClientRect().bottom > 0) {
        node.classList.add('lkm29-inview');
      }
      motionObserver.observe(node);
    }
    document.body.classList.add('lkm29-motion-ready');
  }
  function animate() {
    rafScroll = false;
    const mark = root.querySelector(':scope > .lkm29-global-watermark');
    if (!mark || !isHome()) return;
    if (reduced.matches) { mark.style.transform = 'none'; return; }
    // Phase 29.4: map scroll from the very top of Home to the bottom of its
    // actual footer (not a 110px decorative wobble). The fixed watermark moves
    // vertically through the viewport, so the genuine kangaroo remains in view
    // while passing behind the white benefits strip and eventually the footer.
    const footer = document.querySelector('footer.footer');
    const footerBottom = footer ? footer.getBoundingClientRect().bottom + scrollY : document.documentElement.scrollHeight;
    const finalScrollY = Math.max(1, footerBottom - innerHeight);
    const progress = Math.max(0, Math.min(1, window.scrollY / finalScrollY));
    const logoHeight = mark.offsetHeight || mark.offsetWidth;
    const upper = Math.max(52, innerHeight * 0.08);
    const lower = Math.max(upper + 60, innerHeight - logoHeight - Math.max(16, innerHeight * 0.06));
    const y = upper + progress * (lower - upper);
    const x = (progress - .5) * Math.min(38, innerWidth * .07);
    const angle = (progress - .5) * 15;
    mark.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${angle.toFixed(2)}deg)`;
  }
  function scheduleScroll() {
    if (rafScroll) return;
    rafScroll = true;
    requestAnimationFrame(animate);
  }
  new MutationObserver(schedule).observe(root, {childList:true,subtree:true});
  window.addEventListener('hashchange', schedule);
  window.addEventListener('scroll', scheduleScroll, {passive:true});
  window.addEventListener('resize', scheduleScroll, {passive:true});
  reduced.addEventListener?.('change', () => { motionObserver?.disconnect(); motionObserver = null; document.body.classList.remove('lkm29-motion-ready'); schedule(); scheduleScroll(); });
  schedule();
})();
