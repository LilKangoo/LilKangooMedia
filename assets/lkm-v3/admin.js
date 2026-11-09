/* Pricing calculations bundled into this script to avoid new HTML asset dependencies. */
/* LilKangooMedia pricing presentation/estimate utilities.
   No payment processing here. Server must independently validate all amounts. */
(function (global) {
  'use strict';
  const MODE = Object.freeze({
    fixed: { label: 'Fixed package', suffix: '', singular: 'package' },
    hour: { label: 'Per hour', suffix: '/hour', singular: 'hour' },
    day: { label: 'Per day', suffix: '/day', singular: 'day' },
    person: { label: 'Per person', suffix: '/person', singular: 'person' },
    item: { label: 'Per item', suffix: '/item', singular: 'item' },
    month: { label: 'Monthly subscription', suffix: '/month', singular: 'month' },
    year: { label: 'Annual subscription', suffix: '/year', singular: 'year' },
    quote: { label: 'Custom quotation', suffix: '', singular: 'project' }
  });
  const ADDON_MODE = Object.freeze({
    once: 'One-time', unit: 'Per selected unit', month: 'Per month', year: 'Per year'
  });
  const money = cents => new Intl.NumberFormat('en-IE', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: Math.round(Number(cents)) % 100 ? 2 : 0
  }).format(Number(cents || 0) / 100);
  const mode = pkg => MODE[pkg?.pricing_model] ? pkg.pricing_model : 'fixed';
  const addonMode = addon => ADDON_MODE[addon?.billing_model] ? addon.billing_model : 'once';
  const variable = pkg => ['hour','day','person','item'].includes(mode(pkg));
  const recurring = pkg => ['month','year'].includes(mode(pkg));
  const pluralUnit = (pkg, count) => { const n = MODE[mode(pkg)].singular; return Number(count)===1?n:(n==='person'?'people':n+'s'); };
  const validCents = n => Number.isSafeInteger(Number(n)) && Number(n) >= 0 && Number(n) <= 1e9;
  function safeQty(pkg, value) {
    const minimum = Number(pkg?.min_quantity) > 0 ? Number(pkg.min_quantity) : 1;
    const maximum = Number(pkg?.max_quantity) >= minimum ? Number(pkg.max_quantity) : null;
    const step = Number(pkg?.quantity_step) > 0 ? Number(pkg.quantity_step) : 1;
    let qty = Number(value);
    if (!Number.isFinite(qty)) qty = minimum;
    qty = Math.max(minimum, maximum == null ? qty : Math.min(maximum, qty));
    // Quantize starting from minimum to keep e.g. 1.5h / 0.5h increment sensible.
    const steps = Math.round((qty - minimum) / step);
    return Number(Math.max(minimum, Math.min(maximum == null ? Infinity : maximum, minimum + steps * step)).toFixed(4));
  }
  const priceText = pkg => {
    if (!pkg || mode(pkg) === 'quote' || !validCents(pkg.price_cents)) return 'Custom quote';
    return `${pkg.show_from ? 'From ' : ''}${money(pkg.price_cents)}${MODE[mode(pkg)].suffix}`;
  };
  function servicePrice(service) {
    const packages = Array.isArray(service?.packages) ? service.packages : [];
    const firstPriced = packages.find(p => mode(p) !== 'quote' && validCents(p.price_cents));
    return firstPriced ? priceText(firstPriced) : 'Custom quote';
  }
  function servicePriceLabel(service) {
    const p = (service?.packages || []).find(x => mode(x) !== 'quote' && validCents(x.price_cents));
    if (!p) return 'Individually quoted';
    if (p.show_from || service.packages.length > 1) return 'Packages from';
    return MODE[mode(p)].label;
  }
  function addonText(a, pkg) {
    const am = addonMode(a);
    if (am === 'once') return money(a.price_cents);
    if (am === 'month') return `${money(a.price_cents)}/month`;
    if (am === 'year') return `${money(a.price_cents)}/year`;
    return `${money(a.price_cents)}/${MODE[mode(pkg)].singular}`;
  }
  function estimate(pkg, addons = [], chosenAddonIds = [], quantity) {
    if (!pkg || mode(pkg) === 'quote' || !validCents(pkg.price_cents)) return {
      available: false, oneTime: 0, monthly: 0, yearly: 0, qty: 1, lineItems: []
    };
    const m = mode(pkg), qty = variable(pkg) ? safeQty(pkg, quantity) : 1;
    const result = {available:true, oneTime:0, monthly:0, yearly:0, qty, lineItems:[]};
    const addLine = (label, amount, billing) => {
      if (!validCents(amount)) return;
      amount = Math.round(amount);
      if (billing === 'monthly') result.monthly += amount;
      else if (billing === 'yearly') result.yearly += amount;
      else result.oneTime += amount;
      result.lineItems.push({label, amount, billing});
    };
    const base = Math.round(Number(pkg.price_cents) * qty);
    addLine((pkg.name || 'Package') + (variable(pkg) ? ` × ${qty}` : ''), base, m === 'month' ? 'monthly' : m === 'year' ? 'yearly' : 'once');
    if (validCents(pkg.setup_fee_cents) && Number(pkg.setup_fee_cents) > 0)
      addLine('One-time setup fee', Number(pkg.setup_fee_cents), 'once');
    for (const a of addons) {
      if (!chosenAddonIds.includes(a.id) || !validCents(a.price_cents)) continue;
      const am = addonMode(a);
      if (am === 'month') addLine(a.name, a.price_cents, 'monthly');
      else if (am === 'year') addLine(a.name, a.price_cents, 'yearly');
      else if (am === 'unit') addLine(a.name + (variable(pkg) ? ` × ${qty}` : ''), Math.round(a.price_cents * qty), m === 'month' ? 'monthly' : m === 'year' ? 'yearly' : 'once');
      else addLine(a.name, a.price_cents, 'once');
    }
    return result;
  }
  function directPaymentEligible(pkg, addons = [], ids = []) {
    // Current Checkout Function only knows fixed one-time package amounts and fixed addons.
    return mode(pkg) === 'fixed' && !Number(pkg?.setup_fee_cents || 0) && addons.every(a => !ids.includes(a.id) || addonMode(a) === 'once');
  }
  global.LKMPricing = {MODE, ADDON_MODE, money, mode, addonMode, variable, recurring, safeQty,
    validCents, pluralUnit, priceText, servicePrice, servicePriceLabel, addonText, estimate, directPaymentEligible};
})(window);

