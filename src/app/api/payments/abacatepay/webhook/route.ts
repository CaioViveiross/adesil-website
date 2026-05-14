import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/supabase/orders";

function getStringValue(obj: unknown, paths: string[]): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;

  for (const path of paths) {
    const value = path.split(".").reduce<unknown>((acc, key) => {
      if (!acc || typeof acc !== "object") return undefined;
      return (acc as Record<string, unknown>)[key];
    }, obj);

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return undefined;
}

function mapEventToOrderStatus(event: string): "processing" | "pending" | null {
  switch (event) {
    case "checkout.completed":
    case "transparent.completed":
      return "processing";
    case "checkout.refunded":
    case "transparent.refunded":
    case "checkout.disputed":
    case "transparent.disputed":
      return "pending";
    default:
      return null;
  }
}

function validateWebhookSignature(rawBody: string, signature?: string | null): boolean {
  const secret = process.env.ABACATEPAY_WEBHOOK_SECRET;
  if (!secret) return true; // sem secret configurado, aceita tudo (desabilitar em prod)
  if (!signature) return false;

  // AbacatePay usa HMAC-SHA256 com digest em base64 (conforme documentação)
  const expected = crypto
    .createHmac("sha256", secret)
    .update(Buffer.from(rawBody, "utf8"))
    .digest("base64");

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-webhook-signature");
    const rawBody = await request.text();

    if (!validateWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    // Estrutura v2: { id, event, apiVersion, devMode, data: { ... } }
    const event = getStringValue(payload, ["event", "type"]);
    const orderId = getStringValue(payload, [
      "data.metadata.order_id",
      "data.externalId",
      "metadata.order_id",
    ]);

    if (!event) {
      return NextResponse.json({ received: true, skipped: "no event" });
    }

    if (!orderId) {
      return NextResponse.json({ received: true, skipped: "no order_id" });
    }

    const nextStatus = mapEventToOrderStatus(event);
    if (!nextStatus) {
      return NextResponse.json({ received: true, ignored: event });
    }

    await updateOrderStatus(orderId, nextStatus);
    return NextResponse.json({ received: true, event, orderId, status: nextStatus });
  } catch (error) {
    console.error("Webhook AbacatePay error:", error);
    return NextResponse.json({ error: "Falha ao processar webhook" }, { status: 500 });
  }
}
