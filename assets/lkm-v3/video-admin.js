/* LilKangooMedia video manager: additive integration with existing unified admin.
   Requires Supabase Auth, media_videos migration; no public write credentials. */
(()=>{
'use strict';
const cfg=window.LKM_CONFIG||{},store=window.LKMStore;
const host=String(cfg.SUPABASE_URL||'').replace(/\/$/,''),key=cfg.SUPABASE_ANON_KEY;
if(!host||!key||!store)return;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const youtubeId=input=>{
 const raw=String(input||'').trim();if(/^[\w-]{11}$/.test(raw))return raw;
 try{
  const u=new URL(raw);
  const h=u.hostname.toLowerCase();
  if(h==='youtu.be'||h==='www.youtu.be')return (u.pathname.split('/')[1]||'').match(/^[\w-]{11}$/)?.[0]||'';
  if(!['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','www.youtube-nocookie.com','youtube-nocookie.com'].includes(h))return '';
  const part=/^\/(?:shorts|embed|live|v)\/([\w-]{11})(?:\/|$)/.exec(u.pathname);
  const id=part?.[1]||u.searchParams.get('v')||'';
  return /^[\w-]{11}$/.test(id)?id:'';
 }catch{return ''}
};
const poster=id=>'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg';
let open=false,loading=false,items=[],galleries=[],services=[],currentId='',targetType='gallery',target='',filter='';
let overlay=null;
async function api(path,{method='GET',data}={}){
 const jwt=await store.authenticatedToken();if(!jwt)throw Error('Administrator sign-in required.');
 const resp=await fetch(host+'/rest/v1/'+path,{method,headers:{apikey:key,Authorization:'Bearer '+jwt,'Content-Type':'application/json',Prefer:'return=representation'},body:data===undefined?undefined:JSON.stringify(data)});
 if(!resp.ok){let body=await resp.text();if(resp.status===404||body.includes('media_videos'))throw Error('Video database table is not available. Run the Phase 10 SQL migration first.');throw Error('Supabase '+resp.status+': '+body.slice(0,240));}
 const raw=await resp.text();return raw?JSON.parse(raw):[];
}
const currentItems=()=>items.filter(x=>targetType==='gallery'?x.gallery_id===target:x.service_slug===target).filter(x=>!filter||x.title.toLowerCase().includes(filter.toLowerCase())||x.youtube_id.includes(filter));
const choices=()=>targetType==='gallery'?galleries.map(x=>({id:x.id,name:x.title+(x.visibility!=='public'?' · '+x.visibility:'')})):services.map(x=>({id:x.slug,name:x.title+(x.active===false?' · hidden':'')}));
const details=p=>`<div class="lkm-videos-card" data-video-row="${esc(p.id)}"><img src="${poster(p.youtube_id)}" loading="lazy" alt="${esc(p.title)}"><div class="lkm-videos-info"><strong>${esc(p.title)}</strong><small>${esc(p.youtube_id)} · ${esc(p.visibility)} · Position ${p.display_order}</small><div class="lkm-videos-actions"><button type="button" data-v10-edit="${esc(p.id)}">Edit</button><button type="button" data-v10-vis="${esc(p.id)}">${p.visibility==='public'?'Hide':'Publish'}</button><button type="button" data-v10-remove="${esc(p.id)}">Remove</button></div></div></div>`;
function draw(){if(!overlay)return;
 const opts=choices();if(target&&!opts.some(x=>x.id===target))target='';if(!target)target=opts[0]?.id||'';
 const selected=items.find(x=>x.id===currentId);
 overlay.innerHTML=`<div class="lkm-videos-dialog" role="dialog" aria-modal="true" aria-labelledby="lkmVideosTitle">
  <header class="lkm-videos-heading"><div><small>CONTENT MANAGEMENT</small><h2 id="lkmVideosTitle">Video Library</h2><p>Add YouTube videos to portfolio galleries and services.</p></div><button type="button" data-v10-close aria-label="Close video manager">×</button></header>
  <div id="lkmVideoStatus" role="status" aria-live="polite" class="lkm-videos-status" hidden></div>
  <div class="lkm-videos-fields"><label>Placement type<select id="v10Type"><option value="gallery" ${targetType==='gallery'?'selected':''}>Portfolio gallery</option><option value="service" ${targetType==='service'?'selected':''}>Service</option></select></label>
  <label>Destination<select id="v10Target">${opts.map(x=>`<option value="${esc(x.id)}" ${target===x.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label></div>
  <form id="v10Form" class="lkm-videos-form">
   <div><label>YouTube video URL or ID *<input id="v10Url" required placeholder="https://www.youtube.com/watch?v=..." value="${esc(selected?'https://www.youtube.com/watch?v='+selected.youtube_id:'')}"></label><small>YouTube videos and Shorts are supported. Upload the actual video to YouTube first.</small></div>
   <label>Title *<input id="v10Title" required maxlength="180" value="${esc(selected?.title||'')}" placeholder="e.g. Wedding highlight film in Paphos"></label>
   <label>Description (optional)<textarea id="v10Desc" rows="2" maxlength="1500">${esc(selected?.description||'')}</textarea></label>
   <div class="lkm-videos-fields"><label>Visibility<select id="v10Visibility"><option value="review" ${(selected?.visibility||'review')==='review'?'selected':''}>Review (not public)</option><option value="public" ${selected?.visibility==='public'?'selected':''}>Public</option><option value="hidden" ${selected?.visibility==='hidden'?'selected':''}>Hidden</option></select></label>
   <label>Order<input id="v10Order" type="number" step="1" min="0" value="${selected?.display_order??100}"></label></div>
   <div class="lkm-videos-buttons"><button type="submit">${selected?'Save video changes':'Add video to selected location'}</button>${selected?'<button type="button" data-v10-cancel>Edit another / add new</button>':''}</div>
  </form>
  <div class="lkm-videos-search"><strong>${currentItems().length} assigned video(s)</strong><input type="search" id="v10Search" placeholder="Search assigned videos" value="${esc(filter)}"></div>
  <div class="lkm-videos-list">${currentItems().map(details).join('')||'<p class="lkm-videos-empty">No videos assigned here yet.</p>'}</div>
  <p class="lkm-videos-help">Removing a placement does not delete the original YouTube video. Visibility controls whether it appears on LilKangooMedia.</p>
 </div>`;
 const popup=overlay.querySelector('.lkm-videos-dialog');popup?.focus?.();
}
function status(msg,error=false){const el=overlay?.querySelector('#lkmVideoStatus');if(!el)return;el.textContent=msg;el.hidden=false;el.classList.toggle('is-error',error);}
async function reload(){[galleries,services,items]=await Promise.all([
 api('portfolio_galleries?select=id,title,visibility&order=display_order.asc&limit=1000'),
 api('services?select=slug,title,active&order=sort_order.asc&limit=1000'),
 api('media_videos?select=*&order=display_order.asc&limit=1000')
]);}
async function openManager(type='',dest=''){
 if(open)return;open=true;targetType=type||targetType;target=dest||target;currentId='';filter='';
 overlay=document.createElement('div');overlay.id='lkmVideosOverlay';overlay.className='lkm-videos-overlay';document.body.appendChild(overlay);document.body.classList.add('lkm-videos-open');
 overlay.innerHTML='<div class="lkm-videos-dialog"><p>Loading your video library…</p></div>';
 try{loading=true;await reload();loading=false;draw();}catch(e){loading=false;overlay.innerHTML='<div class="lkm-videos-dialog"><button type="button" data-v10-close>× Close</button><h2>Video Library</h2><p role="alert">'+esc(e.message)+'</p></div>'}
}
function close(){open=false;overlay?.remove();overlay=null;document.body.classList.remove('lkm-videos-open');}
function initializeNav(){
 const menu=document.querySelector('.admin-sidebar');if(!menu)return;
 if(!menu.querySelector('#lkmVideoLibraryNav')){
  const btn=document.createElement('button');btn.id='lkmVideoLibraryNav';btn.type='button';btn.textContent='▶ Video Library';btn.className='lkm-video-nav';const anchor=menu.querySelector('[data-tab="media"]');anchor?.after(btn);if(!anchor)menu.append(btn);
  btn.addEventListener('click',()=>openManager());
 }
 const svc=document.querySelector('#svcTitle');if(svc&&!document.querySelector('#lkmVideoServiceButton')){
  const button=document.createElement('button');button.id='lkmVideoServiceButton';button.className='button button-light';button.type='button';button.textContent='▶ Manage service videos';const head=svc.closest('.admin-editor')?.querySelector('.lkm-editor-head');head?.append(button);
  button.addEventListener('click',()=>openManager('service',document.querySelector('#svcSlug')?.value.trim()||''));
 }
 const cms=document.querySelector('#cmsRoot');
 const selected= cms?.querySelector('.cms-item[data-gallery][aria-current="true"]');
 const area=cms?.querySelector('.lkm-gallery-manager .cms-heading');
 if(selected&&area&&!area.querySelector('#lkmVideoGalleryButton')){
  const button=document.createElement('button');button.id='lkmVideoGalleryButton';button.type='button';button.className='cms-btn secondary';button.textContent='▶ Manage gallery videos';area.append(button);
  button.addEventListener('click',()=>openManager('gallery',selected.dataset.gallery));
 }
}
let scheduled=false;new MutationObserver(()=>{if(!scheduled){scheduled=true;requestAnimationFrame(()=>{scheduled=false;initializeNav()})}}).observe(document.body,{subtree:true,childList:true});
initializeNav();
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&open&&!document.getElementById('lkmYoutubeSyncDialog')){e.preventDefault();close()}});
document.addEventListener('click',async e=>{
 if(!open||!overlay?.contains(e.target))return;
 if(e.target===overlay||e.target.closest('[data-v10-close]')){close();return}
 const ed=e.target.closest('[data-v10-edit]');if(ed){currentId=ed.dataset.v10Edit;draw();return}
 if(e.target.closest('[data-v10-cancel]')){currentId='';draw();return}
 const vis=e.target.closest('[data-v10-vis]');if(vis){try{const row=items.find(x=>x.id===vis.dataset.v10Vis);await api('media_videos?id=eq.'+encodeURIComponent(row.id),{method:'PATCH',data:{visibility:row.visibility==='public'?'hidden':'public'}});await reload();draw();status('Visibility updated.')}catch(err){status(err.message,true)}return}
 const del=e.target.closest('[data-v10-remove]');if(del){const item=items.find(x=>x.id===del.dataset.v10Remove);if(!item||!confirm('Remove "'+item.title+'" from this destination? The YouTube video will not be deleted.'))return;try{await api('media_videos?id=eq.'+encodeURIComponent(item.id),{method:'DELETE'});if(currentId===item.id)currentId='';await reload();draw();status('Video placement removed.')}catch(err){status(err.message,true)}return}
});
document.addEventListener('change',e=>{if(!open||!overlay?.contains(e.target))return;
 if(e.target.id==='v10Type'){targetType=e.target.value;target='';currentId='';draw()}
 if(e.target.id==='v10Target'){target=e.target.value;currentId='';draw()}
});
document.addEventListener('input',e=>{if(!open||!overlay?.contains(e.target)||e.target.id!=='v10Search')return;
 filter=e.target.value;const list=overlay.querySelector('.lkm-videos-list');if(list)list.innerHTML=currentItems().map(details).join('')||'<p>No matching videos.</p>';
});
document.addEventListener('submit',async e=>{if(!open||e.target.id!=='v10Form')return;e.preventDefault();
 const id=youtubeId(overlay.querySelector('#v10Url').value),title=overlay.querySelector('#v10Title').value.trim();
 if(!id){status('Paste a valid YouTube video or Shorts URL.',true);return}if(!title){status('Video title is required.',true);return}if(!target){status('Choose a gallery or service first.',true);return}
 const data={youtube_id:id,title,description:overlay.querySelector('#v10Desc').value.trim(),visibility:overlay.querySelector('#v10Visibility').value,display_order:Number(overlay.querySelector('#v10Order').value)||100,
 gallery_id:targetType==='gallery'?target:null,service_slug:targetType==='service'?target:null};
 const btn=overlay.querySelector('[type=submit]');btn.disabled=true;try{
  await api(currentId?'media_videos?id=eq.'+encodeURIComponent(currentId):'media_videos',{method:currentId?'PATCH':'POST',data});currentId='';await reload();draw();status('Video saved. Public videos are visible after refresh.');
 }catch(err){status(err.message.includes('23505')?'This video is already assigned here.':err.message,true);btn.disabled=false}
});
})();

/* Phase 11 — verified YouTube channel import. This augments the Phase 10 Video Library. */
(()=>{
'use strict';
const clean=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let modal=null,result=null,working=false;
const sourceUrl='https://www.youtube.com/@lilKangooMedia';
function inject(){
 const header=document.querySelector('#lkmVideosOverlay .lkm-videos-heading');
 if(!header||header.querySelector('[data-ys-open]'))return;
 const button=document.createElement('button');button.type='button';button.dataset.ysOpen='';button.className='lkm-channel-sync-open';button.textContent='↻ Synchronize YouTube channel';
 button.title='Read the official LilKangooMedia YouTube uploads and add selected videos to your website.';
 header.append(button);
}
let pending=false;
new MutationObserver(()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;inject()})}).observe(document.body,{childList:true,subtree:true});
inject();
function showDialog(){
 if(modal)return;
 modal=document.createElement('div');modal.id='lkmYoutubeSyncDialog';modal.className='lkm-youtube-sync-overlay';
 modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Synchronize LilKangooMedia YouTube channel');
 document.body.append(modal);document.body.classList.add('lkm-youtube-sync-open');
 draw();
}
function close(){if(working)return;modal?.remove();modal=null;result=null;document.body.classList.remove('lkm-youtube-sync-open');}
function draw(){
 if(!modal)return;
 const videos=result?.videos||[];
 const services=result?.services||[];
 modal.innerHTML=`<div class="lkm-youtube-sync-panel">
  <div class="lkm-youtube-sync-head"><div><span class="lkm-youtube-sync-kicker">LILKANGOOMEDIA · VIDEO LIBRARY</span><h2>Synchronize YouTube videos</h2><p>Import original titles and descriptions from <a href="${sourceUrl}" target="_blank" rel="noopener">@lilKangooMedia</a>. Select the videos to publish. Service placements are optional and chosen by you.</p></div><button type="button" data-ys-close aria-label="Close">×</button></div>
  <div class="lkm-youtube-sync-toolbar"><button type="button" data-ys-preview ${working?'disabled':''}>${result?'↻ Reload from YouTube':'Load channel videos'}</button>${result?`<button type="button" data-ys-all>Select all</button><button type="button" data-ys-none>Clear selection</button><span class="lkm-youtube-sync-source">${clean(result.source)} · ${videos.length} verified video${videos.length===1?'':'s'}</span>`:''}</div>
  ${result?.truncated?'<p class="lkm-youtube-sync-info">The public YouTube feed only lists recent uploads. To import the full channel archive, configure YOUTUBE_API_KEY in Netlify and reload.</p>':''}
  <p id="lkmYouTubeSyncStatus" class="lkm-youtube-sync-status" role="status" aria-live="polite" hidden></p>
  <div class="lkm-youtube-sync-list">${videos.map(v=>`<div class="lkm-youtube-sync-item">
   <label class="lkm-youtube-sync-choice"><input type="checkbox" data-ys-selected="${clean(v.id)}" checked><img src="${clean(v.thumbnail)}" alt="" loading="lazy"><span><strong>${clean(v.title)}</strong><small>${clean((v.description||'').slice(0,200))||'No description provided on YouTube.'}</small><small>${clean(v.published?String(v.published).slice(0,10):'')} · <a href="${clean(v.url)}" target="_blank" rel="noopener">Watch on YouTube</a></small></span></label>
   <label class="lkm-youtube-sync-destination">Also show under service (optional)<select data-ys-service="${clean(v.id)}"><option value="">Video portfolio only</option>${services.map(s=>`<option value="${clean(s.slug)}">${clean(s.title)}</option>`).join('')}</select></label>
   </div>`).join('')||'<p class="lkm-youtube-sync-empty">Load the official YouTube channel videos to continue.</p>'}</div>
  <div class="lkm-youtube-sync-bottom">${result?'<button type="button" data-ys-import class="lkm-youtube-sync-publish">Import & publish selected videos</button>':''}<a href="/portfolio.html#/gallery/video-portfolio" target="_blank" rel="noopener">View video portfolio ↗</a><span>Existing photos, prices and edited videos will not be changed.</span></div>
 </div>`;
}
function status(message,isError=false){const el=modal?.querySelector('#lkmYouTubeSyncStatus');if(el){el.hidden=false;el.textContent=message;el.classList.toggle('is-error',isError);}}
async function request(action,payload={}){
 const jwt=await window.LKMStore?.authenticatedToken?.();if(!jwt)throw Error('Sign in to the administrator panel first.');
 const res=await fetch('/api/youtube-channel-sync',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+jwt},body:JSON.stringify({action,...payload})});
 const data=await res.json().catch(()=>({}));
 if(!res.ok||!data.ok)throw Error(data.error||'The YouTube sync request failed.');
 return data;
}
async function preview(){working=true;try{status('Loading verified videos directly from YouTube…');const data=await request('preview');result=data;draw();status(`Loaded ${data.videos.length} video(s) from ${data.channel}. Review titles and service destinations before publishing.`);}catch(e){status(e.message,true)}finally{working=false}}
async function publish(){
 const chosen=[...modal.querySelectorAll('[data-ys-selected]:checked')].map(x=>x.dataset.ysSelected);
 if(!chosen.length){status('Select at least one video.',true);return}
 const assignments={};
 modal.querySelectorAll('[data-ys-service]').forEach(el=>{if(chosen.includes(el.dataset.ysService)&&el.value)assignments[el.dataset.ysService]=el.value});
 if(!confirm(`Publish ${chosen.length} video(s) to Films & Video Production? Videos assigned to a service will also appear on that service page.`))return;
 working=true;const button=modal.querySelector('[data-ys-import]');if(button)button.disabled=true;
 try{
  status('Importing verified YouTube metadata and publishing videos…');
  const data=await request('import',{selected_ids:chosen,assignments});
  status(`Published: ${data.added} new video(s), ${data.already_present} already in portfolio. New service placements: ${data.service_placements_added}. The video portfolio is now available. Close this window and reopen Video Library to refresh its list.`);
  modal.querySelector('.lkm-youtube-sync-bottom').insertAdjacentHTML('afterbegin',`<a class="lkm-youtube-sync-success-link" href="${data.gallery_url}" target="_blank" rel="noopener">Open published videos ↗</a>`);
 }catch(e){status(e.message,true);if(button)button.disabled=false}finally{working=false}
}
document.addEventListener('click',e=>{
 if(e.target.closest('[data-ys-open]')){showDialog();return}
 if(!modal)return;
 if(e.target===modal||e.target.closest('[data-ys-close]')){close();return}
 if(e.target.closest('[data-ys-preview]')){if(!working)preview();return}
 if(e.target.closest('[data-ys-all]')){modal.querySelectorAll('[data-ys-selected]').forEach(x=>x.checked=true);return}
 if(e.target.closest('[data-ys-none]')){modal.querySelectorAll('[data-ys-selected]').forEach(x=>x.checked=false);return}
 if(e.target.closest('[data-ys-import]')){if(!working)publish();return}
});
document.addEventListener('keydown',e=>{if(modal&&e.key==='Escape'&&!working){e.stopImmediatePropagation();close()}});
})();

/* LilKangooMedia Phase 12 — service video attachments.
 * Extends the existing Phase 10/11 Video Library, preserving all original code.
 * No changes to services.gallery_urls, price packages, photo storage, or public site routing.
 */
(()=>{
'use strict';
const cfg=window.LKM_CONFIG||{},store=window.LKMStore;
const root=document.getElementById('adminRoot');
if(!root||!store||!cfg.SUPABASE_URL||!cfg.SUPABASE_ANON_KEY)return;
const host=String(cfg.SUPABASE_URL).replace(/\/$/,''),key=cfg.SUPABASE_ANON_KEY;
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const isId=value=>/^[A-Za-z0-9_-]{11}$/.test(String(value||''));
const poster=id=>'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg';
const clipId=input=>{
 const raw=String(input||'').trim();if(isId(raw))return raw;
 try{const url=new URL(raw),host=url.hostname.toLowerCase();
  if(host==='youtu.be'||host==='www.youtu.be'){const id=url.pathname.split('/')[1];return isId(id)?id:''}
  if(!['www.youtube.com','youtube.com','m.youtube.com','music.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(host))return '';
  const id=url.pathname.match(/^\/(?:shorts|live|embed|v)\/([\w-]{11})(?:\/|$)/)?.[1]||url.searchParams.get('v');return isId(id)?id:'';
 }catch{return ''}
};
let modal=null,originButton=null,collection=[],galleryNames={},currentAssignments=[],serviceSlug='',filteredGallery='',selected=new Set(),busy=false;
let activeSlot=null,renderSequence=0,working=false;
const css=`
.lkm-sv-section{margin:18px 0 22px;padding:22px;border:1px solid #dbe5dc;border-radius:13px;background:#f8faf7;color:#233b2a;min-width:0}
.lkm-sv-section h3{font-size:21px;margin:0 0 8px}.lkm-sv-section .lkm-sv-muted{color:#68786a;font-size:12px;line-height:1.5;margin:4px 0 12px}
.lkm-sv-section .lkm-sv-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:11px 0}
.lkm-sv-section button,.lkm-sv-dialog button{border-radius:8px;cursor:pointer;font-size:12px;font-weight:750}
.lkm-sv-action{background:#233d2b;color:#fff;border:1px solid #233d2b;padding:11px 15px;min-height:41px}
.lkm-sv-secondary{background:white;color:#24412d;border:1px solid #cbd9cd;padding:9px 13px;min-height:38px}
.lkm-sv-section button:disabled,.lkm-sv-dialog button:disabled{opacity:.55;cursor:wait}
.lkm-sv-current{display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:13px;margin-top:13px}
.lkm-sv-card{min-width:0;border:1px solid #dce4dc;border-radius:10px;background:white;overflow:hidden}
.lkm-sv-card img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block;background:#d5dcd4}
.lkm-sv-card-body{padding:10px}.lkm-sv-card strong{display:block;font-size:12px;line-height:1.35;min-height:32px;overflow-wrap:anywhere}
.lkm-sv-card small{color:#66756a;display:block;margin:4px 0 10px;font-size:10px}
.lkm-sv-buttons{display:flex;flex-wrap:wrap;gap:5px}.lkm-sv-buttons button{font-size:11px;padding:6px 9px;background:#fff;border:1px solid #d9ded7}
.lkm-sv-buttons .lkm-sv-remove{color:#9e392e;border-color:#e9cec8}
.lkm-sv-status{font-size:12px;margin:11px 0 0;padding:9px 11px;border-radius:7px;background:#e9f3ea;color:#275a34}
.lkm-sv-status.is-error{background:#fff0ed;color:#9e392e}
.lkm-sv-overlay{position:fixed;inset:0;z-index:12020;background:#102017ce;display:flex;align-items:center;justify-content:center;padding:18px}
.lkm-sv-dialog{width:min(1050px,100%);max-height:min(92vh,940px);background:#fff;color:#213427;border-radius:15px;box-shadow:0 24px 90px #0004;display:flex;flex-direction:column;min-height:320px;overflow:hidden}
.lkm-sv-head{padding:19px 22px 15px;display:flex;justify-content:space-between;gap:15px;border-bottom:1px solid #dfe8dc}
.lkm-sv-head h2{font-size:24px;margin:0 0 5px}.lkm-sv-head p{font-size:12px;color:#657369;margin:0}
.lkm-sv-close{background:#fff;border:1px solid #dfe7de;min-width:35px;min-height:35px;font-size:23px!important}
.lkm-sv-filter{display:grid;grid-template-columns:1.7fr 1fr;gap:12px;padding:14px 22px}
.lkm-sv-filter label,.lkm-sv-manual label{font-size:11px;font-weight:750;color:#314735;display:block}
.lkm-sv-filter input,.lkm-sv-filter select,.lkm-sv-manual input{display:block;width:100%;min-height:40px;border:1px solid #cdd8cc;border-radius:7px;padding:9px 11px;margin-top:5px;background:#fff;color:#1d3021;font-size:13px}
.lkm-sv-list{overflow:auto;flex:1;padding:7px 22px 22px;display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;align-content:start}
.lkm-sv-select-card{display:block;background:#fff;border:1px solid #dbe4da;border-radius:10px;overflow:hidden;position:relative;cursor:pointer;min-width:0}
.lkm-sv-select-card:has(input:checked){outline:2px solid #33704a;outline-offset:1px}
.lkm-sv-select-card img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block}
.lkm-sv-select-card input{position:absolute;top:8px;left:8px;z-index:1;width:19px;height:19px;accent-color:#24583a}
.lkm-sv-select-card .lkm-sv-select-name{display:block;padding:10px;font-size:12px;line-height:1.4;font-weight:750;overflow-wrap:anywhere}
.lkm-sv-select-card small{display:block;padding:0 10px 9px;color:#617368;font-size:10px}
.lkm-sv-select-card[data-added="1"]{opacity:.64;cursor:default}
.lkm-sv-select-card[hidden]{display:none!important}
.lkm-sv-bottom{border-top:1px solid #dfe8dc;padding:13px 22px;background:#f8faf7;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.lkm-sv-bottom .lkm-sv-count{font-size:12px;color:#526753;margin-right:auto}
.lkm-sv-manual{border-top:1px solid #e4e9e1;padding:14px 22px;display:grid;grid-template-columns:1.5fr 1fr auto;gap:10px;align-items:end}
.lkm-sv-photo-bridge{border:1px solid #d1e2d1;border-radius:8px;background:#f4f8f2;padding:12px;margin:8px 0;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.lkm-sv-photo-bridge p{margin:0;font-size:12px;color:#3d6146;flex:1;min-width:180px}
@media(max-width:720px){.lkm-sv-overlay{padding:5px}.lkm-sv-dialog{max-height:99vh;border-radius:8px}.lkm-sv-head,.lkm-sv-filter,.lkm-sv-bottom,.lkm-sv-manual{padding:11px}.lkm-sv-filter{grid-template-columns:1fr}.lkm-sv-list{padding:9px;grid-template-columns:repeat(2,minmax(0,1fr))}.lkm-sv-manual{grid-template-columns:1fr}.lkm-sv-section{padding:12px}}
`;
if(!document.getElementById('lkm-service-video-styles')){const style=document.createElement('style');style.id='lkm-service-video-styles';style.textContent=css;document.head.appendChild(style)}
function note(message,isError=false){
 const el=(modal||activeSlot)?.querySelector('.lkm-sv-status');if(!el)return;el.hidden=false;el.textContent=message;el.classList.toggle('is-error',isError);
}
async function api(path,{method='GET',data}={}){
 const jwt=await store.authenticatedToken();if(!jwt)throw Error('Sign in as administrator to manage service videos.');
 const response=await fetch(host+'/rest/v1/'+path,{method,headers:{apikey:key,Authorization:'Bearer '+jwt,'Content-Type':'application/json',Prefer:'return=representation'},body:data===undefined?undefined:JSON.stringify(data),cache:'no-store'});
 if(!response.ok){const text=await response.text();throw Error('Supabase '+response.status+': '+text.slice(0,280))}
 if(response.status===204)return [];const raw=await response.text();return raw?JSON.parse(raw):[];
}
function getSlug(){return document.getElementById('svcSlug')?.value.trim()||''}
function validSlug(slug){return slug&&/^[a-z0-9-]{1,90}$/.test(slug)}
async function verifyService(slug){if(!validSlug(slug))throw Error('Save this service first, then select a video.');
 const rows=await api('services?select=slug&slug=eq.'+encodeURIComponent(slug)+'&limit=1');
 if(!rows.some(x=>x.slug===slug))throw Error('Save the service first; video attachments need an existing service.');
}
async function loadRows(){
 const [all,gs]=await Promise.all([
  api('media_videos?select=id,youtube_id,title,description,visibility,display_order,gallery_id,service_slug&order=display_order.asc&limit=1000'),
  api('portfolio_galleries?select=id,title&limit=1000')
 ]);
 galleryNames=Object.fromEntries(gs.map(x=>[x.id,x.title]));
 collection=Array.from(new Map([...all.filter(v=>!v.gallery_id),...all.filter(v=>v.gallery_id)].filter(x=>isId(x.youtube_id)).map(v=>[v.youtube_id,v])).values());
 currentAssignments=all.filter(v=>v.service_slug===serviceSlug);
}
function currentCard(row){return `<div class="lkm-sv-card" data-sv-item="${escapeHtml(row.id)}"><img loading="lazy" src="${poster(row.youtube_id)}" alt="${escapeHtml(row.title)}"><div class="lkm-sv-card-body"><strong>${escapeHtml(row.title)}</strong><small>${escapeHtml(row.visibility==='public'?'Published on this service':'Not publicly visible · '+row.visibility)}</small><div class="lkm-sv-buttons"><button type="button" data-sv-vis="${escapeHtml(row.id)}">${row.visibility==='public'?'Hide':'Publish'}</button><button type="button" data-sv-remove="${escapeHtml(row.id)}" class="lkm-sv-remove">Remove</button></div></div></div>`}
function redrawSection(){if(!activeSlot||!activeSlot.isConnected)return;
 const list=activeSlot.querySelector('.lkm-sv-current');if(!list)return;
 list.innerHTML=currentAssignments.map(currentCard).join('')||'<p class="lkm-sv-muted">No videos are attached to this service yet. Choose one from your Video Library.</p>';
 const stat=activeSlot.querySelector('[data-sv-count]');if(stat)stat.textContent=currentAssignments.length+' video'+(currentAssignments.length===1?'':'s')+' attached';
}
async function refreshSection(slot=activeSlot){const slug=getSlug();if(!slot||!slot.isConnected)return;
 if(!slug){slot.querySelector('.lkm-sv-current').innerHTML='<p class="lkm-sv-muted">Save the new service first to attach videos.</p>';return}
 serviceSlug=slug;
 try{await loadRows();if(slot.isConnected&&slug===getSlug()){redrawSection()}}
 catch(err){if(slot.isConnected)note(err.message,true)}
}
function addSection(){const editor=root.querySelector('.admin-editor');if(!editor)return;
 if(editor.querySelector('#lkmServiceVideoSection'))return;
 const gallery=root.querySelector('#svcGalleryPreview')?.closest('.field');if(!gallery)return;
 const slot=document.createElement('section');slot.id='lkmServiceVideoSection';slot.className='lkm-sv-section';
 slot.innerHTML=`<h3>Videos for this service</h3><p class="lkm-sv-muted">Choose existing YouTube films from your portfolio. A video can appear in multiple services. Attaching or removing a video saves immediately in Supabase; your photos, packages and prices stay unchanged.</p><div class="lkm-sv-toolbar"><button type="button" class="lkm-sv-action" data-sv-open>+ Choose videos from library</button><span class="lkm-sv-muted" data-sv-count></span></div><div class="lkm-sv-current"><p class="lkm-sv-muted">Loading assigned videos…</p></div><p class="lkm-sv-status" role="status" aria-live="polite" hidden></p>`;
 gallery.after(slot);activeSlot=slot;refreshSection(slot);
}
function addPhotoPickerBridge(){const overlay=document.getElementById('lkmServiceImagePicker');if(!overlay||overlay.querySelector('[data-sv-bridge]'))return;
 const controls=overlay.querySelector('.lkm-picker-controls')||overlay.querySelector('.lkm-picker-head');if(!controls)return;
 const bridge=document.createElement('div');bridge.className='lkm-sv-photo-bridge';bridge.dataset.svBridge='';
 bridge.innerHTML='<p>Videos are managed separately from cover photos. Select an existing YouTube video to add it to this service.</p><button type="button" class="lkm-sv-secondary" data-sv-switch>Choose a video instead</button>';
 controls.after(bridge);
}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;addSection();addPhotoPickerBridge()})}
new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
schedule();
function showModal(trigger){if(busy||modal)return;
 originButton=trigger||document.activeElement;serviceSlug=getSlug();
 if(!validSlug(serviceSlug)){window.alert('Save the service first before attaching videos.');return}
 modal=document.createElement('div');modal.id='lkmServiceVideoPicker';modal.className='lkm-sv-overlay';
 modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Choose videos for service');document.body.appendChild(modal);
 modal.innerHTML='<div class="lkm-sv-dialog"><div class="lkm-sv-head"><h2>Choose service videos</h2></div><p style="padding:24px">Loading videos from your library…</p></div>';
 (async()=>{try{await verifyService(serviceSlug);await loadRows();selected.clear();filteredGallery='';drawModal();}
 catch(e){if(modal){modal.innerHTML='<div class="lkm-sv-dialog"><div class="lkm-sv-head"><h2>Cannot load videos</h2><button type="button" class="lkm-sv-close" data-sv-close aria-label="Close">×</button></div><p style="padding:22px" role="alert">'+escapeHtml(e.message)+'</p></div>'}}})();
}
function uniqueSource(){return collection.filter(v=>isId(v.youtube_id));}
function drawModal(){if(!modal)return;const existingIds=new Set(currentAssignments.map(v=>v.youtube_id));
 modal.innerHTML=`<div class="lkm-sv-dialog"><header class="lkm-sv-head"><div><h2>Add videos to ${escapeHtml(serviceSlug)}</h2><p>Choose one or more videos. They will appear alongside photos in this service's gallery.</p></div><button type="button" class="lkm-sv-close" data-sv-close aria-label="Close">×</button></header>
  <div class="lkm-sv-filter"><label>Search videos<input id="lkmSvSearch" type="search" placeholder="Search YouTube titles" autocomplete="off"></label><label>Source gallery<select id="lkmSvGallery"><option value="">All videos</option>${Object.entries(galleryNames).map(([id,title])=>`<option value="${escapeHtml(id)}">${escapeHtml(title)}</option>`).join('')}</select></label></div>
  <p class="lkm-sv-status" role="status" aria-live="polite" hidden></p>
  <div class="lkm-sv-list">${uniqueSource().map(v=>{const added=existingIds.has(v.youtube_id),group=v.gallery_id?galleryNames[v.gallery_id]||'Portfolio gallery':'Video library';return `<label class="lkm-sv-select-card" data-sv-choice data-added="${added?'1':'0'}" data-gallery="${escapeHtml(v.gallery_id||'')}" data-title="${escapeHtml(v.title.toLowerCase())}"><input type="checkbox" data-sv-id="${escapeHtml(v.youtube_id)}" ${added?'checked disabled':''}><img src="${poster(v.youtube_id)}" loading="lazy" alt=""><strong class="lkm-sv-select-name">${escapeHtml(v.title)}</strong><small>${escapeHtml(added?'Already attached':group)}</small></label>`}).join('')||'<p>No videos available. Import films from your YouTube channel into the Video Library first.</p>'}</div>
  <div class="lkm-sv-manual"><label>YouTube link (optional)<input id="lkmSvNewUrl" placeholder="https://youtube.com/watch?v=..."></label><label>Title for a new video<input id="lkmSvNewTitle" placeholder="Required for new links"></label><button type="button" class="lkm-sv-secondary" data-sv-direct>Add URL</button></div>
  <footer class="lkm-sv-bottom"><span class="lkm-sv-count" data-sv-selected>0 selected · ${uniqueSource().length} available</span><button type="button" class="lkm-sv-secondary" data-sv-close>Cancel</button><button type="button" class="lkm-sv-action" data-sv-attach>Attach selected videos</button></footer></div>`;
 applyFilter();modal.querySelector('#lkmSvSearch')?.focus();
}
function applyFilter(){if(!modal)return;const q=modal.querySelector('#lkmSvSearch')?.value.toLowerCase().trim()||'';
 const gallery=modal.querySelector('#lkmSvGallery')?.value||'';
 modal.querySelectorAll('[data-sv-choice]').forEach(card=>{card.hidden=Boolean((gallery&&card.dataset.gallery!==gallery)||(q&&!card.dataset.title.includes(q)))});
 const count=modal.querySelector('[data-sv-selected]');if(count)count.textContent=selected.size+' selected · '+uniqueSource().length+' available';
}
function closeModal(){if(busy)return;modal?.remove();modal=null;selected.clear();originButton?.focus?.();originButton=null;}
async function attach(videos){if(busy)return;busy=true;try{
 await verifyService(serviceSlug);const existingIds=new Set(currentAssignments.map(r=>r.youtube_id));let added=0;
 for(const v of videos){if(existingIds.has(v.youtube_id))continue;
  try{await api('media_videos',{method:'POST',data:{youtube_id:v.youtube_id,title:v.title,description:v.description||'',gallery_id:null,service_slug:serviceSlug,visibility:'public',display_order:(currentAssignments.length+added+1)*10}});added++;existingIds.add(v.youtube_id)}
  catch(e){if(!e.message.includes('23505'))throw e;existingIds.add(v.youtube_id)}
 }
 await loadRows();redrawSection();busy=false;closeModal();
 if(activeSlot){const stat=activeSlot.querySelector('.lkm-sv-status');if(stat){stat.hidden=false;stat.classList.remove('is-error');stat.textContent=added+' video'+(added===1?'':'s')+' attached to this service. Refresh the public service page to see the changes.'}}
 }catch(e){note(e.message,true)}finally{busy=false}
}
async function removeAssignment(id){const row=currentAssignments.find(x=>x.id===id);if(!row)return;
 if(!confirm('Remove "'+row.title+'" from this service? The YouTube video and its portfolio placements will remain untouched.'))return;
 try{await api('media_videos?id=eq.'+encodeURIComponent(id),{method:'DELETE'});await loadRows();redrawSection();note('Video removed from this service.')}catch(e){note(e.message,true)}
}
async function toggleVisibility(id){const row=currentAssignments.find(x=>x.id===id);if(!row)return;
 try{await api('media_videos?id=eq.'+encodeURIComponent(id),{method:'PATCH',data:{visibility:row.visibility==='public'?'hidden':'public'}});await loadRows();redrawSection();note('Video visibility updated.')}catch(e){note(e.message,true)}
}
root.addEventListener('click',e=>{
 const open=e.target.closest('[data-sv-open]');if(open){showModal(open);return}
 const switcher=e.target.closest('[data-sv-switch]');if(switcher){root.querySelector('#lkmServiceImagePicker [data-picker-action="close"]')?.click();setTimeout(()=>showModal(switcher),0);return}
 const remove=e.target.closest('[data-sv-remove]');if(remove){removeAssignment(remove.dataset.svRemove);return}
 const vis=e.target.closest('[data-sv-vis]');if(vis){toggleVisibility(vis.dataset.svVis)}
});
document.addEventListener('click',e=>{
 if(!modal)return;
 if(e.target===modal||e.target.closest('[data-sv-close]')){closeModal();return}
 if(e.target.closest('[data-sv-attach]')){const vids=uniqueSource().filter(x=>selected.has(x.youtube_id));if(!vids.length){note('Select at least one video.',true);return}attach(vids);return}
 if(e.target.closest('[data-sv-direct]')){const url=modal.querySelector('#lkmSvNewUrl')?.value||'',id=clipId(url);if(!id){note('Enter a valid YouTube or Shorts link.',true);return}
  const known=uniqueSource().find(v=>v.youtube_id===id);const title=known?.title||modal.querySelector('#lkmSvNewTitle')?.value.trim();
  if(!title){note('Enter the title exactly as you want it to appear.',true);return}
  attach([{youtube_id:id,title,description:known?.description||''}]);return}
});
document.addEventListener('change',e=>{
 if(!modal)return;
 if(e.target.matches('[data-sv-id]')){e.target.checked?selected.add(e.target.dataset.svId):selected.delete(e.target.dataset.svId);applyFilter()}
 if(e.target.id==='lkmSvGallery')applyFilter();
});
document.addEventListener('input',e=>{if(modal&&e.target.id==='lkmSvSearch')applyFilter()});
document.addEventListener('keydown',e=>{if(modal&&e.key==='Escape'&&!busy){e.stopImmediatePropagation();closeModal()}});
})();
