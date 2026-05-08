const ABACATEPAY_API_BASE_URL = process.env.ABACATEPAY_API_BASE_URL || "https://api.abacatepay.com/v1";
const ABACATEPAY_API_KEY = process.env.ABACATEPAY_API_KEY;

export interface AbacatePayCreateBillingPayload {
  frequency: "ONE_TIME";
  methods: Array<"PIX" | "CREDIT_CARD">;
  products: Array<{
    externalId: string;
    name: string;
    description?: string;
    quantity: number;
    price: number;
  }>;
  returnUrl?: string;
  completionUrl?: string;
  customer: {
    name: string;
    email: string;
    cellphone?: string;
    taxId?: string;
  };
  metadata?: Record<string, string>;
}

export interface AbacatePayBillingResponse {
  raw: unknown;
  billingId?: string;
  paymentUrl?: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
  status?: string;
}

function getNestedValue(source: unknown, paths: string[]): string | undefined {
  if (!source || typeof source !== "object") return undefined;

  for (const path of paths) {
    const value = path.split(".").reduce<unknown>((acc, key) => {
      if (!acc || typeof acc !== "object") return undefined;
      return (acc as Record<string, unknown>)[key];
    }, source);

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return undefined;
}

export function getAbacatePayConfig() {
  return {
    apiBaseUrl: ABACATEPAY_API_BASE_URL,
    apiKey: ABACATEPAY_API_KEY,
  };
}

export async function createAbacatePayBilling(payload: AbacatePayCreateBillingPayload): Promise<AbacatePayBillingResponse> {
  if (!ABACATEPAY_API_KEY) {
    throw new Error("ABACATEPAY_API_KEY não configurada");
  }

  const response = await fetch(`${ABACATEPAY_API_BASE_URL}/billing/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ABACATEPAY_API_KEY}`,
      "x-api-key": ABACATEPAY_API_KEY,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const responseText = await response.text();
  let data: unknown = null;

  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch {
    data = responseText;
  }

  if (!response.ok) {
    throw new Error(`Erro ao criar cobrança no Abacate Pay (${response.status}): ${JSON.stringify(data)}`);
  }

  const billingId = getNestedValue(data, ["id", "data.id", "billing.id", "data.billing.id"]);
  const paymentUrl = getNestedValue(data, [
    "url",
    "data.url",
    "checkoutUrl",
    "data.checkoutUrl",
    "paymentUrl",
    "data.paymentUrl",
    "billing.url",
    "data.billing.url",
  ]);
  const pixQrCode = getNestedValue(data, [
    "pix.qrCode",
    "data.pix.qrCode",
    "pix.qrCodeImage",
    "data.pix.qrCodeImage",
    "qrCode",
    "data.qrCode",
  ]);
  const pixCopyPaste = getNestedValue(data, [
    "pix.copyPaste",
    "data.pix.copyPaste",
    "pix.emv",
    "data.pix.emv",
    "pixCode",
    "data.pixCode",
  ]);
  const status = getNestedValue(data, ["status", "data.status", "billing.status", "data.billing.status"]);

  return {
    raw: data,
    billingId,
    paymentUrl,
    pixQrCode,
    pixCopyPaste,
    status,
  };
}
