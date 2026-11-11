from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
SQL=(ROOT/'supabase/migrations/20261111_lkm_portfolio_studio.sql').read_text()
APP=(ROOT/'assets/lkm-v3/studio.mjs').read_text()
VIS=(ROOT/'assets/lkm-v3/studio-portfolio-visibility.js').read_text()

def test_new_sql_is_additive():
 assert 'BEGIN;' in SQL and 'COMMIT;' in SQL
 assert 'ADD COLUMN IF NOT EXISTS show_in_portfolio' in SQL
 assert "SET portfolio_kind='project'" in SQL
 assert 'CREATE TABLE IF NOT EXISTS public.lkm_studio_assets' in SQL
 assert 'CREATE TABLE IF NOT EXISTS public.lkm_studio_placements' in SQL
 assert 'ALTER TABLE public.lkm_studio_assets ENABLE ROW LEVEL SECURITY' in SQL
 assert 'SECURITY DEFINER' in SQL and 'lkm_is_admin()' in SQL
 assert 'CREATE TRIGGER lkm_studio_sync_photos' in SQL
 assert 'CREATE TRIGGER lkm_studio_sync_videos' in SQL
 assert 'CREATE TRIGGER lkm_studio_sync_service_photos' in SQL
 assert 'DELETE FROM public.' not in SQL.upper()  # never delete source data
 assert 'DROP TABLE' not in SQL.upper()

def test_studio_uses_protected_existing_permissions():
 assert '/auth/v1' not in APP  # uses original LKMStore identity
 assert 'store.authenticatedToken()' in APP
 assert 'store.isAdmin()' in APP
 assert 'lkm_studio_register_asset' in APP
 assert 'lkm_studio_assign' in APP
 assert 'portfolio_galleries' in APP and 'lkm_case_studies' in APP
 assert "'/api/media-catalog'" in APP
 assert 'stripe' not in APP.lower().replace('no stripe','').replace('stripe refunds','').replace('stripe/refunds','') or 'fetch(\'/api/checkout\'' not in APP

def test_portfolio_card_hidden_only_from_index():
 assert 'show_in_portfolio=eq.false' in VIS
 assert 'cms-pub-card[href^=' in VIS
 assert 'direct gallery' in VIS.lower()
 assert 'portfolio.html' in (ROOT/'portfolio.html').read_text() or 'portfolio-stories' in (ROOT/'portfolio.html').read_text()

def test_one_new_sql_and_existing_admin_links():
 migrations=list((ROOT/'supabase/migrations').glob('*.sql'))
 assert len(migrations)==1
 assert 'admin-studio.html' in (ROOT/'admin.html').read_text()
 assert 'studio.mjs' in (ROOT/'admin-studio.html').read_text()
 assert 'studio-portfolio-visibility.js' in (ROOT/'portfolio.html').read_text()

if __name__=='__main__':
 for item in [test_new_sql_is_additive,test_studio_uses_protected_existing_permissions,test_portfolio_card_hidden_only_from_index,test_one_new_sql_and_existing_admin_links]:
  item();print('PASS',item.__name__)
