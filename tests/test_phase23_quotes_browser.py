"""Browser smoke tests using *mocked* Supabase, no network or production writes."""
import json
from pathlib import Path
from urllib.parse import quote
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
SRC=(ROOT/'assets/lkm-v3/phase23-quotes.js').read_text()
CORE=(ROOT/'assets/lkm-v3/phase23-quotes-core.mjs').read_text()
CSS=(ROOT/'assets/lkm-v3/phase23-quotes.css').read_text()
SRC=SRC.replace("import('/assets/lkm-v3/phase23-quotes-core.mjs')", "import('data:text/javascript;charset=utf-8,"+quote(CORE,safe='')+"')")
STUB=r'''(()=>{
window.LKM_CONFIG={SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'sb_publishable_example'};
window.LKMStore={configured:true,getSession:()=>({access_token:'test'}),isAdmin:async()=>true,authenticatedToken:async()=> 'test',adminServices:async()=>[
 {slug:'photo',title:'Photography',active:true,packages:[{id:'one',name:'Hourly photo session',price_cents:15000,pricing_model:'hour'}]},
 {slug:'video',title:'Video',active:true,packages:[{id:'one',name:'Film production',price_cents:25000,pricing_model:'quote'}]}
],logout:()=>{},login:async()=>{}};
const leads=[{id:'c8ff05e2-988f-44e6-ac40-38c267ca3dee',customer_name:'Alice Restaurant',customer_email:'alice@example.com',phone:'+35799123456',service_slug:'photo',message:'Request photo shoot <img src=x onerror="window.hacked=true">',created_at:'2026-11-10T12:00:00Z'},
 {id:'c8ff05e2-988f-44e6-ac40-38c267ca3def',customer_name:'Bob Hotel',customer_email:'bob@example.com',phone:'',service_slug:'video',message:'Video inquiry',created_at:'2026-11-09T10:00:00Z'}];
window.__lkmQuotes={leads,quotes:[],calls:[]};
window.history.replaceState=()=>{};
window.confirm=()=>true;
window.print=()=>{window.__printedText=document.getElementById('lkm23PrintRoot').innerText;window.dispatchEvent(new Event('afterprint'))};
window.fetch=async function(input,opts={}){
 const url=new URL(String(input)),method=opts.method||'GET';let rows=[];
 if(url.pathname.endsWith('/contact_leads'))rows=leads;
 else if(url.pathname.endsWith('/lkm_crm_quotes')){
  window.__lkmQuotes.calls.push({method,path:url.pathname,body:opts.body});
  const quotes=window.__lkmQuotes.quotes;
  if(method==='GET')rows=quotes;
  else if(method==='POST'){
   const payload=JSON.parse(opts.body);const created={...payload,id:'c8ff05e2-988f-44e6-ac40-38c267ca3df9',quote_number:13,created_at:new Date().toISOString()};quotes.unshift(created);rows=[created];
  }else if(method==='PATCH'){
   const id=url.searchParams.get('id').slice(3);const old=quotes.find(x=>x.id===id);Object.assign(old,JSON.parse(opts.body));rows=[old];
  }
 }else throw Error('Unexpected path '+url.pathname);
 return new Response(JSON.stringify(rows),{status:200,headers:{'Content-Type':'application/json'}});
};
})();'''
HTML='<main id="lkmQuotesRoot" class="lkm23-quotes-shell lkm23-no-print"></main><section id="lkm23PrintRoot" hidden></section>'
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in (1280,390):
  page=browser.new_page(viewport={'width':width,'height':920})
  errs=[]
  page.on('pageerror',lambda e:errs.append(str(e)))
  page.set_content(HTML)
  page.add_style_tag(content=CSS)
  page.evaluate(STUB)
  page.add_script_tag(content=SRC)
  page.wait_for_selector('#lkm23qLeadStart',timeout=15000)
  page.select_option('#lkm23qLeadStart','c8ff05e2-988f-44e6-ac40-38c267ca3dee')
  page.get_by_role('button',name='Create quotation',exact=True).click()
  page.wait_for_selector('#lkm23qEditorHost')
  assert page.locator('#lkm23qLead').input_value()=='c8ff05e2-988f-44e6-ac40-38c267ca3dee'
  assert page.get_by_text('Alice Restaurant').count()>=1
  assert not page.evaluate('window.hacked')
  page.select_option('#lkm23qCatalog',index=1)
  page.get_by_role('button',name='+ Add from catalogue').click()
  assert page.locator('[data-row]').count()==1
  assert '150.00' in page.locator('[data-field="unit_price_cents"]').input_value()
  page.locator('[data-field="quantity"]').fill('2.5')
  page.locator('#lkm23qDiscount').fill('25')
  assert '€350.00' in page.locator('#lkm23qTotals').inner_text()
  assert page.locator('#lkm23qPrint').is_disabled()
  page.locator('[data-quote-field="title"]').fill('Product shoot <script>alert(1)</script>')
  page.get_by_role('button',name='Save quotation',exact=True).click()
  page.wait_for_function('window.__lkmQuotes.quotes.length===1',timeout=7000)
  page.wait_for_function('document.querySelector("#lkm23qBadge")?.textContent==="Saved quotation"')
  q=page.evaluate('window.__lkmQuotes.quotes[0]')
  assert q['line_items'][0]['quantity']==2.5
  assert q['line_items'][0]['unit_price_cents']==15000
  assert q['discount_cents']==2500
  assert q['customer_email']=='alice@example.com'
  page.locator('#lkm23qPrint').click()
  page.wait_for_function('!!window.__printedText')
  text=page.evaluate('window.__printedText')
  assert 'LKM-Q-000013' in text and '€350.00' in text and 'Product shoot' in text
  assert 'This is not an invoice' in text
  assert not page.evaluate('window.hacked')
  if width==1280:
   page.evaluate('window.print=()=>{window.__printBuilt=true}')
   page.locator('#lkm23qPrint').click()
   page.wait_for_function('window.__printBuilt===true')
   pdf=page.pdf(format='A4',print_background=True,prefer_css_page_size=True)
   assert pdf.startswith(b'%PDF-'), 'Expected real PDF output from print layout'
   (ROOT/'tests'/'quote_sample.pdf').write_bytes(pdf)
   page.evaluate('document.getElementById("lkm23PrintRoot").hidden=true')
  page.screenshot(path=str(ROOT/'tests'/f'quote_{width}.png'),full_page=True)
  page.get_by_role('button',name='Mark sent manually').click()
  page.wait_for_function('window.__lkmQuotes.quotes[0].status==="sent"')
  page.wait_for_function('document.querySelector("#lkm23qSave")?.disabled===true',timeout=5000)
  assert page.get_by_role('button',name='Create revised draft').is_enabled()
  page.get_by_role('button',name='Create revised draft').click()
  assert page.locator('#lkm23qBadge').inner_text()=='Unsaved changes'
  assert page.locator('[data-quote-field="customer_name"]').input_value()=='Alice Restaurant'
  assert not errs,errs
  print('PASS browser quotes',width,'save, totals, catalog, PDF print, input safety')
  page.close()
 # Role gate: no customer data requests when not admin.
 page=browser.new_page()
 page.set_content(HTML)
 page.evaluate(STUB)
 page.evaluate('(()=>{window.LKMStore.isAdmin=async()=>false;window.fetch=async()=>{throw Error("No backend access")};return null})()')
 page.add_script_tag(content=SRC)
 page.wait_for_selector('.lkm23q-login',timeout=10000)
 assert page.locator('.lkm23q-quote-card').count()==0
 print('PASS non-admin login gate')
 page.close();browser.close()
