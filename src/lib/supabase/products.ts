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

export async function createProduct(product: Omit<Product, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("products")
    .insert(product)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProduct(id: string, updates: Partial<Product>) {
  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}