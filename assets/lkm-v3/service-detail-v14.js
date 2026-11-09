/* LilKangooMedia Phase 16 — universal service detail layout.
   Additive UI only: preserves existing SPA selection, gallery/viewer, Phase 13 bundles,
   Supabase catalogue, form submission and checkout logic unchanged. */
(()=>{
'use strict';
const root=document.getElementById('main');
if(!root)return;
let catalogue=[],catalogueLoaded=false,queued=false;
const sourceFor=slug=>catalogue.find(x=>x.slug===slug);
const cleanFeatures=value=>Array.isArray(value)?[...new Set(value.filter(x=>typeof x==='string').map(x=>x.trim()).filter(Boolean))].slice(0,20):[];
const make=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el};
const shortText=(text,max=215)=>{
 const s=String(text||'').replace(/\s+/g,' ').trim();
 if(s.length<=max)return s;
 const cut=s.slice(0,max+1), sentence=cut.match(/^.{55,}?[.!?](?:\s|$)/);
 if(sentence)return sentence[0].trim();
 return cut.slice(0,Math.max(80,cut.lastIndexOf(' '))).trim().replace(/[,:;\-\s]+$/,'')+'…';
};
const longAfterIntro=(full,intro)=>{
 const f=String(full||'').trim(),s=String(intro||'').trim();
 if(!f)return '';
 if(s && f.toLowerCase().startsWith(s.toLowerCase()))return f.slice(s.length).trim().replace(/^[,;:\.\-\s]+/,'');
 return f;
};
function currentSlug(){const match=location.hash.match(/^#\/service\/([^?#]+)/);if(!match)return '';try{return decodeURIComponent(match[1])}catch{return match[1]}}
function enhance(){
 const slug=currentSlug();if(!slug||!catalogueLoaded)return;
 const container=root.querySelector('.container');
 const grid=container?.querySelector(':scope > .detail-grid');
 const copy=container?.querySelector(':scope > .detail-copy');
 if(!grid||!copy||container.querySelector(':scope > .lkm-v14'))return;
 const photoBox=grid.children[0],aside=grid.querySelector(':scope > aside');
 const h1=copy.querySelector('h1');
 if(!photoBox||!aside||!h1)return;
 const record=sourceFor(slug);
 const title=h1.textContent.trim();
 const originalFull=String(record?.description||copy.querySelector('p')?.textContent||'').trim();
 const proposedSummary=String(record?.summary||'').trim();
 const summary=shortText(proposedSummary||originalFull||'');
 // A full service description must never be repeated verbatim immediately after the intro.
 const detailsText=longAfterIntro(originalFull,proposedSummary||summary);
 const aboutContent=detailsText||originalFull||summary;
 const choices=Array.from(aside.querySelectorAll('button[data-package]'));
 const wrap=make('div','lkm-v14 lkm-v16');wrap.dataset.serviceSlug=slug;
 const intro=make('header','lkm-v14-intro');
 const eyebrow=make('p','lkm-v14-eyebrow',record?.category?`${record.audience==='personal'?'Personal':'Business'} / ${record.category}`:copy.querySelector('.label-kicker')?.textContent||'Our services');
 h1.className='lkm-v14-title';intro.append(eyebrow,h1);
 // If short and long descriptions are identical, show the text once under About.
 if(summary&&detailsText)intro.append(make('p','lkm-v14-lead',summary));
 const media=make('section','lkm-v14-media');media.setAttribute('aria-label',title+' — photos and videos');
 const isArtwork=/^(marketing|design|web design|business setup|social media|graphic design)$/i.test(record?.category||'')||/cypruseye|logo|\.svg(?:\?|$)/i.test(record?.cover_url||'');
 if(isArtwork)media.classList.add('lkm-v14-artwork');
 media.append(photoBox);const top=make('div','lkm-v14-top');top.append(media);wrap.append(intro,top);

 // Reading order: About → What we offer → Packages → How it works → Next step.
 if(aboutContent){
  const about=make('section','lkm-v14-about');about.append(make('h2','','About this service'));
  about.append(make('p','lkm-v16-about-text',aboutContent));wrap.append(about);
 }
 const serviceFeatures=cleanFeatures(record?.features);
 if(serviceFeatures.length){
  const featuresSection=make('section','lkm-v15-highlights');
  const heading=make('div','lkm-v14-section-head');heading.append(make('h2','','What we offer'));
  featuresSection.append(heading);
  const list=make('ul','lkm-v15-feature-grid');
  serviceFeatures.forEach(feature=>list.append(make('li','',feature)));
  featuresSection.append(list);wrap.append(featuresSection);
 }
 if(choices.length){
  const packages=make('section','lkm-v14-packages');packages.id='lkm-v14-packages';
  const heading=make('div','lkm-v14-section-head');heading.append(make('h2','','Available packages'));
  heading.append(make('p','lkm-v14-muted','Choose the option that suits you. You can add other services in the next step.'));
  packages.append(heading);
  const cards=make('div','lkm-v14-package-grid');
  choices.forEach((btn,i)=>{
   const card=make('article','lkm-v14-package');if(btn.classList.contains('selected'))card.classList.add('is-selected');
   const packageId=btn.dataset.package||'';
   const recordPackage=(record?.packages||[]).find(p=>p.id===packageId);
   const included=cleanFeatures(recordPackage?.features);
   const text=btn.querySelector('small');const full=text?.textContent.trim()||'';
   // Feature lists carry the deliverables when present; otherwise show the entire original description.
   if(text){if(included.length)text.remove();else text.textContent=full;}
   btn.classList.add('lkm-v14-package-button');
   btn.setAttribute('aria-pressed',String(btn.classList.contains('selected')));
   card.append(make('p','lkm-v14-plan-number',`Option ${i+1}`),btn);
   if(included.length){
    const features=make('ul','lkm-v15-package-features');
    included.forEach(feature=>features.append(make('li','',feature)));
    card.append(features);
   }
   cards.append(card);
  });
  packages.append(cards);wrap.append(packages);
 }
 const process=make('section','lkm-v14-process');
 process.append(make('h2','','How it works'));
 const steps=make('ol','lkm-v14-process-list');
 const stepLabels=choices.length?
  ['Choose a package','Customize your request','Send your enquiry']:
  ['Tell us what you need','Add any other services','Send your enquiry'];
 stepLabels.forEach((label,i)=>{const li=make('li');li.append(make('span','lkm-v14-step',String(i+1).padStart(2,'0')),make('span','',label));steps.append(li)});
 process.append(steps);wrap.append(process);

 // The booking/price summary must come last; the existing SPA still owns the actual pricing state.
 const booking=make('section','lkm-v14-checkout');booking.id='lkm-v14-booking';
 const bookingIntro=make('div','lkm-v16-booking-intro');
 bookingIntro.append(make('p','lkm-v14-eyebrow','Plan & pricing'),make('h2','','Ready to continue?'));
 bookingIntro.append(make('p','lkm-v14-muted',choices.length?'Review your chosen package, then add any extras and send one enquiry.':'Tell us about your project, add any other services and send one enquiry.'));
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
 booking.append(bookingIntro,bookingAction);wrap.append(booking);
 grid.remove();copy.remove();container.append(wrap);
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})}
// Observe only replacements of #main's direct children, not our own reorganization below them.
new MutationObserver(schedule).observe(root,{childList:true});
window.addEventListener('hashchange',schedule);
(async()=>{try{catalogue=await window.LKMStore?.publicServices?.()||[];catalogueLoaded=true;}catch(_){catalogue=[];catalogueLoaded=true;}schedule()})();
schedule();
})();
