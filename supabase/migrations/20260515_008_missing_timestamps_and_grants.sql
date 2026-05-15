-- ============================================================
-- Migration: 008 — Missing Timestamps & Grants
-- Adds updated_at to contact_messages, fixes grants for
-- new tables and renamed sequences.
-- ============================================================

-- ------------------------------------------------------------
-- contact_messages: add updated_at
-- (read-only data after insert, but useful for admin corrections)
-- ------------------------------------------------------------

ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS contact_messages_updated_at ON public.contact_messages;

CREATE TRIGGER contact_messages_updated_at
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------
-- Grants: ensure new table and sequences are accessible
-- ------------------------------------------------------------

-- order_items already granted in migration 006.
-- Ensure categories/products grants cover new columns.
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.products   TO anon;

-- Re-grant sequences after any IDENTITY column additions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ------------------------------------------------------------
-- Admin: add explicit contact_messages read grant
-- (anon has INSERT from initial migration; admin needs SELECT)
-- ------------------------------------------------------------

GRANT SELECT, UPDATE, DELETE ON public.contact_messages TO authenticated;
