from pathlib import Path
from urllib.parse import quote
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
SRC=(ROOT/'assets/lkm-v3/phase23-quotes.js').read_text()
CORE=(ROOT/'assets/lkm-v3/phase23-quotes-core.mjs').read_text()
SRC=SRC.replace("import('/assets/lkm-v3/phase23-quotes-core.mjs')","import('data:text/javascript;charset=utf-8,"+quote(CORE,safe='')+"')")
CSS=(ROOT/'assets/lkm-v3/phase23-quotes.css').read_text()
STUB=r'''(()=>{
window.LKM_CONFIG={SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'sb_publishable_example'};
window.LKMStore={configured:true,getSession:()=>({access_token:'test'}),isAdmin:async()=>true,authenticatedToken:async()=> 'test',adminServices:async()=>[],logout:()=>{},login:async()=>{}};
window.confirm=()=>true;window.prompt=()=> 'DELETE';window.history.replaceState=()=>{};
const leads=[{id:'c8ff05e2-988f-44e6-ac40-38c267ca3dee',customer_name:'Testing Customer',customer_email:'test@example.com',phone:'',service_slug:'photo',message:'Photos',created_at:'2026-11-10T12:00:00Z',archived_at:null}];
window.__quotes={leads,quotes:[],deletes:0};
window.fetch=async function(input,opts={}){
 const u=new URL(String(input)),method=opts.method||'GET';let rows=[];
 if(u.pathname.endsWith('/contact_leads'))rows=leads;
 else if(u.pathname.endsWith('/lkm_crm_quotes')){
  const quotes=window.__quotes.quotes;
  if(method==='GET')rows=quotes;
  else if(method==='POST'){const data=JSON.parse(opts.body);const created={...data,id:'c8ff05e2-988f-44e6-ac40-38c267ca3df9',quote_number:10,created_at:'2026-11-10T12:00:00Z'};quotes.push(created);rows=[created]}
  else if(method==='PATCH'){const id=u.searchParams.get('id').slice(3);const r=quotes.find(q=>q.id===id);Object.assign(r,JSON.parse(opts.body));rows=[r]}
 }else if(u.pathname.endsWith('/rpc/lkm_crm_admin_remove_draft_quote')){
  const d=JSON.parse(opts.body);const i=window.__quotes.quotes.findIndex(q=>q.id===d.p_quote_id);
  if(window.__quotes.quotes[i]?.status!=='draft')return new Response(JSON.stringify({message:'Sent quotation cannot be deleted.'}),{status:400});
  window.__quotes.quotes.splice(i,1);window.__quotes.deletes++;rows={ok:true};
 }else throw Error('Unexpected '+u.pathname);
 return new Response(JSON.stringify(rows),{status:200,headers:{'Content-Type':'application/json'}});
};
})();'''
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [1280,390]:
  page=browser.new_page(viewport={'width':width,'height':850});errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content('<main id="lkmQuotesRoot"></main><section id="lkm23PrintRoot" hidden></section>')
  page.add_style_tag(content=CSS);page.evaluate(STUB);page.add_script_tag(content=SRC)
  page.wait_for_selector('#lkm23qLeadStart',timeout=10000)
  page.select_option('#lkm23qLeadStart','c8ff05e2-988f-44e6-ac40-38c267ca3dee')
  page.get_by_role('button',name='Create quotation',exact=True).click()
  page.get_by_role('button',name='+ Add custom line').click()
  page.locator('[data-field="description"]').fill('Test photography')
  page.locator('[data-field="unit_price_cents"]').fill('150')
  page.get_by_role('button',name='Save quotation',exact=True).click()
  page.wait_for_function('window.__quotes.quotes.length===1')
  page.wait_for_selector('.lkm23q-delete')
  page.get_by_role('button',name='Discard draft').click()
  page.wait_for_function('window.__quotes.quotes.length===0 && window.__quotes.deletes===1')
  page.wait_for_selector('#lkm23qLeadStart')
  assert page.locator('.lkm23q-delete').count()==0
  assert not errors,errors
  print('PASS quotation draft deletion',width)
  page.close()
 browser.close()
