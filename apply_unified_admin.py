#!/usr/bin/env python3
"""LilKangooMedia: safely unify Projects & Stories and Portfolio Collections.

Applies a version-locked, offline change to the verified Phase 31 admin files.
No database migration, network connection or deployment is performed.
"""
from pathlib import Path
from hashlib import sha1
from datetime import datetime
import argparse
import json
import shutil
import sys

EXPECTED = {
    'assets/lkm-v3/studio.mjs': '37a4c66e73b6a0d168b540e3ccdf1c0a013c9b75',
    'assets/lkm-v3/studio.css': 'e21f9e20f3e8361c6a055b87d6e3defb826a8f07',
    'assets/lkm-v3/studio-model.mjs': '7c8d0bb56a33e555f2d55c827c4222da68d0a26c',
    'package.json': '5dccc6abf173bafdc8bbbe63131001e3c3291102',
}


def git_blob_hash(data: bytes) -> str:
    return sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()


def once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{label}: expected 1 matching code block, found {count}. No files changed.')
    return text.replace(old, new, 1)


def between(text: str, start: str, end: str, new: str, label: str) -> str:
    if text.count(start) != 1 or text.count(end) != 1:
        raise RuntimeError(f'{label}: expected unique function boundaries. No files changed.')
    head, rest = text.split(start, 1)
    _, tail = rest.split(end, 1)
    return head + new + end + tail


