import {json,requireEnv,supabase,sendEmail,h} from '../_shared.js';
function secureEqual(a,b){if(a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0}
async function verify(raw,header,secret){
 const parts=Object.fromEntries(header.split(',').map(k=>k.split('=')).filter(p=>p.length===2));
 const timestamp=parts.t,v1=parts.v1;
 if(!timestamp||!v1||Math.abs(Date.now()/1000-Number(timestamp))>300)return false;
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const sig=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(timestamp+'.'+raw));
 const hex=Array.from(new Uint8Array(sig)).map(b=>b.toString(16).padStart(2,'0')).join('');
 return header.split(',').some(p=>p.startsWith('v1=')&&secureEqual(p.slice(3),hex));
}
export async function onRequest({request,env}){
 if(request.method!=='POST')return json({ok:false},405);
 try{
  requireEnv(env,['STRIPE_WEBHOOK_SECRET','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','RESEND_API_KEY','FROM_EMAIL']);
  const raw=await request.text();if(raw.length>102400)return json({ok:false},413);
  if(!await verify(raw,request.headers.get('Stripe-Signature')||'',env.STRIPE_WEBHOOK_SECRET))return json({ok:false,error:'Invalid signature'},400);
  const event=JSON.parse(raw);
  if(event.type!=='checkout.session.completed')return json({ok:true,ignored:true});
  const session=event.data.object;
  if(session.payment_status!=='paid')return json({ok:true,ignored:true});
  const meta=session.metadata||{};
  const order={stripe_session_id:session.id,stripe_event_id:event.id,customer_email:session.customer_details?.email||session.customer_email||'',customer_name:meta.customer_name||'',service_slug:meta.service_slug||'',package_id:meta.package_id||'',preferred_date:meta.preferred_date||null,paid_amount_cents:session.amount_total||0,quoted_total_cents:Number(meta.quoted_total_cents||0),payment_kind:meta.payment_kind||'',status:'paid_pending_confirmation'};
  // Stripe retries events. A pre-check prevents duplicate notification emails.
  const existing=await supabase(env,'stripe_orders?stripe_session_id=eq.'+encodeURIComponent(session.id)+'&select=stripe_session_id&limit=1');
  if(existing.length)return json({ok:true,duplicate:true});
  // Idempotent upsert: retries must not duplicate orders.
  await supabase(env,'stripe_orders?on_conflict=stripe_session_id',{method:'POST',headers:{'Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(order)});
  // Notification may be retried by Stripe, so recipients can see duplicate emails; use provider idempotency in production.
  await sendEmail(env,{subject:'Paid booking request — '+h(order.service_slug)+' — '+h(order.customer_name),replyTo:order.customer_email,html:`<h2>Paid booking request (availability not yet confirmed)</h2><p><b>Customer:</b> ${h(order.customer_name)} (${h(order.customer_email)})<br><b>Service:</b> ${h(order.service_slug)}<br><b>Package:</b> ${h(order.package_id)}<br><b>Preferred date:</b> ${h(order.preferred_date)}<br><b>Amount paid:</b> €${(order.paid_amount_cents/100).toFixed(2)}<br><b>Stripe session:</b> ${h(session.id)}</p><p>Please confirm availability manually and contact the customer.</p>`});
  return json({ok:true});
 }catch(e){console.error('Stripe webhook error',e);return json({ok:false,error:'Processing failed'},500)}
}
