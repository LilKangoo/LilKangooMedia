/* LilKangooMedia Phase 19 — admin-only searchable link library.
 * Reads existing public services, published articles and galleries; no new DB table or writes.
 * Service/gallery share URLs resolve through the Netlify OpenGraph endpoint.
 */
(()=>{'use strict';
const root=document.getElementById('lkmLinksAdmin');if(!root)return;
const store=window.LKMStore;
const cfg=window.LKM_CONFIG||{};
const SITE='https://lilkangoomedia.com';
const LOGO='/assets/lkm-v3/brand/logo-profile.png';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const untag=v=>String(v??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const brief=(v,max=280)=>untag(v).slice(0,max);
const validSlug=s=>/^[a-z0-9][a-z0-9_-]{0,119}$/i.test(String(s||''));
const nice=s=>String(s||'').replace(/[-_]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
const safeImage=url=>{try{const u=new URL(url||'',SITE);if(!['http:','https:'].includes(u.protocol)||!url||/\s/.test(url))return '';return u.href;}catch{return ''}};
const internalLink=path=>{try{let u=new URL(String(path||''),SITE);return u.origin===SITE&&['http:','https:'].includes(u.protocol)?u.href:'';}catch{return ''}};
let items=[],filter='all',q='',warnings=[];
const groups=[
 {id:'pages',label:'Main pages'},
 {id:'personal',label:'Personal services'},
 {id:'business',label:'Business services'},
 {id:'galleries',label:'Portfolio galleries'},
 {id:'articles',label:'Articles & guides'},
 {id:'social',label:'Social & contact'}
];
function makeItem({kind,folder,title,description,image,slug,url,directUrl,category,metaTitle}){
 const safe=internalLink(url)||(/^https:\/\//.test(String(url||''))?String(url):'');
 if(!safe||!title)return;
 let id=kind+':'+(slug||safe);
 return {id,kind,folder,title:String(title).trim(),metaTitle:String(metaTitle||title+' | LilKangooMedia').trim(),description:brief(description)||'',image:safeImage(image),slug:String(slug||''),category:String(category||''),url:safe,directUrl:internalLink(directUrl)||safe};
}
function standard(){
 const base=[
  ['Home','/', 'Photography, filmmaking, design and marketing services in Cyprus.','/assets/images/home-meta.jpg','pages'],
  ['All services','/#/services','Browse LilKangooMedia photography, videography, design and marketing services.','/assets/images/home-meta.jpg','pages'],
  ['Personal services','/#/services?audience=personal','Photography, videography, weddings and private experiences in Cyprus.','/assets/images/portrait-15.jpg','pages'],
  ['Business services','/#/services?audience=business','Commercial photography, video, websites, creative design and marketing.','/assets/images/orofino-4.jpg','pages'],
  ['About LilKangooMedia','/#/about','Learn about LilKangooMedia and our creative work across Cyprus.','/assets/images/home-meta.jpg','pages'],
  ['Portfolio','/portfolio.html','Explore photography, filmmaking, product photography and graphic design projects.','/assets/images/orofino-4.jpg','pages'],
  ['Articles & inspiration','/blog.html','Photography education, creative insights and Cyprus guides.','/assets/images/home-meta.jpg','pages'],
  ['Customer reviews','/reviews.html','Read customer reviews of LilKangooMedia photography and creative services.','/assets/images/home-meta.jpg','pages'],
  ['Contact us','/#/contact','Get in touch with LilKangooMedia about your creative project.','/assets/images/home-meta.jpg','pages'],
  ['FAQ & Privacy','/FAQ.html','Frequently asked questions and privacy information from LilKangooMedia.','/assets/lkm-v3/brand/logo-profile.png','pages']
 ];
 const out=base.map(([title,path,description,image,folder])=>makeItem({kind:'page',folder,title,description,image,url:SITE+path,slug:path,metaTitle:title+' | LilKangooMedia'}));
 const social=[
  ['Google reviews','https://www.google.com/maps/place/LilKangooMedia/@35.1688,33.4252,9z/data=!4m8!3m7!1s0x14e083213d8d68e1:0xc5fa68230e0cfed8!8m2!3d35.1688!4d33.4252!9m1!1b1!16s%2Fg%2F11n88nph87','Our public Google Business Profile and reviews.'],
  ['Leave a Google review','https://g.page/r/Cdj-DA4jaPrFEAE/review','Leave a review on the LilKangooMedia Google Business Profile.'],
  ['WhatsApp','https://wa.me/35799005924','Contact LilKangooMedia on WhatsApp.'],
  ['Instagram','https://www.instagram.com/lilkangoomedia','LilKangooMedia Instagram profile.'],
  ['Facebook','https://www.facebook.com/Lilkangoomedia/','LilKangooMedia Facebook profile.'],
  ['YouTube','https://www.youtube.com/channel/UCgIrKPHFpPy6srhdq4SjEtw','LilKangooMedia YouTube channel.']
 ];
 social.forEach(([title,url,description])=>out.push(makeItem({kind:'external',folder:'social',title,description,url,image:LOGO,slug:new URL(url).hostname,metaTitle:title+' — LilKangooMedia'})));
 return out.filter(Boolean);
}
async function api(tableQuery){
 if(!cfg.SUPABASE_URL||!cfg.SUPABASE_ANON_KEY)throw Error('Supabase not configured');
 const base=String(cfg.SUPABASE_URL).replace(/\/$/,'');
 const res=await fetch(base+'/rest/v1/'+tableQuery,{headers:{apikey:cfg.SUPABASE_ANON_KEY,'Content-Type':'application/json'}});
 if(!res.ok)throw Error('Supabase '+res.status);
 return res.json();
}
async function loadAll(){
 warnings=[];const results=standard();
 // For ordinary static pages, read the real HTML metadata when available.
 // Hash-routed subpages are intentionally exempt: they share the index.html head,
 // while service/gallery share pages receive individualized OG tags from Netlify.
 if(typeof DOMParser!=='undefined'){
   const staticPages=results.filter(x=>x.kind==='page'&&!new URL(x.url).hash);
   await Promise.allSettled(staticPages.map(async x=>{
     const u=new URL(x.url);const res=await fetch(u.pathname,{cache:'force-cache'});
     if(!res.ok)return;const html=await res.text();const doc=new DOMParser().parseFromString(html,'text/html');
     x.metaTitle=doc.title?.trim()||x.metaTitle;
     x.description=brief(doc.querySelector('meta[name="description"]')?.getAttribute('content')||x.description);
     const og=doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
     if(og)x.image=safeImage(og)||x.image;
   }));
 }
 try{
  const services=await store.publicServices();
  for(const s of services){
   if(s.active===false||!validSlug(s.slug))continue;
   const original=SITE+'/#/service/'+encodeURIComponent(s.slug);
   const share=SITE+'/share/service/'+encodeURIComponent(s.slug);
   results.push(makeItem({kind:'service',folder:s.audience==='personal'?'personal':'business',title:s.title,metaTitle:s.title+' | LilKangooMedia',description:s.summary||s.description||'',category:s.category||'',image:s.cover_url,slug:s.slug,url:share,directUrl:original}));
  }
 }catch(e){warnings.push('Services could not be loaded ('+e.message+'). Refresh to try again.');}
 try{
  let index=null;
  try{const res=await fetch('/assets/lkm-v3/articles-index.json',{cache:'no-store'});if(res.ok)index=await res.json();}catch{}
  let posts=Array.isArray(index?.posts)?index.posts:[];
  if(!posts.length){posts=await api('blog_posts?select=slug,title,excerpt,cover_url,seo_title,seo_description,legacy_path,status,published_at&status=eq.published&published_at=lte.'+encodeURIComponent(new Date().toISOString())+'&order=published_at.desc&limit=1000');}
  for(const p of posts){
   if(!validSlug(p.slug))continue;
   const url=internalLink(p.permalink||p.legacy_path||'/articles/'+encodeURIComponent(p.slug)+'.html');
   if(!url)continue;
   results.push(makeItem({kind:'article',folder:'articles',title:p.title,metaTitle:p.seo_title||p.title+' | LilKangooMedia',description:p.seo_description||p.excerpt||'',category:p.category_name||'',image:p.cover_url,slug:p.slug,url}));
  }
 }catch(e){warnings.push('Published articles could not be loaded ('+e.message+').');}
 try{
  const [galleries,images,videos]=await Promise.all([
   api('portfolio_galleries?select=id,slug,title,description,category,cover_image_id&visibility=eq.public&order=display_order.asc&limit=1000'),
   api('portfolio_images?select=id,gallery_id,image_url,display_order&visibility=eq.public&order=display_order.asc&limit=1000'),
   api('media_videos?select=gallery_id,youtube_id&visibility=eq.public&gallery_id=not.is.null&order=display_order.asc&limit=1000').catch(()=>[])
  ]);
  for(const g of galleries){
   if(!validSlug(g.slug))continue;
   const im=images.filter(x=>x.gallery_id===g.id);const pic=im.find(x=>x.id===g.cover_image_id)||im[0];
   const vid=videos.find(x=>x.gallery_id===g.id);
   const image=pic?.image_url||(vid?.youtube_id?'https://img.youtube.com/vi/'+encodeURIComponent(vid.youtube_id)+'/hqdefault.jpg':'');
   results.push(makeItem({kind:'gallery',folder:'galleries',title:g.title,metaTitle:g.title+' | LilKangooMedia Portfolio',description:g.description||'Photography and creative work by LilKangooMedia.',image,category:g.category,slug:g.slug,url:SITE+'/share/gallery/'+encodeURIComponent(g.slug),directUrl:SITE+'/portfolio.html#/gallery/'+encodeURIComponent(g.slug)}));
  }
 }catch(e){warnings.push('Portfolio galleries could not be loaded ('+e.message+').');}
 const seen=new Set();items=results.filter(x=>x&&!seen.has(x.url)&&(seen.add(x.url),true));
 render();
}
function folderCount(f){return items.filter(x=>x.folder===f).length;}
function groupName(f){return groups.find(x=>x.id===f)?.label||f;}
function matches(x){return !q||[x.title,x.metaTitle,x.description,x.slug,x.url,x.category,groupName(x.folder)].join(' ').toLocaleLowerCase().includes(q.toLocaleLowerCase());}
function visible(){return items.filter(x=>(filter==='all'||x.folder===filter)&&matches(x)).sort((a,b)=>a.title.localeCompare(b.title,'en'))}
function aside(){return `<aside class="admin-sidebar" aria-label="Admin navigation"><div class="admin-nav-label">MANAGEMENT</div>
<a href="/admin.html#services">▣ Services & pricing</a><a href="/admin.html#leads">▤ Enquiries & bookings</a>
<div class="admin-nav-label">CONTENT</div><a href="/admin.html#articles">▤ Articles & SEO</a><a href="/admin.html#galleries">▧ Portfolio & galleries</a><a href="/admin.html#media">▦ Media library</a><a href="/admin-reviews.html">★ Customer reviews</a>
<a href="/admin-links.html" class="active" aria-current="page">↗ Links library</a><div class="admin-nav-label">PREVIEW</div>
<a href="/" target="_blank" rel="noopener noreferrer">↗ Website</a><a href="/portfolio.html" target="_blank" rel="noopener noreferrer">↗ Portfolio</a>
<a href="#" data-action="signout">⇥ Sign out</a></aside>`;}
// Compact cards keep sharing actions visible while moving long SEO metadata into optional details.
function imageCard(item){
 if(item.kind==='page'||item.kind==='external'||!item.image){
  const symbol=item.kind==='external'?'↗':item.kind==='page'?item.title.charAt(0).toUpperCase():'◈';
  return `<div class="lkm-link-cover lkm-link-cover--symbol" aria-hidden="true"><span>${esc(symbol)}</span></div>`;
 }
 return `<div class="lkm-link-cover"><img src="${esc(item.image)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${LOGO}'"></div>`;
}
function shortPath(item){
 try{
  const u=new URL(item.url);
  return u.origin===SITE?(u.pathname+u.search+u.hash):(u.host+u.pathname+u.search);
 }catch{return item.slug||item.url;}
}
function card(x){
 const native=x.url!==x.directUrl;
 return `<article class="lkm-link-card" data-link-id="${esc(x.id)}">
  <div class="lkm-link-card-main">
   ${imageCard(x)}
   <div class="lkm-link-info">
    ${x.category?`<span class="lkm-link-category">${esc(x.category)}</span>`:''}
    <h3 title="${esc(x.title)}">${esc(x.title)}</h3>
    ${x.description?`<p class="lkm-link-desc">${esc(x.description)}</p>`:''}
    <div class="lkm-link-path" title="${esc(x.url)}">${esc(shortPath(x))}</div>
   </div>
  </div>
  <div class="lkm-link-actions">
   <button type="button" data-action="copy" data-id="${esc(x.id)}" class="button button-dark">Copy link</button>
   <button type="button" data-action="message" data-id="${esc(x.id)}" class="button button-light" title="Copy title, description and share link">Copy text</button>
   <a class="lkm-link-open" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${esc(x.title)} in a new tab" title="Open link">Open ↗</a>
  </div>
  <details class="lkm-link-details">
   <summary>SEO &amp; more</summary>
   <div class="lkm-link-details-body">
    <div class="lkm-detail-label">Page title</div><p>${esc(x.metaTitle)}</p>
    <div class="lkm-detail-label">Description</div><p>${esc(x.description||'Not provided')}</p>
    ${native?`<button type="button" data-action="direct" data-id="${esc(x.id)}" class="lkm-copy-direct">Copy direct page URL</button>`:''}
   </div>
  </details>
 </article>`;
}
function render(){
 const count=items.length,show=visible();
 root.innerHTML=`<div class="admin-shell lkm-links-shell">${aside()}<section class="admin-main lkm-links-main">
  <header class="lkm-links-top"><div class="lkm-links-headline"><h1>Links library</h1><span class="lkm-links-count" id="lkmLinkResultCount" aria-live="polite">${show.length} ${show.length===1?'link':'links'}</span></div>
   <button type="button" class="button button-light lkm-refresh" data-action="refresh" title="Reload current published links">↻ Refresh</button>
  </header>
  ${warnings.length?`<div class="lkm-links-warnings" role="status">${warnings.map(x=>`<p>${esc(x)}</p>`).join('')}</div>`:''}
  <div class="lkm-links-toolbar">
   <label class="lkm-sr-only" for="lkmLinkSearch">Search public links</label>
   <input id="lkmLinkSearch" type="search" placeholder="Find a page, service, gallery or article…" value="${esc(q)}" autocomplete="off" aria-label="Search links by name, keywords or URL">
   <button type="button" id="lkmLinkClear" class="button button-light" data-action="clear" title="Reset search and category" ${q||filter!=='all'?'':'hidden'}>Clear</button>
  </div>
  <div class="lkm-links-folderbar" role="group" aria-label="Filter links by category">
   <button type="button" class="lkm-folder ${filter==='all'?'is-active':''}" data-folder="all" aria-pressed="${filter==='all'}"><span>All</span><strong>${count}</strong></button>
   ${groups.map(g=>`<button type="button" class="lkm-folder ${filter===g.id?'is-active':''}" data-folder="${g.id}" aria-pressed="${filter===g.id}"><span>${esc(g.label)}</span><strong>${folderCount(g.id)}</strong></button>`).join('')}
  </div>
  <div id="lkmLinksResults">${results(show)}</div>
 </section></div>`;
}
function results(found){
 if(!found.length)return '<div class="lkm-links-empty">No matching links. Try a shorter search or select another category.</div>';
 const buckets=filter==='all'?groups.filter(g=>found.some(x=>x.folder===g.id)):groups.filter(g=>g.id===filter);
 return buckets.map(g=>{
  const list=found.filter(x=>x.folder===g.id);
  // The selected category chip already names the section; avoid repeating it.
  return `<section class="lkm-links-section" id="links-folder-${esc(g.id)}">${filter==='all'?`<h2 class="lkm-links-section-head">${esc(g.label)}</h2>`:''}<div class="lkm-links-grid">${list.map(card).join('')}</div></section>`;
 }).join('');
}
function updateResults(){
 const f=visible(),zone=root.querySelector('#lkmLinksResults');
 if(zone)zone.innerHTML=results(f);
 const n=root.querySelector('#lkmLinkResultCount');if(n)n.textContent=f.length+' '+(f.length===1?'link':'links');
 const clear=root.querySelector('#lkmLinkClear');if(clear)clear.hidden=!q&&filter==='all';
}
function notice(v){let t=document.getElementById('toast');if(!t)return;t.hidden=false;t.textContent=v;clearTimeout(t._timer);t._timer=setTimeout(()=>t.hidden=true,4000);}
async function copy(value){
 try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(value);notice('Copied to clipboard.');return;}}
 catch(e){/* fallback below */}
 const input=document.createElement('textarea');input.value=value;input.readOnly=true;input.setAttribute('aria-hidden','true');input.style.cssText='position:fixed;top:-9999px;left:-9999px;';document.body.append(input);input.select();let okay=false;try{okay=document.execCommand('copy');}catch(e){}input.remove();
 if(okay)notice('Copied to clipboard.');else notice('Copy was blocked by the browser. Open the link and copy its address.');
}
function loginForm(error=''){
 root.innerHTML=`<div class="admin-auth"><img src="/assets/lkm-v3/brand/logo-profile.png" alt="LilKangooMedia" width="90" height="90" style="display:block;margin:0 auto 15px"><h1>Links library</h1><p>Sign in with your existing administrator account to view all public website links.</p><form id="lkmLinksLogin"><div class="field"><label>Email address<input name="email" type="email" required autocomplete="username"></label></div><div class="field"><label>Password<input name="password" type="password" required autocomplete="current-password"></label></div><button type="submit" class="button button-dark">Sign in securely</button></form><p role="alert" id="lkmLinksLoginError">${esc(error)}</p></div>`;
}
root.addEventListener('input',e=>{if(e.target.id==='lkmLinkSearch'){q=e.target.value.trim();updateResults();}});
root.addEventListener('click',async e=>{
 const folder=e.target.closest('[data-folder]');if(folder){filter=folder.dataset.folder;render();root.querySelector('#lkmLinkSearch')?.focus();return;}
 const btn=e.target.closest('[data-action]');if(!btn)return;
 const action=btn.dataset.action;
 if(action==='clear'){q='';filter='all';render();return;}
 if(action==='refresh'){btn.disabled=true;btn.textContent='Refreshing…';await loadAll();notice('Links refreshed.');return;}
 if(action==='signout'){e.preventDefault();store.logout();location.href='/admin.html';return;}
 const item=items.find(x=>x.id===btn.dataset.id);if(!item)return;
 if(action==='copy')await copy(item.url);
 if(action==='direct')await copy(item.directUrl);
 if(action==='message')await copy([item.title,item.description,item.url].filter(Boolean).join('\n\n'));
});
root.addEventListener('submit',async e=>{
 if(e.target.id!=='lkmLinksLogin')return;e.preventDefault();const btn=e.target.querySelector('button[type=submit]');btn.disabled=true;
 const data=new FormData(e.target);
 try{await store.login(data.get('email'),data.get('password'));if(!(await store.isAdmin())){store.logout();throw Error('This account does not have administrator access.');}await loadAll();}
 catch(err){loginForm(err.message)}finally{btn.disabled=false;}
});
(async()=>{
 if(!store){root.textContent='Links library unavailable: LKMStore is missing.';return;}
 if(!store.configured){await loadAll();warnings.push('Preview mode: service catalog comes from the local seed, and CMS categories may not be available.');render();return;}
 try{if(store.getSession()&&await store.isAdmin()){await loadAll();return;}}catch(e){console.warn('Links session error:',e)}
 loginForm();
})();
})();
