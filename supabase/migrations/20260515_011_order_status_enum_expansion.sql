-- ============================================================
-- Migration: 011 — Expand order_status enum
-- Adds: failed, refunded, cancelled
-- ============================================================

ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'failed';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'refunded';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'cancelled';
