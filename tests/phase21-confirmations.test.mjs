import {test, afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import checkout from '../netlify/functions/checkout.mjs';
import {publicAvailability} from '../netlify/functions/availability.mjs';
import {cyprusToday} from '../netlify/lib/payments.mjs';
const oldFetch=globalThis.fetch;
const keys=['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','LKM_PAYMENTS_MODE','SITE_URL','TURNSTILE_SECRET'];
const before=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
afterEach(()=>{globalThis.fetch=oldFetch;for(const k of keys){if(before[k]===undefined)delete process.env[k];else process.env[k]=before[k]}});
function ready(){Object.assign(process.env,{SUPABASE_URL:'https://test.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'sb_secret_test',STRIPE_SECRET_KEY:'sk_test_0123456789abc',STRIPE_WEBHOOK_SECRET:'whsec_0123456789abc',LKM_PAYMENTS_MODE:'test',SITE_URL:'https://lilkangoomedia.com/'});delete process.env.TURNSTILE_SECRET}
const today=cyprusToday();
const req=()=>new Request('https://lilkangoomedia.com/api/checkout',{method:'POST',headers:{Origin:'https://lilkangoomedia.com','Content-Type':'application/json'},body:JSON.stringify({name:'Client',email:'client@example.com',preferred_date:today,service_slug:'photo',package_id:'standard',addon_ids:[],consent:'on',payment_request_id:'7cfeac92-9805-4b1c-a123-38f8bf1b99a3'})});
const service={slug:'photo',title:'Photography',booking_mode:'full',deposit_percent:0,packages:[{id:'standard',name:'Standard',price_cents:15000,pricing_model:'fixed'}],addons:[]};

test('public calendar includes confirmed date and never exposes clients',async()=>{
 ready();const urls=[];globalThis.fetch=async url=>{urls.push(String(url));const x=String(url);return new Response(JSON.stringify(x.includes('/services?')?[{slug:'photo'}]:x.includes('lkm_booking_confirmations')?[{booking_date:today,customer_email:'private@example.com'}]:[]),{status:200})};
 const r=await publicAvailability('photo',today.slice(0,7),process.env),body=await r.json();
 assert.equal(r.status,200);assert.deepEqual(body.blocked_dates,[today]);assert.equal(JSON.stringify(body).includes('private@example.com'),false);
 assert.ok(urls.some(x=>x.includes('state=eq.confirmed')));
});
test('checkout refuses confirmed date before calling Stripe',async()=>{
 ready();let calls=0;globalThis.fetch=async url=>{const x=String(url);if(x.includes('api.stripe.com')){calls++;throw Error('Stripe should not run')}
  return new Response(JSON.stringify(x.includes('/services?')?[service]:x.includes('lkm_booking_confirmations')?[{id:'booking1'}]:[]),{status:200});};
 const r=await checkout(req());assert.equal(r.status,409);assert.match((await r.json()).error,/already booked/i);assert.equal(calls,0);
});
test('checkout fails closed if confirmation table has not been installed',async()=>{
 ready();let calls=0;globalThis.fetch=async url=>{const x=String(url);if(x.includes('api.stripe.com')){calls++;throw Error('Stripe should not run')}
  if(x.includes('lkm_booking_confirmations'))return new Response('{"error":"missing"}',{status:404});
  return new Response(JSON.stringify(x.includes('/services?')?[service]:[]),{status:200});};
 const r=await checkout(req());assert.equal(r.status,503);assert.equal(calls,0);
});
test('confirmation SQL requires admin RPC, unique active booking and safe refund review',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261110_lkm_booking_confirmations.sql',import.meta.url),'utf8');
 assert.match(sql,/CREATE UNIQUE INDEX IF NOT EXISTS lkm_booking_confirmed_service_day/i);
 assert.match(sql,/WHERE state = 'confirmed'/i);
 assert.match(sql,/SECURITY DEFINER SET search_path = ''/i);
 assert.match(sql,/auth\.uid\(\) IS NULL OR NOT public\.lkm_is_admin\(\)/i);
 assert.match(sql,/pg_advisory_xact_lock/g);
 assert.match(sql,/refund_review_required/);
 assert.doesNotMatch(sql,/https:\/\/api\.stripe\.com/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.lkm_admin_booking_decision.*FROM PUBLIC, anon/i);
});
test('admin UI includes booking decisions and protected RPC without client-side secrets',()=>{
 const code=readFileSync(new URL('../assets/lkm-v3/admin-calendar.js',import.meta.url),'utf8');
 assert.match(code,/lkm_booking_confirmations/);assert.match(code,/rpc\/lkm_admin_booking_decision/);
 assert.match(code,/Email confirmation to client/);assert.match(code,/NO refund is issued automatically/);
 assert.match(readFileSync(new URL('../netlify\/functions\/availability.mjs',import.meta.url),'utf8'),/lkm_booking_confirmations/);
});
