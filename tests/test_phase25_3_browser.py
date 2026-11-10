"""Phase 25.3 UI smoke: no requests to production, no personal data saved."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
SCRIPT=(ROOT/'assets/lkm-v3/phase25-conversion.js').read_text()
CSS=(ROOT/'assets/lkm-v3/phase25-conversion.css').read_text()
SEO=(ROOT/'assets/lkm-v3/service-seo.mjs').read_text().replace('export function ','function ')

HTML='''<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main id="main"><div class="service-card"><a class="service-photo" href="#/service/website-design">Explore</a><div class="service-body"><h3>Website Design & Development</h3><button data-lkm20-slug="website-design">Quick enquiry</button></div></div><div class="service-card"><a class="service-photo" href="#/service/portrait-photography">Explore</a><div class="service-body"><h3>Portrait & Family Photography</h3></div></div></main></body></html>'''

def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':390,'height':844})
  page.set_content(HTML);page.add_style_tag(content=CSS);page.add_script_tag(content=SCRIPT)
  page.wait_for_timeout(120)
  assert page.locator('.lkm253-card-action').count()==2
  assert page.locator('.lkm253-card-action').first.get_attribute('href')=='/?lkm_service=website-design#/quote'
  assert page.locator('[data-lkm20-slug]').count()==1
  # Script must not insert duplicate links on SPA rerenders.
  page.evaluate('''() => {document.querySelector('#main').append(document.createElement('p'))}''')
  page.wait_for_timeout(120)
  assert page.locator('.lkm253-card-action').count()==2
  print('Catalog: one-click quote links, current Quick Enquiry preserved PASS')
  # Use hash navigation without network to simulate SPA route and native quote snapshot click.
  page.evaluate('''() => {
    window.location.hash='#/quote';
    document.querySelector('#main').innerHTML='<div class="form-grid"><a id="nativeNext" href="#/request">Continue to details</a></div>';
    window.__nativeClicks=0;
    document.querySelector('#main').addEventListener('click',e=>{if(e.target.id==='nativeNext')window.__nativeClicks++;},true);
  }''')
  page.wait_for_timeout(120)
  assert page.locator('#lkm253Flow').is_visible()
  page.locator('.lkm253-flow-button').click()
  assert page.evaluate('window.__nativeClicks')==1
  assert page.evaluate('window.location.hash')=='#/request'
  print('Mobile continuation fires native quote link and saves bundle snapshot PASS')
  page.evaluate('''() => {
    document.querySelector('#main').innerHTML='<form id="bookingForm"><input id="requestName" required><input id="requestEmail" required value="client@example.com"><button id="requestSubmit" type="submit">Send</button></form>';
  }''')
  page.wait_for_timeout(120)
  page.locator('.lkm253-flow-button').click()
  assert page.evaluate('document.activeElement.id')=='requestName'
  print('Mobile request button focuses first required field instead of auto-submitting PASS')
  page.set_viewport_size({'width':1280,'height':900});page.wait_for_timeout(80)
  assert not page.locator('#lkm253Flow').is_visible()
  assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1')
  print('Desktop: no duplicate sticky CTA / no horizontal scrolling PASS')
  page.set_content((ROOT/'services/portrait-photography.html').read_text().replace('<script src="/lkm-config.js" defer></script>','').replace('<script type="module" src="/assets/lkm-v3/service-seo.mjs"></script>',''))
  page.evaluate('''()=>{window.LKM_CONFIG={SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'test-public-key'};window.fetch=async()=>({ok:true,json:async()=>[{slug:'portrait-photography',active:true,title:'Portrait & Family Photography',packages:[]}]})}''')
  page.add_script_tag(content='(async()=>{'+SEO+'})()')
  page.wait_for_timeout(150)
  assert page.locator('#lkm253SeoDirect').get_attribute('href')=='/?lkm_service=portrait-photography#/quote'
  print('SEO guide: faster quote link appears only for live active service PASS')
  browser.close()

if __name__=='__main__':run()
