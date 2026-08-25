import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getMercadoPagoConfig } from "@/lib/mercadoPago";
import { emitNfeForOrder } from "@/lib/bling";
import type { OrderStatus } from "@/types/supabase";

const MERCADOPAGO_API_BASE_URL = "https://api.mercadopago.com";

function mapPaymentStatus(status: string): OrderStatus | null {
  switch (status) {
    case "approved":
      return "processing";
    case "refunded":
      return "refunded";
    case "charged_back":
    case "rejected":
      return "failed";
    case "cancelled":
      return "cancelled";
    default:
      // pending, in_process, authorized, in_mediation — sem mudança de status
      return null;
  }
}

/**
 * Formato documentado pelo Mercado Pago: header `x-signature` = "ts=...,v1=...",
 * manifesto = "id:{data.id em minúsculo};request-id:{x-request-id};ts:{ts};",
 * HMAC-SHA256 em hex contra o secret configurado no painel de Webhooks.
 */
function validateWebhookSignature(
  dataId: string | null,
  requestId: string | null,
  signatureHeader: string | null
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return true; // Nenhum secret configurado → modo dev, aceita tudo

  if (!signatureHeader || !dataId || !requestId) return false;

  const parts: Record<string, string> = {};
  for (const part of signatureHeader.split(",")) {
    const [key, value] = part.split("=");
    if (key && value) parts[key.trim()] = value.trim();
  }
  const { ts, v1 } = parts;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(v1);
  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dataIdFromQuery = searchParams.get("data.id");
    const requestId = request.headers.get("x-request-id");
    const signatureHeader = request.headers.get("x-signature");

    const rawBody = await request.text();
    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    const body = payload as Record<string, unknown>;
    const type = typeof body.type === "string" ? body.type : undefined;
    const data = body.data as Record<string, unknown> | undefined;
    const paymentId = dataIdFromQuery ?? (data?.id !== undefined ? String(data.id) : null);

    if (!validateWebhookSignature(paymentId, requestId, signatureHeader)) {
      console.error("[mercadopago webhook] assinatura inválida");
      return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
    }

    if (type !== "payment" || !paymentId) {
      return NextResponse.json({ received: true, skipped: "not_a_payment_event" });
    }

    const { accessToken } = getMercadoPagoConfig();
    if (!accessToken) {
      return NextResponse.json({ received: true, skipped: "gateway_not_configured" });
    }

    const paymentRes = await fetch(`${MERCADOPAGO_API_BASE_URL}/v2/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache:   "no-store",
    });
    if (!paymentRes.ok) {
      console.error(`[mercadopago webhook] falha ao buscar pagamento ${paymentId}: ${paymentRes.status}`);
      return NextResponse.json({ received: true, skipped: "payment_fetch_failed" });
    }
    const payment = await paymentRes.json();

    const orderId  = payment.external_reference ? String(payment.external_reference) : null;
    const mpStatus = typeof payment.status === "string" ? payment.status : "";

    if (!orderId) {
      console.warn("[mercadopago webhook] pagamento sem external_reference:", paymentId);
      return NextResponse.json({ received: true, skipped: "no_order_id" });
    }

    const nextStatus = mapPaymentStatus(mpStatus);
    if (!nextStatus) {
      return NextResponse.json({ received: true, ignored: mpStatus });
    }

    const supabase = createAdminClient();

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, status, total")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      console.warn(`[mercadopago webhook] pedido ${orderId} não encontrado`);
      return NextResponse.json({ received: true, skipped: "order_not_found" });
    }

    // Idempotência: ignora se já está no status alvo, ou se seria regressão de status terminal
    const terminalStatuses: OrderStatus[] = ["refunded", "cancelled", "delivered", "failed"];
    if (order.status === nextStatus) {
      return NextResponse.json({ received: true, skipped: "already_in_status", status: nextStatus });
    }
    if (terminalStatuses.includes(order.status as OrderStatus) && nextStatus === "processing") {
      return NextResponse.json({ received: true, skipped: "status_regression_blocked" });
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: nextStatus })
      .eq("id", orderId);

    if (updateError) throw updateError;

    try {
      await supabase.from("payment_attempts").insert({
        order_id:       Number(orderId),
        provider:       "mercadopago",
        external_id:    paymentId,
        status:         nextStatus === "processing" ? "paid" : nextStatus,
        amount:         order.total,
        currency:       "BRL",
        payment_method: typeof payment.payment_type_id === "string" ? payment.payment_type_id : null,
        raw_response:   payment,
        paid_at:        nextStatus === "processing" ? new Date().toISOString() : null,
      });
    } catch {
      // Non-fatal
    }

    if (nextStatus === "processing") {
      try {
        await emitNfeForOrder(orderId);
      } catch (nfeError) {
        // Non-fatal: falha na emissão não deve derrubar a confirmação do pagamento.
        // O erro fica salvo em orders.bling_nfe_error e pode ser reemitido pelo admin.
        console.error(`[mercadopago webhook] falha ao emitir NF-e do pedido ${orderId}:`, nfeError);
      }
    }

    return NextResponse.json({ received: true, status: nextStatus, orderId });
  } catch (error) {
    console.error("Webhook Mercado Pago error:", error);
    return NextResponse.json({ error: "Falha ao processar webhook" }, { status: 500 });
  }
}
