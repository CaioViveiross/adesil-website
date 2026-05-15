-- ============================================================
-- Migration: 002 — Fix Functions
-- Fixes SECURITY DEFINER functions missing SET search_path,
-- which is a search_path hijacking vector.
-- ============================================================

-- ------------------------------------------------------------
-- is_admin() — add SET search_path
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id   = auth.uid()
      AND role = 'admin'
  );
$$;

-- ------------------------------------------------------------
-- set_updated_at() — add SET search_path
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------
-- handle_new_user() — already has SET search_path, re-declare
-- for completeness and to keep all functions consistent
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Re-grant execute after replace
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
