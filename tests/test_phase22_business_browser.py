"""Isolated Chromium DOM test for Phase 22.4 (no network and NO production writes).
Run: python3 tests/test_phase22_business_browser.py
Some sandboxes prohibit all browser navigation. set_content avoids it.
"""
from pathlib import Path
import json, re
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
css=(ROOT/'assets/lkm-v3/business-solutions.css').read_text()
bootstrap='*{box-sizing:border-box} body{margin:0;font-family:Arial} .site-header{position:sticky;top:0;z-index:80;background:#fff}.header-inner{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:14px}.identity{display:flex;gap:10px}.desktop-nav{display:flex;gap:18px}.header-cta{display:flex}.button{display:inline-flex;padding:12px}.skip-link{position:absolute;left:-1000px}@media(max-width:800px){.desktop-nav{display:none}}'
data=(ROOT/'assets/lkm-v3/business-data.mjs').read_text().replace('export const ','const ').replace('export function ','function ')
client=(ROOT/'assets/lkm-v3/business-solutions.mjs').read_text()
client=re.sub(r'^import\s+\{.+?\}\s+from\s+\'./business-data.mjs\';?\s*$', '',client,flags=re.M)
script=data+'\n'+client
assert not re.search(r'^import |^export ',script,flags=re.M)
services=[
  {'slug':'product-brand-photography','title':'Product Photography','audience':'business','active':True},
  {'slug':'commercial-video-reels','title':'Commercial Reels','audience':'business','active':True},
  {'slug':'website-design','title':'Website Design','audience':'business','active':True},
  {'slug':'graphic-design','title':'Graphic Design','audience':'business','active':True},
  {'slug':'social-media-management','title':'Social Media Management','audience':'business','active':True},
  {'slug':'marketing-advertising','title':'Advertising','audience':'business','active':True},
  {'slug':'wedding-photography-video','title':'Wedding Photography','audience':'personal','active':True}
]

def bootstrap_page(page,file):
  html=(ROOT/file).read_text()
  html=re.sub(r'<script\b[^>]*>\s*</script>','',html,flags=re.I)
  html=re.sub(r'<link\b[^>]*>','',html,flags=re.I)
  page.set_content(html,wait_until='domcontentloaded',timeout=12000)
  page.add_style_tag(content=bootstrap+css)
  page.evaluate('''(rows)=>{
    window.LKM_CONFIG={TURNSTILE_SITE_KEY:''};
    window.LKMStore={publicServices:async()=>rows};
    window.__leadPayload=null;
    window.fetch=async(url,init)=>{
      if(url==='/api/enquiry'){
        window.__leadPayload=JSON.parse(init.body);
        return {ok:true,json:async()=>({ok:true,saved:true,notification_sent:true,id:'simulated'})};
      }
      throw Error('Unexpected request '+url);
    }
  }''',services)
  page.add_script_tag(content=script)

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    ctx=browser.new_context(viewport={'width':1365,'height':850})
    page=ctx.new_page()
    bootstrap_page(page,'business-restaurants.html')
    page.locator('.lkm-biz-offer').first.wait_for(timeout=12000)
    assert page.locator('.lkm-biz-offer').count()==3
    assert 'Restaurant' in page.title()
    assert page.locator('.lkm-biz-service-choice').count()==6
    assert 'Wedding Photography' not in page.locator('#lkmBusinessChoices').inner_text()
    page.get_by_role('button',name='Request this mix').first.click()
    assert page.locator('#lkmBusinessChoices input:checked').count()==2
    page.locator('input[name=name]').fill('Browser Test')
    page.locator('input[name=email]').fill('browser@example.com')
    page.locator('input[name=company]').fill('Test Cafe')
    page.locator('textarea[name=description]').fill('We would like photography and videos for a seasonal menu.')
    page.locator('input[name=consent]').check()
    page.locator('#lkmBusinessSubmit').click()
    page.locator('.lkm-biz-form.is-submitted').wait_for(timeout=12000)
    assert 'saved' in page.locator('#lkmBusinessStatus').inner_text().lower()
    reply=page.evaluate('window.__leadPayload')
    assert reply and reply['type']=='business_enquiry'
    assert 'Test Cafe' in reply['message']
    assert 'Menu & venue visuals' in reply['message']
    assert 'Product Photography' in reply['message']
    print('PASS: desktop Restaurant offers, bundle selection, lead payload and success')
    ctx.close()

    ctx=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2)
    page=ctx.new_page()
    bootstrap_page(page,'business-retail.html')
    page.locator('.lkm-biz-offer').first.wait_for(timeout=12000)
    assert page.locator('.lkm-biz-offer').count()==3
    sizes=page.evaluate('({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth})')
    assert sizes['sw']<=sizes['cw']+2,sizes
    assert page.get_by_role('heading',name='Give your products the visual attention they deserve').count()==1
    print('PASS: mobile Retail layout and suggested combinations')
    ctx.close()

    ctx=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2)
    page=ctx.new_page()
    bootstrap_page(page,'business-solutions.html')
    assert page.locator('.lkm-biz-industry').count()==4
    assert page.get_by_role('link',name='Explore solutions').count()==4
    sizes=page.evaluate('({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth})')
    assert sizes['sw']<=sizes['cw']+2,sizes
    print('PASS: mobile Business Solutions hub and responsive links')
    ctx.close()
    browser.close()
