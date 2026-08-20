-- ============================================================
-- Migration: 019 — Product Description Sections
-- Changes:
--   - Add products.description_sections (jsonb) holding the
--     structured product description that follows the store's
--     "Padrão de descrição do produto".
--   - products.description is kept as-is and continues to hold the
--     short presentation text ("Descrição"), which is also what
--     feeds SEO metadata and the Product JSON-LD. Existing products
--     keep working with description_sections = NULL.
--
-- Shape (all keys optional):
--   {
--     "benefits":         ["string", ...],
--     "specs":            [{ "label": "string", "value": "string" }, ...],
--     "package_contents": ["string", ...],
--     "compatibility":    ["string", ...],
--     "usage":            ["string", ...],
--     "differentials":    ["string", ...],
--     "faq":              [{ "question": "string", "answer": "string" }, ...],
--     "important":        "string"
--   }
-- ============================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS description_sections jsonb;

-- Guard against arrays/strings being written into the column: the
-- renderer always reads named keys off an object.
ALTER TABLE public.products
  ADD CONSTRAINT products_description_sections_is_object
  CHECK (
    description_sections IS NULL
    OR jsonb_typeof(description_sections) = 'object'
  );

COMMENT ON COLUMN public.products.description_sections IS
  'Descrição estruturada do produto (padrão da loja). Chaves: benefits, specs, package_contents, compatibility, usage, differentials, faq, important.';
