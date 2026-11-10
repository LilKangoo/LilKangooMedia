"""Offline regression checks: GitHub assets + SQL data contract + browser enhancement."""
from pathlib import Path
from PIL import Image
import json,re,subprocess,unittest
ROOT=Path(__file__).resolve().parents[1]
SQL=(ROOT/'supabase/migrations/20261110_lkm_elea_case_update_400photos.sql').read_text()
JS=(ROOT/'assets/lkm-v3/elea-case-layout.js').read_text()
HTML=(ROOT/'case-studies.html').read_text()
ASSETS=ROOT/'assets/images/elea-golf-club'
MANIFEST=json.loads((ROOT/'SELECTION.json').read_text())

class EleaReleaseTests(unittest.TestCase):
 def test_18_selected_public_and_review_not_in_assets(self):
  public=[r for r in MANIFEST if r['visibility']=='public']
  self.assertEqual(len(public),18)
  self.assertEqual(len(list(ASSETS.glob('*.webp'))),18)
  for row in MANIFEST:
   f=ASSETS/row['filename']
   self.assertEqual(f.exists(),row['visibility']=='public')
 def test_good_assets_no_exif_and_size(self):
  for p in ASSETS.glob('*.webp'):
   with Image.open(p) as im:
    self.assertEqual(im.format,'WEBP')
    self.assertLessEqual(max(im.size),2400)
    self.assertFalse(im.info.get('exif'))
   self.assertLess(p.stat().st_size,3_000_000)
 def test_sql_paths_and_idempotency(self):
  self.assertEqual(SQL.count("AS i(image_url, alt_text, caption, display_order)"),1)
  for row in MANIFEST:
   if row['visibility']=='public':
    self.assertEqual(SQL.count('/assets/images/elea-golf-club/'+row['filename']),1+(row['filename']=='aerial-course-sand-bunkers.webp'))
   else:self.assertNotIn(row['filename'],SQL)
  self.assertIn('IF v_image_id IS NULL',SQL)
  self.assertIn('WHERE p.gallery_id = v_gallery AND p.image_url = v_img.image_url',SQL)
  self.assertNotIn('DELETE FROM public.portfolio_images',SQL.upper())
 def test_400_plus_photos_and_private_assignment_both_named(self):
  self.assertIn('more than 400',SQL.lower())
  self.assertNotIn('over 300',SQL.lower())
  self.assertIn('Mariusz',SQL)
  self.assertIn('Agnieszka',SQL)
  self.assertIn('These individual commissions were separate',SQL)
 def test_video_ids_exact_two_and_not_removed(self):
  self.assertIn('y1CB22Z-Qm4',SQL)
  self.assertIn('kU3ACgDkxDo',SQL)
  self.assertNotIn('DELETE FROM public.media_videos',SQL.upper())
  self.assertIn('DO UPDATE SET',SQL)
 def test_html_presents_additive_scripts(self):
  self.assertIn('/assets/lkm-v3/case-studies-public.mjs',HTML)
  self.assertIn('/assets/lkm-v3/elea-case-layout.js',HTML)
  self.assertIn('/assets/lkm-v3/elea-case-layout.css',HTML)
  self.assertIn('lkmCasesPublic',HTML)
 def test_javascript_syntax(self):
  r=subprocess.run(['node','--check',str(ROOT/'assets/lkm-v3/elea-case-layout.js')],capture_output=True,text=True)
  self.assertEqual(r.returncode,0,r.stderr)

if __name__=='__main__':unittest.main()
