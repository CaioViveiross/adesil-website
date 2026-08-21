import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabaseServer";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://adesilprint.com.br";

export const revalidate = 3600; // revalida a cada hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    // Só produtos publicados: a página do produto filtra `is_active`, então
    // sem isto o sitemap entregava ao Google URLs que respondem 404.
    supabase
      .from("products")
      .select("id, updated_at")
      .is("deleted_at", null)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("slug, updated_at"),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${APP_URL}/sobre`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${APP_URL}/contato`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${APP_URL}/categoria/todos`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = (categories ?? []).map((cat) => ({
    url: `${APP_URL}/categoria/${cat.slug}`,
    lastModified: cat.updated_at ? new Date(cat.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const productRoutes: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${APP_URL}/produto/${p.id}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