PROJECT_DIRECTORY_JS = r'''function projectDirectoryResults(){
 const result=filterProjectDirectory(state.galleries,{
  search:state.projectSearch,type:state.projectType,visibility:state.projectStatus,
  from:state.projectDateFrom,to:state.projectDateTo,sort:state.projectSort
 });
 const rows=result.map(p=>{
  const kind=galleryKind(p.portfolio_kind),isProject=kind==='project';
  const story=isProject?state.stories.find(s=>s.gallery_id===p.id):null;
  const added=p.created_at&&Number.isFinite(Date.parse(p.created_at))
   ?new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(p.created_at)):'Not recorded';
  const selected=!state.newProject&&state.projectId===p.id;
  return `<button type="button" class="studio-project-choice studio-directory-row ${selected?'active':''}" data-action="open-project" data-id="${h(p.id)}" aria-current="${selected?'true':'false'}">
   <span class="studio-directory-symbol ${kind}" aria-hidden="true">${isProject?'▱':'▣'}</span>
   <span class="studio-directory-info"><strong>${h(p.title)}</strong><small>${h(p.client_name||p.category||p.slug||'')} · ${h(p.slug)}</small><span class="studio-directory-meta"><span class="studio-directory-kind ${kind}">${isProject?'Work Gallery · Project':'Portfolio · Collection'}</span>${pill(p.visibility)}${isProject&&story?badge(isStoryPublished(story,p)?'Story published':'Story draft'):''}</span></span>
   <span class="studio-directory-date"><small>Date added</small><time datetime="${h(p.created_at||'')}">${h(added)}</time></span>
   <span class="studio-directory-arrow" aria-hidden="true">↗</span>
  </button>`;
 });
 return `<div class="studio-directory-summary"><span><strong>${result.length}</strong> of ${state.galleries.length} entries</span><small>Date added is displayed and filtered in UTC.</small></div>
  <div class="studio-directory-list">${rows.join('')||'<div class="studio-empty">No entries match these filters. <button class="studio-btn ghost" type="button" data-action="reset-project-filters">Clear filters</button></div>'}</div>`;
}
function refreshProjectDirectory(){const root=document.getElementById('studioProjectResults');if(root)root.innerHTML=projectDirectoryResults();}
function projectView(){
 const g=state.newProject||state.galleries.find(x=>x.id===state.projectId)||state.galleries[0];
 const story=g?.id?state.stories.find(s=>s.gallery_id===g.id):null;
 const buttons=`<button type="button" class="studio-btn primary" data-action="new-project" data-kind="project">+ New Work Gallery</button><button type="button" class="studio-btn gold" data-action="new-project" data-kind="collection">+ New Portfolio Collection</button>`;
 return head('ONE DIRECTORY · TWO CLEAR TYPES','Projects & Portfolio',
  'Find work by name, client or date. Portfolio collections and Work Gallery projects use the same editor, without duplicate admin sections.',buttons)+
  `<div class="studio-project-workflow">
  <section class="studio-panel studio-project-directory" aria-labelledby="studioDirectoryTitle"><div class="studio-card-head"><div><p class="studio-eyebrow">SEARCH · FILTER · EDIT</p><h2 id="studioDirectoryTitle">All projects & collections</h2></div>${badge(`${state.galleries.length} total`)}</div>
   <div class="studio-project-controls">
    <label class="studio-field studio-directory-search">Find by name, client or slug<input id="studioProjectSearch" type="search" class="studio-input" maxlength="120" autocomplete="off" placeholder="Search project or client…" value="${h(state.projectSearch)}"></label>
    <label class="studio-field">Content type<select id="studioProjectType" class="studio-select"><option value="all" ${state.projectType==='all'?'selected':''}>All types</option><option value="project" ${state.projectType==='project'?'selected':''}>Work Gallery (Projects)</option><option value="collection" ${state.projectType==='collection'?'selected':''}>Portfolio (Collections)</option></select></label>
    <label class="studio-field">Publication status<select id="studioProjectStatus" class="studio-select"><option value="all" ${state.projectStatus==='all'?'selected':''}>All statuses</option>${['public','review','private'].map(s=>`<option value="${s}" ${state.projectStatus===s?'selected':''}>${s==='review'?'Review / Draft':s[0].toUpperCase()+s.slice(1)}</option>`).join('')}</select></label>
    <label class="studio-field">Added from<input id="studioProjectDateFrom" class="studio-input" type="date" value="${h(state.projectDateFrom)}" max="9999-12-31"></label>
    <label class="studio-field">Added to<input id="studioProjectDateTo" class="studio-input" type="date" value="${h(state.projectDateTo)}" max="9999-12-31"></label>
    <label class="studio-field">Order<select id="studioProjectSort" class="studio-select"><option value="newest" ${state.projectSort==='newest'?'selected':''}>Newest added</option><option value="oldest" ${state.projectSort==='oldest'?'selected':''}>Oldest added</option><option value="title-asc" ${state.projectSort==='title-asc'?'selected':''}>Name A–Z</option><option value="title-desc" ${state.projectSort==='title-desc'?'selected':''}>Name Z–A</option></select></label>
   </div>
   <div id="studioProjectResults" aria-live="polite">${projectDirectoryResults()}</div>
  </section>
  <section id="studioProjectEditor" class="studio-panel studio-project-form" aria-label="Selected project editor">${g?projectEditor(g,story):'<div class="studio-empty">Choose a project above or create a new Work Gallery or Portfolio Collection.</div>'}</section>
  <details class="studio-home-details"><summary><strong>Homepage featured projects</strong><span>Manage which published Case Studies appear on Home and their order</span></summary>${homepageEditor()}</details>
  </div>`;
}
'''

