import {test,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import checkout from '../netlify/functions/checkout.mjs';
import options from '../netlify/functions/payment-options.mjs';
import webhook from '../netlify/functions/stripe-webhook.mjs';
import {cyprusToday,quotePrice,paymentMode,validSignature} from '../netlify/lib/payments.mjs';

const vars=['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','LKM_PAYMENTS_MODE','LKM_LIVE_PAYMENTS_APPROVED','SITE_URL','RESEND_API_KEY','FROM_EMAIL','CONTACT_EMAIL','TURNSTILE_SECRET'];
const before=Object.fromEntries(vars.map(k=>[k,process.env[k]]));
const oldFetch=globalThis.fetch;
afterEach(()=>{globalThis.fetch=oldFetch;for(const k of vars){if(before[k]===undefined)delete process.env[k];else process.env[k]=before[k]}});
function ready(mode='test'){
  Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'sb_secret_example_staging_key',STRIPE_SECRET_KEY:mode==='test'?'sk_test_1234567890abcdef':'sk_live_1234567890abcdef',STRIPE_WEBHOOK_SECRET:'whsec_sufficientsecretvalue',LKM_PAYMENTS_MODE:mode,SITE_URL:'https://lilkangoomedia.com/'});
  delete process.env.TURNSTILE_SECRET;delete process.env.RESEND_API_KEY;delete process.env.FROM_EMAIL;
}
const record={slug:'photo',title:'Photos',booking_mode:'deposit',deposit_percent:30,packages:[{id:'standard',name:'Standard',price_cents:14900,pricing_model:'fixed'}],addons:[{id:'prints',name:'Prints',price_cents:2500,billing_model:'once'}]};
const reqId='d8989e85-af3b-4ac7-9c6b-b0aac5158f1d';
function post(body,endpoint='checkout',origin='https://lilkangoomedia.com'){
  return new Request(`${origin}/api/${endpoint}`,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(body)});
}
const payload=()=>({name:'Test Client',email:'buyer@example.com',phone:'123',service_slug:'photo',package_id:'standard',addon_ids:['prints'],consent:'on',preferred_date:cyprusToday(),booking_time:'morning',booking_location:'Larnaca',payment_request_id:reqId});
function signed(event){const raw=JSON.stringify(event),ts=String(Math.floor(Date.now()/1000));const sig=createHmac('sha256',process.env.STRIPE_WEBHOOK_SECRET).update(ts+'.'+raw).digest('hex');return new Request('https://lilkangoomedia.com/api/stripe-webhook',{method:'POST',headers:{'Stripe-Signature':`t=${ts},v1=${sig}`},body:raw});}
function paidEvent(){return {id:'evt_abc123',type:'checkout.session.completed',data:{object:{id:'cs_test_abc123',object:'checkout.session',mode:'payment',payment_status:'paid',livemode:false,currency:'eur',amount_total:5220,customer_email:'buyer@example.com',metadata:{lkm_project:'lilkangoomedia',service_slug:'photo',package_id:'standard',preferred_date:cyprusToday(),customer_name:'Test Client',quoted_total_cents:'17400',payment_kind:'deposit'}}}};}

