"""Phase 25.2: local browser smoke. No internet and no production requests."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
CSS=(ROOT/'assets/lkm-v3/service-seo.css').read_text()
JS=(ROOT/'assets/lkm-v3/service-seo.mjs').read_text().replace('export function ','function ')


def show(page,path,w,h,script=False,active=True):
    body=path.read_text()
    # CSS and src assets are injected locally. Images are not fetched from the network.
    body=body.replace('<script src="/lkm-config.js" defer></script>','').replace('<script type="module" src="/assets/lkm-v3/service-seo.mjs"></script>','').replace('<link rel="stylesheet" href="/assets/lkm-v3/service-seo.css">','')
    page.set_viewport_size({'width':w,'height':h})
    page.set_content(body,wait_until='domcontentloaded')
    page.add_style_tag(content=CSS)
    if script:
        page.evaluate('''isActive => {
          window.LKM_CONFIG={SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'test-public-key'};
          window.fetch=async () => ({ok:true,json:async()=>isActive?[{slug:'portrait-photography',active:true,title:'Portrait & Family Photography',packages:[{name:'One-hour session',description:'Sample live description'}]}]:[]});
        }''',active)
        page.add_script_tag(content='(async()=>{'+JS+'})()')
        page.wait_for_timeout(150)

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page()
    show(page,ROOT/'services/portrait-photography.html',1280,920,True)
    assert page.get_by_role('heading',name='Portrait & Family Photography').count()==1
    assert page.get_by_text('One-hour session').count()==1
    assert page.locator('#lkmServiceMainCta').get_attribute('href')=='/#/service/portrait-photography'
    page.screenshot(path=str(ROOT/'tests/seo_desktop.png'),full_page=True)
    print('Desktop service + live Supabase UI PASS')
    show(page,ROOT/'services/portrait-photography.html',390,844,True)
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth+1')
    assert page.get_by_text('One-hour session').count()==1
    page.screenshot(path=str(ROOT/'tests/seo_mobile.png'),full_page=True)
    print('Mobile service + live Supabase UI PASS')
    show(page,ROOT/'services/portrait-photography.html',390,844,True,False)
    assert page.locator('#lkmServiceMainCta').get_attribute('href')=='/#/services'
    print('Inactive or unavailable service falls back to catalogue PASS')
    show(page,ROOT/'services/index.html',1280,920)
    assert page.locator('.lkm25-service-card').count()==13
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth+1')
    print('Desktop service hub PASS')
    show(page,ROOT/'services/index.html',390,844)
    assert page.locator('.lkm25-service-card').count()==13
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth+1')
    page.screenshot(path=str(ROOT/'tests/hub_mobile.png'),full_page=True)
    print('Mobile service hub PASS')
    browser.close()