PROJECT_FILTER_HELPERS = r'''
// Searchable directory shared by Work Gallery projects and Portfolio collections.
// Date filters use the UTC calendar day stored in Supabase created_at.
export function filterProjectDirectory(entries,{search='',type='all',visibility='all',from='',to='',sort='newest'}={}){
 const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const term=normalize(search).slice(0,120);
 const utcDate=value=>{
  if(!value)return '';
  const d=new Date(value);
  return Number.isFinite(d.getTime())?d.toISOString().slice(0,10):'';
 };
 const stamp=value=>{const time=Date.parse(String(value||''));return Number.isFinite(time)?time:null;};
 const items=(Array.isArray(entries)?entries:[]).filter(g=>{
  if(!g)return false;
  if(type!=='all'&&galleryKind(g.portfolio_kind)!==type)return false;
  if(visibility!=='all'&&g.visibility!==visibility)return false;
  if(term&&!normalize([g.title,g.client_name,g.slug,g.category].join(' ')).includes(term))return false;
  const day=utcDate(g.created_at);
  if(from&&(!day||day<from))return false;
  if(to&&(!day||day>to))return false;
  return true;
 });
 const byName=(a,b)=>String(a.title||'').localeCompare(String(b.title||''),'en',{sensitivity:'base'})||String(a.id||'').localeCompare(String(b.id||''));
 items.sort((a,b)=>{
  if(sort==='title-asc')return byName(a,b);
  if(sort==='title-desc')return -byName(a,b);
  const ta=stamp(a.created_at),tb=stamp(b.created_at);
  if(ta===null&&tb!==null)return 1;
  if(tb===null&&ta!==null)return -1;
  return (sort==='oldest'?(ta||0)-(tb||0):(tb||0)-(ta||0))||byName(a,b);
 });
 return items;
}
'''

PROJECT_DIRECTORY_CSS = r'''
/* Phase 32: one vertical directory, one editor, one homepage control. */
.studio-project-workflow{display:grid;grid-template-columns:minmax(0,1fr);gap:18px}
.studio-project-directory{padding:23px 25px}
.studio-project-controls{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;margin:19px 0 13px;align-items:end}
.studio-project-controls .studio-field{min-width:0;margin:0}
.studio-directory-search{grid-column:span 2}
.studio-project-controls input,.studio-project-controls select{width:100%;min-width:0}
.studio-directory-summary{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:9px 1px 13px;color:var(--muted);font-size:12px}
.studio-directory-summary strong{color:var(--fg)}
.studio-directory-summary small{font-size:11px;color:var(--subtle)}
.studio-directory-list{display:flex;flex-direction:column;gap:8px;max-height:590px;overflow:auto;padding:2px 4px 5px 1px}
.studio-directory-row.studio-project-choice{display:grid;grid-template-columns:44px minmax(0,1fr) 120px 20px;align-items:center;gap:13px;text-align:left;border:1px solid var(--stroke);border-radius:12px;background:#13241f;padding:12px 15px;margin:0;min-height:79px}
.studio-directory-row.studio-project-choice:hover{background:#1c342a;border-color:#4b7961}
.studio-directory-row.studio-project-choice.active{background:#224030;border-color:var(--green)}
.studio-directory-symbol{width:42px;height:42px;border-radius:10px;display:grid;place-items:center;font-size:24px;background:#18372f;color:var(--green)}
.studio-directory-symbol.collection{background:#3b3122;color:var(--gold)}
.studio-directory-info{min-width:0}
.studio-directory-info strong{font-size:14px;line-height:1.35;overflow-wrap:anywhere}
.studio-directory-info>small{display:block;color:var(--muted);font-size:11px;margin:5px 0;overflow-wrap:anywhere}
.studio-directory-meta{display:flex;align-items:center;flex-wrap:wrap;gap:5px}
.studio-directory-kind{font-size:10px;font-weight:800;letter-spacing:.01em;padding:4px 7px;border-radius:7px;background:#1c4532;color:var(--green)}
.studio-directory-kind.collection{background:#40341f;color:var(--gold)}
.studio-directory-date{display:flex;flex-direction:column;gap:4px;align-items:flex-end;color:var(--fg);font-size:12px;white-space:nowrap}
.studio-directory-date small{color:var(--subtle);font-size:10px}
.studio-directory-arrow{color:var(--subtle);font-size:20px;justify-self:end}
.studio-project-workflow>.studio-project-form{padding:24px;scroll-margin-top:16px}
.studio-home-details{border:1px solid var(--stroke);border-radius:12px;overflow:hidden;background:#111f1b}
.studio-home-details>summary{list-style:none;cursor:pointer;padding:20px 22px;display:flex;flex-direction:column;gap:6px}
.studio-home-details>summary::-webkit-details-marker{display:none}
.studio-home-details>summary strong{color:var(--gold);font-size:15px}
.studio-home-details>summary span{color:var(--muted);font-size:12px}
.studio-home-details>summary::after{content:'Expand / collapse';font-size:10px;color:var(--subtle)}
.studio-home-details .studio-home-manager{margin:0;border:0;border-top:1px solid var(--stroke);border-radius:0}
@media(max-width:1450px){.studio-project-controls{grid-template-columns:repeat(3,minmax(0,1fr))}.studio-directory-search{grid-column:span 2}}
@media(max-width:850px){.studio-project-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.studio-directory-search{grid-column:span 2}}
@media(max-width:600px){.studio-project-directory{padding:13px}.studio-project-controls{gap:9px}.studio-directory-list{max-height:420px}.studio-directory-row.studio-project-choice{grid-template-columns:32px minmax(0,1fr) 16px;gap:9px;padding:10px;min-height:76px}.studio-directory-symbol{width:32px;height:32px;font-size:19px}.studio-directory-date{grid-column:2;align-items:flex-start;flex-direction:row;gap:5px;white-space:normal}.studio-directory-arrow{grid-column:3;grid-row:1 / span 2}.studio-project-workflow>.studio-project-form{padding:14px}.studio-directory-summary{align-items:flex-start;flex-direction:column;gap:3px}.studio-home-details>summary{padding:15px}}
'''


