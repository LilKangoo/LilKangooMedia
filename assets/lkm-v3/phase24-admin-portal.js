/* LilKangooMedia Phase 24.1 — one small portal access control in existing CRM.
   Admin-only Supabase JWT + RLS. Enabling a grant NEVER emails the client.
   The CRM itself remains responsible for its original enquiry, quote and stage UI. */
(()=>{'use strict';
 const root=document.getElementById('lkmCrmRoot');if(!root||window.__LKM24AdminPortal)return;
 window.__LKM24AdminPortal=true;
 const store=window.LKMStore,config=window.LKM_CONFIG||{};
 const base=String(config.SUPABASE_URL||'').replace(/\/+$/,''),key=config.SUPABASE_ANON_KEY||'';
 const uuid=x=>/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(x||'');
 let scheduled=false;
 const elem=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
 async function rest(path,options={}){
  if(!store?.configured||!base.startsWith('https://'))throw Error('Supabase must be configured.');
  const token=await store.authenticatedToken();
  const r=await fetch(base+'/rest/v1/'+path,{method:options.method||'GET',headers:{apikey:key,Authorization:'Bearer '+token,Accept:'application/json','Content-Type':'application/json',...(options.body?{Prefer:'return=representation'}:{}),...(options.headers||{})},...(options.body?{body:JSON.stringify(options.body)}:{})});
  if(!r.ok){const err=await r.json().catch(()=>({}));throw Error((err.message||'Portal access unavailable. Run Phase 24.1 SQL.').slice(0,210));}
  const body=await r.text();return body?JSON.parse(body):null;
 }
 async function mount(section,id){
  const status=section.querySelector('[data-p24-status]'),controls=section.querySelector('[data-p24-controls]');
  function note(text,error=false){if(!section.isConnected)return;status.textContent=text;status.classList.toggle('is-error',error)}
  const selected=()=>root.querySelector('.lkm23-card.is-selected[data-lead-id]')?.dataset.leadId;
  try{
   if(!await store.isAdmin())throw Error('Administrator permission required.');
   const leadRows=await rest('contact_leads?select=id,customer_name,customer_email,archived_at&id=eq.'+encodeURIComponent(id)+'&limit=1');
   const lead=Array.isArray(leadRows)?leadRows[0]:null;
   if(!lead||!lead.customer_email||selected()!==id||!section.isConnected)return;
   const grants=await rest('lkm_client_grants?select=lead_id,client_email,active,updated_at&lead_id=eq.'+encodeURIComponent(id)+'&limit=1');
   if(selected()!==id||!section.isConnected)return;
   const grant=grants?.[0]||null,active=grant?.active===true;
   controls.replaceChildren();
   const email=elem('p','lkm24-admin-email');email.append(elem('span','','Customer email: '),elem('strong','',lead.customer_email));controls.append(email);
   if(lead.archived_at){note('Archived enquiry — restore it before granting access.');return;}
   const state=elem('span','lkm24-admin-pill'+(active?' is-active':''),active?'Client access enabled':'Client access disabled');controls.append(state);
   const btn=elem('button','button '+(active?'button-light':'button-dark'),active?'Revoke access':'Enable client access');btn.type='button';controls.append(btn);
   const portal=elem('a','lkm24-admin-link','Client portal ↗');portal.href='/client.html';portal.target='_blank';portal.rel='noopener noreferrer';controls.append(portal);
   const copy=elem('button','button button-light','Copy portal link');copy.type='button';controls.append(copy);
   copy.addEventListener('click',async()=>{const url=window.location.origin+'/client.html';try{await navigator.clipboard.writeText(url);note('Portal link copied. Send it to the customer manually.');}catch{note('Copy this link: '+url);}});
   const hint=elem('p','lkm24-admin-hint','Only a person who signs in with this verified email can see the assigned request summary. Send the portal link manually; no invitation email is sent automatically.');controls.append(hint);
   btn.addEventListener('click',async()=>{
     if(!section.isConnected||selected()!==id)return;
     if(!confirm(active?'Revoke this customer’s portal access?':'Enable secure portal access for '+lead.customer_email+'?\n\nThis does NOT send an email.'))return;
     btn.disabled=true;note('Saving client access…');
     try{
       const payload={client_email:lead.customer_email.trim().toLowerCase(),active:!active};
       if(grant){await rest('lkm_client_grants?lead_id=eq.'+encodeURIComponent(id),{method:'PATCH',body:payload});}
       else{await rest('lkm_client_grants',{method:'POST',body:{lead_id:id,...payload}});}
       if(section.isConnected&&selected()===id)await mount(section,id);
     }catch(err){note(err.message||'Could not change access.',true);btn.disabled=false;}
   });
   note(active?'Client access is enabled. Send /client.html to this customer if needed.':'Enable access once the customer is ready to use the portal.');
  }catch(error){note(error.message||'Could not load client access.',true)}
 }
 function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;attach()})}
 function attach(){
  const selected=root.querySelector('.lkm23-card.is-selected[data-lead-id]');
  const id=selected?.dataset.leadId,host=document.getElementById('lkm23Details');
  if(!uuid(id)||!host||host.querySelector('[data-p24-section]'))return;
  const section=elem('section','lkm24-admin-section');section.dataset.p24Section='';
  section.append(elem('h3','','Client portal access'),elem('p','lkm24-admin-description','Manage private customer access here, without leaving the CRM.'));
  const controls=elem('div','lkm24-admin-controls');controls.dataset.p24Controls='';section.append(controls);
  const status=elem('p','lkm24-admin-status','Loading client access…');status.dataset.p24Status='';status.setAttribute('role','status');section.append(status);
  const next=host.querySelector('.lkm23-edit');if(next)next.before(section);else host.append(section);
  void mount(section,id);
 }
 new MutationObserver(schedule).observe(root,{childList:true,subtree:true});attach();
})();
