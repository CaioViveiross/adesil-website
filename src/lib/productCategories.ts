import type { createClient } from "@/lib/supabaseServer";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Categorias de um produto vivem em `product_categories` (muitos-para-muitos).
 * `products.category_id` segue existindo como categoria principal — é ela que
 * define o breadcrumb e a URL canônica, que precisam ser deterministicos.
 */

/** IDs dos produtos que pertencem a uma categoria. */
export async function productIdsInCategory(
  supabase: Supabase,
  categoryId: number
): Promise<number[]> {
  const { data, error } = await supabase
    .from("product_categories")
    .select("product_id")
    .eq("category_id", categoryId);

  if (error) throw error;
  return (data ?? []).map((row) => Number(row.product_id));
}

/**
 * Anexa `category_ids` a cada produto numa única consulta, em vez de uma
 * por produto.
 */
export async function attachCategoryIds<T extends { id: string | number }>(
  supabase: Supabase,
  products: T[]
): Promise<(T & { category_ids: number[] })[]> {
  if (products.length === 0) return [];

  const { data, error } = await supabase
    .from("product_categories")
    .select("product_id, category_id")
    .in("product_id", products.map((product) => Number(product.id)));

  if (error) throw error;

  const byProduct = new Map<number, number[]>();
  for (const row of data ?? []) {
    const key = Number(row.product_id);
    if (!byProduct.has(key)) byProduct.set(key, []);
    byProduct.get(key)!.push(Number(row.category_id));
  }

  return products.map((product) => ({
    ...product,
    category_ids: byProduct.get(Number(product.id)) ?? [],
  }));
}

/**
 * Reescreve as categorias de um produto. Apaga e reinsere: a tabela é pequena
 * e isso evita ter que calcular diferenças entre o estado antigo e o novo.
 * Retorna a categoria principal (a primeira da lista) ou null.
 */
export async function replaceProductCategories(
  supabase: Supabase,
  productId: number,
  categoryIds: number[]
): Promise<number | null> {
  const unique = [...new Set(categoryIds.filter((id) => Number.isInteger(id)))];

  const { error: deleteError } = await supabase
    .from("product_categories")
    .delete()
    .eq("product_id", productId);

  if (deleteError) throw deleteError;

  if (unique.length === 0) return null;

  const { error: insertError } = await supabase
    .from("product_categories")
    .insert(unique.map((categoryId) => ({ product_id: productId, category_id: categoryId })));

  if (insertError) throw insertError;

  return unique[0];
}
