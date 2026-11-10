/** Netlify Checkout. Off by default; prices always calculated from active Supabase service. */
import {json,value,emailOK,uuidOK,validDate,siteURL,paymentMode,supabase,quotePrice,verifyTurnstile} from '../lib/payments.mjs';
export default async function checkout(request){
  if(request.method!=='POST')return json({ok:false,error:'Method not allowed'},405);
  const mode=paymentMode(process.env);
  if(mode==='off')return json({ok:false,error:'Online payments are not enabled. Please send an enquiry.'},503);
  const origin=request.headers.get('origin');
  if(origin&&origin!==new URL(request.url).origin)return json({ok:false,error:'Invalid request origin'},403);
  if(!(request.headers.get('content-type')||'').toLowerCase().includes('application/json'))return json({ok:false,error:'Expected JSON'},415);
  if(Number(request.headers.get('content-length')||0)>32000)return json({ok:false,error:'Request too large'},413);
  let data;try{const raw=await request.text();if(raw.length>32000)throw Error();data=JSON.parse(raw);if(!data||typeof data!=='object'||Array.isArray(data))throw Error();}catch{return json({ok:false,error:'Invalid request'},400)}
  const name=value(data.name,100),email=value(data.email,200),date=value(data.preferred_date,25),slug=value(data.service_slug,90),pkgId=value(data.package_id,100);
  const token=value(data.payment_request_id,50),consent=data.consent===true||data.consent==='on'||data.consent==='true';
  if(!name||!emailOK(email)||!validDate(date)||!consent||!uuidOK(token)||!/^[-a-z0-9]{1,90}$/.test(slug)||!pkgId)return json({ok:false,error:'Complete your name, email, preferred date and consent.'},400);
  if(data.website)return json({ok:false,error:'Invalid request'},400);
  const time=value(data.booking_time,20);if(time&&!['flexible','morning','afternoon','evening'].includes(time))return json({ok:false,error:'Invalid preferred time'},400);
  const alternative=value(data.booking_alternative_date,25);
  if(alternative&&(!validDate(alternative)||alternative===date))return json({ok:false,error:'Invalid alternative date'},400);
  const ids=data.addon_ids||[];
  try{
    const ip=(request.headers.get('x-nf-client-connection-ip')||request.headers.get('x-forwarded-for')||'').split(',')[0].trim();
    if(!await verifyTurnstile(process.env,data.turnstile_token||data['cf-turnstile-response'],ip))return json({ok:false,error:'Please complete anti-spam verification.'},403);
    const rows=await supabase(process.env,'services?slug=eq.'+encodeURIComponent(slug)+'&active=eq.true&select=slug,title,packages,addons,booking_mode,deposit_percent');
    const service=rows?.[0];
    const price=quotePrice(service,pkgId,ids);
    // Phase 21.3: server-side calendar check. Never rely on a browser date picker.
    // A missing/corrupt availability table fails closed for payments, not enquiries.
    const blocks=await supabase(process.env,
      'lkm_availability_blocks?select=id&blocked_date=eq.'+date+
      '&or=(service_slug.eq.'+slug+',service_slug.is.null)&limit=1');
    if(blocks.length) return json({ok:false,error:'This date is blocked. Please select another date or send an enquiry.'},409);
    const reservations=await supabase(process.env,
      'lkm_booking_confirmations?select=id&booking_date=eq.'+date+
      '&service_slug=eq.'+slug+'&state=eq.confirmed&limit=1');
    if(reservations.length) return json({ok:false,error:'This service is already booked on that date. Please choose another day or send an enquiry.'},409);
    // Phase 21.4B: serialized, server-side WHOLE-DAY hold for this paid Checkout.
    // Current package durations vary, so do not pretend that an unknown duration
    // can safely hold just one hour. The hold is released by Stripe expiry event.
    await supabase(process.env,'rpc/lkm_checkout_hold_acquire',{
      method:'POST',body:JSON.stringify({p_request_id:token,p_service_slug:slug,p_booking_date:date})});
    const site=siteURL(process.env);
    const form=new URLSearchParams();
    form.set('mode','payment');form.set('payment_method_types[0]','card');
    // Stripe's minimum custom expiry is 30 minutes. Use 32 minutes to allow for
    // network delay and server clock skew; its signed expiry event
    // releases the DB hold (no optimistic local timer-based release).
    form.set('expires_at',String(Math.floor(Date.now()/1000)+32*60));
    form.set('success_url',site+'/#/payment-return?session_id={CHECKOUT_SESSION_ID}');
    form.set('cancel_url',site+'/#/request');form.set('customer_email',email);
    form.set('line_items[0][price_data][currency]','eur');
    form.set('line_items[0][price_data][unit_amount]',String(price.due));
    form.set('line_items[0][price_data][product_data][name]',String(service.title).slice(0,150)+' — '+String(price.pkg.name).slice(0,100)+(price.kind==='deposit'?' (deposit; date pending confirmation)':''));
    form.set('line_items[0][quantity]','1');
    const meta={lkm_project:'lilkangoomedia',service_slug:slug,package_id:pkgId,preferred_date:date,customer_name:name,customer_phone:value(data.phone,40),booking_time:time||'flexible',booking_alternative_date:alternative,booking_location:value(data.booking_location,160),quoted_total_cents:String(price.total),payment_kind:price.kind,addon_ids:price.addons.map(a=>a.id).join(','),request_id:token};
    for(const [k,v] of Object.entries(meta))form.set('metadata['+k+']',v.slice(0,450));
    const response=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:'Bearer '+process.env.STRIPE_SECRET_KEY,'Content-Type':'application/x-www-form-urlencoded','Idempotency-Key':'lkm-'+token},body:form});
    const result=await response.json().catch(()=>({}));
    if(!response.ok||!/^cs_(test|live)_[A-Za-z0-9]+$/.test(result.id||'')||
        typeof result.url!=='string'||!result.url.startsWith('https://checkout.stripe.com/'))throw Error('Stripe checkout unavailable');
    // Do not return a usable Checkout URL unless the DB knows its Stripe session.
    // A failed attach leaves a conservative hold rather than risking double payment.
    await supabase(process.env,'rpc/lkm_checkout_hold_attach',{
      method:'POST',body:JSON.stringify({p_request_id:token,p_session_id:result.id})});
    return json({ok:true,url:result.url});
  }catch(err){console.error('LKM checkout unavailable:',err.message);
    const conflict=err?.status===409;
    return json({ok:false,error:conflict?
      'This service and date currently have a booking or payment in progress. Please choose another date or send an enquiry.':
      'Secure checkout is unavailable for this selection. Please send an enquiry instead.'},conflict?409:503)}
}
export const config={path:'/api/checkout'};
