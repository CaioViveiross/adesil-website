import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { syncProductToAbacatePay } from "@/lib/abacatePay";

async function getFeaturedProductsCount(supabase: Awaited<ReturnType<typeof createClient>>, excludingProductId?: string) {
  let query = supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("is_featured", true);

  if (excludingProductId) {
    query = query.neq("id", excludingProductId);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

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
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
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
    const productData = body;

    if (productData.is_featured === true) {
      const featuredCount = await getFeaturedProductsCount(supabase, id);
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

    // Atualizar o produto
    const { data: product, error: productError } = await supabase
      .from("products")
      .update(productData)
      .eq("id", id)
      .select()
      .single();

    if (productError) throw productError;

    // Se preço ou desconto mudou, re-registra no AbacatePay com o novo valor (não-fatal)
    const priceChanged = body.price !== undefined || body.discount !== undefined;
    if (priceChanged) {
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
          .eq("id", id);
        product.abacatepay_product_id = abacatepayId;
      }
    }

    return NextResponse.json(product);
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

    // Soft delete: preserves order history and abacatepay_product_id
    const { error } = await supabase
      .from("products")
      .update({ deleted_at: new Date().toISOString(), is_active: false })
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