import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import type { BusinessCategory } from "@/types/supabase";

/**
 * Segmentos exibidos na home ("Para o seu negócio"). A lista é curada — nome e
 * imagem são fixos — mas cada um aponta para uma categoria real via `slug`.
 */
const SEGMENTS: BusinessCategory[] = [
  { id: 1, name: "Logística",  slug: "logistica",  image: "/images/category-logistica.png" },
  { id: 2, name: "Comércio",   slug: "comercio",   image: "/images/category-comercio.png"  },
  { id: 3, name: "Hospitalar", slug: "hospitalar", image: "/images/category-hospitalar.png" },
  { id: 4, name: "Indústria",  slug: "industria",  image: "/images/category-industria.png" },
];

// GET /api/business-categories - Segmentos da home
export async function GET() {
  try {
    const supabase = await createClient();

    // Confirma que a categoria existe e está publicada antes de linkar para
    // ela; se alguém excluir ou desativar, o card cai para o catálogo geral
    // em vez de levar a uma página vazia.
    const { data, error } = await supabase
      .from("categories")
      .select("slug")
      .is("deleted_at", null)
      .eq("is_active", true)
      .in("slug", SEGMENTS.map((segment) => segment.slug!));

    if (error) throw error;

    const published = new Set((data ?? []).map((category) => category.slug));

    return NextResponse.json(
      SEGMENTS.map((segment) => ({
        ...segment,
        slug: published.has(segment.slug!) ? segment.slug : null,
      })),
      { headers: { "Cache-Control": "no-store, must-revalidate" } }
    );
  } catch (error) {
    console.error("Error fetching business categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch business categories" },
      { status: 500 }
    );
  }
}

// POST /api/business-categories - Não permitido (segmentos são fixos)
export async function POST() {
  return NextResponse.json(
    { error: "Business categories are fixed and cannot be created" },
    { status: 403 }
  );
}
