/* LilKangooMedia Phase 28.2 — shared compact black gradient for Services + Home featured cards.
 * Presentation-only enhancement on #/services and Home featured services. Original Supabase services,
 * category/search, route handlers, quote and enquiry flows stay authoritative.
 */
(()=>{
 'use strict';
 if(window.__lkm28CatalogLoaded)return;
 window.__lkm28CatalogLoaded=true;
 const root=document.getElementById('main');
 if(!root)return;
 const path='/assets/lkm-v3/phase28-catalog.css?v=28-2';
 if(!document.querySelector('link[data-lkm28-style]')){
  const css=document.createElement('link');css.rel='stylesheet';css.href=path;css.dataset.lkm28Style='1';document.head.append(css);
 }
 const configs={
  personal:{title:'Personal Services',subtitle:'Individuals & private projects',context:'Personal Services'},
  business:{title:'Business Services',subtitle:'Companies & organisations',context:'Business Services'}
 };
 const svg={
  personal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="6" r="3"/><path d="M5.5 21v-2.5a6.5 6.5 0 0 1 13 0V21"/></svg>',
  business:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1M10 21v-4h4v4"/></svg>'
 };
 const route=()=>/^#\/services(?:\?|$)/.test(location.hash);
 const homeRoute=()=>/^(?:|#|#\/)$/.test(location.hash);
 let records=new Map(),queued=false;
 const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
 const getSlug=link=>{
  const m=String(link||'').match(/^#\/service\/([^?#]+)/);if(!m)return '';
  try{const id=decodeURIComponent(m[1]);return /^[a-z0-9-]{1,90}$/.test(id)?id:'';}catch{return ''}
 };
 function enhanceSwitch(container){
  const intro=container.querySelector('.catalog-intro');
  const segmented=intro?.querySelector('.segmented');
  if(!segmented)return;
  let zone=intro.querySelector('.lkm28-switch-wrap');
  if(!zone){
   zone=document.createElement('div');zone.className='lkm28-switch-wrap';
   segmented.before(zone);zone.append(segmented);
   const caption=document.createElement('p');caption.className='lkm28-switch-caption';caption.setAttribute('aria-live','polite');zone.append(caption);
  }
  segmented.setAttribute('aria-label','Choose Personal or Business services');
  for(const button of segmented.querySelectorAll('button[data-audience]')){
   const key=button.dataset.audience,config=configs[key];if(!config)continue;
   if(!button.querySelector('.lkm28-audience-copy')){
    const icon=document.createElement('span');icon.className='lkm28-audience-icon';icon.innerHTML=svg[key];icon.setAttribute('aria-hidden','true');
    const copy=document.createElement('span');copy.className='lkm28-audience-copy';
    const title=document.createElement('strong');title.textContent=config.title;
    const sub=document.createElement('small');sub.textContent=config.subtitle;
    copy.append(title,sub);button.replaceChildren(icon,copy);
   }
   button.setAttribute('aria-pressed',String(button.classList.contains('active')));
   button.setAttribute('aria-label',config.title+' — '+config.subtitle);
  }
  const current=segmented.querySelector('button.active[data-audience]')?.dataset.audience;
  const label=zone.querySelector('.lkm28-switch-caption');
  if(label)label.textContent='Currently viewing: '+(configs[current]?.context||'Services');
 }
 function enhanceCard(card,mode='catalog'){
  const photo=card.querySelector('.service-photo[href]');
  const title=card.querySelector('.service-body h3');
  const body=card.querySelector('.service-body');
  if(!photo||!title||!body)return;
  const href=photo.getAttribute('href'),slug=getSlug(href);
  if(!slug)return;
  if(card.dataset.lkm28Slug!==slug){
   card.dataset.lkm28Slug=slug;
   const link=document.createElement('a');link.className='lkm28-full-card';
   link.href=href;link.setAttribute('aria-label','View service: '+clean(title.textContent));
   card.append(link);
   const view=document.createElement('span');view.className='lkm28-view';view.setAttribute('aria-hidden','true');
   const words=document.createElement('span');words.textContent='View service';
   const arrow=document.createElement('span');arrow.className='lkm28-arrow';arrow.textContent='→';
   view.append(words,arrow);body.append(view);
  }
  // The full-card link is the single keyboard and pointer navigation target.
  photo.setAttribute('tabindex','-1');
  const titleLink=title.querySelector('a');if(titleLink)titleLink.setAttribute('tabindex','-1');
  const price=card.querySelector('.service-price strong')?.textContent.trim()||'';
  const priceLabel=card.querySelector('.service-price small')?.textContent.trim()||'';
  // Never display a doubled 'Packages from From €X' price prefix.
  card.classList.toggle('lkm28-price-has-from', /^from\s/i.test(price)&&/from/i.test(priceLabel));
  const primary=card.querySelector('.lkm28-full-card');
  if(primary){primary.setAttribute('aria-label','View '+clean(title.textContent)+(price?' — '+priceLabel+' '+price:''));}
  // Home uses the original short service summary, not the catalogue's 3 CMS benefits.
  // This preserves the exact text provided by the existing featured service card.
  if(mode==='home'){
   body.querySelector('.lkm28-benefits')?.remove();
   card.classList.remove('lkm28-has-benefits');
   return;
  }
  const features=records.get(slug)?.features;
  const valid=Array.isArray(features)?[...new Set(features.filter(f=>typeof f==='string').map(clean).filter(Boolean))].slice(0,3):[];
  const sig=valid.join('\u001f');
  if(body.dataset.lkm28Features!==sig){
   body.dataset.lkm28Features=sig;
   body.querySelector('.lkm28-benefits')?.remove();
   if(valid.length){
    const list=document.createElement('ul');list.className='lkm28-benefits';
    for(const f of valid){const li=document.createElement('li');li.textContent=f;li.title=f;list.append(li);}
    body.append(list);
   }
   card.classList.toggle('lkm28-has-benefits',Boolean(valid.length));
  }
 }
 function enhance(){
  if(route()){
   const grid=root.querySelector('#catalogGrid');
   const container=grid?.closest('.container');if(!grid||!container)return;
   container.classList.add('lkm28-catalog');
   enhanceSwitch(container);
   grid.querySelectorAll('.service-card').forEach(card=>enhanceCard(card,'catalog'));
   return;
  }
  if(homeRoute()){
   // Verified Home markup: section.section.container > .service-grid under
   // the "Find exactly what you need." heading. No other Home blocks are changed.
   const grid=root.querySelector('section.section.container > .service-grid');
   const section=grid?.closest('section.section.container');
   if(!section||!section.querySelector('.section-head h2')||!grid)return;
   section.classList.add('lkm28-home');
   grid.querySelectorAll('.service-card').forEach(card=>enhanceCard(card,'home'));
  }
 }
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()});}
 new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
 window.addEventListener('hashchange',schedule);
 if(window.LKMStore?.publicServices){
  Promise.resolve().then(()=>window.LKMStore.publicServices()).then(list=>{
   if(!Array.isArray(list))return;
   records=new Map(list.filter(x=>x&&typeof x.slug==='string').map(x=>[x.slug,x]));
   schedule();
  }).catch(()=>{/* Existing catalogue still works without optional features. */});
 }
 schedule();
})();

/* Phase 29.4 — additive Navy & Gold homepage + linked header presentation.
 * Loaded here because Phase 28.2 is already the site's shared public loader;
 * this avoids overwriting the working Phase 27 service-detail module. */
(()=>{
 'use strict';
 if(document.querySelector('script[data-lkm29-home]'))return;
 const stylesheet=document.createElement('link');
 stylesheet.rel='stylesheet';
 stylesheet.href='/assets/lkm-v3/phase29-home.css?v=29-4';
 stylesheet.dataset.lkm29HomeStyle='1';
 document.head.append(stylesheet);
 const script=document.createElement('script');
 script.src='/assets/lkm-v3/phase29-home.js?v=29-4';
 script.dataset.lkm29Home='1';
 document.head.append(script);
})();
