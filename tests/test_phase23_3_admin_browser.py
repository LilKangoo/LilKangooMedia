from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
JS=(ROOT/'assets/lkm-v3/phase23-crm.js').read_text()
CSS=(ROOT/'assets/lkm-v3/phase23-crm.css').read_text()
STUB=r'''(() => {
window.confirm=()=>true;window.prompt=()=> 'DELETE';
window.LKM_CONFIG={SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'sb_publishable_example'};
window.LKMStore={configured:true,getSession:()=>({access_token:'jwt'}),isAdmin:async()=>true,authenticatedToken:async()=> 'jwt',logout:()=>{},login:async()=>{}};
const leads=[
 {id:'c8ff05e2-988f-44e6-ac40-38c267ca3dee',customer_name:'Alice Restaurant',customer_email:'alice@example.com',phone:'+35799123456',service_slug:'commercial-video-reels',service_type:null,package_id:'intro',preferred_date:'2026-12-15',message:'We need a branded video. <img src=x onerror=window.hacked=true>',submission_type:'b2b_enquiry',status:'new',archived_at:null,created_at:'2026-11-10T08:00:00Z'},
 {id:'c8ff05e2-988f-44e6-ac40-38c267ca3def',customer_name:'Bob Hotel',customer_email:'bob@example.com',phone:'',service_slug:'website-design',service_type:null,package_id:null,preferred_date:null,message:'Website package',submission_type:'general_enquiry',status:'new',archived_at:null,created_at:'2026-11-09T08:00:00Z'}
];
const details=[{lead_id:leads[1].id,stage:'proposal',priority:'high',estimated_value_cents:75000,next_follow_up_date:'2026-11-12',internal_notes:'Quote sent to Bob'}];
const quotes=[{id:'fd33495f-2259-4b57-b9c3-f6ddf369d910',lead_id:leads[0].id,quote_number:11,status:'sent',title:'Real photo proposal',updated_at:'2026-11-10T09:00:00Z',created_at:'2026-11-10T08:30:00Z'}];
const audits=[],activities=[];window.__data={leads,details,quotes,audits,activities};
window.fetch=async function(input,opts={}){
 const url=String(input),path=new URL(url).pathname,method=opts.method||'GET';
 const q=new URL(url).searchParams;let out;
 if(path.endsWith('/contact_leads')){
  if(method==='GET')out=leads;
  if(method==='PATCH'){
   const id=q.get('id').slice(3),row=leads.find(x=>x.id===id),body=JSON.parse(opts.body);
   if(body.preferred_date&&id===leads[0].id&&body.preferred_date==='2026-12-20')return new Response(JSON.stringify({message:'Confirmed booking: cancel/rebook in calendar.'}),{status:409});
   Object.assign(row,body);out=[row];audits.push({id:'audit-'+(audits.length+1),lead_id:id,action:body.archived_at===null?'restored':body.archived_at?'archived':'edited',changed_fields:Object.keys(body),occurred_at:'2026-11-10T10:00:00Z'});
  }
 } else if(path.endsWith('/lkm_crm_lead_details')){
  if(method==='GET')out=details;else if(method==='POST'){const v=JSON.parse(opts.body);details.push({...v,updated_at:new Date().toISOString()});out=[details.at(-1)];}
  else if(method==='PATCH'){const v=JSON.parse(opts.body);const i=details.findIndex(x=>x.lead_id===q.get('lead_id').slice(3));details[i]={...details[i],...v};out=[details[i]];}
 }else if(path.endsWith('/lkm_crm_quotes'))out=quotes;
 else if(path.endsWith('/lkm_booking_confirmations'))out=[];
 else if(path.endsWith('/lkm_crm_activities')){if(method==='GET')out=activities.filter(a=>a.lead_id===q.get('lead_id').slice(3));else if(method==='POST'){
  const r=JSON.parse(opts.body);r.id='a1';r.created_at='2026-11-10T10:00:00Z';activities.push(r);out=[r];}}
 else if(path.endsWith('/lkm_crm_lead_audit'))out=audits.filter(x=>x.lead_id===q.get('lead_id').slice(3));
 else if(path.endsWith('/rpc/lkm_crm_admin_remove_lead')){
  const body=JSON.parse(opts.body);if(!body.p_confirmation||body.p_confirmation!=='DELETE')return new Response('{}',{status:400});
  const i=leads.findIndex(l=>l.id===body.p_lead_id);
  if(!leads[i].archived_at||quotes.some(qq=>qq.lead_id===body.p_lead_id))return new Response(JSON.stringify({message:'This enquiry has quotations: retain and archive it instead.'}),{status:409});
  leads.splice(i,1);out={ok:true,deleted:body.p_lead_id};
 }else throw Error('Unexpected fetch: '+url);
 return new Response(JSON.stringify(out??[]),{status:200,headers:{'Content-Type':'application/json'}});
};
})();'''
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height in [(1380,900),(390,844)]:
  page=browser.new_page(viewport={'width':width,'height':height});errs=[]
  page.on('pageerror',lambda e:errs.append(str(e)))
  page.set_content('<main id="lkmCrmRoot"></main>')
  page.add_style_tag(content=CSS);page.evaluate(STUB);page.add_script_tag(content=JS)
  page.wait_for_selector('.lkm23-card',timeout=10000)
  assert page.locator('.lkm23-card').count()==2
  assert not page.evaluate('window.hacked')
  assert '€750' in page.locator('.lkm23-stat').nth(3).inner_text()
  page.get_by_role('button',name='Edit enquiry').click()
  page.locator('#lkm23Lead_customer_name').fill('Alice New Name')
  page.locator('#lkm23Lead_message').fill('Edited real customer brief')
  page.get_by_role('button',name='Save enquiry changes').click()
  page.wait_for_function('window.__data.leads[0].customer_name === "Alice New Name"')
  page.wait_for_selector('.lkm23-audit-row',timeout=3000)
  assert 'Alice New Name' in page.locator('.lkm23-detail-title').inner_text()
  assert page.locator('.lkm23-quote-mini').count()==1
  assert page.get_by_text('LKM-Q-000011').count()==1
  page.get_by_role('button',name='Archive enquiry').click()
  page.wait_for_function('window.__data.leads[0].archived_at !== null && document.querySelectorAll(".lkm23-archived-chip").length===1')
  assert page.locator('.lkm23-card').count()==1
  assert page.locator('.lkm23-archived-chip').count()==1
  page.get_by_role('button',name='Delete permanently').click()
  page.wait_for_function('document.getElementById("lkm23Status").textContent.includes("quotations")')
  assert len(page.evaluate('window.__data.leads'))==2, 'must not delete lead with linked quote'
  page.get_by_role('button',name='Restore enquiry').click()
  page.wait_for_function('window.__data.leads[0].archived_at === null && document.querySelectorAll(".lkm23-card").length===2')
  assert page.locator('.lkm23-card').count()==2
  # Show editing and deletion of independent archived enquiry without quote
  page.locator('.lkm23-card').filter(has_text='Bob Hotel').click()
  page.get_by_role('button',name='Archive enquiry').click()
  page.wait_for_function('window.__data.leads[1].archived_at !== null')
  page.get_by_role('button',name='Delete permanently').click()
  page.wait_for_function('window.__data.leads.length === 1 && document.querySelectorAll(".lkm23-card").length===0')
  assert page.locator('.lkm23-card').count()==0  # no archived enquiries remain
  assert not errs, 'JS errors: '+str(errs)
  (ROOT/'tests').mkdir(exist_ok=True)
  page.screenshot(path=str(ROOT/'tests'/f'admin_controls_{width}.png'),full_page=True)
  print('PASS CRM admin control',width)
  page.close()
 page=browser.new_page()
 page.set_content('<main id="lkmCrmRoot"></main>');page.evaluate(STUB)
 page.evaluate('(()=>{window.LKMStore.isAdmin=async()=>false;window.fetch=async()=>{throw Error("Private lead read!")};return null})()')
 page.add_script_tag(content=JS);page.wait_for_selector('#lkm23AuthForm')
 assert not page.locator('.lkm23-card').count()
 print('PASS non-admin gate')
 page.close();browser.close()
