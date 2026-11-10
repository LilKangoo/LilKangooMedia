/* LilKangooMedia Phase 23.1 — private admin Sales CRM.
 * Reads existing contact_leads; stores commercial metadata separately.
 * NEVER changes Stripe payments, booking holds, order statuses or refunds.
 * No automatic emails are sent: contact actions open the user's email/phone app.
 */
(()=>{'use strict';
 const root=document.getElementById('lkmCrmRoot');if(!root)return;
 const store=window.LKMStore;
 const cfg=window.LKM_CONFIG||{};
 const base=String(cfg.SUPABASE_URL||'').replace(/\/$/,'');
 const key=String(cfg.SUPABASE_ANON_KEY||'');
 const STAGES=[['new','New'],['qualified','Qualified'],['proposal','Proposal sent'],['negotiation','Negotiating'],['won','Won'],['lost','Lost']];
 const ACTIVE=new Set(['new','qualified','proposal','negotiation']);
 const PRI=[['low','Low'],['normal','Normal'],['high','High']];
 const ACT=[['note','Internal note'],['call','Call completed'],['email','Email sent manually'],['meeting','Meeting held']];
 const state={leads:[],details:new Map(),activities:[],selected:'',search:'',stage:'all',view:'board',loading:false,saving:false};
 const create=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=String(text);return el;};
 const node=(tag,cls,text)=>create(tag,cls,text);
 const add=(parent,...children)=>{parent.append(...children);return parent};
 const stamp=s=>{if(!s)return '—';const d=new Date(s);return Number.isFinite(d.getTime())?d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):String(s).slice(0,10)};
 const euros=c=>Number.isSafeInteger(Number(c))?'€'+(Number(c)/100).toLocaleString('en-IE',{minimumFractionDigits:0,maximumFractionDigits:2}):'—';
 const today=()=>{
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Nicosia',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const p=k=>parts.find(x=>x.type===k)?.value||'';
  return `${p('year')}-${p('month')}-${p('day')}`;
 };
 const stageName=s=>STAGES.find(x=>x[0]===s)?.[1]||STAGES[0][1];
 const detail=id=>state.details.get(id)||{lead_id:id,stage:'new',priority:'normal',estimated_value_cents:null,next_follow_up_date:null,internal_notes:''};
 const validEmail=x=>typeof x==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x)&&x.length<=200;
 function selection(label,options,value){const wrap=node('label','lkm23-label');wrap.append(node('span','',label));const el=node('select');for(const [v,name] of options){const op=node('option','',name);op.value=v;if(v===value)op.selected=true;el.append(op)}wrap.append(el);return [wrap,el]}
 function message(text,error=false){const el=document.getElementById('lkm23Status');if(el){el.textContent=text||'';el.classList.toggle('is-error',!!error)}}
 async function api(path,options={}){
  if(!store?.configured||!base.startsWith('https://')||!key)throw Error('CRM requires Supabase configuration.');
  const token=await store.authenticatedToken();
  const response=await fetch(`${base}/rest/v1/${path}`,{
   method:options.method||'GET',
   headers:{apikey:key,Authorization:`Bearer ${token}`,'Content-Type':'application/json',...options.headers},
   ...(options.body!==undefined?{body:JSON.stringify(options.body)}:{})
  });
  if(!response.ok){if(response.status===401||response.status===403)throw Error('Administrator session expired or permission denied.');throw Error('CRM request could not be completed ('+response.status+'). Check SQL migration and try again.');}
  const text=await response.text();return text?JSON.parse(text):[];
 }
 async function paged(table,query,max=2000){
  const out=[];
  for(let offset=0;offset<max;offset+=400){
   const rows=await api(table+'?'+query+'&limit=400&offset='+offset);
   if(!Array.isArray(rows))throw Error('Unexpected CRM response.');
   out.push(...rows);if(rows.length<400)break;
  }
  return out;
 }
 function showLogin(info='Sign in with your LilKangooMedia administrator account.'){
  root.replaceChildren();
  const box=node('section','lkm23-login');
  add(box,node('p','lkm23-eyebrow','PRIVATE · SALES OPERATIONS'),node('h1','','Sales CRM'),node('p','lkm23-muted',info));
  const form=node('form','lkm23-authform');form.id='lkm23AuthForm';
  const email=node('input');email.type='email';email.name='email';email.autocomplete='username';email.required=true;email.placeholder='Admin email';
  const password=node('input');password.type='password';password.name='password';password.autocomplete='current-password';password.required=true;password.placeholder='Password';
  const button=node('button','button button-dark','Sign in');button.type='submit';
  const status=node('p','lkm23-login-message');status.id='lkm23LoginStatus';status.setAttribute('role','status');
  add(form,email,password,button,status);box.append(form);
  const back=node('a','lkm23-back','← Back to administration');back.href='/admin.html';box.append(back);
  root.append(box);
  form.addEventListener('submit',async e=>{
   e.preventDefault();if(!form.reportValidity())return;
   button.disabled=true;status.textContent='Signing in…';
   try{
    await store.login(email.value.trim(),password.value);
    if(!await store.isAdmin())throw Error('This account does not have administrator access.');
    password.value='';await refresh();
   }catch(error){store.logout();password.value='';status.textContent=error.message||'Sign in failed.';button.disabled=false;}
  });
 }
 function header(){
  const h=node('div','lkm23-top');
  const title=node('div');add(title,node('p','lkm23-eyebrow','LILKANGOOMEDIA · SALES'),node('h1','','Sales CRM'),node('p','lkm23-muted','Enquiries, offers and follow-ups. All values are estimates until confirmed with a client.'));
  const buttons=node('div','lkm23-top-actions');
  const sync=node('button','button button-light','Refresh data');sync.type='button';sync.addEventListener('click',()=>void refresh());
  const logout=node('button','button button-light','Sign out');logout.type='button';logout.addEventListener('click',()=>{store.logout();showLogin('Signed out. Sign in to view private enquiries.');});
  add(buttons,sync,logout);add(h,title,buttons);return h;
 }
 function stat(label,val,sub){const cell=node('div','lkm23-stat');add(cell,node('span','',label),node('strong','',val),node('small','',sub));return cell}
 function stats(){
  const box=node('div','lkm23-stats');box.id='lkm23Stats';
  const pending=state.leads.filter(l=>ACTIVE.has(detail(l.id).stage));
  const due=pending.filter(l=>{const d=detail(l.id).next_follow_up_date;return d&&d<=today()}).length;
  const forecast=pending.reduce((n,l)=>n+Number(detail(l.id).estimated_value_cents||0),0);
  add(box,stat('Enquiries',state.leads.length,'From existing lead database'),stat('Open opportunities',pending.length,'New through negotiation'),stat('Follow-ups due',due,'Today or overdue'),stat('Potential pipeline',euros(forecast),'Estimates, not income'));
  return box;
 }
 function filters(){
  const outer=node('div','lkm23-filters');
  const search=node('input');search.type='search';search.placeholder='Search name, email, service or brief…';search.setAttribute('aria-label','Search enquiries');search.value=state.search;
  search.addEventListener('input',()=>{state.search=search.value;renderPipeline()});
  const stage=node('select');stage.setAttribute('aria-label','Filter by sales stage');
  for(const [v,label] of [['all','All stages'],...STAGES]){const opt=node('option','',label);opt.value=v;opt.selected=v===state.stage;stage.append(opt)}
  stage.addEventListener('change',()=>{state.stage=stage.value;renderPipeline()});
  const mode=node('div','lkm23-toggle');for(const [v,label] of [['board','Board'],['list','List']]){
   const b=node('button','',label);b.type='button';b.classList.toggle('is-active',state.view===v);b.setAttribute('aria-pressed',String(state.view===v));
   b.addEventListener('click',()=>{state.view=v;for(const x of mode.querySelectorAll('button')){x.classList.toggle('is-active',x===b);x.setAttribute('aria-pressed',String(x===b))}renderPipeline()});mode.append(b);
  }
  add(outer,search,stage,mode);return outer;
 }
 function filtered(){const q=state.search.trim().toLocaleLowerCase();return state.leads.filter(l=>{
  if(state.stage!=='all'&&detail(l.id).stage!==state.stage)return false;
  if(!q)return true;
  return [l.customer_name,l.customer_email,l.phone,l.service_slug,l.service_type,l.message,l.package_id].some(v=>String(v||'').toLocaleLowerCase().includes(q));
 });}
 function leadCard(l){
  const d=detail(l.id);const active=state.selected===l.id;
  const btn=node('button','lkm23-card'+(active?' is-selected':''));btn.type='button';btn.dataset.leadId=l.id;
  btn.setAttribute('aria-pressed',String(active));
  const head=node('div','lkm23-card-head');add(head,node('strong','',l.customer_name||'Unnamed customer'),node('span','lkm23-priority '+(d.priority==='high'?'high':''),d.priority==='high'?'High priority':stageName(d.stage)));
  const source=node('p','lkm23-service',l.service_slug||l.service_type||'General enquiry');
  const meta=node('div','lkm23-card-foot');
  add(meta,node('span','',stamp(l.created_at)),node('strong','',d.estimated_value_cents===null?'Value not set':euros(d.estimated_value_cents)));
  add(btn,head,source,meta);
  if(d.next_follow_up_date){const due=d.next_follow_up_date<=today()&&ACTIVE.has(d.stage);btn.append(node('small','lkm23-due'+(due?' is-overdue':''),(due?'Due: ':'Next: ')+d.next_follow_up_date))}
  btn.addEventListener('click',()=>void selectLead(l.id));
  return btn;
 }
 function renderPipeline(){
  const target=document.getElementById('lkm23Pipeline');if(!target)return;
  target.replaceChildren();const set=filtered();
  const title=node('p','lkm23-count',`Showing ${set.length} of ${state.leads.length} enquiries${state.leads.length>=2000?' · first 2,000 only':''}`);target.append(title);
  if(!set.length){target.append(node('p','lkm23-empty','No enquiries match this filter.'));return}
  if(state.view==='list'){
   const list=node('div','lkm23-list');set.forEach(l=>list.append(leadCard(l)));target.append(list);return;
  }
  const board=node('div','lkm23-board');board.setAttribute('aria-label','Sales stages');
  for(const [value,label] of STAGES){if(state.stage!=='all'&&state.stage!==value)continue;
   const rows=set.filter(l=>detail(l.id).stage===value);
   const col=node('section','lkm23-column');const heading=node('h2','',label+' · '+rows.length);col.append(heading);
   if(rows.length)rows.forEach(l=>col.append(leadCard(l)));else col.append(node('p','lkm23-column-empty','No enquiries'));
   board.append(col);
  }
  target.append(board);
 }
 function line(title,value){const el=node('div','lkm23-detail-line');add(el,node('span','',title),node('strong','',value||'—'));return el}
 async function selectLead(id){
  if(!state.leads.some(x=>x.id===id))return;
  state.selected=id;state.activities=[];renderPipeline();renderDetail();
  try{const rows=await api('lkm_crm_activities?select=id,lead_id,kind,summary,created_at&lead_id=eq.'+encodeURIComponent(id)+'&order=created_at.desc&limit=100');
    if(state.selected===id){state.activities=Array.isArray(rows)?rows:[];renderActivity()}}
  catch(e){if(state.selected===id){const c=document.getElementById('lkm23Activities');if(c)c.textContent='Activity history unavailable: '+e.message}}
 }
 function detailInput(label,tag,type,value,id){const wrap=node('label','lkm23-label');wrap.append(node('span','',label));const el=node(tag);el.id=id;
  if(tag==='input')el.type=type;el.value=value==null?'':String(value);wrap.append(el);return[wrap,el]}
 function euroToCents(v){
  const x=String(v).trim().replace(',','.');if(!x)return null;
  if(!/^(?:\d{1,8})(?:\.\d{1,2})?$/.test(x))throw Error('Enter an amount from €0 to €10,000,000 with up to two decimal places.');
  const [units,dec='']=x.split('.');const cents=Number(units)*100+Number(dec.padEnd(2,'0'));
  if(!Number.isSafeInteger(cents)||cents>1000000000)throw Error('Amount exceeds the allowed range.');
  return cents;
 }
 function renderDetail(){
  const target=document.getElementById('lkm23Details');if(!target)return;
  target.replaceChildren();const l=state.leads.find(x=>x.id===state.selected);
  if(!l){target.append(node('p','lkm23-empty','Select an enquiry to review its details.'));return}
  const d=detail(l.id);
  const header=node('div','lkm23-detail-title');add(header,node('p','lkm23-eyebrow','OPPORTUNITY'),node('h2','',l.customer_name||'Customer enquiry'),node('span','',l.service_slug||l.service_type||'General enquiry'));
  const info=node('div','lkm23-detail-meta');add(info,line('Received',stamp(l.created_at)),line('Requested date',l.preferred_date||'Not specified'),line('Email',l.customer_email),line('Phone',l.phone||'Not provided'));
  target.append(header,info);
  const links=node('div','lkm23-contact');
  if(validEmail(l.customer_email)){const a=node('a','button button-dark','Write email');a.href='mailto:'+encodeURIComponent(l.customer_email)+'?subject='+encodeURIComponent('LilKangooMedia enquiry');links.append(a)}
  if(typeof l.phone==='string'&&l.phone.trim()){const digits=l.phone.replace(/[^0-9+]/g,'');
   const phone=node('a','button button-light','Call client');phone.href='tel:'+digits;links.append(phone);
   const intl=digits.startsWith('+')?digits.slice(1):digits.startsWith('00')?digits.slice(2):'';
   if(/^\d{8,15}$/.test(intl)){const wa=node('a','button button-light','WhatsApp');wa.href='https://wa.me/'+intl;wa.target='_blank';wa.rel='noopener noreferrer';links.append(wa)}
  }
  if(links.children.length)target.append(links);
  if(l.message){const brief=node('details','lkm23-brief');const summary=node('summary','','Original customer brief');brief.append(summary,node('p','',l.message));target.append(brief)}
  const section=node('section','lkm23-edit');section.append(node('h3','','Sales details'));
  const [stageWrap,stage]=selection('Stage',STAGES,d.stage);
  const [priorityWrap,priority]=selection('Priority',PRI,d.priority);
  const [valueWrap,value]=detailInput('Estimated deal value (€)','input','text',d.estimated_value_cents===null?'':(d.estimated_value_cents/100).toFixed(2),'lkm23Value');value.inputMode='decimal';value.placeholder='e.g. 750.00';
  const [dateWrap,date]=detailInput('Next follow-up','input','date',d.next_follow_up_date||'','lkm23Followup');
  const [notesWrap,notes]=detailInput('Internal notes (private)','textarea','',d.internal_notes||'','lkm23Notes');notes.rows=4;notes.maxLength=5000;notes.placeholder='Project requirements, agreed next steps, private reminders…';
  const fields=node('div','lkm23-fields');add(fields,stageWrap,priorityWrap,valueWrap,dateWrap,notesWrap);section.append(fields);
  const save=node('button','button button-dark','Save sales details');save.type='button';save.addEventListener('click',async()=>{
   if(state.saving)return;try{
    const amount=euroToCents(value.value);
    const payload={lead_id:l.id,stage:stage.value,priority:priority.value,estimated_value_cents:amount,next_follow_up_date:date.value||null,internal_notes:notes.value.trim().slice(0,5000)};
    if(payload.next_follow_up_date&&!/^\d{4}-\d{2}-\d{2}$/.test(payload.next_follow_up_date))throw Error('Choose a valid follow-up date.');
    if(!STAGES.some(x=>x[0]===payload.stage)||!PRI.some(x=>x[0]===payload.priority))throw Error('Invalid sales stage or priority.');
    state.saving=true;save.disabled=true;message('Saving…');
    const existing=state.details.has(l.id);
    const rows=await api(existing?'lkm_crm_lead_details?lead_id=eq.'+encodeURIComponent(l.id):'lkm_crm_lead_details',{
      method:existing?'PATCH':'POST',headers:{Prefer:'return=representation'},body:payload
    });
    if(!Array.isArray(rows)||rows.length!==1)throw Error('Save not acknowledged by database. Refresh to verify.');
    state.details.set(l.id,rows[0]);renderStats();renderPipeline();message('Sales details saved.');
   }catch(err){message(err.message||'Could not save sales details.',true)}finally{state.saving=false;save.disabled=false}
  });section.append(save);
  const hint=node('p','lkm23-hint','CRM stages are separate from payment and booking statuses. Setting “Won” does not confirm a reservation or mark it paid.');section.append(hint);
  target.append(section);
  const activity=node('section','lkm23-activity');activity.append(node('h3','','Interaction log'));
  const [kindWrap,kind]=selection('Interaction type',ACT,'note');
  const [summaryWrap,summary]=detailInput('Record what happened','textarea','', '', 'lkm23Summary');summary.rows=3;summary.maxLength=1500;summary.placeholder='Notes from a call, manually sent email or meeting…';
  const record=node('button','button button-light','Add activity');record.type='button';
  record.addEventListener('click',async()=>{
    const text=summary.value.trim();if(text.length<2||text.length>1500){message('Enter 2–1,500 characters for this activity.',true);return}
    record.disabled=true;message('Recording activity…');
    try{
      const rows=await api('lkm_crm_activities',{method:'POST',headers:{Prefer:'return=representation'},body:{lead_id:l.id,kind:kind.value,summary:text}});
      if(!Array.isArray(rows)||rows.length!==1)throw Error('Activity was not confirmed.');
      if(state.selected===l.id){state.activities.unshift(rows[0]);summary.value='';renderActivity();message('Activity recorded. No email was sent automatically.');}
    }catch(e){message(e.message||'Could not save activity.',true)}finally{record.disabled=false}
  });
  const timeline=node('div','lkm23-timeline');timeline.id='lkm23Activities';
  add(activity,kindWrap,summaryWrap,record,timeline);target.append(activity);
  renderActivity();
 }
 function renderActivity(){
  const target=document.getElementById('lkm23Activities');if(!target)return;
  target.replaceChildren();if(!state.activities.length){target.append(node('p','lkm23-hint','No interactions recorded yet.'));return}
  for(const entry of state.activities){const card=node('article','lkm23-activity-entry');const type=ACT.find(x=>x[0]===entry.kind)?.[1]||'Activity';
   add(card,node('strong','',type+' · '+stamp(entry.created_at)),node('p','',entry.summary));target.append(card)}
 }
 function renderStats(){const old=document.getElementById('lkm23Stats');if(old)old.replaceWith(stats())}
 function render(){
  root.replaceChildren();root.append(header(),stats());
  const bar=filters(),area=node('div','lkm23-layout'),left=node('section','lkm23-main'),right=node('aside','lkm23-sidebar');
  left.id='lkm23Pipeline';right.id='lkm23Details';
  add(area,left,right);root.append(bar,area);
  const status=node('p','lkm23-status');status.id='lkm23Status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');root.append(status);
  renderPipeline();renderDetail();
 }
 async function refresh(){
  if(state.loading)return;state.loading=true;
  try{
    if(!await store.isAdmin())throw Error('Only an administrator can view the CRM.');
    const [leads,details]=await Promise.all([
      paged('contact_leads','select=id,customer_name,customer_email,phone,service_slug,service_type,package_id,preferred_date,message,submission_type,status,created_at&order=created_at.desc',2000),
      paged('lkm_crm_lead_details','select=*&order=updated_at.desc',2000)
    ]);
    state.leads=leads;state.details=new Map(details.filter(d=>d.lead_id).map(d=>[d.lead_id,d]));
    if(!state.leads.find(x=>x.id===state.selected))state.selected=state.leads[0]?.id||'';
    state.activities=[];
    render();
    if(state.selected)await selectLead(state.selected);
  }catch(error){root.replaceChildren();const card=node('section','lkm23-error');add(card,node('h1','','CRM could not load'),node('p','',error.message||'An unexpected error occurred.'));
    const retry=node('button','button button-dark','Retry');retry.type='button';retry.addEventListener('click',()=>void refresh());card.append(retry);
    const sign=node('button','button button-light','Sign in again');sign.type='button';sign.addEventListener('click',()=>{store.logout();showLogin()});card.append(sign);root.append(card);
  }finally{state.loading=false}
 }
 async function start(){
  if(!store?.configured){root.replaceChildren(node('p','lkm23-empty','CRM requires Supabase. Configure the existing public Supabase connection.'));return}
  if(!store.getSession()){showLogin();return}
  try{if(!await store.isAdmin())throw Error('Not an administrator');await refresh()}catch{store.logout();showLogin('Your session expired or the account does not have administrator access. Sign in again.')}
 }
 void start();
})();
