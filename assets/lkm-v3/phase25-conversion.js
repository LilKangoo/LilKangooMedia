/* Phase 25.3 — additive conversion UX.
 * No direct forms, pricing, Stripe, contact submission or booking mutations.
 * A full-page start link ensures the existing SPA selects the intended service,
 * even after the visitor previously configured a DIFFERENT service. */
(()=>{'use strict';
 if(window.__lkm253Loaded)return;window.__lkm253Loaded=true;
 const root=document.getElementById('main');if(!root)return;
 const slugFromHref=href=>{
  const m=String(href||'').match(/^#\/service\/([^?#]+)/);if(!m)return '';
  try{const s=decodeURIComponent(m[1]);return /^[a-z0-9-]{1,90}$/.test(s)?s:'';}catch{return ''}
 };
 const startHref=s=>'/?lkm_service='+encodeURIComponent(s)+'#/quote';
 const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
 const sticky=make('div','lkm253-flow');sticky.id='lkm253Flow';sticky.hidden=true;
 sticky.setAttribute('aria-label','Continue your service enquiry');
 const action=make('button','lkm253-flow-button','Continue to details →');action.type='button';
 sticky.append(action);document.body.append(sticky);
 let queued=false;
 function addCardActions(){
  for(const card of root.querySelectorAll('.service-card')){
   if(card.querySelector('.lkm253-card-action'))continue;
   const slug=slugFromHref(card.querySelector('.service-photo')?.getAttribute('href'));
   const body=card.querySelector('.service-body');if(!slug||!body)continue;
   const link=make('a','lkm253-card-action','Build a quote →');link.href=startHref(slug);
   link.dataset.lkm253Slug=slug;link.setAttribute('aria-label','Build a quote for '+(card.querySelector('h3')?.textContent?.trim()||'this service'));
   const quick=body.querySelector('[data-lkm20-slug]');if(quick)quick.after(link);else body.append(link);
  }
 }
 function flow(){
  const hash=String(window.location.hash||'');
  const quote=/^#\/quote(?:[?]|$)/.test(hash),request=/^#\/request(?:[?]|$)/.test(hash);
  const show=quote||request;
  sticky.hidden=!show;
  document.body.classList.toggle('lkm253-flow-active',show);
  if(quote){action.textContent='Continue to your details →';action.dataset.mode='quote';}
  else if(request){action.textContent='Complete your enquiry ↓';action.dataset.mode='request';}
  const dialog=document.getElementById('lkm20-quick-dialog');sticky.classList.toggle('lkm253-flow-dialog',Boolean(dialog?.open));
 }
 function requestTarget(){
  const form=root.querySelector('#bookingForm');if(!form)return null;
  // Guide to the first unanswered required field; NEVER submit on behalf of the visitor.
  const required=[...form.querySelectorAll('[required]')].filter(n=>!n.disabled&&n.getClientRects().length);
  return required.find(n=>n.type==='checkbox'?!n.checked:!String(n.value||'').trim())||form.querySelector('#requestSubmit')||form;
 }
 action.addEventListener('click',()=>{
  if(action.dataset.mode==='quote'){
   // Click the existing in-page link so Phase 18/13 handlers save the package and bundled services.
   // Changing location.hash directly would silently drop their session snapshots.
   const existing=root.querySelector('a[href="#/request"]');
   if(existing&&root.querySelector('.form-grid')&&window.location.hash.startsWith('#/quote'))existing.click();
   return;
  }
  const target=requestTarget();if(!target)return;
  target.scrollIntoView({behavior:'smooth',block:'center'});
  if(target.matches('input,textarea,select'))target.focus({preventScroll:true});
 });
 // Existing booking, quick enquiry, payment and analytics listeners remain authoritative.
 function enhance(){addCardActions();flow()}
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})}
 new MutationObserver(schedule).observe(root,{childList:true});
 window.addEventListener('hashchange',schedule);
 document.addEventListener('toggle',e=>{if(e.target?.id==='lkm20-quick-dialog')schedule()},true);
 document.addEventListener('click',e=>{
  const link=e.target.closest?.('[data-lkm253-slug]');if(!link)return;
  const slug=link.dataset.lkm253Slug;
  // This is a click signal, NOT a lead, sale or completed booking.
  try{if(localStorage.getItem('lkm_analytics_consent')==='yes'&&typeof window.gtag==='function')
    window.gtag('event','lkm_cta_click',{service_id:slug,action_type:'direct_quote',placement:'service_card'})}
  catch{/* Consent/storage failures cannot break navigation. */}
 },true);
 schedule();
})();
