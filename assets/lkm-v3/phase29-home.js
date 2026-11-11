/* LilKangooMedia Phase 29.2 — homepage navy/gold presentation and navigation.
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
      document.body.classList.remove('lkm29-home');
      return;
    }
    document.body.classList.add('lkm29-home');
    compactHeroTitle(hero);
    let stage = root.querySelector(':scope > .lkm29-stage');
    if (!stage) {
      stage = create('div', 'lkm29-stage');
      stage.id = 'lkm29-stage';
      const bokeh = create('div', 'lkm29-bokeh');
      bokeh.setAttribute('aria-hidden', 'true');
      const logo = create('div', 'lkm29-watermark');
      logo.setAttribute('aria-hidden', 'true');
      const img = document.createElement('img');
      // The actual LilKangooMedia footer mark — never a substitute monogram.
      img.src = '/assets/lkm-v3/brand/logo-orange.png';
      img.alt = '';
      img.decoding = 'async';
      logo.append(img);
      stage.append(bokeh, logo);
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
  function animate() {
    rafScroll = false;
    const stage = root.querySelector(':scope > .lkm29-stage');
    const mark = stage?.querySelector('.lkm29-watermark');
    if (!stage || !mark) return;
    if (reduced.matches) { mark.style.transform = 'none'; return; }
    const y = stage.getBoundingClientRect().top + window.scrollY;
    const travel = Math.max(0, stage.offsetHeight - mark.offsetHeight - 110);
    const progress = Math.max(0, Math.min(1, (window.scrollY + window.innerHeight * .48 - y) / Math.max(1, stage.offsetHeight - mark.offsetHeight)));
    const dy = progress * travel;
    const degrees = (progress - .5) * 11;
    mark.style.transform = `translate3d(0, ${dy.toFixed(1)}px, 0) rotate(${degrees.toFixed(2)}deg)`;
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
  reduced.addEventListener?.('change', scheduleScroll);
  schedule();
})();