(function(){
'use strict';
const root=document.getElementById('adminRoot'),store=window.LKMStore,live=store.configured,pricing=window.LKMPricing;
let services=[],leads=[],orders=[],picker=null,tab=(["services","leads","articles","galleries","media"].includes(location.hash.slice(1))?location.hash.slice(1):"services"),selected='',newMode=false,editorOpen=false,editorDirty=false,authorized=false;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const money=n=>new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR',maximumFractionDigits:n%100?2:0}).format(n/100);
const banner=()=>live?'<div class="notice good">Changes to published services are reflected on the website.</div>':'<div class="notice">DEMO MODE. Your changes appear on the public preview only in this browser. They are NOT saved to Supabase or visible to customers on other devices. Configure <code>config.js</code> and the SQL schema to enable the real shared admin.</div>';
const input=(label,id,value='',type='text',extras='')=>`<div class="field"><label for="${id}">${label}</label><input id="${id}" type="${type}" value="${esc(value)}" ${extras}></div>`;
const select=(label,id,items,val)=>`<div class="field"><label for="${id}">${label}</label><select id="${id}">${items.map(o=>`<option value="${esc(o[0])}" ${val===o[0]?'selected':''}>${esc(o[1])}</option>`).join('')}</select></div>`;
const act=(name,buttonClass='button-dark')=>`<button class="button ${buttonClass}" type="button" data-admin="${name}">`;
const slugify=v=>v.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90);
function show(msg){const x=document.getElementById('toast');x.textContent=msg;x.hidden=false;clearTimeout(x.t);x.t=setTimeout(()=>x.hidden=true,4500)}
function adminLogin(){root.innerHTML=`<div class="admin-auth"><img src="./assets/lkm-v3/brand/logo-black-orange.png" alt="LilKangooMedia" style="width:96px;height:96px;display:block;margin:0 auto 20px"><h1>Admin sign-in</h1><p style="color:var(--muted);margin-bottom:23px">Sign in with your Supabase Auth account. Only listed administrators can manage services.</p><form id="authForm">${input('Email address','authEmail','','email','required autocomplete="email"')}${input('Password','authPassword','','password','required autocomplete="current-password"')}<button class="button button-dark" type="submit" style="width:100%">Sign in securely</button></form><p id="authError" role="alert" style="color:#a53636"></p></div>`}
const bar=()=>`<aside class="admin-sidebar" aria-label="Administration sections">
  <div class="admin-nav-label">MANAGEMENT</div>
  <a class="${tab==='services'?'active':''}" href="#services" data-tab="services">▣ Services & pricing</a>
  <a class="${tab==='leads'?'active':''}" href="#leads" data-tab="leads">▤ Enquiries & bookings</a>
  <div class="admin-nav-label">CONTENT</div>
  <a class="${tab==='articles'?'active':''}" href="#articles" data-tab="articles">▤ Articles & SEO</a>
  <a class="${tab==='galleries'?'active':''}" href="#galleries" data-tab="galleries">▧ Portfolio & galleries</a>
  <a class="${tab==='media'?'active':''}" href="#media" data-tab="media">▦ Media library</a>
  <div class="admin-nav-label">PREVIEW</div>
  <a href="/blog.html" target="_blank" rel="noopener">↗ Public articles</a>
  <a href="/portfolio.html" target="_blank" rel="noopener">↗ Public portfolio</a>
  <a href="/" target="_blank" rel="noopener">↗ Website</a>
  <a href="#" data-admin="logout">⇥ ${live?'Sign out':'Reset preview'}</a>
</aside>`;
function getCurrent(){if(newMode)return {slug:'',title:'',audience:'business',category:'Photography',summary:'',description:'',cover_url:'',gallery_urls:[],packages:[],addons:[],booking_mode:'enquiry',deposit_percent:0,active:true,featured:false,sort_order:(services.length+1)*10};return services.find(x=>x.slug===selected)||services[0]}
function discardConfirmed(){return !editorDirty||confirm('Discard unsaved changes to this service?')}
function closeEditor(){editorOpen=false;newMode=false;editorDirty=false;dashboard()}

// Phase 15: editable service and package feature lists; independent of pricing.
const lkmFeaturesList=(features=[],kind='service')=>{
 const safe=Array.isArray(features)?features.filter(x=>typeof x==='string'&&x.trim()).slice(0,20):[];
 return `<section class="lkm-feature-editor" data-feature-scope="${kind}">
   <div class="lkm-feature-title"><strong>${kind==='service'?'Service highlights':'Included in this package'}</strong>
   <small>${kind==='service'?'Describe what we offer across this service.':'List only what is included in this specific option.'}</small></div>
   <div class="lkm-feature-list">${safe.map((f,i)=>lkmFeatureRow(f,i)).join('')}</div>
   <button class="button button-light lkm-feature-add" type="button" data-feature-action="add">+ Add feature</button>
 </section>`;
};
const lkmFeatureRow=(value='',position=0)=>`<div class="lkm-feature-row">
 <span class="lkm-feature-grip" aria-hidden="true">✓</span>
 <input type="text" data-feature-value maxlength="180" aria-label="Feature ${position+1}" value="${esc(value)}" placeholder="What is included / available?">
 <div class="lkm-feature-actions">
 <button type="button" data-feature-action="up" aria-label="Move feature up" title="Move up">↑</button>
 <button type="button" data-feature-action="down" aria-label="Move feature down" title="Move down">↓</button>
 <button type="button" data-feature-action="remove" aria-label="Remove feature" title="Remove">×</button>
 </div></div>`;
const lkmReadFeatures=element=>{
 const items=[...(element?.querySelectorAll(':scope > .lkm-feature-list > .lkm-feature-row > [data-feature-value]')||[])].map(x=>x.value.trim()).filter(Boolean);
 if(items.length>20)throw new Error('Use up to 20 features per list.');
 if(items.some(x=>x.length>180))throw new Error('Each feature must be under 180 characters.');
 return [...new Set(items)];
};

const pkgRow=(p={},i=0)=>{
 const mode=pricing.mode(p),quantity=pricing.variable(p);
 const options=Object.entries(pricing.MODE).map(([key,val])=>`<option value="${key}" ${mode===key?'selected':''}>${esc(val.label)}</option>`).join('');
 return `<div class="package-editor lkm-price-row" data-package-row data-package-id="${esc(p.id||'')}">
 <div class="lkm-price-row-head"><strong>Price option</strong><div class="lkm-price-reorder"><button type="button" class="button button-light" data-package-move="up" title="Move price option up" aria-label="Move package up">↑</button><button type="button" class="button button-light" data-package-move="down" title="Move price option down" aria-label="Move package down">↓</button><button type="button" class="button button-light" data-remove-package>Remove package ×</button></div></div>
 <div class="lkm-price-inputs"><div class="field"><label>Package name *</label><input data-pkg-name value="${esc(p.name||'')}" placeholder="e.g. 1-hour photo session"></div>
 <div class="field"><label>Billing model *</label><select data-pkg-model>${options}</select></div>
 <div class="field lkm-priced-value" ${mode==='quote'?'hidden':''}><label>Price (€) ${mode==='fixed'?'for package':'per selected unit'}</label><input data-pkg-price type="number" min="0" step="0.01" value="${Number(p.price_cents||0)/100}"></div>
 <div class="field lkm-priced-from" ${mode==='quote'?'hidden':''}><label><input type="checkbox" data-pkg-from ${p.show_from?'checked':''}> Display as “From”</label></div>
 <div class="field lkm-priced-units" ${!quantity?'hidden':''}><label>Minimum units</label><input data-pkg-min type="number" min="0.25" max="99999" step="0.25" value="${Number(p.min_quantity)>0?p.min_quantity:1}"></div>
 <div class="field lkm-priced-units" ${!quantity?'hidden':''}><label>Maximum units (empty = none)</label><input data-pkg-max type="number" min="0.25" max="99999" step="0.25" value="${Number(p.max_quantity)>0?p.max_quantity:''}"></div>
 <div class="field lkm-priced-units" ${!quantity?'hidden':''}><label>Unit increment</label><select data-pkg-step>${[0.25,0.5,1,2,5,10].map(v=>`<option value="${v}" ${Number(p.quantity_step||1)===v?'selected':''}>${v}</option>`).join('')}</select></div>
 <div class="field lkm-priced-term" ${!pricing.recurring(p)?'hidden':''}><label>Minimum commitment (months, optional)</label><input data-pkg-term type="number" min="0" max="120" step="1" value="${p.minimum_term_months||''}"></div>
 <div class="field lkm-priced-setup" ${!pricing.recurring(p)?'hidden':''}><label>One-time setup fee (€), optional</label><input data-pkg-setup type="number" min="0" step="0.01" value="${Number(p.setup_fee_cents||0)/100}"></div></div>
 <div class="field"><label>Package summary (short)</label><textarea data-pkg-desc rows="2">${esc(p.description||'')}</textarea></div>${lkmFeaturesList(p.features||[],'package')}</div>`;
};
function syncPackageRow(row){
 const mode=row.querySelector('[data-pkg-model]').value;
 const isUnit=['hour','day','person','item'].includes(mode),isTerm=['month','year'].includes(mode),isQuote=mode==='quote';
 row.querySelectorAll('.lkm-priced-units').forEach(x=>x.hidden=!isUnit);
 row.querySelectorAll('.lkm-priced-term,.lkm-priced-setup').forEach(x=>x.hidden=!isTerm);
 row.querySelectorAll('.lkm-priced-value,.lkm-priced-from').forEach(x=>x.hidden=isQuote);
}
const thumbHtml=(url,index,canRemove=true)=>`<div class="lkm-service-thumb"><img src="${esc(url)}" alt="Service photograph" loading="lazy"><small title="${esc(url)}">${esc(url.split('/').pop().split('?')[0].replace(/%20/gi,' ').slice(0,36))}</small>${canRemove?`<button type="button" data-service-image-remove="${index}" aria-label="Remove image from service">Remove ×</button>`:''}</div>`;
function serviceThumbs(){
 const gallery=(root.querySelector('#svcGallery')?.value||'').split('\n').map(x=>x.trim()).filter(Boolean);
 const current=root.querySelector('#svcCover')?.value.trim();const coverBox=root.querySelector('#svcCoverPreview');const galleryBox=root.querySelector('#svcGalleryPreview');
 if(coverBox)coverBox.innerHTML=current?thumbHtml(current,'cover',true):'<p class="hint">No cover selected.</p>';
 if(galleryBox)galleryBox.innerHTML=gallery.map((url,i)=>thumbHtml(url,i)).join('')||'<p class="hint">No gallery images selected.</p>';
}
let pickerSearch='',pickerGallery='all',pickerSource='galleries',pickerShow=60,pickerImages=[],pickerGalleries=[],pickerCatalog=[];
async function pickerFetch(){
 if(!live)throw new Error('Sign in to Supabase first.');
 const token=await store.authenticatedToken();const base=window.LKM_CONFIG.SUPABASE_URL.replace(/\/$/,'');
 const req=async path=>{const r=await fetch(base+'/rest/v1/'+path,{headers:{apikey:window.LKM_CONFIG.SUPABASE_ANON_KEY,Authorization:'Bearer '+token}});if(!r.ok)throw new Error('Unable to load photos ('+r.status+')');return r.json()};
 const [g,photos]=await Promise.all([req('portfolio_galleries?select=id,title&limit=1000'),req('portfolio_images?select=image_url,gallery_id,alt_text&order=display_order.asc&limit=1000')]);
 pickerGalleries=g;pickerImages=photos;
}
function pickerResults(){
 if(!picker)return '';
 const query=pickerSearch.toLowerCase();
 const all=pickerSource==='galleries'?pickerImages.filter(x=>pickerGallery==='all'||x.gallery_id===pickerGallery).map(x=>({url:x.image_url,label:x.alt_text||x.image_url.split('/').pop()})):
  pickerCatalog.map(x=>({url:x.url,label:x.file}));
 const filtered=all.filter(x=>!query||(x.label||'').toLowerCase().includes(query)||x.url.toLowerCase().includes(query));
 return `<p class="hint">${filtered.length.toLocaleString()} available photos · choose a thumbnail to use it.</p><div class="lkm-picker-grid">${filtered.slice(0,pickerShow).map(x=>`<button type="button" data-pick-url="${esc(x.url)}" title="Choose ${esc(x.label)}"><img loading="lazy" src="${esc(x.url)}" alt="${esc(x.label)}"><small>${esc(x.label)}</small></button>`).join('')}</div>${filtered.length>pickerShow?'<button class="button button-light" type="button" data-picker-action="more">Load more photos</button>':''}`;
}
function pickerView(){
 if(!picker)return;
 const modal=document.getElementById('lkmServiceImagePicker');if(!modal)return;
 modal.innerHTML=`<div class="lkm-picker-dialog" role="dialog" aria-modal="true" aria-label="Choose service image">
 <div class="lkm-picker-head"><h2>Choose ${picker==='cover'?'cover photo':'gallery photos'}</h2><button type="button" data-picker-action="close" aria-label="Close">×</button></div>
 <div class="lkm-picker-controls"><label>Source<select id="pickerSource"><option value="galleries" ${pickerSource==='galleries'?'selected':''}>Portfolio galleries</option><option value="library" ${pickerSource==='library'?'selected':''}>Media Library (GitHub)</option></select></label>
 ${pickerSource==='galleries'?`<label>Gallery<select id="pickerGallery"><option value="all">All galleries</option>${pickerGalleries.map(x=>`<option value="${esc(x.id)}" ${pickerGallery===x.id?'selected':''}>${esc(x.title)}</option>`).join('')}</select></label>`:''}
 <label>Search<input type="search" id="pickerSearch" placeholder="Search images" value="${esc(pickerSearch)}"></label></div>
 <div class="lkm-picker-results">${pickerResults()}</div></div>`;
}
async function openImagePicker(kind){
 picker=kind;pickerSearch='';pickerShow=60;pickerGallery='all';pickerSource='galleries';
 let modal=document.createElement('div');modal.id='lkmServiceImagePicker';modal.className='lkm-picker-overlay';root.appendChild(modal);
 modal.innerHTML='<div class="lkm-picker-dialog"><p>Loading available photographs…</p></div>';
 try{await pickerFetch();pickerView()}catch(err){modal.innerHTML=`<div class="lkm-picker-dialog"><p role="alert">${esc(err.message)}</p><button type="button" data-picker-action="close">Close</button></div>`}
}
function closeImagePicker(){document.getElementById('lkmServiceImagePicker')?.remove();picker=null}
function addPickedImage(url){editorDirty=true;if(picker==='cover'){root.querySelector('#svcCover').value=url}else{
 const textarea=root.querySelector('#svcGallery');const prev=textarea.value.split('\n').map(x=>x.trim()).filter(Boolean);if(!prev.includes(url))textarea.value=[...prev,url].join('\n');}
 serviceThumbs();show('Photo selected. Click Save changes to publish this service.');
}
const addonRow=(a={})=>`<div class="package-editor lkm-price-addon" data-addon-row data-addon-id="${esc(a.id||'')}">
<div class="lkm-price-inputs"><div class="field"><label>Optional extra</label><input data-addon-name value="${esc(a.name||'')}"></div>
<div class="field"><label>Charge (€)</label><input data-addon-price type="number" min="0" step="0.01" value="${Number(a.price_cents||0)/100}"></div>
<div class="field"><label>How to charge</label><select data-addon-model>${Object.entries(pricing.ADDON_MODE).map(([key,label])=>`<option value="${key}" ${pricing.addonMode(a)===key?'selected':''}>${esc(label)}</option>`).join('')}</select></div></div>
<button type="button" class="button button-light" data-remove-addon>Remove extra ×</button></div>`;
function editor(){let x=getCurrent();return `<div class="panel admin-editor"><div class="lkm-editor-head"><div><div class="label-kicker">Service configuration</div><h3>${newMode?'Create new service':'Edit service'}</h3></div><button class="button button-light" type="button" data-admin="close">Collapse ↑</button></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${input('Service name *','svcTitle',x?.title||'','text','required maxlength="120"')}${input('URL slug *','svcSlug',x?.slug||'','text','required maxlength="90"')}</div>${select('Customer category','svcAudience',[['personal','Personal'],['business','Business']],x?.audience||'business')}<div class="field"><label for="svcCategory">Service category</label><input id="svcCategory" list="lkmCategories" value="${esc(x?.category||'Photography')}" required maxlength="80"><datalist id="lkmCategories">${[...new Set(['Photography','Videography','Wedding','Experiences','Events','Social Media','Design','Web Design','Business Setup','Marketing',...services.map(s=>s.category)])].map(cat=>`<option value="${esc(cat)}"></option>`).join('')}</datalist></div><div class="field"><label for="svcSummary">Short summary</label><textarea id="svcSummary" rows="2">${esc(x?.summary||'')}</textarea></div><div class="field"><label for="svcDescription">Full description</label><textarea id="svcDescription" rows="6">${esc(x?.description||'')}</textarea></div>${lkmFeaturesList(x?.features||[],'service')}<div class="field"><label>Cover photograph</label><div id="svcCoverPreview" class="lkm-service-image-grid">${x?.cover_url?thumbHtml(x.cover_url,'cover'):''}</div><button type="button" class="button button-light" data-admin="pick-cover">Choose existing photo</button><details class="lkm-service-urls"><summary>Advanced: cover URL</summary><input id="svcCover" value="${esc(x?.cover_url||'')}"></details></div><div class="field"><label>Service gallery photographs</label><div id="svcGalleryPreview" class="lkm-service-image-grid">${(x?.gallery_urls||[]).map((url,i)=>thumbHtml(url,i)).join('')}</div><button type="button" class="button button-light" data-admin="pick-gallery">+ Add from existing photos</button><details class="lkm-service-urls"><summary>Advanced: gallery URLs</summary><textarea id="svcGallery" rows="4">${esc((x?.gallery_urls||[]).join('\n'))}</textarea></details></div>${live?`<div class="field"><label for="imageUpload">Upload image to Supabase Storage</label><input type="file" id="imageUpload" accept="image/jpeg,image/png,image/webp"><button class="button button-light" type="button" data-admin="upload" style="margin-top:10px">Upload to gallery</button><small>Uses authenticated admin account and private storage upload policy.</small></div>`:''}<hr><h3>Packages & prices</h3><p class="hint">Each package can use a different pricing model. Existing fixed-price packages retain their amounts. Monthly and annual plans are enquiry-only until recurring billing is configured.</p><div id="packagesEditor">${(x?.packages||[]).map(pkgRow).join('')}</div><button type="button" class="button button-light" data-admin="addpackage">+ Add package</button><hr><h3>Optional extras</h3><p class="hint">Add a one-time fee, charge per selected unit, or specify a monthly or annual extra. No recurring payments are taken automatically.</p><div id="addonsEditor">${(x?.addons||[]).map(addonRow).join('')}</div><button type="button" class="button button-light" data-admin="addaddon">+ Add extra</button><hr>${select('Booking behaviour','svcMode',[['enquiry','Enquiry only — no payment'],['deposit','Stripe deposit — availability pending confirmation'],['full','Stripe full payment — availability pending confirmation']],x?.booking_mode||'enquiry')}${input('Deposit percent (0–100)','svcDeposit',x?.deposit_percent||0,'number','min="0" max="100" step="1"')}${input('Display order','svcOrder',x?.sort_order||10,'number','step="1"')}<div class="field"><label><input id="svcFeatured" type="checkbox" ${x?.featured?'checked':''}> Feature on homepage</label></div><div class="field"><label><input id="svcActive" type="checkbox" ${x?.active!==false?'checked':''}> Published / visible</label></div><p class="notice">Published prices appear on the website. Any estimate is subject to confirmation. Recurring plans and unit-based prices are handled by enquiry only; automatic recurring payments require a separate billing setup.</p><div class="form-actions"><button class="button button-dark" type="button" data-admin="save">${newMode?'Create service':'Save changes'}</button><button class="button button-light" type="button" data-admin="cancel">Cancel</button>${!newMode?`<button class="button button-light" type="button" data-admin="hide">Unpublish</button>`:''}</div><p id="editorStatus" role="alert" style="color:#a23e2f"></p></div>`}
function servicesView(){
 const rows=services.map(x=>{
  const open=editorOpen&&!newMode&&selected===x.slug;
  const label=pricing.servicePrice(x);
  return `<div class="lkm-service-row-wrap" data-service-key="${esc(x.slug)}">
   <div class="lkm-service-row ${open?'is-open':''}"><img src="${esc(x.cover_url||'./assets/lkm-v3/preview/brand.jpg')}" alt="" onerror="this.onerror=null;this.src='./assets/lkm-v3/preview/brand.jpg'">
   <div class="lkm-service-summary"><strong>${esc(x.title)}</strong><small>${esc(x.audience)} · ${esc(x.category)} · ${esc(label)}</small></div>
   <span class="lkm-service-badge ${x.active===false?'is-hidden':''}">${x.active===false?'Hidden':'Published'}</span>
   <button class="button button-light lkm-service-toggle" type="button" data-select="${esc(x.slug)}" aria-expanded="${open}" aria-label="${open?'Collapse':'Edit'} ${esc(x.title)}">${open?'Collapse ↑':'Edit ↓'}</button></div>
   ${open?`<div class="lkm-service-expanded" id="lkmEditor">${editor()}</div>`:''}
  </div>`;
 }).join('');
 return `<div class="admin-header"><div><div class="label-kicker">LilKangooMedia</div><h1 style="font-size:34px;letter-spacing:-1.6px;margin:5px 0">Services & pricing</h1><p style="color:var(--muted);margin:0">Open a service to edit its details, photos, packages and pricing.</p></div><button class="button button-dark" data-admin="new">+ New service</button></div>
 ${banner()}<div class="lkm-services-stack">${newMode?`<div class="lkm-service-expanded lkm-new-service" id="lkmEditor">${editor()}</div>`:''}${rows}</div>`;
}

function leadsView(){return `<div class="admin-header"><div><div class="label-kicker">Customer requests</div><h1 style="font-size:34px;letter-spacing:-1.6px;margin:5px 0">Enquiries & bookings</h1><p style="color:var(--muted)">Requests saved by the secure server endpoint.</p></div><button class="button button-light" data-admin="refresh">Refresh</button></div>${banner()}${live&&orders.length?`<div class="subhead" style="margin-top:25px">Stripe payment requests (${orders.length})</div>${orders.map(o=>`<article class="panel" style="margin:10px 0"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><h3>${esc(o.customer_name||o.customer_email)}</h3><span class="feature-label">${esc(o.status||'paid')}</span></div><p>${esc(o.service_slug)} / ${esc(o.package_id)}</p><div class="estimate-row"><span>Amount paid</span><strong>${money(o.paid_amount_cents||0)}</strong></div><div class="estimate-row"><span>Preferred date</span><strong>${esc(o.preferred_date||'Not supplied')}</strong></div><div class="hint">${esc(o.customer_email)}</div></article>`).join('')}`:''}${!live?'<div class="notice">Demo mode cannot receive real leads. Configure the backend and its API keys first.</div>':leads.length?leads.map(l=>`<article class="panel" style="margin:10px 0"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><h3>${esc(l.customer_name||'Unknown customer')}</h3><span class="feature-label">${esc(l.status||'new')}</span></div><p><a href="mailto:${esc(l.customer_email)}" style="text-decoration:underline">${esc(l.customer_email)}</a> · ${esc(l.service_slug||l.service_type||'General enquiry')}</p><p class="hint">${esc(l.created_at||'')}</p><p style="margin-top:13px;white-space:pre-wrap">${esc(l.message||'')}</p></article>`).join(''):'<div class="status-empty">No customer enquiries found.</div>'}`}
function dashboard(){
  const cms=document.getElementById('cmsRoot');
  // Keep the CMS DOM alive across sidebar changes; never lose its listeners or unsaved inputs by destroying its root.
  if(cms&&root.contains(cms)){
    cms.hidden=true;
    const toast=document.getElementById('toast');
    document.body.insertBefore(cms,toast||null);
  }
  const cmsTab=['articles','galleries','media'].includes(tab);
  root.innerHTML=`<div class="admin-shell">${bar()}<section class="admin-main">${cmsTab?'<div id="cmsMount"></div>':tab==='services'?servicesView():leadsView()}</section></div>`;
  if(cmsTab){
    if(!cms){show('Content module missing. Please deploy cms.js.');return;}
    root.querySelector('#cmsMount').appendChild(cms);
    cms.hidden=false;
    if(window.LKMCMS){window.LKMCMS.setTab(tab==='articles'?'posts':tab).catch(e=>show('Content module: '+e.message));}
    else show('CMS module not loaded. Check the browser console.');
  }
}
async function refresh(){services=await store.adminServices();if(editorOpen&&!newMode&&!services.some(x=>x.slug===selected)){editorOpen=false;selected=''}if(live){leads=await store.getLeads();orders=await store.getOrders()}dashboard()}
function collect(){
 const get=id=>root.querySelector('#'+id);
 let title=get('svcTitle').value.trim(),slug=slugify(get('svcSlug').value||title);
 if(!title||!slug)throw new Error('Service name and slug are required.');
 if(!get('svcCategory').value.trim())throw new Error('Choose a service category.');
 let ids=new Set();
 const packages=[...root.querySelectorAll('[data-package-row]')].map((row,i)=>{
  const name=row.querySelector('[data-pkg-name]').value.trim(),model=row.querySelector('[data-pkg-model]').value;
  const euro=Number(row.querySelector('[data-pkg-price]').value);
  if(!name||!pricing.MODE[model])throw new Error('Each price option needs a name and a valid billing model.');
  if(model!=='quote'&&(!Number.isFinite(euro)||euro<0||euro>1e7))throw new Error('Enter a valid non-negative price for '+name+'.');
  const price_cents=model==='quote'?0:Math.round(euro*100);
  let id=row.dataset.packageId || slugify(name)+'-'+i;
  if(ids.has(id)){id=slugify(name)+'-'+i;}
  if(ids.has(id))throw new Error('Duplicate package identifiers.');ids.add(id);
  const previous=(getCurrent()?.packages||[]).find(x=>x.id===id)||{};
  const obj={...previous,id,name,price_cents,pricing_model:model,description:row.querySelector('[data-pkg-desc]').value.trim(),features:lkmReadFeatures(row.querySelector('[data-feature-scope="package"]')),show_from:row.querySelector('[data-pkg-from]').checked};
  delete obj.min_quantity;delete obj.max_quantity;delete obj.quantity_step;delete obj.minimum_term_months;delete obj.setup_fee_cents;
  if(['hour','day','person','item'].includes(model)){
    let min=Number(row.querySelector('[data-pkg-min]').value),maxStr=row.querySelector('[data-pkg-max]').value,step=Number(row.querySelector('[data-pkg-step]').value);
    let max=maxStr.trim()===''?null:Number(maxStr);
    if(!Number.isFinite(min)||min<=0||!Number.isFinite(step)||step<=0||max!==null&&(!Number.isFinite(max)||max<min))throw new Error('Check minimum, maximum and step for '+name+'.');
    obj.min_quantity=min;obj.quantity_step=step;if(max!==null)obj.max_quantity=max;
  }
  if(['month','year'].includes(model)){
    const term=Number(row.querySelector('[data-pkg-term]').value||0),setup=Number(row.querySelector('[data-pkg-setup]').value||0);
    if(!Number.isInteger(term)||term<0||term>120||!Number.isFinite(setup)||setup<0||setup>1e7)throw new Error('Invalid subscription conditions for '+name+'.');
    if(term)obj.minimum_term_months=term;
    if(setup)obj.setup_fee_cents=Math.round(setup*100);
  }
  return obj;
 });
 const addons=[...root.querySelectorAll('[data-addon-row]')].map((row,i)=>{
  const name=row.querySelector('[data-addon-name]').value.trim(),price=Number(row.querySelector('[data-addon-price]').value);
  const billing_model=row.querySelector('[data-addon-model]').value;
  if(!name||!Number.isFinite(price)||price<0||price>1e7||!pricing.ADDON_MODE[billing_model])throw new Error('Each extra requires a name, price and billing model.');
  const id=row.dataset.addonId||slugify(name)+'-'+i;const previous=(getCurrent()?.addons||[]).find(x=>x.id===id)||{};
  return {...previous,id,name,price_cents:Math.round(price*100),billing_model};
 });
 const mode=get('svcMode').value,deposit=Number(get('svcDeposit').value||0);
 if(mode==='deposit'&&(deposit<=0||deposit>100))throw new Error('Deposit percentage must be between 1 and 100.');
 if(mode!=='enquiry' && (packages.some(p=>p.pricing_model!=='fixed'||p.setup_fee_cents)||addons.some(a=>a.billing_model!=='once')))
   throw new Error('Hourly, variable or recurring packages cannot use one-time online checkout. Select Enquiry only until Stripe billing supports these prices.');
 return {slug,title,audience:get('svcAudience').value,category:get('svcCategory').value.trim(),summary:get('svcSummary').value.trim(),description:get('svcDescription').value.trim(),features:lkmReadFeatures(root.querySelector('[data-feature-scope="service"]')),cover_url:get('svcCover').value.trim(),gallery_urls:get('svcGallery').value.split('\n').map(t=>t.trim()).filter(Boolean),packages,addons,booking_mode:mode,deposit_percent:deposit,sort_order:Number(get('svcOrder').value)||10,active:get('svcActive').checked,featured:get('svcFeatured').checked};
}

async function upload(){if(!live)return;let input=root.querySelector('#imageUpload'),file=input?.files?.[0];if(!file)return show('Select an image.');if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024)return show('Use JPEG, PNG or WebP under 8 MB.');let slug=slugify(root.querySelector('#svcSlug').value)||'media';let key=slug+'/'+Date.now()+'-'+slugify(file.name.replace(/\.[^.]+$/,''))+'.'+file.name.split('.').pop().toLowerCase();let jwt=await store.authenticatedToken();let base=window.LKM_CONFIG.SUPABASE_URL.replace(/\/$/,'');let r=await fetch(base+'/storage/v1/object/portfolio/'+key,{method:'POST',headers:{apikey:window.LKM_CONFIG.SUPABASE_ANON_KEY,Authorization:'Bearer '+jwt,'Content-Type':file.type,'x-upsert':'false'},body:file});if(!r.ok)throw new Error((await r.text()).slice(0,200));let url=base+'/storage/v1/object/public/portfolio/'+key;
 try{
   let width=null,height=null;
   try{const im=await createImageBitmap(file);width=im.width;height=im.height;im.close()}catch{}
   const saved=await fetch(base+'/rest/v1/portfolio_images',{method:'POST',headers:{apikey:window.LKM_CONFIG.SUPABASE_ANON_KEY,Authorization:'Bearer '+jwt,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify({gallery_id:null,image_url:url,visibility:'review',alt_text:file.name.replace(/[-_]/g,' ').slice(0,150),storage_path:key,file_size_bytes:file.size,image_width:width,image_height:height})});
   if(!saved.ok)throw new Error('Media registration failed ('+saved.status+'): '+(await saved.text()).slice(0,180));
 }catch(err){show('Uploaded to Storage but not registered: '+err.message);return}
 let x=root.querySelector('#svcGallery');x.value+=(x.value.trim()?'\n':'')+url;if(!root.querySelector('#svcCover').value.trim())root.querySelector('#svcCover').value=url;serviceThumbs();show('Photo uploaded. Click Save changes to publish.');}
root.addEventListener('submit',async e=>{if(e.target.id!=='authForm')return;e.preventDefault();root.querySelector('#authError').textContent='';try{await store.login(root.querySelector('#authEmail').value.trim(),root.querySelector('#authPassword').value);if(!await store.isAdmin())throw new Error('This account is not listed in admin_users.');authorized=true;await refresh()}catch(err){store.logout();root.querySelector('#authError').textContent=err.message}});
root.addEventListener('change',e=>{
 if(e.target.closest('#lkmEditor'))editorDirty=true;
 if(e.target.matches('[data-pkg-model]'))syncPackageRow(e.target.closest('[data-package-row]'));
 if(e.target.id==='pickerSource'){pickerSource=e.target.value;pickerShow=60;if(pickerSource==='library'&&!pickerCatalog.length){fetch('/api/media-catalog').then(r=>r.json()).then(r=>{pickerCatalog=r.images||[];pickerView()}).catch(err=>show('Could not load library: '+err.message))}pickerView()}
 if(e.target.id==='pickerGallery'){pickerGallery=e.target.value;pickerShow=60;pickerView()}
});
root.addEventListener('input',e=>{if(e.target.closest('#lkmEditor'))editorDirty=true;if(e.target.id==='pickerSearch'){pickerSearch=e.target.value;pickerShow=60;const area=root.querySelector('.lkm-picker-results');if(area)area.innerHTML=pickerResults()}
 if(e.target.id==='svcCover'||e.target.id==='svcGallery')serviceThumbs();});
root.addEventListener('click',async e=>{
 const modalAction=e.target.closest('[data-picker-action]');if(modalAction){if(modalAction.dataset.pickerAction==='close')closeImagePicker();if(modalAction.dataset.pickerAction==='more'){pickerShow+=60;pickerView()}return}
 const chosen=e.target.closest('[data-pick-url]');if(chosen){addPickedImage(chosen.dataset.pickUrl);if(picker==='cover')closeImagePicker();return}
 const remove=e.target.closest('[data-service-image-remove]');if(remove){editorDirty=true;let i=remove.dataset.serviceImageRemove;if(i==='cover'){root.querySelector('#svcCover').value=''}else{let area=root.querySelector('#svcGallery');let urls=area.value.split('\n').map(x=>x.trim()).filter(Boolean);urls.splice(Number(i),1);area.value=urls.join('\n')};serviceThumbs();return}
 const item=e.target.closest('[data-select]');if(item){if(!discardConfirmed())return;const next=item.dataset.select;const same=editorOpen&&!newMode&&next===selected;selected=next;newMode=false;editorOpen=!same;editorDirty=false;dashboard();return}
 const t=e.target.closest('[data-tab]');if(t){e.preventDefault();if(!authorized&&live)return;if(!discardConfirmed())return;editorDirty=false;tab=t.dataset.tab;location.hash=tab;dashboard();return}
 const featureAction=e.target.closest('[data-feature-action]');
 if(featureAction){
  const scope=featureAction.closest('.lkm-feature-editor');const list=scope?.querySelector('.lkm-feature-list');
  const row=featureAction.closest('.lkm-feature-row');if(!list)return;
  const act=featureAction.dataset.featureAction;
  if(act==='add'){
   if(list.children.length>=20){show('Maximum 20 features per section.');return}
   list.insertAdjacentHTML('beforeend',lkmFeatureRow('',list.children.length));
   list.lastElementChild?.querySelector('[data-feature-value]')?.focus();
  } else if(act==='remove'&&row){row.remove()}
  else if(act==='up'&&row?.previousElementSibling){list.insertBefore(row,row.previousElementSibling)}
  else if(act==='down'&&row?.nextElementSibling){list.insertBefore(row.nextElementSibling,row)}
  editorDirty=true;return;
 }
 const moved=e.target.closest('[data-package-move]');if(moved){const row=moved.closest('[data-package-row]');if(moved.dataset.packageMove==='up'&&row.previousElementSibling)row.parentElement.insertBefore(row,row.previousElementSibling);if(moved.dataset.packageMove==='down'&&row.nextElementSibling)row.parentElement.insertBefore(row.nextElementSibling,row);editorDirty=true;return}
 if(e.target.closest('[data-remove-package]')){e.target.closest('[data-package-row]').remove();editorDirty=true;return}
 if(e.target.closest('[data-remove-addon]')){e.target.closest('[data-addon-row]').remove();editorDirty=true;return}
 const btn=e.target.closest('[data-admin]');if(!btn)return;
 try{switch(btn.dataset.admin){case 'new':if(!discardConfirmed())return;newMode=true;editorOpen=true;editorDirty=false;dashboard();break;
 case 'cancel':case 'close':if(discardConfirmed())closeEditor();break;
 case 'addpackage':root.querySelector('#packagesEditor').insertAdjacentHTML('beforeend',pkgRow({}));editorDirty=true;break;
 case 'addaddon':root.querySelector('#addonsEditor').insertAdjacentHTML('beforeend',addonRow({}));editorDirty=true;break;
 case 'save':{let obj=collect(),old=newMode?null:selected;if(!newMode&&old!==obj.slug&&services.some(x=>x.slug===obj.slug))throw new Error('This slug is already in use.');btn.disabled=true;btn.textContent='Saving...';await store.saveService(obj,old);selected=obj.slug;newMode=false;editorOpen=false;editorDirty=false;await refresh();show('Saved. Changes '+(live?'are visible on the website.':'are saved in this browser.'));break}
 case 'hide':{if(!confirm('Unpublish this service? Existing leads will not be deleted.'))return;await store.deleteService(selected);editorOpen=false;editorDirty=false;await refresh();show('Service unpublished.');break}
 case 'refresh':await refresh();break;
 case 'upload':await upload();break;
 case 'pick-cover':await openImagePicker('cover');break;
 case 'pick-gallery':await openImagePicker('gallery');break;
 case 'logout':store.logout();if(live){authorized=false;const cms=document.getElementById('cmsRoot');if(cms){cms.hidden=true;if(root.contains(cms))document.body.insertBefore(cms,document.getElementById('toast')||null);cms.textContent='';}adminLogin()}else{localStorage.removeItem('LKM_V3_DEMO_SERVICES');window.location.reload()}break;
 }}catch(err){let status=root.querySelector('#editorStatus');if(status)status.textContent=err.message;else show('Operation failed: '+err.message);if(btn){btn.disabled=false;btn.textContent=btn.dataset.admin==='save'?'Save changes':btn.textContent}}
});
(async()=>{if(!live){authorized=true;if(['articles','galleries','media'].includes(tab))tab='services';await refresh();return}if(store.getSession()){try{authorized=await store.isAdmin();if(authorized){await refresh();return}}catch(e){console.warn(e)}}adminLogin()})();
})();
