-- ============================================================
-- Migration: 004 — Alter Products
-- Changes:
--   - Rename column "category" → "category_id" (FK naming convention)
--   - Migrate tags from "text" to "text[]" with GIN index
--   - Add sku, stock_quantity, is_active, deleted_at, updated_at
--   - Fix numeric precision to numeric(12,2)
--   - Add CHECK constraints for financial integrity
-- ============================================================

-- ------------------------------------------------------------
-- 1. Rename FK column to follow naming convention
-- ------------------------------------------------------------

ALTER TABLE public.products RENAME COLUMN category TO category_id;

-- ------------------------------------------------------------
-- 2. Migrate tags: text (comma-separated) → text[]
--    Decision rationale: text[] + GIN index supports efficient
--    array containment queries (@>, &&) without join overhead.
--    A relational tags table is deferred until tag-level analytics
--    or a tag management UI is required.
-- ------------------------------------------------------------

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tags_new text[];

UPDATE public.products
SET tags_new = ARRAY(
  SELECT trim(t)
  FROM unnest(string_to_array(tags, ',')) AS t
  WHERE trim(t) != ''
)
WHERE tags IS NOT NULL AND tags != '';

ALTER TABLE public.products DROP COLUMN IF EXISTS tags;
ALTER TABLE public.products RENAME COLUMN tags_new TO tags;

-- ------------------------------------------------------------
-- 3. Add new operational columns
-- ------------------------------------------------------------

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku            text,
  ADD COLUMN IF NOT EXISTS stock_quantity integer     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active      boolean     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at     timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at     timestamptz NOT NULL DEFAULT now();

-- ------------------------------------------------------------
-- 4. Fix numeric precision (financial data requires explicit scale)
-- ------------------------------------------------------------

ALTER TABLE public.products
  ALTER COLUMN price          TYPE numeric(12,2),
  ALTER COLUMN original_price TYPE numeric(12,2);

-- ------------------------------------------------------------
-- 5. Add CHECK constraints (financial integrity)
-- ------------------------------------------------------------

ALTER TABLE public.products
  ADD CONSTRAINT products_price_non_negative          CHECK (price >= 0),
  ADD CONSTRAINT products_original_price_non_negative CHECK (original_price IS NULL OR original_price >= 0),
  ADD CONSTRAINT products_stock_non_negative          CHECK (stock_quantity >= 0);

-- ------------------------------------------------------------
-- 6. Unique constraint on SKU (when provided)
-- ------------------------------------------------------------

ALTER TABLE public.products
  ADD CONSTRAINT products_sku_unique UNIQUE (sku);

-- ------------------------------------------------------------
-- 7. Trigger: auto-update updated_at
-- ------------------------------------------------------------

DROP TRIGGER IF EXISTS products_updated_at ON public.products;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------
-- 8. Indexes
-- ------------------------------------------------------------

-- GIN index for efficient array tag queries:
--   WHERE tags @> ARRAY['ribbon']
--   WHERE tags && ARRAY['adesivo', 'etiqueta']
CREATE INDEX IF NOT EXISTS idx_products_tags
  ON public.products USING GIN (tags);

-- FK index (was missing — causes sequential scan on joins)
DROP INDEX IF EXISTS idx_products_category;
CREATE INDEX IF NOT EXISTS idx_products_category_id
  ON public.products (category_id);

-- Partial index for public-facing product listing (excludes deleted/inactive)
DROP INDEX IF EXISTS idx_products_is_featured_created_at;
CREATE INDEX IF NOT EXISTS idx_products_public_listing
  ON public.products (is_featured, created_at DESC)
  WHERE is_active = true AND deleted_at IS NULL;

-- SKU lookups
CREATE INDEX IF NOT EXISTS idx_products_sku
  ON public.products (sku)
  WHERE sku IS NOT NULL;

-- ------------------------------------------------------------
-- 9. Update public READ policy to exclude soft-deleted/inactive
--    Admin policy rebuilt in migration 007.
-- ------------------------------------------------------------

DROP POLICY IF EXISTS public_read_products ON public.products;

CREATE POLICY products_select_public
  ON public.products
  FOR SELECT TO anon, authenticated
  USING (is_active = true AND deleted_at IS NULL);
