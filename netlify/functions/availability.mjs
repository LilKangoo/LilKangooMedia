/** Phase 21.3 — public, read-only availability for ONE service + ONE month.
 * Never disclose admin notes, email addresses, customer details or order metadata.
 * Dates marked unavailable are explicit admin blocks only. Open dates are requests,
 * NOT promised capacity or confirmed reservations.
 */
import {json, value, validCalendarDate, cyprusToday, supabase} from '../lib/payments.mjs';

export function validMonth(month){
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month || '') &&
    month >= cyprusToday().slice(0,7) && month <= String(Number(cyprusToday().slice(0,4))+2)+'-12';
}
export function monthLimits(month){
  const [y,m] = month.split('-').map(Number);
  return {start:`${month}-01`,end:new Date(Date.UTC(y,m,0)).toISOString().slice(0,10)};
}
export async function publicAvailability(serviceSlug, month, env){
  if(!/^[a-z0-9-]{1,90}$/.test(serviceSlug || '') || !validMonth(month))
    return json({ok:false,error:'Choose a valid service and month.'},400);
  const active=await supabase(env,'services?slug=eq.'+encodeURIComponent(serviceSlug)+'&active=eq.true&select=slug&limit=1');
  if(!active.length) return json({ok:false,error:'Service unavailable.'},404);
  const {start,end}=monthLimits(month);
  // Admin-only table queried server-side with service-role; return only dates.
  const path='lkm_availability_blocks?select=blocked_date&blocked_date=gte.'+start+
    '&blocked_date=lte.'+end+'&or=(service_slug.eq.'+serviceSlug+',service_slug.is.null)&limit=100';
  const rows=await supabase(env,path);
  const blocked=[...new Set(rows.map(r=>r.blocked_date).filter(validCalendarDate))].sort();
  return json({ok:true,service_slug:serviceSlug,month,blocked_dates:blocked,
    notice:'Availability is provisional. LilKangooMedia confirms each booking manually.'});
}
export default async function availability(request){
  if(request.method!=='GET')return json({ok:false,error:'Method not allowed.'},405);
  const url=new URL(request.url);
  try {return await publicAvailability(value(url.searchParams.get('service'),90),value(url.searchParams.get('month'),7),process.env)}
  catch(error){console.error('LKM availability lookup failed:',error.message);
    return json({ok:false,error:'Availability cannot be verified right now. You can still request a date.'},503)}
}
export const config={path:'/api/availability'};
