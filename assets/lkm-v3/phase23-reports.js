/* LilKangooMedia Phase 23.4 — private, read-only Sales Reporting. */
import {STAGES,cyprusToday,makeReport,exportSummaryCsv} from '/assets/lkm-v3/phase23-report-core.mjs';
const root=document.getElementById('lkmReportsRoot');
const store=window.LKMStore,cfg=window.LKM_CONFIG||{};
const base=String(cfg.SUPABASE_URL||'').replace(/\/+$/,''),key=String(cfg.SUPABASE_ANON_KEY||'');
const state={raw:null,period:'90',service:'',busy:false,error:'',generatedAt:null};
const node=(tag,cls='',val)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(val!==undefined)e.textContent=String(val);return e};
const append=(host,...children)=>{children.forEach(child=>host.append(child));return host};
const money=n=>new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}).format((Number(n)||0)/100);
const number=n=>new Intl.NumberFormat('en-IE').format(n||0);
const button=(text,cls='button button-light')=>{const b=node('button',cls,text);b.type='button';return b};
const link=(text,href,cls='lkm24-link')=>{const a=node('a',cls,text);a.href=href;return a};
function notice(text,error=false){const box=node('p','lkm24-message'+(error?' is-error':''),text);box.setAttribute('role','status');return box}
function renderLogin(reason='Sign in with your LilKangooMedia administrator account.'){
  root.replaceChildren();const pane=node('section','lkm24-login');append(pane,node('span','lkm24-kicker','PRIVATE REPORTS'),node('h1','','Sales overview'),node('p','lkm24-muted',reason));
  const form=node('form','lkm24-login-form');const user=node('input'),pass=node('input');user.type='email';pass.type='password';user.autocomplete='username';pass.autocomplete='current-password';user.required=pass.required=true;user.placeholder='Admin email';pass.placeholder='Password';const sign=button('Sign in','button button-dark'),status=notice('');sign.type='submit';append(form,user,pass,sign,status);pane.append(form);root.append(pane);
  form.addEventListener('submit',async e=>{e.preventDefault();if(!form.reportValidity())return;sign.disabled=true;status.textContent='Signing in…';try{await store.login(user.value.trim(),pass.value);if(!await store.isAdmin())throw Error('Administrator access required.');await refresh()}catch(error){store.logout();status.textContent=error.message||'Sign in failed.';sign.disabled=false;pass.value=''}});
}
async function api(path){
  const token=await store.authenticatedToken();
  const res=await fetch(base+'/rest/v1/'+path,{headers:{apikey:key,Authorization:'Bearer '+token,Accept:'application/json'},cache:'no-store'});
  if(!res.ok){const detail=await res.json().catch(()=>({}));throw Error(res.status===403?'Administrator access denied.':typeof detail.message==='string'?detail.message.slice(0,170):`Database unavailable (${res.status}).`)}
  const data=await res.json();if(!Array.isArray(data))throw Error('Database returned an invalid report.');return data;
}
async function paged(table,fields,order='created_at.desc'){
  const all=[];for(let offset=0;offset<10000;offset+=500){const rows=await api(`${table}?select=${fields}&order=${order}&limit=500&offset=${offset}`);all.push(...rows);if(rows.length<500)return all;}
  // Never display incomplete totals as complete analytics.
  throw Error(`Report for ${table} exceeds 10,000 rows. Use a server-side aggregated report before relying on totals.`);
}
async function fetchData(){
  const [leads,details,quotes,approvals,orders]=await Promise.all([
    paged('contact_leads','id,customer_name,created_at,service_slug,submission_type,archived_at'),
    paged('lkm_crm_lead_details','lead_id,stage,estimated_value_cents,next_follow_up_date','updated_at.desc'),
    paged('lkm_crm_quotes','id,lead_id,customer_name,quote_number,created_at,valid_until,status,line_items,discount_cents'),
    paged('lkm_quote_approvals','quote_id,decision,created_at,expires_at,decided_at','created_at.desc'),
    paged('stripe_orders','created_at,status,paid_amount_cents,service_slug')
  ]);
  return {leads,details,quotes,approvals,orders};
}
function top(){const head=node('div','lkm24-top');const title=node('div');append(title,node('p','lkm24-kicker','LILKANGOOMEDIA · SALES'),node('h1','','Sales reporting'),node('p','lkm24-muted','A read-only view of enquiries, proposals, estimated pipeline and payments.'));
  const actions=node('div','lkm24-actions');const reload=button('Refresh data');reload.addEventListener('click',()=>void refresh());const exportButton=button('Export summary CSV');exportButton.addEventListener('click',()=>{try{const report=makeReport(state.raw,{period:state.period,service:state.service,today:cyprusToday()});const blob=new Blob([exportSummaryCsv(report)],{type:'text/csv;charset=utf-8'});const src=URL.createObjectURL(blob);const a=document.createElement('a');a.href=src;a.download=`LKM-sales-report-${cyprusToday()}-${state.period}.csv`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(src),1000)}catch(err){root.prepend(notice(err.message,true))}});
  append(actions,exportButton,reload);append(head,title,actions);return head;}
