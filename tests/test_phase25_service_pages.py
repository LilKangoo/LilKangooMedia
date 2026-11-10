#!/usr/bin/env python3
"""Purely local, deterministic build and SEO invariants (no network, no live writes)."""
import importlib.util
import json
from pathlib import Path
from html import escape
import re
import tempfile
import unittest
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
SPEC=importlib.util.spec_from_file_location('seo',ROOT/'scripts/build_service_pages.py')
SEO=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SEO)
SPEC2=importlib.util.spec_from_file_location('sitemap',ROOT/'scripts/phase20_rebuild_sitemap.py')
SITEMAP=importlib.util.module_from_spec(SPEC2)
SPEC2.loader.exec_module(SITEMAP)


def mock_seed(root,removed=None):
    a=[]
    for i,(slug,item) in enumerate(SEO.PAGES.items()):
        a.append({'slug':slug,'title':item['title'],'cover_url':'/assets/images/sample-photo.jpg','sort_order':i*10,'audience':'personal' if i<6 else 'business','active':slug!=removed})
    p=root/'assets/lkm-v3/seed.js';p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text('window.LKM_SEED = '+json.dumps(a,indent=2)+';\n',encoding='utf-8')

class Tests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)
        mock_seed(self.root)
        for name in ('index.html','home.html'):
            (self.root/name).write_text('<!doctype html><footer><a href="/business-solutions.html">Business Solutions</a></footer>',encoding='utf-8')
        (self.root/'assets/lkm-v3/articles-index.json').write_text('{"posts":[]}',encoding='utf-8')
        (self.root/'sitemap.xml').write_text('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://lilkangoomedia.com/</loc></url></urlset>',encoding='utf-8')
    def test_generates_13_dedicated_html_and_hub(self):
        self.assertEqual(SEO.build(self.root),13)
        self.assertEqual(len(list((self.root/'services').glob('*.html'))),14)
        for slug,copy in SEO.PAGES.items():
            txt=(self.root/'services'/f'{slug}.html').read_text()
            self.assertTrue(txt.startswith('<!-- LKM GENERATED SEO SERVICE -->'))
            self.assertIn(f'https://lilkangoomedia.com/services/{slug}.html',txt)
            self.assertIn('<meta name="robots" content="index,follow">',txt)
            self.assertIn('<h1>'+escape(copy['title'])+'</h1>',txt)
            self.assertIn('application/ld+json',txt)
            self.assertIn('href="/#/service/'+slug+'"',txt)
            self.assertIn('rel="canonical"',txt)
            self.assertNotIn('AggregateRating',txt)
            self.assertNotIn('€150',txt)
            self.assertNotIn('€250',txt)
            self.assertNotIn('hreflang',txt)
            match=re.search(r'<script type="application/ld\+json">(.*?)</script>',txt,re.S)
            self.assertIsNotNone(match)
            schema=json.loads(match.group(1))
            self.assertEqual(schema['@graph'][1]['provider']['name'],'LilKangooMedia LTD')
        hub=(self.root/'services/index.html').read_text()
        self.assertIn('Creative services in Cyprus',hub)
        self.assertEqual(hub.count('class="lkm25-service-card"'),13)
    def test_homepage_link_idempotent(self):
        SEO.build(self.root);SEO.build(self.root)
        for f in ('index.html','home.html'):
            t=(self.root/f).read_text();self.assertEqual(t.count('href="/services/index.html"'),1)
    def test_sitemap_contains_all_14_and_retired_removed(self):
        SEO.build(self.root);count=SITEMAP.build(self.root)
        self.assertGreaterEqual(count,15)
        urls=[el.text for el in ET.parse(self.root/'sitemap.xml').iter() if el.tag.endswith('loc')]
        self.assertIn('https://lilkangoomedia.com/services/index.html',urls)
        self.assertEqual(len([u for u in urls if '/services/' in u]),14)
        mock_seed(self.root,removed='marketing-advertising')
        SEO.build(self.root);SITEMAP.build(self.root)
        urls=[el.text for el in ET.parse(self.root/'sitemap.xml').iter() if el.tag.endswith('loc')]
        self.assertNotIn('https://lilkangoomedia.com/services/marketing-advertising.html',urls)
        self.assertFalse((self.root/'services/marketing-advertising.html').exists())
    def test_rejects_malicious_manifest(self):
        SEO.build(self.root)
        p=self.root/'assets/lkm-v3/service-seo-index.json'
        p.write_text(json.dumps({'paths':['/services/index.html','/services/../admin.html']}))
        with self.assertRaises(RuntimeError):SITEMAP.build(self.root)
    def test_does_not_delete_independent_pages(self):
        page=self.root/'services/handmade.html';page.parent.mkdir(exist_ok=True)
        page.write_text('Independent page, no generator marker')
        SEO.build(self.root)
        self.assertTrue(page.exists())
    def test_rejects_bad_seed_and_script_urls(self):
        p=self.root/'assets/lkm-v3/seed.js';p.write_text('window.LKM_SEED = alert(1)')
        with self.assertRaises(ValueError):SEO.build(self.root)
        self.assertEqual(SEO.safe_cover('https://evil.test/a.jpg'),'/assets/images/home-meta.jpg')
        self.assertEqual(SEO.safe_cover('/assets/images/../evil.jpg'),'/assets/images/home-meta.jpg')
    def test_original_html_is_not_replaced_if_marker_missing(self):
        (self.root/'index.html').write_text('<h1>Unique site header</h1>')
        SEO.build(self.root)
        self.assertEqual((self.root/'index.html').read_text(),'<h1>Unique site header</h1>')
    def test_netlify_build_order(self):
        s=(ROOT/'netlify.toml').read_text()
        self.assertIn('build_articles.py && python3 scripts/build_service_pages.py && python3 scripts/phase20_rebuild_sitemap.py',s)
        self.assertIn('functions = "netlify/functions"',s)

if __name__=='__main__':unittest.main(verbosity=2)
