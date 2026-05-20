import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { createOrder } from "@/lib/supabase/orders";
import { getCurrentProfile, updateProfile } from "@/lib/supabase/auth";
import { createAbacatePayCheckout, getAbacatePayConfig } from "@/lib/abacatePay";
import { calculateShipping, isCorreiosConfigured } from "@/lib/correios";
import type { Order } from "@/types/supabase";

// ─── Constantes de negócio ────────────────────────────────────────────────────
const SHIPPING_COST      = 29.9;
const FREE_SHIPPING_FROM = 300;

async function fetchCoupon(
  supabase: Awaited<ReturnType<typeof createClient>>,
  code: string
): Promise<{ type: "percent" | "fixed"; value: number } | null> {
  if (!code) return null;
  const { data } = await supabase
    .from("coupons")
    .select("type, value, is_active, max_uses, uses_count, expires_at")
    .eq("code", code.toUpperCase())
    .single();

  if (!data || !data.is_active) return null;
  if (data.max_uses !== null && data.uses_count >= data.max_uses) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;

  return { type: data.type as "percent" | "fixed", value: Number(data.value) };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface RequestItem {
  product_id: string | number;
  name:       string;
  quantity:   number;
  price:      number;
}

interface ValidatedItem {
  product_id:              string;
  product_name_snapshot:   string;
  quantity:                number;
  unit_price:              number;
  abacatepay_product_id?:  string | null;
}

/**
 * Fetches current prices from the DB and validates the client-submitted items.
 * Returns validated items with server-authoritative unit prices.
 * Throws if any product is not found, inactive, or out of stock.
 */
async function validateAndPriceItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rawItems: RequestItem[]
): Promise<ValidatedItem[]> {
  const ids = rawItems.map((i) => String(i.product_id));

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, price, discount, is_active, deleted_at, abacatepay_product_id")
    .in("id", ids);

  if (error) throw new Error("Falha ao buscar produtos: " + error.message);

  const productMap = new Map(
    (products ?? []).map((p) => [String(p.id), p])
  );

  return rawItems.map((item) => {
    const product = productMap.get(String(item.product_id));

    if (!product || !product.is_active || product.deleted_at) {
      throw new Error(`Produto "${item.name}" indisponível.`);
    }

    // Server-side price: apply discount if present
    const unitPrice = product.discount
      ? Math.round(product.price * (1 - product.discount / 100) * 100) / 100
      : product.price;

    return {
      product_id:             String(product.id),
      product_name_snapshot:  product.name,
      quantity:               item.quantity,
      unit_price:             unitPrice,
      abacatepay_product_id:  product.abacatepay_product_id ?? null,
    };
  });
}

function applyDiscount(subtotal: number, coupon: { type: "percent" | "fixed"; value: number } | null): number {
  if (!coupon) return 0;
  if (coupon.type === "percent") return Math.round(subtotal * (coupon.value / 100) * 100) / 100;
  return Math.min(coupon.value, subtotal);
}

function staticShippingCost(subtotal: number, discountAmount: number): number {
  return subtotal - discountAmount >= FREE_SHIPPING_FROM ? 0 : SHIPPING_COST;
}

