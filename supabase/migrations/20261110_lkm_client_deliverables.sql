-- LilKangooMedia Phase 24.3 — PRIVATE client deliverables.
-- THIS IS THE ONLY NEW SQL TO RUN FOR PHASE 24.3.
-- Run ONCE after Phase 24.1 client portal + Phase 24.2 client projects migrations.
-- No earlier SQL is changed; no writes to bookings, quotes, Stripe, payments or refunds.
-- This creates a private Storage bucket plus metadata. Clients receive access only
-- after an email-verified login, an active per-lead grant, and BOTH publication switches.
BEGIN;

INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES (
 'lkm-client-deliverables','lkm-client-deliverables',false,52428800,
 ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif',
       'video/mp4','video/quicktime','application/pdf','application/zip','application/x-zip-compressed']::text[]
)
ON CONFLICT(id) DO UPDATE SET
 public=false,
 file_size_limit=EXCLUDED.file_size_limit,
 allowed_mime_types=EXCLUDED.allowed_mime_types;

CREATE TABLE IF NOT EXISTS public.lkm_client_deliverables (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 project_id uuid NOT NULL REFERENCES public.lkm_client_projects(id) ON DELETE RESTRICT,
 delivery_mode text NOT NULL CHECK (delivery_mode IN ('storage','link')),
 media_type text NOT NULL CHECK (media_type IN ('photo','video','document','archive')),
 title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 2 AND 150),
 description text NOT NULL DEFAULT '' CHECK (char_length(description)<=900),
 filename text NOT NULL CHECK (char_length(filename) BETWEEN 1 AND 200 AND filename !~ '[/\\<>]'),
 mime_type text NOT NULL DEFAULT '' CHECK (char_length(mime_type)<=100),
 size_bytes bigint NOT NULL DEFAULT 0 CHECK (size_bytes BETWEEN 0 AND 52428800),
 storage_path text UNIQUE,
 external_url text,
 client_visible boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 uploaded_by uuid DEFAULT auth.uid(),
 CONSTRAINT lkm_deliverable_mode CHECK (
  (delivery_mode='storage' AND storage_path IS NOT NULL AND external_url IS NULL AND size_bytes>0)
  OR
  (delivery_mode='link' AND external_url IS NOT NULL AND storage_path IS NULL AND size_bytes=0)
 )
);
CREATE INDEX IF NOT EXISTS lkm_deliverables_project_idx
 ON public.lkm_client_deliverables(project_id,created_at DESC);
CREATE INDEX IF NOT EXISTS lkm_deliverables_published_idx
 ON public.lkm_client_deliverables(project_id) WHERE client_visible=true;
ALTER TABLE public.lkm_client_deliverables ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lkm_client_deliverables FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.lkm_client_deliverables TO authenticated;
DROP POLICY IF EXISTS "lkm deliverables admin only" ON public.lkm_client_deliverables;
CREATE POLICY "lkm deliverables admin only" ON public.lkm_client_deliverables
 FOR ALL TO authenticated USING (public.lkm_is_admin()) WITH CHECK (public.lkm_is_admin());

CREATE OR REPLACE FUNCTION public.lkm_deliverable_guard()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_project_id text;
BEGIN
 IF auth.uid() IS NULL OR NOT public.lkm_is_admin() THEN
  RAISE EXCEPTION 'Administrator required.' USING ERRCODE='42501';
 END IF;
 IF NEW.delivery_mode='storage' THEN
  v_project_id:=NEW.project_id::text;
  -- New random object paths: <project UUID>/<file UUID>.<allowed-extension>.
  -- The path never contains a customer name or original filename.
  IF NEW.storage_path IS NULL OR NEW.storage_path !~
   '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|heic|heif|mp4|mov|pdf|zip)$'
    OR split_part(NEW.storage_path,'/',1) IS DISTINCT FROM v_project_id THEN
   RAISE EXCEPTION 'Invalid private file path.' USING ERRCODE='23514';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.objects so
     WHERE so.bucket_id='lkm-client-deliverables' AND so.name=NEW.storage_path) THEN
    RAISE EXCEPTION 'The private file must be uploaded before its record is saved.' USING ERRCODE='23514';
  END IF;
 ELSE
  IF NEW.external_url IS NULL OR char_length(NEW.external_url)>2000
     OR NEW.external_url !~ '^https://[^[:space:]<>"'']+$' THEN
   RAISE EXCEPTION 'External links must be valid HTTPS URLs.' USING ERRCODE='23514';
  END IF;
 END IF;
 NEW.updated_at:=now();
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS lkm_deliverable_guard_trg ON public.lkm_client_deliverables;
CREATE TRIGGER lkm_deliverable_guard_trg
 BEFORE INSERT OR UPDATE ON public.lkm_client_deliverables
 FOR EACH ROW EXECUTE FUNCTION public.lkm_deliverable_guard();

