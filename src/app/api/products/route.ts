import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { syncProductToAbacatePay } from "@/lib/abacatePay";

/**
 * Este endpoint serve a vitrine e o painel admin. Um cache compartilhado
 * (`public, s-maxage`) fazia o admin ver dados velhos depois de criar/editar
 * e a vitrine continuar listando produto recém-excluído — que o checkout
 * então rejeitava. Correção vale mais que os 60s de cache neste catálogo.
 */
const NO_STORE = "no-store, must-revalidate";

/**
 * Só um admin autenticado pode listar produtos inativos. A vitrine nunca
 * deve mostrá-los: a página do produto já filtra `is_active`, então sem este
 * filtro o card aparecia na listagem e o "Comprar" enchia o carrinho com algo
 * que o checkout depois recusava.
 */
async function canSeeInactive(
  supabase: Awaited<ReturnType<typeof createClient>>,
  requested: boolean
) {
  if (!requested) return false;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin";
}

async function getFeaturedProductsCount(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { count, error } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("is_featured", true);

  if (error) throw error;
  return count || 0;
}

// GET /api/products - Listar produtos
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const categoryParam = searchParams.get("category");
    const featuredParam = searchParams.get("featured");
    const searchParam = searchParams.get("search")?.trim() || "";
    const categoryId = categoryParam ? parseInt(categoryParam, 10) : undefined;
    const includeInactive = await canSeeInactive(
      supabase,
      searchParams.get("include_inactive") === "true"
    );

    if (featuredParam === "true") {
      let featuredQuery = supabase
        .from("products")
        .select("*")
        .is("deleted_at", null)
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!includeInactive) featuredQuery = featuredQuery.eq("is_active", true);

      if (categoryParam) {
        if (Number.isNaN(categoryId)) {
          return NextResponse.json([], { status: 200 });
        }
        featuredQuery = featuredQuery.eq("category_id", categoryId);
      }

      const { data: featuredProducts, error: featuredError } = await featuredQuery;
      if (featuredError) throw featuredError;

      const selectedFeatured = featuredProducts || [];
      if (selectedFeatured.length >= limit) {
        return NextResponse.json(selectedFeatured.slice(0, limit));
      }

      let recentQuery = supabase
        .from("products")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(Math.max(limit * 10, 40));

      if (!includeInactive) recentQuery = recentQuery.eq("is_active", true);

      if (categoryParam) {
        recentQuery = recentQuery.eq("category_id", categoryId);
      }

      const { data: recentProducts, error: recentError } = await recentQuery;
      if (recentError) throw recentError;

      const featuredIds = new Set(selectedFeatured.map((product: { id: string }) => product.id));
      const fallbackProducts = (recentProducts || [])
        .filter((product: { id: string; is_featured?: boolean }) => !product.is_featured && !featuredIds.has(product.id))
        .slice(0, Math.max(limit - selectedFeatured.length, 0));

      return NextResponse.json([...selectedFeatured, ...fallbackProducts], {
        headers: { "Cache-Control": NO_STORE },
      });
    }

    let query = supabase
      .from("products")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (!includeInactive) query = query.eq("is_active", true);

    if (categoryParam) {
      if (Number.isNaN(categoryId)) {
        return NextResponse.json([], { status: 200 });
      }
      query = query.eq("category_id", categoryId);
    }

    if (searchParam) {
      query = query.ilike("name", `%${searchParam}%`);
    }

    const { data, error } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json(data || [], {
      headers: { "Cache-Control": NO_STORE },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/products - Criar produto
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const productData = body;

    if (productData.is_featured === true) {
      const featuredCount = await getFeaturedProductsCount(supabase);
      if (featuredCount >= 4) {
        return NextResponse.json(
          { error: "Máximo de 4 produtos em destaque permitido." },
          { status: 400 }
        );
      }
    }

    if (productData.category_id !== undefined && productData.category_id !== null) {
      const parsedCategory = parseInt(productData.category_id.toString(), 10);
      if (!Number.isNaN(parsedCategory)) {
        productData.category_id = parsedCategory;
      } else {
        delete productData.category_id;
      }
    }

    // Criar o produto primeiro
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert(productData)
      .select()
      .single();

    if (productError) throw productError;

    // Registra no AbacatePay e salva o ID retornado (não-fatal)
    const abacatepayId = await syncProductToAbacatePay({
      id:       String(product.id),
      name:     product.name,
      price:    product.price,
      discount: product.discount ?? undefined,
    });
    if (abacatepayId) {
      await supabase
        .from("products")
        .update({ abacatepay_product_id: abacatepayId })
        .eq("id", product.id);
      product.abacatepay_product_id = abacatepayId;
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}