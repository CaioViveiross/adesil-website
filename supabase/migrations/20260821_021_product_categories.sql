-- ============================================================
-- Migration: 021 — Product Categories (muitos-para-muitos)
-- Changes:
--   - New junction table public.product_categories: um produto
--     pode pertencer a varias categorias.
--   - products.category_id e MANTIDO como categoria principal:
--     define o breadcrumb e a URL canonica da pagina do produto,
--     que precisam ser deterministicos. O admin grava as duas
--     coisas, mantendo category_id = primeira categoria marcada.
--   - Backfill: cada produto com category_id vira uma linha aqui.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.product_categories (
  product_id  bigint      NOT NULL REFERENCES public.products(id)   ON DELETE CASCADE,
  category_id bigint      NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, category_id)
);

-- A PK ja cobre buscas por produto; este indice serve o caminho inverso
-- (listar produtos de uma categoria), que e o da vitrine.
CREATE INDEX IF NOT EXISTS product_categories_category_id_idx
  ON public.product_categories (category_id);

INSERT INTO public.product_categories (product_id, category_id)
SELECT id, category_id
FROM public.products
WHERE category_id IS NOT NULL
ON CONFLICT DO NOTHING;

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- Espelha as politicas de products/categories: leitura publica so do que
-- esta publicado nas duas pontas; escrita apenas para admin.
CREATE POLICY product_categories_select_public ON public.product_categories
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id AND p.is_active AND p.deleted_at IS NULL
    )
    AND EXISTS (
      SELECT 1 FROM public.categories c
      WHERE c.id = category_id AND c.is_active AND c.deleted_at IS NULL
    )
  );

CREATE POLICY product_categories_select_admin ON public.product_categories
  FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY product_categories_insert_admin ON public.product_categories
  FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY product_categories_delete_admin ON public.product_categories
  FOR DELETE TO authenticated USING (is_admin());

GRANT SELECT ON public.product_categories TO anon, authenticated;
GRANT INSERT, DELETE ON public.product_categories TO authenticated;
GRANT ALL ON public.product_categories TO service_role;

COMMENT ON TABLE public.product_categories IS
  'Relacao muitos-para-muitos entre produtos e categorias. products.category_id segue como categoria principal (breadcrumb e URL canonica).';
