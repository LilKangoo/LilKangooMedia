/* LilKangooMedia Phase 14 — universal service detail layout.
   Additive UI only: preserves existing SPA selection, gallery/viewer, Phase 13 bundles,
   Supabase catalogue, form submission and checkout logic unchanged. */
(()=>{
'use strict';
const root=document.getElementById('main');
if(!root)return;
let catalogue=[],catalogueLoaded=false,queued=false;
const sourceFor=slug=>catalogue.find(x=>x.slug===slug);
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
 const slug=currentSlug();if(!slug)return;
 const container=root.querySelector('.container');
 const grid=container?.querySelector(':scope > .detail-grid');
 const copy=container?.querySelector(':scope > .detail-copy');
 if(!grid||!copy||container.querySelector(':scope > .lkm-v14'))return;
 const photoBox=grid.children[0],aside=grid.querySelector(':scope > aside');
 const h1=copy.querySelector('h1');
 if(!photoBox||!aside||!h1)return;
 const record=sourceFor(slug);
 const title=h1.textContent.trim();
 const originalFull=record?.description||copy.querySelector('p')?.textContent||'';
 const proposedSummary=record?.summary||'';
 const summary=shortText(proposedSummary||originalFull||'Explore this LilKangooMedia service and choose the option that suits your project.');
 const detailsText=longAfterIntro(originalFull,summary);
 const choices=Array.from(aside.querySelectorAll('button[data-package]'));
 const wrap=make('div','lkm-v14');wrap.dataset.serviceSlug=slug;
 const intro=make('header','lkm-v14-intro');
 const eyebrow=make('p','lkm-v14-eyebrow',record?.category?`${record.audience==='personal'?'Personal':'Business'} / ${record.category}`:copy.querySelector('.label-kicker')?.textContent||'Creative services');
 h1.className='lkm-v14-title';
 intro.append(eyebrow,h1,make('p','lkm-v14-lead',summary));
 const top=make('div','lkm-v14-top');
 const media=make('section','lkm-v14-media');media.setAttribute('aria-label',title+' — photos and videos');
 const isArtwork=/^(marketing|design|web design|business setup|social media|graphic design)$/i.test(record?.category||'')||/cypruseye|logo|\.svg(?:\?|$)/i.test(record?.cover_url||'');
 if(isArtwork)media.classList.add('lkm-v14-artwork');
 media.append(photoBox);
 const info=make('aside','lkm-v14-checkout');
 const selected=choices.find(p=>p.classList.contains('selected'))||choices[0];
 const selectedName=selected?.querySelector('strong')?.textContent.trim()||'';
 const selectedPrice=selected?.querySelector('.package-cost')?.textContent.trim()||aside.querySelector('.price-big')?.textContent.trim()||'Custom quote';
 info.append(make('p','lkm-v14-eyebrow','Plan & pricing'));
 info.append(make('p','lkm-v14-selected-label',choices.length?'Selected package':'Custom quotation'));
 info.append(make('h2','lkm-v14-price',selectedPrice));
 if(selectedName)info.append(make('p','lkm-v14-chosen-name',selectedName));
 const cta=make('a','button button-dark lkm-v14-cta',choices.length?'Configure package & request →':'Request a tailored quote →');cta.href='#/quote';info.append(cta);
 if(choices.length>1){const jump=make('button','lkm-v14-compare','Compare all '+choices.length+' packages ↓');jump.type='button';jump.dataset.v14Jump='';info.append(jump)}
 info.append(make('p','lkm-v14-note','No payment is taken when submitting an enquiry. Availability and final scope are confirmed before booking.'));
 top.append(media,info);
 wrap.append(intro,top);
 if(choices.length){
  const packages=make('section','lkm-v14-packages');packages.id='lkm-v14-packages';
  const heading=make('div','lkm-v14-section-head');heading.append(make('p','lkm-v14-eyebrow','Choose your option'),make('h2','','Available packages'));
  const sub=make('p','lkm-v14-muted', 'Select a package, then configure it and add other services if needed.');
  heading.append(sub);packages.append(heading);
  const cards=make('div','lkm-v14-package-grid');
  choices.forEach((btn,i)=>{
   const card=make('article','lkm-v14-package');if(btn.classList.contains('selected'))card.classList.add('is-selected');
   const text=btn.querySelector('small');let full=text?.textContent.trim()||'';
   if(text){text.textContent=shortText(full,115);}
   btn.classList.add('lkm-v14-package-button');btn.setAttribute('aria-pressed',String(btn.classList.contains('selected')));
   const caption=make('p','lkm-v14-plan-number',`Option ${i+1}`);card.append(caption,btn);
   if(full.length>115){const details=make('details','lkm-v14-package-details');const summary=make('summary','', 'Read full package details');details.append(summary,make('p','',full));card.append(details)}
   cards.append(card);
  });
  packages.append(cards);wrap.append(packages);
 }
 const about=make('section','lkm-v14-about');
 if(detailsText && (detailsText.length>24 || !choices.length)){
  const aboutDetails=make('details','lkm-v14-about-details');
  const aboutSummary=make('summary','','About this service');
  aboutDetails.append(aboutSummary,make('p','',detailsText));
  about.append(aboutDetails);
 }
 const process=make('div','lkm-v14-process');
 process.append(make('h2','','How it works'));
 const steps=make('ol','lkm-v14-process-list');
 [['01','Choose your package'],['02','Customize your request'],['03','Send your enquiry']].forEach(([n,label])=>{const li=make('li');li.append(make('span','lkm-v14-step',n),make('span','',label));steps.append(li)});
 process.append(steps);about.append(process);wrap.append(about);
 grid.remove();copy.remove();container.append(wrap);
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})}
root.addEventListener('click',e=>{const btn=e.target.closest('[data-v14-jump]');if(btn){root.querySelector('#lkm-v14-packages')?.scrollIntoView({behavior:'smooth',block:'start'})}});
// Observe only replacements of #main's direct children, not our own reorganization below them.
new MutationObserver(schedule).observe(root,{childList:true});
window.addEventListener('hashchange',schedule);
(async()=>{try{catalogue=await window.LKMStore?.publicServices?.()||[];catalogueLoaded=true;}catch(_){catalogue=[];}schedule()})();
schedule();
})();
