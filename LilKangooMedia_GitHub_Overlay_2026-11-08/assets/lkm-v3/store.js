/* LilKangooMedia data access. When Supabase is not configured, the demo
   stores edits in this browser only. This local preview is NOT secure and is
   NEVER a substitute for server-authenticated administration. */
(function(){
  'use strict';
  const cfg=window.LKM_CONFIG||{};
  const configured=!!(cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY);
  const api=String(cfg.SUPABASE_URL||'').replace(/\/$/,'');
  const anon=cfg.SUPABASE_ANON_KEY||'';
  const demoKey='LKM_V3_DEMO_SERVICES';
  const tokenKey='LKM_V3_ADMIN_SESSION';
  const clone=x=>JSON.parse(JSON.stringify(x));
  const seed=clone(window.LKM_SEED||[]);
  const defaultMedia=(s)=>s.gallery_urls||[];
  function getDemo(){try{let s=JSON.parse(localStorage.getItem(demoKey));return Array.isArray(s)?s:clone(seed)}catch(e){return clone(seed)}}
  const baseHeaders=()=>({'apikey':anon,'Content-Type':'application/json'});
  function getSession(){try{return JSON.parse(sessionStorage.getItem(tokenKey)||'null')}catch(e){return null}}
  function setSession(s){if(s)sessionStorage.setItem(tokenKey,JSON.stringify(s));else sessionStorage.removeItem(tokenKey)}
  async function request(endpoint,options={}){
    const response=await fetch(api+endpoint,{...options,headers:{...baseHeaders(),...(options.headers||{})}});
    if(!response.ok){let text=await response.text();throw new Error('Supabase request failed ('+response.status+'): '+text.slice(0,170))}
    let body=await response.text();return body?JSON.parse(body):null;
  }
  async function publicServices(){
    if(!configured)return getDemo().filter(s=>s.active!==false).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
    const r=await request('/rest/v1/services?select=*&active=eq.true&order=sort_order.asc');return r||[];
  }
  async function adminServices(){
    if(!configured)return getDemo().sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
    const t=await authenticatedToken();return await request('/rest/v1/services?select=*&order=sort_order.asc',{headers:{'Authorization':'Bearer '+t}})||[];
  }
  async function login(email,password){
    if(!configured)throw new Error('Preview mode: no production credentials configured. Use the local preview panel without signing in.');
    let data=await request('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});
    setSession(data);return data;
  }
  async function authenticatedToken(){
    let s=getSession();if(!s?.access_token)throw new Error('Please sign in.');
    if(s.expires_at && Date.now()/1000 > s.expires_at-60){
      let next=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:s.refresh_token})});
      setSession(next);return next.access_token;
    }
    return s.access_token;
  }
  async function isAdmin(){
    if(!configured)return true;
    let jwt=await authenticatedToken();
    const data=await request('/rest/v1/admin_users?select=user_id&limit=1',{headers:{'Authorization':'Bearer '+jwt}});
    return !!(data&&data.length);
  }
  async function saveService(obj,previousSlug){
    if(!configured){const list=getDemo();let i=list.findIndex(x=>x.slug===previousSlug);if(i>=0)list[i]={...list[i],...clone(obj)};else list.push(clone(obj));localStorage.setItem(demoKey,JSON.stringify(list));return obj}
    let jwt=await authenticatedToken();
    if(previousSlug){
      let data=await request('/rest/v1/services?slug=eq.'+encodeURIComponent(previousSlug),{method:'PATCH',headers:{'Authorization':'Bearer '+jwt,'Prefer':'return=representation'},body:JSON.stringify(obj)});
      if(!data||!data.length)throw new Error('Save failed: no rows updated. Check RLS admin role.');return data[0];
    }
    let data=await request('/rest/v1/services',{method:'POST',headers:{'Authorization':'Bearer '+jwt,'Prefer':'return=representation'},body:JSON.stringify(obj)});
    if(!data||!data.length)throw new Error('Could not create service.');return data[0];
  }
  async function deleteService(slug){
    // Soft-delete: avoid losing bookings, links and catalog audit history.
    const all=await adminServices();let prev=all.find(x=>x.slug===slug);if(!prev)throw new Error('Unknown service');return saveService({...prev,active:false},slug);
  }
  async function getLeads(){
    if(!configured)return [];
    const jwt=await authenticatedToken();
    return await request('/rest/v1/contact_leads?select=*&order=created_at.desc&limit=200',{headers:{'Authorization':'Bearer '+jwt}})||[];
  }
  async function getOrders(){
    if(!configured)return [];
    const jwt=await authenticatedToken();
    return await request('/rest/v1/stripe_orders?select=*&order=created_at.desc&limit=200',{headers:{'Authorization':'Bearer '+jwt}})||[];
  }
  window.LKMStore={configured,publicServices,adminServices,login,isAdmin,getSession,authenticatedToken,getOrders,logout:()=>setSession(null),saveService,deleteService,getLeads,clone,seed,defaultMedia};
})();
