import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SECTORS,SECTOR_LINKS,activeBusinessServices,getPackages,validSlug,cleanLine,composeBrief} from '../assets/lkm-v3/business-data.mjs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const services=[
  {slug:'product-brand-photography',title:'Product & Brand Photography',audience:'business',active:true},
  {slug:'commercial-video-reels',title:'Commercial Video & Reels',audience:'business',active:true},
  {slug:'website-design',title:'Website Design',audience:'business',active:true},
  {slug:'wedding-photography-video',title:'Wedding',audience:'personal',active:true},
  {slug:'marketing-advertising',title:'Marketing',audience:'business',active:false},
];

test('industry pages are complete physical HTML documents with distinct SEO canonicals',()=>{
 for(const [sector,url] of Object.entries(SECTOR_LINKS)){
   const html=read(url.slice(1));
   assert.match(html,new RegExp(`data-business-sector="${sector}"`));
   assert.match(html,new RegExp(`https://lilkangoomedia.com${url}`));
   assert.match(html,/<h1>/);assert.match(html,/name="email" type="email"/);
   assert.match(html,/name="consent" required/);
   assert.match(html,/business-solutions\.mjs/);
 }
});
test('existing homepage and prior phase assets remain linked',()=>{
 for(const file of ['index.html','home.html']){
  const html=read(file);
  for(const term of ['phase21-booking.js','phase21-payments.js','phase21-availability.js','phase22-related-work.js','phase22-trust-reviews.js'])assert.ok(html.includes(term),term+' missing from '+file);
  assert.ok(html.includes('business-solutions.html'));
  assert.ok(html.includes('case-studies.html'));
 }
});
test('only active, valid business records may be offered',()=>{
 const filtered=activeBusinessServices([...services,{slug:'../bad',title:'Bad',audience:'business'},services[0]]);
 assert.deepEqual(filtered.map(x=>x.slug),['product-brand-photography','commercial-video-reels','website-design']);
});
test('strict valid slugs prevent unsafe generated URLs',()=>{
 assert.equal(validSlug('website-design'),true);
 for(const bad of ['../bad','javascript:alert(1)','CAPS','',null,'x'.repeat(91)])assert.equal(validSlug(bad),false);
});
test('all four sectors have three distinct suggested combinations',()=>{
 for(const sector of ['restaurants','hotels','retail','brands']){
  const rows=SECTORS[sector].packages;
  assert.equal(rows.length,3);
  assert.equal(new Set(rows.map(p=>p.key)).size,3);
  assert.ok(rows.every(x=>x.name&&x.summary&&x.slugs.length>0));
 }
});
test('suggested combinations use only listed real active services',()=>{
 const bundles=getPackages('restaurants',services);
 assert.equal(bundles[0].services.length,2);
 assert.ok(bundles[0].services.every(s=>s.active===true&&s.audience==='business'));
 assert.ok(getPackages('brands',[]).every(p=>p.services.length===0));
});
test('no invented prices, discounts, fixed delivery promises or guaranteed metrics in sector descriptions',()=>{
 const content=JSON.stringify(SECTORS);
 assert.doesNotMatch(content,/€\s*\d+|\bguaranteed\b|%\s*(?:conversion|return)/i);
});
test('enquiry brief captures sector, company, business options and context',()=>{
 const brief=composeBrief({sector:'retail',company:'My Shop',area:'Larnaca',timeline:'Within 1 month',budget:'€500–€1,500',bundle:'Product launch essentials',services:['Product & Brand Photography'],description:'We need photos for our new online shop.'});
 for(const item of ['Retail & E-commerce','My Shop','Larnaca','Within 1 month','€500–€1,500','Product launch essentials','Product & Brand Photography','new online shop'])assert.ok(brief.includes(item));
});
test('brief sanitizes newlines in metadata to prevent forged fields',()=>{
 const brief=composeBrief({sector:'restaurants',company:'Shop\nSector: Fake',description:'Please reach out about launch.'});
 assert.ok(brief.includes('Company: Shop Sector: Fake'));
 assert.equal((brief.match(/^Sector:/gm)||[]).length,1);
});
test('unknown sector falls back to generic business solutions',()=>{
 const t=composeBrief({sector:'nonexistent',description:'Custom project.'});
 assert.ok(t.includes('Sector: Business Solutions'));
});
test('enquiry remains within Netlify 3000-character message bound',()=>{
 const brief=composeBrief({sector:'restaurants',company:'C'.repeat(100),area:'A'.repeat(120),description:'D'.repeat(950),services:['Photography','Videography','Graphic Design']});
 assert.ok(brief.length<=3000);
 assert.throws(()=>composeBrief({sector:'restaurants',company:'C'.repeat(100),area:'A'.repeat(120),description:'D'.repeat(1500),services:Array(12).fill('M'.repeat(100))}),/shorten/i);
});
test('all web page requests target existing enquiry endpoint and never payment/refund APIs',()=>{
 const js=read('assets/lkm-v3/business-solutions.mjs');
 assert.match(js,/fetch\('\/api\/enquiry'/);
 assert.doesNotMatch(js,/\/api\/checkout|\/refunds|\/api\/refund/);
 assert.match(js,/request_id/);
 assert.match(js,/turnstile_token/);
});
test('forms do not collect credit cards or claim confirmed bookings',()=>{
 for(const url of Object.values(SECTOR_LINKS)){
  const html=read(url.slice(1));
  assert.doesNotMatch(html,/name="card_number"|name="payment_method"/i);
  assert.match(html,/No payment or confirmed booking is created/);
 }
});
test('sector bundle links preserve actual service slugs and client side credentials stay public-only',()=>{
 const script=read('assets/lkm-v3/business-solutions.mjs');
 assert.match(script,/encodeURIComponent\(service\.slug\)/);
 assert.doesNotMatch(script,/SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|RESEND_API_KEY/);
 assert.match(script,/notification_sent===false/);
});
