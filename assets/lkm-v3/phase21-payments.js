/* LilKangooMedia Phase 21.2 — gated Stripe Checkout, single-service fixed-price packages only.
 * Backend calculates authoritative price; no credentials or totals are trusted from the browser.
 * Phase 21.1 deliberately hides the old unsupported checkoutButton; this UI creates its own.
 */
(() => {
  'use strict';
  if (window.__lkmPhase212Loaded) return;
  window.__lkmPhase212Loaded = true;
  const root = document.getElementById('main');
  if (!root) return;
  let readiness = null;
  let catalogPromise = null;
  let pending = false;
  let queued = false;
  const requestPage = () => /^#\/request(?:[?]|$)/.test(location.hash);
  const getSlug = () => {try {return sessionStorage.getItem('lkm_selected_service') || '';} catch {return '';}};
  const readSnap = slug => {try{return JSON.parse(sessionStorage.getItem('lkm_phase18_main_'+slug)||'null')}catch{return null}};
  const make = (tag, className, text) => {const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;};
  const newUUID=()=>{
    if(window.crypto?.randomUUID)return window.crypto.randomUUID();
    if(!window.crypto?.getRandomValues)return '';
    const a=new Uint8Array(16);window.crypto.getRandomValues(a);a[6]=(a[6]&15)|64;a[8]=(a[8]&63)|128;
    const s=Array.from(a,b=>b.toString(16).padStart(2,'0')).join('');
    return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20)}`;
  };
  async function options(){
    if(!readiness){readiness=fetch('/api/payment-options',{cache:'no-store'}).then(r=>r.ok?r.json():{enabled:false}).catch(()=>({enabled:false}));}
    return readiness;
  }
  async function catalog(){
    if(!catalogPromise)catalogPromise=Promise.resolve(window.LKMStore?.publicServices?.()||[]).catch(()=>[]);
    return catalogPromise;
  }
  function incompatible(){
    // Phase 13 bundles or Phase 18 advanced/custom packages have custom quotations.
    return !!root.querySelector('#lkm-bundle-request-summary,.lkm-bundle-payment-notice,#lkm18-request-total,.lkm18-has-request-total');
  }
  async function enhance(){
    if(!requestPage())return;
    const form=root.querySelector('#bookingForm');
    if(!form||form.querySelector('#lkm21-pay'))return;
    const oldCheckout=form.querySelector('#checkoutButton');
    // The native SPA only creates this element for fixed-price eligible selections.
    if(!oldCheckout||incompatible())return;
    const settings=await options();
    if(!requestPage()||!root.contains(form)||form.querySelector('#lkm21-pay')||!settings.enabled||incompatible())return;
    const slug=getSlug(),snap=readSnap(slug);
    if(!snap?.pkgId||!Array.isArray(snap.addons)||Number(snap.qty||1)!==1)return;
    const services=await catalog();
    if(!root.contains(form)||!requestPage()||form.querySelector('#lkm21-pay')||incompatible())return;
    const service=services.find(s=>s.slug===slug&&s.active!==false);
    if(!service||!['deposit','full'].includes(service.booking_mode))return;
    const pkg=(service.packages||[]).find(p=>p.id===snap.pkgId);
    if(!pkg||!['fixed',''].includes(pkg.pricing_model||'fixed')||pkg.show_from||Number(pkg.setup_fee_cents||0)!==0)return;
    if(snap.addons.some(id=>!(service.addons||[]).some(a=>a.id===id&&['once',''].includes(a.billing_model||'once'))))return;
    const pay=make('button','button button-orange lkm21-pay',settings.mode==='test'?'Test Stripe checkout (no real charge) →':service.booking_mode==='deposit'?'Pay secure deposit →':'Pay securely with Stripe →');
    pay.id='lkm21-pay';pay.type='button';
    pay.dataset.serviceSlug=slug;
    const note=make('p','lkm21-payment-note',settings.mode==='test'?'Sandbox mode: test cards only, no real money is charged.':'Paying does not confirm your preferred date. Our team will confirm availability and the final details.');
    note.id='lkm21-payment-note';
    const status=make('p','lkm21-payment-status','');status.id='lkm21-payment-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    const submit=form.querySelector('#requestSubmit');
    const parent=submit?.parentNode||form;
    if(submit){submit.after(pay,note,status);}else parent.append(pay,note,status);
    pay.addEventListener('click',async()=>{
      if(pending||!form.reportValidity())return;
      if(incompatible()){status.textContent='Custom and combined services require a personal quote. Please send your enquiry.';return;}
      const date=form.querySelector('[name="preferred_date"]')?.value;
      if(!date){status.textContent='Please select a preferred date for a payment request.';form.querySelector('[name="preferred_date"]')?.focus();return;}
      const formData=Object.fromEntries(new FormData(form).entries());
      const info={...formData, service_slug:slug,package_id:snap.pkgId,addon_ids:snap.addons};
      delete info.request_id; // enquiry IDs and payment IDs are separate workflows.
      const stamp=JSON.stringify(info);
      if(pay.dataset.paymentFingerprint!==stamp){pay.dataset.paymentFingerprint=stamp;pay.dataset.paymentRequestId=newUUID();}
      if(!pay.dataset.paymentRequestId){status.textContent='Secure checkout is not supported in this browser. Please send an enquiry.';return;}
      info.payment_request_id=pay.dataset.paymentRequestId;
      pending=true;pay.disabled=true;pay.textContent='Preparing secure checkout…';status.textContent='';
      try{
        const result=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(info)});
        const body=await result.json().catch(()=>({}));
        if(!result.ok||!body.ok||typeof body.url!=='string'||!body.url.startsWith('https://checkout.stripe.com/'))throw Error(body.error||'Unable to open secure checkout.');
        window.location.assign(body.url);
      }catch(err){
        status.textContent=(err.message||'Payment currently unavailable.')+' You can still send your enquiry without payment.';
        pay.disabled=false;pay.textContent='Retry secure checkout →';
        pending=false;
      }
    });
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;void enhance()})}
  new MutationObserver(schedule).observe(root,{childList:true});
  window.addEventListener('hashchange',schedule);
  schedule();
})();
