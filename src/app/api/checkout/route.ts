import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/supabase/orders";
import { getCurrentProfile, updateProfile } from "@/lib/supabase/auth";
import { createAbacatePayBilling, getAbacatePayConfig } from "@/lib/abacatePay";
import type { Order } from "@/types/supabase";

export async function POST(request: NextRequest) {
  try {
    const requestOrigin = request.headers.get("origin") || new URL(request.url).origin;
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || requestOrigin;

    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
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
      items,
      total,
      items_detail,
      shipping_cost,
    } = body;

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

    const order = await createOrder({
      date: new Date().toISOString(),
      customer: customer_name || profile.name || profile.email,
      billing_name: customer_name || profile.name || profile.email,
      customer_id: profile.id,
      customer_email: profile.email,
      document,
      company_name,
      shipping_zipcode,
      shipping_street,
      shipping_number,
      shipping_complement,
      shipping_city,
      shipping_state,
      shipping_country: shipping_country || "BR",
      items,
      total,
      items_detail,
      shipping_cost,
      status: "pending",
    } as Omit<Order, "id" | "created_at">);

    const { apiKey } = getAbacatePayConfig();
    if (!apiKey) {
      return NextResponse.json(
        {
          order,
          payment: {
            provider: "abacatepay",
            pending_configuration: true,
          },
        },
        { status: 201 }
      );
    }

    try {
      const customerName = customer_name || profile.name || profile.email;
      const safeItems = Array.isArray(items_detail) ? items_detail : [];
      const normalizedPhone = typeof phone === "string" ? phone.replace(/\D/g, "") : undefined;
      const normalizedTaxId = typeof document === "string" ? document.replace(/\D/g, "") : undefined;

      const billing = await createAbacatePayBilling({
        frequency: "ONE_TIME",
        methods: ["PIX"],
        products: safeItems.map((item: { product_id: string; name: string; quantity: number; price: number }) => ({
          externalId: String(item.product_id),
          name: item.name,
          quantity: item.quantity,
          price: Math.round(item.price * 100),
        })),
        customer: {
          name: customerName,
          email: profile.email,
          cellphone: normalizedPhone,
          taxId: normalizedTaxId,
        },
        returnUrl: `${appBaseUrl}/checkout?payment=cancelled`,
        completionUrl: `${appBaseUrl}/meus-pedidos/${order.id}?payment=success`,
        metadata: {
          order_id: order.id,
          source: "adesil-web-checkout",
        },
      });

      return NextResponse.json(
        {
          order,
          payment: {
            provider: "abacatepay",
            billing_id: billing.billingId,
            status: billing.status,
            payment_url: billing.paymentUrl,
            pix_qr_code: billing.pixQrCode,
            pix_copy_paste: billing.pixCopyPaste,
          },
        },
        { status: 201 }
      );
    } catch (paymentError) {
      console.error("Error creating Abacate Pay billing:", paymentError);
      return NextResponse.json(
        {
          order,
          payment: {
            provider: "abacatepay",
            error: "Falha ao gerar pagamento no Abacate Pay",
          },
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Error creating checkout order:", error);
    return NextResponse.json(
      { error: "Failed to create checkout order" },
      { status: 500 }
    );
  }
}
