-- ============================================================
-- Migration: 001 — Fix Critical Security
-- Priority: DEPLOY IMMEDIATELY
-- ============================================================
-- Remove the dangerous policy that exposes all orders to any
-- authenticated user, and rebuild orders RLS from scratch.
-- Also removes redundant/conflicting admin policies on orders.
-- ============================================================

-- ------------------------------------------------------------
-- DROP all existing orders policies (7 overlapping, some insecure)
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "auth_read_orders"            ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can select own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can delete own orders" ON public.orders;
DROP POLICY IF EXISTS "admin_select_orders"         ON public.orders;
DROP POLICY IF EXISTS "admin_update_orders"         ON public.orders;
DROP POLICY IF EXISTS "admin_delete_orders"         ON public.orders;
DROP POLICY IF EXISTS "Admin can select all orders" ON public.orders;
DROP POLICY IF EXISTS "Admin can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Admin can delete all orders" ON public.orders;

-- ------------------------------------------------------------
-- Rebuild orders policies — clean, minimal, auditable
-- ------------------------------------------------------------

-- Users see only their own orders; admins see all.
CREATE POLICY orders_select
  ON public.orders
  FOR SELECT TO authenticated
  USING (
    customer_id = auth.uid()
    OR public.is_admin()
  );

-- Users can only create orders for themselves.
CREATE POLICY orders_insert
  ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());

-- Only admins can update orders (status changes, corrections).
-- Users should not be able to cancel or modify their own orders directly.
CREATE POLICY orders_update
  ON public.orders
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Only admins can delete orders.
CREATE POLICY orders_delete
  ON public.orders
  FOR DELETE TO authenticated
  USING (public.is_admin());
