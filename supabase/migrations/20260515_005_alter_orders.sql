-- ============================================================
-- Migration: 005 — Alter Orders
-- Changes:
--   - Rename "customer" → "customer_name" (semantic clarity;
--     "customer" was ambiguous with customer_id FK)
--   - Fix numeric precision to numeric(12,2) for financial fields
--   - Add updated_at with trigger
--   - Add CHECK constraints for financial integrity
--   - Rename "date" → "ordered_at" (date → timestamptz, more precise)
--   - Fix index: customer_id FK was missing index
-- NOTE: "items_detail" jsonb column is kept for backwards
--       compatibility. After migrating app code to use order_items
--       (migration 006), drop it with:
--         ALTER TABLE orders DROP COLUMN items_detail;
-- ============================================================

-- ------------------------------------------------------------
-- 1. Rename ambiguous columns
-- ------------------------------------------------------------

-- "customer" (text) was a denormalized name. Rename for clarity.
-- billing_name already exists and overlaps — keep both for now;
-- billing_name is the invoice name, customer_name is the account name.
ALTER TABLE public.orders RENAME COLUMN customer TO customer_name;

-- "date" is a PostgreSQL reserved-adjacent keyword and stored as `date`
-- type (no time component). Upgrade to timestamptz for precision.
ALTER TABLE public.orders RENAME COLUMN date TO ordered_at;
ALTER TABLE public.orders ALTER COLUMN ordered_at TYPE timestamptz
  USING ordered_at::timestamptz;

-- ------------------------------------------------------------
-- 2. Fix numeric precision (financial fields)
-- ------------------------------------------------------------

ALTER TABLE public.orders
  ALTER COLUMN total         TYPE numeric(12,2),
  ALTER COLUMN shipping_cost TYPE numeric(12,2);

-- ------------------------------------------------------------
-- 3. Add updated_at
-- ------------------------------------------------------------

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------
-- 4. CHECK constraints (financial integrity)
-- ------------------------------------------------------------

ALTER TABLE public.orders
  ADD CONSTRAINT orders_total_non_negative         CHECK (total >= 0),
  ADD CONSTRAINT orders_shipping_cost_non_negative CHECK (shipping_cost IS NULL OR shipping_cost >= 0),
  ADD CONSTRAINT orders_items_positive             CHECK (items > 0);

-- ------------------------------------------------------------
-- 5. Indexes (missing FK index was causing sequential scans)
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_orders_customer_id
  ON public.orders (customer_id);

-- Replace date index with new column name
DROP INDEX IF EXISTS idx_orders_date;
CREATE INDEX IF NOT EXISTS idx_orders_ordered_at
  ON public.orders (ordered_at DESC);

-- Composite: status + ordered_at for admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_orders_status_ordered_at
  ON public.orders (status, ordered_at DESC);

-- Customer orders listing (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_orders_customer_id_ordered_at
  ON public.orders (customer_id, ordered_at DESC);
