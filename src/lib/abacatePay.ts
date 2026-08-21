const ABACATEPAY_API_BASE_URL = "https://api.abacatepay.com/v2";
const ABACATEPAY_API_KEY = process.env.ABACATEPAY_API_KEY;

/**
 * Meios de pagamento oferecidos no checkout hospedado.
 *
 * Precisam estar habilitados na conta AbacatePay: pedir um método não liberado
 * faz a API responder 400 "X is not available for this store" e o checkout
 * inteiro falha. Por isso o padrão é só PIX — para habilitar cartão, libere-o
 * junto ao AbacatePay e defina ABACATEPAY_METHODS="PIX,CARD".
 */
const ABACATEPAY_METHODS = (process.env.ABACATEPAY_METHODS || "PIX")
  .split(",")
  .map((method) => method.trim().toUpperCase())
  .filter(Boolean);

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number; // em R$ (ex: 29.90)
  /** ID do produto já registrado no AbacatePay — quando presente, pula o cadastro */
  abacatepay_product_id?: string;
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
  shippingCost?: number; // em R$ — adicionado como item "Frete" no checkout
  discountAmount?: number; // em R$ — subtraído do total para cálculo de parcelas
}

export interface AbacatePayCheckoutResponse {
  id: string;
  url: string;
  status: string;
  amount: number;
  devMode: boolean;
  /** product_id local → AbacatePay product ID (apenas produtos recém-registrados nesta chamada) */
  newProductIds: Record<string, string>;
}

// ─── Config ──────────────────────────────────────────────────────────────────

export function getAbacatePayConfig() {
  return { apiKey: ABACATEPAY_API_KEY };
}

// ─── Helpers internos ────────────────────────────────────────────────────────

function sanitizeCustomer(customer: CheckoutOptions["customer"]) {
  const result: Record<string, string> = {
    name:  customer.name,
    email: customer.email,
  };

  const phone = customer.cellphone?.replace(/\D/g, "");
  if (phone && phone.length >= 10) result.cellphone = phone;

  const taxId = customer.taxId?.replace(/\D/g, "");
  if (taxId && (taxId.length === 11 || taxId.length === 14)) result.taxId = taxId;

  return result;
}

async function apiFetch(path: string, body: unknown): Promise<Record<string, unknown>> {
  const response = await fetch(`${ABACATEPAY_API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      Authorization:   `Bearer ${ABACATEPAY_API_KEY}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error(`AbacatePay: resposta inválida (HTTP ${response.status})`);
  }

  if (!response.ok) {
    // Alguns endpoints retornam o recurso existente no body do 400 (conflito de externalId)
    const existingData = (data as Record<string, unknown>)?.data as Record<string, unknown> | undefined;
    if (existingData?.id) return existingData;

    const msg = (data as Record<string, unknown>)?.error ?? JSON.stringify(data);
    throw new Error(`AbacatePay (${response.status}): ${msg}`);
  }

  return ((data as Record<string, unknown>).data ?? data) as Record<string, unknown>;
}

