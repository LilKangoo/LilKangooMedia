/** LilKangooMedia Phase 21.2. Server-only payment helpers. Never expose Stripe/Supabase keys. */
import {createHmac, timingSafeEqual} from 'node:crypto';

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {status, headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
export const value = (x,max=180) => typeof x === 'string' ? x.trim().slice(0,max) : '';
export const emailOK = x => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x) && x.length <= 200;
export const escapeHTML = x => String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const uuidOK = x => /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(x||'');
export function cyprusToday(){
  const parts = new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Nicosia',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const p=k=>parts.find(x=>x.type===k)?.value;
  return `${p('year')}-${p('month')}-${p('day')}`;
}
export function validCalendarDate(s){
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s||'')) return false;
  const d=new Date(s+'T12:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0,10)===s;
}
export function validDate(s){
  return validCalendarDate(s) && s>=cyprusToday() && s<=`${Number(cyprusToday().slice(0,4))+2}-12-31`;
}
export function siteURL(env){
  const raw=value(env.SITE_URL||'https://lilkangoomedia.com/',240);
  const url=new URL(raw);
  if(url.protocol!=='https:' || !['lilkangoomedia.com','www.lilkangoomedia.com'].includes(url.hostname)||url.username||url.password||url.port||url.pathname!=='/'||url.search||url.hash) throw Error('Invalid SITE_URL');
  return url.origin;
}
export function paymentMode(env){
  const mode=value(env.LKM_PAYMENTS_MODE,10).toLowerCase();
  if (!['test','live'].includes(mode))return 'off';
  if (!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY||!env.STRIPE_WEBHOOK_SECRET||!env.STRIPE_SECRET_KEY) return 'off';
  if (!/^whsec_\S{8,}$/.test(env.STRIPE_WEBHOOK_SECRET))return 'off';
  if (mode==='test' && !/^sk_test_\S{8,}$/.test(env.STRIPE_SECRET_KEY))return 'off';
  if (mode==='live' && (!/^sk_live_\S{8,}$/.test(env.STRIPE_SECRET_KEY)||env.LKM_LIVE_PAYMENTS_APPROVED!=='YES'))return 'off';
  try{siteURL(env)}catch{return 'off'}
  return mode;
}
export function headers(env,extra={}){
  const key=env.SUPABASE_SERVICE_ROLE_KEY;
  if(!key||!env.SUPABASE_URL)throw Error('Missing database configuration');
  const h={apikey:key,'Content-Type':'application/json',...extra};
  if(!key.startsWith('sb_secret_'))h.Authorization='Bearer '+key;
  return h;
}
export async function supabase(env, path, init={}){
  const base=new URL(env.SUPABASE_URL);
  if(base.protocol!=='https:'||!base.hostname.endsWith('.supabase.co'))throw Error('Invalid database origin');
  const response=await fetch(base.origin+'/rest/v1/'+path,{...init,headers:headers(env,init.headers)});
  if(!response.ok){console.error('LKM payments: database request failed', response.status);const err=new Error('Database unavailable');err.status=response.status;throw err;}
  const data=await response.text();
  return data?JSON.parse(data):[];
}
export function quotePrice(service,pkgId,ids){
  if(!service||!['deposit','full'].includes(service.booking_mode))throw Error('Payment not enabled for this service');
  if(!Array.isArray(ids)||ids.length>15||new Set(ids).size!==ids.length||ids.some(id=>typeof id!=='string'||id.length>100))throw Error('Invalid extras');
  const pkg=(Array.isArray(service.packages)?service.packages:[]).find(p=>p.id===pkgId);
  // Exclude variable amounts, recurring plans, indicative "from" pricing and setup fees.
  if(!pkg||!['fixed',''].includes(pkg.pricing_model||'fixed')||pkg.show_from||Number(pkg.setup_fee_cents||0)!==0||!Number.isSafeInteger(pkg.price_cents)||pkg.price_cents<0)throw Error('This package requires a custom quote');
  const picked=[];let total=pkg.price_cents;
  for(const id of ids){
    const addon=(Array.isArray(service.addons)?service.addons:[]).find(a=>a.id===id);
    if(!addon||!['once',''].includes(addon.billing_model||'once')||!Number.isSafeInteger(addon.price_cents)||addon.price_cents<0)throw Error('This extra requires a custom quote');
    picked.push(addon);total+=addon.price_cents;
  }
  if(!Number.isSafeInteger(total)||total>1000000000)throw Error('Invalid total');
  const percent=Number(service.deposit_percent);
  if(service.booking_mode==='deposit' && (!Number.isFinite(percent)||percent<=0||percent>100))throw Error('Invalid deposit setting');
  const due=service.booking_mode==='deposit'?Math.round(total*percent/100):total;
  if(due<50)throw Error('Payment below minimum');
  return {pkg,addons:picked,total,due,kind:service.booking_mode};
}
export function validSignature(raw,header,secret){
  if(typeof raw!=='string'||raw.length>102400||typeof header!=='string'||!secret)return false;
  const tokens=header.split(',').map(p=>p.trim().split('=')).filter(p=>p.length===2);
  const ts=tokens.find(p=>p[0]==='t')?.[1];
  const timestamp=Number(ts);
  if(!/^\d{10,11}$/.test(ts||'')||!Number.isSafeInteger(timestamp)||Math.abs(Math.floor(Date.now()/1000)-timestamp)>300)return false;
  const expected=createHmac('sha256',secret).update(ts+'.'+raw).digest();
  return tokens.filter(p=>p[0]==='v1'&&/^[0-9a-f]{64}$/i.test(p[1])).some(p=>{
    const sig=Buffer.from(p[1],'hex');return sig.length===expected.length&&timingSafeEqual(sig,expected);
  });
}
export async function verifyTurnstile(env,token,ip){
  if(!env.TURNSTILE_SECRET)return true;
  if(!token)return false;
  const r=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({secret:env.TURNSTILE_SECRET,response:token,remoteip:ip||''})});
  if(!r.ok)return false;
  const data=await r.json();return data.success===true;
}
