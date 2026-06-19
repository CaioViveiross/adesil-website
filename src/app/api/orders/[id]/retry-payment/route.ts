import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/lib/supabase/orders";
import { getCurrentProfile } from "@/lib/supabase/auth";
import { createAbacatePayCheckout, getAbacatePayConfig } from "@/lib/abacatePay";
import { createClient } from "@/lib/supabaseServer";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestOrigin = request.headers.get("origin") || new URL(request.url).origin;
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || requestOrigin;

    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    if (order.customer_id !== profile.id && profile.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "Só é possível retentar o pagamento de pedidos pendentes" },
        { status: 400 }
      );
    }

    const { apiKey } = getAbacatePayConfig();
    if (!apiKey) {
      return NextResponse.json({ error: "Gateway de pagamento não configurado" }, { status: 503 });
    }

    // Read items from order_items + fetch abacatepay_product_id from products
    const supabase = await createClient();
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("product_id, product_name_snapshot, quantity, unit_price")
      .eq("order_id", id);

    if (itemsError) throw itemsError;

    // Fetch stored AbacatePay product IDs to avoid re-registering
    const productIds = (orderItems ?? [])
      .map((r) => r.product_id)
      .filter(Boolean) as number[];

    const abacatepayIdMap = new Map<string, string>();
    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from("products")
        .select("id, abacatepay_product_id")
        .in("id", productIds);
      (products ?? []).forEach((p) => {
        if (p.abacatepay_product_id) {
          abacatepayIdMap.set(String(p.id), p.abacatepay_product_id);
        }
      });
    }

    const safeItems = (orderItems ?? []).map((row) => ({
      product_id:            String(row.product_id ?? ""),
      name:                  row.product_name_snapshot,
      quantity:              row.quantity,
      price:                 Number(row.unit_price),
      abacatepay_product_id: abacatepayIdMap.get(String(row.product_id)) ?? undefined,
    }));

    if (safeItems.length === 0) {
      return NextResponse.json({ error: "Pedido sem itens para cobrança" }, { status: 400 });
    }

    const checkout = await createAbacatePayCheckout({
      orderId: String(order.id),
      items: safeItems,
      customer: {
        name:      order.customer_name,
        email:     profile.email,
        taxId:     order.document,
        cellphone: profile.phone,
      },
      appBaseUrl,
      source:       "adesil-web-retry",
      shippingCost: order.shipping_cost && order.shipping_cost > 0 ? order.shipping_cost : undefined,
    });

    // Salva IDs recém-registrados de volta ao banco
    if (Object.keys(checkout.newProductIds).length > 0) {
      await Promise.allSettled(
        Object.entries(checkout.newProductIds).map(([productId, abacatePayId]) =>
          supabase.from("products").update({ abacatepay_product_id: abacatePayId }).eq("id", productId)
        )
      );
    }

    return NextResponse.json({ checkout_url: checkout.url });
  } catch (error) {
    console.error("Retry payment error:", error);
    const message = error instanceof Error ? error.message : "Falha ao gerar pagamento";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
