#!/usr/bin/env python3
"""Browser tests of the actual new Portfolio Stories module, with mocked read-only Supabase.
   The HTML is a minimal DOM fixture for the existing CMS output; no production writes. """
import json
import re
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
HELPERS = (ROOT / 'assets/lkm-v3/case-studies-data.mjs').read_text().replace('export function ', 'function ')
SOURCE = (ROOT / 'assets/lkm-v3/portfolio-stories.mjs').read_text(encoding='utf8')
SOURCE = re.sub(r"^import\s+\{[^\n]+\}\s+from\s+'\./case-studies-data.mjs';\s*",'',SOURCE,count=1,flags=re.MULTILINE)
JS = HELPERS + '\n' + SOURCE
COVER = 'https://lilkangoomedia.com/assets/images/elea-golf-club/aerial-course-sand-bunkers.webp'
GALLERY_ID = 'ca866ce0-5fd0-4581-ae76-6d8e9b627802'
PHOTO_ID = 'fb6f48f2-974e-4cbd-adc5-59a1b8c4607e'
STORY = {
  'gallery_id':GALLERY_ID,'is_published': True,'headline':'Eléa Golf Club — Championship Photography, Aerial Film & Social Media',
  'objective':'Document the European Senior Championships with professional photography and event video.',
  'approach':'We covered the full tournament, captured opening and closing ceremonies and returned for 18-hole aerial filming.',
  'deliverables':['400+ delivered photographs','18 individual flyovers','Two social media reels'],
  'outcomes':'Published on the club website and social media. No sales or booking outcomes claimed.',
  'client_label':'Eléa Golf Club','project_location':'Paphos, Cyprus','project_year':2026,
}
GALLERY = {
  'id':GALLERY_ID,'slug':'elea-golf-club','title':'Eléa Golf Club — Photography & Film',
  'visibility':'public','category':'Golf, Events & Aerial Film','cover_image_id':PHOTO_ID,
  'client_name':'Eléa Golf Club','related_service_slug':'commercial-video-reels',
}
PHOTO = {'id':PHOTO_ID,'gallery_id':GALLERY_ID,'image_url':COVER,
         'alt_text':'Aerial golf course in Cyprus','caption':'Eléa Golf Club from above',
         'display_order':10,'visibility':'public'}
VIDEOS = [
  {'gallery_id':GALLERY_ID,'youtube_id':'y1CB22Z-Qm4','title':'Complete 18-Hole Aerial Flyover','visibility':'public','display_order':10},
  {'gallery_id':GALLERY_ID,'youtube_id':'kU3ACgDkxDo','title':'Eléa Golf Club — Social Media Short','visibility':'public','display_order':20},
]
HTML = '''<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body data-cms-page="portfolio"><header class="site-header"><div class="header-inner">LilKangooMedia</div></header>
<main class="public-cms-page" id="cmsPublic">
<div class="cms-pub-eyebrow">Selected photography and films</div><h1 class="cms-pub-title">Our portfolio</h1>
<p class="cms-pub-intro">Explore our photography and filmmaking.</p>
<div class="cms-pub-chips"><button>All</button><button>Sports</button></div>
<div class="cms-pub-grid"><a href="#/gallery/elea-golf-club" class="cms-pub-card">Eléa Golf Club Gallery</a></div>
</main><main id="lkmPortfolioStoryView" class="lkm-ps-reader lkm-case-public-main" hidden aria-label="Project story"></main>
<footer>© LilKangooMedia</footer></body></html>'''
BASE_CSS = '''*{box-sizing:border-box}body{margin:0;background:#f7f8f4;font:15px/1.6 Arial,sans-serif;color:#2a3a2d}
.site-header{padding:18px 26px;background:#fff;border-bottom:1px solid #dce5df}
.header-inner{font-weight:bold;font-size:20px;max-width:1180px;margin:auto}
.public-cms-page{width:min(1180px,calc(100% - 40px));margin:auto;padding:45px 0 70px;min-height:60vh}
.cms-pub-eyebrow{font-size:12px;text-transform:uppercase;letter-spacing:.13em;color:#a57443}
.cms-pub-title{font-size:clamp(40px,5vw,70px);letter-spacing:-.04em;margin:5px 0}
.cms-pub-intro{color:#66756a;margin:0 0 28px}
.cms-pub-chips{display:flex;gap:10px;margin:20px 0}.cms-pub-chips button{padding:10px 20px;border:1px solid #cad8cc;background:#fff;border-radius:50px}
.cms-pub-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
.cms-pub-grid a{display:block;background:#fff;border:1px solid #dee6e0;padding:55px 20px;border-radius:12px}
.lkm-case-wrap{width:min(1180px,calc(100% - 40px));margin:0 auto}
.lkm-case-breadcrumb{padding:20px 0}.lkm-case-breadcrumb a{color:#a26035}
.lkm-case-narrative{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.lkm-case-prose,.lkm-case-deliverables{background:white;border:1px solid #dee5dc;border-radius:14px;padding:23px;margin-bottom:23px}
.lkm-case-prose h2,.lkm-case-deliverables h2{font-size:25px;line-height:1.2}
.lkm-case-prose p{white-space:pre-wrap;color:#596b5b}
.lkm-case-deliverables ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:10px}
.lkm-case-deliverables li{padding:10px;border-radius:8px;background:#eff4ed}
.lkm-case-cta{padding:35px;background:#243d2d;color:white;border-radius:14px}.lkm-case-cta h2{color:#fff}.lkm-case-cta p{color:#e0e8dc}
.lkm-case-cta-actions{display:flex;gap:12px}.lkm-case-cta-actions a{background:#e9ece7;color:#29412d;padding:10px 15px;text-decoration:none;border-radius:5px}
footer{padding:25px;background:#243d2d;color:white;text-align:center}
@media(max-width:650px){.lkm-case-narrative,.lkm-case-deliverables ul{grid-template-columns:1fr}}
'''

