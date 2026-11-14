/* LilKangooMedia · unified Projects & Portfolio admin directory, 2026-11-14.
 * Presentation-only integration on top of the existing Command Center.
 * Reuses its original Create/Edit/Case Study/Home/Media actions and Supabase RLS.
 * GET-only read of existing portfolio_galleries and lkm_case_studies, no new tables.
 */
(()=>{'use strict';
 const app=document.getElementById('lkmStudio');
 if(!app)return;
 const filters={term:'',type:'all',status:'all',from:'',to:'',sort:'newest'};
 let galleries=null,fallbackRecords=[],stories=new Map(),loadInFlight=null,loadAgain=false,selectedId='',openHome=false,scrollToEditor=false;
 const H=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
 const norm=x=>String(x??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().trim();
 const kind=g=>g.portfolio_kind==='project'?'project':'collection';
 const day=x=>{if(!x)return '';const d=new Date(x);return Number.isFinite(d.getTime())?d.toISOString().slice(0,10):''};
 const stamp=x=>{const t=Date.parse(String(x||''));return Number.isFinite(t)?t:null};
 const displayDate=x=>{const d=day(x);return d?new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',day:'2-digit',month:'short',year:'numeric'}).format(new Date(x)):'Not recorded'};
 const formatNumber=x=>Number(x||0).toLocaleString('en-GB');
 function sectionActive(){return !!app.querySelector('.studio-editor-layout') && !!app.querySelector('.studio-project-list')}
 function setText(el,s){if(el)el.textContent=s}
 function recordsFromDom(){return fallbackRecords;}
 function rememberOriginalRows(list){
  const rows=[...list.querySelectorAll('.studio-project-choice[data-id]')].map(b=>{
   const text=b.querySelector('small')?.textContent||'',bits=text.split(' · ');
   return {id:b.dataset.id,title:b.querySelector('strong')?.textContent||'',slug:bits[1]||'',portfolio_kind:bits[0]==='project'?'project':'collection',visibility:bits[2]||'review',client_name:'',category:'',created_at:''};
  });
  if(rows.length)fallbackRecords=[...new Map([...fallbackRecords,...rows].map(g=>[g.id,g])).values()];
 }
 function visibleEntries(){
  const items=(galleries||recordsFromDom()).filter(g=>{
   if(filters.type!=='all'&&kind(g)!==filters.type)return false;
   if(filters.status!=='all'&&g.visibility!==filters.status)return false;
   if(filters.term&&!norm([g.title,g.client_name,g.category,g.slug,day(g.created_at),displayDate(g.created_at)].join(' ')).includes(norm(filters.term)))return false;
   const d=day(g.created_at);
   if(filters.from&&(!d||d<filters.from))return false;
   if(filters.to&&(!d||d>filters.to))return false;
   return true;
  });
  const byName=(a,b)=>String(a.title||'').localeCompare(String(b.title||''),'en',{sensitivity:'base'})||String(a.id||'').localeCompare(String(b.id||''));
  items.sort((a,b)=>{
   if(filters.sort==='az')return byName(a,b);
   if(filters.sort==='za')return -byName(a,b);
   const aDate=stamp(a.created_at),bDate=stamp(b.created_at);
   if(aDate===null&&bDate!==null)return 1;
   if(bDate===null&&aDate!==null)return -1;
   return (filters.sort==='oldest'?(aDate??0)-(bDate??0):(bDate??0)-(aDate??0))||byName(a,b);
  });
  return items;
 }
 function updateRowCount(items){
  const el=app.querySelector('#lkmProjectCount');if(el)el.textContent=`${items.length} of ${(galleries||recordsFromDom()).length} records`;
  const badges=app.querySelectorAll('.lkm-unified-type-filter');for(const b of badges){
   const type=b.dataset.type;
   b.classList.toggle('active',filters.type===type);
   b.setAttribute('aria-pressed',String(filters.type===type));
   const count=b.querySelector('span');if(count){const list=galleries||recordsFromDom();count.textContent=formatNumber(type==='all'?list.length:list.filter(g=>kind(g)===type).length);}
  }
 }
 function renderIndex(){const index=app.querySelector('#lkmUnifiedIndex');if(!index)return;
  const items=visibleEntries();updateRowCount(items);
  index.innerHTML=items.map(g=>{
   const type=kind(g),isProject=type==='project',isCurrent=g.id===selectedId;
   const client=g.client_name||g.category||g.slug||'No client specified';
   const story=stories.get(g.id);const storyLabel=isProject&&story?(story.is_published&&g.visibility==='public'?'Published story':'Story draft'):'';
   return `<button type="button" class="studio-project-choice lkm-unified-entry ${isCurrent?'active':''}" data-action="open-project" data-id="${H(g.id)}" aria-current="${isCurrent?'true':'false'}">
    <span class="lkm-ue-icon ${type}" aria-hidden="true">${isProject?'▱':'▣'}</span>
    <span class="lkm-ue-main"><strong>${H(g.title||'Untitled')}</strong><small>${H(client)} · ${H(g.slug||'')}</small>
    <span class="lkm-ue-flags"><span class="lkm-ue-kind ${type}">${isProject?'WORK GALLERY · PROJECT':'PORTFOLIO · COLLECTION'}</span><span class="lkm-ue-status ${H(g.visibility||'review')}">${H(g.visibility==='public'?'Public':g.visibility==='private'?'Private':'Draft / review')}</span>${storyLabel?`<span class="lkm-ue-story">${H(storyLabel)}</span>`:''}</span></span>
    <span class="lkm-ue-date"><small>Date added (UTC)</small><time datetime="${H(day(g.created_at))}">${H(displayDate(g.created_at))}</time></span><span class="lkm-ue-open" aria-hidden="true">↗</span>
   </button>`;
  }).join('')||'<div class="lkm-unified-empty">No projects match these filters. <button type="button" data-lkm-reset="true">Clear filters</button></div>';
 }
 function buildControls(){const div=document.createElement('div');div.className='lkm-unified-controls';div.innerHTML=`
  <div class="lkm-unified-filters-head"><div><p class="studio-eyebrow">ALL WORK · ONE DIRECTORY</p><h2>Find a project or gallery</h2><p>One list above the existing editor. Choose an entry below to manage its details and media.</p></div><strong id="lkmProjectCount"></strong></div>
  <div class="lkm-unified-types" role="group" aria-label="Type of record">
   <button type="button" data-lkm-type="all" data-type="all" class="lkm-unified-type-filter active">All <span></span></button>
   <button type="button" data-lkm-type="project" data-type="project" class="lkm-unified-type-filter">Work Gallery · Projects <span></span></button>
   <button type="button" data-lkm-type="collection" data-type="collection" class="lkm-unified-type-filter">Portfolio · Collections <span></span></button>
  </div>
  <div class="lkm-unified-filter-grid">
   <label class="lkm-search-field">Project or client name<input id="lkmProjectSearch" type="search" maxlength="120" placeholder="Search name, client or URL..." autocomplete="off"></label>
   <label>Publication<select id="lkmProjectStatus"><option value="all">All statuses</option><option value="public">Public</option><option value="review">Draft / review</option><option value="private">Private</option></select></label>
   <label>Date added — from<input id="lkmProjectFrom" type="date"></label>
   <label>Date added — to<input id="lkmProjectTo" type="date"></label>
   <label>Sort by<select id="lkmProjectSort"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="az">Name A–Z</option><option value="za">Name Z–A</option></select></label>
  </div><div class="lkm-unified-filter-bottom"><span>Dates come from the existing <code>created_at</code> field.</span><button type="button" data-lkm-reset="true">Clear filters</button></div>`;
  return div;
 }
 function install(){
  // The duplicate sidebar item must disappear on EVERY admin screen, including Overview.
  const oldNav=app.querySelector('.studio-nav [data-action="nav"][data-tab="collections"]');oldNav?.remove();
  const projectNav=app.querySelector('.studio-nav [data-action="nav"][data-tab="projects"]');
  if(projectNav){
   setText(projectNav.querySelector('span:not(.nav-icon):not(.nav-count)'),'Projects & Portfolio');
   // The old collection route may still be active after clicking Create Collection.
   if(sectionActive())projectNav.classList.add('active');
  }
  if(!sectionActive())return;
  app.classList.add('lkm-unified-admin');
  const topHead=app.querySelector('.studio-topbar h1');if(topHead&&(topHead.textContent.includes('Projects & Stories')||topHead.textContent.includes('Portfolio Collections')))topHead.textContent='Projects & Portfolio';
  const head=app.querySelector('.studio-head');if(head){
   setText(head.querySelector('h1'),'Projects & Portfolio');
   setText(head.querySelector('.studio-eyebrow'),'WORK GALLERIES · PORTFOLIO COLLECTIONS');
   setText(head.querySelector('h1 + p'),'One place for every project, client gallery and portfolio collection. Search above, edit below.');
   const projectNew=head.querySelector('[data-action="new-project"][data-kind="project"]');if(projectNew)projectNew.textContent='+ New Work Gallery';
   const collectionNew=head.querySelector('[data-action="new-project"][data-kind="collection"]');if(collectionNew)collectionNew.textContent='+ New Portfolio Collection';
  }
  const layout=app.querySelector('.studio-editor-layout');if(!layout)return;
  const list=layout.querySelector('.studio-project-list');const editor=layout.querySelector('.studio-project-form');
  if(!list||!editor)return;
  const existing=app.querySelector('.studio-project-choice.active');if(existing?.dataset?.id&&!scrollToEditor)selectedId=existing.dataset.id;
  rememberOriginalRows(list);
  list.classList.add('lkm-unified-list');list.innerHTML='';
  list.append(buildControls());const results=document.createElement('div');results.id='lkmUnifiedIndex';results.className='lkm-unified-index';results.setAttribute('aria-live','polite');list.append(results);
  editor.id='lkmUnifiedEditor';
  // A homepage selector remains intact: move, collapse, and reuse original drag / save actions.
  const home=app.querySelector('#studioHomeManager');if(home){
   const details=document.createElement('details');details.className='lkm-home-details';details.open=openHome;
   const count=home.querySelector('#studioHomeCounter')?.textContent||'';
   const summary=document.createElement('summary');summary.innerHTML=`<span><strong>Homepage featured Case Studies</strong><small>Choose and order the stories shown on your homepage</small></span><span class="lkm-home-count">${H(count)}</span>`;
   details.append(summary,home);layout.after(details);
  }
  renderIndex();
  if(scrollToEditor){scrollToEditor=false;requestAnimationFrame(()=>app.querySelector('#lkmUnifiedEditor')?.scrollIntoView({behavior:'smooth',block:'start'}));}
 }
 async function fetchRows(table,fields){
  const cfg=window.LKM_CONFIG||{},url=String(cfg.SUPABASE_URL||'').replace(/\/+$/,'');
  const key=String(cfg.SUPABASE_ANON_KEY||'');
  if(!url.startsWith('https://')||!key||!window.LKMStore?.authenticatedToken)throw Error('Admin authentication is not available');
  const jwt=await window.LKMStore.authenticatedToken();
  const res=await fetch(`${url}/rest/v1/${table}?select=${encodeURIComponent(fields)}&limit=1000`,{
   method:'GET',headers:{apikey:key,Authorization:'Bearer '+jwt,Accept:'application/json'},cache:'no-store'
  });
  if(!res.ok)throw Error(`${table} read failed (${res.status})`);
  const json=await res.json();if(!Array.isArray(json))throw Error(`${table} response is not a list`);return json;
 }
 async function syncRecords(){
  if(loadInFlight){loadAgain=true;return loadInFlight;}
  loadInFlight=(async()=>{
   try{
    const [all,history]=await Promise.all([
     fetchRows('portfolio_galleries','id,title,slug,category,client_name,portfolio_kind,visibility,created_at,show_in_portfolio'),
     fetchRows('lkm_case_studies','gallery_id,is_published').catch(()=>[])
    ]);
    galleries=all.filter(x=>typeof x.id==='string');stories=new Map(history.map(h=>[h.gallery_id,h]));renderIndex();
   }catch(e){
    if(!galleries&&sectionActive()){const box=app.querySelector('.lkm-unified-filter-bottom span');if(box)box.textContent='Unable to read dates from Supabase. Showing current editor entries. Refresh after signing in.';renderIndex();}
    console.warn('Unified portfolio directory: '+e.message);
   }
  })();
  try{await loadInFlight;}finally{loadInFlight=null;if(loadAgain){loadAgain=false;void syncRecords();}}
 }
 function wipeFilters(){Object.assign(filters,{term:'',type:'all',status:'all',from:'',to:'',sort:'newest'});
  for(const [id,v] of [['lkmProjectSearch',''],['lkmProjectStatus','all'],['lkmProjectFrom',''],['lkmProjectTo',''],['lkmProjectSort','newest']]){const el=document.getElementById(id);if(el)el.value=v;}
  renderIndex();
 }
 function afterShell(){install();if(sectionActive())void syncRecords();}
 const observer=new MutationObserver(()=>afterShell());observer.observe(app,{childList:true});
 afterShell();
 // Only the existing Command Center handles every mutation; these controls only filter and navigate.
 document.addEventListener('click',e=>{
  const t=e.target;if(!(t instanceof Element)||!app.contains(t))return;
  const type=t.closest('[data-lkm-type]');if(type){e.preventDefault();filters.type=type.dataset.lkmType||'all';renderIndex();return;}
  if(t.closest('[data-lkm-reset]')){e.preventDefault();wipeFilters();return;}
  const choice=t.closest('.lkm-unified-entry[data-action="open-project"]');
  if(choice){selectedId=choice.dataset.id;scrollToEditor=true;return;}
  const newAction=t.closest('[data-action="new-project"]');
  if(newAction){selectedId='';scrollToEditor=true;return;}
  const refresh=t.closest('[data-action="refresh"]');if(refresh){galleries=null;return;}
 },true);
 document.addEventListener('input',e=>{
  if(e.target?.id==='lkmProjectSearch'){filters.term=e.target.value;renderIndex();}
 },true);
 document.addEventListener('change',e=>{
  const key={lkmProjectStatus:'status',lkmProjectFrom:'from',lkmProjectTo:'to',lkmProjectSort:'sort'}[e.target?.id];
  if(key){filters[key]=e.target.value;renderIndex();}
 },true);
 document.addEventListener('toggle',e=>{
  if(e.target?.matches?.('.lkm-home-details'))openHome=e.target.open;
 },true);
 document.addEventListener('submit',e=>{
  if(['studioProjectForm','studioStoryForm'].includes(e.target?.id)){galleries=null;loadAgain=true;}
 },true);
})();
