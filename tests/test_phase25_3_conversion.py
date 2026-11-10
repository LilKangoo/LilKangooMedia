import importlib.util
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

ROOT=Path(__file__).resolve().parents[1]
SPEC=importlib.util.spec_from_file_location('seo_script',ROOT/'scripts/build_service_pages.py')
SCRIPT=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(SCRIPT)

class ConversionBuildTests(unittest.TestCase):
 def test_idempotent_injection_existing_pages(self):
  with TemporaryDirectory() as work:
   root=Path(work)
   for name in ('index.html','home.html'):
    (root/name).write_text('<!doctype html><html><head><title>Home</title><script defer src="/assets/lkm-v3/site.js"></script></head><body><a href="/business-solutions.html">Business Solutions</a></body></html>')
   SCRIPT.inject_home_links(root)
   SCRIPT.inject_conversion_assets(root)
   SCRIPT.inject_conversion_assets(root)
   for name in ('index.html','home.html'):
    data=(root/name).read_text()
    self.assertEqual(data.count('phase25-direct-start.js'),1)
    self.assertEqual(data.count('phase25-conversion.js'),1)
    self.assertEqual(data.count('phase25-conversion.css'),1)
    self.assertTrue(data.index('phase25-direct-start.js')<data.index('</head>'))
    self.assertIn('Service Guides',data)
 def test_missing_html_head_keeps_original(self):
  with TemporaryDirectory() as work:
   root=Path(work);p=root/'index.html';p.write_text('Minimal test fixture without head')
   SCRIPT.inject_conversion_assets(root)
   self.assertEqual(p.read_text(),'Minimal test fixture without head')
 def test_english_only_no_new_sql_or_payments(self):
  generator=(ROOT/'scripts/build_service_pages.py').read_text()
  for text in ['Phase 25.2','inject_conversion_assets','def build(root):']:
   self.assertIn(text,generator)
  for path in ['phase25-direct-start.js','phase25-conversion.js','phase25-conversion.css']:
   self.assertTrue((ROOT/'assets/lkm-v3'/path).is_file())
  conversion=(ROOT/'assets/lkm-v3/phase25-conversion.js').read_text()
  self.assertNotIn('/api/checkout',conversion)
  self.assertNotIn('/api/enquiry',conversion)
  self.assertNotIn('stripe.refunds',conversion)
  self.assertIn('existing.click()',conversion) # preserves package snapshot save event

if __name__=='__main__':unittest.main()