function controls(){const box=node('div','lkm24-toolbar');const periodLabel=node('label');periodLabel.append(node('span','','Reporting period'));const period=node('select');for(const [value,text] of [['30','Last 30 days'],['90','Last 90 days'],['365','Last 365 days'],['all','All history']]){const op=node('option','',text);op.value=value;period.append(op)}period.value=state.period;period.addEventListener('change',()=>{state.period=period.value;render()});periodLabel.append(period);
  const serviceLabel=node('label');serviceLabel.append(node('span','','Service'));const service=node('select');const all=node('option','','All services');all.value='';service.append(all);
  const values=[...new Set([...state.raw.leads.map(x=>x.service_slug),...state.raw.orders.map(x=>x.service_slug)].filter(x=>typeof x==='string'&&x.trim()))].sort();
  for(const v of values){const item=node('option','',v.replaceAll('-',' '));item.value=v;service.append(item)}service.value=values.includes(state.service)?state.service:'';if(service.value!==state.service)state.service='';service.addEventListener('change',()=>{state.service=service.value;render()});serviceLabel.append(service);append(box,periodLabel,serviceLabel);return box;}
function kpi(name,value,note){const box=node('article','lkm24-kpi');append(box,node('span','',name),node('strong','',value),node('small','',note));return box;}
function kpis(r){const v=r.totals,wrap=node('section','lkm24-kpis');append(wrap,
  kpi('Enquiries',number(v.leads),`${number(v.archived)} archived included`),
  kpi('Open opportunities',number(v.open),'Current CRM stages · active enquiries'),
  kpi('Potential pipeline',money(v.openEstimatedCents),'Estimates, not income'),
  kpi('Sent quotation value',money(v.quotedSentCents),`${number(v.quotesSent)} sent versions · not paid`),
  kpi('Accepted quote value',money(v.acceptedQuoteCents),`${number(v.quotesAccepted)} accepted versions · not paid`),
  kpi('Stripe recorded gross',money(v.grossStripeCents),`${number(v.livePaidOrders)} live payment records · before refunds`));return wrap;}
function panel(title,help,body){const pane=node('section','lkm24-panel'),head=node('header','lkm24-panel-head');append(head,node('h2','',title),node('p','',help));append(pane,head,body);return pane;}
function empty(text){return node('p','lkm24-empty',text)}
function horizontal(rows,max,details){const list=node('div','lkm24-bars');if(!rows.length)return empty('No records for this selection.');const ceiling=Math.max(1,Number.isFinite(max)?max:Math.max(...rows.map(x=>x.count)));
 for(const r of rows){const line=node('div','lkm24-bar-line'),label=node('div','lkm24-bar-label');append(label,node('strong','',r.label||r.name),node('span','',number(r.count)));const rail=node('div','lkm24-rail');const bar=node('span','lkm24-fill');bar.style.width=Math.min(100,Math.round(r.count/ceiling*100))+'%';bar.setAttribute('aria-label',`${r.label||r.name}: ${r.count}`);rail.append(bar);line.append(label,rail);list.append(line)}if(details)list.append(node('p','lkm24-footnote',details));return list;}
function pipeline(r){const box=node('div','lkm24-panels');const total=r.stages.reduce((s,x)=>s+x.count,0);
  box.append(panel('CRM stages','Current stages of enquiries received in the selected period. Not historical stage changes.',horizontal(r.stages.map(x=>({name:x.label,count:x.count})),Math.max(...r.stages.map(x=>x.count)),`${total} leads including archived. Archived enquiries are not part of the open pipeline.`)));
  const quotes=node('div','lkm24-decision-wrap'),stats=node('div','lkm24-decision-grid');const vals=[['Draft versions',r.totals.quotesDraft],['Sent versions',r.totals.quotesSent],['Accepted versions',r.totals.quotesAccepted],['Declined versions',r.totals.quotesDeclined],['Awaiting or unshared',r.totals.quotesPending]];
  for(const [label,n] of vals){const card=node('div','lkm24-decision');append(card,node('span','',label),node('strong','',number(n)));stats.append(card)}quotes.append(stats);
  const rate=r.totals.acceptedRate;quotes.append(node('p','lkm24-figure',rate===null?'—':Math.round(rate*100)+'%'));
  quotes.append(node('p','lkm24-footnote','Accepted / sent quotation versions created during this period. Multiple revisions count separately. This is not a payment or sales conversion rate.'));
  box.append(panel('Quotation decisions','Separate from won/lost CRM stages and Stripe payments.',quotes));return box;}
