/** Phase 25.2: enhancement only. HTML remains fully useful without JS.
 * The Supabase public catalogue is authoritative for current packages and activity.
 * No prices, secrets, payments or admin operations are performed here. */
const root=document.querySelector('main[data-service-slug]');
const validateSlug=s=>/^[a-z0-9-]{1,90}$/.test(s||'');
const safe=x=>typeof x==='string'?x.trim().slice(0,210):'';
const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
export function cleanServiceResponse(result,slug){
 if(!Array.isArray(result)||!validateSlug(slug))return null;
 const s=result.find(i=>i&&i.slug===slug&&i.active===true);
 if(!s)return null;
 return {slug,title:safe(s.title),packages:Array.isArray(s.packages)?s.packages.filter(p=>p&&typeof p.name==='string'&&p.name.trim()).slice(0,12).map(p=>({name:safe(p.name),description:safe(p.description)})):[]};
}
export function renderServiceState(container,cta,service,slug){
 if(!container)return;
 container.replaceChildren();
 if(!service){
  // An authoritative empty public catalogue response means the service is unpublished.
  const robots=document.querySelector('meta[name="robots"]');if(robots)robots.content='noindex,follow';
  container.append(make('p','','Current availability could not be confirmed. Please use the full service catalogue for up-to-date options.'));
  const link=make('a','','Browse current services ↗');link.href='/#/services';container.append(link);
  if(cta){cta.textContent='Browse current services ↗';cta.href='/#/services';}
  return;
 }
 container.append(make('p','',service.packages.length?'Packages currently listed in the service catalogue:':'This service is available for a tailored enquiry.'));
 if(service.packages.length){const list=make('ul');for(const p of service.packages){const li=make('li');li.append(make('strong','',p.name));if(p.description)li.append(make('small','',p.description));list.append(li)}container.append(list)}
 // The faster quote path is offered only after the live catalogue confirms an ACTIVE service.
 // The original explore link remains available for visitors who want more detail first.
 if(cta && !document.getElementById('lkm253SeoDirect')){
  const quick=make('a','lkm25-button lkm25-button-secondary','Build a quote →');
  quick.id='lkm253SeoDirect';
  quick.href='/?lkm_service='+encodeURIComponent(slug)+'#/quote';
  quick.setAttribute('aria-label','Start a quote for '+(service.title||'this service'));
  cta.parentNode?.append(quick);
 }
 const link=make('a','','View packages and request details ↗');link.href='/#/service/'+encodeURIComponent(slug);container.append(link);
}
if(root){
 const slug=root.dataset.serviceSlug;
 const cfg=window.LKM_CONFIG||{};
 const base=String(cfg.SUPABASE_URL||'').replace(/\/+$/,'');const key=String(cfg.SUPABASE_ANON_KEY||'');
 const host=document.getElementById('lkm25-live-service'),cta=document.getElementById('lkmServiceMainCta');
 if(validateSlug(slug)&&/^https:\/\/[^/]+$/.test(base)&&key){
  try{
   const url=base+'/rest/v1/services?select=slug,title,active,packages&active=eq.true&slug=eq.'+encodeURIComponent(slug)+'&limit=1';
   const response=await fetch(url,{cache:'no-store',headers:{apikey:key,Accept:'application/json'}});
   if(response.ok){const json=await response.json();renderServiceState(host,cta,cleanServiceResponse(json,slug),slug)}
  }catch{/* Static canonical SEO content and links remain useful even offline. */}
 }
}