async function apiFetchGet(path: string): Promise<unknown> {
  try {
    const response = await fetch(`${ABACATEPAY_API_BASE_URL}${path}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${ABACATEPAY_API_KEY}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = await response.json();
    return (data as Record<string, unknown>).data ?? data;
  } catch {
    return null;
  }
}

/**
 * Registra um produto no AbacatePay e retorna o ID gerado.
 * externalId usa `{product_id}_{priceInCents}` para que mudanças de preço
 * gerem uma nova entrada sem conflito com a anterior.
 * Se o produto já existe no AbacatePay, recupera o ID via list endpoint.
 */
async function createAbacatePayProduct(item: { product_id: string; name: string; price: number }): Promise<string> {
  const priceInCents = Math.round(item.price * 100);
  const externalId   = `${item.product_id}_${priceInCents}`;

  try {
    const product = await apiFetch("/products/create", {
      externalId,
      name:     item.name,
      price:    priceInCents,
      currency: "BRL",
    });
    if (!product.id) throw new Error(`AbacatePay: produto sem ID na resposta (${item.name})`);
    return String(product.id);
  } catch (err) {
    if (err instanceof Error && err.message.includes("already exists")) {
      // Produto registrado em checkout anterior — buscar pelo list endpoint
      const list = await apiFetchGet("/products/list");
      const products = Array.isArray(list) ? list : [];
      const existing = (products as Array<Record<string, unknown>>).find((p) => p.externalId === externalId);
      if (existing?.id) return String(existing.id);
    }
    throw err;
  }
}

/**
 * Sincroniza um produto com o AbacatePay.
 * Chame ao criar ou atualizar preço de um produto no admin.
 * Retorna o ID do produto no AbacatePay, ou null em caso de falha.
 */
export async function syncProductToAbacatePay(product: {
  id: string;
  name: string;
  price: number;
  discount?: number;
}): Promise<string | null> {
  if (!ABACATEPAY_API_KEY) return null;

  const salePrice = product.discount
    ? Math.round(product.price * (1 - product.discount / 100) * 100) / 100
    : product.price;

  try {
    return await createAbacatePayProduct({ product_id: product.id, name: product.name, price: salePrice });
  } catch {
    return null;
  }
}

/**
 * Cria ou recupera um customer no AbacatePay.
 * A API retorna o customer existente se o taxId já estiver cadastrado.
 */
export async function createOrFindAbacatePayCustomer(
  customer: CheckoutOptions["customer"]
): Promise<string | null> {
  if (!ABACATEPAY_API_KEY) return null;

  try {
    const body: Record<string, string> = {
      name:  customer.name,
      email: customer.email,
    };

    const phone = customer.cellphone?.replace(/\D/g, "");
    if (phone && phone.length >= 10) body.cellphone = phone;

    const taxId = customer.taxId?.replace(/\D/g, "");
    if (taxId && (taxId.length === 11 || taxId.length === 14)) body.taxId = taxId;

    const result = await apiFetch("/customers/create", body);
    return result.id ? String(result.id) : null;
  } catch {
    // Non-fatal: checkout still works without a pre-created customer
    return null;
  }
}

// ─── Função principal ─────────────────────────────────────────────────────────

/**
 * Cria produtos no AbacatePay e gera o checkout com os métodos de ABACATEPAY_METHODS.
 * Fluxo: customers/create → products/create (por item) → checkouts/create
 */
export async function createAbacatePayCheckout(
  options: CheckoutOptions
): Promise<AbacatePayCheckoutResponse> {
  if (!ABACATEPAY_API_KEY) throw new Error("ABACATEPAY_API_KEY não configurada");
  if (!options.items.length) throw new Error("O pedido não possui itens");

  // 1. Criar/recuperar customer para pré-preencher dados no checkout
  const customerId = await createOrFindAbacatePayCustomer(options.customer);

  // 2. Obter IDs dos produtos no AbacatePay
  //    Se o item já tem abacatepay_product_id (pré-registrado no admin), usa direto.
  //    Caso contrário, registra agora (fallback para produtos legados).
  const newProductIds: Record<string, string> = {};
  const checkoutItems = await Promise.all(
    options.items.map(async (item) => {
      let abacatePayId: string;
      if (item.abacatepay_product_id) {
        abacatePayId = item.abacatepay_product_id;
      } else {
        abacatePayId = await createAbacatePayProduct(item);
        newProductIds[item.product_id] = abacatePayId;
      }
      return { id: abacatePayId, quantity: item.quantity };
    })
  );

  // Adiciona frete como item separado quando aplicável
  // Usa orderId no product_id para garantir externalId único (evita conflito no AbacatePay)
  if (options.shippingCost && options.shippingCost > 0) {
    const shippingProductId = await createAbacatePayProduct({
      product_id: `shipping_${options.orderId}`,
      name:       "Frete",
      price:      options.shippingCost,
    });
    checkoutItems.push({ id: shippingProductId, quantity: 1 });
  }

  // 3. Criar o checkout
  const productTotal  = options.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shippingTotal = options.shippingCost ?? 0;
  const discountTotal = options.discountAmount ?? 0;
  const totalBRL      = productTotal + shippingTotal - discountTotal;
  // AbacatePay exige mínimo de R$10 por parcela
  const maxInstallments = Math.max(1, Math.min(12, Math.floor(totalBRL / 10)));

  const checkoutBody: Record<string, unknown> = {
    items:         checkoutItems,
    methods:       ABACATEPAY_METHODS,
    customer:      sanitizeCustomer(options.customer),
    externalId:    String(options.orderId),
    returnUrl:     `${options.appBaseUrl}/meus-pedidos/${options.orderId}`,
    completionUrl: `${options.appBaseUrl}/meus-pedidos/${options.orderId}?payment=success`,
    metadata: {
      order_id: String(options.orderId),
      source:   options.source ?? "adesil-web-checkout",
    },
  };

  // Parcelamento só faz sentido — e só é aceito — quando o cartão está ativo.
  if (ABACATEPAY_METHODS.includes("CARD")) {
    checkoutBody.card = { maxInstallments };
  }

  if (customerId) checkoutBody.customerId = customerId;

  const checkout = await apiFetch("/checkouts/create", checkoutBody);

  if (!checkout.url) throw new Error("AbacatePay não retornou URL de pagamento");

  return {
    id:             String(checkout.id ?? ""),
    url:            String(checkout.url),
    status:         String(checkout.status ?? "PENDING"),
    amount:         Number(checkout.amount ?? 0),
    devMode:        Boolean(checkout.devMode ?? false),
    newProductIds,
  };
}
