-- ============================================================
-- Migration: 017 — Settings table + Order tracking columns
-- ============================================================

-- Settings table for admin-configurable system config
CREATE TABLE IF NOT EXISTS settings (
  key        VARCHAR(255) PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default settings (only insert if not already present)
-- Credentials (username, access_code, postal_card) stay in .env
INSERT INTO settings (key) VALUES
  ('correios_origin_zip'),
  ('correios_weight_grams'),
  ('shipping_free_above'),
  ('banner_text'),
  ('banner_active'),
  ('banner_color')
ON CONFLICT (key) DO NOTHING;

-- RLS: only admins can read/write settings
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage settings"
  ON settings FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Service role full access (for server-side reads without user session)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO service_role;

-- Add tracking columns to orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tracking_code    TEXT,
  ADD COLUMN IF NOT EXISTS tracking_carrier TEXT;
