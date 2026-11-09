/* LilKangooMedia — optional multi-service quote builder. Additive: does not replace site.js or alter Stripe. */
(()=>{
'use strict';
const root=document.getElementById('main');
const pricing=window.LKMPricing;
const store=window.LKMStore;
if(!root||!pricing||!store)return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>pricing.money(Math.round(n||0));
const safeUrl=url=>/^(https:\/\/[a-z0-9.-]+\/[a-zA-Z0-9_~%\-./?=&]+|\/?assets\/[a-zA-Z0-9%._/-]+)$/i.test(String(url||''))?String(url):'';
const k=slug=>'lkm_bundle_v1_'+slug;
let services=[],loaded=false,primary='',extras={},filter='all',search='',primarySnapshot=null;
let workQueued=false;
const getSelected=()=>Object.keys(extras).filter(slug=>services.some(s=>s.slug===slug&&s.active!==false&&slug!==primary));
const getService=slug=>services.find(x=>x.slug===slug&&x.active!==false);
const getPackage=(s, id)=>Array.isArray(s?.packages)&&s.packages.length?(s.packages.find(p=>p.id===id)||s.packages[0]):null;
const persist=()=>{try{sessionStorage.setItem(k(primary),JSON.stringify(extras))}catch(_){}};
const load=slug=>{if(slug===primary)return;primary=slug;filter='all';search='';primarySnapshot=null;try{const p=JSON.parse(sessionStorage.getItem(k(primary))||'{}');extras=p&&typeof p==='object'&&!Array.isArray(p)?p:{}}catch(_){extras={}};for(const id of Object.keys(extras))if(!getService(id)||id===primary)delete extras[id];};
const selectedService=()=>{let slug='';try{slug=sessionStorage.getItem('lkm_selected_service')||''}catch(_){};return getService(slug)};
const isQuote=()=>/^#\/quote(?:[/?]|$)/.test(location.hash);
const isRequest=()=>/^#\/request(?:[/?]|$)/.test(location.hash);
function mainStateFromQuote(){
 const s=selectedService();if(!s)return null;
 const panel=root.querySelector('.form-grid > .panel');
 const btn=panel?.querySelector('[data-package].selected');
 const pkg=getPackage(s,btn?.dataset.package||'');
 const addons=[...panel?.querySelectorAll('[data-addon]:checked')||[]].map(x=>x.dataset.addon).filter(Boolean);
 const qtyInput=panel?.querySelector('#serviceQty');
 const qty=pricing.variable(pkg)?pricing.safeQty(pkg,qtyInput?.value??pkg?.min_quantity??1):1;
 return {slug:s.slug,pkgId:pkg?.id||'',qty,addons};
}
function mainState(){
 const s=selectedService();if(!s)return null;
 if(isQuote())return mainStateFromQuote();
 if(primarySnapshot?.slug===s.slug)return primarySnapshot;
 const packName=[...root.querySelectorAll('.form-grid aside .estimate-row')].find(x=>x.querySelector('span')?.textContent.trim()==='Package')?.querySelector('strong')?.textContent.trim();
 const pkg=Array.isArray(s.packages)?s.packages.find(p=>p.name===packName)||s.packages[0]:null;
 const unitsText=[...root.querySelectorAll('.form-grid aside .estimate-row')].find(x=>x.querySelector('span')?.textContent.trim()==='Units requested')?.querySelector('strong')?.textContent;
 const qty=pricing.variable(pkg)?pricing.safeQty(pkg,parseFloat(unitsText)||pkg?.min_quantity||1):1;
 return {slug:s.slug,pkgId:pkg?.id||'',qty,addons:[]};
}
function extraRows(){return getSelected().map(slug=>{
 const s=getService(slug),r=extras[slug],pkg=getPackage(s,r.pkgId);
 const qty=pricing.variable(pkg)?pricing.safeQty(pkg,r.qty||pkg.min_quantity||1):1;
 const validAddons=(r.addons||[]).filter(id=>(s.addons||[]).some(a=>a.id===id));
 const est=pricing.estimate(pkg,s.addons||[],validAddons,qty);
 return {service:s,choice:{pkgId:pkg?.id||'',qty,addons:validAddons},pkg,est};
});}
function priceLabel(x){if(!x.available)return 'Custom quote';const part=[];
 if(x.oneTime||(!x.monthly&&!x.yearly))part.push(money(x.oneTime)+(x.monthly||x.yearly?' once':''));
 if(x.monthly)part.push(money(x.monthly)+'/month');
 if(x.yearly)part.push(money(x.yearly)+'/year');
 return part.join(' + ');
}
function totals(){
 const p=mainState(),s=p&&getService(p.slug),pkg=getPackage(s,p?.pkgId);
 const primaryEstimate=pricing.estimate(pkg,s?.addons||[],p?.addons||[],p?.qty||1);
 const rows=extraRows();const all=[primaryEstimate,...rows.map(x=>x.est)];
 return {primaryService:s,primaryPackage:pkg,primaryEstimate,rows,
  oneTime:all.reduce((n,x)=>n+(x.available?x.oneTime:0),0),
  monthly:all.reduce((n,x)=>n+(x.available?x.monthly:0),0),
  yearly:all.reduce((n,x)=>n+(x.available?x.yearly:0),0),
  custom:all.some(x=>!x.available)};
}
function totalLabel(t){const parts=[];if(t.oneTime||(!t.monthly&&!t.yearly&&!t.custom))parts.push(money(t.oneTime)+(t.monthly||t.yearly?' once':''));if(t.monthly)parts.push(money(t.monthly)+'/month');if(t.yearly)parts.push(money(t.yearly)+'/year');return (parts.length?parts.join(' + '):'')+(t.custom?(parts.length?' + custom quote':'Custom quote'):'');}
function collection(){
 const selected=getSelected();const available=services.filter(s=>s.active!==false&&s.slug!==primary&&!selected.includes(s.slug)&&
 (filter==='all'||s.audience===filter||s.category===filter)&&
 (!search||`${s.title} ${s.summary} ${s.category}`.toLowerCase().includes(search)));
 return `<div class="lkm-bundle-catalog">
 <div class="lkm-bundle-catalog-controls"><label class="lkm-bundle-control"><span>Find a service</span><input type="search" data-bundle-search placeholder="Search photography, film, websites…" value="${esc(search)}" autocomplete="off"></label>
 <label class="lkm-bundle-control"><span>Category</span><select data-bundle-filter><option value="all">All services</option><option value="personal" ${filter==='personal'?'selected':''}>Personal</option><option value="business" ${filter==='business'?'selected':''}>Business</option>${[...new Set(services.map(s=>s.category))].filter(Boolean).map(c=>`<option value="${esc(c)}" ${filter===c?'selected':''}>${esc(c)}</option>`).join('')}</select></label></div>
 <div class="lkm-bundle-catalog-list">${available.map(s=>{
 const price=pricing.servicePrice(s);const cover=safeUrl(s.cover_url);
 return `<div class="lkm-bundle-catalog-item"><div class="lkm-bundle-catalog-thumb">${cover?`<img src="${esc(cover)}" alt="" loading="lazy">`:''}</div><div class="lkm-bundle-catalog-info"><strong>${esc(s.title)}</strong><small>${esc(s.category||'Service')} · ${esc(price)}</small></div><button type="button" data-bundle-add="${esc(s.slug)}" aria-label="Add ${esc(s.title)}">+ Add</button></div>`}).join('')||'<p class="lkm-bundle-empty">No other services match this search.</p>'}</div></div>`;
}
function selectedCard(row){const {service:s,choice:r,pkg,est}=row;
 const optionList=(s.packages||[]).map(p=>`<option value="${esc(p.id)}" ${p.id===r.pkgId?'selected':''}>${esc(p.name)} · ${esc(pricing.priceText(p))}</option>`).join('');
 const quantity=pricing.variable(pkg)?`<label class="lkm-bundle-control lkm-bundle-quantity"><span>${esc(pricing.MODE[pricing.mode(pkg)].singular)}${r.qty===1?'':'s'} requested</span><input type="number" data-bundle-qty="${esc(s.slug)}" value="${r.qty}" min="${Number(pkg.min_quantity)>0?pkg.min_quantity:1}" ${Number(pkg.max_quantity)>=Number(pkg.min_quantity||1)?`max="${pkg.max_quantity}"`:''} step="${Number(pkg.quantity_step)>0?pkg.quantity_step:1}"></label>`:'';
 const adds=(s.addons||[]).length?`<div class="lkm-bundle-addons">${s.addons.map(a=>`<label><input type="checkbox" data-bundle-addon="${esc(s.slug)}" data-bundle-addonid="${esc(a.id)}" ${r.addons.includes(a.id)?'checked':''}> <span>${esc(a.name)} <em>+${esc(pricing.addonText(a,pkg))}</em></span></label>`).join('')}</div>`:'';
 return `<article class="lkm-bundle-selected-card" data-bundle-service="${esc(s.slug)}"><div class="lkm-bundle-selected-head"><div><small>${esc(s.category||'Service')}</small><h4>${esc(s.title)}</h4></div><button type="button" data-bundle-remove="${esc(s.slug)}" aria-label="Remove ${esc(s.title)}">Remove ×</button></div>
 <div class="lkm-bundle-fields"><label class="lkm-bundle-control"><span>Package</span>${optionList?`<select data-bundle-package="${esc(s.slug)}">${optionList}</select>`:'<span class="lkm-bundle-quote">Custom quotation</span>'}</label>${quantity}</div>${adds}
 <div class="lkm-bundle-selected-price"><span>Estimated service price</span><strong>${esc(priceLabel(est))}</strong></div></article>`;
}
function configHtml(){const rows=extraRows();return `<div class="lkm-bundle-heading"><span class="lkm-bundle-eyebrow">COMPLETE YOUR PROJECT</span><h3>Add more services</h3><p>Combine photography, film, design or marketing services in one request. Select packages below and review the combined estimate.</p></div>
 ${rows.length?`<div class="lkm-bundle-selected">${rows.map(selectedCard).join('')}</div>`:''}
 <details class="lkm-bundle-browser" ${rows.length?'':'open'}><summary>${rows.length?'+ Add another service':'Browse available services'} <span>${services.filter(s=>s.slug!==primary).length} options</span></summary>${collection()}</details>
 <div class="lkm-bundle-foot"><span>${rows.length} additional service${rows.length===1?'':'s'} selected</span><strong>${rows.length?esc(totalLabel(totals())):'Choose more services above'}</strong></div><p class="lkm-bundle-disclaimer">Estimates are based on current published rates. Custom quotations, availability and the final scope are confirmed before booking. Monthly and annual charges are shown separately.</p>`;}
function extraLineItems(t){return t.rows.map(x=>`<div class="estimate-row lkm-bundle-estimate-row"><span>${esc(x.service.title)}<small>${esc(x.pkg?.name||'Custom quotation')}${pricing.variable(x.pkg)?' × '+x.choice.qty:''}</small></span><strong>${esc(priceLabel(x.est))}</strong></div>`).join('');}
function updateQuoteSummary(){const aside=root.querySelector('.form-grid > aside');if(!aside)return;
 const t=totals();
 const signature=JSON.stringify([t.primaryPackage?.id,t.primaryEstimate,t.rows.map(x=>[x.service.slug,x.pkg?.id,x.choice,x.est])]);
 if(aside.dataset.lkmBundleSignature===signature)return;
 aside.dataset.lkmBundleSignature=signature;
 aside.querySelector('#lkm-bundle-summary')?.remove();
 const total=aside.querySelector('.estimate-total');
 const price=aside.querySelector('.price-big');
 if(price){price.classList.toggle('lkm-bundle-overall',Boolean(t.rows.length));price.textContent=t.rows.length?totalLabel(t):priceLabel(t.primaryEstimate)}
 if(total){total.querySelector('span').textContent=t.rows.length?'Combined estimate':(t.primaryEstimate.monthly||t.primaryEstimate.yearly?'Estimated charges':'Estimated total');total.querySelector('strong').textContent=t.rows.length?totalLabel(t):priceLabel(t.primaryEstimate)}
 if(!t.rows.length)return;
 if(total){total.querySelector('span').textContent='Combined estimate';total.querySelector('strong').textContent=totalLabel(t);total.insertAdjacentHTML('beforebegin',`<div id="lkm-bundle-summary"><div class="lkm-bundle-aside-heading">Additional services</div>${extraLineItems(t)}</div>`)}
}
function attachQuote(){const s=selectedService();if(!s)return;load(s.slug);const panel=root.querySelector('.form-grid > .panel');if(!panel)return;
 const snap=mainStateFromQuote();if(snap)primarySnapshot=snap;
 let zone=panel.querySelector('#lkmBundleConfigurator');if(!zone){zone=document.createElement('section');zone.id='lkmBundleConfigurator';zone.className='lkm-bundle';panel.appendChild(zone)}
 if(zone.dataset.primaryPackage!==snap?.pkgId||!zone.firstChild){zone.innerHTML=configHtml();zone.dataset.primaryPackage=snap?.pkgId||''} // Parent site rerenders on primary changes.
 updateQuoteSummary();}
function attachRequest(){const s=selectedService();if(!s)return;load(s.slug);const t=totals();if(!t.rows.length)return;
 const aside=root.querySelector('.form-grid > aside');if(!aside)return;
 const last=[...aside.querySelectorAll('.estimate-row')].find(x=>x.querySelector('span')?.textContent.trim()==='Estimated total');
 if(last&&!aside.querySelector('#lkm-bundle-request-summary')){
  last.insertAdjacentHTML('beforebegin',`<div id="lkm-bundle-request-summary"><div class="lkm-bundle-aside-heading">Additional services</div>${extraLineItems(t)}</div>`);
  last.querySelector('span').textContent='Combined estimate';last.querySelector('strong').textContent=totalLabel(t);
  const note=document.createElement('p');note.className='notice lkm-bundle-payment-notice';note.textContent='Combined service requests are reviewed together. Sending this enquiry does not charge your card or confirm availability.';aside.append(note);
 }
 const checkout=root.querySelector('#checkoutButton');if(checkout){checkout.disabled=true;checkout.hidden=true;checkout.setAttribute('aria-hidden','true');}
 const send=root.querySelector('#requestSubmit');if(send)send.textContent='Send combined enquiry →';
}
function draw(){if(!loaded||!root)return;if(isQuote())attachQuote();else if(isRequest())attachRequest();}
function schedule(){if(workQueued)return;workQueued=true;requestAnimationFrame(()=>{workQueued=false;draw()})}
function updateConfigurator(){const panel=root.querySelector('#lkmBundleConfigurator');if(!panel)return;
 const wasOpen=panel.querySelector('.lkm-bundle-browser')?.open;
 const focused=document.activeElement?.hasAttribute('data-bundle-search');const caret=focused?document.activeElement.selectionStart:null;
 panel.innerHTML=configHtml();const details=panel.querySelector('.lkm-bundle-browser');if(details&&wasOpen!==undefined)details.open=wasOpen;
 if(focused){let inp=panel.querySelector('[data-bundle-search]');inp?.focus();if(inp&&caret!==null)inp.setSelectionRange(caret,caret)}
 updateQuoteSummary();}
function changeExtra(slug,fn){if(!getService(slug)||slug===primary)return;
 if(!extras[slug])extras[slug]={pkgId:getPackage(getService(slug))?.id||'',qty:1,addons:[]};
 fn(extras[slug]);persist();updateConfigurator();}
root.addEventListener('click',event=>{
 const target=event.target.closest('[data-bundle-add],[data-bundle-remove]');if(!target)return;
 if(target.dataset.bundleAdd){const slug=target.dataset.bundleAdd;changeExtra(slug,()=>{});return}
 if(target.dataset.bundleRemove){delete extras[target.dataset.bundleRemove];persist();updateConfigurator()}
});
root.addEventListener('change',event=>{
 const t=event.target;if(t.matches('[data-bundle-filter]')){filter=t.value;updateConfigurator();return}
 if(t.matches('[data-bundle-package]')){const slug=t.dataset.bundlePackage;changeExtra(slug,r=>{r.pkgId=t.value;r.qty=getPackage(getService(slug),t.value)?.min_quantity||1;r.addons=[]});return}
 if(t.matches('[data-bundle-qty]')){const slug=t.dataset.bundleQty;changeExtra(slug,r=>{r.qty=pricing.safeQty(getPackage(getService(slug),r.pkgId),t.value)});return}
 if(t.matches('[data-bundle-addon]')){const slug=t.dataset.bundleAddon;changeExtra(slug,r=>{const id=t.dataset.bundleAddonid;r.addons=t.checked?[...new Set([...(r.addons||[]),id])]:(r.addons||[]).filter(x=>x!==id)});return}
});
root.addEventListener('input',event=>{if(event.target.matches('[data-bundle-search]')){search=event.target.value.toLowerCase().trim().slice(0,100);updateConfigurator();}});
// Snapshot the primary selection before the native SPA replaces the quote DOM with the request form.
root.addEventListener('click',event=>{if(isQuote()&&event.target.closest('a[href="#/request"]')){primarySnapshot=mainStateFromQuote()||primarySnapshot}},true);
root.addEventListener('submit',event=>{
 if(event.target.id!=='bookingForm'||!getSelected().length)return;
 const t=totals(),form=event.target,brief=form.querySelector('textarea[name="message"]');if(!brief)return;
 const prefix='\n\n[ADDITIONAL SERVICES]\n',suffix='\n[END ADDITIONAL SERVICES]';
 const base=brief.value.split(prefix)[0].trimEnd();
 const lines=t.rows.map((r,i)=>{
  const add=(r.choice.addons||[]).map(id=>r.service.addons?.find(a=>a.id===id)?.name).filter(Boolean);
  return `${i+1}. ${r.service.title} | ${r.pkg?.name||'Custom quote'}${pricing.variable(r.pkg)?' | Qty '+r.choice.qty:''} | ${priceLabel(r.est)}${add.length?' | Extras: '+add.join(', '):''}`;
 });
 const note=prefix+lines.join('\n')+'\nCombined estimate: '+totalLabel(t)+suffix;
 // The current website appends the primary package summary after this text and the server has a 3000-char limit.
 if(base.length+note.length>2600){event.preventDefault();event.stopImmediatePropagation();const status=form.querySelector('#requestStatus');if(status){status.textContent='Your project brief is too long to include all selected services. Please shorten it before sending.';status.style.color='#aa423a'}brief.focus();return}
 brief.value=base+note;
},true);
// Bundles are quote-only: Stripe checkout currently accepts just one service/package.
root.addEventListener('click',event=>{if(getSelected().length&&event.target.closest('#checkoutButton')){event.preventDefault();event.stopImmediatePropagation()}},true);
new MutationObserver(schedule).observe(root,{childList:true});
window.addEventListener('hashchange',()=>{if(location.hash==='#/thanks'&&primary){try{sessionStorage.removeItem(k(primary))}catch(_){}extras={};primarySnapshot=null}schedule()});
(async()=>{try{services=await store.publicServices();loaded=true;schedule()}catch(e){console.warn('Additional services unavailable:',e)}})();
})();
