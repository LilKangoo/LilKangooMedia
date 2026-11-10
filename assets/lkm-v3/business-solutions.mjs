/* Phase 22.4 — public sector pages and B2B lead form.
 * Uses EXISTING public services + Netlify /api/enquiry. No checkout / refunds.
 */
import {SECTORS,SECTOR_LINKS,activeBusinessServices,getPackages,composeBrief,validSlug} from './business-data.mjs';

const sector=document.body.dataset.businessSector||'hub';
const config=SECTORS[sector]||SECTORS.hub;
const $=id=>document.getElementById(id);
const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
let available=[];
let chosenBundle='';
let requestId='';
let submitting=false;
let turnstileToken='';
let turnstileWidget=null;

function notify(message,type='info'){
  const el=$('lkmBusinessStatus');if(!el)return;
  el.textContent=message;el.dataset.state=type;
}
function validImage(input){
  if(typeof input!=='string'||input.length>1800)return '';
  if(/^\/assets\/[a-zA-Z0-9%._/-]+$/.test(input)&&!input.includes('..')&&!input.includes('//'))return input;
  try {const u=new URL(input);return u.protocol==='https:'&&u.username===''&&u.password===''?u.href:''}catch{return ''}
}
function serviceLink(service){
  const a=make('a','lkm-biz-service-link',service.title+' ↗');
  a.href='/#/service/'+encodeURIComponent(service.slug);
  return a;
}
function card(pack){
  const item=make('article','lkm-biz-offer');
  const top=make('div','lkm-biz-offer-head');
  top.append(make('p','lkm-biz-mini','SUGGESTED COMBINATION'),make('h3','',pack.name));
  item.append(top,make('p','lkm-biz-offer-intro',pack.summary));
  const list=make('div','lkm-biz-offer-services');
  if(pack.services.length){
    pack.services.forEach(s=>list.append(serviceLink(s)));
  } else {
    list.append(make('p','lkm-biz-muted','Ask us to prepare a tailored selection. Published options will appear here when available.'));
  }
  item.append(list);
  const end=make('div','lkm-biz-offer-foot');
  end.append(make('span','', 'Custom scope · Quote before booking'));
  const use=make('button','lkm-biz-offer-select','Request this mix ↗');
  use.type='button';
  use.addEventListener('click',()=>choosePackage(pack));
  end.append(use);item.append(end);
  return item;
}
function drawPackages(){
  const box=$('lkmBusinessOffers');
  if(!box)return;
  box.replaceChildren();
  for(const pack of getPackages(sector,available))box.append(card(pack));
  if(!available.length){
    const p=make('p','lkm-biz-unavailable','The live service catalogue could not be loaded. You can still request a custom quote below.');
    box.append(p);
  }
}
function drawServices(){
  const box=$('lkmBusinessChoices');if(!box)return;
  box.replaceChildren();
  const preferred=new Set((config.packages||[]).flatMap(p=>p.slugs));
  const sorted=[...available].sort((a,b)=>Number(preferred.has(b.slug))-Number(preferred.has(a.slug))||a.title.localeCompare(b.title));
  if(!sorted.length){
    box.append(make('p','lkm-biz-muted','Tell us what you need in the project brief below.'));
    return;
  }
  for(const s of sorted){
    const option=make('label','lkm-biz-service-choice');
    const cb=make('input');cb.type='checkbox';cb.name='selected_services';cb.value=s.slug;
    option.append(cb,make('span','',s.title));box.append(option);
  }
}
function choosePackage(pack){
  chosenBundle=pack.name;
  requestId='';
  const targets=new Set(pack.services.map(s=>s.slug));
  const checks=[...document.querySelectorAll('#lkmBusinessChoices input[type="checkbox"]')];
  for(const cb of checks)cb.checked=targets.has(cb.value);
  notify(pack.services.length
    ? `Selected: ${pack.name}. Review the services and complete your project brief.`
    : `Interested in: ${pack.name}. Describe your needs in the project brief.`, 'info');
  $('business-brief')?.scrollIntoView({behavior:'smooth',block:'start'});
  $('lkmBusinessForm')?.elements?.namedItem('company')?.focus({preventScroll:true});
}
function newUUID(){
  if(globalThis.crypto?.randomUUID)return crypto.randomUUID();
  if(!globalThis.crypto?.getRandomValues)return '';
  const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);
  bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
  const x=[...bytes].map(n=>n.toString(16).padStart(2,'0')).join('');
  return `${x.slice(0,8)}-${x.slice(8,12)}-${x.slice(12,16)}-${x.slice(16,20)}-${x.slice(20)}`;
}
function analytics(event){
  try{
    if(localStorage.getItem('lkm_analytics_consent')==='yes'&&typeof window.gtag==='function')
      window.gtag('event',event,{industry:sector,lead_type:'business_enquiry'});
  }catch(_) { /* No analytics without consent. */ }
}
async function mountTurnstile(){
  const key=String(window.LKM_CONFIG?.TURNSTILE_SITE_KEY||'').trim();
  if(!key)return;
  const box=$('lkmBusinessCaptcha');if(!box)return;
  const render=()=>{
    if(!window.turnstile||turnstileWidget!==null)return;
    try{
      turnstileWidget=window.turnstile.render(box,{sitekey:key,
        callback:t=>{turnstileToken=t;},
        'expired-callback':()=>{turnstileToken='';},
        'error-callback':()=>{turnstileToken='';}
      });
    }catch{notify('Security verification could not load. Please try again or contact us by email.','error')}
  };
  if(window.turnstile){render();return;}
  let script=document.querySelector('script[src*="challenges.cloudflare.com/turnstile/v0/api.js"]');
  if(!script){script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;document.head.append(script);}
  script.addEventListener('load',render,{once:true});
  script.addEventListener('error',()=>notify('Security verification is unavailable. Please try again.','error'),{once:true});
  if(window.turnstile)render();
}
async function sendEnquiry(event){
  event.preventDefault();
  if(submitting)return;
  const form=event.currentTarget;
  if(!form.reportValidity())return;
  const key=String(window.LKM_CONFIG?.TURNSTILE_SITE_KEY||'').trim();
  if(key&&!turnstileToken){notify('Complete the security verification before sending.','error');return;}
  const values=new FormData(form);
  const selected=[...form.querySelectorAll('input[name="selected_services"]:checked')].map(el=>available.find(x=>x.slug===el.value)?.title).filter(Boolean);
  let content;
  try{content=composeBrief({sector,company:values.get('company'),area:values.get('area'),timeline:values.get('timeline'),budget:values.get('budget'),bundle:chosenBundle,services:selected,description:values.get('description')});}
  catch(error){notify(error.message||'Please shorten your project brief.','error');return;}
  if(!requestId)requestId=newUUID();
  const payload={name:values.get('name'),email:values.get('email'),phone:values.get('phone')||'',consent:values.get('consent')||'',website:values.get('website')||'',type:'business_enquiry',service_type:'B2B — '+config.label,message:content,turnstile_token:turnstileToken};
  if(requestId)payload.request_id=requestId;
  const button=$('lkmBusinessSubmit');submitting=true;button.disabled=true;button.textContent='Sending enquiry…';notify('Sending your project brief…');
  try{
    const response=await fetch('/api/enquiry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const reply=await response.json().catch(()=>({}));
    if(!response.ok||reply.ok!==true||reply.saved!==true)throw Error(reply.error||'Your enquiry could not be sent.');
    form.classList.add('is-submitted');
    notify(reply.notification_sent===false
      ? 'Your brief has been saved, but the email alert could not be sent. Please also email photo@lilkangoomedia.com.'
      : 'Thank you. Your business enquiry has been saved. We will contact you to discuss the scope and quotation.',reply.notification_sent===false?'notice':'success');
    analytics('generate_lead');
  }catch(error){
    notify((error?.message||'Unable to send this enquiry.')+' Please try again, or email photo@lilkangoomedia.com.','error');
    button.disabled=false;button.textContent='Retry business enquiry →';
    if(turnstileWidget!==null&&window.turnstile?.reset){try{window.turnstile.reset(turnstileWidget)}catch{}}
    turnstileToken='';
  }finally{submitting=false;}
}
function initForm(){
  const form=$('lkmBusinessForm');if(!form)return;
  form.addEventListener('input',()=>{requestId='';},true);
  form.addEventListener('change',event=>{
    requestId='';
    if(event.target?.name==='selected_services')chosenBundle='';
  },true);
  form.addEventListener('submit',sendEnquiry);
  void mountTurnstile();
}
async function init(){
  initForm();
  try{available=activeBusinessServices(await window.LKMStore?.publicServices?.());}
  catch(error){console.warn('LKM Business Solutions: service catalogue unavailable',error);available=[];}
  drawPackages();drawServices();
}
void init();
