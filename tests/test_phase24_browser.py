from pathlib import Path
from playwright.sync_api import sync_playwright
import re, json
R=Path(__file__).resolve().parents[1]; A=R/'assets'/'lkm-v3'
UUID='12345678-1234-1234-1234-123456789012'
CFG='window.LKM_CONFIG={SUPABASE_URL:"https://demo.supabase.co",SUPABASE_ANON_KEY:"sb_publishable_test_public_browser_key_only"};'
core=(A/'phase24-client-core.mjs').read_text().replace('export ','')
client=(A/'phase24-client.mjs').read_text()
client=re.sub(r"^import .*? from '\./phase24-client-core\.mjs';\s*",'',client,flags=re.M)

# Override fetch at the browser level: all tests are offline, no real production calls.
MOCK=r'''window.__state={enabled:false,empty:__EMPTY__,requests:[]};
window.fetch=async function(url,options={}){
 const s=window.__state,method=options.method||'GET',urlString=String(url);s.requests.push([method,urlString]);
 function response(body,status=200){return {ok:status>=200&&status<300,status,async json(){return body},async text(){return JSON.stringify(body)}}}
 if(urlString.includes('/auth/v1/otp'))return response({});
 if(urlString.includes('/auth/v1/verify')||urlString.includes('/auth/v1/token'))return response({access_token:'verified-token',refresh_token:'refresh-token',expires_in:3600});
 if(urlString.includes('/auth/v1/user'))return response({email:'client@example.com',email_confirmed_at:'2026-11-10T12:00:00Z'});
 if(urlString.includes('/rest/v1/rpc/lkm_client_portal_summary'))return response({ok:true,items:s.empty?[]:[{request_id:'12345678-1234-1234-1234-123456789012',service:'Portrait photography',submitted_on:'2026-11-10T09:00:00Z',status:'received',preferred_date:'2026-12-12'}]});
 if(urlString.includes('/rest/v1/contact_leads'))return response([{id:'12345678-1234-1234-1234-123456789012',customer_name:'Test Client',customer_email:'client@example.com',archived_at:null}]);
 if(urlString.includes('/rest/v1/lkm_client_grants')){
  if(method==='GET')return response(s.enabled?[{lead_id:'12345678-1234-1234-1234-123456789012',client_email:'client@example.com',active:true}]:[]);
  if(method==='POST')s.enabled=true;else s.enabled=false;return response([{active:s.enabled}]);
 }
 if(urlString.includes('/auth/v1/logout'))return response({});
 return response({error:'Not mocked: '+urlString},404);
};'''

def test_client(browser,viewport,empty=False):
 ctx=browser.new_context(viewport=viewport);page=ctx.new_page()
 html=(R/'client.html').read_text()
 html=re.sub(r'<script[^>]+src="[^"]+"[^>]*></script>','',html)
 html=re.sub(r'<link[^>]+rel="stylesheet"[^>]*>','',html)
 html=html.replace('</head>', '<style>'+(A/'phase24-client.css').read_text()+'</style></head>')
 page.set_content(html,wait_until='load')
 page.evaluate(CFG)
 page.evaluate("""(()=>{const mem=new Map();Object.defineProperty(window,'sessionStorage',{configurable:true,value:{getItem:k=>mem.has(k)?mem.get(k):null,setItem:(k,v)=>mem.set(k,String(v)),removeItem:k=>mem.delete(k)}})})()""")
 page.evaluate(MOCK.replace('__EMPTY__','true' if empty else 'false'))
 page.add_script_tag(content=core+'\n'+client,type='module')
 page.get_by_label('Email address').fill('client@example.com')
 page.get_by_role('button',name='Send secure sign-in link').click()
 page.get_by_label('Have a one-time code?').fill('123456')
 page.get_by_role('button',name='Verify code').click()
 page.get_by_role('heading',name='Your client space').wait_for(timeout=7000)
 if empty:
  page.get_by_text('There are no project requests shared with this email yet',exact=False).wait_for()
  assert not page.get_by_role('heading',name='Portrait photography').count()
 else:page.get_by_role('heading',name='Portrait photography').wait_for()
 page.screenshot(path=str(R/'tests'/('client_empty.png' if empty else 'client_'+str(viewport['width'])+'.png')),full_page=True)
 page.get_by_role('button',name='Sign out').click()
 page.get_by_role('heading',name='Secure sign in').wait_for()
 ctx.close()

def test_admin(browser):
 ctx=browser.new_context(viewport={'width':1200,'height':860});page=ctx.new_page();page.on('dialog',lambda d:d.accept())
 html=f'''<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>{(A/'phase24-admin-portal.css').read_text()}</style></head><body>
 <div id="lkmCrmRoot"><div id="lkm23Pipeline"><button data-lead-id="{UUID}" class="lkm23-card is-selected">Selected enquiry</button></div>
 <div id="lkm23Details"><div class="lkm23-detail-title">Client</div><div class="lkm23-edit">Sales details</div></div></div></body></html>'''
 page.set_content(html);page.evaluate(CFG);page.evaluate(MOCK.replace('__EMPTY__','false'))
 page.evaluate('window.LKMStore={configured:true,isAdmin:async()=>true,authenticatedToken:async()=>"admin"};')
 page.add_script_tag(content=(A/'phase24-admin-portal.js').read_text())
 page.get_by_role('button',name='Enable client access').wait_for(timeout=7000)
 page.get_by_role('button',name='Enable client access').click()
 page.get_by_text('Client access enabled').wait_for(timeout=7000)
 assert page.evaluate('window.__state.enabled') is True
 page.screenshot(path=str(R/'tests'/'admin_portal_access.png'),full_page=True)
 page.get_by_role('button',name='Revoke access').click()
 page.get_by_text('Client access disabled').wait_for(timeout=7000)
 assert page.evaluate('window.__state.enabled') is False
 ctx.close()

if __name__=='__main__':
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  test_client(b,{'width':1280,'height':880});print('PASS desktop client verified OTP, assigned request, logout')
  test_client(b,{'width':390,'height':844});print('PASS mobile client verified OTP, assigned request, logout')
  test_client(b,{'width':390,'height':844},empty=True);print('PASS no grant = no customer data')
  test_admin(b);print('PASS CRM enable and revoke customer access')
  b.close()
