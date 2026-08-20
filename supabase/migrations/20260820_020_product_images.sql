-- ============================================================
-- Migration: 020 — Product Images (galeria)
-- Changes:
--   - Add products.images (text[]) with the product gallery,
--     limited to 4 URLs. The first entry is the cover.
--   - products.image is kept and continues to hold the cover, so
--     cards, cart, OpenGraph and Product JSON-LD keep working
--     untouched. The admin writes both, keeping images[1] = image.
--   - Backfill: existing products get their current image as the
--     single gallery entry.
-- ============================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS images text[];

-- array_length devolve NULL para array vazio, entao o CHECK aceita
-- NULL, '{}' e ate 4 itens.
ALTER TABLE public.products
  ADD CONSTRAINT products_images_max_4
  CHECK (images IS NULL OR array_length(images, 1) <= 4);

UPDATE public.products
SET images = ARRAY[image]
WHERE images IS NULL
  AND image IS NOT NULL
  AND image <> '';

COMMENT ON COLUMN public.products.images IS
  'Galeria do produto (max 4 URLs). O primeiro item e a capa e espelha products.image.';
