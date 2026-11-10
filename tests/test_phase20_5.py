"""Standalone tests: python3 -m unittest discover -s tests -p test_phase20_5.py -v"""
import importlib.util
import json
import re
import tempfile
import tomllib
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path

PROJECT=Path(__file__).resolve().parent.parent
S=PROJECT/'scripts/phase20_rebuild_sitemap.py'
spec=importlib.util.spec_from_file_location('phase20_rebuild_sitemap',S)
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


class Phase205(unittest.TestCase):
    def fixture(self):
        ctx=tempfile.TemporaryDirectory()
        self.addCleanup(ctx.cleanup)
        root=Path(ctx.name)
        (root/'assets/lkm-v3').mkdir(parents=True)
        (root/'articles').mkdir()
        for name in ('index.html','home.html','holiday.html','AboutUs.html','portfolio.html','blog.html','old-post.html','removed.html','admin.html'):
            (root/name).write_text('<html><head><title>'+name+'</title></head></html>')
        (root/'removed.html').write_text('<meta name="robots" content="noindex, nofollow">')
        (root/'articles/approved.html').write_text('<html><head><title>Approved</title></head></html>')
        (root/'assets/lkm-v3/articles-index.json').write_text(json.dumps({'posts':[
            {'permalink':'/articles/approved.html','canonical_url':'https://lilkangoomedia.com/articles/approved.html'},
            {'permalink':'/old-post.html','canonical_url':'https://lilkangoomedia.com/old-post'},
            {'permalink':'/articles/not-created.html','canonical_url':'https://lilkangoomedia.com/articles/not-created.html'},
            {'permalink':'/articles/cross-domain.html','canonical_url':'https://evil.example/post'}]}))
        (root/'sitemap.xml').write_text('''<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>https://lilkangoomedia.com/home</loc><lastmod>2024-02-03</lastmod></url>
<url><loc>https://lilkangoomedia.com/holiday</loc></url>
<url><loc>https://lilkangoomedia.com/aboutus</loc></url>
<url><loc>https://lilkangoomedia.com/missing</loc></url>
<url><loc>https://lilkangoomedia.com/removed</loc></url>
<url><loc>https://lilkangoomedia.com/admin.html</loc></url>
<url><loc>https://lilkangoomedia.com/old-post</loc></url>
</urlset>''')
        return root

    def test_sitemap_keeps_historical_real_urls_only(self):
        root=self.fixture()
        self.assertGreaterEqual(mod.build(root),6)
        content=(root/'sitemap.xml').read_text()
        parsed=ET.fromstring(content)
        urls=[n.text for n in parsed.iter() if n.tag.endswith('loc')]
        self.assertIn('https://lilkangoomedia.com/',urls)
        self.assertIn('https://lilkangoomedia.com/holiday',urls)
        self.assertIn('https://lilkangoomedia.com/aboutus',urls)
        self.assertIn('https://lilkangoomedia.com/articles/approved.html',urls)
        self.assertIn('https://lilkangoomedia.com/old-post',urls)
        self.assertIn('https://lilkangoomedia.com/blog.html',urls)
        self.assertIn('https://lilkangoomedia.com/portfolio.html',urls)
        for bad in ('/missing','/removed','/admin.html','/home','/articles/not-created.html'):
            self.assertNotIn('https://lilkangoomedia.com'+bad,urls)
        self.assertNotIn('2024-02-03',content)
        self.assertNotIn('lastmod',content)
        self.assertEqual(len(urls),len(set(urls)))

    def test_idempotent(self):
        root=self.fixture()
        a=mod.build(root)
        value=(root/'sitemap.xml').read_bytes()
        b=mod.build(root)
        self.assertEqual(a,b)
        self.assertEqual(value,(root/'sitemap.xml').read_bytes())

    def test_manifest_missing_aborts_without_destroying_sitemap(self):
        root=self.fixture()
        (root/'assets/lkm-v3/articles-index.json').unlink()
        existing=(root/'sitemap.xml').read_bytes()
        with self.assertRaises(RuntimeError):mod.build(root)
        self.assertEqual(existing,(root/'sitemap.xml').read_bytes())

    def test_invalid_old_xml_aborts_without_overwriting(self):
        root=self.fixture()
        (root/'sitemap.xml').write_text('<urlset>broken')
        existing=(root/'sitemap.xml').read_bytes()
        with self.assertRaises(RuntimeError):mod.build(root)
        self.assertEqual(existing,(root/'sitemap.xml').read_bytes())

    def test_unsafe_urls_rejected(self):
        for url in ('https://evil.com/','http://lilkangoomedia.com/','https://lilkangoomedia.com/#/service/x',
                    'https://lilkangoomedia.com/?secret=true','https://lilkangoomedia.com//evil',
                    'https://lilkangoomedia.com/admin.html','https://lilkangoomedia.com/a%2Fb'):
            self.assertIsNone(mod.normalized_url(url),url)

    def test_retains_phase204_and_meta(self):
        index=(PROJECT/'index.html').read_text()
        self.assertEqual(index,(PROJECT/'home.html').read_text())
        for tag in ('phase20-conversion.js','phase20-funnel.js','phase20-ux.js','phase20-reliability.js'):
            self.assertEqual(index.count(tag),1)
        self.assertEqual(index.count('rel="canonical"'),1)
        self.assertEqual(index.count('application/ld+json'),1)
        self.assertEqual(index.count('heroPreload.fetchPriority'),1)
        self.assertIn('location.hash',index)
        match=re.search(r'<script type="application/ld\+json">(.*?)</script>',index)
        self.assertIsNotNone(match)
        record=json.loads(match.group(1))
        self.assertEqual(record['@type'],'ProfessionalService')
        self.assertEqual(record['areaServed']['name'],'Cyprus')

    def test_related_pages_canonical_social(self):
        for name in ('index.html','home.html','blog.html','portfolio.html'):
            s=(PROJECT/name).read_text()
            self.assertIn('og:image',s)
            self.assertIn('og:description',s)
            self.assertIn('twitter:card',s)
            self.assertEqual(s.count('rel="canonical"'),1)
        self.assertIn('Sitemap: https://lilkangoomedia.com/sitemap.xml',(PROJECT/'robots.txt').read_text())
        config=tomllib.loads((PROJECT/'netlify.toml').read_text())
        self.assertIn('phase20_rebuild_sitemap.py',config['build']['command'])
        self.assertEqual(len(config['redirects']),2)


if __name__=='__main__':unittest.main()
