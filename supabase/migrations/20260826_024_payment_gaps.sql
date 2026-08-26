-- ============================================================
-- Migration: 024 — Fecha as lacunas do fluxo de pagamento
-- Contexto: auditoria do fluxo checkout → Mercado Pago → webhook.
-- Changes:
--   - orders: guarda o cupom usado e o desconto aplicado. Sem isso não
--     havia como creditar o uso do cupom só quando o pagamento aprova
--     (nem como saber depois qual cupom gerou o desconto).
--   - products.stock_quantity vira NULL = "não controla estoque".
--     Todos os produtos estavam em 0 com NOT NULL DEFAULT 0, então
--     qualquer validação de estoque bloquearia 100% das vendas. Os 0
--     atuais viram NULL (ninguém gerenciava a coluna); a partir daqui
--     preencher um número liga o controle para aquele produto.
--   - payment_attempts: índice único por (provider, external_id) para o
--     webhook poder registrar toda tentativa de forma idempotente —
--     o Mercado Pago reenvia a mesma notificação várias vezes.
--   - increment_coupon_uses / consume_order_stock: incremento e baixa
--     atômicos, chamados pelo webhook quando o pagamento é aprovado.
-- ============================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_code     text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2) NOT NULL DEFAULT 0;

ALTER TABLE public.products
  ALTER COLUMN stock_quantity DROP NOT NULL,
  ALTER COLUMN stock_quantity DROP DEFAULT;

UPDATE public.products SET stock_quantity = NULL WHERE stock_quantity = 0;

-- Índice simples de propósito: um índice parcial não é inferível por
-- ON CONFLICT (provider, external_id), que é o que o upsert do PostgREST
-- emite. NULLs nunca conflitam entre si em índice único no Postgres, então
-- o comportamento é o mesmo.
CREATE UNIQUE INDEX IF NOT EXISTS payment_attempts_provider_external_id_key
  ON public.payment_attempts (provider, external_id);

-- Incremento atômico do contador de usos do cupom (max_uses só vale se
-- alguém contar de fato — antes disso o campo era decorativo).
CREATE OR REPLACE FUNCTION public.increment_coupon_uses(p_code text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.coupons
     SET uses_count = uses_count + 1
   WHERE upper(code) = upper(p_code);
$$;

-- Baixa de estoque dos itens do pedido. Ignora produtos sem controle
-- (stock_quantity NULL) e nunca deixa o saldo negativo.
CREATE OR REPLACE FUNCTION public.consume_order_stock(p_order_id bigint)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.products p
     SET stock_quantity = greatest(p.stock_quantity - agg.qty, 0)
    FROM (
      SELECT product_id, sum(quantity)::int AS qty
        FROM public.order_items
       WHERE order_id = p_order_id
         AND product_id IS NOT NULL
       GROUP BY product_id
    ) agg
   WHERE p.id = agg.product_id
     AND p.stock_quantity IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.increment_coupon_uses(text) FROM public;
REVOKE ALL ON FUNCTION public.consume_order_stock(bigint) FROM public;
GRANT EXECUTE ON FUNCTION public.increment_coupon_uses(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_order_stock(bigint) TO service_role;
