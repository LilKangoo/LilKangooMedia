(()=>{
'use strict';
const root=document.getElementById('cmsRoot');
const embedded=root?.dataset.embedded==='1';
const store=window.LKMStore;
const cfg=window.LKM_CONFIG||{};
const host=String(cfg.SUPABASE_URL||'').replace(/\/$/,'');
const key=cfg.SUPABASE_ANON_KEY||'';
const state={tab:'posts',posts:[],categories:[],galleries:[],images:[],services:[],selectedPost:null,selectedGallery:null,editingPhoto:null,newPost:false,newGallery:false};
const media={loaded:false,loading:false,error:'',items:[],query:'',category:'All',shown:48,pageSize:48,partial:false,
 selected:new Set(),hidden:new Set(),includeHidden:false,assignments:new Map(),originalRows:[],targetGallery:'',observer:null,dimensions:new Map(),busy:false};
const photoSelection=new Set();
const humanSize=bytes=>Number(bytes)>0?(bytes>=1024*1024?(bytes/1048576).toFixed(1)+' MB':(bytes/1024).toFixed(0)+' KB'):'Size unknown';
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
 return `<div class="cms-panel"><h2>${state.newPost?'Create article':p.id?'Edit article':'Choose an article'}</h2><div class="cms-note">Keep the established URL for articles already indexed by search engines. Check the title, images and SEO details before publishing.</div>
 ${field('Title *','postTitle',p.title||'')}
 <div class="cms-fields2">${field('Slug *','postSlug',p.slug||'')}${select('Category','postCategory',[['','Uncategorized'],...state.categories.map(c=>[c.id,c.name])],p.category_id||'')}</div>
 ${select('Status','postStatus',[['draft','Draft'],['review','Review'],['published','Published'],['archived','Archived']],p.status||'draft')}
 ${area('Short excerpt','postExcerpt',p.excerpt||'',3)}
 ${area('Article HTML (headings, paragraphs, images, links)','postBody',p.body_html||'',12)}
 <div class="cms-fields2">${field('Cover image URL','postCover',p.cover_url||'')}${field('Cover image alt text','postCoverAlt',p.cover_alt||'')}</div>
 ${field('SEO title','postSeoTitle',p.seo_title||'')}
 ${area('SEO description','postSeoDesc',p.seo_description||'',2)}
 ${field('Canonical URL (leave empty for new post)','postCanonical',p.canonical_url||'')}
 ${field('Existing article URL, e.g. /article.html','postLegacy',p.legacy_path||'')}
 <div class="cms-actions">${btn(state.newPost?'Create draft/article':'Save article','save-post')}${btn('Cancel','cancel-post','secondary')}</div><p class="cms-muted">Publishing to Supabase makes the record publicly readable. Search-friendly static pages require the separate Netlify blog generation step.</p></div>`;
}
function postsView(){return `<div class="cms-heading"><div><h2>Articles & SEO</h2><p>Write and manage photography, business and Cyprus articles with SEO information.</p></div>${btn('+ New article','new-post')}</div><div class="cms-grid"><div class="cms-panel"><p class="cms-muted">${state.posts.length} records · unpublished drafts are hidden from visitors</p><div class="cms-list">${state.posts.length?state.posts.map(p=>`<button class="cms-item" data-post="${p.id}" aria-current="${state.selectedPost===p.id&&!state.newPost}"><span><strong>${esc(p.title)}</strong><small>${esc(p.slug)} · ${esc(p.status)}</small></span></button>`).join(''):'<div class="cms-empty">No articles added yet. Create a draft to get started.</div>'}</div></div>${postEditor()}</div>`}
const galleryEditor=()=>{const g=state.newGallery?{}:state.galleries.find(g=>g.id===state.selectedGallery)||{};
return `<div class="cms-panel"><h2>${state.newGallery?'Create a gallery':g.id?'Gallery settings':'Select a gallery'}</h2><div class="cms-note">Only galleries and photographs marked Public appear in the portfolio. Review image permissions and descriptions before publishing.</div>${field('Gallery title *','galTitle',g.title||'')}<div class="cms-fields2">${field('Slug *','galSlug',g.slug||'')}${select('Visibility','galVisibility',[['review','Review (hidden)'],['private','Private (hidden)'],['public','Public']],g.visibility||'review')}</div>${field('Category','galCategory',g.category||'Photography')}${area('Description','galDesc',g.description||'',3)}${field('Client or project name (optional)','galClient',g.client_name||'')}${select('Related service','galService',[['','None'],...state.services.map(s=>[s.slug,s.title])],g.related_service_slug||'')}${field('Display order','galOrder',g.display_order??100,'number')}<div class="cms-actions">${btn(state.newGallery?'Create gallery':'Save gallery','save-gallery')}${btn('Cancel','cancel-gallery','secondary')}</div></div>`;};
function photoEditor(){
 const g=state.galleries.find(x=>x.id===state.selectedGallery);if(!g||state.newGallery)return '';
 const f=state.images.find(x=>x.id===state.editingPhoto)||{};
 const checked=photoSelection.size;
 return `<div class="cms-panel lkm-gallery-manager" style="margin-top:16px">
 <div class="cms-heading"><div><h3>Photos · ${esc(g.title)}</h3><p>${state.images.length} photographs · select photos to manage them</p></div><div class="cms-actions">${btn('+ Choose from Media Library','choose-gallery-media','secondary')}${btn('Upload photos','gallery-upload-open','secondary')}</div></div>
 <div class="lkm-batchbar"><label><input type="checkbox" data-gallery-select-all ${state.images.length&&photoSelection.size===state.images.length?'checked':''}> Select all</label>
 <strong>${checked} selected</strong>${btn('Remove from gallery','detach-gallery-selected','secondary')}${btn('Publish selected','publish-gallery-selected','secondary')}${btn('Set to review','review-gallery-selected','secondary')}</div>
 <div class="lkm-gallery-thumbs">${state.images.map(im=>`<div class="lkm-gallery-thumb ${photoSelection.has(im.id)?'is-selected':''}">
 <label class="lkm-check"><input type="checkbox" data-gallery-select="${esc(im.id)}" ${photoSelection.has(im.id)?'checked':''} aria-label="Select photograph"></label>
 <button type="button" class="lkm-gallery-preview" data-photo="${esc(im.id)}" title="Edit photograph"><img loading="lazy" src="${esc(im.image_url)}" alt="${esc(im.alt_text||'Gallery photo')}"></button>
 <small title="${esc(im.alt_text||im.original_path||'Photograph')}">${esc((im.alt_text||im.original_path||'Photo').slice(0,60))}</small>
 <span class="cms-status">${esc(im.visibility)}</span>
 <div class="lkm-gallery-thumb-actions"><button type="button" data-photo="${esc(im.id)}">Edit</button><button type="button" data-photo-cover="${esc(im.id)}" ${g.cover_image_id===im.id?'disabled':''}>${g.cover_image_id===im.id?'Cover ✓':'Set cover'}</button></div>
 </div>`).join('')}</div>
 ${state.images.length?'':'<p class="cms-empty">No photographs assigned. Choose images from Media Library.</p>'}
 <details class="lkm-image-details" ${f.id?'open':''}><summary>${f.id?'Edit selected photograph':'Advanced: add an image URL'}</summary>
 ${f.id?`<div class="lkm-media-detail-preview"><img src="${esc(f.image_url)}" alt="${esc(f.alt_text)}"></div>`:''}
 <div class="cms-fields2">${field('Image URL *','photoUrl',f.image_url||'')}${select('Visibility','photoVisibility',[['review','Review (hidden)'],['private','Private (hidden)'],['public','Public']],f.visibility||'review')}</div>
 <div class="cms-fields2">${field('Alt text','photoAlt',f.alt_text||'')}${field('Original file path (optional)','photoPath',f.original_path||'')}</div>
 ${field('Caption','photoCaption',f.caption||'')}${field('Display order','photoOrder',f.display_order??100,'number')}
 <div class="cms-actions">${btn(f.id?'Save photo details':'Add image URL','save-photo')}${btn('Clear','clear-photo','secondary')}</div></details>
 <div class="lkm-gallery-upload" id="lkmGalleryUpload" hidden><label for="cmsMediaUpload">Upload JPG, PNG or WebP files (8 MB per file, max 15 per batch)</label><input type="file" id="cmsMediaUpload" accept="image/jpeg,image/png,image/webp" multiple>${btn('Upload selected photos','upload-photo')}</div>
 </div>`;
}
function galleriesView(){return `<div class="cms-heading"><div><h2>Portfolio & galleries</h2><p>Organize the full photo library by project, category, and service.</p></div>${btn('+ New gallery','new-gallery')}</div><div class="cms-grid"><div class="cms-panel"><p class="cms-muted">${state.galleries.length} galleries</p><div class="cms-list">${state.galleries.map(g=>`<button class="cms-item" data-gallery="${g.id}" aria-current="${state.selectedGallery===g.id&&!state.newGallery}"><span><strong>${esc(g.title)}</strong><small>${esc(g.category)} · ${esc(g.visibility)}</small></span></button>`).join('')||'<div class="cms-empty">Create your first gallery or import existing files.</div>'}</div></div><div>${galleryEditor()}${photoEditor()}</div></div>`;}
// Full Media Library: original GitHub images + authenticated Supabase uploads.
// Original GitHub files are never deleted by this admin; removed items can be restored.
const isManagedStorageUrl=url=>/^https:\/\/[^/]+\/storage\/v1\/object\/public\/portfolio\//i.test(url||'');
const rowKey=r=>r.original_path||(isManagedStorageUrl(r.image_url)?'storage:'+r.image_url:null);
function mediaRowsByKey(){const map=new Map();for(const r of media.originalRows){const k=rowKey(r);if(k){if(!map.has(k))map.set(k,[]);map.get(k).push(r)}}return map}
async function fetchAllImageRows(){
 const rows=[];for(let offset=0;offset<20000;offset+=1000){
  const batch=await api('portfolio_images?select=*&order=created_at.asc&limit=1000&offset='+offset);
  rows.push(...batch);if(batch.length<1000)break;
 }return rows;
}
async function loadMedia(force=false){
 if(media.loading||(!force&&media.loaded))return;
 media.loading=true;media.error='';render();
 try{
  const [response,rows,hidden]=await Promise.all([
    fetch('/api/media-catalog',{headers:{Accept:'application/json'}}),
    fetchAllImageRows(),
    api('lkm_media_hidden?select=source_key&limit=10000')
  ]);
  const catalog=await response.json().catch(()=>({}));
  if(!response.ok||!Array.isArray(catalog.images))throw new Error(catalog.error||'Could not load the image catalog.');
  media.originalRows=rows;
  media.assignments=mediaRowsByKey();
  media.hidden=new Set(hidden.map(x=>x.source_key));
  const github=catalog.images.map(x=>({...x,uploaded:false}));
  const uploaded=rows.filter(x=>x.storage_path).map(x=>({
   path:'storage:'+x.image_url,image_id:x.id,file:decodeURIComponent(x.storage_path.split('/').pop()),url:x.image_url,
   suggested_category:'New uploads',size:x.file_size_bytes||null,
   width:x.image_width||null,height:x.image_height||null,uploaded:true
  }));
  media.items=[...uploaded,...github];media.partial=!!catalog.partial;media.loaded=true;
 }catch(e){media.error=e.message||'The media catalog is unavailable';}
 finally{media.loading=false;render();}
}
function visibleMedia(){
 const term=media.query.toLowerCase();
 return media.items.filter(x=>(media.includeHidden||!media.hidden.has(x.path))&&
  (media.category==='All'||x.suggested_category===media.category)&&
  (!term||x.path.toLowerCase().includes(term)));
}
function mediaCardsHtml(){
 if(media.loading)return '<div class="cms-empty">Loading photographs and gallery assignments…</div>';
 if(media.error)return `<div class="cms-note" role="alert">${esc(media.error)}. Check the new Supabase migration and reload the catalog.</div>`;
 if(!media.loaded)return '<div class="cms-empty">Loading photo library…</div>';
 const items=visibleMedia(),shown=items.slice(0,media.shown),assignments=media.assignments;
 const body=shown.map(x=>{
  const selected=media.selected.has(x.path),hidden=media.hidden.has(x.path),rows=assignments.get(x.path)||[];
  const names=[...new Set(rows.map(r=>state.galleries.find(g=>g.id===r.gallery_id)?.title).filter(Boolean))];
  const dim=media.dimensions.get(x.path)||(x.width&&x.height?`${x.width} × ${x.height}`:'');
  return `<article class="lkm-media-card ${selected?'is-selected':''} ${hidden?'is-hidden':''}" data-media-card="${esc(x.path)}">
   <div class="lkm-media-image"><img loading="lazy" src="${esc(x.url)}" alt="${esc(x.file)}" data-media-preview="${esc(x.path)}">
   <label class="lkm-check"><input type="checkbox" data-media-select="${esc(x.path)}" ${selected?'checked':''} aria-label="Select ${esc(x.file)}"></label>
   <span class="lkm-media-size" title="File size">${esc(humanSize(x.size))}</span><span class="lkm-media-dim">${esc(dim)}</span></div>
   <div class="lkm-media-info"><strong title="${esc(x.path)}">${esc(x.file)}</strong>
   <span>${esc(x.suggested_category)}</span>
   <span class="lkm-assignment" title="Current gallery">${names.length?'Gallery: '+esc(names.join(', ')):'Not assigned to a gallery'}</span>
   <span class="lkm-vis">${hidden?'Hidden from library':rows.length?esc(rows.map(r=>r.visibility).join(', ')):'Available'}</span>
   <div class="lkm-media-buttons"><button class="cms-btn" type="button" data-media-assign="${esc(x.path)}" ${hidden?'disabled':''}>Add to gallery</button>
   <button class="cms-btn secondary" type="button" data-media-toggle="${esc(x.path)}">${hidden?'Restore':'Remove'}</button></div></div></article>`;
 }).join('');
 return `<div class="lkm-media-grid">${body||'<p class="cms-empty">No photos match these filters.</p>'}</div>
  <div class="lkm-media-loadstatus" id="lkmMediaSentinel">Showing ${shown.length.toLocaleString()} of ${items.length.toLocaleString()} photos. ${shown.length<items.length?'<button class="cms-btn secondary" type="button" data-action="load-more-media">Load more photos</button>':'All matching photos loaded.'}</div>`;
}
function updateGallerySelectionUI(){
 const count=root.querySelector('.lkm-batchbar strong');if(count)count.textContent=photoSelection.size+' selected';
 for(const el of root.querySelectorAll('.lkm-gallery-thumb')){
  const checkbox=el.querySelector('[data-gallery-select]');if(!checkbox)continue;
  checkbox.checked=photoSelection.has(checkbox.dataset.gallerySelect);
  el.classList.toggle('is-selected',checkbox.checked);
 }
 const all=root.querySelector('[data-gallery-select-all]');
 if(all)all.checked=state.images.length>0&&photoSelection.size===state.images.length;
}
function mediaView(){
 const cats=[...new Set(media.items.map(x=>x.suggested_category))].sort();
 const selected=media.selected.size;
 return `<div class="cms-heading"><div><h2>Media Library</h2><p>Manage photos, gallery assignments and new uploads.</p></div>${btn('Reload catalog','reload-media','secondary')}</div>
 <div class="cms-note">Choose photographs below to assign them to a gallery. “Remove” hides an item from this library and removes its gallery assignment; it does not erase original GitHub files or automatically delete uploaded files. You can restore hidden items.</div>
 <div class="lkm-media-controls">
  <div class="cms-field"><label for="mediaSearch">Search filename</label><input id="mediaSearch" placeholder="Search photos…" value="${esc(media.query)}"></div>
  <div class="cms-field"><label for="mediaCategory">Category</label><select id="mediaCategory"><option value="All">All categories</option>${cats.map(c=>`<option value="${esc(c)}" ${media.category===c?'selected':''}>${esc(c)}</option>`).join('')}</select></div>
  <div class="cms-field"><label for="mediaTargetGallery">Destination gallery</label><select id="mediaTargetGallery"><option value="">Choose gallery...</option>${state.galleries.map(g=>`<option value="${esc(g.id)}" ${media.targetGallery===g.id?'selected':''}>${esc(g.title)}</option>`).join('')}</select></div>
 </div>
 <div class="lkm-media-actions"><label class="lkm-media-hidden-toggle"><input type="checkbox" id="mediaShowHidden" ${media.includeHidden?'checked':''}> Show removed photos</label>
  <button class="cms-btn secondary" type="button" data-action="select-visible-media">Select displayed</button>
  <button class="cms-btn secondary" type="button" data-action="clear-media-selection">Clear selection</button>
  <strong>${selected} selected</strong>
  <button class="cms-btn" type="button" data-action="assign-selected-media" ${selected?'':'disabled'}>Add / move selected to gallery</button>
  <button class="cms-btn secondary" type="button" data-action="remove-selected-media" ${selected?'':'disabled'}>Remove selected</button>
  <button class="cms-btn secondary" type="button" data-action="restore-selected-media" ${selected?'':'disabled'}>Restore selected</button></div>
 <div class="lkm-media-upload cms-panel"><div><strong>Upload new photographs</strong><p class="cms-muted">JPG / PNG / WebP · up to 8 MB each · up to 15 at a time · initially hidden until approved</p></div>
  <input id="mediaUpload" type="file" accept="image/jpeg,image/png,image/webp" multiple>
  ${btn('Upload photos','upload-media','secondary')}</div>
 <p class="cms-muted">${media.items.length.toLocaleString()} files indexed${media.partial?' · source catalog may be incomplete':''}. Image dimensions appear as thumbnails load. File sizes are reported by GitHub or from upload data.</p>
 <p id="lkmMediaFeedback" role="status" aria-live="polite"></p><div id="lkmMediaResults">${mediaCardsHtml()}</div>`;
}
function observeMediaScroll(){
 if(media.observer){media.observer.disconnect();media.observer=null}
 const sentinel=root.querySelector('#lkmMediaSentinel');if(!sentinel||typeof IntersectionObserver==='undefined')return;
 media.observer=new IntersectionObserver(entries=>{
  if(entries.some(x=>x.isIntersecting)&&state.tab==='media'&&!media.busy){
   const total=visibleMedia().length;if(media.shown>=total)return;
   media.shown=Math.min(total,media.shown+media.pageSize);updateMediaResults();
  }
 },{rootMargin:'500px 0px'});media.observer.observe(sentinel);
}
function updateMediaResults(){
 const el=root.querySelector('#lkmMediaResults');if(!el)return;
 el.innerHTML=mediaCardsHtml();observeMediaScroll();
 const text=root.querySelector('.lkm-media-actions strong');if(text)text.textContent=media.selected.size+' selected';
 const actions=root.querySelectorAll('[data-action="assign-selected-media"],[data-action="remove-selected-media"],[data-action="restore-selected-media"]');
 actions.forEach(x=>x.disabled=!media.selected.size);
}
function notifyMedia(msg,error=false){const el=root.querySelector('#lkmMediaFeedback');if(el){el.textContent=msg;el.style.color=error?'#a53636':'#285940'}toast(msg)}
function selectedFiles(){return media.items.filter(x=>media.selected.has(x.path))}
async function assignMediaFile(file,target){
 if(!target||!state.galleries.some(g=>g.id===target))throw new Error('Choose a gallery first.');
 const existing=media.assignments.get(file.path)||[];
 if(existing.some(x=>x.gallery_id===target))return 'already';
 const data={gallery_id:target,image_url:file.url,alt_text:file.file.replace(/\.[^.]+$/,'').replace(/[-_]/g,' ').slice(0,150),caption:'',visibility:'review',display_order:100};
 if(file.uploaded){
  const source=existing.find(r=>r.storage_path)||existing[0];
  if(!source)throw new Error('Uploaded file record was not found. Reload the catalog.');
  const free=existing.find(r=>!r.gallery_id);
  if(free){await api('portfolio_images?id=eq.'+free.id,{method:'PATCH',data:{gallery_id:target,visibility:'review'}});free.gallery_id=target;return 'added';}
  // The source object is stored once. Each gallery keeps its own photo assignment.
  const rows=await api('portfolio_images',{method:'POST',data:{gallery_id:target,image_url:file.url,
   original_path:null,alt_text:source.alt_text||file.file,caption:'',visibility:'review',display_order:100,
   file_size_bytes:file.size||null,image_width:file.width||null,image_height:file.height||null}});
  if(rows[0]){existing.push(rows[0]);media.originalRows.push(rows[0]);}return 'added';
 }
 data.original_path=file.path;
 try{
  const rows=await api('portfolio_images',{method:'POST',data});
  if(rows[0]){if(!media.assignments.has(file.path))media.assignments.set(file.path,[]);media.assignments.get(file.path).push(rows[0]);media.originalRows.push(rows[0]);}
  return 'added';
 }catch(err){
  // A duplicate in the same gallery may occur if two requests race.
  if(!String(err.message).includes('409')&&!String(err.message).includes('23505'))throw err;
  const found=await api('portfolio_images?select=*&original_path=eq.'+encodeURIComponent(file.path)+'&gallery_id=eq.'+encodeURIComponent(target)+'&limit=1');
  if(found.length)return 'already';throw err;
 }
}
async function assignSelectedMedia(paths){
 if(media.busy)return;
 const target=media.targetGallery;if(!target){notifyMedia('Choose a destination gallery before adding photographs.',true);return}
 const items=paths.map(k=>media.items.find(x=>x.path===k)).filter(Boolean);
 if(!items.length)return;
 media.busy=true;let added=0,already=0,failed=[];
 try{
  for(const x of items){try{let result=await assignMediaFile(x,target);if(result==='added')added++;if(result==='already')already++;}
   catch(err){failed.push(x.file+': '+err.message.slice(0,130));}}
  media.selected.clear();updateMediaResults();
  notifyMedia(`${added} added, ${already} already assigned.${failed.length?' '+failed.length+' failed: '+failed.slice(0,2).join(' | '):''}`,!!failed.length);
 }finally{media.busy=false}
}
async function hideMediaFiles(paths){
 const items=paths.map(k=>media.items.find(x=>x.path===k)).filter(Boolean);if(!items.length)return;
 if(!confirm(`Remove ${items.length} item(s) from the Media Library? Any gallery assignment will be removed. Original files remain available in GitHub or Supabase Storage and can be restored.`))return;
 media.busy=true;let changed=0,failed=[];
 try{for(const x of items){try{
  const rows=media.assignments.get(x.path)||[];
  for(const row of rows){if(row.gallery_id){await api('portfolio_images?id=eq.'+encodeURIComponent(row.id),{method:'PATCH',data:{gallery_id:null,visibility:'review'}});row.gallery_id=null;row.visibility='review';}}
  await api('lkm_media_hidden?on_conflict=source_key',{method:'POST',data:{source_key:x.path},headers:{Prefer:'resolution=merge-duplicates,return=representation'}});
  media.hidden.add(x.path);changed++;
 }catch(err){failed.push(x.file+': '+err.message.slice(0,150));}}
  media.selected.clear();updateMediaResults();notifyMedia(`${changed} photo(s) removed from the library.${failed.length?' '+failed.length+' failed: '+failed.slice(0,2).join(' | '):''}`,!!failed.length);
 }finally{media.busy=false}
}
async function restoreMediaFiles(paths){let done=0,failed=[];for(const k of paths){try{
 await api('lkm_media_hidden?source_key=eq.'+encodeURIComponent(k),{method:'DELETE'});media.hidden.delete(k);done++;
 }catch(err){failed.push(err.message.slice(0,180));}}
 media.selected.clear();updateMediaResults();notifyMedia(`${done} photo(s) restored.${failed.length?' '+failed.length+' failed: '+failed[0]:''}`,!!failed.length);
}
async function fileDimensions(file){try{const bitmap=await createImageBitmap(file);const d={width:bitmap.width,height:bitmap.height};bitmap.close();return d}catch{return {width:null,height:null}}}
async function uploadMediaFiles(files,chosenGallery){
 if(media.busy)return;
 if(!files.length){notifyMedia('Choose one or more photos to upload.',true);return}
 if(files.length>15){notifyMedia('Upload up to 15 photographs at a time.',true);return}
 media.busy=true;let uploaded=0,failed=[];
 try{const token=await store.authenticatedToken();for(const file of files){try{
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1048576)throw new Error('JPEG, PNG or WebP up to 8 MB only');
  const ext=file.name.split('.').pop().toLowerCase(),folder=new Date().toISOString().slice(0,7),readable=slugify(file.name.replace(/\.[^.]+$/,''))||'photograph',storagePath='uploads/'+folder+'/'+crypto.randomUUID()+'-'+readable.slice(0,60)+'.'+ext;
  const response=await fetch(host+'/storage/v1/object/portfolio/'+storagePath,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':file.type,'x-upsert':'false'},body:file});
  if(!response.ok)throw new Error('Storage '+response.status+': '+(await response.text()).slice(0,140));
  const url=host+'/storage/v1/object/public/portfolio/'+storagePath;const dim=await fileDimensions(file);
  const record={gallery_id:chosenGallery||null,image_url:url,original_path:null,alt_text:file.name.replace(/\.[^.]+$/,'').replace(/[-_]/g,' ').slice(0,150),visibility:'review',display_order:100,
   file_size_bytes:file.size,image_width:dim.width,image_height:dim.height,storage_path:storagePath};
  const rows=await api('portfolio_images',{method:'POST',data:record});
  if(rows[0]){media.originalRows.push(rows[0]);media.assignments.set('storage:'+rows[0].image_url,[rows[0]]);}
  uploaded++;
 }catch(err){failed.push(file.name+': '+err.message.slice(0,170));}}
  if(chosenGallery)await refresh();else{media.loaded=false;await loadMedia(true)}
  notifyMedia(`${uploaded} photograph(s) uploaded.${failed.length?' '+failed.length+' failed: '+failed.slice(0,2).join(' | '):''}`,!!failed.length);
 }finally{media.busy=false}
}
function render(){shell(state.tab==='posts'?postsView():state.tab==='media'?mediaView():galleriesView());if(state.tab==='media')observeMediaScroll();}
const requireSlug=slug=>{if(!/^[a-z0-9-]{1,100}$/.test(slug))throw new Error('Slug must contain lowercase letters, numbers and dashes only.')};
const requireImage=url=>{if(!url||!(/^(https:\/\/[^\s]+|\/assets\/[a-zA-Z0-9%._/-]+)$/.test(url)))throw new Error('Use an HTTPS image URL or /assets/ path.')};
async function savePost(){const title=value('postTitle'),slug=slugify(value('postSlug')||title),status=selection('postStatus');if(!title)throw new Error('Article title required.');requireSlug(slug);
 const legacy=value('postLegacy');if(legacy&&!safePath(legacy))throw new Error('Article URL must look like /article-name.html');
 let cat=selection('postCategory'),publishedAt=null;
 const prev=state.posts.find(p=>p.id===state.selectedPost);
 if(status==='published')publishedAt=(prev?.published_at||new Date().toISOString());
 const payload={title,slug,status,category_id:cat||null,excerpt:value('postExcerpt'),body_html:root.querySelector('#postBody')?.value||'',cover_url:value('postCover')||null,cover_alt:value('postCoverAlt'),seo_title:value('postSeoTitle'),seo_description:value('postSeoDesc'),canonical_url:value('postCanonical')||null,legacy_path:legacy||null,published_at:publishedAt};
 const body=payload.body_html;
 if(status==='published'&&(!body.trim()||!value('postSeoTitle')||!value('postSeoDesc')))throw new Error('Add article text, SEO title and description before publishing.');
 if(payload.cover_url)requireImage(payload.cover_url);
 const saved=await api(state.newPost||!prev?'blog_posts':'blog_posts?id=eq.'+encodeURIComponent(prev.id),{method:state.newPost||!prev?'POST':'PATCH',data:payload});state.selectedPost=saved[0]?.id||prev?.id;state.newPost=false;
 await refresh();toast('Article saved. Review the public preview before sharing its link.');
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
root.addEventListener('input',e=>{
 if(e.target.id==='mediaSearch'){media.query=e.target.value;media.shown=48;updateMediaResults()}
});
root.addEventListener('change',e=>{
 const t=e.target;
 if(t.id==='mediaCategory'){media.category=t.value;media.shown=48;updateMediaResults()}
 if(t.id==='mediaTargetGallery')media.targetGallery=t.value;
 if(t.id==='mediaShowHidden'){media.includeHidden=t.checked;media.shown=48;updateMediaResults()}
 if(t.dataset.mediaSelect!==undefined){t.checked?media.selected.add(t.dataset.mediaSelect):media.selected.delete(t.dataset.mediaSelect);updateMediaResults()}
 if(t.dataset.gallerySelect!==undefined){t.checked?photoSelection.add(t.dataset.gallerySelect):photoSelection.delete(t.dataset.gallerySelect);updateGallerySelectionUI()}
 if(t.dataset.gallerySelectAll!==undefined){photoSelection.clear();if(t.checked)state.images.forEach(x=>photoSelection.add(x.id));updateGallerySelectionUI()}
});
// Capture thumbnail load events to display actual pixel dimensions without loading the whole archive.
root.addEventListener('load',e=>{const img=e.target;if(img.tagName!=='IMG'||!img.dataset.mediaPreview)return;
 const path=img.dataset.mediaPreview;const dim=`${img.naturalWidth} × ${img.naturalHeight}`;media.dimensions.set(path,dim);
 const badge=img.closest('.lkm-media-card')?.querySelector('.lkm-media-dim');if(badge)badge.textContent=dim;
},true);
root.addEventListener('submit',async e=>{if(e.target.id!=='cmsSignIn')return;e.preventDefault();const el=root.querySelector('#cmsAuthError');el.textContent='';try{
 await store.login(value('cmsEmail'),value('cmsPassword'));if(!await store.isAdmin())throw new Error('This account is not an approved administrator.');await refresh()
}catch(err){store.logout();el.textContent=err.message}});
root.addEventListener('click',async e=>{
 let b=e.target.closest('[data-tab]');if(b){state.tab=b.dataset.tab;render();if(state.tab==='media')await loadMedia(true);return}
 b=e.target.closest('[data-media-assign]');if(b){media.selected.add(b.dataset.mediaAssign);await assignSelectedMedia([b.dataset.mediaAssign]);return}
 b=e.target.closest('[data-media-toggle]');if(b){if(media.hidden.has(b.dataset.mediaToggle))await restoreMediaFiles([b.dataset.mediaToggle]);else await hideMediaFiles([b.dataset.mediaToggle]);return}
 b=e.target.closest('[data-post]');if(b){state.selectedPost=b.dataset.post;state.newPost=false;render();return}
 b=e.target.closest('[data-gallery]');if(b){state.selectedGallery=b.dataset.gallery;state.newGallery=false;state.editingPhoto=null;photoSelection.clear();try{
 state.images=await api('portfolio_images?select=*&gallery_id=eq.'+encodeURIComponent(state.selectedGallery)+'&order=display_order.asc&limit=1000');render()
 }catch(err){toast(err.message)}return}
 b=e.target.closest('[data-photo]');if(b){state.editingPhoto=b.dataset.photo;render();return}
 b=e.target.closest('[data-photo-cover]');if(b){if(!state.selectedGallery)return;try{await api('portfolio_galleries?id=eq.'+state.selectedGallery,{method:'PATCH',data:{cover_image_id:b.dataset.photoCover}});await refresh();toast('Gallery cover updated.')}catch(err){toast('Could not set cover: '+err.message)}return}
 b=e.target.closest('[data-action]');if(!b)return;const action=b.dataset.action;
 if(action==='logout'){store.logout();login();return}
 if(action==='new-post'){state.newPost=true;state.selectedPost=null;render();return}
 if(action==='cancel-post'){state.newPost=false;render();return}
 if(action==='new-gallery'){state.newGallery=true;state.selectedGallery=null;state.images=[];photoSelection.clear();render();return}
 if(action==='cancel-gallery'){state.newGallery=false;render();return}
 if(action==='clear-photo'){state.editingPhoto=null;render();return}
 if(action==='load-more-media'){media.shown+=media.pageSize;updateMediaResults();return}
 if(action==='select-visible-media'){visibleMedia().slice(0,media.shown).forEach(x=>media.selected.add(x.path));updateMediaResults();return}
 if(action==='clear-media-selection'){media.selected.clear();updateMediaResults();return}
 if(action==='assign-selected-media'){await assignSelectedMedia([...media.selected]);return}
 if(action==='remove-selected-media'){await hideMediaFiles([...media.selected]);return}
 if(action==='restore-selected-media'){await restoreMediaFiles([...media.selected]);return}
 if(action==='choose-gallery-media'){media.targetGallery=state.selectedGallery;const nav=document.querySelector('.admin-sidebar [data-tab="media"]');if(nav)nav.click();else{state.tab='media';render();await loadMedia(true)}return}
 if(action==='gallery-upload-open'){let x=root.querySelector('#lkmGalleryUpload');if(x)x.hidden=!x.hidden;return}
 if(action==='detach-gallery-selected'){
  if(!photoSelection.size){toast('Select photos to remove.');return}
  if(!confirm(`Remove ${photoSelection.size} photographs from this gallery? The original files will not be deleted.`))return;
  let errors=[];for(const id of photoSelection){try{await api('portfolio_images?id=eq.'+id,{method:'PATCH',data:{gallery_id:null,visibility:'review'}})}catch(err){errors.push(err.message)}}
  photoSelection.clear();await refresh();toast(errors.length?'Some photos could not be removed: '+errors[0]:'Photographs removed from gallery.');return;
 }
 if(action==='publish-gallery-selected'||action==='review-gallery-selected'){
  if(!photoSelection.size){toast('Select photos first.');return}
  const visibility=action==='publish-gallery-selected'?'public':'review';
  if(visibility==='public'&&!confirm(`Make ${photoSelection.size} selected photographs public? Confirm you have permission to publish them.`))return;
  let errors=[];for(const id of photoSelection){try{await api('portfolio_images?id=eq.'+id,{method:'PATCH',data:{visibility}})}catch(err){errors.push(err.message)}}
  photoSelection.clear();await refresh();toast(errors.length?'Could not update all photos: '+errors[0]:'Photo visibility updated.');return;
 }
 b.disabled=true;
 try{
  if(action==='refresh')await refresh();
  if(action==='reload-media')await loadMedia(true);
  if(action==='save-post')await savePost();
  if(action==='save-gallery')await saveGallery();
  if(action==='save-photo')await savePhoto();
  if(action==='upload-media')await uploadMediaFiles(Array.from(root.querySelector('#mediaUpload')?.files||[]),media.targetGallery);
  if(action==='upload-photo')await uploadMediaFiles(Array.from(root.querySelector('#cmsMediaUpload')?.files||[]),state.selectedGallery);
 }catch(err){console.error(err);toast('Operation failed: '+err.message)}finally{if(b.isConnected)b.disabled=false}
});
async function setTab(next){
 if(!['posts','galleries','media'].includes(next))return;
 if(!store?.configured)throw new Error('Supabase configuration missing.');
 if(!store.getSession()||!await store.isAdmin()){login();return;}
 const changed=state.tab!==next;
 state.tab=next;
 if(changed||!state.categories.length)await refresh();else render();
 if(state.tab==='media')await loadMedia(true);
}
if(embedded){
 window.LKMCMS={setTab};
 root.innerHTML='<div class="cms-empty">Choose Articles, Galleries or Media Library from the left menu.</div>';
}else{
 (async()=>{if(!store||!store.configured){root.innerHTML='<div class="cms-panel"><h1>Supabase not connected</h1><p>Configure the public Supabase URL and publishable key in lkm-config.js. CMS demo mode is disabled for security.</p></div>';return}try{if(store.getSession()&&await store.isAdmin()){await refresh();return}}catch(e){store.logout()}login()})();
}
})();