-- Even if someone knows a random storage path, private file download still
-- requires a verified email belonging to an explicitly granted enquiry.
CREATE OR REPLACE FUNCTION public.lkm_client_can_fetch_file(p_path text)
 RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_email text;
BEGIN
 IF auth.uid() IS NULL OR coalesce(auth.jwt()->>'is_anonymous','false')='true' THEN RETURN false; END IF;
 v_email:=lower(btrim(coalesce(auth.jwt()->>'email','')));
 IF char_length(v_email)<5 OR NOT EXISTS (
   SELECT 1 FROM auth.users au WHERE au.id=auth.uid()
     AND lower(btrim(au.email))=v_email AND au.email_confirmed_at IS NOT NULL
 ) THEN RETURN false; END IF;
 RETURN EXISTS (
  SELECT 1 FROM public.lkm_client_deliverables d
  JOIN public.lkm_client_projects p ON p.id=d.project_id
  JOIN public.contact_leads l ON l.id=p.lead_id
  JOIN public.lkm_client_grants g ON g.lead_id=l.id
  WHERE d.storage_path=p_path AND d.delivery_mode='storage' AND d.client_visible=true
    AND p.client_visible=true AND l.archived_at IS NULL
    AND g.active=true AND g.client_email=v_email
    AND lower(btrim(l.customer_email))=v_email
 );
END; $$;
REVOKE ALL ON FUNCTION public.lkm_client_can_fetch_file(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lkm_client_can_fetch_file(text) TO authenticated;

-- Storage is private: admins manage all objects, clients may ONLY read files
-- which the function above authorizes at the moment of download.
-- Do not grant public/anon SELECT. Do not create public URLs for this bucket.
DROP POLICY IF EXISTS "lkm private files admin upload" ON storage.objects;
CREATE POLICY "lkm private files admin upload" ON storage.objects
 FOR INSERT TO authenticated WITH CHECK (
   bucket_id='lkm-client-deliverables' AND public.lkm_is_admin()
   AND name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|heic|heif|mp4|mov|pdf|zip)$'
 );
DROP POLICY IF EXISTS "lkm private files admin or client read" ON storage.objects;
CREATE POLICY "lkm private files admin or client read" ON storage.objects
 FOR SELECT TO authenticated USING (
   bucket_id='lkm-client-deliverables'
   AND (public.lkm_is_admin() OR public.lkm_client_can_fetch_file(name))
 );
DROP POLICY IF EXISTS "lkm private files admin delete" ON storage.objects;
CREATE POLICY "lkm private files admin delete" ON storage.objects
 FOR DELETE TO authenticated USING (
  bucket_id='lkm-client-deliverables' AND public.lkm_is_admin()
 );

-- Clients cannot SELECT the metadata table, but may list explicitly published
-- metadata through this small read-only RPC, with the same security rules.
CREATE OR REPLACE FUNCTION public.lkm_client_deliverables_list()
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_email text;v_items jsonb;
BEGIN
 IF auth.uid() IS NULL OR coalesce(auth.jwt()->>'is_anonymous','false')='true' THEN
  RAISE EXCEPTION 'Verified sign-in required.' USING ERRCODE='42501';
 END IF;
 v_email:=lower(btrim(coalesce(auth.jwt()->>'email','')));
 IF char_length(v_email)<5 OR NOT EXISTS (
   SELECT 1 FROM auth.users au WHERE au.id=auth.uid()
     AND lower(btrim(au.email))=v_email AND au.email_confirmed_at IS NOT NULL
 ) THEN RAISE EXCEPTION 'Verified email required.' USING ERRCODE='42501'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object(
  'id',d.id,'project_id',p.id,'project_title',p.title,
  'title',d.title,'description',d.description,'media_type',d.media_type,
  'delivery_mode',d.delivery_mode,'filename',d.filename,
  'mime_type',d.mime_type,'size_bytes',d.size_bytes,
  'storage_path',CASE WHEN d.delivery_mode='storage' THEN d.storage_path ELSE NULL END,
  'external_url',CASE WHEN d.delivery_mode='link' THEN d.external_url ELSE NULL END,
  'created_at',d.created_at
 ) ORDER BY p.title,d.created_at DESC),'[]'::jsonb)
 INTO v_items
 FROM public.lkm_client_deliverables d
 JOIN public.lkm_client_projects p ON p.id=d.project_id
 JOIN public.contact_leads l ON l.id=p.lead_id
 JOIN public.lkm_client_grants g ON g.lead_id=l.id
 WHERE d.client_visible=true AND p.client_visible=true AND l.archived_at IS NULL
   AND g.active=true AND g.client_email=v_email
   AND lower(btrim(l.customer_email))=v_email;
 RETURN jsonb_build_object('ok',true,'files',v_items);
END; $$;
REVOKE ALL ON FUNCTION public.lkm_client_deliverables_list() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lkm_client_deliverables_list() TO authenticated;
COMMIT;
