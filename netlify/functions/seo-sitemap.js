'use strict';
// Dynamic, optional child of the sitemap index. Unavailable data => 503, never a fake empty sitemap.
const {SITE,e,validSlug,articlePublished,storyPublished,serviceIndexable,canonicalArticle,apiRows,result,date}=require('../lib/seo-data');
const staticManifest=require('./seo-static-urls.json');
const xns='http://www.sitemaps.org/schemas/sitemap/0.9';
function dynamicUrls({services=[],galleries=[],stories=[],posts=[]}){
 const staticSet=new Set(staticManifest.urls||[]);
 const byGallery=new Map(stories.filter(s=>s.is_published===true).map(s=>[s.gallery_id,s]));
 const set=new Map();
 function add(url,modified){if(!url.startsWith(SITE+'/')||staticSet.has(url))return;set.set(url,date(modified)||null);}
 for(const s of services){if(!serviceIndexable(s))continue;
   // Existing curated guide is canonical. Do not create a duplicate service landing page.
   if(staticSet.has(`${SITE}/services/${s.slug}.html`))continue;
   add(`${SITE}/services/${s.slug}/`,s.updated_at);
 }
 for(const g of galleries){if(!validSlug(g.slug))continue;const s=byGallery.get(g.id);if(storyPublished(g,s))add(`${SITE}/work/${g.slug}/`,s.updated_at||g.updated_at);}
 for(const p of posts){const url=canonicalArticle(p);if(url&&plainBody(p.body_html).length>=100)add(url,p.updated_at);}
 return Array.from(set.entries()).sort((a,b)=>a[0].localeCompare(b[0]));
}
const plainBody=v=>String(v||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
function render(urls){const parts=urls.map(([url,lastmod])=>`  <url><loc>${e(url)}</loc>${lastmod?`<lastmod>${lastmod}</lastmod>`:''}</url>`).join('\n');return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="${xns}">\n${parts}\n</urlset>\n`;}
exports.handler=async()=>{try{
 const [services,galleries,stories,posts]=await Promise.all([
   apiRows('services',{active:'eq.true'}),
   apiRows('portfolio_galleries',{visibility:'eq.public'}),
   apiRows('lkm_case_studies',{is_published:'eq.true'}),
   apiRows('blog_posts',{status:'eq.published',published_at:'not.is.null'})
 ]);
 return result(200,render(dynamicUrls({services,galleries,stories,posts})),'application/xml; charset=utf-8',{'Cache-Control':'public,max-age=180,s-maxage=300'});
}catch(err){console.error('SEO live sitemap unavailable',String(err));return result(503,'Temporary sitemap data issue','text/plain; charset=utf-8',{'Cache-Control':'no-store','Retry-After':'300'});}};
exports._test={render,dynamicUrls};
