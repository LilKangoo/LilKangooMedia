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
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&open){e.preventDefault();close()}});
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
