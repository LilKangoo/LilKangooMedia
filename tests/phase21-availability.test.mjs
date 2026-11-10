import {test,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import checkout from '../netlify/functions/checkout.mjs';
import availability,{validMonth,monthLimits,publicAvailability} from '../netlify/functions/availability.mjs';
import {cyprusToday} from '../netlify/lib/payments.mjs';
const originalFetch=globalThis.fetch;
const vars=['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','LKM_PAYMENTS_MODE','SITE_URL','TURNSTILE_SECRET'];
const originals=Object.fromEntries(vars.map(k=>[k,process.env[k]]));
afterEach(()=>{globalThis.fetch=originalFetch;for(const key of vars){if(originals[key]===undefined)delete process.env[key];else process.env[key]=originals[key]}});
function env(){Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'sb_secret_example',STRIPE_SECRET_KEY:'sk_test_1234567890abcdef',STRIPE_WEBHOOK_SECRET:'whsec_secretvalue123456',SITE_URL:'https://lilkangoomedia.com/',LKM_PAYMENTS_MODE:'test'});delete process.env.TURNSTILE_SECRET;return process.env}
const service={slug:'photo',title:'Photos',booking_mode:'deposit',deposit_percent:30,packages:[{id:'standard',name:'Standard',price_cents:14900,pricing_model:'fixed'}],addons:[]};
const day=cyprusToday();
const data=()=>({name:'Test Client',email:'test@example.com',preferred_date:day,service_slug:'photo',package_id:'standard',addon_ids:[],consent:'on',payment_request_id:'c8ff05e2-988f-44e6-ac40-38c267ca3dee'});
const req=(payload=data())=>new Request('https://lilkangoomedia.com/api/checkout',{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://lilkangoomedia.com'},body:JSON.stringify(payload)});

test('month parser rejects invalid and past months; leap year day is correct',()=>{
  assert.equal(validMonth('2026-00'),false);assert.equal(validMonth('2026-13'),false);
  assert.equal(validMonth('1999-12'),false);assert.equal(validMonth(day.slice(0,7)),true);
  assert.deepEqual(monthLimits('2028-02'),{start:'2028-02-01',end:'2028-02-29'});
});
test('public endpoint rejects invalid method, service and month',async()=>{
  assert.equal((await availability(new Request('https://lilkangoomedia.com/api/availability',{method:'POST'}))).status,405);
  assert.equal((await availability(new Request('https://lilkangoomedia.com/api/availability?service=../../bad&month=2026-11'))).status,400);
});
test('public availability returns only deduplicated dates (never customer/private notes)',async()=>{
  const e=env();const urls=[];
  globalThis.fetch=async url=>{urls.push(String(url));return new Response(JSON.stringify(String(url).includes('/services?')?[{slug:'photo'}]:[{blocked_date:day,note:'PRIVATE LOCATION',customer_email:'secret@example.com'},{blocked_date:day}]),{status:200})};
  const r=await publicAvailability('photo',day.slice(0,7),e);const body=await r.json();
  assert.equal(body.ok,true);assert.deepEqual(body.blocked_dates,[day]);
  assert.equal(JSON.stringify(body).includes('PRIVATE LOCATION'),false);
  assert.equal(JSON.stringify(body).includes('secret@example.com'),false);
  assert.equal(urls.some(x=>x.includes('service_slug.is.null')),true);
});
test('unknown service cannot enumerate availability',async()=>{
  env();globalThis.fetch=async()=>new Response('[]',{status:200});
  const r=await availability(new Request(`https://lilkangoomedia.com/api/availability?service=missing&month=${day.slice(0,7)}`));
  assert.equal(r.status,404);
});
test('checkout refuses blocked date without contacting Stripe',async()=>{
  env();let stripe=0;
  globalThis.fetch=async(url)=>{
    if(String(url).includes('lkm_availability_blocks'))return new Response('[{"id":"block-1"}]',{status:200});
    if(String(url).includes('/services?'))return new Response(JSON.stringify([service]),{status:200});
    if(String(url).includes('api.stripe.com')){stripe++;throw Error('Stripe must not be called')}
    throw Error('Unexpected fetch '+url);
  };
  const r=await checkout(req());assert.equal(r.status,409);assert.equal(stripe,0);
  assert.match((await r.json()).error,/blocked/i);
});
test('checkout fails closed when availability table cannot be queried',async()=>{
  env();let stripe=0;
  globalThis.fetch=async(url)=>{
    if(String(url).includes('lkm_availability_blocks'))return new Response('{"error":"not found"}',{status:404});
    if(String(url).includes('/services?'))return new Response(JSON.stringify([service]),{status:200});
    if(String(url).includes('api.stripe.com')){stripe++;throw Error('Stripe should not be called')}
    throw Error('Unexpected fetch');
  };
  const r=await checkout(req());assert.equal(r.status,503);assert.equal(stripe,0);
});
test('checkout still works for unblocked date after table migration',async()=>{
  env();let stripe=0;
  globalThis.fetch=async(url)=>{
    if(String(url).includes('lkm_availability_blocks'))return new Response('[]',{status:200});
    if(String(url).includes('/services?'))return new Response(JSON.stringify([service]),{status:200});
    if(String(url).includes('api.stripe.com')){stripe++;return new Response('{"url":"https://checkout.stripe.com/test"}',{status:200})}
    throw Error('Unexpected fetch '+url);
  };
  const r=await checkout(req());assert.equal(r.status,200);assert.equal(stripe,1);
});
test('SQL migration uses admin-only RLS and unique scope+date index',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261110_lkm_availability_blocks.sql',import.meta.url),'utf8');
 assert.match(sql,/enable row level security/i);assert.match(sql,/create unique index/i);
 assert.match(sql,/lkm_is_admin\(\)/);assert.match(sql,/service_slug.*blocked_date/s);
 assert.doesNotMatch(sql,/grant select.*anon/i);
});
test('HTML includes calendar links and preserves previous Phase 21.2 scripts',()=>{
 const page=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const admin=readFileSync(new URL('../admin.html',import.meta.url),'utf8');
 for(const f of ['phase21-booking.js','phase21-payments.js','phase21-availability.js'])assert.match(page,new RegExp(f.replace('.','\\.')));
 assert.match(admin,/admin-calendar-nav.js/);
 assert.match(readFileSync(new URL('../admin-calendar.html',import.meta.url),'utf8'),/admin-calendar.js/);
});
