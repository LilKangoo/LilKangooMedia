/* Phase 24.1: pure functions; no network or browser dependencies. */
export const validEmail=x=>typeof x==='string'&&x.trim().length<=200&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x.trim());
export const cleanEmail=x=>validEmail(x)?x.trim().toLowerCase():'';
export const validOtp=x=>typeof x==='string'&&/^\d{6,8}$/.test(x.trim());
export function sessionFromFragment(hash){
 const p=new URLSearchParams(String(hash||'').replace(/^#/,''));
 const a=p.get('access_token'),r=p.get('refresh_token'),s=Number(p.get('expires_in')||0);
 if(!a||!r||s<=0||s>172800||p.get('token_type')?.toLowerCase()!=='bearer')return null;
 return {access_token:a,refresh_token:r,expires_at:Math.floor(Date.now()/1000)+s};
}
export function cleanItems(data){
 if(!data||data.ok!==true||!Array.isArray(data.items))return [];
 return data.items.filter(x=>x&&/^[0-9a-f-]{36}$/i.test(x.request_id||'')).slice(0,100).map(x=>({
  id:x.request_id,service:String(x.service||'Creative services').slice(0,160),
  date:/^\d{4}-\d{2}-\d{2}$/.test(x.preferred_date||'')?x.preferred_date:null,
  submitted:String(x.submitted_on||''),
  status:['confirmed','declined','cancelled','received'].includes(x.status)?x.status:'received'}));
}
export const statusLabel=x=>({confirmed:'Booking confirmed',declined:'Request declined',cancelled:'Cancelled',received:'Request received'}[x]||'Request received');
