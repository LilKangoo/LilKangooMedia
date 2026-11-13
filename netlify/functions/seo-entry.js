'use strict';
// Read-only indexable HTML for PUBLIC case studies, future services, and new CMS articles.
// Existing SPA, bookings, Stripe and admin are not modified.
import * as d from '../lib/seo-data.js';
import staticSEO from './seo-static-urls.json' with { type: 'json' };
const {SITE,IMG,e,plain,compact,image,validSlug,storyPublished,serviceIndexable,articlePublished,one,result,missing}=d;
function p(v){const lines=String(v||'').replace(/<\s*\/(?:p|h[1-6]|li|div|blockquote|section)\s*>/gi,'\n\n').replace(/<\s*br\b[^>]*>/gi,'\n').replace(/<(?:script|style|iframe|object)\b[^>]*>[\s\S]*?<\/\s*(?:script|style|iframe|object)\s*>/gi,' ').replace(/<[^>]+>/g,' ').split(/\n\s*\n/g).map(x=>plain(x)).filter(Boolean);return lines.map(x=>`<p>${e(x)}</p>`).join('');}
function jsonld(data){return JSON.stringify(data).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');}
function webDocument({kind,url,title,description,cover,coverAlt,lead,body,breadcrumbs,structured,mainLink}){
 const ogimg=image(cover)||IMG,desc=compact(description,210)||'Explore original projects and creative services from LilKangooMedia in Cyprus.',name=compact(title,160);
 const schema={'@context':'https://schema.org','@graph':[
  {'@type':'WebSite','@id':SITE+'/#website',url:SITE+'/',name:'LilKangooMedia'},
  {'@type':'Organization','@id':SITE+'/#organization',name:'LilKangooMedia LTD',url:SITE+'/',logo:SITE+'/assets/lkm-v3/brand/logo-profile.png'},
  {'@type':'WebPage','@id':url+'#webpage',url,name,description:desc,inLanguage:'en',isPartOf:{'@id':SITE+'/#website'},breadcrumb:{'@id':url+'#breadcrumbs'}},
  {'@type':'BreadcrumbList','@id':url+'#breadcrumbs',itemListElement:breadcrumbs.map((v,i)=>({'@type':'ListItem',position:i+1,name:v[0],item:v[1]}))},structured
 ]};
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#23211f"><title>${e(name)}</title><meta name="description" content="${e(desc)}"><meta name="robots" content="index,follow"><link rel="canonical" href="${e(url)}"><meta property="og:type" content="${kind==='article'||kind==='story'?'article':'website'}"><meta property="og:site_name" content="LilKangooMedia"><meta property="og:title" content="${e(name)}"><meta property="og:description" content="${e(desc)}"><meta property="og:url" content="${e(url)}"><meta property="og:image" content="${e(ogimg)}"><meta property="og:image:alt" content="${e(compact(coverAlt||name,170))}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${e(ogimg)}"><link rel="icon" href="/assets/lkm-v3/brand/logo-profile.png"><script type="application/ld+json">${jsonld(schema)}</script><style>
 :root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 80% 20%,#393128 0%,transparent 40%),linear-gradient(155deg,#18191b,#292724);color:#f5f2ee;font:16px/1.7 -apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif}a{color:#f9c179}a:focus-visible{outline:3px solid #f9c179;outline-offset:3px}header{background:#fff;color:#15211b;padding:13px clamp(16px,4vw,60px);display:flex;align-items:center;justify-content:space-between;gap:14px}header a{color:#17201b;text-decoration:none;font-weight:700}header img{width:36px;height:36px;vertical-align:middle;margin-right:10px;border-radius:50%}main{max-width:1020px;margin:0 auto;padding:clamp(28px,5vw,70px) 18px 80px}.crumb{color:#ffc16f;font-size:12px;letter-spacing:.05em}.crumb a{text-decoration:none}h1{font-size:clamp(32px,5vw,62px);line-height:1.12;letter-spacing:-.045em;max-width:850px;margin:20px 0}h2{font-size:clamp(24px,3vw,34px);margin:34px 0 10px;color:#fff}h3{font-size:20px;margin:20px 0 7px}.intro{font-size:19px;color:#e5ded6;max-width:820px}.hero{max-width:100%;height:auto;max-height:540px;object-fit:contain;display:block;border-radius:18px;margin:24px 0 40px;background:#25231f}.content{max-width:850px;color:#ded6ce}.content p{margin:13px 0;white-space:pre-wrap}.content ul{padding-left:23px}.content li{margin-bottom:8px}.call{border:1px solid #655039;border-radius:14px;background:#302b24;padding:24px;margin-top:40px}.cta{background:#f6b44c;color:#1e211d;padding:12px 22px;border-radius:9px;display:inline-block;font-weight:800;text-decoration:none}.small{color:#ccc3b6;font-size:14px}footer{border-top:1px solid #4e463c;padding:25px;text-align:center;color:#cdc3b7}footer a{margin:0 10px} .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:15px}.grid img{width:100%;max-height:350px;object-fit:cover;border-radius:12px}@media(max-width:620px){header nav{display:none}.content{font-size:15px}}
</style></head><body><header><a href="/"><img alt="" src="/assets/lkm-v3/brand/logo-profile.png">LilKangooMedia</a><nav><a href="/">Home</a> &nbsp; <a href="/services/index.html">Services</a> &nbsp; <a href="/portfolio.html">Portfolio</a> &nbsp; <a href="/blog.html">Articles</a></nav></header><main><nav class="crumb" aria-label="Breadcrumb">${breadcrumbs.map(([n,u])=>`<a href="${e(u)}">${e(n)}</a>`).join(' &nbsp; / &nbsp; ')}</nav><h1>${e(name)}</h1>${lead?`<p class="intro">${e(compact(lead,500))}</p>`:''}${ogimg!==IMG?`<img class="hero" src="${e(ogimg)}" alt="${e(coverAlt||name)}" loading="eager">`:''}<div class="content">${body}</div><div class="call"><h2>Explore the complete project</h2><p>View the interactive presentation, gallery and available services on our website.</p><a class="cta" href="${e(mainLink)}">View full experience</a></div></main><footer>LilKangooMedia LTD | Cyprus <a href="/">Home</a><a href="/portfolio.html">Our work</a><a href="/#/contact">Contact</a></footer></body></html>`;
}
async function story(slug){
 const g=await one('portfolio_galleries',{slug:'eq.'+slug,visibility:'eq.public'});if(!g)return missing();
 const cs=await one('lkm_case_studies',{gallery_id:'eq.'+g.id,is_published:'eq.true'});if(!storyPublished(g,cs))return missing();
 let cover='',coverAlt='';if(g.cover_image_id){const pic=await one('portfolio_images',{id:'eq.'+g.cover_image_id,visibility:'eq.public'});if(pic&&pic.gallery_id===g.id){cover=image(pic.image_url);coverAlt=pic.alt_text||'';}}
 if(!cover){const pics=await d.apiRows('portfolio_images',{gallery_id:'eq.'+g.id,visibility:'eq.public',order:'display_order.asc'});cover=image(pics[0]?.image_url);coverAlt=pics[0]?.alt_text||'';}
 const url=`${SITE}/work/${slug}/`,title=plain(cs.headline)||plain(g.title);
 let deliverables=Array.isArray(cs.deliverables)?cs.deliverables:[];
 const body=`<h2>The objective</h2>${p(cs.objective)}<h2>Our approach</h2>${p(cs.approach)}${deliverables.length?`<h2>What we delivered</h2><ul>${deliverables.filter(x=>typeof x==='string').slice(0,18).map(x=>`<li>${e(plain(x))}</li>`).join('')}</ul>`:''}${cs.outcomes?`<h2>Documented outcome</h2>${p(cs.outcomes)}`:''}`;
 const structured={'@type':'Article','@id':url+'#article',headline:title,description:compact(cs.objective),mainEntityOfPage:url,author:{'@id':SITE+'/#organization'},publisher:{'@id':SITE+'/#organization'},image:cover||IMG,datePublished:cs.created_at||undefined,dateModified:cs.updated_at||undefined};
 return result(200,webDocument({kind:'story',url,title:title+' | LilKangooMedia',description:g.description||cs.objective,cover,coverAlt,lead:g.description||cs.objective,body,structured,breadcrumbs:[['Home',SITE+'/'],['Project Stories',SITE+'/portfolio.html#/stories'],[title,url]],mainLink:SITE+'/portfolio.html#/story/'+slug}));
}
async function service(slug){
 // Protect previously published curated guides from a second canonical URL.
 if((staticSEO.urls||[]).includes(`${SITE}/services/${slug}.html`))return {statusCode:301,headers:{Location:`${SITE}/services/${slug}.html`,'Cache-Control':'public,max-age=3600'},body:''};
 const s=await one('services',{slug:'eq.'+slug,active:'eq.true'});if(!serviceIndexable(s))return missing();
 const url=`${SITE}/services/${slug}/`,title=plain(s.title),lead=s.summary||s.description,desc=s.description||s.summary;
 const raw=Array.isArray(s.features)?s.features:typeof s.features==='string'?(()=>{try{return JSON.parse(s.features)}catch{return []}})():[];
 const features=raw.filter(x=>typeof x==='string'&&x.trim()).slice(0,12);
 const body=`<h2>About this service</h2>${p(desc)}${features.length?`<h2>What we offer</h2><ul>${features.map(x=>`<li>${e(plain(x))}</li>`).join('')}</ul>`:''}`;
 const structured={'@type':'Service','@id':url+'#service',name:title,description:compact(desc,240),serviceType:s.category||title,areaServed:{'@type':'Country',name:'Cyprus'},provider:{'@id':SITE+'/#organization'},url};
 return result(200,webDocument({kind:'service',url,title:title+' | LilKangooMedia Cyprus',description:desc,cover:s.cover_url,coverAlt:title,lead,body,structured,breadcrumbs:[['Home',SITE+'/'],['Services',SITE+'/services/index.html'],[title,url]],mainLink:SITE+'/#/service/'+slug}));
}
async function article(slug){
 const a=await one('blog_posts',{slug:'eq.'+slug,status:'eq.published',published_at:'not.is.null'});
 if(!articlePublished(a)||a.legacy_path||!(d.canonicalArticle(a)))return missing();
 const body=String(a.body_html||'');if(plain(body).length<100)return missing();
 const url=d.canonicalArticle(a),title=plain(a.seo_title||a.title);
 const structured={'@type':'BlogPosting','@id':url+'#article',headline:plain(a.title),description:compact(a.seo_description||a.excerpt),mainEntityOfPage:url,datePublished:a.published_at,dateModified:a.updated_at,author:{'@id':SITE+'/#organization'},publisher:{'@id':SITE+'/#organization'},image:image(a.cover_url)||IMG};
 return result(200,webDocument({kind:'article',url,title:title+' | LilKangooMedia',description:a.seo_description||a.excerpt||body,cover:a.cover_url,coverAlt:a.cover_alt,lead:a.excerpt,body:`<h2>${e(plain(a.title))}</h2>${p(body)}`,structured,breadcrumbs:[['Home',SITE+'/'],['Articles',SITE+'/blog.html'],[plain(a.title),url]],mainLink:SITE+'/blog.html'}));
}
export const handler=async event=>{
 const kind=String(event.queryStringParameters?.kind||'');const slug=String(event.queryStringParameters?.slug||'');if(!validSlug(slug)||!['story','service','article'].includes(kind))return missing();
 try{if(kind==='story')return await story(slug);if(kind==='service')return await service(slug);return await article(slug);}
 catch(err){console.error('SEO public page unavailable',String(err));return result(503,'Public page temporarily unavailable','text/plain; charset=utf-8',{'Cache-Control':'no-store','Retry-After':'180'});}
};
export const _test={story,service,article,webDocument,p};