def transform_studio(code: str) -> str:
    code = once(code, "isStoryPublished,galleryKind} from './studio-model.mjs'", "isStoryPublished,galleryKind,filterProjectDirectory} from './studio-model.mjs'", 'Import filtering helper')
    code = once(code,
        "const CORE_TABS=Object.freeze(['dashboard','media','projects','collections']);",
        "const CORE_TABS=Object.freeze(['dashboard','media','projects','collections']); // 'collections' is a legacy deep-link alias.",
        'Legacy alias')
    code = once(code,
        "function tabFromLocation(){const val=String(location.hash||'').replace(/^#\\/?/,'');return ALLOWED_TABS.has(val)?val:'dashboard'}",
        "function tabFromLocation(){const val=String(location.hash||'').replace(/^#\\/?/,'');return val==='collections'?'projects':ALLOWED_TABS.has(val)?val:'dashboard'}",
        'Legacy hash routing')
    code = once(code,
        "projectId:'',newProject:null,studioCatalog:null,catalogSearch:'',catalogCount:0,uploadStatus:'',uploadFiles:[]};",
        "projectId:'',newProject:null,projectSearch:'',projectType:String(location.hash||'').replace(/^#\\/?/,'')==='collections'?'collection':'all',projectStatus:'all',projectDateFrom:'',projectDateTo:'',projectSort:'newest',studioCatalog:null,catalogSearch:'',catalogCount:0,uploadStatus:'',uploadFiles:[]};",
        'State for filters')
    code = once(code,
        "${navButton('projects','▱','Projects & Stories',state.galleries.length)}${navButton('collections','▣','Portfolio Collections')}",
        "${navButton('projects','▱','Projects & Portfolio',state.galleries.length)}",
        'Sidebar single tab')
    code = once(code,
        "projects:'Projects & Stories',collections:'Portfolio Collections'",
        "projects:'Projects & Portfolio'",
        'Breadcrumb title')
    code = once(code,
        "return state.tab==='dashboard'?dashboard():state.tab==='media'?mediaView():projectView(state.tab==='collections');}",
        "return state.tab==='dashboard'?dashboard():state.tab==='media'?mediaView():projectView();}",
        'Single content render')
    code = once(code,
        "No public Case Studies yet. Publish a project in Projects & Stories first.",
        "No public Case Studies yet. Publish a project in Projects & Portfolio first.",
        'Homepage guidance')
    code = between(code, "function projectView(collectionsOnly=false){", "function projectEditor(g,story){", PROJECT_DIRECTORY_JS, 'Unified project directory')
    code = once(code,
        "${fresh?'CREATE NEW':'MANAGE PROJECT'}",
        "${fresh?'CREATE NEW':kind==='project'?'MANAGE WORK GALLERY':'MANAGE PORTFOLIO COLLECTION'}",
        'Editor distinction')
    code = once(code,
        "${h(g.title||'New Portfolio Folder')}",
        "${h(g.title||(kind==='project'?'New Work Gallery':'New Portfolio Collection'))}",
        'Editor title')
    code = once(code,
        "${fresh?'Create folder':'Save project settings'}",
        "${fresh?'Create project / collection':'Save project settings'}",
        'Editor button')
    code = once(code,
        " state.tab=next;state.newProject=null;",
        " if(next==='collections'){state.projectType='collection';next='projects';}\n state.tab=next;state.newProject=null;",
        'Route alias')
    code = once(code,
        " if(next!==state.tab)void changeTab(next,{updateHash:false}).catch(e=>toast(safeError(e),true));",
        " if(String(location.hash||'').replace(/^#\\/?/,'')==='collections'){state.projectType='collection';if(state.tab==='projects'){shell();return;}}\n if(next!==state.tab)void changeTab(next,{updateHash:false}).catch(e=>toast(safeError(e),true));",
        'Legacy hash changes')
    code = once(code,
        "if(action==='new-project'){state.newProject={title:'',slug:'',category:'Photography',description:'',portfolio_kind:element.dataset.kind==='collection'?'collection':'project',visibility:'review',show_in_portfolio:element.dataset.kind==='collection',display_order:100};state.tab=element.dataset.kind==='collection'?'collections':'projects';shell();return}",
        "if(action==='new-project'){state.newProject={title:'',slug:'',category:'Photography',description:'',portfolio_kind:element.dataset.kind==='collection'?'collection':'project',visibility:'review',show_in_portfolio:element.dataset.kind==='collection',display_order:100};state.tab='projects';state.projectSearch='';state.projectType='all';state.projectStatus='all';state.projectDateFrom='';state.projectDateTo='';shell();if(location.hash!=='#projects')location.hash='#projects';requestAnimationFrame(()=>app.querySelector('#studioProjectEditor')?.scrollIntoView({behavior:'smooth',block:'start'}));return}",
        'Create action')
    code = once(code,
        " if(action==='open-project'){if(!uuidOK(element.dataset.id))return;state.newProject=null;state.projectId=element.dataset.id;state.tab='projects';shell();return}",
        " if(action==='reset-project-filters'){state.projectSearch='';state.projectType='all';state.projectStatus='all';state.projectDateFrom='';state.projectDateTo='';state.projectSort='newest';shell();return}\n if(action==='open-project'){if(!uuidOK(element.dataset.id))return;if(!element.closest('#studioProjectResults'))state.projectType='all';state.newProject=null;state.projectId=element.dataset.id;state.tab='projects';shell();if(location.hash!=='#projects')location.hash='#projects';requestAnimationFrame(()=>app.querySelector('#studioProjectEditor')?.scrollIntoView({behavior:'smooth',block:'start'}));return}",
        'Select action')
    code = once(code,
        "app.addEventListener('input',event=>{\n if(event.target.id==='studioSearch'){",
        "app.addEventListener('input',event=>{\n if(event.target.id==='studioProjectSearch'){state.projectSearch=event.target.value;refreshProjectDirectory();}\n if(event.target.id==='studioSearch'){",
        'Directory search handler')
    code = once(code,
        "async function boot(){",
        "app.addEventListener('change',event=>{\n  const ids={studioProjectType:'projectType',studioProjectStatus:'projectStatus',studioProjectDateFrom:'projectDateFrom',studioProjectDateTo:'projectDateTo',studioProjectSort:'projectSort'};\n  const key=ids[event.target.id];if(!key)return;state[key]=event.target.value;refreshProjectDirectory();\n });\n async function boot(){",
        'Directory filter handlers')
    return code


