import csv, importlib.util, json, tempfile, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('legacy',ROOT/'scripts'/'build_legacy_import.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

class LegacyImporterTests(unittest.TestCase):
 def test_verified_counts_and_statuses(self):
  g=json.loads((ROOT/'review'/'verified-galleries.json').read_text(encoding='utf8'))
  self.assertEqual([(x['source_page'],len(x['images'])) for x in g],
    [('Portraits.html',52),('Nature.html',28),('Products.html',34),('GraphicDesign.html',22),('IgoriGabrysia.html',74)])
  self.assertEqual([x['visibility'] for x in g],['public']*4+['review'])
 def test_lazy_load_and_repeat_deduplicated_by_manifest_scanner(self):
  s='''<html><head><title>My Gallery</title></head><body><section class="gallery4 mbr-gallery">
  <div class="gallery-image"><img src="data:image/gif;base64,xyz" data-src="assets/images/test-image.jpg"></div>
  <div class="lightbox"><img src="data:image/gif;base64,xyz" data-src="assets/images/test-image.jpg"></div>
  <img src="/assets/images/other.jpg"><img data-src="https://evil.test/private.jpg"></section>
  </body></html>'''
  p=m.LegacyGalleryParser();p.feed(s)
  self.assertEqual([x[0] for x in p.images],['assets/images/test-image.jpg','assets/images/test-image.jpg','assets/images/other.jpg'])
 def test_non_gallery_and_protected_excluded(self):
  p=m.LegacyGalleryParser();p.feed('<title>Protected Page</title>')
  self.assertEqual(m.classify_page('john.html',p,set(),set()),'Password-protected legacy page')
  self.assertEqual(m.classify_page('Portraits.html',p,{'portraits.html'},set()),None)
  self.assertIsNotNone(m.classify_page('article.html',p,set(),{'article.html'}))
 def test_sql_multiple_gallery_associations_idempotent(self):
  one={'slug':'legacy-a','title':'A','category':'Portraits','source_page':'A.html','visibility':'review','related_service_slug':None,'images':[('assets/images/shared.jpg','')]}
  two={**one,'slug':'legacy-b','source_page':'B.html'}
  sql=m.generate_sql([one,two]);self.assertEqual(sql.count("'assets/images/shared.jpg'"),4)
  self.assertEqual(sql.count('INSERT INTO public.portfolio_images'),2)
  self.assertIn('DROP CONSTRAINT IF EXISTS portfolio_images_original_path_key',sql)
  self.assertIn('ON CONFLICT DO NOTHING',sql)
 def test_html_products_matches_verified_manifest(self):
  p=Path('/mnt/data/Products.html')
  if not p.exists():self.skipTest('Local original Products.html not mounted')
  parsed=m.parse(p)
  paths=list(dict.fromkeys(x[0].split('/')[-1] for x in parsed.images))
  g=json.loads((ROOT/'review'/'verified-galleries.json').read_text(encoding='utf8'))
  expected=next(x['images'] for x in g if x['source_page']=='Products.html')
  self.assertEqual(paths,expected)
 def test_image_normalization(self):
  self.assertEqual(m.normalize_image('assets/images/my%20file.jpg'),'assets/images/my file.jpg')
  self.assertIsNone(m.normalize_image('../../etc/passwd'))
  self.assertIsNone(m.normalize_image('https://other.example/assets/images/cat.jpg'))

if __name__=='__main__':unittest.main()
