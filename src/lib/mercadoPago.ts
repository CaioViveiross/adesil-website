const MERCADOPAGO_API_BASE_URL = "https://api.mercadopago.com";
const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number; // em R$ (ex: 29.90)
}

export interface CheckoutOptions {
  orderId: string;
  items: OrderItem[];
  customer: {
    name: string;
    email: string;
    cellphone?: string;
    taxId?: string;
  };
  appBaseUrl: string;
  source?: string;
  shippingCost?: number; // em R$ — adicionado como item "Frete" na preferência
  discountAmount?: number; // em R$ — aplicado proporcionalmente ao preço dos itens
}

export interface MercadoPagoCheckoutResponse {
  id: string;
  url: string;
  status: string;
}

// ─── Config ──────────────────────────────────────────────────────────────────

export function getMercadoPagoConfig() {
  return { accessToken: MERCADOPAGO_ACCESS_TOKEN };
}

// ─── Helpers internos ────────────────────────────────────────────────────────

function sanitizeIdentification(taxId?: string): { type: string; number: string } | undefined {
  const digits = taxId?.replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.length === 11) return { type: "CPF", number: digits };
  if (digits.length === 14) return { type: "CNPJ", number: digits };
  return undefined;
}

async function apiFetch(path: string, body: unknown): Promise<Record<string, unknown>> {
  const response = await fetch(`${MERCADOPAGO_API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Mercado Pago: resposta inválida (HTTP ${response.status})`);
  }

  if (!response.ok) {
    const msg = (data as Record<string, unknown>)?.message ?? JSON.stringify(data);
    throw new Error(`Mercado Pago (${response.status}): ${msg}`);
  }

  return data as Record<string, unknown>;
}

/**
 * Escala o preço unitário de cada item proporcionalmente para que a soma
 * bata exatamente com `targetSubtotal` (subtotal com o desconto do cupom
 * já aplicado) — o Mercado Pago não tem um campo de "desconto" na
 * preferência, então o valor cobrado precisa vir embutido no preço dos itens.
 * O último item absorve a diferença de arredondamento de centavos.
 */
function applyDiscountToItems(items: OrderItem[], targetSubtotal: number): OrderItem[] {
  const rawSubtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  if (rawSubtotal <= 0 || targetSubtotal >= rawSubtotal) return items;

  const factor = targetSubtotal / rawSubtotal;
  const adjusted = items.map((item) => ({
    ...item,
    price: Math.round(item.price * factor * 100) / 100,
  }));

  const adjustedTotal = adjusted.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const diff = Math.round((targetSubtotal - adjustedTotal) * 100) / 100;
  if (diff !== 0) {
    const last = adjusted[adjusted.length - 1];
    const correctedPrice = last.price + diff / last.quantity;
    last.price = Math.max(0, Math.round(correctedPrice * 100) / 100);
  }

  return adjusted;
}

// ─── Função principal ─────────────────────────────────────────────────────────

/**
 * Cria uma preferência de Checkout Pro (Pix, cartão e boleto habilitados por
 * padrão — cada método precisa estar ativo na conta Mercado Pago) e retorna
 * a URL de pagamento hospedada.
 */
export async function createMercadoPagoCheckout(
  options: CheckoutOptions
): Promise<MercadoPagoCheckoutResponse> {
  if (!MERCADOPAGO_ACCESS_TOKEN) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurada");
  if (!options.items.length) throw new Error("O pedido não possui itens");

  const discountAmount = options.discountAmount ?? 0;
  const rawSubtotal    = options.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const targetSubtotal = Math.max(0, Math.round((rawSubtotal - discountAmount) * 100) / 100);
  const finalItems     = discountAmount > 0 ? applyDiscountToItems(options.items, targetSubtotal) : options.items;

  const preferenceItems = finalItems.map((item) => ({
    id:          item.product_id,
    title:       item.name,
    quantity:    item.quantity,
    unit_price:  item.price,
    currency_id: "BRL",
  }));

  if (options.shippingCost && options.shippingCost > 0) {
    preferenceItems.push({
      id:          `shipping_${options.orderId}`,
      title:       "Frete",
      quantity:    1,
      unit_price:  options.shippingCost,
      currency_id: "BRL",
    });
  }

  const identification = sanitizeIdentification(options.customer.taxId);
  const phoneDigits     = options.customer.cellphone?.replace(/\D/g, "");
  // Schema do Mercado Pago espera DDD e número separados (não o telefone inteiro num campo só)
  const phone = phoneDigits && phoneDigits.length >= 10
    ? { area_code: phoneDigits.slice(0, 2), number: phoneDigits.slice(2) }
    : undefined;

  const preferenceBody: Record<string, unknown> = {
    items: preferenceItems,
    payer: {
      name:  options.customer.name,
      email: options.customer.email,
      ...(identification ? { identification } : {}),
      ...(phone ? { phone } : {}),
    },
    external_reference:   String(options.orderId),
    back_urls: {
      success: `${options.appBaseUrl}/meus-pedidos/${options.orderId}?payment=success`,
      pending: `${options.appBaseUrl}/meus-pedidos/${options.orderId}?payment=pending`,
      failure: `${options.appBaseUrl}/meus-pedidos/${options.orderId}?payment=failure`,
    },
    auto_return:          "approved",
    notification_url:     `${options.appBaseUrl}/api/payments/mercadopago/webhook`,
    statement_descriptor:  "ADESIL PRINT",
    metadata: {
      order_id: String(options.orderId),
      source:   options.source ?? "adesil-web-checkout",
    },
  };

  const preference = await apiFetch("/checkout/preferences", preferenceBody);

  const initPoint = preference.init_point ?? preference.sandbox_init_point;
  if (!initPoint) throw new Error("Mercado Pago não retornou URL de pagamento");

  return {
    id:     String(preference.id ?? ""),
    url:    String(initPoint),
    status: "pending",
  };
}
