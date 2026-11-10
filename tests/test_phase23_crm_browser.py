from pathlib import Path
import json
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
JS=(ROOT/'assets/lkm-v3/phase23-crm.js').read_text()
CSS=(ROOT/'assets/lkm-v3/phase23-crm.css').read_text()

STUB=r'''(() => {
window.LKM_CONFIG={SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'sb_publishable_example'};
window.LKMStore={configured:true,getSession:()=>({access_token:'jwt'}),isAdmin:async()=>true,authenticatedToken:async()=> 'jwt',logout:()=>{},login:async()=>{}};
const leads=[
 {id:'c8ff05e2-988f-44e6-ac40-38c267ca3dee',customer_name:'Alice Restaurant',customer_email:'alice@example.com',phone:'+35799123456',service_slug:'commercial-video-reels',service_type:null,package_id:'intro',preferred_date:'2026-12-15',message:'Need a food video <script>window.hacked=true</script>',submission_type:'b2b_enquiry',status:'new',created_at:'2026-11-10T08:00:00Z'},
 {id:'c8ff05e2-988f-44e6-ac40-38c267ca3def',customer_name:'Bob Hotel',customer_email:'bob@example.com',phone:'',service_slug:'website-design',service_type:null,package_id:null,preferred_date:null,message:'Website package',submission_type:'general_enquiry',status:'new',created_at:'2026-11-09T08:00:00Z'}
];
const details=[{lead_id:'c8ff05e2-988f-44e6-ac40-38c267ca3def',stage:'proposal',priority:'high',estimated_value_cents:75000,next_follow_up_date:'2026-11-12',internal_notes:'Quote sent to Bob'}];
const activities=[];
window.__crm={leads,details,activities};
window.fetch=async function(input,opts={}){
 const url=String(input),path=new URL(url).pathname,method=opts.method||'GET';
 const q=new URL(url).searchParams;
 let out;
 if(path.endsWith('/contact_leads'))out=leads;
 else if(path.endsWith('/lkm_crm_lead_details')){
  if(method==='GET')out=details;
  else if(method==='POST'){const v=JSON.parse(opts.body);details.push({...v,updated_at:new Date().toISOString()});out=[details.at(-1)];}
  else if(method==='PATCH'){const v=JSON.parse(opts.body);const i=details.findIndex(x=>x.lead_id===q.get('lead_id').slice(3));if(i>=0){details[i]={...details[i],...v};out=[details[i]]}else out=[];}
  else throw Error('Unexpected method '+method);
 }else if(path.endsWith('/lkm_crm_activities')){
  if(method==='GET')out=activities.filter(x=>x.lead_id===q.get('lead_id').slice(3));
  else if(method==='POST'){const row=JSON.parse(opts.body);const item={...row,id:'test-act-'+(activities.length+1),created_at:new Date().toISOString()};activities.push(item);out=[item]}
 }else throw Error('Unexpected URL '+url);
 return new Response(JSON.stringify(out||[]),{status:200,headers:{'Content-Type':'application/json'}});
};
})();'''

with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width, height in [(1400,900),(390,844)]:
  page=browser.new_page(viewport={'width':width,'height':height})
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content('<main id="lkmCrmRoot"></main>')
  page.add_style_tag(content=CSS)
  page.evaluate(STUB)
  page.add_script_tag(content=JS)
  page.wait_for_selector('.lkm23-card',timeout=10000)
  assert page.locator('.lkm23-card').count()==2, 'two real leads displayed'
  assert not page.evaluate('window.hacked'), 'unsafe customer message executed'
  assert page.get_by_text('Open opportunities').count()==1
  assert page.locator('.lkm23-stat').nth(3).inner_text().find('€750')>=0
  page.locator('.lkm23-card').filter(has_text='Alice Restaurant').click()
  page.wait_for_selector('#lkm23Value')
  page.locator('#lkm23Value').fill('899.90')
  page.locator('#lkm23Followup').fill('2026-12-12')
  page.locator('.lkm23-edit select').nth(0).select_option('qualified')
  page.locator('.lkm23-edit select').nth(1).select_option('high')
  page.locator('#lkm23Notes').fill('Customer asked about December proposal')
  page.get_by_text('Save sales details').click()
  page.wait_for_function("window.__crm.details.some(x=>x.lead_id==='c8ff05e2-988f-44e6-ac40-38c267ca3dee')")
  assert page.evaluate("window.__crm.details.find(x=>x.lead_id==='c8ff05e2-988f-44e6-ac40-38c267ca3dee').estimated_value_cents")==89990
  page.locator('#lkm23Summary').fill('Called customer; wants to see a sample.')
  page.get_by_text('Add activity').click()
  page.wait_for_function('window.__crm.activities.length===1',timeout=5000)
  page.wait_for_selector('.lkm23-activity-entry')
  assert 'Called customer; wants to see a sample.' in page.locator('.lkm23-activity-entry').inner_text()
  page.get_by_role('button',name='List').click()
  assert page.locator('.lkm23-list .lkm23-card').count()==2
  page.get_by_role('searchbox').fill('Bob')
  assert page.locator('.lkm23-list .lkm23-card').count()==1
  assert 'Bob Hotel' in page.locator('.lkm23-list').inner_text()
  assert not errors, 'JS errors: '+str(errors)
  # Keep layout visually responsive; scroll belongs within board, not full document.
  page.get_by_role('searchbox').fill('')
  page.get_by_role('button',name='Board').click()
  page.screenshot(path=str(ROOT/'tests'/f'crm_{width}.png'),full_page=True)
  print('PASS browser CRM',width,'lead search, save, activity, responsive view')
  page.close()
 # Access gate: a non-admin never receives CRM customer data.
 page=browser.new_page()
 page.set_content('<main id="lkmCrmRoot"></main>')
 page.evaluate(STUB)
 page.evaluate('(()=>{window.LKMStore.isAdmin=async()=>false;window.fetch=async()=>{throw Error("Private data should not be requested")};return null})()')
 page.add_script_tag(content=JS)
 page.wait_for_selector('#lkm23AuthForm')
 assert page.locator('.lkm23-card').count()==0
 print('PASS browser CRM non-admin access gate')
 page.close()
 browser.close()
