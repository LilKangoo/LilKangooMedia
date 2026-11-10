#!/usr/bin/env python3
"""Static checks for a safe SEO / navigation overlay of Portfolio Stories."""
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
PUBLIC=['index.html','home.html','business-brands.html','business-retail.html','business-hotels.html','business-restaurants.html','business-solutions.html']

class StaticCheck(unittest.TestCase):
  def test_portfolio_has_styles_and_new_module_and_reader(self):
    html=(ROOT/'portfolio.html').read_text()
    self.assertIn('href="/assets/lkm-v3/portfolio-stories.css"',html)
    self.assertIn('src="/assets/lkm-v3/portfolio-stories.mjs"',html)
    self.assertIn('src="/assets/lkm-v3/cms-public.js"',html)
    self.assertIn('id="lkmPortfolioStoryView"',html)
    self.assertIn('id="cmsPublic"',html)
    self.assertIn('rel="canonical" href="https://lilkangoomedia.com/portfolio.html"',html)
  def test_navigation_points_to_portfolio_stories(self):
    for file in PUBLIC:
      with self.subTest(file=file):
        html=(ROOT/file).read_text()
        self.assertIn('href="/portfolio.html#/stories"',html)
        self.assertNotIn('href="/case-studies.html"',html)
    rel=(ROOT/'assets/lkm-v3/phase22-related-work.js').read_text()
    self.assertIn('`/portfolio.html#/story/${encodeURIComponent(project.slug)}`',rel)
    self.assertNotIn('`/case-studies.html#/',rel)
  def test_admin_preview_points_into_portfolio(self):
    admin=(ROOT/'admin-case-studies.html').read_text()
    self.assertIn('href="/portfolio.html#/stories"',admin)
    editor=(ROOT/'assets/lkm-v3/case-studies-admin.mjs').read_text()
    self.assertIn("preview.href='/portfolio.html#/story/'+encodeURIComponent(g.slug)",editor)
  def test_public_only_and_no_mutation_of_payment_or_client_data(self):
    script=(ROOT/'assets/lkm-v3/portfolio-stories.mjs').read_text()
    self.assertIn('is_published=eq.true',script)
    self.assertIn('visibility=eq.public',script)
    self.assertNotIn("method:'POST'",script)
    self.assertNotIn('/api/checkout',script)
    self.assertIn('youtube-nocookie.com',script)
    self.assertIn('data-lkm-ps-play',script)
  def test_shared_helper_still_relative_import(self):
    js=(ROOT/'assets/lkm-v3/portfolio-stories.mjs').read_text()
    self.assertIn("from './case-studies-data.mjs'",js)
  def test_no_languages_and_no_new_sql(self):
    self.assertFalse((ROOT/'supabase').exists())
    self.assertNotIn('hreflang', (ROOT/'portfolio.html').read_text())

if __name__=='__main__':unittest.main(verbosity=2)