class PortfolioStoriesBrowser(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()

    def page(self, stories=None, fail=False, mobile=False):
        context=self.browser.new_context(viewport={'width':390 if mobile else 1380,'height':844 if mobile else 950},device_scale_factor=1)
        page=context.new_page()
        page.set_content(HTML)
        page.add_style_tag(content=BASE_CSS+(ROOT/'assets/lkm-v3/portfolio-stories.css').read_text())
        supplied=[STORY] if stories is None else stories
        page.evaluate('''({stories,gallery,photo,videos,fail})=>{
          window.LKM_CONFIG={SUPABASE_URL:'https://mock-supabase.test',SUPABASE_ANON_KEY:'mock_public_key'};
          window.fetch=async input=>{
            const url=String(input);
            if(fail) return {ok:false,status:503,json:async()=>({})};
            const rows=url.includes('/lkm_case_studies?')?stories:url.includes('/portfolio_galleries?')?[gallery]:
              url.includes('/portfolio_images?')?[photo]:url.includes('/media_videos?')?videos:[];
            return {ok:true,json:async()=>rows};
          }
        }''',{'stories':supplied,'gallery':GALLERY,'photo':PHOTO,'videos':VIDEOS,'fail':fail})
        page.add_script_tag(content=JS,type='module')
        return page,context

    def test_portfolio_features_two_navigation_options_and_case_card(self):
        page,context=self.page()
        try:
            page.wait_for_selector('#lkmPortfolioStories .lkm-ps-card',timeout=6000)
            self.assertEqual(page.locator('#lkmPortfolioSections .lkm-ps-nav-link').count(),2)
            self.assertEqual(page.locator('.cms-pub-grid').count(),1)
            self.assertEqual(page.locator('#lkmPortfolioStories .lkm-ps-card').count(),1)
            self.assertIn('#/story/elea-golf-club',page.locator('#lkmPortfolioStories .lkm-ps-card').first.get_attribute('href'))
            self.assertEqual(page.locator('#cmsPublic').is_visible(),True)
            self.assertTrue(page.locator('#lkmPortfolioStoriesTitle').is_visible())
        finally: context.close()

    def test_story_list_in_portfolio_hides_gallery_and_keeps_nav(self):
        page,context=self.page()
        try:
            page.wait_for_selector('.lkm-ps-card',timeout=6000)
            page.evaluate("location.hash='#/stories'")
            page.wait_for_function("document.documentElement.classList.contains('lkm-ps-stories-only')")
            self.assertEqual(page.locator('.cms-pub-grid').is_visible(),False)
            self.assertTrue(page.locator('#lkmPortfolioSections [aria-current="page"]').get_attribute('href').endswith('#/stories'))
            self.assertEqual(page.locator('#lkmPortfolioStories .lkm-ps-card').count(),1)
            self.assertEqual(page.locator('#cmsPublic').is_visible(),True)
        finally: context.close()

    def test_story_inside_portfolio_films_above_photos_and_click_to_play(self):
        page,context=self.page()
        try:
            page.wait_for_selector('.lkm-ps-card',timeout=6000)
            page.locator('.lkm-ps-card').first.click()
            page.wait_for_selector('.lkm-ps-film-card',timeout=6000)
            self.assertEqual(page.locator('#cmsPublic').is_visible(),False)
            self.assertTrue(page.locator('#lkmPortfolioStoryView').is_visible())
            self.assertEqual(page.locator('.lkm-ps-film-card').count(),2)
            self.assertEqual(page.locator('.lkm-ps-photo-card').count(),1)
            self.assertEqual(page.locator('.lkm-ps-film-card [data-lkm-ps-play]').first.get_attribute('data-lkm-ps-play'),'y1CB22Z-Qm4')
            self.assertEqual(page.evaluate("document.querySelector('.lkm-ps-film-section').compareDocumentPosition(document.querySelector('.lkm-ps-photo-section')) & Node.DOCUMENT_POSITION_FOLLOWING"),4)
            self.assertEqual(page.locator('iframe').count(),0)
            page.locator('[data-lkm-ps-play="kU3ACgDkxDo"]').click()
            self.assertEqual(page.locator('.lkm-ps-film-player.is-short iframe').count(),1)
            self.assertIn('youtube-nocookie.com/embed/kU3ACgDkxDo',page.locator('iframe').get_attribute('src'))
            page.locator('.lkm-case-breadcrumb a').first.click()
            page.wait_for_function("!document.getElementById('cmsPublic').hidden")
            self.assertTrue(page.locator('.cms-pub-grid').is_visible())
        finally: context.close()

    def test_gallery_detail_gets_inline_story_link(self):
        page,context=self.page()
        try:
            page.wait_for_selector('.lkm-ps-card',timeout=6000)
            page.evaluate('''()=>{document.getElementById('cmsPublic').innerHTML='<div class="cms-gallery-grid"><figure>Photo</figure></div>';location.hash='#/gallery/elea-golf-club';}''')
            page.wait_for_selector('#lkmPortfolioGalleryStory a',timeout=6000)
            self.assertIn('#/story/elea-golf-club',page.locator('#lkmPortfolioGalleryStory a').get_attribute('href'))
        finally: context.close()

    def test_unpublished_stories_are_not_displayed(self):
        page,context=self.page(stories=[dict(STORY,is_published=False)])
        try:
            page.wait_for_selector('#lkmPortfolioStories .lkm-ps-empty',timeout=6000)
            self.assertEqual(page.locator('.lkm-ps-card').count(),0)
            page.evaluate("location.hash='#/story/elea-golf-club'")
            page.wait_for_selector('.lkm-ps-reader-empty h1',timeout=6000)
            self.assertIn('unavailable',page.locator('.lkm-ps-reader-empty h1').inner_text())
        finally: context.close()

    def test_api_failure_is_isolated_from_galleries(self):
        page,context=self.page(fail=True)
        try:
            page.wait_for_selector('#lkmPortfolioStories .lkm-ps-empty',timeout=6000)
            self.assertTrue(page.locator('#cmsPublic .cms-pub-grid').is_visible())
            self.assertIn('unavailable',page.locator('#lkmPortfolioStories .lkm-ps-empty').inner_text())
        finally: context.close()

    def test_mobile_view_has_no_horizontal_overflow(self):
        page,context=self.page(mobile=True)
        try:
            page.wait_for_selector('.lkm-ps-card',timeout=6000)
            for hash in ['#/','#/stories','#/story/elea-golf-club']:
                page.evaluate('(h)=>location.hash=h',hash)
                page.wait_for_timeout(250)
                if hash.endswith('elea-golf-club'):page.wait_for_selector('.lkm-ps-film-card')
                size=page.evaluate('''()=>({scroll:document.documentElement.scrollWidth,width:window.innerWidth})''')
                self.assertLessEqual(size['scroll'],size['width']+2,(hash,size))
        finally:context.close()

if __name__=='__main__':unittest.main(verbosity=2)
