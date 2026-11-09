/* LilKangooMedia Phase 18 — independent options from one service + custom requirements.
   Additive to the Phase 13 multi-service quote. Enquiries only; no checkout/Stripe changes.
   All package amounts originate from current Supabase data, not hardcoded JS prices. */
(()=>{
'use strict';
const root=document.getElementById('main'),store=window.LKMStore,pricing=window.LKMPricing;
if(!root||!store||!pricing)return;
const money=pricing.money;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let services=[],ready=false,queued=false,selectionChanged=false;
const slug=()=>{try{return sessionStorage.getItem('lkm_selected_service')||''}catch{return ''}};
const service=()=>services.find(s=>s.slug===slug()&&s.active!==false);
const storeKey=s=>'lkm_phase18_options_'+s;
const defaultState=()=>({extras:[],custom:false,customText:''});
const getState=s=>{try{const d=JSON.parse(sessionStorage.getItem(storeKey(s))||'{}');return {...defaultState(),...d,extras:Array.isArray(d.extras)?d.extras:[]}}catch{return defaultState()}};
const setState=(s,v)=>{try{sessionStorage.setItem(storeKey(s),JSON.stringify(v))}catch{}};
const currentNative=()=>root.querySelector('.form-grid > .panel [data-package].selected')?.dataset.package||'';
const getPackage=(s,id)=>Array.isArray(s?.packages)?s.packages.find(p=>p.id===id):null;
const nativeAddonIds=()=>[...root.querySelectorAll('.form-grid > .panel [data-addon]:checked')].map(x=>x.dataset.addon);
const nativeQty=()=>root.querySelector('.form-grid > .panel #serviceQty')?.value||1;
const isQuotePackage=p=>!p||pricing.mode(p)==='quote';
const combinable=p=>p&&p.combinable===true&&!isQuotePackage(p);
const group=p=>String(p?.choice_group||p?.id||'');
function validExtras(s,primary,extras){
 const used=new Set(primary&&combinable(primary)?[group(primary)]:[]);
 const result=[];
 for(const id of extras){const p=getPackage(s,id);if(!combinable(p)||id===primary?.id||used.has(group(p)))continue;used.add(group(p));result.push(id)}
 return result;
}
const snapshotKey=s=>'lkm_phase18_other_services_'+s;
function extraServiceRows(){
 return [...root.querySelectorAll('#lkmBundleConfigurator .lkm-bundle-selected-card')].map(el=>{
  const s=services.find(x=>x.slug===el.dataset.bundleService);if(!s)return null;
  const pkgId=el.querySelector('[data-bundle-package]')?.value||getPackage(s,s.packages?.[0]?.id)?.id||'';
  return {slug:s.slug,pkgId,qty:Number(el.querySelector('[data-bundle-qty]')?.value||1),addons:[...el.querySelectorAll('[data-bundle-addon]:checked')].map(x=>x.dataset.bundleAddonid)};
 }).filter(Boolean);
}
function bundleRows(fromRequest=false){
 let rows=[];
 if(fromRequest){try{rows=JSON.parse(sessionStorage.getItem(snapshotKey(slug()))||'[]')}catch{rows=[]}}
 else rows=extraServiceRows();
 return rows.map(r=>{let s=services.find(x=>x.slug===r.slug),p=getPackage(s,r.pkgId);if(!s)return null;
  return {service:s,package:p,estimate:pricing.estimate(p,s.addons||[],r.addons||[],r.qty||1),qty:r.qty||1,addons:r.addons||[]};
 }).filter(Boolean);
}
function sumTotals(items,custom){
 const ests=items.map(x=>x.estimate),moneySum=(key)=>ests.reduce((v,e)=>v+(e.available?(e[key]||0):0),0);
 const v={one:moneySum('oneTime'),monthly:moneySum('monthly'),yearly:moneySum('yearly'),custom:!!custom||ests.some(e=>!e.available),from:items.some(x=>x.package?.show_from===true)};
 const amounts=[];if(v.one)amounts.push(money(v.one)+(v.monthly||v.yearly?' one-time':''));
 if(v.monthly)amounts.push(money(v.monthly)+'/month');if(v.yearly)amounts.push(money(v.yearly)+'/year');
 v.label=amounts.length?(v.from?'From ':'')+amounts.join(' + '):'Custom quote';
 if(v.custom&&amounts.length)v.label+=' + custom quote';
 return v;
}
function calculate(s,primary,st,request=false){
 const selectedExtra=validExtras(s,primary,st.extras),nativeExtraIds=request?[]:nativeAddonIds();
 let mainEst;
 if(request){
  // The main request page does not display chosen extras. Stored snapshot captures them.
  try{const x=JSON.parse(sessionStorage.getItem('lkm_phase18_main_'+s.slug)||'null');
   mainEst=x?pricing.estimate(primary,s.addons||[],x.addons||[],x.qty||1):pricing.estimate(primary,[],[],1);
  }catch{mainEst=pricing.estimate(primary,[],[],1)}
 }else mainEst=pricing.estimate(primary,s.addons||[],nativeExtraIds,nativeQty());
 const items=[{service:s,package:primary,estimate:mainEst}];
 selectedExtra.forEach(id=>{const p=getPackage(s,id);items.push({service:s,package:p,estimate:pricing.estimate(p,[],[],1)})});
 const other=bundleRows(request);items.push(...other);
 return {items,other,extras:selectedExtra,custom:st.custom||isQuotePackage(primary),totals:sumTotals(items,st.custom||isQuotePackage(primary))};
}
function selectedTextRow(x){return `<li><span>${esc(x.service.title)} — ${esc(x.package?.name||'Custom quote')}</span><strong>${esc(x.estimate.available?pricing.priceText(x.package):'Custom quote')}</strong></li>`}
function renderQuote(){
 const s=service(),panel=root.querySelector('.form-grid > .panel'),aside=root.querySelector('.form-grid > aside');if(!s||!panel||!aside)return;
 const native=getPackage(s,currentNative()||s.packages?.[0]?.id),st=getState(s.slug);
 st.extras=validExtras(s,native,st.extras);setState(s.slug,st);
 const opts=(s.packages||[]).filter(combinable),chosen=calculate(s,native,st);
 let area=panel.querySelector('#lkm18-options');
 if(!area){area=document.createElement('section');area.id='lkm18-options';area.className='lkm18-options';panel.insertBefore(area,panel.querySelector('#lkmBundleConfigurator')||null)}
 const list=opts.filter(p=>p.id!==native?.id);
 const used=new Set([...(combinable(native)?[group(native)]:[]),...st.extras.map(id=>group(getPackage(s,id)))]);
 const code=JSON.stringify([native?.id,st.extras,st.custom,opts.map(x=>x.id),list.map(x=>x.price_cents)]);
 if(area.dataset.signature!==code){
  area.dataset.signature=code;
  area.innerHTML=`${list.length?`<div class="lkm18-title"><h3>Combine services within this category</h3><p>You can add independently priced options to your main package. Alternative sizes of the same package cannot be combined.</p></div><div class="lkm18-extra-list">${list.map(p=>{
    const checked=st.extras.includes(p.id),conflict=!checked&&used.has(group(p));
    return `<label class="lkm18-extra-option ${conflict?'lkm18-conflict':''}"><input type="checkbox" data-lkm18-extra="${esc(p.id)}" ${checked?'checked':''} ${conflict?'disabled':''}><span><strong>${esc(p.name)}</strong><small>${esc(p.description||'')}</small></span><em>${esc(pricing.priceText(p))}</em></label>`;
   }).join('')}</div>`:''}
   <div class="lkm18-custom"><label><input type="checkbox" data-lkm18-custom ${st.custom||isQuotePackage(native)?'checked':''} ${isQuotePackage(native)?'disabled':''}> <strong>I need something different — Custom quote</strong></label><p>Tell us what else you need. This can be requested with any selected package.</p><label class="lkm18-custom-note" ${st.custom||isQuotePackage(native)?'':'hidden'}><span>Additional requirements</span><textarea data-lkm18-note rows="3" maxlength="950" placeholder="Different deliverables, dates, locations or special requirements…">${esc(st.customText)}</textarea></label></div>`;
 }
 // Phase 13 owns the existing multi-service sidebar. Overlay only when same-service packages differ.
 const override=chosen.extras.length>0||(isQuotePackage(native)&&chosen.items.some(x=>x.estimate.available));
 aside.classList.toggle('lkm18-has-subtotal',override);
 let box=aside.querySelector('#lkm18-total');
 if(override){
  const signature=JSON.stringify([chosen.extras,chosen.items.map(x=>[x.package?.id,x.estimate]),chosen.totals]);
  if(!box){box=document.createElement('section');box.id='lkm18-total';box.className='lkm18-total';aside.querySelector('.estimate-total')?.insertAdjacentElement('afterend',box)}
  if(box&&box.dataset.signature!==signature){box.dataset.signature=signature;box.innerHTML=`<p class="lkm18-kicker">Complete selection estimate</p><ul>${chosen.items.map(selectedTextRow).join('')}</ul><div class="lkm18-total-label"><span>Estimated charges</span><strong>${esc(chosen.totals.label)}</strong></div><small>One-time, monthly and annual charges are shown separately. Subject to confirmation.</small>`}
 }else if(box)box.remove();
 const note=aside.querySelector('#lkm18-custom-indicator');
 if(st.custom&&!override){if(!note){const el=document.createElement('p');el.id='lkm18-custom-indicator';el.className='notice';el.textContent='Custom requirements will be quoted separately and will not appear in the fixed-price estimate.';aside.append(el)}}
 else note?.remove();
}
function renderRequest(){
 const s=service(),aside=root.querySelector('.form-grid > aside'),form=root.querySelector('#bookingForm');if(!s||!aside||!form)return;
 let snap;try{snap=JSON.parse(sessionStorage.getItem('lkm_phase18_main_'+s.slug)||'null')}catch{}
 const native=getPackage(s,snap?.pkgId||s.packages?.[0]?.id),st=getState(s.slug),chosen=calculate(s,native,st,true);
 const override=chosen.extras.length>0||(isQuotePackage(native)&&chosen.items.some(x=>x.estimate.available));
 aside.classList.toggle('lkm18-has-request-total',override);
 for(const row of aside.querySelectorAll(':scope > .estimate-row')){
   if(['Package','Estimated total'].includes(row.querySelector('span')?.textContent.trim()))row.classList.toggle('lkm18-hide-native',override);
 }
 let box=aside.querySelector('#lkm18-request-total');
 if(override||st.custom||isQuotePackage(native)){
  if(!box){box=document.createElement('section');box.id='lkm18-request-total';box.className='lkm18-total';aside.append(box)}
  const signature=JSON.stringify([chosen.items.map(x=>[x.package?.id,x.estimate]),chosen.totals,st.customText]);
  if(box.dataset.signature!==signature){box.dataset.signature=signature;box.innerHTML=`<p class="lkm18-kicker">Your full request</p><ul>${chosen.items.map(selectedTextRow).join('')}</ul><div class="lkm18-total-label"><span>Estimate</span><strong>${esc(chosen.totals.label)}</strong></div>${st.customText?`<p class="lkm18-custom-echo"><strong>Additional request:</strong> ${esc(st.customText)}</p>`:''}<small>Final pricing and availability are confirmed by our team before any booking.</small>`}
 }else box?.remove();
 const checkout=root.querySelector('#checkoutButton');if(checkout&&(chosen.extras.length||st.custom||isQuotePackage(native))){checkout.hidden=true;checkout.disabled=true;checkout.setAttribute('aria-hidden','true')}
}
function draw(){if(!ready)return;if(/^#\/quote(?:[/?]|$)/.test(location.hash))renderQuote();else if(/^#\/request(?:[/?]|$)/.test(location.hash))renderRequest()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;draw()})}
root.addEventListener('change',e=>{
 const input=e.target;if(!input.matches('[data-lkm18-extra],[data-lkm18-custom]'))return;
 const s=service();if(!s)return;const st=getState(s.slug);
 if(input.hasAttribute('data-lkm18-extra')){
  const id=input.dataset.lkm18Extra;
  st.extras=input.checked?[...new Set([...st.extras,id])]:st.extras.filter(x=>x!==id);
 }else st.custom=input.checked;
 setState(s.slug,st);root.querySelector('#lkm18-options')?.removeAttribute('data-signature');schedule();
});
root.addEventListener('input',e=>{
 if(!e.target.matches('[data-lkm18-note]'))return;
 const s=service();if(!s)return;const st=getState(s.slug);st.customText=e.target.value.slice(0,950);setState(s.slug,st);
});
function saveSnapshot(){
 const s=service();if(!s)return;const native=getPackage(s,currentNative()||s.packages?.[0]?.id);
 const snap={pkgId:native?.id||'',addons:nativeAddonIds(),qty:nativeQty()};
 try{sessionStorage.setItem('lkm_phase18_main_'+s.slug,JSON.stringify(snap));sessionStorage.setItem(snapshotKey(s.slug),JSON.stringify(extraServiceRows()))}catch{}
}
root.addEventListener('click',e=>{if(/^#\/quote/.test(location.hash)&&e.target.closest('a[href="#/request"]'))saveSnapshot()},true);
// Persist actual same-service package choices and custom text into the existing enquiry payload.
// Phase 13 adds other services to this same brief; keep both pieces of information.
root.addEventListener('submit',e=>{
 if(e.target.id!=='bookingForm')return;
 const s=service();if(!s)return;const st=getState(s.slug);
 let snap;try{snap=JSON.parse(sessionStorage.getItem('lkm_phase18_main_'+s.slug)||'null')}catch{}
 const native=getPackage(s,snap?.pkgId||s.packages?.[0]?.id),extra=validExtras(s,native,st.extras);
 if(!extra.length&&!st.custom&&!isQuotePackage(native))return;
 const field=e.target.querySelector('textarea[name="message"]');if(!field)return;
 const info=['[CUSTOMIZED MAIN SERVICE]', ...extra.map((id,i)=>{
   const p=getPackage(s,id);return (i+1)+'. Additional package: '+p.name+' — '+pricing.priceText(p);
 }),...(st.custom||isQuotePackage(native)?['Custom quote requested: '+(st.customText.trim()||'Details in project brief')]:[]),'[END CUSTOMIZED MAIN SERVICE]'].join('\n');
 if(field.value.includes('[CUSTOMIZED MAIN SERVICE]'))return;
 if(field.value.length+info.length+2>2450){e.preventDefault();e.stopImmediatePropagation();const status=e.target.querySelector('#requestStatus');if(status){status.textContent='Please shorten your project brief so all selected services fit in the enquiry.';status.style.color='#aa423a'}field.focus();return}
 field.value+='\n\n'+info;
},true);
root.addEventListener('click',e=>{
 if(!e.target.closest('#checkoutButton'))return;
 const s=service();if(!s)return;let snap;try{snap=JSON.parse(sessionStorage.getItem('lkm_phase18_main_'+s.slug)||'null')}catch{}
 const p=getPackage(s,snap?.pkgId||s.packages?.[0]?.id),st=getState(s.slug);
 if(st.custom||isQuotePackage(p)||validExtras(s,p,st.extras).length){e.preventDefault();e.stopImmediatePropagation();}
},true);
new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
window.addEventListener('hashchange',()=>{if(location.hash==='#/thanks'){const s=slug();if(s){try{sessionStorage.removeItem(storeKey(s));sessionStorage.removeItem(snapshotKey(s));sessionStorage.removeItem('lkm_phase18_main_'+s)}catch{}}}schedule()});
(async()=>{try{services=await store.publicServices();ready=true;schedule()}catch(e){console.warn('Phase18 options unavailable:',e)}})();
})();
