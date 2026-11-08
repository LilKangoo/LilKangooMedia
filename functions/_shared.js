export function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
export function rejectMethod(request){if(request.method!=='POST')return json({ok:false,error:'Method not allowed'},405);return null}
export function safeString(value,max=1000){return typeof value==='string'?value.trim().slice(0,max):''}
export function emailValid(value){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)&&value.length<=200}
export function h(v){return String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[x]))}
export async function parseBody(request,max=32000){let len=Number(request.headers.get('content-length')||0);if(len>max)throw new Error('Request too large.');let raw=await request.text();if(raw.length>max)throw new Error('Request too large.');return JSON.parse(raw)}
export function requireEnv(env,keys){let missing=keys.filter(k=>!env[k]);if(missing.length)throw new Error('Server configuration missing: '+missing.join(', '))}
export function storageHeaders(env){return {'apikey':env.SUPABASE_SERVICE_ROLE_KEY,'Authorization':'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json'}}
export async function supabase(env,path,opts={}){
 requireEnv(env,['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY']);
 const r=await fetch(env.SUPABASE_URL.replace(/\/$/,'')+'/rest/v1/'+path,{...opts,headers:{...storageHeaders(env),...(opts.headers||{})}});
 let txt=await r.text();if(!r.ok)throw new Error('Storage error '+r.status+': '+txt.slice(0,300));return txt?JSON.parse(txt):[];
}
export async function serviceAndPrice(env,slug,packageId,addonIds){
 if(!/^[a-z0-9-]{1,90}$/.test(slug))throw new Error('Invalid service.');
 const rows=await supabase(env,'services?slug=eq.'+encodeURIComponent(slug)+'&active=eq.true&select=slug,title,packages,addons,booking_mode,deposit_percent');
 const service=rows?.[0];if(!service)throw new Error('Service unavailable.');
 const pkg=(service.packages||[]).find(p=>p.id===packageId);
 if(!pkg||!Number.isSafeInteger(pkg.price_cents)||pkg.price_cents<0)throw new Error('This service requires an individual quote.');
 if(!Array.isArray(addonIds)||addonIds.length>15)throw new Error('Invalid extras.');
 const unique=new Set(addonIds);if(unique.size!==addonIds.length)throw new Error('Duplicate extras.');
 const selected=[];let total=pkg.price_cents;
 for(const id of unique){const a=(service.addons||[]).find(x=>x.id===id);if(!a||!Number.isSafeInteger(a.price_cents)||a.price_cents<0)throw new Error('Invalid extra.');selected.push(a);total+=a.price_cents}
 if(!Number.isSafeInteger(total)||total>1000000000)throw new Error('Amount out of range.');
 return {service,pkg,selected,total};
}
export async function sendEmail(env,{subject,html,replyTo}){
 requireEnv(env,['RESEND_API_KEY','FROM_EMAIL']);
 let r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:env.FROM_EMAIL,to:[env.CONTACT_EMAIL||'photo@lilkangoomedia.com'],subject,html,reply_to:replyTo})});
 if(!r.ok)throw new Error('Email delivery service error: '+r.status+' '+(await r.text()).slice(0,180));return r.json();
}
export async function turnstileCheck(env,token,remoteip){
 // An optional additional defense; require it for a production launch.
 if(!env.TURNSTILE_SECRET)return true;
 if(!token)return false;
 let r=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({secret:env.TURNSTILE_SECRET,response:token,remoteip:remoteip||''})});
 const body=await r.json();return !!body.success;
}
export function errorMessage(e){return e?.message||'Unexpected server error'}
