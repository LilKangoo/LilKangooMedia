import {json,rejectMethod,parseBody,safeString,emailValid,serviceAndPrice,requireEnv,turnstileCheck} from '../_shared.js';
export async function onRequest({request,env}){
 const bad=rejectMethod(request);if(bad)return bad;
 try{
  requireEnv(env,['STRIPE_SECRET_KEY','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','SITE_URL']);
  const data=await parseBody(request);
  if(data.website)return json({ok:false,error:'Invalid request'},400);
  const name=safeString(data.name,100),email=safeString(data.email,200),date=safeString(data.preferred_date,25),phone=safeString(data.phone,40),message=safeString(data.message,1000);
  if(!name||!emailValid(email)||!date||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!data.consent)return json({ok:false,error:'Name, email, preferred date and consent required.'},400);
  if(!await turnstileCheck(env,data.turnstile_token||data['cf-turnstile-response'],request.headers.get('CF-Connecting-IP')||''))return json({ok:false,error:'Verification failed.'},403);
  const {service,pkg,selected,total}=await serviceAndPrice(env,data.service_slug,data.package_id,data.addon_ids||[]);
  if(!['deposit','full'].includes(service.booking_mode))return json({ok:false,error:'Online payment is not enabled for this service.'},400);
  let due=total;
  if(service.booking_mode==='deposit'){
   const percent=Number(service.deposit_percent);
   if(!(percent>0&&percent<=100))return json({ok:false,error:'Deposit settings incomplete.'},400);
   due=Math.round(total*percent/100);
  }
  if(due<50)return json({ok:false,error:'Payment amount below minimum.'},400);
  // Calculate everything from Supabase on the server. Never trust client-submitted prices.
  const site=String(env.SITE_URL).replace(/\/$/,'');
  const form=new URLSearchParams();
  form.set('mode','payment');form.set('success_url',site+'/#/payment-return?session_id={CHECKOUT_SESSION_ID}');form.set('cancel_url',site+'/#/request');
  form.set('customer_email',email);
  form.set('line_items[0][price_data][currency]','eur');
  form.set('line_items[0][price_data][unit_amount]',String(due));
  form.set('line_items[0][price_data][product_data][name]',service.title+' — '+pkg.name+(service.booking_mode==='deposit'?' (deposit)':''));
  form.set('line_items[0][quantity]','1');
  // Do not put untrusted fields into product names or HTML.
  const meta={service_slug:service.slug,package_id:pkg.id,preferred_date:date,customer_name:name,customer_phone:phone,customer_message:message,quoted_total_cents:String(total),paid_amount_cents:String(due),payment_kind:service.booking_mode};
  for(const [key,val] of Object.entries(meta))form.set('metadata['+key+']',String(val).slice(0,450));
  form.set('metadata[addon_ids]',selected.map(a=>a.id).join(',').slice(0,400));
  const response=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{'Authorization':'Bearer '+env.STRIPE_SECRET_KEY,'Content-Type':'application/x-www-form-urlencoded'},body:form});
  const body=await response.json();if(!response.ok||!body.url)throw new Error('Stripe session creation failed.');
  return json({ok:true,url:body.url});
 }catch(e){console.error('Checkout error',e);return json({ok:false,error:'Online payment is not available right now. Please request a custom quote instead.'},503)}
}
