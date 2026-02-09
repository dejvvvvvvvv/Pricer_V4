-- ============================================================
-- ModelPricer V3 — Supabase Storage Bucket RLS Policies
-- ============================================================
-- Run this after creating the 3 buckets manually:
--   1. models (private)
--   2. documents (private)
--   3. branding (public)
-- ============================================================

-- ============================================================
-- BUCKET: models (private — 3D model files)
-- ============================================================

-- Allow authenticated and anon to upload files to models bucket
CREATE POLICY "models_insert_anon"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'models'
);

-- Allow reading own files
CREATE POLICY "models_select_anon"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'models'
);

-- Allow updating own files
CREATE POLICY "models_update_anon"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'models'
);

-- Allow deleting own files
CREATE POLICY "models_delete_anon"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'models'
);

-- ============================================================
-- BUCKET: documents (private — PDFs, invoices, etc.)
-- ============================================================

CREATE POLICY "documents_insert_anon"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
);

CREATE POLICY "documents_select_anon"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
);

CREATE POLICY "documents_update_anon"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents'
);

CREATE POLICY "documents_delete_anon"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents'
);

-- ============================================================
-- BUCKET: branding (public — logos, favicons)
-- ============================================================

-- Public read for branding assets (logos visible on widgets)
CREATE POLICY "branding_select_public"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'branding'
);

-- Upload allowed
CREATE POLICY "branding_insert_anon"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'branding'
);

-- Update allowed
CREATE POLICY "branding_update_anon"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'branding'
);

-- Delete allowed
CREATE POLICY "branding_delete_anon"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'branding'
);