function trends(r){const box=node('div','lkm24-panels');const rows=r.months;const max=Math.max(1,...rows.map(m=>m.enquiries));const chart=node('div','lkm24-chart');
 for(const m of rows){const col=node('div','lkm24-chart-col');const bar=node('div','lkm24-chart-bar');bar.style.height=`${Math.max(3,Math.round(m.enquiries/max*100))}%`;bar.title=`${m.month}: ${m.enquiries} enquiries`;bar.setAttribute('aria-label',`${m.month}: ${m.enquiries} enquiries`);append(col,node('strong','',number(m.enquiries)),bar,node('span','',m.month.slice(5)+'/'+m.month.slice(2,4)));chart.append(col)}
 box.append(panel('Monthly enquiries','Recent calendar months within the selected data window.',chart));
 const mix=node('div','lkm24-mix');append(mix,node('h3','','Most requested services'),horizontal(r.services,undefined,'Based on the service recorded on the enquiry.'));
 append(mix,node('h3','','Request types'),horizontal(r.sources,undefined,'Request types are not marketing attribution channels.'));
 box.append(panel('Request breakdown','Top groups from enquiries received within the selected period.',mix));return box;}
function tasks(r){const wrap=node('div','lkm24-panels');const due=node('div','lkm24-task-list');if(!r.followups.length)due.append(empty('No overdue or due follow-ups in this selection.'));
 else for(const f of r.followups){const row=node('div','lkm24-task');const left=node('div');append(left,node('strong','',f.name),node('small','',`${f.service} · ${f.stage}`));append(row,left,node('span','lkm24-date',f.date));due.append(row)}
 due.append(link('Open CRM to update follow-ups →','/admin-crm.html'));
 wrap.append(panel('Follow-ups due',`${r.totals.followupsDue} active enquiries with follow-up dates today or earlier.`,due));
 const pending=node('div','lkm24-task-list');if(!r.pendingOffers.length)pending.append(empty('No unanswered sent offers in this selection.'));
 else for(const q of r.pendingOffers){const row=node('div','lkm24-task');const left=node('div');append(left,node('strong','',`LKM-Q-${String(q.number||0).padStart(6,'0')} · ${q.customer}`),node('small','',`${q.decision==='no link'?'No client decision link':q.decision} · ${q.totalCents===null?'Amount unavailable':money(q.totalCents)}`));append(row,left,link(q.expiry&&q.expiry<cyprusToday()?'Expired · open ↗':`Until ${q.expiry||'—'} ↗`,'/admin-quotes.html?quote_id='+encodeURIComponent(q.id)));pending.append(row)}
 wrap.append(panel('Proposals awaiting response',`${r.totals.quotesPending} sent versions with no final decision.`,pending));return wrap;}
function footer(r){const info=node('section','lkm24-disclaimer');append(info,node('h2','','How to read these numbers'),
 node('p','','The date filter uses the creation date of each record. CRM stages are the current status of leads created in the selected period, not historical stage snapshots.'),
 node('p','','Estimated pipeline, sent/accepted quotation totals and Stripe gross payment records measure different things; they must not be added together. Accepted quotes do not confirm bookings or payments.'),
 node('p','','Stripe gross is based on paid orders recorded by the site and excludes test-mode records. Manual refunds and Stripe fees are not reconciled here. For actual net revenue use the Stripe app.'),
 node('p','',r.totals.invalidQuoteCount?`${r.totals.invalidQuoteCount} sent quotation(s) had invalid line items and their amounts were excluded from sums.`:'Quotation values are calculated from saved line items and discounts.'),
 node('p','','CSV export contains grouped summaries only; it excludes customer names, emails, phone numbers and free-form briefs. No automatic emails, payments or refunds are triggered.'));return info;}
function render(){if(!state.raw)return;let r;try{r=makeReport(state.raw,{period:state.period,service:state.service,today:cyprusToday()})}catch(error){showError(error);return}
 root.replaceChildren();root.append(top(),controls());root.append(notice(`Read-only report · ${r.window.from} to ${r.window.to}${r.window.service==='all'?'':' · '+r.window.service} · refreshed ${state.generatedAt?.toLocaleTimeString('en-GB')||'just now'}`));
 root.append(kpis(r),pipeline(r),trends(r),tasks(r),footer(r));
}
function showError(error){root.replaceChildren();const box=node('section','lkm24-login');append(box,node('h1','','Report unavailable'),node('p','lkm24-muted',error?.message||'Unable to load complete data.'));const again=button('Retry','button button-dark');again.addEventListener('click',()=>void refresh());box.append(again,link('Return to CRM','/admin-crm.html'));root.append(box)}
async function refresh(){if(state.busy)return;state.busy=true;root.replaceChildren(notice('Loading private report data…'));
 try{if(!store?.configured||!await store.isAdmin())throw Error('Administrator access required.');state.raw=await fetchData();state.generatedAt=new Date();render()}
 catch(err){showError(err)}finally{state.busy=false}}
async function init(){if(!store?.configured){showError(Error('Supabase is not configured.'));return}if(!store.getSession()){renderLogin();return}try{if(!await store.isAdmin())throw Error('Not an administrator');await refresh()}catch{renderLogin('Session expired or administrator access denied. Sign in again.')}}
void init();
