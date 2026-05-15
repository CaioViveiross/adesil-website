-- ============================================================
-- Migration: 003 — Alter Categories
-- Adds: slug, is_active, deleted_at, created_at, updated_at
-- ============================================================

-- ------------------------------------------------------------
-- Add missing columns
-- ------------------------------------------------------------

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS slug        text,
  ADD COLUMN IF NOT EXISTS is_active   boolean     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at  timestamptz,
  ADD COLUMN IF NOT EXISTS created_at  timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at  timestamptz NOT NULL DEFAULT now();

-- ------------------------------------------------------------
-- Populate slug from existing names
-- Converts to lowercase, replaces spaces/special chars with hyphens.
-- Review manually if names have special characters.
-- ------------------------------------------------------------

UPDATE public.categories
SET slug = lower(
  regexp_replace(
    regexp_replace(unaccent(name), '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  )
)
WHERE slug IS NULL;

-- Handle duplicate slugs by appending the ID
UPDATE public.categories c1
SET slug = slug || '-' || id
WHERE EXISTS (
  SELECT 1 FROM public.categories c2
  WHERE c2.slug = c1.slug AND c2.id < c1.id
);

-- Make slug NOT NULL and UNIQUE after backfill
ALTER TABLE public.categories
  ALTER COLUMN slug SET NOT NULL,
  ADD CONSTRAINT categories_slug_unique UNIQUE (slug);

-- ------------------------------------------------------------
-- Trigger: auto-update updated_at
-- ------------------------------------------------------------

DROP TRIGGER IF EXISTS categories_updated_at ON public.categories;

CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------
-- Index: slug lookup (used in URL routing)
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories (slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories (is_active) WHERE deleted_at IS NULL;

-- ------------------------------------------------------------
-- Update public READ policy to exclude soft-deleted / inactive
-- (Admins bypass via is_admin() — covered in migration 007)
-- ------------------------------------------------------------

DROP POLICY IF EXISTS public_read_categories ON public.categories;

CREATE POLICY categories_select_public
  ON public.categories
  FOR SELECT TO anon, authenticated
  USING (is_active = true AND deleted_at IS NULL);
