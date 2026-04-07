import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

// GET /api/products/[id] - Buscar produto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        product_business_categories (
          business_category_id
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;

    // Transformar os dados
    const transformedProduct = {
      ...data,
      business_categories: data.product_business_categories?.map((pbc: any) => pbc.business_category_id) || []
    };

    return NextResponse.json(transformedProduct);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Product not found" },
      { status: 404 }
    );
  }
}

// PUT /api/products/[id] - Atualizar produto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    if (productData.category !== undefined && productData.category !== null) {
      const parsedCategory = parseInt(productData.category.toString(), 10);
      if (!Number.isNaN(parsedCategory)) {
        productData.category = parsedCategory;
      } else {
        delete productData.category;
      }
    }

    // Atualizar o produto
    const { data: product, error: productError } = await supabase
      .from("products")
      .update(productData)
      .eq("id", id)
      .select()
      .single();

    if (productError) throw productError;

    // Atualizar as relações de categorias de negócio
    if (business_categories !== undefined) {
      // Remover relações existentes
      await supabase
        .from("product_business_categories")
        .delete()
        .eq("product_id", id);

      // Criar novas relações se fornecidas
      if (Array.isArray(business_categories) && business_categories.length > 0) {
        const relations = business_categories.map(businessCategoryId => ({
          product_id: id,
          business_category_id: businessCategoryId
        }));

        const { error: relationError } = await supabase
          .from("product_business_categories")
          .insert(relations);

        if (relationError) {
          console.error("Error updating business category relations:", relationError);
        }
      }
    }

    // Buscar o produto completo com as relações atualizadas
    const { data: completeProduct, error: fetchError } = await supabase
      .from("products")
      .select(`
        *,
        product_business_categories (
          business_category_id
        )
      `)
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    // Transformar os dados
    const transformedProduct = {
      ...completeProduct,
      business_categories: completeProduct.product_business_categories?.map((pbc: any) => pbc.business_category_id) || []
    };

    return NextResponse.json(transformedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Deletar produto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // As relações serão deletadas automaticamente devido às foreign keys
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}