def transformed(files):
    changed = dict(files)
    changed['assets/lkm-v3/studio.mjs'] = transform_studio(files['assets/lkm-v3/studio.mjs'])
    changed['assets/lkm-v3/studio.css'] += PROJECT_DIRECTORY_CSS
    changed['assets/lkm-v3/studio-model.mjs'] += PROJECT_FILTER_HELPERS
    package = json.loads(files['package.json'])
    package['scripts']['test'] = 'node --test tests/backend.test.mjs tests/project-directory.test.mjs'
    changed['package.json'] = json.dumps(package, indent=2, ensure_ascii=False) + '\n'
    return changed


def main():
    parser=argparse.ArgumentParser(description='Apply LilKangooMedia Project & Portfolio unified admin patch')
    parser.add_argument('--repo',type=Path,default=Path.cwd(),help='Local LilKangooMedia repository directory')
    parser.add_argument('--dry-run',action='store_true',help='Verify exact source version and transformations without changing files')
    args=parser.parse_args()
    root=args.repo.expanduser().resolve()
    if not (root/'admin.html').is_file() or not (root/'assets/lkm-v3/studio.mjs').is_file():
        sys.exit(f'ERROR: {root} is not the LilKangooMedia repo. Use --repo /full/path/to/LilKangooMedia')
    original={}
    for relative,expected in EXPECTED.items():
        path=root/relative
        if not path.is_file():sys.exit(f'ERROR: Missing {relative}. No files were changed.')
        raw=path.read_bytes(); actual=git_blob_hash(raw)
        if actual!=expected:
            sys.exit(f'ERROR: {relative} has version {actual}, expected {expected}.\nNo files were changed. Do not force apply to a different version.')
        original[relative]=raw.decode('utf-8')
    test_path=root/'tests/project-directory.test.mjs'
    if test_path.exists():sys.exit('ERROR: tests/project-directory.test.mjs already exists. No files changed.')
    changed=transformed(original)
    for relative,text in changed.items():
        if text==original[relative] or not text.strip():sys.exit(f'ERROR: no modification made to {relative}')
    if args.dry_run:
        print('PRECHECK PASS: source Git blob hashes, all 16 code anchors and patch content verified. No files changed.')
        return
    stamp=datetime.now().strftime('%Y%m%d-%H%M%S')
    backup=root/f'LKM_UNIFIED_ADMIN_BACKUP_{stamp}'
    backup.mkdir(parents=False,exist_ok=False)
    try:
        for relative in EXPECTED:
            dest=backup/relative;dest.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(root/relative,dest)
        for relative,text in changed.items():
            path=root/relative;tmp=path.with_suffix(path.suffix+'.unified-tmp')
            tmp.write_text(text,encoding='utf-8',newline='')
            tmp.replace(path)
        test_path.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(Path(__file__).parent/'tests/project-directory.test.mjs',test_path)
        print('APPLIED: Unified Projects & Portfolio admin; one sidebar tab and vertical directory.')
        print('BACKUP:',backup)
        print('FILES: studio.mjs, studio.css, studio-model.mjs, package.json, tests/project-directory.test.mjs')
        print('NEXT: npm test && node --check assets/lkm-v3/studio.mjs && node --check assets/lkm-v3/studio-model.mjs')
        print('No SQL change or deployment performed.')
    except Exception as exc:
        for relative in EXPECTED:
            src=backup/relative
            if src.exists():shutil.copy2(src,root/relative)
        test_path.unlink(missing_ok=True)
        sys.exit(f'ERROR: rolled back to verified backup after: {exc}')

if __name__=='__main__':main()
