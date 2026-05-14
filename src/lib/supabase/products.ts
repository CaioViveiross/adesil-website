import { supabase } from "@/lib/supabaseClient";
import type { Product } from "@/types/supabase";

// ==================== PRODUCTS ====================

export async function getProducts(limit = 50, offset = 0) {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      categories (
        id,
        name
      )
    `)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
}

export async function getProductById(id: string) {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      categories (
        id,
        name
      )
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getProductsByCategory(categoryId: number) {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      categories (
        id,
        name
      )
    `)
    .eq("category", categoryId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
