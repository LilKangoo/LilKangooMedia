/* LilKangooMedia Phase 26 / Command Center.
 * Single admin-only surface for canonical media, multi-placements, galleries, projects and stories.
 * Public projection remains the existing CMS tables, updated via protected SQL RPC.
 * No Stripe/booking write operations, no deletion of original assets. */
import {uuidOK,slugOK,youtubeID,imageURL,clean,esc,safeSearch,tagsFromInput,parseCount,previewURL,isShownInPortfolio,isStoryPublished,galleryKind} from './studio-model.mjs';

const app=document.getElementById('lkmStudio'),store=window.LKMStore,cfg=window.LKM_CONFIG||{};
const base=String(cfg.SUPABASE_URL||'').replace(/\/+$/,''),anon=String(cfg.SUPABASE_ANON_KEY||'');
const PAGE=36;
// One true admin entry point: /admin.html. Specialist editors retain their original code
// in an authenticated, same-origin workspace embedded inside this Command Center.
// Never interpolate URL input into iframe sources; only this constant allowlist is used.
const TOOL_PANELS=Object.freeze({
 services:{title:'Services & Pricing',desc:'Manage services, pricing models, packages and service descriptions.',url:'/admin-legacy.html?embedded=1#services'},
 inquiries:{title:'Enquiries & Bookings',desc:'Review incoming requests and booking enquiries.',url:'/admin-legacy.html?embedded=1#leads'},
 crm:{title:'Sales CRM',desc:'Manage your contacts, pipeline and follow-ups.',url:'/admin-crm.html'},
 quotes:{title:'Quotes & Proposals',desc:'Build quotes using the existing approved workflow.',url:'/admin-quotes.html'},
 calendar:{title:'Availability Calendar',desc:'Manage time slots and availability in your existing calendar.',url:'/admin-calendar.html'},
 reports:{title:'Sales Reports',desc:'View the existing reporting and conversion dashboards.',url:'/admin-reports.html'},
 articles:{title:'Articles & SEO',desc:'Edit blog articles, categories and publishing information.',url:'/admin-legacy.html?embedded=1#articles'},
 reviews:{title:'Customer Reviews',desc:'Moderate and manage approved customer reviews.',url:'/admin-reviews.html'},
 links:{title:'Links Library',desc:'Manage your collection of approved website links.',url:'/admin-links.html'},
});
const CORE_TABS=Object.freeze(['dashboard','media','projects','collections']);
const ALLOWED_TABS=new Set([...CORE_TABS,...Object.keys(TOOL_PANELS)]);
function tabFromLocation(){const val=String(location.hash||'').replace(/^#\/?/,'');return ALLOWED_TABS.has(val)?val:'dashboard'}
const state={tab:tabFromLocation(),ready:false,busy:false,error:'',toast:'',galleries:[],services:[],stories:[],audit:[],
 assets:[],assetCount:0,assetPage:0,mediaType:'all',search:'',folder:'',assetById:new Map(),selected:new Set(),activeAsset:'',placements:[],
 projectId:'',newProject:null,studioCatalog:null,catalogSearch:'',catalogCount:0,uploadStatus:''};

function h(value){return esc(value)}
function pill(value){const kind=String(value||'review').toLowerCase();return `<span class="studio-pill ${['public','published','success'].includes(kind)?'public':['hidden','private'].includes(kind)?'hidden':'review'}">${h(value||'review')}</span>`}
function mediaPreview(a){const url=previewURL(a);return url?`<img loading="lazy" src="${h(url)}" alt="${h(a.alt_text||a.title||'Portfolio media')}">`:'<div class="studio-asset-placeholder">▣</div>'}
function humanDate(v){try{return new Intl.DateTimeFormat('en-GB',{dateStyle:'medium'}).format(new Date(v))}catch{return ''}}
function badge(name){return `<span class="studio-pill">${h(name)}</span>`}
function toast(message,error=false){const el=document.getElementById('studioToast');if(!el)return;el.textContent=String(message);el.className='studio-toast'+(error?' error':'');el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>{if(el.isConnected)el.hidden=true},5600)}
function setBusy(value){state.busy=value;app.querySelectorAll('[data-busy-lock]').forEach(b=>b.disabled=value)}
function safeError(err){return clean(err?.message||err||'Unable to complete the operation.',550)}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
async function api(path,{method='GET',data,count=false,headers={}}={}){
 const jwt=await store.authenticatedToken();
 const hdr={apikey:anon,Authorization:'Bearer '+jwt,Accept:'application/json',...headers};
 if(data!==undefined)hdr['Content-Type']='application/json';
 if(count)hdr.Prefer='count=exact';
 if(method==='POST'&&!count)hdr.Prefer=hdr.Prefer||'return=representation';
 const r=await fetch(base+'/rest/v1/'+path,{method,headers:hdr,body:data===undefined?undefined:JSON.stringify(data),cache:'no-store'});
 if(!r.ok){let msg=await r.text();try{const d=JSON.parse(msg);msg=d.message||d.hint||msg}catch{}throw Error(`${r.status} — ${String(msg).slice(0,310)}`)}
 const payload=await r.text();let rows=[];if(payload){try{rows=JSON.parse(payload)}catch{}}
 return {rows:Array.isArray(rows)?rows:[],count:parseCount(r.headers.get('content-range'))};
}
async function rpc(name,args){const response=await api('rpc/'+name,{method:'POST',data:args});return response.rows}
async function rpcValue(name,args){const token=await store.authenticatedToken();const response=await fetch(base+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:anon,Authorization:'Bearer '+token,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(args)});if(!response.ok){const body=await response.json().catch(()=>({}));throw Error(body.message||body.hint||`RPC ${name}: ${response.status}`)}return response.json().catch(()=>null)}
function countTitle(v){return Number(v||0).toLocaleString('en-GB')}
function navButton(tab,icon,label,count){return `<button type="button" data-action="nav" data-tab="${tab}" class="${state.tab===tab?'active':''}"><span class="nav-icon">${icon}</span><span>${label}</span>${count!=null?`<span class="nav-count">${count}</span>`:''}</button>`}
function navHref(href,icon,label){return `<a href="${href}"><span class="nav-icon">${icon}</span><span>${label}</span></a>`}
function shell(){app.innerHTML=`<div class="studio-shell">
 <aside class="studio-sidebar"><a class="studio-brand" href="/admin.html"><img src="/assets/lkm-v3/brand/logo-profile.png" alt="LilKangooMedia"><span><strong>LilKangooMedia</strong><small>Admin · Command Center</small></span></a>
  <div class="studio-nav-group">Overview & Content</div><nav class="studio-nav" aria-label="Command Center">
  ${navButton('dashboard','⌂','Overview')}${navButton('media','▧','Master Media Library')}${navButton('projects','▱','Projects & Stories',state.galleries.length)}${navButton('collections','▣','Portfolio Collections')}${navButton('articles','▤','Articles & SEO')}${navButton('reviews','★','Customer Reviews')}${navButton('links','↗','Links Library')}
  </nav><div class="studio-nav-group">Sales & Business</div><nav class="studio-nav" aria-label="Business administration">
   ${navButton('services','⚙','Services & Pricing')}${navButton('inquiries','✉','Enquiries & Bookings')}${navButton('crm','◈','Sales CRM')}${navButton('quotes','◇','Quotes & Proposals')}${navButton('calendar','◷','Availability Calendar')}${navButton('reports','▤','Sales Reports')}
  </nav><div class="studio-nav-group">Public Website</div><nav class="studio-nav" aria-label="Public links">
   ${navHref('/portfolio.html','↗','Portfolio')}${navHref('/portfolio.html#/stories','↗','Project Stories')}${navHref('/','↗','View Website')}
  </nav><div class="studio-sidebar-footer">Protected by Supabase Auth &amp; admin RLS.<br><span style="color:var(--gold)">● Gold</span> priority · <span style="color:var(--green)">● Green</span> published · <span style="color:var(--red)">● Red</span> alerts<br>All tools inside your main Admin.</div>
 </aside>
 <div class="studio-main"><header class="studio-topbar"><div><div class="studio-breadcrumb">LilKangooMedia / <b>Admin Command Center</b></div><h1>${h(TOOL_PANELS[state.tab]?.title||({dashboard:'Dashboard',media:'Media Library',projects:'Projects & Stories',collections:'Portfolio Collections'})[state.tab]||'Admin')}</h1></div><div class="studio-top-actions"><a class="studio-btn ghost" href="/admin-legacy.html" target="_blank" rel="noopener noreferrer" title="Emergency classic administrator">Classic backup ↗</a><a class="studio-btn ghost" href="/portfolio.html" target="_blank" rel="noopener noreferrer">Live website ↗</a><button class="studio-btn ghost" data-action="refresh">↻ Refresh</button><span class="studio-avatar" aria-label="Administrator">LKM</span><button class="studio-btn ghost" data-action="logout">Sign out</button></div></header>
 <main class="studio-content" id="studioContent">${content()}</main></div></div><div id="studioToast" class="studio-toast" role="status" hidden></div>
 <dialog id="studioDialog" class="studio-dialog"></dialog>`}
