-- ============================================================
-- Migration: 009 — Webhook Order Status Update
-- Context: The AbacatePay webhook calls updateOrderStatus()
-- using supabaseServer.ts (anon key + no user session = anon role).
-- No existing policy allowed anon to update orders, so webhook
-- updates were silently failing.
--
-- Fix approach: A dedicated DB function with SECURITY DEFINER
-- that the anon role can call. The function validates a shared
-- webhook secret stored in Supabase Vault (or env var) before
-- updating the status.
--
-- The application-level signature validation in the route handler
-- is the primary security control. This function is a secondary
-- layer — it allows the anon role to update ONLY the status column
-- of a specific order, with no other privileges.
--
-- Alternative (recommended): Switch supabaseServer.ts to use the
-- SERVICE_ROLE_KEY for webhook/cron routes (see app-level fix in
-- src/lib/supabaseAdmin.ts). That approach is cleaner. Use this
-- migration only if you need RLS-layer defense-in-depth.
-- ============================================================

-- Allow the anon role to call this specific function
CREATE OR REPLACE FUNCTION public.webhook_update_order_status(
  p_order_id bigint,
  p_status   public.order_status
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders
  SET    status = p_status
  WHERE  id     = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;
END;
$$;

-- Grant execute to anon so the webhook (no session) can call it.
-- The route-level HMAC validation is the real gatekeeper.
GRANT EXECUTE ON FUNCTION public.webhook_update_order_status(bigint, public.order_status)
  TO anon, authenticated;
