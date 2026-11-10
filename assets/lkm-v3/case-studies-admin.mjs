/* LilKangooMedia Phase 22.3 — authenticated editor. All writes use end-user JWT and Supabase RLS. */
import {clean,lines,readyToPublish,yearValue} from './case-studies-data.mjs';
const root=document.getElementById('lkmCasesAdmin');
const cfg=window.LKM_CONFIG||{};
const base=String(cfg.SUPABASE_URL||'').replace(/\/+$/,'');
const pubKey=String(cfg.SUPABASE_ANON_KEY||'');
const store=window.LKMStore;
const state={galleries:[],stories:new Map(),selected:'',working:false};
const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
function banner(message,error=false){
  let el=root.querySelector('#lkmCaseStatus');
  if(!el){el=make('p','lkm-case-status');el.id='lkmCaseStatus';el.setAttribute('role','status');root.prepend(el);}
  el.textContent=message;el.classList.toggle('is-error',error);
}
async function api(path,options={}){
  const jwt=await store.authenticatedToken();
  const response=await fetch(base+'/rest/v1/'+path,{
    method:options.method||'GET',
    headers:{apikey:pubKey,Authorization:'Bearer '+jwt,Accept:'application/json',
      ...(options.data?{'Content-Type':'application/json'}:{}),...(options.upsert?{'Prefer':'resolution=merge-duplicates,return=representation'}:{})},
    ...(options.data?{body:JSON.stringify(options.data)}:{})
  });
  if(!response.ok)throw Error('Unable to access case studies ('+response.status+'). Confirm the Phase 22.3 SQL migration and admin permissions.');
  return response.status===204?[]:response.json();
}
function field(label,name,type='text',value='',max=200,help=''){
  const wrap=make('label','lkm-case-form-field');wrap.append(make('span','',label));
  const input=type==='textarea'?make('textarea'):make('input');
  if(type!=='textarea')input.type=type;
  input.name=name;input.value=value==null?'':String(value);
  input.maxLength=max;if(type==='textarea')input.rows=name==='approach'?5:3;
  wrap.append(input);
  if(help)wrap.append(make('small','',help));
  return wrap;
}
function initLogin(message=''){
  root.replaceChildren();
  const area=make('section','lkm-case-auth');
  area.append(make('p','lkm-case-kicker','ADMIN ACCESS'),make('h1','','Case study editor'),make('p','',message||'Sign in with your existing LilKangooMedia administrator account.'));
  const form=make('form');
  const email=field('Email','email','email','',200);
  email.querySelector('input').required=true;email.querySelector('input').autocomplete='username';
  const pass=field('Password','password','password','',256);
  pass.querySelector('input').required=true;pass.querySelector('input').autocomplete='current-password';
  const button=make('button','button button-dark','Sign in');button.type='submit';
  const info=make('p','lkm-case-status');info.setAttribute('role','status');
  form.append(email,pass,button,info);area.append(form);root.append(area);
  form.addEventListener('submit',async ev=>{
    ev.preventDefault();button.disabled=true;info.textContent='Signing in…';
    try{await store.login(email.querySelector('input').value,pass.querySelector('input').value);
      if(!await store.isAdmin()){store.logout();throw Error('This account is not an administrator.');}
      await load();
    }catch(e){info.textContent=e.message||'Sign-in failed';button.disabled=false;}
  });
}
async function load(){
  root.replaceChildren(make('p','','Loading published galleries and draft stories…'));
  const [galleries,stories]=await Promise.all([
    api('portfolio_galleries?select=id,slug,title,visibility,category,related_service_slug,client_name&order=title.asc&limit=1000'),
    api('lkm_case_studies?select=*&order=updated_at.desc&limit=1000')
  ]);
  state.galleries=galleries;
  state.stories=new Map(stories.map(s=>[s.gallery_id,s]));
  if(!state.galleries.some(g=>g.id===state.selected))state.selected=state.galleries[0]?.id||'';
  draw();
}
function draw(){
  root.replaceChildren();
  const head=make('div','lkm-case-admin-header');
  const intro=make('div');intro.append(make('p','lkm-case-kicker','PORTFOLIO · REAL PROJECTS'),make('h1','','Case studies'));
  intro.append(make('p','', 'Create a factual project story for an existing portfolio gallery. Nothing is published without your approval.'));
  const buttons=make('div','lkm-case-admin-tools');
  const reload=make('button','button button-light','Refresh');reload.type='button';reload.addEventListener('click',()=>void load().catch(e=>banner(e.message,true)));
  const galleryLink=make('a','button button-light','Manage galleries');galleryLink.href='/admin.html#galleries';
  const logout=make('button','button button-light','Sign out');logout.type='button';logout.addEventListener('click',()=>{store.logout();initLogin();});
  buttons.append(galleryLink,reload,logout);head.append(intro,buttons);root.append(head);
  const status=make('p','lkm-case-status');status.id='lkmCaseStatus';status.setAttribute('role','status');root.append(status);
  if(!state.galleries.length){root.append(make('p','','No portfolio galleries were found. Create a gallery first.'));return;}
  const grid=make('div','lkm-case-admin-grid');
  const aside=make('aside','lkm-case-picker');
  aside.append(make('h2','','Choose a gallery'));
  for(const g of state.galleries){
    const btn=make('button','lkm-case-gallery-choice');btn.type='button';btn.setAttribute('aria-current',String(state.selected===g.id));
    btn.append(make('strong','',g.title),make('small','',`${g.visibility} · ${state.stories.get(g.id)?.is_published?'Case study published':state.stories.has(g.id)?'Draft':'No story'}`));
    btn.addEventListener('click',()=>{state.selected=g.id;draw()});aside.append(btn);
  }
  const editor=make('section','lkm-case-editor');
  const g=state.galleries.find(g=>g.id===state.selected),prev=state.stories.get(g.id)||{};
  editor.append(make('p','lkm-case-kicker',g.category||'PORTFOLIO'),make('h2','',g.title));
  if(g.visibility!=='public')editor.append(make('p','lkm-case-warning','This gallery is not Public. You can save a draft, but publishing requires setting the gallery to Public first.'));
  const form=make('form','lkm-case-form');
  form.id='lkmCaseEditorForm';
  form.append(field('Public project headline *','headline','text',prev.headline||'',180,'Use the real project name or a descriptive headline, not a fabricated claim.'));
  form.append(field('Project objective *','objective','textarea',prev.objective||'',2500,'What was the client actually trying to achieve?'));
  form.append(field('Our approach *','approach','textarea',prev.approach||'',3500,'Describe work that LilKangooMedia actually completed.'));
  form.append(field('Work delivered (one per line)','deliverables','textarea',(prev.deliverables||[]).join('\n'),3100,'Only confirmed outputs: photos, edits, videos, website, content plan, etc.'));
  form.append(field('Confirmed outcomes (optional)','outcomes','textarea',prev.outcomes||'',2500,'Only supported results. Leave blank if metrics or outcomes are unavailable.'));
  const pair=make('div','lkm-case-form-two');
  pair.append(field('Public client label (optional)','client_label','text',prev.client_label||'',140,'Leave blank if you do not have permission to identify the client.'));
  pair.append(field('Location (optional)','project_location','text',prev.project_location||'',120));
  form.append(pair,field('Year (optional)','project_year','number',prev.project_year??'',4));
  const statusField=make('label','lkm-case-publish-field');const publish=make('input');publish.type='checkbox';publish.name='is_published';publish.checked=prev.is_published===true;
  statusField.append(publish,make('span','','Publish this real case study on the website'));
  form.append(statusField);
  form.append(make('p','lkm-case-fineprint','Publication requires a public portfolio gallery, a meaningful headline, objective and approach. Drafts are not visible to visitors. Do not publish private photos or unverified claims.'));
  const actions=make('div','lkm-case-form-actions');
  const save=make('button','button button-dark','Save case study');save.type='submit';
  const preview=make('a','button button-light','Preview public story ↗');preview.target='_blank';preview.rel='noopener noreferrer';preview.href='/portfolio.html#/story/'+encodeURIComponent(g.slug);
  if(prev.is_published!==true||g.visibility!=='public')preview.hidden=true;
  actions.append(save,preview);form.append(actions);editor.append(form);
  grid.append(aside,editor);root.append(grid);
  form.addEventListener('submit',async ev=>{
    ev.preventDefault();if(state.working)return;
    const f=new FormData(form),publishing=f.has('is_published');
    const record={gallery_id:g.id,headline:clean(f.get('headline'),180),objective:clean(f.get('objective'),2500),approach:clean(f.get('approach'),3500),
      deliverables:lines(f.get('deliverables')),outcomes:clean(f.get('outcomes'),2500),client_label:clean(f.get('client_label'),140),
      project_location:clean(f.get('project_location'),120),project_year:yearValue(f.get('project_year')),
      is_published:publishing};
    if(String(f.get('project_year')||'').trim() && record.project_year===null){banner('Enter a valid year between 2000 and 2100, or leave it blank.',true);return;}
    if(publishing&&!readyToPublish(record,g)){banner('To publish: make the gallery Public, and complete headline (8+ characters), objective (20+), and approach (20+).',true);return;}
    state.working=true;save.disabled=true;banner('Saving…');
    try{const rows=await api('lkm_case_studies?on_conflict=gallery_id',{method:'POST',upsert:true,data:record});
      if(!Array.isArray(rows)||!rows.length)throw Error('No story was returned after saving.');
      state.stories.set(g.id,rows[0]);draw();banner(publishing?'Published. The public page will now show this real case study.':'Saved as a private draft.');
    }catch(e){banner(e.message||'Unable to save',true);save.disabled=false;}finally{state.working=false;}
  });
}
(async()=>{
  if(!store?.configured||!base.startsWith('https://')||!pubKey){root.replaceChildren(make('p','','Supabase is not configured. Case study editing is unavailable in preview mode.'));return;}
  try {if(store.getSession() && await store.isAdmin()){await load();return;}}catch{}
  initLogin();
})().catch(e=>{root.replaceChildren(make('p','',e.message||'Unable to load case studies.'));});