function embeddedTool(tab){
 const tool=TOOL_PANELS[tab];if(!tool)return '';
 // Constant same-origin path from trusted allowlist, never from a user-supplied string.
 return `<section class="studio-tool-workspace" aria-label="${h(tool.title)} workspace">
  <header class="studio-tool-heading"><div><p class="studio-eyebrow">BUSINESS MANAGEMENT · INSIDE ADMIN</p><h2>${h(tool.title)}</h2><p>${h(tool.desc)}</p></div><a class="studio-btn ghost" href="${tool.url}" target="_blank" rel="noopener noreferrer">Open full screen ↗</a></header>
  <iframe class="studio-tool-frame" id="studioToolFrame" title="${h(tool.title)}" src="${tool.url}" loading="eager" referrerpolicy="same-origin"></iframe>
  <p class="studio-help studio-tool-footnote">This is your existing protected tool inside Command Center. Edits use the original Supabase permissions and business logic. Save changes before switching to another section.</p>
 </section>`;
}
function content(){if(TOOL_PANELS[state.tab])return embeddedTool(state.tab);
 if(state.error)return `<div class="studio-alert error"><strong>Command Center content could not load.</strong><p>${h(state.error)}</p><p>Your original tools are preserved at <a href="/admin-legacy.html" style="color:var(--gold)">Classic Admin ↗</a>. If this error persists, check the Phase 26 SQL migration.</p><button class="studio-btn" data-action="refresh">Retry connection</button></div>`;
 return state.tab==='dashboard'?dashboard():state.tab==='media'?mediaView():projectView(state.tab==='collections');}
