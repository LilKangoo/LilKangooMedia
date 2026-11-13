const assert=require('node:assert/strict');
const path=require('node:path');
const {handler:sitemap,_test:sitemapUnit}=require('../netlify/functions/seo-sitemap');
const {handler:entry}=require('../netlify/functions/seo-entry');
const {SITE}=require('../netlify/lib/seo-data');
// Simulate the post-build manifest containing an existing curated static service guide.
require('../netlify/functions/seo-static-urls.json').urls.push(SITE+'/services/portrait-photography.html');
const data={
 services:[
  {slug:'portrait-photography',title:'Portrait Photography',active:true,summary:'We photograph individuals and families across Cyprus in locations agreed with each customer. Each project is planned around client preferences.',description:'Detailed personal portrait photography in Cyprus with tailored creative planning and edited photographic results.',category:'Photography',cover_url:'/assets/images/portrait-15.jpg',updated_at:'2026-11-11T12:00:00Z'},
  {slug:'brand-audit-2027',title:'Brand Strategy and Visual Audit',active:true,summary:'We help businesses in Cyprus review their brand presentation, prepare visual guidelines and identify practical improvements to their digital communications.',description:'We review existing brand materials and present tailored design recommendations that fit the client brief.',category:'Marketing',cover_url:'/assets/images/orofino-4.jpg',updated_at:'2026-11-13T12:00:00Z',features:['Brand identity review','Recommendations for improving visual presentation']},
  {slug:'hidden-demo',title:'Hidden Demo',active:false,description:'A sufficiently long description that must never appear because this service is not active and published.'},
  {slug:'thin-service',title:'Thin Service',active:true,description:'A very short description'}],
 portfolio_galleries:[
  {id:'ga',slug:'cypruseye-tourism-saas-platform',title:'CyprusEye Platform',description:'An interactive tourism SaaS platform for travellers and business partners in Cyprus.',category:'Digital Platforms',visibility:'public',cover_image_id:'img1',updated_at:'2026-11-14T09:00:00Z'},
  {id:'gb',slug:'private-project',title:'Private Client',visibility:'private'},
  {id:'gc',slug:'other-gallery',title:'Other Gallery',visibility:'public'}],
 lkm_case_studies:[
  {gallery_id:'ga',is_published:true,headline:'CyprusEye Tourism SaaS Platform',objective:'We built a complete product based on real tourism business requirements.',approach:'Our team designed and developed the platform, brand and digital content from the ground up.',outcomes:'The project reached over two hundred registered users, based on client supplied reporting.',deliverables:['Responsive SaaS platform','Original visual identity'],client_label:'CyprusEye',updated_at:'2026-11-14T09:00:00Z'},
  {gallery_id:'gb',is_published:true,headline:'Private Work',objective:'A private project which should not appear in public search.',approach:'No content should be exposed to search engines.'},
  {gallery_id:'gc',is_published:false,headline:'Unpublished Case',objective:'This is a drafted case study not yet published.',approach:'It must not be accessible publicly.'}],
 portfolio_images:[{id:'img1',gallery_id:'ga',visibility:'public',image_url:'https://cdn.example.com/cypruseye-cover.jpg',alt_text:'CyprusEye logo',display_order:0}],
 blog_posts:[
  {slug:'seo-guide-for-businesses',title:'SEO Guide for Businesses',excerpt:'Guide to understanding organic search for businesses and agencies in Cyprus',seo_title:'SEO Guide for Cyprus Businesses',seo_description:'We explain the basics of organic search, website structure and sustainable publishing.',body_html:'<p>This is an original practical guide for website owners and companies in Cyprus. It covers crawlable HTML pages, the publishing process, correct title and metadata fields, structured data where it is relevant, and long-term content quality.</p><p>The second paragraph describes how businesses can implement reliable information architecture that can grow as new services and articles are published to the website. Every recommendation should be verified and no business results are guaranteed.</p>',status:'published',published_at:'2026-11-11T00:00:00Z',updated_at:'2026-11-12T08:00:00Z',legacy_path:null,canonical_url:null},
  {slug:'future-article',title:'Future Article',body_html:'This is hidden until its future publication date.',status:'published',published_at:'2030-01-01T00:00:00Z'},
  {slug:'draft-article',title:'Draft Article',body_html:'Do not expose this draft text to search engines.',status:'draft',published_at:null},
  {slug:'old-cms-article',title:'Legacy Article',status:'published',published_at:'2026-08-01T00:00:00Z',legacy_path:'/old-article.html'}]
};
const origFetch=global.fetch;
global.fetch=async url=>{
 const u=new URL(url);const table=u.pathname.split('/').at(-1);if(!(table in data))throw Error('Unknown table: '+table);
 let rows=data[table].slice();
 for(const [k,val] of u.searchParams){if(k==='select'||k==='limit'||k==='order')continue;if(val.startsWith('eq.'))rows=rows.filter(x=>String(x[k])===val.slice(3));else if(val==='not.is.null')rows=rows.filter(x=>x[k]!=null);}
 return {ok:true,status:200,json:async()=>rows};
};
(async()=>{
 const main=await sitemap({});assert.equal(main.statusCode,200);
 assert.match(main.headers['Content-Type'],/application\/xml/);
 assert.match(main.body,/work\/cypruseye-tourism-saas-platform\//);
 assert.match(main.body,/services\/brand-audit-2027\//);
 assert.match(main.body,/articles\/seo-guide-for-businesses/);
 for(const hidden of ['private-project','other-gallery','hidden-demo','thin-service','future-article','draft-article','old-cms-article','portrait-photography'])assert.doesNotMatch(main.body,new RegExp(hidden));
 const reStory=await entry({queryStringParameters:{kind:'story',slug:'cypruseye-tourism-saas-platform'}});
 assert.equal(reStory.statusCode,200);for(const part of ['<link rel="canonical" href="https://lilkangoomedia.com/work/cypruseye-tourism-saas-platform/">','<meta property="og:image" content="https://cdn.example.com/cypruseye-cover.jpg">','<h2>What we delivered</h2>','application/ld+json','View full experience'])assert.ok(reStory.body.includes(part),part);
 assert.equal((await entry({queryStringParameters:{kind:'story',slug:'private-project'}})).statusCode,404);
 const reService=await entry({queryStringParameters:{kind:'service',slug:'brand-audit-2027'}});
 assert.equal(reService.statusCode,200);assert.ok(reService.body.includes('Brand identity review'));assert.ok(reService.body.includes('services/brand-audit-2027/'));
 assert.equal((await entry({queryStringParameters:{kind:'service',slug:'hidden-demo'}})).statusCode,404);
 const reArticle=await entry({queryStringParameters:{kind:'article',slug:'seo-guide-for-businesses'}});
 assert.equal(reArticle.statusCode,200);assert.ok(reArticle.body.includes('SEO Guide for Cyprus Businesses'));assert.ok(reArticle.body.includes('website owners and companies'));
 assert.equal((await entry({queryStringParameters:{kind:'article',slug:'future-article'}})).statusCode,404);
 for(const badSlug of ['../admin','.env','<script>','not_valid']) assert.equal((await entry({queryStringParameters:{kind:'story',slug:badSlug}})).statusCode,404);
 console.log('PASS: public sitemap dynamic records, safe exclusions, metadata, descriptions, covers, structure, correct route, 404');
 const old=global.fetch;global.fetch=async()=>{throw Error('database unavailable')};
 const fault=await sitemap({});assert.equal(fault.statusCode,503);assert.equal(fault.headers['Cache-Control'],'no-store');global.fetch=old;
 console.log('PASS: Supabase failure => temporary 503, never fake empty sitemap');
})().catch(err=>{console.error(err);process.exitCode=1}).finally(()=>{global.fetch=origFetch});
