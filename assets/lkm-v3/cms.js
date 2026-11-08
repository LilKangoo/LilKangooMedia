(()=>{
'use strict';
const root=document.getElementById('cmsRoot');
const embedded=root?.dataset.embedded==='1';
const store=window.LKMStore;
const cfg=window.LKM_CONFIG||{};
const host=String(cfg.SUPABASE_URL||'').replace(/\/$/,'');
const key=cfg.SUPABASE_ANON_KEY||'';
const state={tab:'posts',posts:[],categories:[],galleries:[],images:[],services:[],selectedPost:null,selectedGallery:null,editingPhoto:null,newPost:false,newGallery:false};
const media={loaded:false,loading:false,error:'',items:[],query:'',category:'All',page:0,pageSize:36,partial:false};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slugify=v=>String(v||'').toLowerCase().trim().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,100);
const safePath=v=>/^\/[a-zA-Z0-9._%+~-]+\.html$/.test(v);
const toast=msg=>{const t=document.getElementById('cmsToast');t.textContent=msg;t.hidden=false;clearTimeout(t._timer);t._timer=setTimeout(()=>t.hidden=true,5000)};
const btn=(txt,action,cls='')=>`<button type="button" class="cms-btn ${cls}" data-action="${action}">${txt}</button>`;
const field=(label,id,val='',type='text')=>`<div class="cms-field"><label for="${id}">${esc(label)}</label><input id="${id}" type="${type}" value="${esc(val)}"></div>`;
const select=(label,id,options,val)=>`<div class="cms-field"><label for="${id}">${esc(label)}</label><select id="${id}">${options.map(o=>`<option value="${esc(o[0])}" ${String(o[0])===String(val)?'selected':''}>${esc(o[1])}</option>`).join('')}</select></div>`;
const area=(label,id,val='',rows=5)=>`<div class="cms-field"><label for="${id}">${esc(label)}</label><textarea id="${id}" rows="${rows}">${esc(val)}</textarea></div>`;
const value=id=>(root.querySelector('#'+id)?.value||'').trim();
const selection=id=>root.querySelector('#'+id)?.value||'';
const api=async(path,{method='GET',data,headers={}}={})=>{
 const token=await store.authenticatedToken();
 const res=await fetch(host+'/rest/v1/'+path,{method,headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json',Prefer:'return=representation',...headers},body:data===undefined?undefined:JSON.stringify(data)});
 if(!res.ok){const raw=await res.text();throw new Error('Database '+res.status+': '+raw.slice(0,260))}
 const raw=await res.text();return raw?JSON.parse(raw):[];
};
const refresh=async()=>{
 [state.categories,state.posts,state.galleries,state.services]=await Promise.all([
 api('blog_categories?select=*&order=sort_order.asc&limit=1000'),
 api('blog_posts?select=*&order=updated_at.desc&limit=1000'),
 api('portfolio_galleries?select=*&order=display_order.asc&limit=1000'),
 api('services?select=slug,title&order=title.asc&limit=1000')
 ]);
 if(state.selectedGallery&&!state.galleries.find(g=>g.id===state.selectedGallery))state.selectedGallery=null;
 if(state.selectedPost&&!state.posts.find(p=>p.id===state.selectedPost))state.selectedPost=null;
 state.images=state.selectedGallery?await api('portfolio_images?select=*&gallery_id=eq.'+encodeURIComponent(state.selectedGallery)+'&order=display_order.asc&limit=1000'):[];
 render();
};
function login(){root.innerHTML=`<div class="cms-login cms-panel"><img src="/assets/lkm-v3/brand/logo-black-orange.png" width="74" height="74" alt="LilKangooMedia"><h1>Content administrator</h1><p class="cms-muted">Sign in using an approved Supabase administrator account.</p><form id="cmsSignIn">${field('Email address','cmsEmail','','email')}${field('Password','cmsPassword','','password')}<button class="cms-btn" type="submit" style="width:100%">Sign in</button><p id="cmsAuthError" class="cms-error" role="alert"></p></form></div>`}
function shell(content){
 if(embedded){root.innerHTML=`<div class="cms-embedded-toolbar">${btn('Refresh','refresh','secondary')}</div>${content}`;return}
 root.innerHTML=`<div class="cms-heading"><div><p class="cms-muted" style="font-weight:700;letter-spacing:1px">LILKANGOOMEDIA / CMS</p><h1>Content Management</h1><p>Manage articles and approved portfolio galleries without changing code.</p></div><div>${btn('Refresh','refresh','secondary')} ${btn('Sign out','logout','secondary')}</div></div><div class="cms-layout"><nav class="cms-tabs" aria-label="Content sections"><button data-tab="posts" aria-selected="${state.tab==='posts'}">Articles</button><button data-tab="galleries" aria-selected="${state.tab==='galleries'}">Galleries</button><button data-tab="media" aria-selected="${state.tab==='media'}">Media library</button><a href="/admin.html">Services & prices ↗</a><a href="/blog.html">View blog ↗</a><a href="/portfolio.html">View portfolio ↗</a></nav><section>${content}</section></div>`;
}
function postEditor(){const p=state.newPost?{}:state.posts.find(x=>x.id===state.selectedPost)||{};
 return `<div class="cms-panel"><h2>${state.newPost?'Create article':p.id?'Edit article':'Choose an article'}</h2><div class="cms-note">SEO safeguard: use the original URL for legacy imported content. Existing HTML pages remain unchanged until a verified migration. Only publish material you have reviewed.</div>
 ${field('Title *','postTitle',p.title||'')}
 <div class="cms-fields2">${field('Slug *','postSlug',p.slug||'')}${select('Category','postCategory',[['','Uncategorized'],...state.categories.map(c=>[c.id,c.name])],p.category_id||'')}</div>
 ${select('Status','postStatus',[['draft','Draft'],['review','Review'],['published','Published'],['archived','Archived']],p.status||'draft')}
 ${area('Short excerpt','postExcerpt',p.excerpt||'',3)}
 ${area('Article HTML (headings, paragraphs, images, links)','postBody',p.body_html||'',12)}
 <div class="cms-fields2">${field('Cover image URL','postCover',p.cover_url||'')}${field('Cover image alt text','postCoverAlt',p.cover_alt||'')}</div>
 ${field('SEO title','postSeoTitle',p.seo_title||'')}
 ${area('SEO description','postSeoDesc',p.seo_description||'',2)}
 ${field('Canonical URL (leave empty for new post)','postCanonical',p.canonical_url||'')}
 ${field('Original legacy path, e.g. /article.html','postLegacy',p.legacy_path||'')}
 <div class="cms-actions">${btn(state.newPost?'Create draft/article':'Save article','save-post')}${btn('Cancel','cancel-post','secondary')}</div><p class="cms-muted">Publishing to Supabase makes the record publicly readable. Search-friendly static pages require the separate Netlify blog generation step.</p></div>`;
}
function postsView(){return `<div class="cms-heading"><div><h2>Articles & SEO</h2><p>Existing Photo Education and Cyprus articles can be imported with their original metadata.</p></div>${btn('+ New article','new-post')}</div><div class="cms-grid"><div class="cms-panel"><p class="cms-muted">${state.posts.length} records · unpublished drafts are hidden from visitors</p><div class="cms-list">${state.posts.length?state.posts.map(p=>`<button class="cms-item" data-post="${p.id}" aria-current="${state.selectedPost===p.id&&!state.newPost}"><span><strong>${esc(p.title)}</strong><small>${esc(p.slug)} · ${esc(p.status)}</small></span></button>`).join(''):'<div class="cms-empty">No articles imported yet. Create a draft or run the legacy import workflow.</div>'}</div></div>${postEditor()}</div>`}
const galleryEditor=()=>{const g=state.newGallery?{}:state.galleries.find(g=>g.id===state.selectedGallery)||{};
return `<div class="cms-panel"><h2>${state.newGallery?'Create a gallery':g.id?'Gallery settings':'Select a gallery'}</h2><div class="cms-note">All imported client galleries and images remain under review until you explicitly approve them. Database visibility does not make an already-public legacy file private.</div>${field('Gallery title *','galTitle',g.title||'')}<div class="cms-fields2">${field('Slug *','galSlug',g.slug||'')}${select('Visibility','galVisibility',[['review','Review (hidden)'],['private','Private (hidden)'],['public','Public']],g.visibility||'review')}</div>${field('Category','galCategory',g.category||'Photography')}${area('Description','galDesc',g.description||'',3)}${field('Client or project name (optional)','galClient',g.client_name||'')}${select('Related service','galService',[['','None'],...state.services.map(s=>[s.slug,s.title])],g.related_service_slug||'')}${field('Display order','galOrder',g.display_order??100,'number')}<div class="cms-actions">${btn(state.newGallery?'Create gallery':'Save gallery','save-gallery')}${btn('Cancel','cancel-gallery','secondary')}</div></div>`;};
function photoEditor(){const g=state.galleries.find(x=>x.id===state.selectedGallery);if(!g||state.newGallery)return '';
 const f=state.images.find(i=>i.id===state.editingPhoto)||{};
 return `<div class="cms-panel" style="margin-top:16px"><h3>Photos · ${esc(g.title)}</h3><p class="cms-muted">Only public photos in a public gallery appear on the website. You can use an existing legacy image URL without moving the file.</p>
 <div class="cms-fields2">${field('Image URL *','photoUrl',f.image_url||'')}${select('Visibility','photoVisibility',[['review','Review (hidden)'],['private','Private (hidden)'],['public','Public']],f.visibility||'review')}</div>
 <div class="cms-fields2">${field('Alt text','photoAlt',f.alt_text||'')}${field('Original file path (optional)','photoPath',f.original_path||'')}</div>${field('Caption','photoCaption',f.caption||'')}${field('Display order','photoOrder',f.display_order??100,'number')}
 <div class="cms-actions">${btn(f.id?'Save photograph':'Add photograph','save-photo')}${btn('Clear form','clear-photo','secondary')}</div>
 <div class="cms-field"><label for="cmsMediaUpload">Upload a photograph (JPG / PNG / WebP, up to 8 MB)</label><input id="cmsMediaUpload" type="file" accept="image/jpeg,image/png,image/webp" style="padding:10px">${btn('Upload to portfolio Storage','upload-photo','secondary')}</div>
 <div class="cms-photo-grid">${state.images.map(im=>`<button class="cms-photo" type="button" data-photo="${im.id}" style="text-align:left;cursor:pointer"><img src="${esc(im.image_url)}" alt="${esc(im.alt_text)}" loading="lazy"><small>${esc(im.alt_text||im.image_url.split('/').pop())}</small><span class="cms-status">${esc(im.visibility)}</span></button>`).join('')}</div>${!state.images.length?'<div class="cms-empty">No photographs added to this gallery yet.</div>':''}</div>`;
}
function galleriesView(){return `<div class="cms-heading"><div><h2>Portfolio & galleries</h2><p>Organize the full photo library by project, category, and service.</p></div>${btn('+ New gallery','new-gallery')}</div><div class="cms-grid"><div class="cms-panel"><p class="cms-muted">${state.galleries.length} galleries · imported items require approval</p><div class="cms-list">${state.galleries.map(g=>`<button class="cms-item" data-gallery="${g.id}" aria-current="${state.selectedGallery===g.id&&!state.newGallery}"><span><strong>${esc(g.title)}</strong><small>${esc(g.category)} · ${esc(g.visibility)}</small></span></button>`).join('')||'<div class="cms-empty">Create your first gallery or import existing files.</div>'}</div></div><div>${galleryEditor()}${photoEditor()}</div></div>`;}
// Read-only catalog of original GitHub files. No file gets published automatically.
async function loadMedia(force=false){
 if(media.loading||(!force&&media.loaded))return;
 media.loading=true;media.error='';render();
 try{
   const response=await fetch('/api/media-catalog',{headers:{Accept:'application/json'}});
   const data=await response.json().catch(()=>({}));
   if(!response.ok||!Array.isArray(data.images))throw new Error(data.error||'Could not load the source image catalog.');
   media.items=data.images;
   media.partial=Boolean(data.partial);
   media.loaded=true;
 }catch(e){media.error=e.message||'Catalog unavailable';}
 finally{media.loading=false;render();}
}
function visibleMedia(){
 const term=media.query.toLowerCase();
 return media.items.filter(x=>(media.category==='All'||x.suggested_category===media.category)&&(!term||x.path.toLowerCase().includes(term)));
}
function mediaCardsHtml(){
 if(media.loading)return '<div class="cms-empty">Loading original photos from GitHub…</div>';
 if(media.error)return `<div class="cms-note">${esc(media.error)}. Use Refresh to try again. The original photos have not been changed.</div>`;
 if(!media.loaded)return '<div class="cms-empty">Select Refresh to load the media catalog.</div>';
 const items=visibleMedia();const pages=Math.max(1,Math.ceil(items.length/media.pageSize));media.page=Math.min(media.page,pages-1);
 const display=items.slice(media.page*media.pageSize,(media.page+1)*media.pageSize);
 const body=display.map(x=>`<article class="lkm-media-card"><img loading="lazy" src="${esc(x.url)}" alt="${esc(x.file)}" onerror="this.style.opacity='.2'"/><div class="lkm-media-info"><strong title="${esc(x.path)}">${esc(x.file)}</strong><span>Suggested: ${esc(x.suggested_category)}</span><button type="button" data-media-add="${esc(x.path)}" class="cms-btn" aria-label="Add ${esc(x.file)} to the chosen gallery for review">Add to gallery (review)</button></div></article>`).join('');
 return `<div class="lkm-media-grid">${body||'<p class="cms-empty">No photos match these filters.</p>'}</div><div class="lkm-media-pager"><span>Showing ${items.length?media.page*media.pageSize+1:0}–${Math.min((media.page+1)*media.pageSize,items.length)} of ${items.length}</span><button class="cms-btn secondary" data-media-page="-1" ${media.page<=0?'disabled':''}>← Previous</button><span>Page ${media.page+1} / ${pages}</span><button class="cms-btn secondary" data-media-page="1" ${media.page>=pages-1?'disabled':''}>Next →</button></div>`;
}
function mediaView(){
 const categories=[...new Set(media.items.map(x=>x.suggested_category))].sort();
 return `<div class="cms-heading"><div><h2>Media Library</h2><p>Browse all image files from the original GitHub repository and assign selected work to a gallery.</p></div>${btn('Reload catalog','reload-media','secondary')}</div><div class="cms-note">Existing image files remain on your website. Category labels are <b>automatic suggestions</b> based on filenames, not verified classifications. Assign images to a gallery as <b>Review (hidden)</b>; approve them individually before public display. Do not add private client work without permission.</div>
 <div class="lkm-media-controls"><div class="cms-field"><label for="mediaSearch">Search filename</label><input id="mediaSearch" placeholder="Search photos…" value="${esc(media.query)}"></div><div class="cms-field"><label for="mediaCategory">Suggested category</label><select id="mediaCategory"><option value="All">All categories</option>${categories.map(c=>`<option ${media.category===c?'selected':''}>${esc(c)}</option>`).join('')}</select></div><div class="cms-field"><label for="mediaTargetGallery">Add selected image to gallery</label><select id="mediaTargetGallery"><option value="">Choose gallery...</option>${state.galleries.map(g=>`<option value="${esc(g.id)}">${esc(g.title)} · ${esc(g.visibility)}</option>`).join('')}</select></div></div>
 <div class="cms-muted">${media.items.length} original image files indexed.${media.partial?' GitHub returned an incomplete list — more work needed for full import.':''} No images are imported or published automatically.</div>
 <div id="lkmMediaResults">${mediaCardsHtml()}</div>`;
}
function updateMediaResults(){const area=root.querySelector('#lkmMediaResults');if(area)area.innerHTML=mediaCardsHtml()}
async function addLegacyPhoto(path){
 const target=selection('mediaTargetGallery');if(!target)throw new Error('Choose a target gallery first. Create a gallery under Portfolio & galleries if needed.');
 const file=media.items.find(x=>x.path===path);if(!file)throw new Error('Unknown image file.');
 const old=await api('portfolio_images?select=id&original_path=eq.'+encodeURIComponent(file.path)+'&limit=1');
 if(old?.length)throw new Error('This image is already assigned to a gallery.');
 await api('portfolio_images',{method:'POST',data:{gallery_id:target,image_url:file.url,original_path:file.path,alt_text:file.file.replace(/\.[^.]+$/,'').replace(/[-_]/g,' ').slice(0,150),caption:'',visibility:'review',display_order:100}});
 toast('Photograph added to gallery as REVIEW. Not visible publicly until approved.');
}

function render(){shell(state.tab==='posts'?postsView():state.tab==='media'?mediaView():galleriesView());}
const requireSlug=slug=>{if(!/^[a-z0-9-]{1,100}$/.test(slug))throw new Error('Slug must contain lowercase letters, numbers and dashes only.')};
const requireImage=url=>{if(!url||!(/^(https:\/\/[^\s]+|\/assets\/[a-zA-Z0-9%._/-]+)$/.test(url)))throw new Error('Use an HTTPS image URL or /assets/ path.')};
async function savePost(){const title=value('postTitle'),slug=slugify(value('postSlug')||title),status=selection('postStatus');if(!title)throw new Error('Article title required.');requireSlug(slug);
 const legacy=value('postLegacy');if(legacy&&!safePath(legacy))throw new Error('Legacy path must look like /original-filename.html');
 let cat=selection('postCategory'),publishedAt=null;
 const prev=state.posts.find(p=>p.id===state.selectedPost);
 if(status==='published')publishedAt=(prev?.published_at||new Date().toISOString());
 const payload={title,slug,status,category_id:cat||null,excerpt:value('postExcerpt'),body_html:root.querySelector('#postBody')?.value||'',cover_url:value('postCover')||null,cover_alt:value('postCoverAlt'),seo_title:value('postSeoTitle'),seo_description:value('postSeoDesc'),canonical_url:value('postCanonical')||null,legacy_path:legacy||null,published_at:publishedAt};
 const body=payload.body_html;
 if(status==='published'&&(!body.trim()||!value('postSeoTitle')||!value('postSeoDesc')))throw new Error('Add article text, SEO title and description before publishing.');
 if(payload.cover_url)requireImage(payload.cover_url);
 const saved=await api(state.newPost||!prev?'blog_posts':'blog_posts?id=eq.'+encodeURIComponent(prev.id),{method:state.newPost||!prev?'POST':'PATCH',data:payload});state.selectedPost=saved[0]?.id||prev?.id;state.newPost=false;
 await refresh();toast('Article saved in Supabase. Static HTML requires a Netlify build.');
}
async function saveGallery(){let title=value('galTitle'),slug=slugify(value('galSlug')||title);if(!title)throw new Error('Gallery title required.');requireSlug(slug);
 const prev=state.galleries.find(g=>g.id===state.selectedGallery);
 const obj={title,slug,visibility:selection('galVisibility'),category:value('galCategory')||'Photography',description:value('galDesc'),client_name:value('galClient')||null,related_service_slug:selection('galService')||null,display_order:Number(value('galOrder'))||100};
 const saved=await api(state.newGallery||!prev?'portfolio_galleries':'portfolio_galleries?id=eq.'+encodeURIComponent(prev.id),{method:state.newGallery||!prev?'POST':'PATCH',data:obj});state.selectedGallery=saved[0]?.id||prev?.id;state.newGallery=false;state.editingPhoto=null;await refresh();toast('Gallery saved. Public galleries appear in the portfolio.');
}
async function savePhoto(){const url=value('photoUrl');requireImage(url);const prev=state.images.find(x=>x.id===state.editingPhoto);const obj={gallery_id:state.selectedGallery,image_url:url,original_path:value('photoPath')||null,alt_text:value('photoAlt'),caption:value('photoCaption'),display_order:Number(value('photoOrder'))||100,visibility:selection('photoVisibility')};
 const saved=await api(prev?'portfolio_images?id=eq.'+encodeURIComponent(prev.id):'portfolio_images',{method:prev?'PATCH':'POST',data:obj});state.editingPhoto=saved[0]?.id||null;await refresh();toast('Photograph saved.');
}
async function uploadPhoto(){if(!state.selectedGallery)throw new Error('Choose a gallery first.');const file=root.querySelector('#cmsMediaUpload')?.files?.[0];if(!file)throw new Error('Choose an image file first.');if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>8*1024*1024)throw new Error('Use JPEG/PNG/WebP below 8 MB.');const jwt=await store.authenticatedToken();const ext=file.name.split('.').pop().toLowerCase(),objectPath=state.selectedGallery+'/'+crypto.randomUUID()+'.'+ext;
 const res=await fetch(host+'/storage/v1/object/portfolio/'+objectPath,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+jwt,'Content-Type':file.type,'x-upsert':'false'},body:file});if(!res.ok)throw new Error('Upload failed: '+(await res.text()).slice(0,170));
 const publicUrl=host+'/storage/v1/object/public/portfolio/'+objectPath;
 await api('portfolio_images',{method:'POST',data:{gallery_id:state.selectedGallery,image_url:publicUrl,alt_text:file.name.replace(/\.[^.]+$/,'').replace(/[-_]/g,' '),visibility:'review',display_order:(state.images.length+1)*10}});
 state.editingPhoto=null;await refresh();toast('Image uploaded and saved as REVIEW (not displayed publicly).');
}
root.addEventListener('input',e=>{if(e.target.id==='mediaSearch'){media.query=e.target.value;media.page=0;updateMediaResults()}});
root.addEventListener('change',e=>{if(e.target.id==='mediaCategory'){media.category=e.target.value;media.page=0;updateMediaResults()}});
root.addEventListener('submit',async e=>{if(e.target.id!=='cmsSignIn')return;e.preventDefault();const el=root.querySelector('#cmsAuthError');el.textContent='';try{await store.login(value('cmsEmail'),value('cmsPassword'));if(!await store.isAdmin())throw new Error('This account is not an approved administrator.');await refresh()}catch(err){store.logout();el.textContent=err.message}});
root.addEventListener('click',async e=>{let b=e.target.closest('[data-tab]');if(b){state.tab=b.dataset.tab;render();if(state.tab==='media')loadMedia();return}b=e.target.closest('[data-media-page]');if(b){media.page=Math.max(0,media.page+Number(b.dataset.mediaPage));updateMediaResults();return}b=e.target.closest('[data-media-add]');if(b){b.disabled=true;try{await addLegacyPhoto(b.dataset.mediaAdd)}catch(err){toast('Error: '+err.message)}finally{b.disabled=false}return}b=e.target.closest('[data-post]');if(b){state.selectedPost=b.dataset.post;state.newPost=false;render();return}b=e.target.closest('[data-gallery]');if(b){state.selectedGallery=b.dataset.gallery;state.newGallery=false;state.editingPhoto=null;try{state.images=await api('portfolio_images?select=*&gallery_id=eq.'+encodeURIComponent(state.selectedGallery)+'&order=display_order.asc&limit=1000');render()}catch(err){toast(err.message)}return}b=e.target.closest('[data-photo]');if(b){state.editingPhoto=b.dataset.photo;render();return}b=e.target.closest('[data-action]');if(!b)return;const a=b.dataset.action;
 if(a==='logout'){store.logout();login();return}if(a==='new-post'){state.newPost=true;state.selectedPost=null;render();return}if(a==='cancel-post'){state.newPost=false;render();return}
 if(a==='new-gallery'){state.newGallery=true;state.selectedGallery=null;state.images=[];render();return}if(a==='cancel-gallery'){state.newGallery=false;render();return}if(a==='clear-photo'){state.editingPhoto=null;render();return}
 b.disabled=true;try{if(a==='refresh')await refresh();if(a==='reload-media')await loadMedia(true);if(a==='save-post')await savePost();if(a==='save-gallery')await saveGallery();if(a==='save-photo')await savePhoto();if(a==='upload-photo')await uploadPhoto();}catch(err){console.error(err);toast('Error: '+err.message)}finally{b.disabled=false}
});
async function setTab(next){
 if(!['posts','galleries','media'].includes(next))return;
 if(!store?.configured)throw new Error('Supabase configuration missing.');
 if(!store.getSession()||!await store.isAdmin()){login();return;}
 const changed=state.tab!==next;
 state.tab=next;
 if(changed||!state.categories.length)await refresh();else render();
 if(state.tab==='media')await loadMedia();
}
if(embedded){
 window.LKMCMS={setTab};
 root.innerHTML='<div class="cms-empty">Choose Articles, Galleries or Media Library from the left menu.</div>';
}else{
 (async()=>{if(!store||!store.configured){root.innerHTML='<div class="cms-panel"><h1>Supabase not connected</h1><p>Configure the public Supabase URL and publishable key in lkm-config.js. CMS demo mode is disabled for security.</p></div>';return}try{if(store.getSession()&&await store.isAdmin()){await refresh();return}}catch(e){store.logout()}login()})();
}
})();