function head(eyebrow,title,description,buttons=''){return `<div class="studio-head"><div><p class="studio-eyebrow">${eyebrow}</p><h1>${title}</h1><p>${description}</p></div><div class="studio-buttons">${buttons}</div></div>`}
function stat(title,val,icon,note){return `<section class="studio-kpi"><div class="kpi-icon">${icon}</div><small>${title}</small><strong>${countTitle(val)}</strong><em>${note}</em></section>`}
function dashboard(){
 const projects=state.galleries.filter(g=>galleryKind(g.portfolio_kind)==='project');
 const pub=state.stories.filter(s=>isStoryPublished(s,state.galleries.find(g=>g.id===s.gallery_id)));
 const pending=state.stories.filter(s=>!s.is_published);
 const buttons=`<button class="studio-btn primary" data-action="nav" data-tab="media">+ Manage media</button><button class="studio-btn gold" data-action="new-project" data-kind="project">+ Create project</button>`;
 return head('ONE WORKSPACE · ALL CREATIVE CONTENT','Welcome to your Command Center','Manage reusable photography, films, portfolio collections, project stories and publishing from one place.',buttons)+
 `<div class="studio-kpis">${stat('Unique media assets',state.assetCount,'▧','Canonical records · no duplicate uploads')}${stat('Projects',projects.length,'▱','Project workspace')}${stat('Published stories',pub.length,'▤','Stories behind the work')}${stat('Portfolio collections',state.galleries.filter(g=>galleryKind(g.portfolio_kind)==='collection').length,'▣','Curated visual folders')}</div>
 <div class="studio-columns"><section class="studio-panel studio-pad"><div class="studio-card-head"><h2>Portfolio & Projects</h2><button class="studio-btn ghost" data-action="nav" data-tab="projects">Manage ↗</button></div>
  <div class="studio-list">${state.galleries.slice(0,8).map(g=>`<div class="studio-record"><div class="record-symbol">${galleryKind(g.portfolio_kind)==='project'?'▱':'▣'}</div><div class="studio-record-body"><strong>${h(g.title)}</strong><small>${h(g.portfolio_kind||'collection')} · ${h(g.slug)} · ${isShownInPortfolio(g)?'Listed in Portfolio':'No separate Portfolio card'}</small></div>${pill(g.visibility)}<button data-action="open-project" data-id="${g.id}">Edit ↗</button></div>`).join('')||'<div class="studio-empty">No galleries found.</div>'}</div></section>
 <section class="studio-panel studio-pad"><div class="studio-card-head"><h2>Publishing & Activity</h2>${pill(`${pending.length} drafts`)}</div><p class="studio-help">These values are read from your Supabase account. No invented views or revenue figures.</p><div class="studio-list">${state.audit.length?state.audit.slice(0,8).map(x=>`<div class="studio-record"><div class="record-symbol">↻</div><div class="studio-record-body"><strong>${h(x.action)}</strong><small>${humanDate(x.created_at)} · ${h(x.context?.visibility||'Portfolio Studio')}</small></div></div>`).join(''):'<div class="studio-empty">No Studio actions yet. Your first media assignment will appear here.</div>'}</div><p class="studio-help" style="margin-top:18px">The sales, bookings and reports modules remain accessible from the left navigation. This Command Center does not initiate payments or refunds.</p></section></div>`;
}
function folderButton(id,label,count,icon='▣'){
 return `<button type="button" class="studio-folder ${state.folder===id?'active':''}" data-action="folder" data-id="${h(id)}"><span>${icon}</span><span>${h(label)}</span>${count!=null?`<span>${count}</span>`:''}</button>`;
}
function mediaView(){const active=state.assetById.get(state.activeAsset);
 const targets=state.galleries.filter(g=>g.visibility==='public');
 return head('CANONICAL MEDIA · REUSABLE ASSETS','Media Library','One original photograph or video, many assignments. Choose a project, portfolio collection or service without uploading the same file again.',
 '<button class="studio-btn" data-action="browse-index">⌕ Browse website files</button><button class="studio-btn" data-action="upload">↑ Upload photos</button><button class="studio-btn gold" data-action="add-source">+ Add image / YouTube</button>')+
 `<div class="studio-workspace">
 <section class="studio-panel studio-pad studio-folders"><div class="studio-card-head"><h3>Folders & Projects</h3></div><div class="folder-scroll">${folderButton('','All media',null,'▧')}${state.galleries.map(g=>folderButton(g.id,g.title,null,g.portfolio_kind==='project'?'▱':'▣')).join('')}</div><p class="studio-help">Folders are logical assignments, not copies of your original images.</p></section>
 <section class="studio-panel studio-pad studio-media-main"><div class="studio-card-head"><h2>${state.folder?h(state.galleries.find(g=>g.id===state.folder)?.title||'Folder'):'All media assets'}</h2><span class="studio-pill">${countTitle(state.assetCount)} results</span></div>
 <div class="studio-media-controls"><input id="studioSearch" class="studio-search" type="search" placeholder="Search titles, image URLs or YouTube IDs…" value="${h(state.search)}" aria-label="Search media"><div class="studio-segments" role="group" aria-label="Media type">${['all','image','youtube'].map(t=>`<button data-action="media-type" data-type="${t}" class="${state.mediaType===t?'active':''}">${t==='all'?'All':t==='image'?'Photos':'Videos'}</button>`).join('')}</div></div>
 <div class="studio-bulk"><label><input id="studioSelectAll" type="checkbox" ${state.assets.length&&state.assets.every(a=>state.selected.has(a.id))?'checked':''}> Select page</label><b>${state.selected.size} selected</b><div class="studio-buttons"><button class="studio-btn primary" data-action="assign" ${state.selected.size||active?'':'disabled'}>⇄ Assign to…</button><button class="studio-btn" data-action="clear-selected">Clear</button></div></div>
 <div class="studio-media-grid">${state.assets.map(a=>`<article class="studio-asset ${state.selected.has(a.id)?'selected':''} ${state.activeAsset===a.id?'active':''}"><input type="checkbox" class="asset-check" data-media-select="${a.id}" aria-label="Select ${h(a.title)}" ${state.selected.has(a.id)?'checked':''}><button class="studio-asset-button" data-action="inspect" data-id="${a.id}" type="button">${mediaPreview(a)}${a.media_type==='youtube'?'<span class="studio-video-badge">▶ VIDEO</span>':''}<span class="asset-name" title="${h(a.title)}">${h(a.title||a.youtube_id||a.image_url)}</span><span class="asset-meta">${a.media_type==='image'?'PHOTO':'YOUTUBE'} · ${humanDate(a.created_at)}</span></button></article>`).join('')||'<div class="studio-empty" style="grid-column:1/-1">No matching assets. Add an image, import an existing website file or change filters.</div>'}</div>
 <div class="studio-pagination"><button type="button" data-action="page-prev" ${state.assetPage<=0?'disabled':''}>← Previous</button><span>Page ${state.assetPage+1} · ${state.assetCount} matching records</span><button type="button" data-action="page-next" ${(state.assetPage+1)*PAGE>=state.assetCount?'disabled':''}>Next →</button></div>
 </section><section class="studio-panel studio-pad studio-inspector">${inspector(active)}</section></div>`;
}
function inspector(a){if(!a)return `<p class="studio-eyebrow">INSPECTOR</p><h2>Select an asset</h2><p class="studio-help">Inspect where a photo or video is used, update its metadata and change individual placements.</p><div class="studio-empty">Choose a thumbnail from the centre grid. Check multiple items to assign them in bulk.</div>`;
 const uses=state.placements;
 return `<p class="studio-eyebrow">ASSET INSPECTOR</p>${previewURL(a)?`<img class="studio-inspector-art" src="${h(previewURL(a))}" alt="${h(a.alt_text||a.title)}">`:''}
 <h3>${h(a.title||'Untitled media')}</h3><p class="studio-help">${a.media_type==='image'?'PHOTO':'YOUTUBE'} · ${h(a.youtube_id||a.image_url||'')}<br>Added ${humanDate(a.created_at)}</p>
 <form id="studioAssetForm"><input type="hidden" name="id" value="${a.id}"><label class="studio-field">Title<input class="studio-input" name="title" value="${h(a.title||'')}" maxlength="180" required></label>
 ${a.media_type==='image'?`<label class="studio-field">Image ALT text<input class="studio-input" name="alt_text" value="${h(a.alt_text||'')}" maxlength="220"></label>`:''}
 <label class="studio-field">Tags (comma-separated)<input class="studio-input" name="tags" value="${h((a.tags||[]).join(', '))}" maxlength="450"></label>
 <label class="studio-field">Internal description<textarea class="studio-textarea" name="description" maxlength="1500">${h(a.description||'')}</textarea></label><p class="studio-help">These are master-library metadata. Existing per-gallery captions, ALT text and video titles stay independent. Edit them in the current gallery editor when needed.</p>
 <button class="studio-btn gold" type="submit" data-busy-lock>Save metadata</button></form><hr class="studio-form-divider">
 <div class="studio-card-head"><h3>Assignments & usage</h3><button type="button" class="studio-btn primary" data-action="assign">+ Assign</button></div>
 ${uses.length?uses.map(p=>{const dest=p.gallery_id?state.galleries.find(g=>g.id===p.gallery_id)?.title:state.services.find(s=>s.slug===p.service_slug)?.title;
 return `<div class="studio-placement"><div style="flex:1;min-width:0"><strong>${h(dest||p.service_slug||'Gallery')}</strong><small>${p.gallery_id?'Gallery / Project':'Service'} · ${h(p.visibility)}</small><div class="studio-place-tools"><label>Order <input class="studio-place-order" data-place-order="${p.id}" type="number" value="${Number(p.display_order||100)}" min="0" max="100000"></label><button type="button" class="studio-btn ghost" data-action="save-order" data-asset="${a.id}" data-place-id="${p.id}" data-gallery="${p.gallery_id||''}" data-service="${h(p.service_slug||'')}" data-next="${h(p.visibility)}">Save</button>${a.media_type==='image'&&p.gallery_id&&p.legacy_photo_id&&p.visibility==='public'?`<button type="button" class="studio-btn gold" data-action="set-cover" data-gallery="${p.gallery_id}" data-photo="${p.legacy_photo_id}">Set cover</button>`:''}</div></div><button class="studio-btn ${p.visibility==='public'?'danger':'primary'}" data-action="toggle-place" data-asset="${a.id}" data-gallery="${p.gallery_id||''}" data-service="${h(p.service_slug||'')}" data-next="${p.visibility==='public'?'hidden':'public'}" data-order="${p.display_order||100}">${p.visibility==='public'?'Hide':'Publish'}</button></div>`}).join(''):'<p class="studio-help">No assignments yet. Add this asset to a collection, project or service.</p>'}
 <p class="studio-help">Hiding a placement does not delete its source file or the other places where it is used.</p>`;
}
function projectView(collectionsOnly=false){
 const list=state.galleries.filter(g=>collectionsOnly?galleryKind(g.portfolio_kind)==='collection':true);
 const g=state.newProject||list.find(x=>x.id===state.projectId)||list[0];
 const story=g?.id?state.stories.find(s=>s.gallery_id===g.id):null;
 const buttons=`<button type="button" class="studio-btn primary" data-action="new-project" data-kind="project">+ New Project</button><button type="button" class="studio-btn gold" data-action="new-project" data-kind="collection">+ New Collection</button>`;
 return head(collectionsOnly?'CURATED PORTFOLIO FOLDERS':'PROJECT HUB · CASE STUDIES',collectionsOnly?'Collections & Folders':'Projects & Stories',
 'Keep the story, gallery and media assignments together. A project story can be public while its separate portfolio gallery card stays hidden.',buttons)+
 `<div class="studio-editor-layout"><section class="studio-panel studio-project-list"><div class="studio-card-head"><h3>${collectionsOnly?'Collections':'All projects & galleries'}</h3>${badge(`${list.length} total`)}</div>
 ${list.map(p=>`<button type="button" class="studio-project-choice ${!state.newProject&&g?.id===p.id?'active':''}" data-action="open-project" data-id="${p.id}"><strong>${h(p.title)}</strong><small>${h(galleryKind(p.portfolio_kind))} · ${h(p.slug)} · ${h(p.visibility)} ${p.show_in_portfolio===false?' · Card hidden':''}</small></button>`).join('')||'<p class="studio-help">No collections yet. Create one to group images from several projects.</p>'}</section>
 <section class="studio-panel studio-project-form">${g?projectEditor(g,story):'<div class="studio-empty">Select a project or create a collection.</div>'}</section></div>`;
}
function projectEditor(g,story){const fresh=!g.id,kind=galleryKind(g.portfolio_kind);
 return `<div class="studio-card-head"><div><p class="studio-eyebrow">${fresh?'CREATE NEW':'MANAGE PROJECT'}</p><h2>${h(g.title||'New Portfolio Folder')}</h2></div>${fresh?pill('draft'):pill(g.visibility)}</div>
 <form id="studioProjectForm"><input type="hidden" name="id" value="${h(g.id||'')}">
  <div class="studio-form-grid"><label class="studio-field">Title *<input name="title" class="studio-input" maxlength="180" value="${h(g.title||'')}" required></label><label class="studio-field">URL slug *<input name="slug" class="studio-input" maxlength="90" pattern="[a-z0-9-]+" value="${h(g.slug||'')}" ${fresh?'':'readonly'} required><small>${fresh?'Lowercase, numbers and hyphens.':'Existing URLs stay stable.'}</small></label></div>
  <div class="studio-form-grid"><label class="studio-field">Type<select name="portfolio_kind" class="studio-select"><option value="project" ${kind==='project'?'selected':''}>Project (client work)</option><option value="collection" ${kind==='collection'?'selected':''}>Collection / visual folder</option></select></label>
  <label class="studio-field">Category<input name="category" class="studio-input" value="${h(g.category||'Photography')}" maxlength="90"></label></div>
  <label class="studio-field">Description<textarea name="description" class="studio-textarea" maxlength="3500">${h(g.description||'')}</textarea></label>
  <div class="studio-form-grid"><label class="studio-field">Client name<input name="client_name" class="studio-input" value="${h(g.client_name||'')}" maxlength="140"></label>
  <label class="studio-field">Related service<select name="related_service_slug" class="studio-select"><option value="">No service</option>${state.services.map(s=>`<option value="${h(s.slug)}" ${s.slug===g.related_service_slug?'selected':''}>${h(s.title)}</option>`).join('')}</select></label></div>
  <div class="studio-form-grid"><label class="studio-field">Gallery access<select name="visibility" class="studio-select"><option value="review" ${g.visibility==='review'?'selected':''}>Review / draft</option><option value="public" ${g.visibility==='public'?'selected':''}>Public</option><option value="private" ${g.visibility==='private'?'selected':''}>Private</option></select></label><label class="studio-field">Gallery sort order<input type="number" name="display_order" class="studio-input" value="${Number(g.display_order||100)}" min="0" max="100000"></label></div>
  <div class="studio-toggle-line"><div><label><input type="checkbox" name="show_in_portfolio" ${g.show_in_portfolio!==false?'checked':''}> Show a gallery card in Portfolio</label><p>Turn off for a project that already appears in Stories, preventing a duplicate card. Its direct gallery link still works.</p></div>${pill(g.show_in_portfolio!==false?'Visible card':'No card')}</div>
  <div class="studio-form-actions"><button type="submit" class="studio-btn primary" data-busy-lock>${fresh?'Create folder':'Save project settings'}</button>${!fresh?`<button type="button" class="studio-btn" data-action="open-folder-media" data-id="${g.id}">▧ Manage media</button><a class="studio-btn ghost" href="/portfolio.html#/gallery/${encodeURIComponent(g.slug)}" target="_blank" rel="noopener noreferrer">Preview gallery ↗</a>`:''}</div></form>
 ${fresh?'<div class="studio-empty" style="margin-top:20px">Create this project first, then add media and a Case Study.</div>':storyEditor(g,story)}`;
}
function storyEditor(g,story){const s=story||{};
 return `<div class="studio-stories-box"><div class="studio-card-head"><div><div class="studio-section-label">Story / Project Journal</div><h2>Stories behind the work</h2><p class="studio-help">Separate from the gallery-card visibility setting above.</p></div>${s.is_published?pill('public'):pill('draft')}</div>
 <form id="studioStoryForm"><input type="hidden" name="gallery_id" value="${g.id}">
 <label class="studio-field">Story headline<input class="studio-input" name="headline" maxlength="180" value="${h(s.headline||'')}" placeholder="The client and the project"></label>
 <label class="studio-field">Project objective<textarea class="studio-textarea" name="objective" maxlength="2500" rows="3">${h(s.objective||'')}</textarea></label>
 <label class="studio-field">Our approach<textarea class="studio-textarea" name="approach" maxlength="3500" rows="5">${h(s.approach||'')}</textarea></label>
 <label class="studio-field">Deliverables (one per line)<textarea class="studio-textarea" name="deliverables" maxlength="3100" rows="4">${h((s.deliverables||[]).join('\n'))}</textarea></label>
 <label class="studio-field">Documented outcomes<textarea class="studio-textarea" name="outcomes" maxlength="2500" rows="3">${h(s.outcomes||'')}</textarea></label>
 <div class="studio-form-grid"><label class="studio-field">Public client label<input class="studio-input" name="client_label" maxlength="140" value="${h(s.client_label||'')}"></label>
 <label class="studio-field">Location<input class="studio-input" name="project_location" maxlength="120" value="${h(s.project_location||'')}"></label></div>
 <label class="studio-field">Project year<input class="studio-input" name="project_year" type="number" min="2000" max="2100" value="${h(s.project_year||'')}"></label>
 <div class="studio-toggle-line"><div><label><input type="checkbox" name="is_published" ${s.is_published?'checked':''}> Publish the story</label><p>Requires a public gallery, headline, objective and approach. A story can be public even if its separate gallery card is hidden.</p></div></div>
 <div class="studio-form-actions"><button class="studio-btn gold" type="submit" data-busy-lock>Save Case Study</button><a class="studio-btn ghost" href="/portfolio.html#/story/${encodeURIComponent(g.slug)}" target="_blank" rel="noopener noreferrer">Read story ↗</a></div>
 </form></div>`;
}
async function loadBase(){
 const [gs,services,stories,audit]=await Promise.all([
  api('portfolio_galleries?select=*&order=display_order.asc&limit=1000'),
  api('services?select=slug,title,active&order=sort_order.asc&limit=1000'),
  api('lkm_case_studies?select=*&order=updated_at.desc&limit=1000'),
  api('lkm_studio_audit?select=*&order=created_at.desc&limit=12').catch(()=>({rows:[]}))
 ]);
 state.galleries=gs.rows;state.services=services.rows;state.stories=stories.rows;state.audit=audit.rows;
 if(!state.projectId||!state.galleries.some(g=>g.id===state.projectId))state.projectId=state.galleries[0]?.id||'';
}
async function loadAssets(){
 let path;
 if(state.folder){
  // Query the existing placement index in small pages, not thousands of UUIDs in a single URL.
  const result=await api('lkm_studio_placements?select=asset_id&gallery_id=eq.'+encodeURIComponent(state.folder)+'&visibility=neq.hidden&order=display_order.asc&limit='+PAGE+'&offset='+(state.assetPage*PAGE),{count:true});
  const ids=result.rows.map(p=>p.asset_id).filter(uuidOK);
  state.assetCount=result.count??result.rows.length;
  if(!ids.length){state.assets=[];return}
  path='lkm_studio_assets?select=*&id=in.('+ids.join(',')+')&limit='+PAGE;
  const data=await api(path);state.assets=data.rows;
  state.assets.sort((a,b)=>ids.indexOf(a.id)-ids.indexOf(b.id));
  // Folder search acts on the current page of placements; global search covers all assets.
  if(state.search){const search=state.search.toLowerCase();state.assets=state.assets.filter(a=>(a.title+' '+a.alt_text+' '+a.image_url+' '+a.youtube_id+' '+(a.tags||[]).join(' ')).toLowerCase().includes(search));}
  if(state.mediaType!=='all')state.assets=state.assets.filter(a=>a.media_type===state.mediaType);
 }else{
  const qs=new URLSearchParams();qs.set('select','*');qs.set('order','created_at.desc');qs.set('limit',String(PAGE));qs.set('offset',String(state.assetPage*PAGE));
  if(state.mediaType!=='all')qs.set('media_type','eq.'+state.mediaType);
  const search=safeSearch(state.search);if(search)qs.set('or',`(title.ilike.*${search}*,alt_text.ilike.*${search}*,image_url.ilike.*${search}*,youtube_id.ilike.*${search}*)`);
  const data=await api('lkm_studio_assets?'+qs.toString(),{count:true});state.assets=data.rows;state.assetCount=data.count??data.rows.length;
 }
 for(const a of state.assets)state.assetById.set(a.id,a);
 if(!state.assets.some(a=>a.id===state.activeAsset)){state.activeAsset=state.assets[0]?.id||'';await loadPlacements();}
}
async function loadPlacements(){
 state.placements=[];
 if(!uuidOK(state.activeAsset))return;
 const result=await api('lkm_studio_placements?select=*&asset_id=eq.'+state.activeAsset+'&order=display_order.asc&limit=200');
 state.placements=result.rows;
}
async function refreshAll(){state.error='';await loadBase();await loadAssets();state.ready=true;shell()}
function showLogin(message=''){
 app.innerHTML=`<div class="studio-auth"><div class="studio-auth-card"><img src="/assets/lkm-v3/brand/logo-profile.png" alt="LilKangooMedia"><p class="studio-eyebrow">PROTECTED COMMAND CENTER</p><h1>Welcome back.</h1><p>Sign in with your existing LilKangooMedia administrator account to manage portfolio assets, projects and stories.</p>
 ${message?`<div class="studio-alert error">${h(message)}</div>`:''}
 <form id="studioLogin"><label class="studio-field">Email<input name="email" type="email" autocomplete="username" class="studio-input" required></label><label class="studio-field">Password<input name="password" type="password" autocomplete="current-password" class="studio-input" required></label><button type="submit" class="studio-btn primary">Sign in to Command Center →</button></form>
 <p class="studio-help" style="margin-top:18px">Your credentials are verified by the existing Supabase Auth system. No passwords are stored in this page.</p><a class="studio-btn ghost" href="/admin-legacy.html">Open classic backup ↗</a></div></div>`;
}
function openDialog(html){const d=document.getElementById('studioDialog');if(!d)return;d.innerHTML=html;d.showModal();}
function closeDialog(){document.getElementById('studioDialog')?.close()}
function dialog(title,body,footer=''){return `<div class="studio-dialog-head"><h2>${title}</h2><button class="studio-btn ghost" type="button" data-action="close-dialog" aria-label="Close modal">× Close</button></div><div class="studio-dialog-body">${body}</div>${footer?`<div class="studio-dialog-footer">${footer}</div>`:''}`}
function assignModal(){
 const ids=state.selected.size?[...state.selected]:(state.activeAsset?[state.activeAsset]:[]);if(!ids.length){toast('Select at least one photo or video.',true);return;}
 const choices=state.galleries.map(g=>`<label class="studio-target"><input type="checkbox" name="target" value="gallery:${g.id}"><span><strong>${h(g.title)}</strong><small>${h(g.portfolio_kind||'collection')} · ${h(g.visibility)}</small></span></label>`).join('')+
 state.services.filter(s=>s.active!==false).map(s=>`<label class="studio-target"><input type="checkbox" name="target" value="service:${h(s.slug)}"><span><strong>${h(s.title)}</strong><small>Service page</small></span></label>`).join('');
 openDialog(dialog(`Assign ${ids.length} asset${ids.length===1?'':'s'}`,`<form id="studioAssignForm"><p class="studio-help">Assign once to multiple projects, collections or services. Existing photos or videos are not copied. Assignments can be hidden independently.</p>
 <div class="studio-section-label">Destinations</div><div class="studio-target-list">${choices||'<p>No target projects.</p>'}</div>
 <div class="studio-form-grid" style="margin-top:18px"><label class="studio-field">Visibility<select class="studio-select" name="visibility"><option value="public">Public (visible on live page)</option><option value="review" selected>Review (not published yet)</option><option value="hidden">Hidden (archive placement)</option></select></label>
 <label class="studio-field">Sort order<input class="studio-input" name="display_order" type="number" value="100" min="0" max="100000"></label></div>
 <p class="studio-help">Public media only displays on a public gallery/service. Publishing a story and displaying a gallery card are separate controls.</p>
 <button class="studio-btn primary" type="submit" data-busy-lock>Apply assignments</button></form>`));
}
function addSourceModal(){openDialog(dialog('Add media to master library',`<form id="studioSourceForm"><p class="studio-help">An image URL or YouTube ID is indexed once. You can then attach it to as many folders or projects as needed.</p><label class="studio-field">Media type<select class="studio-select" name="media_type"><option value="image">Image (HTTPS or /assets/ URL)</option><option value="youtube">YouTube Video / Short</option></select></label><label class="studio-field">Image URL or YouTube link / ID<input class="studio-input" name="source" required placeholder="https://... or https://youtube.com/shorts/..." maxlength="1700"></label><label class="studio-field">Title<input class="studio-input" name="title" maxlength="180" placeholder="Portfolio photograph or film title"></label><button class="studio-btn primary" type="submit" data-busy-lock>Add to library</button></form>`));}
function uploadModal(){openDialog(dialog('Upload new photographs',`<form id="studioUploadForm"><p class="studio-help">JPG, PNG or WebP · maximum 8 MB each · up to 15 files per batch. Stored once in the existing public portfolio bucket; unpublished until added to a public placement.</p><label class="studio-field">Select images<input class="studio-input" type="file" name="files" accept="image/jpeg,image/png,image/webp" multiple required></label><label class="studio-field">Initial visibility<input class="studio-input" value="Library only — not published" disabled></label><button type="submit" class="studio-btn primary" data-busy-lock>Upload into master library</button></form>`));}
function websiteCatalogModal(){state.catalogSearch='';openDialog(dialog('Import existing website photographs',`<div><label class="studio-field">Search indexed filenames<input id="studioCatalogSearch" class="studio-search" placeholder="e.g. golf, nature, portrait" autocomplete="off"></label><p class="studio-help" id="studioCatalogStatus">Loading original website assets…</p><div class="studio-media-grid" id="studioCatalogGrid"></div></div>`));void loadWebsiteCatalog()}
function renderCatalogGrid(){const target=document.getElementById('studioCatalogGrid'),status=document.getElementById('studioCatalogStatus');if(!target)return;
 if(!state.studioCatalog){status.textContent='Original media catalog is unavailable.';return}
 const q=state.catalogSearch.toLowerCase();const filtered=state.studioCatalog.filter(x=>(x.path+' '+(x.file||'')).toLowerCase().includes(q));status.textContent=`${countTitle(filtered.length)} matching indexed files · showing first ${Math.min(filtered.length,32)}`;
 target.innerHTML=filtered.slice(0,32).map((x,i)=>{
 const valid=imageURL(x.url);if(!valid)return '';
 return `<article class="studio-asset"><button type="button" class="studio-asset-button" data-action="import-site-asset" data-url="${h(valid)}" data-title="${h(clean(x.file||x.path,180))}"><img loading="lazy" src="${h(valid)}" alt=""><span class="asset-name">${h(x.file||x.path)}</span><span class="asset-meta">Use existing file ↗</span></button></article>`;}).join('');
}
async function loadWebsiteCatalog(){try{const r=await fetch('/api/media-catalog',{headers:{Accept:'application/json'}});const json=await r.json();if(!r.ok||!Array.isArray(json.images))throw Error(json.error||'Catalog not accessible');state.studioCatalog=json.images;renderCatalogGrid()}catch(e){state.studioCatalog=[];const x=document.getElementById('studioCatalogStatus');if(x)x.textContent='Website media catalog unavailable: '+safeError(e)}}
async function refreshSection(){
 if(TOOL_PANELS[state.tab]){const frame=app.querySelector('#studioToolFrame');if(frame){frame.src=TOOL_PANELS[state.tab].url;toast('Current tool refreshed.');}return;}
 try{state.error='';await loadBase();await loadAssets();shell()}catch(e){state.error=safeError(e);shell();toast('Reload failed: '+safeError(e),true)}
}
async function changeTab(next,{updateHash=true}={}){
 if(!ALLOWED_TABS.has(next))return;
 // Only navigate after a confirmed selection, keeping a single /admin.html address.
 state.tab=next;state.newProject=null;
 if(next==='media'&&!state.error)await loadAssets();
 shell();
 if(updateHash&&location.hash!=='#'+next)location.hash='#'+next;
}
window.addEventListener('hashchange',()=>{
 const next=tabFromLocation();
 if(next!==state.tab)void changeTab(next,{updateHash:false}).catch(e=>toast(safeError(e),true));
});
async function registerAsset(kind,source,title){const mtype=kind==='youtube'?'youtube':'image';const src=mtype==='youtube'?youtubeID(source):imageURL(source);
 if(!src)throw Error(mtype==='youtube'?'Enter a valid YouTube video or Shorts URL.':'Use an HTTPS photo URL or a /assets/... image path.');
 return await rpcValue('lkm_studio_register_asset',{p_media_type:mtype,p_source:src,p_title:clean(title,180)});
}
async function assignOne(assetId,destination,visibility,order=100){const data={p_asset_id:assetId,p_gallery_id:null,p_service_slug:null,p_visibility:visibility,p_display_order:order};
 if(destination.startsWith('gallery:')){data.p_gallery_id=destination.slice(8);if(!uuidOK(data.p_gallery_id))throw Error('Invalid gallery')}
 else if(destination.startsWith('service:')){data.p_service_slug=destination.slice(8);if(!slugOK(data.p_service_slug))throw Error('Invalid service')}
 else throw Error('Unknown destination');
 return rpcValue('lkm_studio_assign',data);
}
async function handleAction(action,element){if(state.busy&&action!=='close-dialog')return;
 if(action==='close-dialog'){closeDialog();return}
 if(action==='nav'){await changeTab(element.dataset.tab);return}
 if(action==='refresh'){await refreshSection();toast('Command Center refreshed.');return}
 if(action==='logout'){store.logout();showLogin();return}
 if(action==='new-project'){state.newProject={title:'',slug:'',category:'Photography',description:'',portfolio_kind:element.dataset.kind==='collection'?'collection':'project',visibility:'review',show_in_portfolio:element.dataset.kind==='collection',display_order:100};state.tab=element.dataset.kind==='collection'?'collections':'projects';shell();return}
 if(action==='open-project'){if(!uuidOK(element.dataset.id))return;state.newProject=null;state.projectId=element.dataset.id;state.tab='projects';shell();return}
 if(action==='open-folder-media'){state.folder=element.dataset.id;state.assetPage=0;state.tab='media';await loadAssets();shell();return}
 if(action==='folder'){state.folder=element.dataset.id||'';state.assetPage=0;await loadAssets();shell();return}
 if(action==='media-type'){state.mediaType=element.dataset.type||'all';state.assetPage=0;await loadAssets();shell();return}
 if(action==='page-prev'){state.assetPage=Math.max(0,state.assetPage-1);await loadAssets();shell();return}
 if(action==='page-next'){if((state.assetPage+1)*PAGE>=state.assetCount)return;state.assetPage+=1;await loadAssets();shell();return}
 if(action==='inspect'){if(!uuidOK(element.dataset.id))return;state.activeAsset=element.dataset.id;await loadPlacements();shell();return}
 if(action==='clear-selected'){state.selected.clear();shell();return}
 if(action==='assign'){assignModal();return}
 if(action==='add-source'){addSourceModal();return}
 if(action==='upload'){uploadModal();return}
 if(action==='browse-index'){websiteCatalogModal();return}
 if(action==='set-cover'){
  const gallery=element.dataset.gallery,photo=element.dataset.photo;
  if(!uuidOK(gallery)||!uuidOK(photo))return;
  setBusy(true);try{await api('portfolio_galleries?id=eq.'+gallery,{method:'PATCH',data:{cover_image_id:photo}});await loadBase();shell();toast('Gallery cover updated. No original asset was modified.');}catch(e){toast(safeError(e),true)}finally{setBusy(false)}return;
 }
 if(action==='save-order'){
  const input=app.querySelector('input[data-place-order="'+element.dataset.placeId+'"]');
  const order=Number(input?.value);if(!Number.isInteger(order)||order<0||order>100000){toast('Enter a sort order from 0 to 100000.',true);return}
  const target=element.dataset.gallery?'gallery:'+element.dataset.gallery:'service:'+element.dataset.service;
  setBusy(true);try{await assignOne(element.dataset.asset,target,element.dataset.next,order);await loadPlacements();shell();toast('Display order saved.');}catch(e){toast(safeError(e),true)}finally{setBusy(false)}return;
 }
 if(action==='toggle-place'){
   const asset=element.dataset.asset,service=element.dataset.service,gallery=element.dataset.gallery;
   if(!uuidOK(asset))return;const target=gallery?'gallery:'+gallery:'service:'+service;
   const next=element.dataset.next;
   if(next==='hidden'&&!confirm('Hide this placement on the website? Other placements and the original asset will stay intact.'))return;
   setBusy(true);
   try{await assignOne(asset,target,next,Number(element.dataset.order)||100);await loadPlacements();shell();toast(next==='public'?'Placement published.':'Placement hidden; original media preserved.')}catch(e){toast(safeError(e),true)}finally{setBusy(false)}
   return;
 }
 if(action==='import-site-asset'){
  setBusy(true);try{
   const id=await registerAsset('image',element.dataset.url,element.dataset.title);
   if(!uuidOK(id))throw Error('Asset registration did not return an ID.');
   state.activeAsset=id;state.selected.clear();state.selected.add(id);state.folder='';state.search='';state.mediaType='all';state.assetPage=0;
   closeDialog();await loadAssets();await loadPlacements();shell();toast('Existing photo indexed without creating another image file. Assign it to folders or projects.');
  }catch(e){toast(safeError(e),true)}finally{setBusy(false)}return;
 }
}
async function handleForm(form){
 if(form.getAttribute('id')==='studioLogin'){
  const values=new FormData(form);const button=form.querySelector('button');button.disabled=true;button.textContent='Checking access…';
  try{await store.login(String(values.get('email')),String(values.get('password')));if(!await store.isAdmin())throw Error('This account is not authorized for administration.');
   await refreshAll();}
  catch(e){store.logout();showLogin(safeError(e));}
  return;
 }
 if(state.busy)return;
 if(form.getAttribute('id')==='studioSourceForm'){
  const f=new FormData(form);setBusy(true);
  try{const id=await registerAsset(String(f.get('media_type')),String(f.get('source')),String(f.get('title')));
   if(!uuidOK(id))throw Error('Could not identify the canonical asset.');
   state.activeAsset=id;state.selected.clear();state.selected.add(id);state.folder='';state.assetPage=0;state.mediaType='all';state.search='';
   closeDialog();await loadAssets();await loadPlacements();shell();toast('Media saved once in the master library. Select Assign to choose where it appears.');
  }catch(e){toast(safeError(e),true)}finally{setBusy(false)}return;
 }
 if(form.getAttribute('id')==='studioAssignForm'){
  const f=new FormData(form),targets=f.getAll('target').map(String);
  if(!targets.length){toast('Select at least one destination.',true);return}
  const ids=state.selected.size?[...state.selected]:(state.activeAsset?[state.activeAsset]:[]);
  if(!ids.length){toast('No media selected.',true);return}
  const total=ids.length*targets.length;if(total>130&&!confirm(`This will create/update ${total} assignments. Continue?`))return;
  const visibility=String(f.get('visibility')),order=Math.min(100000,Math.max(0,Number(f.get('display_order'))||100));
  setBusy(true);let done=0;const errors=[];
  try{
   // Sequential on purpose: each RPC has an atomic legacy-public compatibility write.
   for(const asset of ids){for(const target of targets){try{await assignOne(asset,target,visibility,order);done++}catch(e){errors.push(safeError(e));}}}
   closeDialog();state.selected.clear();await loadBase();await loadPlacements();await loadAssets();shell();
   toast(`${done} assignment(s) saved.${errors.length?' '+errors.length+' failed: '+errors[0]:''}`,!!errors.length);
  }catch(e){toast(safeError(e),true)}finally{setBusy(false)}return;
 }
 if(form.getAttribute('id')==='studioAssetForm'){
  const f=new FormData(form),id=String(f.get('id'));
  if(!uuidOK(id))return;
  const data={title:clean(f.get('title'),180),alt_text:clean(f.get('alt_text'),220),description:clean(f.get('description'),1500),tags:tagsFromInput(f.get('tags'))};
  if(!data.title){toast('Media title is required.',true);return}
  setBusy(true);try{
   await api('lkm_studio_assets?id=eq.'+id,{method:'PATCH',data});
   const old=state.assetById.get(id);if(old){Object.assign(old,data)}
   state.assets=state.assets.map(a=>a.id===id?{...a,...data}:a);shell();toast('Library metadata saved. Existing gallery-specific ALT and video captions stay unchanged.');
  }catch(e){toast(safeError(e),true)}finally{setBusy(false)}return;
 }
 if(form.getAttribute('id')==='studioProjectForm'){
  const f=new FormData(form),id=String(f.get('id'));
  const payload={title:clean(f.get('title'),180),slug:clean(f.get('slug'),90),description:clean(f.get('description'),3500),
   category:clean(f.get('category'),90)||'Photography',client_name:clean(f.get('client_name'),140)||null,
   related_service_slug:clean(f.get('related_service_slug'),90)||null,portfolio_kind:galleryKind(f.get('portfolio_kind')),
   visibility:String(f.get('visibility')),show_in_portfolio:f.has('show_in_portfolio'),
   display_order:Math.max(0,Math.min(100000,Number(f.get('display_order'))||100))};
  if(!payload.title||!slugOK(payload.slug)){toast('Enter a title and a URL slug using lowercase letters, numbers or dashes.',true);return}
  if(!['review','public','private'].includes(payload.visibility)){toast('Invalid gallery visibility.',true);return}
  setBusy(true);try{
   if(uuidOK(id)){
    delete payload.slug; // never silently break old direct gallery/story links
    await api('portfolio_galleries?id=eq.'+id,{method:'PATCH',data:payload});
   }else{
    const rows=await api('portfolio_galleries',{method:'POST',data:payload});
    if(!rows.rows[0]?.id)throw Error('Project was not returned by Supabase.');state.projectId=rows.rows[0].id;
   }
   state.newProject=null;await loadBase();shell();toast('Project saved. The separate gallery-card visibility is now applied on the public Portfolio page.');
  }catch(e){toast(safeError(e),true)}finally{setBusy(false)}return;
 }
 if(form.getAttribute('id')==='studioStoryForm'){
  const f=new FormData(form),gallery=String(f.get('gallery_id'));if(!uuidOK(gallery))return;
  const yearRaw=String(f.get('project_year')||'').trim();const yr=yearRaw?Number(yearRaw):null;
  if(yearRaw&&(!Number.isInteger(yr)||yr<2000||yr>2100)){toast('Project year must be between 2000 and 2100.',true);return}
  const rows=String(f.get('deliverables')||'').split(/\r?\n/).map(x=>clean(x,160)).filter(Boolean);
  const payload={gallery_id:gallery,headline:clean(f.get('headline'),180),objective:clean(f.get('objective'),2500),
   approach:clean(f.get('approach'),3500),deliverables:[...new Set(rows)].slice(0,18),outcomes:clean(f.get('outcomes'),2500),
   client_label:clean(f.get('client_label'),140),project_location:clean(f.get('project_location'),120),project_year:yr,is_published:f.has('is_published')};
  const gal=state.galleries.find(g=>g.id===gallery);
  if(payload.is_published&&(gal?.visibility!=='public'||payload.headline.length<8||payload.objective.length<20||payload.approach.length<20)){
   toast('To publish: make the gallery Public and provide a meaningful headline, objective and approach.',true);return;
  }
  setBusy(true);try{
   await api('lkm_case_studies?on_conflict=gallery_id',{method:'POST',data:payload,headers:{Prefer:'resolution=merge-duplicates,return=representation'}});
   await loadBase();shell();toast(payload.is_published?'Case Study published inside Portfolio.':'Case Study saved as a private draft.');
  }catch(e){toast(safeError(e),true)}finally{setBusy(false)}return;
 }
 if(form.getAttribute('id')==='studioUploadForm'){
  const input=form.querySelector('[name=files]');const files=Array.from(input?.files||[]);
  if(!files.length||files.length>15){toast('Choose 1–15 photos.',true);return}
  setBusy(true);let done=0;const failed=[];
  try{
   const token=await store.authenticatedToken();for(const file of files){try{
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1048576)throw Error('JPG, PNG or WebP, maximum 8 MB');
    const ext={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"}[file.type];
    if(!window.crypto?.randomUUID)throw Error('Secure browser required for uploads');
    const path='uploads/studio/'+new Date().toISOString().slice(0,7)+'/'+crypto.randomUUID()+'.'+ext;
    const res=await fetch(base+'/storage/v1/object/portfolio/'+path,{method:'POST',headers:{apikey:anon,Authorization:'Bearer '+token,'Content-Type':file.type,'x-upsert':'false'},body:file});
    if(!res.ok)throw Error('Storage '+res.status+': '+(await res.text()).slice(0,160));
    const src=base+'/storage/v1/object/public/portfolio/'+path;
    await registerAsset('image',src,file.name.replace(/\.[^.]+$/,'').replace(/[-_]/g,' '));done++;
   }catch(e){failed.push(file.name+': '+safeError(e));}}
   closeDialog();state.folder='';state.assetPage=0;state.mediaType='all';state.search='';await loadAssets();shell();
   toast(`${done} photo(s) uploaded to master library.${failed.length?' '+failed.length+' failed: '+failed[0]:''}`,!!failed.length);
  }catch(e){toast(safeError(e),true)}finally{setBusy(false)}return;
 }
}
// Keep all specialist tools visually inside the dark admin. This is a same-origin
// enhancement only; it never touches forms or business data, and falls back cleanly.
app.addEventListener('load',event=>{
 const frame=event.target;
 if(!frame||frame.id!=='studioToolFrame'||frame.tagName!=='IFRAME')return;
 try{
  const doc=frame.contentDocument;
  if(!doc||doc.location.origin!==location.origin||!doc.head)return;
  doc.documentElement.classList.add('lkm-unified-embedded');
  if(!doc.querySelector('link[data-lkm-unified-theme]')){
   const link=doc.createElement('link');link.rel='stylesheet';
   link.href='/assets/lkm-v3/studio-embedded.css';link.dataset.lkmUnifiedTheme='1';
   doc.head.append(link);
  }
  // Keep links BETWEEN management tools within one sidebar: no nested admin pages.
  if(!doc.documentElement.dataset.lkmFrameLinks){
   doc.documentElement.dataset.lkmFrameLinks='1';
   doc.addEventListener('click',e=>{
    const a=e.target?.closest?.('a[href]');
    if(!a||e.defaultPrevented||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||a.hasAttribute('download')||a.target==='_blank')return;
    let url;try{url=new URL(a.href,location.href)}catch{return}
    if(url.origin!==location.origin)return;
    const paths={'/admin-crm.html':'crm','/admin-quotes.html':'quotes','/admin-calendar.html':'calendar',
      '/admin-reports.html':'reports','/admin-reviews.html':'reviews','/admin-links.html':'links',
      '/admin-case-studies.html':'projects'};
    let target=paths[url.pathname]||'';
    if(url.pathname==='/admin.html'||url.pathname==='/admin-legacy.html'||url.pathname==='/admin-studio.html'){
      const key=url.hash.replace(/^#/,'');
      target=({leads:'inquiries',services:'services',articles:'articles',galleries:'collections',media:'media'})[key]||tabFromLocation();
    }
    if(!ALLOWED_TABS.has(target))return;
    e.preventDefault();void changeTab(target).catch(err=>toast(safeError(err),true));
   },true);
  }
 }catch(_e){/* Frame navigated away; never access a foreign-origin document. */}
},true);
let searchTimer;
app.addEventListener('click',event=>{
 const btn=event.target.closest('[data-action]');if(!btn)return;
 event.preventDefault();void handleAction(btn.dataset.action,btn).catch(e=>toast(safeError(e),true));
});
app.addEventListener('submit',event=>{
 if(!event.target?.getAttribute?.('id')?.startsWith('studio'))return;
 event.preventDefault();void handleForm(event.target).catch(e=>toast(safeError(e),true));
});
app.addEventListener('change',event=>{
 const select=event.target.closest('[data-media-select]');if(select){
  const id=select.dataset.mediaSelect;if(!uuidOK(id))return;
  if(select.checked)state.selected.add(id);else state.selected.delete(id);
  shell();return;
 }
 if(event.target.id==='studioSelectAll'){
  if(event.target.checked)state.assets.forEach(a=>state.selected.add(a.id));
  else state.assets.forEach(a=>state.selected.delete(a.id));shell();return;
 }
});
app.addEventListener('input',event=>{
 if(event.target.id==='studioSearch'){
  state.search=event.target.value;state.assetPage=0;clearTimeout(searchTimer);
  searchTimer=setTimeout(()=>{void loadAssets().then(shell).catch(e=>toast(safeError(e),true))},300);
 }
 if(event.target.id==='studioCatalogSearch'){
  state.catalogSearch=event.target.value;renderCatalogGrid();
 }
});
async function boot(){
 if(!store?.configured||!base.startsWith('https://')||!anon){showLogin('Supabase is not configured for production. Check /lkm-config.js.');return}
 try{if(store.getSession()&&await store.isAdmin()){
  try{await refreshAll()}catch(e){state.error=safeError(e);state.ready=true;shell()}
  return;
 }}catch(e){if(/lkm_studio_/.test(String(e?.message||'')))state.error=safeError(e);}
 showLogin();
}
void boot();
