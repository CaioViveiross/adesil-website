import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getMercadoPagoConfig } from "@/lib/mercadoPago";
import { emitNfeForOrder } from "@/lib/bling";
import type { OrderStatus } from "@/types/supabase";

const MERCADOPAGO_API_BASE_URL = "https://api.mercadopago.com";

type AttemptStatus =
  | "pending" | "processing" | "paid" | "failed" | "refunded" | "disputed" | "cancelled";

/**
 * Status da TENTATIVA de pagamento — vira uma linha em `payment_attempts`.
 * Toda notificação é registrada, inclusive as recusadas e as que não mexem
 * no pedido: é esse histórico que mostra cobrança duplicada, PIX que expirou
 * e cartão recusado.
 */
function mapAttemptStatus(mpStatus: string): AttemptStatus {
  switch (mpStatus) {
    case "approved":     return "paid";
    case "rejected":     return "failed";
    case "cancelled":    return "cancelled";
    case "refunded":     return "refunded";
    case "charged_back":
    case "in_mediation": return "disputed";
    default:             return "pending"; // pending, in_process, authorized
  }
}

/**
 * Status do PEDIDO. Só eventos que dizem algo sobre o pedido inteiro mexem
 * aqui — e é uma lista curta de propósito.
 *
 * Cartão recusado (`rejected`) e PIX expirado (`cancelled`) são falhas DA
 * TENTATIVA, não do pedido: antes eles levavam o pedido para `failed`/
 * `cancelled`, que são status terminais, e isso bloqueava tanto o retry
 * quanto uma aprovação posterior — o cliente ficava sem saída depois de uma
 * única recusa. Agora o pedido segue em `pending` e continua pagável.
 */