test('payment is OFF by default and no secret is exposed in options endpoint',async()=>{
  delete process.env.LKM_PAYMENTS_MODE;
  assert.equal(paymentMode(process.env),'off');
  const r=await options(new Request('https://lilkangoomedia.com/api/payment-options'));assert.deepEqual(await r.json(),{enabled:false,mode:'off'});
});
test('environment must explicitly match test/live and production needs additional approval',async()=>{
  ready('test');assert.equal(paymentMode(process.env),'test');
  const r=await options(new Request('https://lilkangoomedia.com/api/payment-options'));assert.equal((await r.json()).mode,'test');
  process.env.LKM_PAYMENTS_MODE='live';assert.equal(paymentMode(process.env),'off');
  process.env.STRIPE_SECRET_KEY='sk_live_1234567890abcdef';assert.equal(paymentMode(process.env),'off');
  process.env.LKM_LIVE_PAYMENTS_APPROVED='YES';assert.equal(paymentMode(process.env),'live');
});
test('checkout accepts only configured mode',async()=>{
  delete process.env.LKM_PAYMENTS_MODE;globalThis.fetch=()=>{throw Error('Unexpected external call')};
  const r=await checkout(post(payload()));assert.equal(r.status,503);
});
test('quote is calculated on server from fixed package, no client amount can override',async()=>{
  ready();let stripeBody, stripeHeaders;let count=0;
  globalThis.fetch=async(url,opts)=>{
    count++;
    if(String(url).includes('lkm_availability_blocks'))return new Response('[]',{status:200});
    if(String(url).includes('supabase.co'))return new Response(JSON.stringify([record]),{status:200});
    if(String(url).includes('api.stripe.com')){stripeBody=new URLSearchParams(opts.body);stripeHeaders=opts.headers;return new Response(JSON.stringify({url:'https://checkout.stripe.com/c/pay/cs_test_123'}),{status:200});}
    throw Error('Unexpected '+url);
  };
  const result=await checkout(post({...payload(),amount:1}));assert.equal(result.status,200);
  assert.equal((await result.json()).ok,true);assert.equal(stripeBody.get('line_items[0][price_data][unit_amount]'),'5220');
  assert.equal(stripeBody.get('metadata[quoted_total_cents]'),'17400');
  assert.equal(stripeBody.get('metadata[lkm_project]'),'lilkangoomedia');
  assert.equal(stripeBody.get('metadata[preferred_date]'),cyprusToday());
  assert.equal(stripeHeaders['Idempotency-Key'],'lkm-'+reqId);
  assert.equal(stripeBody.get('payment_method_types[0]'),'card');
  assert.equal(count,3);
});
test('malformed dates and bogus payment id are rejected before external calls',async()=>{
  ready();globalThis.fetch=()=>{throw Error('Unexpected call')};
  assert.equal((await checkout(post({...payload(),preferred_date:'2026-02-30'}))).status,400);
  assert.equal((await checkout(post({...payload(),payment_request_id:'bad-id'}))).status,400);
  assert.equal((await checkout(post({...payload(),booking_alternative_date:'not-date'}))).status,400);
});
test('invalid fixed price, recurring package, custom-from and recurring addon reject before Stripe',async()=>{
  assert.throws(()=>quotePrice({...record,packages:[{...record.packages[0],pricing_model:'month'}]},'standard',[]));
  assert.throws(()=>quotePrice({...record,packages:[{...record.packages[0],show_from:true}]},'standard',[]));
  assert.throws(()=>quotePrice({...record,addons:[{...record.addons[0],billing_model:'month'}]},'standard',['prints']));
  assert.throws(()=>quotePrice(record,'standard',['prints','prints']));
});
test('signature verifier rejects replay, malformed, wrong signature and accepts signed raw event',()=>{
  ready();const ts=Math.floor(Date.now()/1000),raw='{"example":true}';
  const sig=createHmac('sha256',process.env.STRIPE_WEBHOOK_SECRET).update(ts+'.'+raw).digest('hex');
  assert.equal(validSignature(raw,`t=${ts},v1=${sig}`,process.env.STRIPE_WEBHOOK_SECRET),true);
  assert.equal(validSignature(raw,`t=${ts-900},v1=${sig}`,process.env.STRIPE_WEBHOOK_SECRET),false);
  assert.equal(validSignature(raw,`t=${ts},v1=${'1'.repeat(64)}`,process.env.STRIPE_WEBHOOK_SECRET),false);
});
test('signed webhook persists order exactly once and only newly inserted orders send email',async()=>{
  ready();process.env.RESEND_API_KEY='re_123';process.env.FROM_EMAIL='LKM <info@example.com>';
  const orders=[];let sent=0;
  globalThis.fetch=async(url,opts)=>{
    if(String(url).includes('supabase.co')){
      const order=JSON.parse(opts.body);if(orders.some(x=>x.stripe_session_id===order.stripe_session_id))return new Response('[]',{status:201});orders.push(order);return new Response(JSON.stringify([order]),{status:201});
    }
    if(String(url).includes('api.resend.com')){sent++;return new Response(JSON.stringify({id:'sent'}),{status:200});}
    throw Error('Unknown URL '+url);
  };
  const first=await webhook(signed(paidEvent()));assert.equal(first.status,200);assert.equal((await first.json()).recorded,true);
  const second=await webhook(signed(paidEvent()));assert.equal(second.status,200);assert.equal((await second.json()).duplicate,true);
  assert.equal(sent,1);assert.equal(orders.length,1);assert.equal(orders[0].status,'test_paid_pending_confirmation');
});
test('webhook survives email outage after recording paid order',async()=>{
  ready();process.env.RESEND_API_KEY='re_123';process.env.FROM_EMAIL='LKM <info@example.com>';
  globalThis.fetch=async(url,opts)=>String(url).includes('supabase.co')?new Response(JSON.stringify([JSON.parse(opts.body)]),{status:201}):new Response('{"error":"unavailable"}',{status:503});
  const r=await webhook(signed(paidEvent()));assert.equal(r.status,200);assert.equal((await r.json()).recorded,true);
});
test('unsigned webhook and wrong mode never create orders',async()=>{
  ready();globalThis.fetch=()=>{throw Error('should not fetch')};
  const bad=await webhook(new Request('https://lilkangoomedia.com/api/stripe-webhook',{method:'POST',body:JSON.stringify(paidEvent())}));assert.equal(bad.status,400);
  const event=paidEvent();event.data.object.livemode=true;
  const wrong=await webhook(signed(event));assert.equal(wrong.status,400);
});
test('webhook returns retryable error when order could not be saved',async()=>{
  ready();globalThis.fetch=async()=>new Response('{"error":"temporary"}',{status:503});
  const r=await webhook(signed(paidEvent()));assert.equal(r.status,500);
});
