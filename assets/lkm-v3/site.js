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
const root=document.getElementById('main');
const store=window.LKMStore;
const config=window.LKM_CONFIG||{};
let analyticsAllowed=false;
function enableAnalytics(){
 if(analyticsAllowed)return;analyticsAllowed=true;
 window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};
 window.gtag('js',new Date());window.gtag('config','G-VB93M2KSMX',{send_page_view:false});
 // Legacy UA identifier retained from the old website (Universal Analytics no longer processes new hits).
 window.gtag('config','UA-200005173-1',{send_page_view:false});
 let script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id=G-VB93M2KSMX';document.head.appendChild(script);
}
function track(name,params={}){if(analyticsAllowed&&window.gtag)window.gtag('event',name,params)}
function initCookies(){
 const bar=document.getElementById('cookieBar');let pref=null;try{pref=localStorage.getItem('lkm_analytics_consent')}catch(e){}
 if(pref==='yes'){enableAnalytics();return}if(pref!== 'no')bar.hidden=false;
 const save=(yes)=>{try{localStorage.setItem('lkm_analytics_consent',yes?'yes':'no')}catch(e){}bar.hidden=true;if(yes){enableAnalytics();track('page_view',{page_path:location.pathname+location.hash})}};
 document.getElementById('acceptCookies').addEventListener('click',()=>save(true));
 document.getElementById('rejectCookies').addEventListener('click',()=>save(false));
 document.getElementById('cookieSettings').addEventListener('click',()=>{bar.hidden=false});
}
initCookies();
let all=[];
let ui={audience:'business',category:'All',search:'',service:'',photo:0,packageId:'',addons:[],quantity:1,pay:'deposit'};
const pricing=window.LKMPricing;