function mapOrderStatus(mpStatus: string): OrderStatus | null {
  switch (mpStatus) {
    case "approved":     return "processing";
    case "refunded":     return "refunded";
    case "charged_back": return "failed"; // estorno forçado: exige ação do admin
    default:             return null;
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

/**
 * Registra a tentativa. O upsert por (provider, external_id) torna o reenvio
 * do mesmo pagamento idempotente e ainda atualiza a linha quando o pagamento
 * muda de estado (pending → approved, por exemplo).
 *
 * Nunca derruba o processamento: o status do pedido importa mais que o
 * histórico. Mas o erro vai para o log — o client do Supabase devolve o erro
 * no retorno em vez de lançar, e foi esse silêncio que escondeu meses de
 * inserts recusados.
 */
async function recordAttempt(
  supabase: ReturnType<typeof createAdminClient>,
  params: {
    orderId:   string;
    paymentId: string;
    status:    AttemptStatus;
    amount:    number;
    payment:   Record<string, unknown>;
  }
) {
  const { error } = await supabase.from("payment_attempts").upsert(
    {
      order_id:       Number(params.orderId),
      provider:       "mercadopago",
      external_id:    params.paymentId,
      status:         params.status,
      amount:         params.amount,
      currency:       "BRL",
      payment_method: typeof params.payment.payment_type_id === "string"
        ? params.payment.payment_type_id
        : null,
      raw_response:   params.payment,
      paid_at:        params.status === "paid" ? new Date().toISOString() : null,
      updated_at:     new Date().toISOString(),
    },
    { onConflict: "provider,external_id" }
  );

  if (error) {
    console.error(
      `[mercadopago webhook] falha ao registrar tentativa ${params.paymentId} do pedido ${params.orderId}:`,
      error
    );
  }
}

/**
 * O Mercado Pago só reenvia a notificação quando a resposta NÃO é 2xx.
 * Por isso a distinção importa:
 *   - 200 → evento que nunca vai mudar de resultado (não é pagamento, status
 *     sem transição, pagamento de outra origem, pedido já no status alvo).
 *   - 5xx → falha nossa ou transitória (gateway sem credencial, API do MP
 *     fora, pedido ainda não visível). O MP reenvia e o pedido se resolve
 *     sozinho; as guardas de idempotência abaixo tornam o reenvio seguro.
 * Responder 200 para falha de infraestrutura desliga esse retry e deixa o
 * pedido travado em `pending` sem nenhum sinal.
 */
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
      console.error("[mercadopago webhook] MERCADOPAGO_ACCESS_TOKEN ausente");
      return NextResponse.json(
        { error: "gateway_not_configured" },
        { status: 503 }
      );
    }

    const paymentRes = await fetch(`${MERCADOPAGO_API_BASE_URL}/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache:   "no-store",
    });
    if (!paymentRes.ok) {
      // Inclui 404: os IDs vêm do próprio MP, então "não encontrado" significa
      // URL/credencial/conta errada do nosso lado — condições que são corrigidas
      // e aí o reenvio recupera o pedido.
      console.error(`[mercadopago webhook] falha ao buscar pagamento ${paymentId}: ${paymentRes.status}`);
      return NextResponse.json(
        { error: "payment_fetch_failed", paymentId, upstreamStatus: paymentRes.status },
        { status: 502 }
      );
    }
    const payment = await paymentRes.json();

    const orderId  = payment.external_reference ? String(payment.external_reference) : null;
    const mpStatus = typeof payment.status === "string" ? payment.status : "";

    if (!orderId) {
      console.warn("[mercadopago webhook] pagamento sem external_reference:", paymentId);
      return NextResponse.json({ received: true, skipped: "no_order_id" });
    }

    const supabase = createAdminClient();

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, status, total, coupon_code")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      // Pode ser corrida (notificação antes do pedido ficar visível) — o
      // reenvio resolve. Se o pedido realmente não existe, o MP desiste depois
      // das tentativas e fica o log.
      console.error(`[mercadopago webhook] pedido ${orderId} não encontrado`);
      return NextResponse.json(
        { error: "order_not_found", orderId },
        { status: 503 }
      );
    }

    const orderTotal  = Number(order.total);
    const paidAmount  = Number(payment.transaction_amount ?? 0);
    const nextStatus  = mapOrderStatus(mpStatus);

    // Registrado antes de qualquer decisão: mesmo o evento que não mexe no
    // pedido (recusa, PIX expirado, segunda cobrança do mesmo pedido) precisa
    // deixar rastro para conferência e eventual estorno.
    await recordAttempt(supabase, {
      orderId,
      paymentId,
      status:  mapAttemptStatus(mpStatus),
      amount:  paidAmount > 0 ? paidAmount : orderTotal,
      payment,
    });

    if (!nextStatus) {
      return NextResponse.json({ received: true, recorded: true, ignored: mpStatus });
    }

    // Confere o valor antes de liberar o pedido. Pagamento a menor não vira
    // `processing`: fica registrado como tentativa e o pedido segue pendente
    // para conferência manual (reenviar não muda o valor, então 200).
    if (nextStatus === "processing" && paidAmount + 0.01 < orderTotal) {
      console.error(
        `[mercadopago webhook] valor divergente no pedido ${orderId}: pago ${paidAmount}, total ${orderTotal}`
      );
      return NextResponse.json({
        received: true,
        skipped:  "amount_mismatch",
        paidAmount,
        orderTotal,
      });
    }

    // Idempotência: ignora se já está no status alvo, ou se seria regressão de
    // status terminal. `failed` só chega aqui por chargeback e `cancelled` só
    // por ação do admin — nenhum dos dois vem mais de tentativa recusada.
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

    if (nextStatus === "processing") {
      // Daqui para baixo tudo é não-fatal: o pagamento já está confirmado e
      // nenhuma dessas etapas justifica devolver erro ao Mercado Pago (o
      // reenvio pararia no `already_in_status` de qualquer forma).

      // Baixa de estoque — só afeta produtos com estoque controlado
      // (stock_quantity não nulo). Roda uma vez porque a segunda notificação
      // do mesmo pedido para no guard de idempotência acima.
      const { error: stockError } = await supabase.rpc("consume_order_stock", {
        p_order_id: Number(orderId),
      });
      if (stockError) {
        console.error(`[mercadopago webhook] falha ao baixar estoque do pedido ${orderId}:`, stockError);
      }

      // Cupom só conta como usado quando o pedido é pago de fato.
      if (order.coupon_code) {
        const { error: couponError } = await supabase.rpc("increment_coupon_uses", {
          p_code: order.coupon_code,
        });
        if (couponError) {
          console.error(`[mercadopago webhook] falha ao contabilizar cupom do pedido ${orderId}:`, couponError);
        }
      }

      try {
        await emitNfeForOrder(orderId);
      } catch (nfeError) {
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
