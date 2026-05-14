const ABACATEPAY_API_BASE_URL = "https://api.abacatepay.com/v2";
const ABACATEPAY_API_KEY = process.env.ABACATEPAY_API_KEY;

export interface AbacatePayCheckoutProduct {
  externalId: string;
  name: string;
  description?: string;
  quantity: number;
  price: number; // em centavos
}

export interface AbacatePayCheckoutPayload {
  products: AbacatePayCheckoutProduct[];
  methods?: Array<"PIX" | "CARD">;
  customer: {
    name: string;
    email: string;
    cellphone?: string;
    taxId?: string;
  };
  externalId?: string;
  returnUrl?: string;
  completionUrl?: string;
  card?: {
    maxInstallments?: number;
  };
  metadata?: Record<string, string>;
}

export interface AbacatePayCheckoutResponse {
  id: string;
  url: string;
  status: string;
  amount: number;
  devMode: boolean;
}

export function getAbacatePayConfig() {
  return { apiKey: ABACATEPAY_API_KEY };
}

export async function createAbacatePayCheckout(
  payload: AbacatePayCheckoutPayload
): Promise<AbacatePayCheckoutResponse> {
  if (!ABACATEPAY_API_KEY) {
    throw new Error("ABACATEPAY_API_KEY não configurada");
  }

  const response = await fetch(`${ABACATEPAY_API_BASE_URL}/checkouts/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ABACATEPAY_API_KEY}`,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error(`AbacatePay: resposta inválida (HTTP ${response.status})`);
  }

  if (!response.ok) {
    throw new Error(
      `AbacatePay checkout error (${response.status}): ${JSON.stringify(data)}`
    );
  }

  // A API retorna { data: { id, url, status, amount, devMode }, success, error }
  const checkout = ((data as Record<string, unknown>).data ?? data) as Record<string, unknown>;

  return {
    id: String(checkout.id ?? ""),
    url: String(checkout.url ?? ""),
    status: String(checkout.status ?? "PENDING"),
    amount: Number(checkout.amount ?? 0),
    devMode: Boolean(checkout.devMode ?? false),
  };
}
