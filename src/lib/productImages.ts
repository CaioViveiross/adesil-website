import type { Product } from "@/types/supabase";

/** Teto de imagens por produto, validado também por CHECK no banco. */
export const MAX_PRODUCT_IMAGES = 4;

/**
 * Galeria normalizada do produto.
 *
 * `images` é a fonte de verdade, mas produtos anteriores à migration 020 — ou
 * gravados por outra via — podem ter só `image`. O fallback evita uma página
 * sem foto nenhuma nesses casos.
 */
export function galleryImages(
  product: Pick<Product, "image" | "images">
): string[] {
  const gallery = (product.images ?? [])
    .filter((url): url is string => typeof url === "string" && url.trim().length > 0);

  if (gallery.length > 0) return gallery.slice(0, MAX_PRODUCT_IMAGES);

  return product.image ? [product.image] : [];
}
