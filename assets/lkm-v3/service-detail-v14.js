/* LilKangooMedia Phase 27 — universal service detail layout.
 * Keeps catalogue data, native package selection, quote route, galleries and Supabase intact.
 * Additive public UX: desktop comparison, mobile selection bar, compact supporting content.
 */
(()=>{
'use strict';
const root=document.getElementById('main');
if(!root)return;
let catalogue=[],catalogueLoaded=false,queued=false,secondaryQueued=false;
let pendingPackageScroll=null;
const sourceFor=slug=>catalogue.find(x=>x.slug===slug);
const cleanFeatures=value=>Array.isArray(value)?[...new Set(value.filter(x=>typeof x==='string').map(x=>x.trim()).filter(Boolean))].slice(0,20):[];
const make=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el};
const shortText=(text,max=215)=>{
 const s=String(text||'').replace(/\s+/g,' ').trim();
 if(s.length<=max)return s;
 const cut=s.slice(0,max+1),sentence=cut.match(/^.{55,}?[.!?](?:\s|$)/);
 if(sentence)return sentence[0].trim();
 return cut.slice(0,Math.max(80,cut.lastIndexOf(' '))).trim().replace(/[,:;\-\s]+$/,'')+'…';
};
const longAfterIntro=(full,intro)=>{
 const f=String(full||'').trim(),s=String(intro||'').trim();
 if(!f)return '';
 if(s&&f.toLowerCase().startsWith(s.toLowerCase()))return f.slice(s.length).trim().replace(/^[,;:\.\-\s]+/,'');
 return f;
};
function currentSlug(){const match=location.hash.match(/^#\/service\/([^?#]+)/);if(!match)return '';try{return decodeURIComponent(match[1])}catch{return match[1]}}
function ensureStyles(){
 if(document.querySelector('link[data-lkm27-style]'))return;
 const css=document.createElement('link');css.rel='stylesheet';css.href='/assets/lkm-v3/phase27-service.css?v=27-1';css.dataset.lkm27Style='1';document.head.append(css);
}
function updateMobileBar(wrap){
 const native=wrap?.querySelector('.lkm-v14-package button[data-package].selected')||wrap?.querySelector('.lkm-v14-package button[data-package]');
 const price=wrap?.querySelector('.lkm-v27-summary .lkm-v14-price')?.textContent.trim()||'';
 const name=native?.querySelector('strong')?.textContent.trim()||'Custom quote';
 let bar=document.getElementById('lkm27MobileBar');
 if(!wrap){bar?.remove();document.body.classList.remove('lkm27-detail');return;}
 document.body.classList.add('lkm27-detail');
 if(!bar){
  bar=make('aside','lkm-v27-mobile-bar');bar.id='lkm27MobileBar';bar.setAttribute('aria-label','Selected service package');
  const info=make('div','lkm-v27-mobile-bar-copy');
  const label=make('span','', 'Selected package');
  const chosen=make('strong');chosen.dataset.lkm27Name='';
  const amount=make('b');amount.dataset.lkm27Price='';
  info.append(label,chosen,amount);
  const link=make('a','lkm-v27-mobile-continue','Continue →');link.href='#/quote';
  bar.append(info,link);document.body.append(bar);
 }
 bar.querySelector('[data-lkm27-name]').textContent=name;
 bar.querySelector('[data-lkm27-price]').textContent=price||'Custom quote';
}
function syncExtraSections(){
 const slug=currentSlug();const wrap=root.querySelector('.lkm-v27[data-service-slug]');
 if(!slug||!wrap||wrap.dataset.serviceSlug!==slug){updateMobileBar(null);return;}
 const process=wrap.querySelector('.lkm-v14-process');
 const projects=wrap.querySelector('#lkm22-projects');
 const reviews=wrap.querySelector('#lkm222-reviews');
 if(projects&&process&&process.nextElementSibling!==projects)process.after(projects);
 if(projects&&!projects.querySelector('.lkm-v27-project-cta')){
  const strip=make('div','lkm-v27-project-cta');const message=make('div');
  message.append(make('strong','','Ready to start your project?'),make('p','','Tell us what you have in mind and get a tailored plan.'));
  const link=make('a','','Plan your project →');link.href='#/quote';strip.append(message,link);
  const trust=projects.querySelector('.lkm22-trust');if(trust)trust.before(strip);else projects.append(strip);
 }
 if(reviews){
  const prev=projects||process||wrap.querySelector('.lkm-v27-buyflow');
  if(prev&&prev.nextElementSibling!==reviews)prev.after(reviews);
 }
 const actions=wrap.querySelector('.lkm203-detail-jump');
 if(actions){
  const primary=actions.querySelector('[data-lkm203-action="jump"]');
  const label=wrap.querySelector('#lkm-v14-packages')?'Choose a package →':'Request a quote →';
  if(primary&&primary.textContent!==label)primary.textContent=label;
  if(!actions.querySelector('.lkm-v27-view-work')){
   const button=make('button','lkm-v27-view-work','View examples ↗');button.type='button';button.dataset.lkm27Jump='projects';actions.append(button);
  }
 }
 updateMobileBar(wrap);
}
function scheduleExtra(){if(secondaryQueued)return;secondaryQueued=true;requestAnimationFrame(()=>{secondaryQueued=false;syncExtraSections()});}
function scrollToPackageIfNeeded(wrap,slug){
 const restore=pendingPackageScroll;
 if(!restore||restore.slug!==slug)return;
 pendingPackageScroll=null;
 const choices=[...wrap.querySelectorAll('button[data-package]')];
 const target=choices.find(b=>b.dataset.package===restore.id);
 if(!target)return;
 // The existing SPA replaces the whole #main and scrolls to page top on every package click.
 // Restore the *same package at the same viewport position*, not a stale absolute scrollY.
 const restorePosition=()=>{
  if(!target.isConnected||currentSlug()!==slug)return;
  const delta=target.getBoundingClientRect().top-restore.viewportTop;
  if(Math.abs(delta)>1)window.scrollBy({top:delta,behavior:'instant'});
 };
 restorePosition();requestAnimationFrame(()=>{restorePosition();requestAnimationFrame(restorePosition)});
}
function enhance(){
 const slug=currentSlug();if(!slug||!catalogueLoaded){if(!slug)updateMobileBar(null);return;}
 const container=root.querySelector('.container');
 const grid=container?.querySelector(':scope > .detail-grid');
 const copy=container?.querySelector(':scope > .detail-copy');
 if(!grid||!copy||container.querySelector(':scope > .lkm-v14')){scheduleExtra();return;}
 const photoBox=grid.children[0],aside=grid.querySelector(':scope > aside');
 const h1=copy.querySelector('h1');
 if(!photoBox||!aside||!h1)return;
 const record=sourceFor(slug);const title=h1.textContent.trim();
 const originalFull=String(record?.description||copy.querySelector('p')?.textContent||'').trim();
 const proposedSummary=String(record?.summary||'').trim();
 const summary=shortText(proposedSummary||originalFull||'');
 const detailsText=longAfterIntro(originalFull,proposedSummary||summary);
 const aboutContent=detailsText||originalFull||summary;
 const choices=Array.from(aside.querySelectorAll('button[data-package]'));
 const wrap=make('div','lkm-v14 lkm-v16 lkm-v27');wrap.dataset.serviceSlug=slug;
 const intro=make('header','lkm-v14-intro');
 const eyebrow=make('p','lkm-v14-eyebrow',record?.category?`${record.audience==='personal'?'Personal':'Business'} / ${record.category}`:copy.querySelector('.label-kicker')?.textContent||'Our services');
 h1.className='lkm-v14-title';intro.append(eyebrow,h1);
 if(summary&&detailsText)intro.append(make('p','lkm-v14-lead',summary));
 const media=make('section','lkm-v14-media');media.setAttribute('aria-label',title+' — photos and videos');
 const isArtwork=/^(marketing|design|web design|business setup|social media|graphic design)$/i.test(record?.category||'')||/cypruseye|logo|\.svg(?:\?|$)/i.test(record?.cover_url||'');
 if(isArtwork)media.classList.add('lkm-v14-artwork');
 media.append(photoBox);const top=make('div','lkm-v14-top');top.append(media);
 const hero=make('div','lkm-v27-hero');hero.append(intro,top);wrap.append(hero);
 const overview=make('div','lkm-v27-overview');
 if(aboutContent){
  const about=make('section','lkm-v14-about');about.append(make('h2','','About this service'));
  about.append(make('p','lkm-v16-about-text',aboutContent));overview.append(about);
 }
 const serviceFeatures=cleanFeatures(record?.features);
 if(serviceFeatures.length){
  const featuresSection=make('section','lkm-v15-highlights');
  const heading=make('div','lkm-v14-section-head');heading.append(make('h2','','What you get'));
  featuresSection.append(heading);
  const list=make('ul','lkm-v15-feature-grid');
  serviceFeatures.forEach(feature=>list.append(make('li','',feature)));
  featuresSection.append(list);overview.append(featuresSection);
 }
 if(overview.children.length)wrap.append(overview);
 let purchase=null;
 if(choices.length){
  const packages=make('section','lkm-v14-packages');packages.id='lkm-v14-packages';
  const heading=make('div','lkm-v14-section-head');heading.append(make('h2','','Choose your package'));
  heading.append(make('p','lkm-v14-muted','Choose the option that suits you. You can add other services in the next step.'));
  packages.append(heading);
  const cards=make('div','lkm-v14-package-grid');
  choices.forEach((btn,i)=>{
   const card=make('article','lkm-v14-package');if(btn.classList.contains('selected'))card.classList.add('is-selected');
   const packageId=btn.dataset.package||'';
   const recordPackage=(record?.packages||[]).find(p=>p.id===packageId);
   const included=cleanFeatures(recordPackage?.features);
   const text=btn.querySelector('small');const full=text?.textContent.trim()||'';
   if(text){if(included.length)text.remove();else text.textContent=full;}
   btn.classList.add('lkm-v14-package-button');
   btn.setAttribute('aria-pressed',String(btn.classList.contains('selected')));
   const marker=make('span','lkm-v27-radio');marker.setAttribute('aria-hidden','true');btn.prepend(marker);
   card.append(make('p','lkm-v14-plan-number',`Option ${i+1}`),btn);
   if(included.length){
    const features=make('ul','lkm-v15-package-features');
    included.forEach(feature=>features.append(make('li','',feature)));card.append(features);
   }
   cards.append(card);
  });
  packages.append(cards);purchase=make('div','lkm-v27-buyflow');purchase.append(packages);wrap.append(purchase);
 }
 const booking=make('section','lkm-v14-checkout lkm-v27-summary');booking.id='lkm-v14-booking';
 const bookingIntro=make('div','lkm-v16-booking-intro');
 bookingIntro.append(make('p','lkm-v14-eyebrow','Plan & pricing'),make('h2','','Ready to continue?'));
 bookingIntro.append(make('p','lkm-v14-muted',choices.length?'Review your selected package, then add any extras and send one enquiry.':'Tell us about your project, add any other services and send one enquiry.'));
 const bookingAction=make('div','lkm-v16-booking-action');
 const selected=choices.find(p=>p.classList.contains('selected'))||choices[0];
 const selectedName=selected?.querySelector('strong')?.textContent.trim()||'';
 const selectedPrice=selected?.querySelector('.package-cost')?.textContent.trim()||aside.querySelector('.price-big')?.textContent.trim()||'Custom quote';
 bookingAction.append(make('p','lkm-v14-selected-label',choices.length?'Selected package':'Custom quotation'));
 if(selectedName)bookingAction.append(make('p','lkm-v14-chosen-name',selectedName));
 bookingAction.append(make('p','lkm-v14-price',selectedPrice));
 const cta=make('a','button button-dark lkm-v14-cta',choices.length?'Continue with this package →':'Request a quote →');
 cta.href='#/quote';bookingAction.append(cta);
 bookingAction.append(make('p','lkm-v14-note','No payment is taken when you send your enquiry. We confirm the final details before booking.'));
 booking.append(bookingIntro,bookingAction);
 if(purchase)purchase.append(booking);else wrap.append(booking);
 const process=make('section','lkm-v14-process');
 process.append(make('h2','','How it works'));
 const steps=make('ol','lkm-v14-process-list');
 const stepLabels=choices.length?['Choose a package','Customize your request','Send your enquiry']:['Tell us what you need','Add any other services','Send your enquiry'];
 stepLabels.forEach((label,i)=>{const li=make('li');li.append(make('span','lkm-v14-step',String(i+1).padStart(2,'0')),make('span','',label));steps.append(li)});
 process.append(steps);wrap.append(process);
 grid.remove();copy.remove();container.append(wrap);
 scrollToPackageIfNeeded(wrap,slug);
 scheduleExtra();
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})}
// Track a clicked package before site.js synchronously destroys/re-renders the SPA DOM.
document.addEventListener('click',event=>{
 const card=event.target.closest?.('.lkm-v27 .lkm-v14-package');
 if(card&&root.contains(card)&&!event.target.closest?.('button,a,input,select,textarea')){
  // Make the entire option card selectable while retaining the native accessible button.
  card.querySelector('button[data-package]')?.click();return;
 }
 const button=event.target.closest?.('.lkm-v27 button[data-package]');
 if(button&&root.contains(button)){
  pendingPackageScroll={slug:currentSlug(),id:button.dataset.package,viewportTop:Math.max(95,Math.min(button.getBoundingClientRect().top,innerHeight-145))};
 }
 const jump=event.target.closest?.('[data-lkm27-jump]');
 if(jump&&root.contains(jump)){
  event.preventDefault();const target=root.querySelector('#lkm22-projects')||root.querySelector('.lkm-v14-media');
  target?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
 }
},true);
// Only root replacement triggers a full enhance. Child mutations of the supporting sections
// trigger an idempotent positioning pass (projects then reviews at the page end).
new MutationObserver(schedule).observe(root,{childList:true});
new MutationObserver(scheduleExtra).observe(root,{childList:true,subtree:true});
window.addEventListener('hashchange',()=>{pendingPackageScroll=null;schedule();scheduleExtra()});
ensureStyles();
(async()=>{try{catalogue=await window.LKMStore?.publicServices?.()||[];catalogueLoaded=true;}catch(_){catalogue=[];catalogueLoaded=true;}schedule()})();
schedule();
})();

/* Phase 28 — load compact photo/gradient service catalogue, without modifying site.js.
 * This loader is intentionally separated from the Phase 27 individual-service layout. */
(()=>{
 'use strict';
 if(document.querySelector('script[data-lkm28-catalog]'))return;
 const script=document.createElement('script');
 script.src='/assets/lkm-v3/phase28-catalog.js?v=28-1';
 script.dataset.lkm28Catalog='1';
 document.head.append(script);
})();
