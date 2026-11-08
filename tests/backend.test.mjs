import assert from 'node:assert/strict';
import {test,afterEach} from 'node:test';
import {serviceAndPrice} from '../functions/_shared.js';
import {onRequest as checkout} from '../functions/api/checkout.js';
import {onRequest as enquiry} from '../functions/api/enquiry.js';
const originalFetch=globalThis.fetch;
const env={SUPABASE_URL:'https://sample.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-secret',STRIPE_SECRET_KEY:'sk_test_fake',SITE_URL:'https://example.com'};
const record={slug:'photo',title:'Photos',booking_mode:'deposit',deposit_percent:30,packages:[{id:'standard',name:'Standard',price_cents:14900}],addons:[{id:'prints',name:'Prints',price_cents:2500}]};
afterEach(()=>{globalThis.fetch=originalFetch});
test('calculation uses database amounts, not browser-submitted amounts',async()=>{
 globalThis.fetch=async()=>new Response(JSON.stringify([record]),{status:200});
 const result=await serviceAndPrice(env,'photo','standard',['prints']);
 assert.equal(result.total,17400);
});
test('unknown extras or packages are rejected',async()=>{
 globalThis.fetch=async()=>new Response(JSON.stringify([record]),{status:200});
 await assert.rejects(serviceAndPrice(env,'photo','standard',['fake']),/Invalid extra/);
 await assert.rejects(serviceAndPrice(env,'photo','fake',[]),/quote/);
});
test('Stripe checkout uses server calculated 30 percent deposit',async()=>{
 let requestAmount=null;
 globalThis.fetch=async(url,opts)=>{
  if(String(url).includes('supabase.co'))return new Response(JSON.stringify([record]));
  if(String(url).includes('api.stripe.com')){requestAmount=new URLSearchParams(opts.body).get('line_items[0][price_data][unit_amount]');return new Response(JSON.stringify({url:'https://checkout.stripe.com/test'}));}
  throw new Error('Unexpected fetch');
 };
 const request=new Request('https://example.com/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Test Client',email:'test@example.com',preferred_date:'2026-11-12',consent:'on',service_slug:'photo',package_id:'standard',addon_ids:['prints'],amount:1})});
 const reply=await checkout({request,env});assert.equal(reply.status,200);
 assert.equal(requestAmount,'5220'); // (14900+2500) * 0.30
});
test('enquiry backend refuses unconfigured email transport',async()=>{
 const request=new Request('https://example.com/api/enquiry',{method:'POST',body:JSON.stringify({name:'Test',email:'test@example.com',message:'A real enquiry',consent:'on'})});
 const r=await enquiry({request,env:{SUPABASE_URL:'x'}});
 assert.equal(r.status,503);assert.equal((await r.json()).ok,false);
});
