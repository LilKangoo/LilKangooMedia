"""Run: python3 -m unittest discover -s tests -v"""
import importlib.util, json, re, shutil, subprocess, tempfile, unittest
from pathlib import Path

SCRIPT=Path(__file__).resolve().parent.parent/'scripts/build_articles.py'
spec=importlib.util.spec_from_file_location('build_articles',SCRIPT)
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)

class ArticleBuildTests(unittest.TestCase):
 def test_cleaner_drops_dangerous_markup(self):
  c=module.ContentCleaner();c.feed('<p>Welcome <strong>here</strong><script>alert(1)</script> safely</p><iframe src="https://evil.example/">bad</iframe><img src="javascript:alert(1)"><p><a href="javascript:alert(2)" onclick="x()">Link</a></p>')
  clean=c.output();self.assertIn('Welcome',clean);self.assertNotIn('alert',clean);self.assertNotIn('iframe',clean);self.assertNotIn('onclick',clean);self.assertIn('Link',clean)
 def test_legacy_path_and_OG_metadata(self):
  sample='<!doctype html><title>Photography in Cyprus</title><meta name="description" content="Photo tips and advice"><link rel="canonical" href="https://lilkangoomedia.com/original-article"><section class="mbr-section content2"><h1>Photography in Cyprus</h1><p>'+'Original article text about shooting portraits in natural light. '*25+'</p></section><section class="content7"><h2>Tips</h2><p>'+'Photography tips about practical lighting and composition. '*15+'</p></section>'
  with tempfile.TemporaryDirectory() as temp:
   path=Path(temp)/'Original-Article.html';path.write_text(sample)
   data,err=module.parse_legacy_file(path,'photo-education','Photo Education')
   self.assertIsNone(err);self.assertEqual(data['legacy_path'],'/Original-Article.html');self.assertEqual(data['canonical_url'],'https://lilkangoomedia.com/original-article')
   rendered=module.render_post(data,[data]);self.assertEqual(rendered.count('<h1>'),1);self.assertIn('Photography tips',rendered);self.assertNotIn('legacy',rendered.lower())
 def test_categories_and_readable_urls(self):
  sample='<!doctype html><title>Article test</title><section class="content2"><h1>Article test</h1><p>'+'A factual original paragraph for the site. '*45+'</p></section>'
  with tempfile.TemporaryDirectory() as temp:
   root=Path(temp);(root/'scripts').mkdir();(root/'assets/lkm-v3').mkdir(parents=True)
   shutil.copyfile(SCRIPT,root/'scripts/build_articles.py')
   (root/'Education.html').write_text('<a href="MyArticle.html">Photo story</a>');(root/'articlesaboutcyprus.html').write_text('<a href="cypstory.html">Cyprus</a>')
   (root/'MyArticle.html').write_text(sample);(root/'cypstory.html').write_text(sample.replace('Article test','Cyprus story'))
   (root/'other.html').write_text('<title>Protected Page</title><p>Not an article</p>')
   res=subprocess.run(['python3',str(root/'scripts/build_articles.py')],capture_output=True,text=True,timeout=10)
   self.assertEqual(res.returncode,0,res.stderr)
   index=json.loads((root/'assets/lkm-v3/articles-index.json').read_text());self.assertEqual(index['count'],2)
   imported=json.loads((root/'assets/lkm-v3/articles-import.json').read_text());self.assertEqual(imported['count'],2)
   self.assertTrue((root/'MyArticle.html').exists());self.assertTrue((root/'myarticle.html').exists());self.assertTrue((root/'education.html').exists())
   self.assertIn('article-prose',(root/'MyArticle.html').read_text());self.assertIn('Photo Education',(root/'Education.html').read_text());self.assertNotIn('article-prose',(root/'other.html').read_text())
 def test_published_article_path(self):
  post=module.clean_post(dict(slug='new-tips',title='New tips',body_html='<p>'+'Tips for Cyprus. '*35+'</p>',status='published',seo_description='Helpful ideas',canonical_url=''))
  self.assertEqual(post['permalink'],'/articles/new-tips.html')
  self.assertEqual(post['canonical_url'],'https://lilkangoomedia.com/articles/new-tips')
 def test_js_syntax(self):
  base=SCRIPT.parent.parent/'assets/lkm-v3'
  for name in ['cms.js','cms-public.js','article-consent.js']:
   p=subprocess.run(['node','--check',str(base/name)],capture_output=True,text=True)
   self.assertEqual(p.returncode,0,name+' '+p.stderr)

if __name__=='__main__':unittest.main()