async function resolveShippingCost(
  destinationZip: string,
  serviceCode: string | null | undefined,
  subtotal: number,
  discountAmount: number
): Promise<number> {
  if (isCorreiosConfigured() && destinationZip && serviceCode) {
    try {
      const options = await calculateShipping(destinationZip);
      const selected = options.find((o) => o.code === serviceCode);
      if (selected) return selected.price;
      // Service code not found in response — use cheapest available
      if (options.length > 0) return Math.min(...options.map((o) => o.price));
    } catch {
      // Fall through to static calculation on any Correios error
    }
  }
  return staticShippingCost(subtotal, discountAmount);
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const requestOrigin = request.headers.get("origin") || new URL(request.url).origin;
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || requestOrigin;

    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      customer_name,
      document,
      company_name,
      shipping_zipcode,
      shipping_street,
      shipping_number,
      shipping_complement,
      shipping_city,
      shipping_state,
      shipping_country,
      phone,
      items_detail,
      coupon,
      shipping_service_code,
    } = body;

    // Validate raw items array
    const rawItems: RequestItem[] = Array.isArray(items_detail) ? items_detail : [];
    if (rawItems.length === 0) {
      return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
    }

    // Validate quantity values
    for (const item of rawItems) {
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return NextResponse.json({ error: "Quantidade inválida nos itens" }, { status: 400 });
      }
    }

    const supabase = await createClient();

    // Server-side price + stock validation
    let validatedItems: ValidatedItem[];
    try {
      validatedItems = await validateAndPriceItems(supabase, rawItems);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Itens inválidos" },
        { status: 422 }
      );
    }

    // Server-side financial calculations (never trust client totals)
    const subtotal      = validatedItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
    const couponData    = await fetchCoupon(supabase, coupon);
    const discountAmt   = applyDiscount(subtotal, couponData);
    const shippingCost  = await resolveShippingCost(shipping_zipcode, shipping_service_code, subtotal, discountAmt);
    const finalTotal    = Math.round((subtotal - discountAmt + shippingCost) * 100) / 100;
    const itemCount     = validatedItems.reduce((sum, i) => sum + i.quantity, 0);

    // Persist address to profile
    await updateProfile(profile.id, {
      document,
      company_name,
      shipping_zipcode,
      shipping_street,
      shipping_number,
      shipping_complement,
      shipping_city,
      shipping_state,
      shipping_country,
    });

    // Create order with server-authoritative values
    const order = await createOrder({
      ordered_at:          new Date().toISOString(),
      customer_name:       customer_name || profile.name || profile.email,
      billing_name:        customer_name || profile.name || profile.email,
      customer_id:         profile.id,
      customer_email:      profile.email,
      document,
      company_name,
      shipping_zipcode,
      shipping_street,
      shipping_number,
      shipping_complement,
      shipping_city,
      shipping_state,
      shipping_country:    shipping_country || "BR",
      items:               itemCount,
      total:               finalTotal,
      shipping_cost:       shippingCost,
      status:              "pending",
    } as Omit<Order, "id" | "created_at" | "updated_at">);

    // Persist order items to the relational table
    const orderItemsPayload = validatedItems.map((item) => ({
      order_id:              order.id,
      product_id:            item.product_id ? Number(item.product_id) || null : null,
      product_name_snapshot: item.product_name_snapshot,
      quantity:              item.quantity,
      unit_price:            item.unit_price,
    }));
    await supabase.from("order_items").insert(orderItemsPayload);

    // AbacatePay integration
    const { apiKey } = getAbacatePayConfig();
    if (!apiKey) {
      return NextResponse.json(
        { order, payment: { provider: "abacatepay", pending_configuration: true } },
        { status: 201 }
      );
    }

    // Map validated items to AbacatePay format (uses server prices)
    const checkoutItems = validatedItems.map((i) => ({
      product_id:             i.product_id,
      name:                   i.product_name_snapshot,
      quantity:               i.quantity,
      price:                  i.unit_price,
      abacatepay_product_id:  i.abacatepay_product_id ?? undefined,
    }));

    try {
      const checkout = await createAbacatePayCheckout({
        orderId: String(order.id),
        items:   checkoutItems,
        customer: {
          name:      customer_name || profile.name || profile.email,
          email:     profile.email,
          cellphone: typeof phone === "string" ? phone : undefined,
          taxId:     typeof document === "string" ? document : undefined,
        },
        appBaseUrl,
        source: "adesil-web-checkout",
      });

      return NextResponse.json(
        {
          order,
          payment: {
            provider:     "abacatepay",
            checkout_id:  checkout.id,
            checkout_url: checkout.url,
            status:       checkout.status,
          },
        },
        { status: 201 }
      );
    } catch (paymentError) {
      console.error("AbacatePay checkout error:", paymentError);
      return NextResponse.json(
        {
          order,
          payment: {
            provider: "abacatepay",
            error:    paymentError instanceof Error ? paymentError.message : "Falha ao gerar pagamento",
          },
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Checkout route error:", error);
    return NextResponse.json({ error: "Falha ao criar pedido" }, { status: 500 });
  }
}
