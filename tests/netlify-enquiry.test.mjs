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

test('booking preferences saved in existing message and included in email without schema changes', async () => {
  ready();let stored,mail;
  globalThis.fetch = async (url, opts) => {
    if(String(url).includes('/rest/v1/contact_leads')) {
      stored=JSON.parse(opts.body);
      return new Response(JSON.stringify([{id:uuid}]),{status:201});
    }
    if(String(url).includes('api.resend.com')) {
      mail=JSON.parse(opts.body);return new Response('{"id":"sent"}',{status:200});
    }
    throw Error('Unexpected endpoint '+url);
  };
  const booking={...sample, type:'booking_enquiry', service_slug:'family-photography', preferred_date:'2099-01-14', booking_time:'afternoon', booking_alternative_date:'2099-01-16', booking_location:'  Larnaca  -  Hotel  '} ;
  const r=await handler(req(booking));const body=await r.json();
  assert.equal(r.status,200);assert.equal(body.saved,true);
  assert.equal(stored.preferred_date,'2099-01-14');
  assert.equal(stored.service_slug,'family-photography');
  assert.equal(stored.booking_time,undefined);
  assert.match(stored.message,/\[BOOKING PREFERENCES\]/);
  assert.match(stored.message,/Afternoon \(12:00–17:00\)/);
  assert.match(stored.message,/Alternative date: 2099-01-16/);
  assert.match(stored.message,/Location \/ area: Larnaca - Hotel/);
  assert.match(mail.html,/BOOKING PREFERENCES/);
});

test('booking retry with same UUID and preferences does not resend email', async () => {
  ready();let calls=0;
  const booking={...sample,type:'booking_enquiry',preferred_date:'2099-02-04',booking_time:'morning',booking_location:'Paphos'};
  const msg=sample.message+'\n\n[BOOKING PREFERENCES]\nPreferred time: Morning (08:00–12:00)\nLocation / area: Paphos\n[END BOOKING PREFERENCES]';
  globalThis.fetch=async (url, opts={})=>{
    calls++;
    if(opts.method==='POST') return new Response('{"code":"23505"}',{status:409});
    if(String(url).includes('contact_leads'))return new Response(JSON.stringify([{...savedRecord, preferred_date:'2099-02-04', message:msg,submission_type:'booking_enquiry'}]));
    throw Error('Should not resend mail');
  };
  const r=await handler(req(booking));const body=await r.json();
  assert.equal(r.status,200);assert.equal(body.duplicate,true);assert.equal(calls,2);
});

test('invalid/past dates and time preferences rejected before writing data', async () => {
  ready();globalThis.fetch=()=>{throw Error('Should be rejected before fetch');};
  const base={...sample,type:'booking_enquiry',preferred_date:'2099-06-03'};
  for(const bad of [
    {...base,preferred_date:'2020-01-01'},
    {...base,preferred_date:'2099-02-30'},
    {...base,preferred_date:'2099-13-01'},
    {...base,booking_time:'after-midnight'},
    {...base,booking_alternative_date:'2099-06-03'},
    {...base,booking_alternative_date:'2099-06-31'},
    {...base,booking_alternative_date:'2022-01-01'},
    {...base,preferred_date:'',booking_alternative_date:'2099-06-05'},
  ]) {
    const r=await handler(req(bad));assert.equal(r.status,400,JSON.stringify(bad));
  }
});

test('other enquiry types ignore booking-only preference fields', async () => {
  ready();let written;
  globalThis.fetch=async (url,opts)=>{
    if(String(url).includes('contact_leads')) {written=JSON.parse(opts.body);return new Response(JSON.stringify([{id:uuid}]),{status:201});}
    return new Response('{"id":"email"}',{status:200});
  };
  const r=await handler(req({...sample,booking_time:'evening',booking_location:'Private user supplied detail'}));
  assert.equal(r.status,200);assert.equal(written.message,sample.message);
});
