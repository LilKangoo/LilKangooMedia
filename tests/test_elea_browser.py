from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
JS=(ROOT/'assets/lkm-v3/elea-case-layout.js').read_text()
CSS=(ROOT/'assets/lkm-v3/elea-case-layout.css').read_text()
VIDEOS='''<a class="lkm-case-media-item lkm-case-video" href="https://www.youtube.com/watch?v=kU3ACgDkxDo"><img><span>Short</span></a>
<a class="lkm-case-media-item" href="/portfolio.html#/gallery/elea-golf-club"><img><span>Image 1</span></a>
<a class="lkm-case-media-item lkm-case-video" href="https://www.youtube.com/watch?v=y1CB22Z-Qm4"><img><span>Flyover</span></a>
<a class="lkm-case-media-item" href="/portfolio.html#/gallery/elea-golf-club"><img><span>Image 2</span></a>'''
BODY=f'<section class="lkm-case-visuals"><h2>Project imagery & films</h2><div class="lkm-case-media-grid">{VIDEOS}</div><a class="lkm-case-gallery-link" href="/portfolio.html#/gallery/elea-golf-club">Full gallery</a></section>'

def create_page(browser,hash,viewport):
 page=browser.new_page(viewport=viewport)
 page.set_content(f'<html><body><main id="lkmCasesPublic">{BODY}</main></body></html>')
 page.evaluate('(h) => { location.hash=h }',hash)
 page.add_style_tag(content=CSS)
 page.add_script_tag(content=JS)
 return page

def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  passed=0
  page=create_page(browser,'#/elea-golf-club',{'width':1350,'height':800})
  page.wait_for_selector('.lkm-elea-film-card')
  assert page.locator('.lkm-elea-film-card').count()==2
  assert page.locator('.lkm-elea-photo-grid .lkm-case-media-item').count()==2
  assert page.locator('.lkm-elea-film-caption strong').first.inner_text().find('18-Hole')>=0
  assert page.locator('.lkm-elea-film-caption strong').nth(1).inner_text().find('Social Media')>=0
  assert page.locator('.lkm-elea-films').evaluate('(el)=>el.compareDocumentPosition(document.querySelector(".lkm-elea-photos")) & Node.DOCUMENT_POSITION_FOLLOWING')
  passed+=1; print('PASS desktop: flyover and Short FIRST, photos AFTER')
  page.get_by_role('button',name='Play Eléa Golf Club — Complete 18-Hole Flyover').click()
  assert page.locator('.lkm-elea-player iframe').count()==1
  assert 'youtube-nocookie.com/embed/y1CB22Z-Qm4' in page.locator('.lkm-elea-player iframe').get_attribute('src')
  assert page.locator('.lkm-elea-film-caption a').count()==2
  passed+=1;print('PASS privacy-enhanced click-to-play + YouTube fallback link')
  page.evaluate('(html) => document.getElementById("lkmCasesPublic").innerHTML=html',BODY)
  page.wait_for_selector('.lkm-elea-film-card')
  assert page.locator('.lkm-elea-film-card').count()==2
  passed+=1;print('PASS rerender: no duplicate media')
  page.close()
  page=create_page(browser,'#/other-project',{'width':1350,'height':800})
  page.wait_for_timeout(100)
  assert page.locator('.lkm-elea-film-card').count()==0
  assert page.locator('.lkm-case-media-grid > a').count()==4
  passed+=1;print('PASS unrelated Case Studies unchanged')
  page.close()
  page=create_page(browser,'#/elea-golf-club',{'width':390,'height':844})
  page.wait_for_selector('.lkm-elea-film-card')
  assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
  assert page.locator('.lkm-elea-film-card').count()==2
  assert page.locator('.lkm-elea-photo-grid .lkm-case-media-item').count()==2
  passed+=1;print('PASS mobile: correct order and no horizontal overflow')
  page.close();browser.close()
  print(f'BROWSER PASS {passed}/5')

if __name__=='__main__':run()
