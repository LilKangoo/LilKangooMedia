from playwright.sync_api import sync_playwright
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
TOKEN='lkm_'+'a'*64
SAMPLE={"ok":True,"decision":"pending","expired":False,"quote_number":7,"title":"Commercial Media Package","customer_name":"Demo Client","customer_company":"Demo Studio","issue_date":"2026-11-10","valid_until":"2026-11-30","introduction":"Photos and video campaign","scope_notes":"Two-location shoot with edited content","line_items":[{"description":"Photography","quantity":2.5,"unit_price_cents":15000},{"description":"Video edit","quantity":1,"unit_price_cents":25000}],"discount_cents":2500,"subtotal_cents":62500,"total_cents":60000,"currency":"EUR","terms":"Delivery schedule agreed in writing."}
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
 for viewport in ((1280,900),(390,844)):
  page=browser.new_page(viewport={'width':viewport[0],'height':viewport[1]})
  errors=[];calls=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  html=(ROOT/'proposal.html').read_text()
  html=html.replace('<script src="/lkm-config.js"></script>','').replace('<script defer src="/assets/lkm-v3/phase23-proposal.js"></script>','')
  page.set_content(html)
  page.add_style_tag(content=(ROOT/'assets/lkm-v3/phase23-proposal.css').read_text())
  page.evaluate("""([token,sample]) => {
    window.LKM_CONFIG={SUPABASE_URL:'https://mock.supabase.co',SUPABASE_ANON_KEY:'sb_publishable_demo'};
    location.hash='#token='+token;
    window.__calls=[];
    window.fetch=async(url,opts)=>{
      const data=JSON.parse(opts.body);window.__calls.push(data);
      const response=data.p_action==='accept'?{...sample,decision:'accepted',decided_at:'2026-11-10T19:23:00Z'}:sample;
      return {ok:true,json:async()=>response};
    };
  }""",[TOKEN,SAMPLE])
  page.add_script_tag(content=(ROOT/'assets/lkm-v3/phase23-proposal.js').read_text())
  page.wait_for_timeout(700)
  assert page.get_by_text('Commercial Media Package').count()==1,page.locator('main').inner_text()[:400]
  assert page.get_by_text('€600.00').count()>=1
  assert page.get_by_text('Delivery schedule agreed in writing.').count()==1
  assert not errors,errors
  assert page.evaluate('window.__calls[0].p_action')=='view'
  name=page.locator('input[name=full_name]');name.fill('Demo Client')
  page.locator('input[type=checkbox]').check()
  page.on('dialog',lambda dialog:dialog.accept())
  page.get_by_role('button',name='Accept quotation').click()
  page.wait_for_timeout(400)
  assert page.get_by_text('Proposal accepted').count()==1,page.locator('main').inner_text()
  assert page.evaluate('window.__calls.at(-1).p_action')=='accept' and page.evaluate('window.__calls.at(-1).p_confirm') is True
  assert not errors,errors
  page.screenshot(path=str(ROOT/'tests'/('proposal_'+str(viewport[0])+'.png')),full_page=True)
  print('PASS browser',viewport,'responses',page.evaluate('window.__calls.length'))
  page.close()
 browser.close()
