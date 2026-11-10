/** Stripe signed webhook. Saves paid-but-unconfirmed order once, even during concurrent redelivery. */
import {json,value,emailOK,validCalendarDate,paymentMode,supabase,validSignature,escapeHTML} from '../lib/payments.mjs';
export default async function stripeWebhook(request){
  if(request.method!=='POST')return json({ok:false,error:'Method not allowed'},405);
  const mode=paymentMode(process.env);
  if(mode==='off')return json({ok:false,error:'Webhook not configured'},503);
  let raw;try{raw=await request.text();if(raw.length>102400)return json({ok:false},413)}catch{return json({ok:false},400)}
  if(!validSignature(raw,request.headers.get('stripe-signature')||'',process.env.STRIPE_WEBHOOK_SECRET))return json({ok:false,error:'Invalid signature'},400);
  let event;try{event=JSON.parse(raw)}catch{return json({ok:false,error:'Invalid payload'},400)}
  const handled=['checkout.session.completed','checkout.session.async_payment_succeeded',
    'checkout.session.expired','checkout.session.async_payment_failed'];
  if(!handled.includes(event.type))return json({ok:true,ignored:true});
  const session=event?.data?.object;
  if(!session||session.object!=='checkout.session'||session.mode!=='payment')return json({ok:true,ignored:true});
  if(session.livemode !== (mode==='live'))return json({ok:false,error:'Wrong Stripe mode'},400);
  const meta=session.metadata||{};
  // Same Stripe account may process other brands. Ignore Checkout events not created by LKM.
  if(meta.lkm_project!=='lilkangoomedia')return json({ok:true,ignored:true});
  const holdRequest=value(meta.request_id,50);
  if(!/^[-a-f0-9]{36}$/i.test(holdRequest)||!/^cs_(test|live)_[A-Za-z0-9]+$/.test(session.id||''))
    return json({ok:false,error:'Invalid hold identifier'},400);
  if(event.type==='checkout.session.expired'||event.type==='checkout.session.async_payment_failed'){
    // A signed, Stripe-confirmed expiry/failure is the only automatic release.
    // Never release a paid hold here. Never issue a refund.
    try{
      await supabase(process.env,'rpc/lkm_checkout_hold_expired',{method:'POST',
        body:JSON.stringify({p_request_id:holdRequest,p_session_id:session.id})});
      return json({ok:true,hold_released:true});
    }catch(e){console.error('LKM webhook: failed to release hold',e.message);
      return json({ok:false,error:'Unable to release hold'},500)}
  }
  if(session.payment_status!=='paid')return json({ok:true,ignored:true});
  const quoted=Number(meta.quoted_total_cents), paid=Number(session.amount_total);
  const customerEmail=value(session.customer_details?.email||session.customer_email,200);
  const service=value(meta.service_slug,90),pkg=value(meta.package_id,100),date=value(meta.preferred_date,25);
  if(session.currency!=='eur'||!emailOK(customerEmail)||!service||!pkg||!/^cs_(?:test|live)_[a-zA-Z0-9]+$/.test(session.id||'')||!validCalendarDate(date)||!Number.isSafeInteger(quoted)||quoted<50||!Number.isSafeInteger(paid)||paid<50||paid>quoted||!['deposit','full'].includes(meta.payment_kind)||!/^evt_[a-zA-Z0-9]+$/.test(event.id||'')){
    console.error('LKM stripe webhook: invalid order metadata');return json({ok:false,error:'Invalid payment metadata'},400);
  }
  if(meta.payment_kind==='full'&&paid!==quoted)return json({ok:false,error:'Invalid payment amount'},400);
  const order={stripe_session_id:session.id,stripe_event_id:event.id,customer_email:customerEmail,customer_name:value(meta.customer_name,100),service_slug:service,package_id:pkg,preferred_date:date,paid_amount_cents:paid,quoted_total_cents:quoted,payment_kind:meta.payment_kind,status:mode==='test'?'test_paid_pending_confirmation':'paid_pending_confirmation'};
  try{
    // Block remains active while an order is awaiting staff confirmation.
    // This call is idempotent for repeat Stripe events.
    await supabase(process.env,'rpc/lkm_checkout_hold_paid',{method:'POST',
      body:JSON.stringify({p_request_id:holdRequest,p_session_id:session.id})});
    // PostgreSQL unique(stripe_session_id), atomic insert-ignore. Only newly inserted orders send notification.
    const inserted=await supabase(process.env,'stripe_orders?on_conflict=stripe_session_id',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:JSON.stringify(order)});
    if(!Array.isArray(inserted))throw Error('Unexpected database response');
    if(!inserted.length)return json({ok:true,duplicate:true});
  }catch(e){console.error('LKM webhook: failed to persist payment:',e.message);return json({ok:false,error:'Unable to record payment'},500)}
  // Payment is safely persisted. Email failure must NOT trigger another Stripe insert or duplicate notification.
  if(process.env.RESEND_API_KEY&&process.env.FROM_EMAIL){
    try{
      const subject=(mode==='test'?'[TEST] ':'')+'New paid booking request — '+service;
      const label=meta.payment_kind==='deposit'?'Deposit':'Full payment';
      const html='<h2>Paid booking request — date NOT confirmed</h2><p><b>Client:</b> '+escapeHTML(order.customer_name)+' ('+escapeHTML(order.customer_email)+')</p><p><b>Service:</b> '+escapeHTML(service)+'<br><b>Package:</b> '+escapeHTML(pkg)+'<br><b>Requested date:</b> '+escapeHTML(date)+'<br><b>Preferred time:</b> '+escapeHTML(value(meta.booking_time,20))+'<br><b>Alternative:</b> '+escapeHTML(value(meta.booking_alternative_date,25))+'<br><b>Location:</b> '+escapeHTML(value(meta.booking_location,160))+'</p><p><b>'+label+':</b> €'+(paid/100).toFixed(2)+'<br><b>Booking scope:</b> €'+(quoted/100).toFixed(2)+'</p><p>Check the order in Supabase / Admin and confirm availability with the customer.</p><p><small>Stripe session: '+escapeHTML(session.id)+'</small></p>';
      const result=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'lkm-paid-'+session.id},body:JSON.stringify({from:process.env.FROM_EMAIL,to:[process.env.CONTACT_EMAIL||'photo@lilkangoomedia.com'],reply_to:customerEmail,subject,html})});
      if(!result.ok)console.error('LKM webhook: notification failed',result.status);
    }catch(e){console.error('LKM webhook: email unavailable',e.message)}
  }
  return json({ok:true,recorded:true});
}
export const config={path:'/api/stripe-webhook'};
