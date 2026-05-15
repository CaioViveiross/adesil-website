import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";
import type { OrderStatus } from "@/types/supabase";

function getStringValue(obj: unknown, paths: string[]): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;

  for (const path of paths) {
    const value = path.split(".").reduce<unknown>((acc, key) => {
      if (!acc || typeof acc !== "object") return undefined;
      return (acc as Record<string, unknown>)[key];
    }, obj);

    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }

  return undefined;
}

function mapEventToOrderStatus(event: string): OrderStatus | null {
  switch (event) {
    case "checkout.completed":
    case "transparent.completed":
      return "processing";
    case "checkout.refunded":
    case "transparent.refunded":
      return "refunded";
    case "checkout.disputed":
    case "transparent.disputed":
      return "failed";
    default:
      return null;
  }
}

function validateWebhookSignature(
  rawBody: string,
  signature: string | null,
  querySecret: string | null
): boolean {
  // Prefer env var secret; fall back to query param (AbacatePay sends ?webhookSecret=... in URL)
  const secret = process.env.ABACATEPAY_WEBHOOK_SECRET || querySecret;
  if (!secret) return true; // dev mode: accept all
  if (!signature) return false;

  const hmac = crypto.createHmac("sha256", secret).update(Buffer.from(rawBody, "utf8"));
  const expectedBase64 = hmac.digest("base64");
  const expectedHex    = crypto.createHmac("sha256", secret).update(Buffer.from(rawBody, "utf8")).digest("hex");

  const sigBuf = Buffer.from(signature);
  const b64Buf = Buffer.from(expectedBase64);
  const hexBuf = Buffer.from(expectedHex);

  if (sigBuf.length === b64Buf.length) {
    return crypto.timingSafeEqual(sigBuf, b64Buf);
  }
  if (sigBuf.length === hexBuf.length) {
    return crypto.timingSafeEqual(sigBuf, hexBuf);
  }
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get("webhookSecret");

    const signature =
      request.headers.get("x-webhook-signature") ||
      request.headers.get("x-abacatepay-signature") ||
      request.headers.get("abacatepay-signature");

    const rawBody = await request.text();

    if (!validateWebhookSignature(rawBody, signature, querySecret)) {
      console.error("Webhook: assinatura inválida");
      return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    // AbacatePay v2 structure: { id, event, apiVersion, devMode, data: { externalId, metadata, ... } }
    const event = getStringValue(payload, ["event", "type"]);
    const orderId = getStringValue(payload, [
      "data.metadata.order_id",
      "data.externalId",
      "metadata.order_id",
      "data.order_id",
    ]);
    const gatewayCheckoutId = getStringValue(payload, ["data.id", "id"]);

    if (!event) {
      return NextResponse.json({ received: true, skipped: "no event" });
    }

    if (!orderId) {
      console.warn("Webhook recebido sem order_id:", JSON.stringify(payload));
      return NextResponse.json({ received: true, skipped: "no order_id" });
    }

    const nextStatus = mapEventToOrderStatus(event);
    if (!nextStatus) {
      return NextResponse.json({ received: true, ignored: event });
    }

    const supabase = createAdminClient();

    // Verify the order exists before updating (prevents fraudulent status changes)
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, status, customer_id, total")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      console.warn(`Webhook: pedido ${orderId} não encontrado`);
      return NextResponse.json({ received: true, skipped: "order_not_found" });
    }

    // Idempotency: skip if already in target status or a terminal status past it
    const terminalStatuses: OrderStatus[] = ["refunded", "cancelled", "delivered"];
    if (order.status === nextStatus) {
      return NextResponse.json({ received: true, skipped: "already_in_status", status: nextStatus });
    }
    if (terminalStatuses.includes(order.status as OrderStatus) && nextStatus === "processing") {
      return NextResponse.json({ received: true, skipped: "status_regression_blocked" });
    }

    // Update order status
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: nextStatus })
      .eq("id", orderId);

    if (updateError) throw updateError;

    // Log to payment_attempts if table exists (non-fatal if it doesn't yet)
    try {
      await supabase.from("payment_attempts").insert({
        order_id:    Number(orderId),
        provider:    "abacatepay",
        external_id: gatewayCheckoutId ?? null,
        status:      nextStatus === "processing" ? "paid" : nextStatus,
        amount:      order.total,
        currency:    "BRL",
        raw_response: payload,
        paid_at:      nextStatus === "processing" ? new Date().toISOString() : null,
      });
    } catch {
      // Table may not exist yet — non-fatal
    }

    return NextResponse.json({ received: true, event, orderId, status: nextStatus });
  } catch (error) {
    console.error("Webhook AbacatePay error:", error);
    return NextResponse.json({ error: "Falha ao processar webhook" }, { status: 500 });
  }
}
