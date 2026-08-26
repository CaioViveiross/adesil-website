import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/lib/supabase/orders";
import { getCurrentProfile } from "@/lib/supabase/auth";
import { createMercadoPagoCheckout, getMercadoPagoConfig } from "@/lib/mercadoPago";
import { createClient } from "@/lib/supabaseServer";
import { createAdminClient } from "@/lib/supabaseAdmin";
import type { Order } from "@/types/supabase";

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

    // `failed` e `cancelled` entram aqui de propósito: o pedido pode ter sido
    // marcado assim antes (ou por um chargeback) e recusar o retry deixava o
    // cliente sem nenhuma saída — inclusive com o botão "Tentar novamente" da
    // tela do pedido devolvendo erro garantido.
    const RETRYABLE: Order["status"][] = ["pending", "failed", "cancelled"];
    if (!RETRYABLE.includes(order.status)) {
      return NextResponse.json(
        { error: "Este pedido não está aguardando pagamento" },
        { status: 400 }
      );
    }

    const { accessToken } = getMercadoPagoConfig();
    if (!accessToken) {
      return NextResponse.json({ error: "Gateway de pagamento não configurado" }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("product_id, product_name_snapshot, quantity, unit_price")
      .eq("order_id", id);

    if (itemsError) throw itemsError;

    const safeItems = (orderItems ?? []).map((row) => ({
      product_id: String(row.product_id ?? ""),
      name:       row.product_name_snapshot,
      quantity:   row.quantity,
      price:      Number(row.unit_price),
    }));

    if (safeItems.length === 0) {
      return NextResponse.json({ error: "Pedido sem itens para cobrança" }, { status: 400 });
    }

    const shippingCost = order.shipping_cost && order.shipping_cost > 0 ? order.shipping_cost : 0;

    // O total do pedido já reflete o desconto de cupom aplicado na criação —
    // deriva o desconto comparando com a soma bruta dos itens + frete, pra
    // que o retry cobre o mesmo valor do pedido original.
    const rawSubtotal = safeItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const discountAmount = Math.max(0, Math.round((rawSubtotal + shippingCost - order.total) * 100) / 100);

    const checkout = await createMercadoPagoCheckout({
      orderId: String(order.id),
      items: safeItems,
      customer: {
        name:      order.customer_name,
        email:     profile.email,
        taxId:     order.document,
        cellphone: profile.phone,
      },
      appBaseUrl,
      source:         "adesil-web-retry",
      shippingCost:   shippingCost   > 0 ? shippingCost   : undefined,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
    });

    // Volta o pedido para `pending` ao gerar uma nova cobrança: sem isso um
    // pedido que estava `failed`/`cancelled` continuaria em status terminal e
    // o webhook recusaria a aprovação que está por vir (status_regression).
    // Client admin de propósito: a policy `orders_update` só permite admin, e
    // a posse do pedido já foi conferida lá em cima.
    if (order.status !== "pending") {
      const { error: resetError } = await createAdminClient()
        .from("orders")
        .update({ status: "pending" })
        .eq("id", order.id);
      if (resetError) throw resetError;
    }

    return NextResponse.json({ checkout_url: checkout.url });
  } catch (error) {
    console.error("Retry payment error:", error);
    const message = error instanceof Error ? error.message : "Falha ao gerar pagamento";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
