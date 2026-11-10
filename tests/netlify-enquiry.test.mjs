import {test, afterEach} from 'node:test';
import assert from 'node:assert/strict';
import handler, {config} from '../netlify/functions/enquiry.mjs';

const originalFetch = globalThis.fetch;
const keys = ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','RESEND_API_KEY','FROM_EMAIL','CONTACT_EMAIL','TURNSTILE_SECRET'];
const original = Object.fromEntries(keys.map(k => [k,process.env[k]]));
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const k of keys) {
    if (original[k] === undefined) delete process.env[k];
    else process.env[k] = original[k];
  }
});
const uuid = '8cdf3a01-b3d7-4e2c-8fb8-1a74ec825c98';
const sample = {name:'Test Client', email:'client@example.com', message:'A website enquiry message.', consent:'on', service_type:'Photography', request_id:uuid};
const req = (data=sample, method='POST') => new Request('https://lilkangoomedia.com/api/enquiry', {
  method, headers: {'Content-Type':'application/json','Origin':'https://lilkangoomedia.com'},
  body: method === 'POST' ? JSON.stringify(data) : undefined,
});
const ready = () => Object.assign(process.env, {
  SUPABASE_URL:'https://placeholder.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY:'sb_secret_example',
  RESEND_API_KEY:'re_example',
  FROM_EMAIL:'LilKangooMedia <website@lilkangoomedia.com>',
  CONTACT_EMAIL:'photo@lilkangoomedia.com',
});
const savedRecord = {
  id:uuid, customer_name:sample.name, customer_email:sample.email, phone:'',
  preferred_date:null, service_slug:sample.service_type, package_id:null,
  message:sample.message, submission_type:'general_enquiry', addons:[],
};

test('route stays /api/enquiry; GET forbidden', async () => {
  assert.equal(config.path,'/api/enquiry');
  assert.equal((await handler(req(sample,'GET'))).status,405);
});

test('invalid email/UUID rejected without external side effects', async () => {
  ready(); globalThis.fetch = () => { throw Error('Must not call external API'); };
  assert.equal((await handler(req({...sample,email:'invalid'}))).status,400);
  assert.equal((await handler(req({...sample,request_id:'1234'}))).status,400);
});

test('missing database configuration produces 503 without external calls', async () => {
  for (const key of keys) delete process.env[key];
  assert.equal((await handler(req())).status,503);
});

test('saves with stable id and sends one email after save', async () => {
  ready(); const calls=[];
  globalThis.fetch=async (url,opts) => {
    calls.push({url,opts});
    if (String(url).includes('/rest/v1/contact_leads') && opts?.method==='POST')
      return new Response(JSON.stringify([{id:uuid}]),{status:201});
    if (String(url).includes('api.resend.com')) return new Response('{"id":"email"}',{status:200});
    throw Error('Unexpected API '+url);
  };
  const result=await handler(req()); const data=await result.json();
  assert.equal(result.status,200); assert.equal(data.id,uuid);
  assert.equal(data.saved,true);assert.equal(data.notification_sent,true);
  assert.equal(calls.length,2);
  assert.equal(JSON.parse(calls[0].opts.body).id,uuid);
  assert.equal(calls[0].opts.headers.apikey,'sb_secret_example');
  assert.equal(calls[0].opts.headers.Authorization,undefined);
});

test('repeated same UUID returns existing lead and sends NO second email', async () => {
  ready(); const calls=[];
  globalThis.fetch=async (url,opts={}) => {
    calls.push({url,method:opts.method});
    if (opts.method==='POST' && String(url).includes('/rest/v1/contact_leads')) return new Response('{"code":"23505"}',{status:409});
    if (opts.method==='GET' || String(url).includes('&select=')) return new Response(JSON.stringify([savedRecord]));
    throw Error('Second notification should not be sent');
  };
  const result=await handler(req());const data=await result.json();
  assert.equal(result.status,200);assert.equal(data.duplicate,true);assert.equal(data.id,uuid);
  assert.equal(data.notification_sent,null);
  assert.equal(calls.length,2);
});

test('UUID collision with different lead data is rejected, not accepted as saved', async () => {
  ready();
  globalThis.fetch=async (url,opts={}) => opts.method==='POST'
    ? new Response('{"code":"23505"}',{status:409})
    : new Response(JSON.stringify([{...savedRecord,customer_email:'another@example.com'}]));
  const result=await handler(req());assert.equal(result.status,409);
  assert.equal((await result.json()).ok,false);
});

test('Resend HTTP failure after DB save returns success with warning flag', async () => {
  ready();
  globalThis.fetch=async (url) => String(url).includes('contact_leads')
    ? new Response(JSON.stringify([{id:uuid}]),{status:201})
    : new Response('{"error":"domain unverified"}',{status:403});
  const result=await handler(req());const data=await result.json();
  assert.equal(result.status,200);assert.equal(data.saved,true);
  assert.equal(data.notification_sent,false);assert.equal(data.ok,true);
});

test('Resend network exception after DB save returns success with warning flag', async () => {
  ready();
  globalThis.fetch=async url => {
    if(String(url).includes('contact_leads'))return new Response(JSON.stringify([{id:uuid}]),{status:201});
    throw Error('Offline Resend');
  };
  const result=await handler(req());assert.equal(result.status,200);
  assert.equal((await result.json()).notification_sent,false);
});

test('missing email credentials do not prevent saving lead', async () => {
  ready();delete process.env.RESEND_API_KEY; delete process.env.FROM_EMAIL;
  let calls=0;
  globalThis.fetch=async () => {calls++;return new Response(JSON.stringify([{id:uuid}]),{status:201});};
  const result=await handler(req());const data=await result.json();
  assert.equal(result.status,200);assert.equal(data.notification_sent,false);assert.equal(calls,1);
});

test('older clients without request_id remain compatible', async () => {
  ready();let sent;
  globalThis.fetch=async (url,opts) => {
    if(String(url).includes('contact_leads')){sent=JSON.parse(opts.body);return new Response('[{"id":"generated-id"}]',{status:201});}
    return new Response('{"id":"email"}');
  };
  const result=await handler(req({...sample,request_id:undefined}));
  assert.equal(result.status,200);assert.equal((await result.json()).id,'generated-id');
  assert.equal('id' in sent,false);
});

test('Supabase failure never reports success', async () => {
  ready();globalThis.fetch=async()=>new Response('{"error":"database unavailable"}',{status:503});
  const result=await handler(req());assert.equal(result.status,502);
  assert.equal((await result.json()).saved,false);
});
