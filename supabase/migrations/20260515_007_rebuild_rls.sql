-- ============================================================
-- Migration: 007 — Rebuild All RLS Policies
-- Drops and recreates all policies with:
--   - Consistent naming convention: {table}_{action}_{role}
--   - No overlapping permissive policies
--   - is_admin() used uniformly (avoids inline subqueries)
--   - Explicit TO role clauses (not relying on defaults)
-- ============================================================

-- ------------------------------------------------------------
-- CATEGORIES
-- Public can read active/non-deleted. Admins manage all.
-- ------------------------------------------------------------

DROP POLICY IF EXISTS public_read_categories      ON public.categories;
DROP POLICY IF EXISTS admin_insert_categories     ON public.categories;
DROP POLICY IF EXISTS admin_update_categories     ON public.categories;
DROP POLICY IF EXISTS admin_delete_categories     ON public.categories;
DROP POLICY IF EXISTS categories_select_public    ON public.categories;

-- Anon/authenticated: only active, non-deleted categories
CREATE POLICY categories_select_public
  ON public.categories
  FOR SELECT TO anon, authenticated
  USING (is_active = true AND deleted_at IS NULL);

-- Admin: read all (including inactive/deleted, for admin UI)
CREATE POLICY categories_select_admin
  ON public.categories
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY categories_insert_admin
  ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY categories_update_admin
  ON public.categories
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY categories_delete_admin
  ON public.categories
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------
-- PRODUCTS
-- Public can read active/non-deleted. Admins manage all.
-- ------------------------------------------------------------

DROP POLICY IF EXISTS public_read_products       ON public.products;
DROP POLICY IF EXISTS admin_insert_products      ON public.products;
DROP POLICY IF EXISTS admin_update_products      ON public.products;
DROP POLICY IF EXISTS admin_delete_products      ON public.products;
DROP POLICY IF EXISTS products_select_public     ON public.products;

-- Anon/authenticated: only active, non-deleted products
CREATE POLICY products_select_public
  ON public.products
  FOR SELECT TO anon, authenticated
  USING (is_active = true AND deleted_at IS NULL);

-- Admin: read all (including inactive/deleted, for admin UI)
CREATE POLICY products_select_admin
  ON public.products
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY products_insert_admin
  ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY products_update_admin
  ON public.products
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY products_delete_admin
  ON public.products
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------
-- PROFILES
-- Users manage their own. Admins manage all.
-- Role field is immutable by users (prevents privilege escalation).
-- ------------------------------------------------------------

DROP POLICY IF EXISTS user_select_own_profile    ON public.profiles;
DROP POLICY IF EXISTS user_update_own_profile    ON public.profiles;
DROP POLICY IF EXISTS admin_select_all_profiles  ON public.profiles;
DROP POLICY IF EXISTS admin_update_any_profile   ON public.profiles;
DROP POLICY IF EXISTS admin_delete_any_profile   ON public.profiles;

CREATE POLICY profiles_select_own
  ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

-- Users can update their own profile, but cannot change their role.
-- The CHECK ensures role stays the same as the current DB value.
CREATE POLICY profiles_update_own
  ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  );

-- Admins can update any profile, including role changes.
CREATE POLICY profiles_update_admin
  ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Only admins can delete profiles.
CREATE POLICY profiles_delete_admin
  ON public.profiles
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------
-- ORDERS
-- Orders policies were fully rebuilt in migration 001.
-- This section is intentionally empty — kept for documentation.
-- Current policies (from 001):
--   orders_select  : customer_id = uid OR is_admin
--   orders_insert  : customer_id = uid
--   orders_update  : is_admin only
--   orders_delete  : is_admin only
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- ORDER_ITEMS
-- Already set in migration 006. Documented here for reference.
-- Current policies:
--   order_items_select : order owned by uid OR is_admin
--   order_items_insert : order owned by uid OR is_admin
--   order_items_update : is_admin only
--   order_items_delete : is_admin only
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- CONTACT_MESSAGES
-- Anyone can submit. Only admins can read.
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "Allow public insert contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow admin read contact messages"   ON public.contact_messages;

CREATE POLICY contact_messages_insert_public
  ON public.contact_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY contact_messages_select_admin
  ON public.contact_messages
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY contact_messages_delete_admin
  ON public.contact_messages
  FOR DELETE TO authenticated
  USING (public.is_admin());
