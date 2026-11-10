"""Isolated Chromium UI tests (mocked REST; no production Supabase writes)."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import base64, json
BASE=Path(__file__).resolve().parents[1]
LEAD='11111111-1111-4111-8111-111111111111'
PROJ='22222222-2222-4222-8222-222222222222'
UPDATE='33333333-3333-4333-8333-333333333333'
JS=(BASE/'assets/lkm-v3/phase24-admin-projects.js').read_text()
CSS=(BASE/'assets/lkm-v3/phase24-admin-projects.css').read_text()
CLIENT_JS=(BASE/'assets/lkm-v3/phase24-project-tracking.mjs').read_text()
CLIENT_CSS=(BASE/'assets/lkm-v3/phase24-project-tracking.css').read_text()

MOCK="""
window.LKM_CONFIG={SUPABASE_URL:'https://sample.supabase.co',SUPABASE_ANON_KEY:'sb_publishable_test_abcdefghijklmnop'};
window.LKMStore={configured:true,isAdmin:async()=>true,authenticatedToken:async()=> 'mock-admin-token'};
window.__project=null;window.__projectUpdates=[];window.__writes=[];
window.fetch=async(url,options={})=>{
 const u=String(url),method=(options.method||'GET').toUpperCase();
 let rows=[];
 if(u.includes('/contact_leads?')) rows=[{id:'11111111-1111-4111-8111-111111111111',customer_name:'Test Client',customer_email:'client@example.com',service_slug:'business-video',archived_at:null}];
 else if(u.includes('/lkm_client_projects?') || u.endsWith('/lkm_client_projects')){
  if(method==='POST')window.__project={id:'22222222-2222-4222-8222-222222222222',...JSON.parse(options.body)};
  if(method==='PATCH')window.__project={...window.__project,...JSON.parse(options.body)};
  if(method==='DELETE')window.__project=null;
  rows=window.__project?[window.__project]:[];
 }else if(u.includes('/lkm_client_project_updates')){
  if(method==='POST')window.__projectUpdates.unshift({id:'33333333-3333-4333-8333-333333333333',created_at:'2026-11-10T10:00:00Z',...JSON.parse(options.body)});
  if(method==='PATCH')window.__projectUpdates[0]={...window.__projectUpdates[0],...JSON.parse(options.body)};
  if(method==='DELETE')window.__projectUpdates=[];
  rows=window.__projectUpdates;
 }else if(u.includes('/stripe_orders?'))rows=[];
 if(method!=='GET')window.__writes.push({path:u,method,body:options.body||''});
 return new Response(JSON.stringify(rows),{status:200,headers:{'Content-Type':'application/json'}});
};
"""

with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 try:
  for width,height in [(1380,900),(390,844)]:
   page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
   html=f'''<!doctype html><html><head><style>{CSS}</style></head><body style="background:#f4f6f2;font-family:Arial,sans-serif"><div id="lkmCrmRoot"><button class="lkm23-card is-selected" data-lead-id="{LEAD}">Test client</button><aside id="lkm23Details" style="max-width:900px;margin:10px auto"><section data-p24-section style="border:1px solid #ddd;padding:10px">Client portal access</section><section class="lkm23-edit">Sales details</section></aside></div></body></html>'''
   page.set_content(html)
   page.add_script_tag(content=MOCK)
   page.add_script_tag(content=JS)
   page.get_by_role('button',name='Create project').wait_for(timeout=10000)
   assert page.locator('.lkm242-section').count()==1
   page.locator('.lkm242-field').filter(has_text='Project title').locator('input').fill('New client brand film')
   page.locator('.lkm242-field').filter(has_text='Progress (0–100%)').locator('input').fill('35')
   page.get_by_role('button',name='Create project').click()
   page.get_by_role('button',name='Save project changes').wait_for(timeout=10000)
   assert page.evaluate('window.__project.progress')==35
   page.get_by_label('Client visibility').select_option('true')
   page.get_by_role('button',name='Save project changes').click()
   page.get_by_role('button',name='Save project changes').wait_for(timeout=10000)
   page.wait_for_function('window.__project?.client_visible===true')
   page.locator('.lkm242-post').wait_for(timeout=10000)
   page.wait_for_timeout(350) # wait for post-save form replacement before editing
   page.get_by_label('Update title').fill('Editing underway')
   page.get_by_label('Update message').fill('First draft sent to review.')
   page.get_by_label('Share this update').select_option('true')
   page.get_by_role('button',name='Add project update').click()
   try:page.locator('.lkm242-update').wait_for(timeout=5000)
   except Exception as ex:
    print('DIAG',width,page.evaluate('window.__project'),page.evaluate('window.__projectUpdates'),page.evaluate('window.__writes'),page.locator('[data-project-message]').all_text_contents(),page.locator('.lkm242-post').all_text_contents())
    raise
   assert page.locator('.lkm242-update').count()==1
   assert page.evaluate('window.__projectUpdates[0].client_visible')==True
   assert page.evaluate('window.__writes.every(x=>!x.path.includes("refund")&&!x.path.includes("checkout")&&!x.path.includes("booking"))')
   page.screenshot(path=str(BASE/'tests'/f'projects_admin_{width}.png'),full_page=True)
   print('PASS admin CRM',width,'edit, publish, update, no payment writes')
   page.close()
  # Client view, using actual ES module source imported as data URL in about:blank.
  for width,height in [(1280,900),(390,844)]:
   page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
   page.set_content(f'<html><head><style>{CLIENT_CSS}</style></head><body><main style="max-width:1100px;margin:auto" id="portal"></main></body></html>')
   dataurl='data:text/javascript;base64,'+base64.b64encode(CLIENT_JS.encode()).decode()
   page.evaluate('async src=>{window.testMod=await import(src)}',dataurl)
   good={'ok':True,'projects':[{'project_id':PROJ,'request_id':LEAD,'title':'Brand video & content','summary':'Production underway', 'phase':'in_progress','progress':65,'target_date':'2026-12-01','next_step':'Share first edit','updated_at':'2026-11-10T12:00:00Z','order':{'status':'paid_pending_confirmation','paid_amount_cents':15000,'payment_kind':'deposit'},'updates':[{'id':UPDATE,'title':'Filming completed','detail':'Footage captured, editing next.','created_at':'2026-11-10T10:00:00Z'}]}]}
   page.evaluate('data=>window.testMod.renderProjectResults(document.getElementById("portal"),data)',good)
   assert page.get_by_text('Brand video & content').count()==1
   assert page.get_by_text('65%').count()==1
   assert '€150.00' in page.locator('.lkm242-client-order').inner_text()
   assert page.get_by_text('Filming completed').count()==1
   assert page.get_by_text('In progress').count()==1
   # Ensure arbitrary string supplied from untrusted DB never executes HTML.
   malicious={'ok':True,'projects':[{**good['projects'][0],'title':'<img src=x onerror="window.hacked=1">'}]}
   page.evaluate('data=>window.testMod.renderProjectResults(document.getElementById("portal"),data)',malicious)
   assert page.locator('#portal img').count()==0
   assert page.evaluate('window.hacked||0')==0
   page.evaluate('data=>window.testMod.renderProjectResults(document.getElementById("portal"),data)',good)
   page.screenshot(path=str(BASE/'tests'/f'projects_client_{width}.png'),full_page=True)
   print('PASS client',width,'published project, order, timeline, HTML escaping')
   page.close()
 finally:
  browser.close()
# No authenticated administrator = no editing controls.
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 try:
  page=browser.new_page()
  page.set_content(f'<main id="lkmCrmRoot"><button class="lkm23-card is-selected" data-lead-id="{LEAD}"></button><aside id="lkm23Details"><section class="lkm23-edit"></section></aside></main>')
  page.add_script_tag(content=MOCK+'window.LKMStore.isAdmin=async()=>false;')
  page.add_script_tag(content=JS)
  page.get_by_text('Administrator permissions required.').wait_for(timeout=6000)
  assert page.get_by_role('button',name='Create project').count()==0
  print('PASS access denied: non-admin cannot see project editor')
 finally:
  browser.close()
