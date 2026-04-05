import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

// GET /api/products - Listar produtos
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const category = searchParams.get("category");
    const businessCategory = searchParams.get("business_category");

    let query = supabase
      .from("products")
      .select(`
        *,
        product_business_categories (
          business_category_id,
          business_categories (
            id,
            name
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (category) {
      query = query.eq("category", category);
    }

    // Se filtrar por categoria de negócio, precisamos de uma abordagem diferente
    if (businessCategory) {
      // Buscar produtos que têm a categoria de negócio específica
      const { data: productIds, error: relationError } = await supabase
        .from("product_business_categories")
        .select("product_id")
        .eq("business_category_id", businessCategory);

      if (relationError) throw relationError;

      const ids = productIds?.map(p => p.product_id) || [];
      if (ids.length > 0) {
        query = query.in("id", ids);
      } else {
        // Se não há produtos com essa categoria, retornar array vazio
        return NextResponse.json([]);
      }
    }

    const { data, error } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    // Transformar os dados para incluir business_categories como array simples
    const transformedData = data?.map(product => ({
      ...product,
      business_categories: product.product_business_categories?.map((pbc: any) => pbc.business_category_id) || []
    })) || [];

    return NextResponse.json(transformedData);
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
    const { business_categories, ...productData } = body;

    // Criar o produto primeiro
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert(productData)
      .select()
      .single();

    if (productError) throw productError;

    // Se foram fornecidas categorias de negócio, criar as relações
    if (business_categories && Array.isArray(business_categories) && business_categories.length > 0) {
      const relations = business_categories.map(businessCategoryId => ({
        product_id: product.id,
        business_category_id: businessCategoryId
      }));

      const { error: relationError } = await supabase
        .from("product_business_categories")
        .insert(relations);

      if (relationError) {
        console.error("Error creating business category relations:", relationError);
        // Não falhar a criação do produto se as relações falharem
      }
    }

    // Buscar o produto completo com as relações
    const { data: completeProduct, error: fetchError } = await supabase
      .from("products")
      .select(`
        *,
        product_business_categories (
          business_category_id,
          business_categories (
            id,
            name
          )
        )
      `)
      .eq("id", product.id)
      .single();

    if (fetchError) throw fetchError;

    // Transformar os dados
    const transformedProduct = {
      ...completeProduct,
      business_categories: completeProduct.product_business_categories?.map((pbc: any) => pbc.business_category_id) || []
    };

    return NextResponse.json(transformedProduct, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}