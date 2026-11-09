(()=>{
'use strict';
const root=document.getElementById('cmsPublic');const page=document.body.dataset.cmsPage;
const cfg=window.LKM_CONFIG||{};
const base=String(cfg.SUPABASE_URL||'').replace(/\/$/,'');const key=cfg.SUPABASE_ANON_KEY||'';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeImage=u=>/^(https:\/\/[^\s]+|\/assets\/[a-zA-Z0-9%._/-]+)$/.test(u||'')?u:'';
const api=async(path)=>{const res=await fetch(base+'/rest/v1/'+path,{headers:{apikey:key,'Content-Type':'application/json'}});if(!res.ok)throw Error('The content catalog is temporarily unavailable.');return res.json()};
let analyticsEnabled=false;
function analytics(){if(analyticsEnabled)return;analyticsEnabled=true;window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};window.gtag('js',new Date());window.gtag('config','G-VB93M2KSMX',{send_page_view:false});const sc=document.createElement('script');sc.async=true;sc.src='https://www.googletagmanager.com/gtag/js?id=G-VB93M2KSMX';document.head.appendChild(sc);}
function pageView(){if(analyticsEnabled&&window.gtag)window.gtag('event','page_view',{page_path:location.pathname+location.hash,page_title:document.title})}
function privacy(){let pref='';try{pref=localStorage.getItem('lkm_analytics_consent')||''}catch(e){}let bar=document.getElementById('cmsCookie');if(pref==='yes'){analytics();return}if(pref!=='no')bar.hidden=false;for(const [id,allowed] of [['cmsYesAnalytics',true],['cmsNoAnalytics',false]])document.getElementById(id).addEventListener('click',()=>{try{localStorage.setItem('lkm_analytics_consent',allowed?'yes':'no')}catch(e){}bar.hidden=true;if(allowed){analytics();pageView()}})}
privacy();
const filterButton=(name,active)=>`<button type="button" data-filter="${esc(name)}" aria-pressed="${active===name}">${esc(name)}</button>`;
const hero=(kicker,title,intro)=>`<div class="cms-pub-eyebrow">${esc(kicker)}</div><h1 class="cms-pub-title">${esc(title)}</h1><p class="cms-pub-intro">${esc(intro)}</p>`;
const img=(url,alt,cl='')=>safeImage(url)?`<img class="${cl}" src="${esc(url)}" alt="${esc(alt)}" loading="lazy">`:'';
let posts=[],categories=[],galleries=[],images=[],videos=[],filter='All';
const videoThumb=id=>'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg';
function safeArticleMarkup(input){
 const parsed=new DOMParser().parseFromString(String(input||''),'text/html');
 const allowed=new Set(['H1','H2','H3','H4','P','BR','STRONG','B','EM','I','U','UL','OL','LI','A','BLOCKQUOTE','IMG','FIGURE','FIGCAPTION','HR','PRE','CODE']);
 const destructive=new Set(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','FORM','SVG','MATH','VIDEO','AUDIO','TEMPLATE']);
 function walk(node){
 for(const c of Array.from(node.childNodes)){
 if(c.nodeType===8){c.remove();continue}
 if(c.nodeType!==1){if(c.nodeType!==3)c.remove();continue}
 const tag=c.tagName;
 if(destructive.has(tag)){c.remove();continue}
 if(!allowed.has(tag)){walk(c);c.replaceWith(...Array.from(c.childNodes));continue}
 for(const a of Array.from(c.attributes))c.removeAttribute(a.name);
 if(tag==='A'){
  const raw=c.getAttribute('href')||''; // captured below via original element data
 }
 walk(c);
 }
 }
 // Parse again so we retain only selected safe attributes from original nodes.
 function sanitize(n){for(const c of Array.from(n.childNodes)){
 if(c.nodeType===8){c.remove();continue}if(c.nodeType!==1){if(c.nodeType!==3)c.remove();continue}
 const tag=c.tagName;
 if(destructive.has(tag)){c.remove();continue}
 const href=c.getAttribute('href');const src=c.getAttribute('src');const alt=c.getAttribute('alt')||'';
 if(!allowed.has(tag)){sanitize(c);c.replaceWith(...Array.from(c.childNodes));continue}
 for(const a of Array.from(c.attributes))c.removeAttribute(a.name);
 if(tag==='A'){if(href&&(/^(https?:\/\/|mailto:|\/|#)/i.test(href)))c.setAttribute('href',href);c.setAttribute('rel','noopener noreferrer');}
 if(tag==='IMG'){if(safeImage(src)){c.setAttribute('src',src);c.setAttribute('alt',alt);c.setAttribute('loading','lazy')}else{c.remove();continue}}
 sanitize(c);
 }}
 sanitize(parsed.body);return parsed.body.innerHTML;
}
const cats=()=>['All',...new Set(galleries.map(g=>g.category||'Other'))];
const postCats=()=>['All',...new Set(posts.map(p=>p.category_name||categories.find(c=>c.id===p.category_id)?.name||'Articles'))];
const galleryItem=g=>{
 const match=images.filter(i=>i.gallery_id===g.id),clips=videos.filter(v=>v.gallery_id===g.id);
 const cover=match.find(i=>i.id===g.cover_image_id)||match[0];
 const preview=cover?img(cover.image_url,cover.alt_text||g.title):clips.length?img(videoThumb(clips[0].youtube_id),clips[0].title):'';
 const count=match.length+clips.length;
 return `<a href="#/gallery/${encodeURIComponent(g.slug)}" class="cms-pub-card">${preview}<div class="cms-pub-copy"><small>${esc(g.category)}</small><h2>${esc(g.title)}</h2><p>${esc(g.description)}</p><p>${count} item${count===1?'':'s'}${clips.length?' · '+clips.length+' video'+(clips.length>1?'s':''):''}</p></div></a>`;
};
function galleryList(){const visible=galleries.filter(g=>filter==='All'||g.category===filter);document.title='Photography & Video Portfolio | LilKangooMedia';root.innerHTML=hero('Selected photography & films','Our portfolio','Explore photography, film and design projects, organized by subject and creative discipline.')+`<div class="cms-pub-chips">${cats().map(c=>filterButton(c,filter)).join('')}</div>`+(visible.length?`<div class="cms-pub-grid">${visible.map(galleryItem).join('')}</div>`:'<div class="cms-pub-empty">No galleries are currently available in this category. Explore another collection or contact us about a project.</div>');}
const galleryAliases={'legacy-portraits':'portraits','legacy-nature':'nature-photography','legacy-products':'product-jewellery-photography','legacy-graphic-design':'graphic-design','legacy-igori-gabrysia':'igor-gabrysia'};
function galleryDetail(slug){
 const requested=galleryAliases[slug]||slug;
 let g=galleries.find(g=>g.slug===requested)||galleries.find(g=>g.slug===slug)||galleries.find(g=>galleryAliases[g.slug]===requested);
 if(!g){galleryList();return}
 const items=[...images.filter(i=>i.gallery_id===g.id).map(i=>({...i,kind:'photo'})),...videos.filter(v=>v.gallery_id===g.id).map(v=>({...v,kind:'video'}))].sort((a,b)=>(a.display_order||100)-(b.display_order||100));
 document.title=g.title+' | LilKangooMedia Portfolio';
 root.innerHTML=`<div class="cms-pub-breadcrumb"><a href="#/">← All galleries</a> / ${esc(g.category)}</div>`+hero(g.category,g.title,g.description||'Photography and creative work by LilKangooMedia.')+`<div class="cms-gallery-grid">${items.map(i=>i.kind==='video'?`<figure class="lkm-gallery-video-thumb" data-video-id="${esc(i.youtube_id)}"><img loading="lazy" src="${videoThumb(i.youtube_id)}" alt="${esc(i.title||'Watch video')}"><span class="lkm-video-play" aria-hidden="true">▶</span><figcaption>${esc(i.title)}</figcaption></figure>`:`<figure>${img(i.image_url,i.alt_text||g.title)}${i.caption?.trim()?`<figcaption>${esc(i.caption)}</figcaption>`:''}</figure>`).join('')}</div>`;
}
const postCard=p=>{const c=categories.find(c=>c.id===p.category_id);const url=p.permalink||p.legacy_path||'/articles/'+encodeURIComponent(p.slug)+'.html';return `<a href="${esc(url)}" class="cms-pub-card">${img(p.cover_url,p.cover_alt||p.title)}<div class="cms-pub-copy"><small>${esc(p.category_name||c?.name||'Articles')}</small><h2>${esc(p.title)}</h2><p>${esc(p.excerpt)}</p></div></a>`};
function postList(){const items=posts.filter(p=>filter==='All'||(p.category_name||categories.find(c=>c.id===p.category_id)?.name)===filter);document.title='Articles | LilKangooMedia';root.innerHTML=hero('Creative ideas and Cyprus guides','Articles & inspiration','Photography education, practical business content and Cyprus travel guides from LilKangooMedia.')+`<div class="cms-pub-chips">${postCats().map(c=>filterButton(c,filter)).join('')}</div>`+(items.length?`<div class="cms-pub-grid">${items.map(postCard).join('')}</div>`:'<div class="cms-pub-empty">Explore our photography guides and Cyprus travel articles. <a href="/Education.html">Photography guides</a> · <a href="/articlesaboutcyprus.html">Cyprus articles</a>.</div>');}
function postDetail(slug){const p=posts.find(x=>x.slug===slug);if(!p){postList();return}if(!p.body_html){window.location.replace(p.permalink||p.legacy_path||'/articles/'+encodeURIComponent(p.slug)+'.html');return}const c=categories.find(c=>c.id===p.category_id);document.title=(p.seo_title||p.title)+' | LilKangooMedia';root.innerHTML=`<div class="cms-article"><div class="cms-pub-breadcrumb"><a href="#/">← All articles</a> / ${esc(c?.name||'Articles')}</div>${hero(c?.name||'Article',p.title,p.excerpt||'')}${img(p.cover_url,p.cover_alt||p.title,'cms-article-hero')}<article class="cms-article-body">${safeArticleMarkup(p.body_html)}</article></div>`;}
function render(){let hash=decodeURIComponent(location.hash||'#/');let match=hash.match(/^#\/(post|gallery)\/([^?#]+)/);if(match){if(page==='blog'&&match[1]==='post')postDetail(match[2]);else if(page==='portfolio'&&match[1]==='gallery')galleryDetail(match[2]);else page==='blog'?postList():galleryList();}else page==='blog'?postList():galleryList();window.scrollTo(0,0);pageView()}
// Accessible gallery viewer: arrows, keyboard, touch swipe, thumbnail counter and close.
let activeLightbox=null;
function closeLightbox(){
 if(!activeLightbox)return;
 const {element,trigger,onKey}=activeLightbox;
 window.removeEventListener('keydown',onKey);
 document.body.style.overflow=activeLightbox.originalOverflow;
 element.remove();activeLightbox=null;
 trigger?.focus({preventScroll:true});
}
function openLightbox(clicked){
 closeLightbox();
 const all=Array.from(root.querySelectorAll('.cms-gallery-grid figure')).map(f=>({
  src:f.querySelector('img')?.currentSrc||f.querySelector('img')?.src,
  alt:f.querySelector('img')?.alt||'',caption:f.querySelector('figcaption')?.textContent?.trim()||'',
  trigger:f.querySelector('img'),videoId:f.dataset.videoId||''
 })).filter(p=>p.src);
 if(!all.length)return;
 let position=Math.max(0,all.findIndex(p=>p.trigger===clicked));
 const container=document.createElement('div');container.className='cms-lightbox';
 container.setAttribute('role','dialog');container.setAttribute('aria-modal','true');container.setAttribute('aria-label','Photo and video gallery viewer');
 container.innerHTML=`<button type="button" class="cms-lightbox-close" data-lightbox="close" aria-label="Close viewer">×</button><button type="button" class="cms-lightbox-nav cms-lightbox-prev" data-lightbox="prev" aria-label="Previous item">‹</button><figure class="cms-lightbox-figure"><img alt=""><iframe title="Video player" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" hidden></iframe><figcaption class="cms-lightbox-caption"></figcaption><a class="lkm-youtube-link" href="#" target="_blank" rel="noopener noreferrer" hidden>Watch on YouTube</a></figure><button type="button" class="cms-lightbox-nav cms-lightbox-next" data-lightbox="next" aria-label="Next item">›</button><span class="cms-lightbox-count" role="status" aria-live="polite"></span>`;
 const picture=container.querySelector('img'),frame=container.querySelector('iframe'),caption=container.querySelector('.cms-lightbox-caption'),link=container.querySelector('.lkm-youtube-link');
 const setPosition=i=>{
  position=(i+all.length)%all.length;const x=all[position];
  frame.removeAttribute('src');picture.removeAttribute('src');
  if(x.videoId){picture.hidden=true;frame.hidden=false;frame.src='https://www.youtube-nocookie.com/embed/'+x.videoId+'?autoplay=1&playsinline=1&rel=0';link.href='https://www.youtube.com/watch?v='+x.videoId;link.hidden=false}
  else{picture.hidden=false;frame.hidden=true;picture.src=x.src;picture.alt=x.alt;link.hidden=true}
  caption.textContent=x.caption||x.alt;container.querySelector('.cms-lightbox-count').textContent=`${position+1} / ${all.length}`;
  if(!x.videoId)[all[(position+1)%all.length],all[(position-1+all.length)%all.length]].forEach(v=>{if(!v.videoId){const p=new Image();p.src=v.src}});
 };
 const onKey=e=>{if(e.key==='Escape'){e.preventDefault();closeLightbox()}if(e.key==='ArrowRight'){e.preventDefault();setPosition(position+1)}if(e.key==='ArrowLeft'){e.preventDefault();setPosition(position-1)}};
 let touchStart=0;
 container.addEventListener('touchstart',e=>{touchStart=e.changedTouches[0]?.screenX||0},{passive:true});
 container.addEventListener('touchend',e=>{const d=(e.changedTouches[0]?.screenX||0)-touchStart;if(Math.abs(d)>55)setPosition(position+(d<0?1:-1))},{passive:true});
 container.addEventListener('click',e=>{const action=e.target.closest('[data-lightbox]')?.dataset.lightbox;if(action==='close'||e.target===container){closeLightbox();return}if(action==='prev')setPosition(position-1);if(action==='next')setPosition(position+1)});
 activeLightbox={element:container,trigger:clicked,onKey,originalOverflow:document.body.style.overflow};
 document.body.appendChild(container);document.body.style.overflow='hidden';window.addEventListener('keydown',onKey);
 setPosition(position);container.querySelector('.cms-lightbox-close').focus({preventScroll:true});
}
root.addEventListener('click',e=>{
 const btn=e.target.closest('[data-filter]');
 if(btn){filter=btn.dataset.filter;page==='blog'?postList():galleryList();return}
 const photo=e.target.closest('.cms-gallery-grid img');if(photo)openLightbox(photo);
});
window.addEventListener('hashchange',()=>{closeLightbox();render()});
// Article index is rendered at Netlify build time, so it remains browsable
// and crawlable even when Supabase has a temporary connectivity problem.
(async()=>{try{if(page==='blog'){
 const [listing,cats]=await Promise.all([
  fetch('/assets/lkm-v3/articles-index.json',{cache:'no-store'}).then(r=>r.ok?r.json():{posts:[]}).catch(()=>({posts:[]})),
  base&&key?api('blog_categories?select=*&order=sort_order.asc&limit=1000').catch(()=>[]):Promise.resolve([])
 ]);
 categories=cats;
 posts=Array.isArray(listing.posts)?listing.posts:[];
 if(!posts.length&&base&&key){
   const published=await api('blog_posts?select=*&status=eq.published&published_at=lte.'+encodeURIComponent(new Date().toISOString())+'&order=published_at.desc&limit=1000');
   posts=published.map(p=>({...p,category_name:categories.find(c=>c.id===p.category_id)?.name||'Articles',permalink:p.legacy_path||'/articles/'+p.slug+'.html'}));
 }
 }else{
  if(!base||!key)throw new Error('Supabase is not configured.');
  [galleries,images,videos]=await Promise.all([api('portfolio_galleries?select=*&visibility=eq.public&order=display_order.asc&limit=1000'),api('portfolio_images?select=*&visibility=eq.public&order=display_order.asc&limit=1000'),api('media_videos?select=*&visibility=eq.public&gallery_id=not.is.null&order=display_order.asc&limit=1000').catch(()=>[])]);
 }
 render();
}catch(err){root.innerHTML='<div class="cms-pub-empty">The content list is temporarily unavailable. Please try again later.</div>';console.warn(err)}})();
})();
