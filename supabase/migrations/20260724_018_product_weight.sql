-- ============================================================
-- Migration: 018 — Product Weight
-- Changes:
--   - Add products.weight_grams for per-product shipping weight
--     used in individual/aggregate Correios freight calculation.
--   - Column is nullable: when null/0, shipping falls back to the
--     global "correios_weight_grams" setting (per-unit) so existing
--     products keep working until an admin sets an explicit weight.
-- ============================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS weight_grams integer;

ALTER TABLE public.products
  ADD CONSTRAINT products_weight_non_negative
  CHECK (weight_grams IS NULL OR weight_grams >= 0);
