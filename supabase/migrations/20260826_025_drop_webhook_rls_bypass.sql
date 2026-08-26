-- ============================================================
-- Migration: 025 — Remove a função webhook_update_order_status
-- Contexto: criada na 009, quando o webhook da AbacatePay usava o
-- client anon e não conseguia atualizar `orders` por causa da RLS.
-- A saída na época foi uma função SECURITY DEFINER com EXECUTE
-- concedido a anon/authenticated.
--
-- Hoje o webhook usa `createAdminClient()` (service role), que é
-- exatamente a alternativa que a própria 009 recomendava — a função
-- ficou sem nenhum uso no código.
--
-- E o que sobrou é um buraco: ela é publicada pelo PostgREST em
-- /rest/v1/rpc/webhook_update_order_status e a chave anon está no
-- bundle do navegador. Qualquer pessoa podia marcar qualquer pedido
-- como `processing` (pago) sem pagar nada, ou mexer no status de
-- pedidos de terceiros. A validação HMAC da rota não protege isso:
-- a chamada nem passa pela aplicação.
-- ============================================================

DROP FUNCTION IF EXISTS public.webhook_update_order_status(bigint, public.order_status);
