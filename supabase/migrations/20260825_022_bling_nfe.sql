-- ============================================================
-- Migration: 022 — Bling NF-e integration
-- Changes:
--   - orders: columns to track the Bling NF-e emitted for the order
--     (id/número/situação/chave de acesso/erro/timestamp), plus
--     shipping_neighborhood (bairro) — required by Bling's NFe
--     contato.endereco.bairro but never captured by checkout before.
--   - profiles: same shipping_neighborhood, so it's saved/reused like
--     the other shipping_* fields.
--   - products: optional ncm (classificação fiscal) override; when
--     null, NFe emission falls back to the "bling_ncm_padrao" setting.
-- ============================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_neighborhood text,
  ADD COLUMN IF NOT EXISTS bling_nfe_id           bigint,
  ADD COLUMN IF NOT EXISTS bling_nfe_situacao     smallint,
  ADD COLUMN IF NOT EXISTS bling_nfe_numero       text,
  ADD COLUMN IF NOT EXISTS bling_nfe_chave_acesso text,
  ADD COLUMN IF NOT EXISTS bling_nfe_link_danfe   text,
  ADD COLUMN IF NOT EXISTS bling_nfe_error        text,
  ADD COLUMN IF NOT EXISTS bling_nfe_emitted_at   timestamptz;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS shipping_neighborhood text;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS ncm text;
