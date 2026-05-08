import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

async function getFeaturedProductsCount(supabase: any) {
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
    const categoryId = categoryParam ? parseInt(categoryParam, 10) : undefined;

    if (featuredParam === "true") {
      let featuredQuery = supabase
        .from("products")
        .select("*")
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (categoryParam) {
        if (Number.isNaN(categoryId)) {
          return NextResponse.json([], { status: 200 });
        }
        featuredQuery = featuredQuery.eq("category", categoryId);
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
        .order("created_at", { ascending: false })
        .limit(Math.max(limit * 10, 40));

      if (categoryParam) {
        recentQuery = recentQuery.eq("category", categoryId);
      }

      const { data: recentProducts, error: recentError } = await recentQuery;
      if (recentError) throw recentError;

      const featuredIds = new Set(selectedFeatured.map((product: { id: string }) => product.id));
      const fallbackProducts = (recentProducts || [])
        .filter((product: { id: string; is_featured?: boolean }) => !product.is_featured && !featuredIds.has(product.id))
        .slice(0, Math.max(limit - selectedFeatured.length, 0));

      return NextResponse.json([...selectedFeatured, ...fallbackProducts]);
    }

    let query = supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (categoryParam) {
      if (Number.isNaN(categoryId)) {
        return NextResponse.json([], { status: 200 });
      }
      query = query.eq("category", categoryId);
    }

    const { data, error } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json(data || []);
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

    if (productData.category !== undefined && productData.category !== null) {
      const parsedCategory = parseInt(productData.category.toString(), 10);
      if (!Number.isNaN(parsedCategory)) {
        productData.category = parsedCategory;
      } else {
        delete productData.category;
      }
    }

    // Criar o produto primeiro
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert(productData)
      .select()
      .single();

    if (productError) throw productError;

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}