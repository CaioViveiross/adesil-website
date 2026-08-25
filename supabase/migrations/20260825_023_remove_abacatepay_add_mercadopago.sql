-- ============================================================
-- Migration: 023 — Remove AbacatePay remnants, add Mercado Pago
-- Context: AbacatePay was replaced by Mercado Pago (lib/mercadoPago.ts).
-- The webhook has been inserting provider: 'mercadopago' into
-- payment_attempts since the switch, but that value was never added
-- to the payment_provider enum — every insert has been silently
-- failing (caught as non-fatal in the webhook route).
-- Changes:
--   - Add 'mercadopago' to payment_provider so the webhook's
--     payment_attempts insert actually succeeds.
--   - Flip payment_attempts.provider default to 'mercadopago'.
--   - Drop products.abacatepay_product_id (dead column — no code
--     references it anymore).
-- NOTE: Postgres does not support dropping enum values, so the
-- unused 'abacatepay'/'stripe'/'pagseguro' labels stay in
-- payment_provider — they're harmless leftovers, never referenced
-- by application code anymore.
-- ============================================================

ALTER TYPE public.payment_provider ADD VALUE IF NOT EXISTS 'mercadopago';

ALTER TABLE public.payment_attempts
  ALTER COLUMN provider SET DEFAULT 'mercadopago';

ALTER TABLE public.products
  DROP COLUMN IF EXISTS abacatepay_product_id;
