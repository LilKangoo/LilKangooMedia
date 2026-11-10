"""Isolated UI smoke tests (simulated Supabase REST & Storage, no production traffic)."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import base64

BASE=Path(__file__).resolve().parents[1]
ROOT=BASE/'assets/lkm-v3'
LEAD='11111111-1111-4111-8111-111111111111'
PROJ='22222222-2222-4222-8222-222222222222'
FILE='33333333-3333-4333-8333-333333333333'
CORE=(ROOT/'phase24-deliverables-core.mjs').read_text()
CORE_URL='data:text/javascript;base64,'+base64.b64encode(CORE.encode()).decode()
ADMIN=(ROOT/'phase24-deliverables-admin.js').read_text().replace("'/assets/lkm-v3/phase24-deliverables-core.mjs'",repr(CORE_URL))
CLIENT=(ROOT/'phase24-deliverables-client.mjs').read_text().replace("'./phase24-deliverables-core.mjs'",repr(CORE_URL))
ADMIN_CSS=(ROOT/'phase24-deliverables-admin.css').read_text()
CLIENT_CSS=(ROOT/'phase24-deliverables-client.css').read_text()

MOCK="""
window.LKM_CONFIG={SUPABASE_URL:'https://mock.supabase.co',SUPABASE_ANON_KEY:'sb_publishable_testing_abcdefghijklmnop'};
window.LKMStore={configured:true,isAdmin:async()=>true,authenticatedToken:async()=> 'admin_jwt'};
window.__files=[];window.__audit=[];window.__bucket={};Object.defineProperty(window.crypto,'randomUUID',{value:()=> '55555555-5555-4555-8555-555555555555',configurable:true});
window.fetch=async (url,opt={})=>{
 const s=String(url),method=(opt.method||'GET').toUpperCase();let val=[];
 if(s.includes('/lkm_client_projects?'))val=[{id:'22222222-2222-4222-8222-222222222222',title:'Test project',client_visible:true}];
 else if(s.includes('/lkm_client_deliverables')){
  if(method==='POST'){let body=JSON.parse(opt.body);window.__files.unshift({...body,id:'33333333-3333-4333-8333-333333333333'});}
  if(method==='PATCH'){let body=JSON.parse(opt.body);let id=(s.split('id=eq.')[1]||'').split('&')[0];window.__files=window.__files.map(x=>x.id===id?{...x,...body}:x);}
  if(method==='DELETE'){let id=(s.split('id=eq.')[1]||'').split('&')[0];window.__files=window.__files.filter(x=>x.id!==id);}
  val=window.__files;
 }else if(s.includes('/storage/v1/object')){
   window.__audit.push({method,url:s});
   if(method==='POST')return new Response(JSON.stringify({Key:'bucket/asset'}),{status:200,headers:{'Content-Type':'application/json'}});
   if(method==='DELETE')return new Response(JSON.stringify({message:'removed'}),{status:200,headers:{'Content-Type':'application/json'}});
   return new Response(new Blob(['test'],{type:'image/jpeg'}),{status:200,headers:{'Content-Type':'image/jpeg'}});
 }
 return new Response(JSON.stringify(val),{status:200,headers:{'Content-Type':'application/json'}});
};
"""
CLIENT_MOCK="""
window.LKM_CONFIG={SUPABASE_URL:'https://mock.supabase.co',SUPABASE_ANON_KEY:'sb_publishable_testing_abcdefghijklmnop'};
window.__downloads=[];
window.fetch=async(url,options={})=>{
 window.__downloads.push({url:String(url),auth:options.headers?.Authorization||''});
 return new Response(new Blob(['demo'],{type:'image/jpeg'}),{status:200});
};
"""
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 try:
  for width,height in [(1280,850),(390,844)]:
   page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
   html=f'''<!doctype html><html><head><style>body{{background:#f5f8f4;font-family:Arial,sans-serif;margin:16px}}.button{{border:1px solid #ddd;border-radius:8px;padding:9px 12px;background:#fff}}{ADMIN_CSS}</style></head><body><main id="lkmCrmRoot"><button class="lkm23-card is-selected" data-lead-id="{LEAD}">Test client</button><section id="lkm23Details" style="width:min(900px,100%)"><section data-p24-section>Client portal access</section><section data-lkm242>Project & delivery tracking</section><section class="lkm23-edit">Sales details</section></section></main></body></html>'''
   page.set_content(html)
   page.add_script_tag(content=MOCK)
   page.add_script_tag(content=ADMIN)
   page.get_by_role('button',name='Upload privately').wait_for(timeout=15000)
   assert page.locator('.lkm243-section').count()==1
   page.get_by_label('Choose file').set_input_files({'name':'test-photo.jpg','mimeType':'image/jpeg','buffer':b'\xff\xd8\xff\xe0testjpeg'})
   page.get_by_role('button',name='Upload privately').click()
   page.locator('.lkm243-card').wait_for(timeout=15000)
   assert page.get_by_text('test-photo',exact=True).count()>=1
   assert page.get_by_text('Private',exact=True).count()>=1
   page.get_by_role('button',name='Publish',exact=True).click()
   page.get_by_text('Published',exact=True).wait_for(timeout=15000)
   page.screenshot(path=str(BASE/f'tests/deliverables_admin_{width}.png'),full_page=True)
   assert page.evaluate("window.__files.length===1 && window.__files[0].client_visible===true")
   assert page.evaluate("window.__audit.some(v=>v.method==='POST' && !v.url.includes('/public/'))")
   print('ADMIN PASS',width)
   page.close()

  # Client card + read-only authenticated downloads; no privileged reads.
  for width,height in [(1280,900),(390,844)]:
   page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
   html=f'''<!doctype html><html><head><style>body{{font-family:Arial,sans-serif;background:#f4f7f3;padding:25px}}.button{{border:1px solid #ccc;padding:10px;border-radius:9px;background:#fff}}{CLIENT_CSS}</style></head><body><main id="lkmClientHost" class="lkm243-client-zone"></main></body></html>'''
   page.set_content(html)
   page.add_script_tag(content=CLIENT_MOCK)
   page.add_script_tag(content=CLIENT+"\nwindow.__lkm243test={renderClientDeliverables};",type='module')
   page.wait_for_function('!!window.__lkm243test',timeout=15000)
   payload={
    'ok':True,
    'files':[{'id':FILE,'project_id':PROJ,'project_title':'Lefkara family photographs','title':'Final colour photographs','description':'Selected edited images, ready for download.',
        'filename':'finals.jpg','media_type':'photo','delivery_mode':'storage','storage_path':f'{PROJ}/{FILE}.jpg','mime_type':'image/jpeg','size_bytes':2500,'created_at':'2026-11-10T10:00:00Z'},
       {'id':'44444444-4444-4444-8444-444444444444','project_id':PROJ,'project_title':'Lefkara family photographs','title':'Full video','description':'','filename':'Full video',
        'media_type':'video','delivery_mode':'link','external_url':'https://adobe.ly/abc','size_bytes':0}]
   }
   page.evaluate('data=>window.__lkm243test.renderClientDeliverables(document.getElementById("lkmClientHost"),data,async()=>"verified_jwt")',payload)
   page.get_by_role('button',name='Download').wait_for(timeout=10000)
   page.get_by_role('button',name='Preview').click()
   page.locator('dialog.lkm243-viewer[open]').wait_for(timeout=15000)
   assert page.evaluate("window.__downloads[0].auth==='Bearer verified_jwt'")
   page.get_by_role('button',name='Close ×').click()
   page.screenshot(path=str(BASE/f'tests/deliverables_client_{width}.png'),full_page=True)
   assert page.get_by_role('link',name='Open delivery link').count()==1
   print('CLIENT PASS',width)
   page.close()
 finally:
  browser.close()