const FALLBACK={Photography:'brand',Wedding:'wedding',Experiences:'coast',Videography:'camera',Events:'personal','Social Media':'social',Design:'web','Web Design':'web','Business Setup':'business',Marketing:'business'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const money=n=>new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR',maximumFractionDigits:n%100?2:0}).format(n/100);
const titleName=s=>esc(s.title||'');
const firstPackage=s=>Array.isArray(s.packages)&&s.packages.length?s.packages[0]:null;
const priceTag=s=>pricing.servicePrice(s);
const selectedService=()=>{let slug=ui.service;try{slug=slug||sessionStorage.getItem('lkm_selected_service')}catch(e){}return all.find(s=>s.slug===slug)};
const selectedPackage=()=>{let s=selectedService();let p=(s?.packages||[]).find(p=>p.id===ui.packageId)||firstPackage(s);if(p){if(ui.packageId!==p.id)ui.quantity=pricing.safeQty(p,p.min_quantity||1);ui.packageId=p.id;ui.quantity=pricing.variable(p)?pricing.safeQty(p,ui.quantity):1;}return p};
const fallback=s=>'./assets/lkm-v3/preview/'+(FALLBACK[s.category]||'brand')+'.jpg';
const img=(src,alt,fb='',cl='',lazy=true)=>`<img ${cl?'class="'+cl+'"':''} src="${esc(src||fb)}" alt="${esc(alt)}" ${lazy?'loading="lazy"':''} onerror="this.onerror=null;this.src='${esc(fb||'./assets/lkm-v3/preview/brand.jpg')}'">`;
const button=(label,href,style='button-dark')=>`<a class="button ${style}" href="${href}">${label}</a>`;
const badge=s=>s.audience==='personal'?'Personal':'Business';
const audienceLink=a=>'#/services?audience='+a;
const linkService=s=>'#/service/'+encodeURIComponent(s.slug);
const lead=x=>`<div class="label-kicker">${esc(x)}</div>`;
const reveal=(inner,delay='')=>`<div class="reveal ${delay}">${inner}</div>`;
function announce(msg){const t=document.getElementById('toast');t.textContent=msg;t.hidden=false;clearTimeout(t._tid);t._tid=setTimeout(()=>t.hidden=true,3800)}
function headerScroll(){document.getElementById('siteHeader').classList.toggle('scrolled',window.scrollY>25)}
window.addEventListener('scroll',headerScroll,{passive:true});headerScroll();
const menu=document.getElementById('menuToggle'),mobile=document.getElementById('mobileNav');
menu.addEventListener('click',()=>{const open=mobile.hasAttribute('hidden');if(open)mobile.removeAttribute('hidden');else mobile.setAttribute('hidden','');menu.setAttribute('aria-expanded',open?'true':'false')});
mobile.addEventListener('click',e=>{if(e.target.closest('a')){mobile.setAttribute('hidden','');menu.setAttribute('aria-expanded','false')}});
const io=window.IntersectionObserver?new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.07,rootMargin:'0px 0px 60px 0px'}):null;
function activateReveals(){root.querySelectorAll('.reveal').forEach(x=>io?io.observe(x):x.classList.add('visible'))}
function route(){let hash=decodeURIComponent(location.hash||'#/');let match=hash.match(/^#\/service\/([^?]+)/);if(match)return {page:'detail',id:match[1]};let page=(hash.match(/^#\/([^?]+)/)||[])[1]||'home';let params=new URLSearchParams((hash.split('?')[1]||''));return {page,params}}
function card(s){return `<article class="service-card reveal"><a class="service-photo" href="${linkService(s)}" aria-label="Explore ${titleName(s)}">${img(s.cover_url,s.title,fallback(s))}<span class="service-badge">${esc(s.category)}</span></a><div class="service-body"><h3>${titleName(s)}</h3><p>${esc(s.summary)}</p><div class="service-bottom"><div class="service-price"><small>${esc(pricing.servicePriceLabel(s))}</small><strong>${esc(priceTag(s))}</strong></div><a class="small-arrow" href="${linkService(s)}">Explore ↗</a></div></div></article>`}
function portfolio(){const items=[{url:'orofino-4.jpg',label:'Product & Jewellery Photography',cat:'Photography',href:'/portfolio.html#/gallery/product-jewellery-photography'},{url:'portrait-15.jpg',label:'Portrait & Lifestyle Photography',cat:'Photography',href:'/portfolio.html#/gallery/portraits'},{url:'flamingo-3-2048x1299.jpg',label:'Nature & Wildlife Photography',cat:'Photography',href:'/portfolio.html#/gallery/nature-photography'},{url:'woodstock-1-2048x1363.jpg',label:'Videography & Reels',cat:'Videography',href:'#/service/commercial-video-reels'},{url:'olympic-poster2.jpg',label:'Graphic Design',cat:'Design',href:'/portfolio.html#/gallery/graphic-design'}];return `<div class="portfolio-grid">${items.map(x=>`<a class="portfolio-tile reveal" href="${x.href}">${img('/assets/images/'+x.url,x.label,'./assets/lkm-v3/preview/'+(FALLBACK[x.cat]||'brand')+'.jpg')}<span>${x.label} ↗</span></a>`).join('')}</div>`}
function home(){document.title='LilKangooMedia | Photography, Video & Creative Marketing in Cyprus';
  const featured=all.filter(s=>s.active!==false&&s.featured).slice(0,6);
  return `<section class="hero"><div class="hero-inner"><div class="hero-title reveal"><div>${lead('LilKangooMedia · Cyprus · Creative services')}<h1>CREATE.<br>CAPTURE.<br><em>GROW.</em></h1></div><p class="hero-side">Photography, videography, design, digital marketing and unforgettable personal experiences. One creative team. Your vision.</p></div><div class="audience-grid"><a class="audience-card reveal delay1" href="${audienceLink('personal')}">${img('/assets/images/wedding-6.jpeg','Personal wedding and portrait photography','./assets/lkm-v3/preview/personal.jpg','',false)}<span class="label-kicker light">For people, families & celebrations</span><strong>Personal</strong><p>Portraits, weddings, family events, photo and video experiences across Cyprus.</p><span class="audience-arrow">Explore Personal Services <span aria-hidden="true">↗</span></span></a><a class="audience-card reveal delay2" href="${audienceLink('business')}">${img('/assets/images/orofino-4.jpg','Brand and commercial photography','./assets/lkm-v3/preview/business.jpg','',false)}<span class="label-kicker light">For businesses, brands & creators</span><strong>Business</strong><p>Content production, branding, social media management, marketing and websites.</p><span class="audience-arrow">Explore Business Services <span aria-hidden="true">↗</span></span></a></div><div class="hero-tools reveal"><span>Go straight to</span><a href="${audienceLink('personal')}">Photography</a><a href="${audienceLink('business')}">Commercial Video</a><a href="${audienceLink('business')}">Social Media</a><a href="${audienceLink('business')}">Web & Design</a></div></div></section>
    <div class="proof-strip"><div class="proof-inner"><p><span>◈</span> Based in Cyprus</p><p><span>✧</span> Original photography & film</p><p><span>◇</span> Personal & business services</p><p><span>▣</span> Flexible project enquiries</p></div></div>
    <section class="section container">${reveal(`<div class="section-head"><div>${lead('Everything in one place')}<h2>Find exactly what you need.</h2><p>Explore photography, film, design and marketing services for personal occasions and business projects. Find the right service and tell us what you have in mind.</p></div>${button('Explore All Services ↗','#/services','button-light')}</div>`)}<div class="service-grid">${featured.map(card).join('')}</div></section>
    <section class="container section small-top">${reveal(`<div class="feature-wide"><div class="wide-media">${img('/assets/images/aleksandra-mateusz-18-1048x685.jpg','Private Cyprus photography experience','./assets/lkm-v3/preview/coast.jpg')}</div><div class="wide-copy">${lead('Personal experiences')}<h2>Real moments.<br>Remarkable stories.</h2><p>Preserve meaningful memories on an island full of beautiful locations, with photography and video tailored to your occasion.</p>${button('Explore Private Experiences ↗',audienceLink('personal'))}</div></div>`)}</section>
    <section class="section container">${reveal(`<div class="section-head"><div>${lead('Selected work')}<h2>Our work speaks visually.</h2><p>Explore portrait, nature, product and commercial photography, graphic design and selected creative projects from our portfolio.</p></div>${button('View Portfolio ↗','/portfolio.html','button-light')}</div>`)}${portfolio()}</section>
    <section class="section dark-panel"><div class="container section-head" style="margin-bottom:0"><div>${lead('Make it happen')}<h2>Ready to create something?</h2><p style="color:#c5d3c7">Tell us what you need and receive a tailored proposal.</p></div>${button('Get in Touch ↗','#/contact','button-orange')}</div></section>`
}
function catalog(params){let aud=params.get('audience');if(aud==='personal'||aud==='business')ui.audience=aud;const categories=['All',...new Set(all.filter(s=>s.active!==false&&s.audience===ui.audience).map(s=>s.category))];if(!categories.includes(ui.category))ui.category='All';document.title=(ui.audience==='personal'?'Personal':'Business')+' Services | LilKangooMedia';return `<div class="container"><nav class="crumbs"><a href="#/">Home</a> / Services</nav><div class="catalog-intro reveal"><div>${lead('Browse & explore')}<h1>${ui.audience==='business'?'Show your business at its best.':'Photography and film for the moments that matter.'}</h1><p>${ui.audience==='business'?'Discover commercial photography, videos, marketing, social media and creative development.':'Choose photography, celebrations, weddings and private video experiences.'}</p></div><div class="segmented" role="group" aria-label="Choose customer type"><button class="${ui.audience==='personal'?'active':''}" data-audience="personal">Personal</button><button class="${ui.audience==='business'?'active':''}" data-audience="business">Business</button></div></div><div class="search-bar reveal"><span aria-hidden="true">⌕</span><input type="search" id="serviceSearch" placeholder="Search photography, video, social media, weddings..." value="${esc(ui.search)}" aria-label="Search services"><button class="button button-dark" id="searchButton">Search</button></div><div class="chip-row reveal">${categories.map(c=>`<button data-category="${esc(c)}" class="chip ${ui.category===c?'active':''}">${esc(c==='All'?'All Services':c)}</button>`).join('')}</div><div class="catalog-count" id="catalogCount"></div><div class="service-grid" id="catalogGrid">${all.filter(s=>s.active!==false&&s.audience===ui.audience&&(ui.category==='All'||s.category===ui.category)).map(card).join('')}</div><div class="status-empty hide" id="emptyCatalog">No matching services. Try a different category or search.</div></div><div style="height:90px"></div>`}
function detail(slug){let s=all.find(x=>x.slug===slug&&x.active!==false);if(!s)return missing();track('view_item',{item_id:s.slug,item_name:s.title});if(ui.service!==slug){ui.addons=[];ui.quantity=1;ui.packageId='';}ui.service=slug;try{sessionStorage.setItem('lkm_selected_service',slug)}catch(e){}ui.photo=Math.min(ui.photo,(s.gallery_urls||[]).length-1);if(ui.photo<0)ui.photo=0;if(!(s.packages||[]).some(p=>p.id===ui.packageId))ui.packageId=firstPackage(s)?.id||'';document.title=s.title+' | LilKangooMedia';let media=(s.gallery_urls?.length?s.gallery_urls:[s.cover_url]);const p=selectedPackage();return `<div class="container"><nav class="crumbs"><a href="#/">Home</a> / <a href="${audienceLink(s.audience)}">${badge(s)} Services</a> / ${titleName(s)}</nav><div class="detail-grid"><div class="reveal"><div class="gallery-main">${img(media[ui.photo],s.title,fallback(s))}<button class="gallery-nav prev" data-slide="-1" aria-label="Previous image">‹</button><button class="gallery-nav next" data-slide="1" aria-label="Next image">›</button></div><div class="thumbnail-row">${media.slice(0,8).map((url,i)=>`<button data-photo="${i}" class="${i===ui.photo?'active':''}" aria-label="View gallery image ${i+1}">${img(url,s.title+' gallery image '+(i+1),fallback(s))}</button>`).join('')}</div></div><aside class="panel reveal delay1"><div class="label-kicker">Your creative service</div><div class="price-detail" style="margin-top:18px">${(s.packages||[]).length?'Available pricing':'Tailored to your project'}</div><div class="price-big">${esc(priceTag(s))}</div><div class="price-detail">${(s.packages||[]).length?'Explore the options below':'Request a personalized quote'}</div><hr>${(s.packages||[]).length?`<div class="subhead">Available packages</div>${s.packages.map(pk=>`<button class="package-choice ${pk.id===ui.packageId?'selected':''}" data-package="${esc(pk.id)}"><span><strong>${esc(pk.name)}</strong><small>${esc(pk.description)}</small></span><span class="package-cost">${esc(pricing.priceText(pk))}</span></button>`).join('')}`:`<div class="checkline">Describe your project for a personalized estimate</div>`}<div class="checkline">Project scope agreed in advance</div><div class="checkline">Availability confirmed before booking</div><div class="checkline">Clear communication about the final deliverables</div><div style="margin-top:23px">${button((s.packages||[]).length?'Configure & Request →':'Request a Custom Quote →','#/quote','button-dark')}</div><p class="price-detail" style="margin-top:16px">Any additional costs will be outlined in your quote before confirmation.</p></aside></div><div class="detail-copy reveal">${lead(s.category+' / '+badge(s))}<h1>${titleName(s)}</h1><p>${esc(s.description||s.summary)}</p><h2>What you can expect</h2><ul><li>A project brief tailored to your requirements</li><li>Scope and deliverables agreed in advance</li><li>Scheduling subject to availability</li><li>A clear quote before you confirm your booking</li></ul><div class="notice">Your preferred date and final scope are confirmed by our team after we review your request.</div></div></div>`}
function missing(){return `<section class="section container"><h1 class="page-title">Service not found</h1><p>This service is unavailable or has been unpublished.</p><p style="margin-top:22px">${button('Explore Services','#/services')}</p></section>`}
function steps(current){return `<div class="process-steps">${['Choose service','Configure package','Send request','Confirmation'].map((name,i)=>`<span class="${current===i+1?'current':''}"><i>${i+1}</i>${name}</span>`).join('<span aria-hidden="true">—</span>')}</div>`}
const chosenEstimate=()=>pricing.estimate(selectedPackage(),selectedService()?.addons||[],ui.addons,ui.quantity);
function chosenPrice(){const est=chosenEstimate();return est.available&&est.monthly===0&&est.yearly===0?est.oneTime:null}
function estimateDisplay(est){
 if(!est.available)return 'On request';
 const parts=[];
 if(est.monthly||pricing.mode(selectedPackage())==='month')parts.push(money(est.monthly)+'/month');
 if(est.yearly||pricing.mode(selectedPackage())==='year')parts.push(money(est.yearly)+'/year');
 if(est.oneTime)parts.push(money(est.oneTime)+(est.monthly||est.yearly?' one-time':''));
 return parts.length?parts.join(' + '):money(0);
}
const priceRows=est=>est.lineItems.map(row=>`<div class="estimate-row"><span>${esc(row.label)}${row.billing==='monthly'?' (monthly)':row.billing==='yearly'?' (yearly)':''}</span><strong>${money(row.amount)}</strong></div>`).join('');
const quantityField=p=>pricing.variable(p)?`<div class="field lkm-pricing-quantity"><label for="serviceQty">Number of ${esc(pricing.pluralUnit(p,2))}</label><input type="number" id="serviceQty" min="${Number(p.min_quantity)>0?p.min_quantity:1}" ${Number(p.max_quantity)>=Number(p.min_quantity||1)?`max="${p.max_quantity}"`:''} step="${Number(p.quantity_step)>0?p.quantity_step:1}" value="${ui.quantity}"/><small>Estimated price updates when you change the quantity.</small></div>`:'';
const subscriptionNotice=p=>pricing.recurring(p)?`<p class="notice">This is a ${pricing.mode(p)==='month'?'monthly':'yearly'} service quotation, not an active subscription. ${Number(p.minimum_term_months)>0?`Minimum commitment: ${p.minimum_term_months} months. `:''}Billing begins only after an agreement with LilKangooMedia.</p>`:'';
function quote(){
 let s=selectedService();if(!s)return `<section class="section container">${lead('Start here')}<h1 class="page-title">Choose a service first.</h1>${button('Browse our services','#/services')}</section>`;
 const p=selectedPackage(),est=chosenEstimate();
 document.title='Configure '+s.title+' | LilKangooMedia';
 const choices=(s.packages||[]).map(pk=>`<button data-package="${esc(pk.id)}" class="package-choice ${ui.packageId===pk.id?'selected':''}"><span><strong>${esc(pk.name)}</strong><small>${esc(pk.description||pricing.MODE[pricing.mode(pk)].label)}</small></span><strong class="package-cost">${esc(pricing.priceText(pk))}</strong></button>`).join('');
 const extras=(s.addons||[]).map(a=>`<label class="package-choice"><span><input type="checkbox" data-addon="${esc(a.id)}" ${ui.addons.includes(a.id)?'checked':''}> <strong style="display:inline">${esc(a.name)}</strong></span><strong class="package-cost">+${esc(pricing.addonText(a,p))}</strong></label>`).join('');
 return `<section class="section container"><div class="crumbs"><a href="${linkService(s)}">← ${titleName(s)}</a> / Your quote</div>${steps(2)}${lead('Personalize your project')}<h1 class="page-title">${(s.packages||[]).length?'Build your package.':'Request a custom quote.'}</h1><p style="color:var(--muted);margin:-3px 0 32px">Choose a package and any available extras. Tell us about additional requirements in your enquiry.</p>
 <div class="form-grid"><div class="panel reveal"><h3>${titleName(s)}</h3>${img(s.cover_url,s.title,fallback(s),'',true)}${choices?`<div class="subhead" style="margin-top:22px">Choose a package</div>${choices}${quantityField(p)}`:'<div class="notice">Tell us about your project and we will prepare a tailored quote.</div>'}${extras?`<div class="subhead">Optional extras</div>${extras}`:''}</div>
 <aside class="panel reveal delay1"><div class="subhead">${est.monthly||est.yearly?'Estimated billing':'Price estimate'}</div><div class="price-big lkm-estimate-amount">${esc(estimateDisplay(est))}</div><p class="hint">${p?'Based on your selected package and quantity.':'Calculated after your enquiry.'}</p><hr>${priceRows(est)}<div class="estimate-total"><span>${est.monthly||est.yearly?'Estimated charges':'Estimated total'}</span><strong>${esc(estimateDisplay(est))}</strong></div>${subscriptionNotice(p)}<div class="notice">Sending an enquiry does not reserve a date or require payment. Rates and deliverables are confirmed before booking.</div>${button('Continue to details →','#/request','button-dark')}<p style="margin-top:15px">${button('← Back to service',linkService(s),'button-light')}</p></aside></div></section>`;
}
function requestPage(){let s=selectedService();if(!s)return `<section class="section container">${button('Choose a service','#/services')}</section>`;const amount=chosenPrice(),est=chosenEstimate();let p=selectedPackage();let canPay=s.booking_mode!=='enquiry'&&amount!==null&&pricing.directPaymentEligible(p,s.addons||[],ui.addons);document.title='Request '+s.title+' | LilKangooMedia';return `<section class="section container"><nav class="crumbs"><a href="#/quote">← Configure package</a> / Your details</nav>${steps(3)}${lead('Last few details')}<h1 class="page-title">Tell us about your project.</h1><p style="color:var(--muted);margin:0 0 27px">Select a preferred date. We will confirm availability before treating your request as a booking.</p><div class="form-grid"><form class="panel reveal" id="bookingForm" novalidate><div class="field"><label for="requestName">Full name *</label><input id="requestName" name="name" autocomplete="name" required maxlength="100" placeholder="Your name"></div><div class="field"><label for="requestEmail">Email *</label><input id="requestEmail" name="email" autocomplete="email" type="email" required maxlength="200" placeholder="you@example.com"></div><div class="field"><label for="requestPhone">Phone number</label><input id="requestPhone" name="phone" autocomplete="tel" maxlength="40" placeholder="+357..."></div><div class="field"><label for="requestDate">Preferred date</label><input id="requestDate" name="preferred_date" type="date"></div><div class="field"><label for="requestDetails">Project brief *</label><textarea id="requestDetails" name="message" required maxlength="3000" placeholder="Tell us about location, goals, deliverables and other requirements"></textarea></div><div class="field hide" aria-hidden="true"><label for="requestWebsite">Leave this empty</label><input id="requestWebsite" name="website" autocomplete="off" tabindex="-1"></div><label style="display:flex;gap:10px;margin:12px 0 19px;color:#566659;font-size:12px"><input type="checkbox" id="requestConsent" name="consent" required style="align-self:start;margin-top:4px;accent-color:#375342">I agree that LilKangooMedia may use the information provided to respond to my enquiry. See <a href="/FAQ.html" target="_blank" rel="noopener" style="text-decoration:underline">Privacy Policy</a>.</label><div id="captchaMount" class="field" aria-label="Spam protection"></div><p id="requestStatus" role="status" aria-live="polite"></p><button class="button button-dark" type="submit" id="requestSubmit" style="width:100%">Send enquiry →</button>${canPay?`<button class="button button-orange" type="button" id="checkoutButton" style="width:100%;margin-top:11px">${s.booking_mode==='full'?'Pay securely with Stripe →':'Request date & pay deposit →'}</button>`:''}<p class="hint" style="margin:11px 0 0">We will review your request and reply by email. You can also contact us at <strong>photo@lilkangoomedia.com</strong>.</p></form><aside class="panel reveal delay1"><div class="subhead">Your service summary</div>${img(s.cover_url,s.title,fallback(s))}<h3 style="margin-top:20px">${titleName(s)}</h3><div class="estimate-row"><span>Package</span><strong>${p?esc(p.name):'Custom scope'}</strong></div>${pricing.variable(p)?`<div class="estimate-row"><span>Units requested</span><strong>${est.qty} ${esc(pricing.pluralUnit(p,est.qty))}</strong></div>`:''}<div class="estimate-row"><span>Estimated total</span><strong>${esc(estimateDisplay(est))}</strong></div><div class="estimate-row"><span>Preferred date</span><strong>Subject to confirmation</strong></div>${canPay&&amount!==null&&s.booking_mode==='deposit'?`<div class="estimate-row"><span>Potential deposit (${Number(s.deposit_percent)||0}%)</span><strong>${money(Math.round(amount*(Number(s.deposit_percent)||0)/100))}</strong></div>`:''}<div class="notice">We will confirm availability, the agreed services and any additional costs before finalizing your booking.</div></aside></div></section>`}
function contact(){document.title='Contact Us | LilKangooMedia';return `<section class="section container"><div class="contact-card"><div class="contact-info reveal">${lead('Let’s work together')}<h1>Have an idea?<br>Make it real.</h1><p>Business campaign, family shoot, video, branding, or anything creative — tell us what you need.</p><p style="margin-top:22px"><a href="mailto:photo@lilkangoomedia.com">photo@lilkangoomedia.com</a></p><p style="margin-top:6px"><a href="tel:+35799005924">+357 99 005 924</a></p><img src="./assets/lkm-v3/brand/logo-orange.png" alt="" width="195" style="display:block;margin:30px auto 0;opacity:.87"></div><form class="panel reveal delay1" id="contactForm"><h3>Tell us about your project</h3><div class="field"><label for="contactName">Your name *</label><input name="name" id="contactName" required maxlength="100" placeholder="Your full name"></div><div class="field"><label for="contactEmail">Email *</label><input name="email" id="contactEmail" type="email" required maxlength="200" placeholder="you@example.com"></div><div class="field"><label for="contactType">What can we help with?</label><select name="service_type" id="contactType"><option value="General enquiry">Select a service</option><option>Photography</option><option>Videography</option><option>Social Media Management</option><option>Graphic Design</option><option>Website Development</option><option>Marketing & Advertising</option><option>Private Photo Trip</option><option>Other</option></select></div><div class="field"><label for="contactMessage">Your message *</label><textarea name="message" id="contactMessage" required maxlength="3000" placeholder="Share a few details..."></textarea></div><input type="text" name="website" class="hide" tabindex="-1" autocomplete="off"><label style="font-size:12px;display:flex;gap:9px;margin-bottom:15px"><input type="checkbox" name="consent" required style="accent-color:#294438"> I agree to be contacted regarding this enquiry.</label><div id="captchaMount" class="field" aria-label="Spam protection"></div><p id="contactStatus" role="status" aria-live="polite"></p><button class="button button-dark" type="submit">Send message →</button><p class="hint" style="margin-top:12px;font-size:11px">We will reply to your enquiry by email.</p></form></div></section>`}
function portfolioPage(){document.title='Our Portfolio | LilKangooMedia';return `<section class="section container">${lead('Photography · Design · Video')}<h1 class="page-title">Our work is the story.</h1><p style="color:var(--muted);margin:0 0 20px">Explore our galleries by subject, creative discipline and project.</p><p style="margin-bottom:25px">${button('Explore All Galleries ↗','/portfolio.html','button-dark')}</p>${portfolio()}<div style="margin:42px 0" class="feature-wide"><div class="wide-media">${img('/assets/images/orofino-1.jpg','Product photography','./assets/lkm-v3/preview/product.jpg')}</div><div class="wide-copy">${lead('Create with us')}<h2>Your next campaign begins here.</h2><p>Choose a service, review examples and send us your brief.</p>${button('Browse Business Services ↗',audienceLink('business'))}</div></div></section>`}
function about(){document.title='About LilKangooMedia | Creative Studio in Cyprus';return `<section class="lkm-about-hero" aria-labelledby="about-hero-title">
  <div class="container lkm-about-hero-grid">
    <div class="lkm-about-intro reveal">
      <p class="lkm-about-eyebrow"><span class="lkm-about-eyebrow-line"></span> ABOUT LILKANGOOMEDIA</p>
      <h1 id="about-hero-title">Creative work.<br>Human stories.<br><em>Real connection.</em></h1>
      <p class="lkm-about-intro-copy">We're Michael and Lilyanna, the creative team behind LilKangooMedia. From Cyprus, we bring photography, filmmaking and design together to tell stories with personality and help businesses communicate with purpose.</p>
      <div class="lkm-about-hero-actions">
        <a class="button button-orange" href="/portfolio.html">Explore our portfolio <span aria-hidden="true">↗</span></a>
        <a class="lkm-about-hero-textlink" href="#/contact">Let's talk about your project <span aria-hidden="true">↗</span></a>
      </div>
      <p class="lkm-about-loc"><span class="lkm-about-loc-dot"></span> Based in Cyprus · Working across the island and beyond</p>
    </div>
    <div class="lkm-about-hero-art" aria-label="Selected photographs from our portfolio">
      <figure class="lkm-about-hero-photo lkm-about-hero-photo-main"><img src="/assets/images/wedding-6.jpg" alt="Wedding photography from the LilKangooMedia portfolio" fetchpriority="high"><figcaption>PEOPLE &amp; MOMENTS</figcaption></figure>
      <figure class="lkm-about-hero-photo lkm-about-hero-photo-top"><img src="/assets/images/orofino-4.jpg" alt="Jewellery product photography from LilKangooMedia" loading="lazy"><figcaption>PRODUCTS &amp; DETAIL</figcaption></figure>
      <figure class="lkm-about-hero-photo lkm-about-hero-photo-bottom"><img src="/assets/images/flamingo-3-2048x1299.jpg" alt="Wildlife photography of flamingos" loading="lazy"><figcaption>NATURE &amp; PLACE</figcaption></figure>
      <div class="lkm-about-hero-stamp" aria-hidden="true"><span>LKM</span><small>CYPRUS<br>CREATIVE<br>STUDIO</small></div>
    </div>
  </div>
</section>

<section class="section container lkm-about-story" aria-labelledby="about-story-title">
  <div class="lkm-about-section-top reveal"><p class="lkm-about-kicker">01 / OUR APPROACH</p><p class="lkm-about-small-note">A personal studio. A broad creative perspective.</p></div>
  <div class="lkm-about-story-grid">
    <div class="reveal"><h2 id="about-story-title">The best work starts with <em>understanding.</em></h2></div>
    <div class="lkm-about-story-copy reveal delay1">
      <p>Every person, business and project has a different story. We take time to understand what matters before choosing the right images, words and visual direction.</p>
      <p>Our work brings together the craft of photography and filmmaking with illustration, graphic design and digital media. Whether we're documenting a meaningful day or creating a visual identity for a company, the aim is the same: work that feels authentic and serves a clear purpose.</p>
      <a class="lkm-about-inline-link" href="/#/services">Discover what we do <span aria-hidden="true">↗</span></a>
    </div>
  </div>
  <div class="lkm-about-values" aria-label="Our approach in three steps">
    <article class="lkm-about-value reveal"><span class="lkm-about-value-num">01</span><h3>Listen first</h3><p>We begin with your ideas, priorities and the result you want to achieve.</p></article>
    <article class="lkm-about-value reveal delay1"><span class="lkm-about-value-num">02</span><h3>Create with intention</h3><p>Every frame, design and detail is considered in the context of your project.</p></article>
    <article class="lkm-about-value reveal delay2"><span class="lkm-about-value-num">03</span><h3>Make it personal</h3><p>We keep collaboration direct, approachable and focused on the people behind the brief.</p></article>
  </div>
</section>

<section class="lkm-about-team-section" aria-labelledby="about-team-title">
  <div class="container">
    <div class="lkm-about-team-heading reveal"><div><p class="lkm-about-kicker">02 / THE PEOPLE</p><h2 id="about-team-title">Meet the creatives<br><em>behind the work.</em></h2></div><p>Two complementary perspectives, one shared commitment to thoughtful creative work.</p></div>
    <article class="lkm-about-person reveal">
      <div class="lkm-about-person-image"><img src="/assets/images/edin-end-13.jpeg" alt="Michael, LilKangooMedia photographer and filmmaker" loading="lazy"><span class="lkm-about-person-index">01 / 02</span></div>
      <div class="lkm-about-person-body"><p class="lkm-about-person-label">PHOTOGRAPHY · FILM · EDITING</p><h3>Michael</h3><p class="lkm-about-person-role">Photographer, filmmaker &amp; editor</p><p>Michael brings a background in portrait, landscape and commercial product photography. His work has appeared in publications in different countries, while his interest in filmmaking adds movement and narrative to the stories he creates.</p><p>He approaches each project with attention to the people, environment and details that make it distinctive.</p><a class="lkm-about-person-link" href="/portfolio.html">See our photography <span aria-hidden="true">↗</span></a></div>
    </article>
    <article class="lkm-about-person lkm-about-person-reverse reveal">
      <div class="lkm-about-person-image"><img src="/assets/images/lil-red-orange-hat-12.jpeg" alt="Lilyanna, LilKangooMedia graphic designer and illustrator" loading="lazy"><span class="lkm-about-person-index">02 / 02</span></div>
      <div class="lkm-about-person-body"><p class="lkm-about-person-label">DESIGN · ILLUSTRATION · WRITING</p><h3>Lilyanna</h3><p class="lkm-about-person-role">Graphic designer, illustrator &amp; writer</p><p>Lilyanna studied in Athens and has worked on creative projects across Europe. Her work includes album artwork, posters, hand-drawn illustration, graphic design and writing.</p><p>She helps turn ideas into expressive, cohesive visuals that reflect the character of a brand or project.</p><a class="lkm-about-person-link" href="/#/services?audience=business">Explore creative services <span aria-hidden="true">↗</span></a></div>
    </article>
  </div>
</section>

<section class="section container lkm-about-disciplines" aria-labelledby="about-work-title">
  <div class="lkm-about-disciplines-head reveal"><div><p class="lkm-about-kicker">03 / WHAT WE DO</p><h2 id="about-work-title">One studio.<br><em>Many ways to create.</em></h2></div><p>Services for personal milestones, business communications and ideas that need to be seen.</p></div>
  <div class="lkm-about-discipline-grid">
    <a href="/#/services?audience=personal" class="lkm-about-discipline reveal"><span>01</span><h3>Photography</h3><p>Portraits, celebrations, events and commercial photography.</p><b aria-hidden="true">↗</b></a>
    <a href="/#/services" class="lkm-about-discipline reveal delay1"><span>02</span><h3>Filmmaking</h3><p>Visual storytelling for brands, projects and memorable occasions.</p><b aria-hidden="true">↗</b></a>
    <a href="/#/services?audience=business" class="lkm-about-discipline reveal delay2"><span>03</span><h3>Creative design</h3><p>Graphic design, illustration and visual communication.</p><b aria-hidden="true">↗</b></a>
    <a href="/#/services?audience=business" class="lkm-about-discipline reveal delay3"><span>04</span><h3>Digital presence</h3><p>Websites, content and creative support for businesses.</p><b aria-hidden="true">↗</b></a>
  </div>
</section>

<section class="container lkm-about-cta-wrap" aria-labelledby="about-cta-title">
  <div class="lkm-about-cta reveal"><div><p class="lkm-about-kicker">LET'S CREATE TOGETHER</p><h2 id="about-cta-title">Have a story worth telling?</h2><p>Tell us what you have in mind. We'll help you explore the right creative approach.</p></div><div class="lkm-about-cta-actions"><a class="button button-orange" href="/#/contact">Start a conversation <span aria-hidden="true">↗</span></a><a href="mailto:photo@lilkangoomedia.com" class="lkm-about-cta-mail">photo@lilkangoomedia.com</a></div></div>
</section>`}
function thankYou(){document.title='Enquiry Submitted | LilKangooMedia';return `<section class="section container success-panel"><i>✓</i>${lead('Message received')}<h1>Thank you for reaching out.</h1><p>Your message has been received. We will review the details and get back to you by email.</p><p style="margin-top:27px">${button('Back to Services','#/services')}</p></section>`}
function paymentReturn(){document.title='Payment Status | LilKangooMedia';return `<section class="section container success-panel"><i>✓</i>${lead('Secure payment')}<h1>Payment return received.</h1><p>If Stripe completed the charge, your paid request will be recorded after webhook confirmation. Your preferred date is <strong>not confirmed</strong> until our team accepts it.</p><div class="notice">Check your Stripe payment receipt. If you have questions, contact <a href="mailto:photo@lilkangoomedia.com">photo@lilkangoomedia.com</a>.</div><p>${button('Explore our services','#/services')}</p></section>`}
let captchaScriptLoading=false;
function mountCaptcha(){
 const target=root.querySelector('#captchaMount');if(!target||!config.TURNSTILE_SITE_KEY)return;
 function draw(){if(!root.contains(target)||!window.turnstile)return;try{window.turnstile.render(target,{sitekey:config.TURNSTILE_SITE_KEY,callback:(token)=>{let form=target.closest('form');if(!form)return;let inp=form.querySelector('[name=turnstile_token]');if(!inp){inp=document.createElement('input');inp.type='hidden';inp.name='turnstile_token';form.appendChild(inp)}inp.value=token;}})}catch(e){console.warn('Captcha rendering failed',e)}}
 if(window.turnstile){draw();return}
 if(!captchaScriptLoading){captchaScriptLoading=true;const scr=document.createElement('script');scr.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';scr.async=true;scr.onload=draw;document.head.appendChild(scr)}else{let n=0;const poll=()=>{if(!root.contains(target))return;if(window.turnstile)draw();else if(n++<40)setTimeout(poll,250)};poll()}
}
function render(){const r=route();let page=r.page;root.innerHTML=page==='home'?home():page==='services'?catalog(r.params):page==='detail'?detail(r.id):page==='quote'?quote():page==='request'?requestPage():page==='contact'?contact():page==='portfolio'?portfolioPage():page==='about'?about():page==='thanks'?thankYou():page==='payment-return'?paymentReturn():missing();document.getElementById('year').textContent=new Date().getFullYear();activateReveals();mountCaptcha();track('page_view',{page_path:location.pathname+location.hash,page_title:document.title});if(page==='services')updateFilter();window.scrollTo({top:0,behavior:'instant'});}
function updateFilter(){if(!root.querySelector('#catalogGrid'))return;const q=(root.querySelector('#serviceSearch')?.value||'').toLowerCase().trim();let count=0;root.querySelectorAll('#catalogGrid .service-card').forEach(c=>{let match=c.textContent.toLowerCase().includes(q);c.style.display=match?'':'none';if(match)count++});root.querySelector('#catalogCount').textContent=count+' matching service'+(count===1?'':'s');root.querySelector('#emptyCatalog').classList.toggle('hide',!!count)}
function rerenderInPlace(){let y=window.scrollY;render();window.scrollTo({top:y,behavior:'instant'})}
async function handleForm(form,statusEl){if(!form.reportValidity())return;let data=Object.fromEntries(new FormData(form).entries());let s=selectedService();if(form.id==='bookingForm'){data.service_slug=s?.slug||'';data.package_id=ui.packageId||'';data.addon_ids=ui.addons;data.type='booking_enquiry';const p=selectedPackage(),est=chosenEstimate();const info=[`Package: ${p?.name||'Custom quote'}`,`Pricing: ${p?pricing.MODE[pricing.mode(p)].label:'Custom quote'}`,pricing.variable(p)?`Quantity: ${est.qty}`:'',`Estimate: ${estimateDisplay(est)}`,ui.addons.length?`Extras: ${(s?.addons||[]).filter(a=>ui.addons.includes(a.id)).map(a=>a.name).join(', ')}`:''].filter(Boolean).join('\n');data.message=String(data.message||'').slice(0,2650)+'\n\n'+info.slice(0,300)}else data.type='general_enquiry';data.source='LilKangooMedia website';let btn=form.querySelector('button[type=submit]');btn.disabled=true;btn.textContent='Sending...';statusEl.textContent='';try{let r=await fetch('/api/enquiry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});let j=await r.json().catch(()=>({}));if(!r.ok||!j.ok)throw new Error(j.error||'The message could not be sent.');track('generate_lead',{lead_type:data.type});location.hash='#/thanks'}catch(e){statusEl.textContent=store.configured?'Could not send your enquiry: '+e.message:'We could not send your enquiry. Please try again or email photo@lilkangoomedia.com.';statusEl.style.color='#9e372f'}finally{btn.disabled=false;btn.textContent='Send enquiry →'}}
async function checkout(){let form=root.querySelector('#bookingForm');if(!form||!form.reportValidity())return;let s=selectedService(),p=selectedPackage();if(!s||!p)return announce('Select a priced package first.');if(!pricing.directPaymentEligible(p,s.addons||[],ui.addons))return announce('This pricing model requires an individual enquiry.');let data=Object.fromEntries(new FormData(form).entries());data.service_slug=s.slug;data.package_id=p.id;data.addon_ids=ui.addons;data.pay=ui.pay;let b=root.querySelector('#checkoutButton');b.disabled=true;b.textContent='Preparing secure checkout...';try{let r=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});let j=await r.json().catch(()=>({}));if(!r.ok||!j.url)throw new Error(j.error||'Checkout is not available.');window.location.href=j.url}catch(e){const el=root.querySelector('#requestStatus');el.textContent='Payment setup is not yet active: '+e.message;el.style.color='#9e372f';b.disabled=false;b.textContent='Retry secure checkout →'}}
root.addEventListener('click',e=>{let t=e.target.closest('[data-audience]');if(t){ui.audience=t.dataset.audience;ui.category='All';ui.search='';location.hash=audienceLink(ui.audience);rerenderInPlace();return}t=e.target.closest('[data-category]');if(t){ui.category=t.dataset.category;rerenderInPlace();return}t=e.target.closest('[data-photo]');if(t){ui.photo=+t.dataset.photo;rerenderInPlace();return}t=e.target.closest('[data-slide]');if(t){let media=selectedService()?.gallery_urls||[];ui.photo=(ui.photo+Number(t.dataset.slide)+(media.length||1))%(media.length||1);rerenderInPlace();return}t=e.target.closest('[data-package]');if(t){ui.packageId=t.dataset.package;const p=selectedPackage();ui.quantity=pricing.safeQty(p,p?.min_quantity||1);rerenderInPlace();return}if(e.target.closest('#checkoutButton'))checkout()});
root.addEventListener('input',e=>{if(e.target.id==='serviceSearch'){ui.search=e.target.value;updateFilter()}});
root.addEventListener('change',e=>{if(e.target.id==='serviceQty'){ui.quantity=pricing.safeQty(selectedPackage(),e.target.value);setTimeout(rerenderInPlace,0);return}if(e.target.dataset.addon){ui.addons=e.target.checked?[...ui.addons,e.target.dataset.addon]:ui.addons.filter(x=>x!==e.target.dataset.addon);rerenderInPlace()}});
root.addEventListener('submit',async e=>{if(e.target.id==='bookingForm'||e.target.id==='contactForm'){e.preventDefault();await handleForm(e.target,root.querySelector(e.target.id==='bookingForm'?'#requestStatus':'#contactStatus'))}});
window.addEventListener('hashchange',render);
(async()=>{try{all=await store.publicServices()}catch(e){console.warn('Service catalog temporarily unavailable:',e);all=[];announce('Services are temporarily unavailable. Please contact us for a quote.')}render();})();
})();
