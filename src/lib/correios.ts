

const BASE_URL = "https://api.correios.com.br";

// Default service codes for contracts (sem contrato: PAC=04510, SEDEX=04014)
const SERVICES = [
  { code: process.env.CORREIOS_PAC_CODE || "03298", name: "PAC" },
  { code: process.env.CORREIOS_SEDEX_CODE || "03220", name: "SEDEX" },
];

// Default package dimensions for sticker/label shipments
const PACKAGE = {
  weightGrams: parseInt(process.env.CORREIOS_WEIGHT_GRAMS || "300", 10),
  comprimento: "16", // cm
  largura: "11",     // cm
  altura: "2",       // cm
  tpObjeto: "1",     // 1=envelope, 2=caixa, 3=cilindro
};

let tokenCache: { value: string; expiresAt: number } | null = null;

async function authenticate(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.value;

  const username = process.env.CORREIOS_USERNAME;
  const password = process.env.CORREIOS_PASSWORD;
  const postalCard = process.env.CORREIOS_POSTAL_CARD;

  if (!username || !password || !postalCard) {
    throw new Error("Correios credentials not configured (CORREIOS_USERNAME, CORREIOS_PASSWORD, CORREIOS_POSTAL_CARD)");
  }

  const credentials = Buffer.from(`${username}:${password}`).toString("base64");

  const res = await fetch(`${BASE_URL}/token/v1/autentica/cartaopostagem`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ numero: postalCard }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Correios auth failed ${res.status}: ${text}`);
  }

  const data = await res.json();
  // Tokens expire in 1 hour; cache for 50 minutes to avoid races
  tokenCache = { value: data.token, expiresAt: Date.now() + 50 * 60 * 1000 };
  return data.token;
}

export interface ShippingOption {
  code: string;
  name: string;
  price: number;
  deadlineDays: number;
}

export function isCorreiosConfigured(): boolean {
  return !!(
    process.env.CORREIOS_USERNAME &&
    process.env.CORREIOS_PASSWORD &&
    process.env.CORREIOS_POSTAL_CARD &&
    process.env.CORREIOS_ORIGIN_ZIP
  );
}

export async function calculateShipping(
  destinationZip: string
): Promise<ShippingOption[]> {
  const originZip = process.env.CORREIOS_ORIGIN_ZIP;
  if (!originZip) throw new Error("CORREIOS_ORIGIN_ZIP not configured");

  const token = await authenticate();
  const origin = originZip.replace(/\D/g, "");
  const destination = destinationZip.replace(/\D/g, "");

  const results: ShippingOption[] = [];

  for (const service of SERVICES) {
    try {
      const params = new URLSearchParams({
        coProduto: service.code,
        psObjeto: String(PACKAGE.weightGrams),
        tpObjeto: PACKAGE.tpObjeto,
        comprimento: PACKAGE.comprimento,
        largura: PACKAGE.largura,
        altura: PACKAGE.altura,
        cepOrigem: origin,
        cepDestino: destination,
        nVlDeclarado: "0",
      });

      const res = await fetch(`${BASE_URL}/preco/v1/nacional?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        // Timeout via AbortController — Correios API can be slow
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) continue;

      const data = await res.json();
      // Response may be array or single object depending on contract type
      const item = Array.isArray(data) ? data[0] : data;

      if (!item || item.msgErro) continue;

      const price = parseFloat(String(item.pcFinal ?? item.vlfim ?? "0").replace(",", "."));
      const days = parseInt(String(item.prazoEntrega ?? item.entrega?.prazoEntrega ?? "0"), 10);

      if (!price) continue;

      results.push({ code: service.code, name: service.name, price, deadlineDays: days });
    } catch {
      // Skip failed services silently — partial results are acceptable
    }
  }

  return results;
}
