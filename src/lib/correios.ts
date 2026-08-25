import { getSettings } from "@/lib/supabase/settings";

const BASE_URL = "https://api.correios.com.br";

let tokenCache: { value: string; expiresAt: number; forUser: string } | null = null;

export function invalidateTokenCache() {
  tokenCache = null;
}

interface CorreiosConfig {
  username:   string;
  accessCode: string; // "Código de Acesso da API" — NOT the Meu Correios account password
  postalCard: string;
  originZip:  string;
  sedexCode:  string;
  weightGrams: number;
}

async function getCorreiosConfig(): Promise<CorreiosConfig> {
  const settings = await getSettings();
  const s = (key: string): string | null => settings.get(key) ?? null;

  return {
    // Credentials always come from env — never stored in the DB
    username:   process.env.CORREIOS_USERNAME    ?? "",
    accessCode: process.env.CORREIOS_ACCESS_CODE ?? "",
    postalCard: process.env.CORREIOS_POSTAL_CARD ?? "",
    // Operational config: DB value takes priority, env var as fallback
    originZip:   s("correios_origin_zip")  ?? process.env.CORREIOS_ORIGIN_ZIP ?? "",
    sedexCode:   process.env.CORREIOS_SEDEX_CODE ?? "03220",
    weightGrams: parseInt(s("correios_weight_grams") ?? process.env.CORREIOS_WEIGHT_GRAMS ?? "300", 10),
  };
}

export async function isCorreiosConfigured(): Promise<boolean> {
  const config = await getCorreiosConfig();
  return !!(config.username && config.accessCode && config.postalCard && config.originZip);
}

async function authenticate(config: CorreiosConfig): Promise<string> {
  const cacheKey = `${config.username}:${config.postalCard}`;

  if (tokenCache && tokenCache.forUser === cacheKey && Date.now() < tokenCache.expiresAt) {
    return tokenCache.value;
  }

  // Basic auth uses login (CNPJ or email) + Código de Acesso da API (not Meu Correios password)
  const credentials = Buffer.from(`${config.username}:${config.accessCode}`).toString("base64");

  const res = await fetch(`${BASE_URL}/token/v1/autentica/cartaopostagem`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ numero: config.postalCard }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Correios auth failed ${res.status}: ${text}`);
  }

  const data = await res.json();
  // Tokens expire in 24h; cache for 23h to avoid races
  tokenCache = { value: data.token, expiresAt: Date.now() + 23 * 60 * 60 * 1000, forUser: cacheKey };
  return data.token;
}

export interface ShippingOption {
  code: string;
  name: string;
  price: number;
  deadlineDays: number;
}

/**
 * Peso unitário de fallback (gramas) para produtos sem peso cadastrado.
 * Usa a configuração global "correios_weight_grams" (env/DB).
 */
export async function getFallbackWeightGrams(): Promise<number> {
  const config = await getCorreiosConfig();
  return config.weightGrams;
}

export async function calculateShipping(
  destinationZip: string,
  weightGrams?: number,
): Promise<ShippingOption[]> {
  const config = await getCorreiosConfig();
  if (!config.originZip) throw new Error("CEP de origem não configurado");

  const token = await authenticate(config);
  const origin = config.originZip.replace(/\D/g, "");
  const destination = destinationZip.replace(/\D/g, "");

  // Peso total do pacote: soma dos pesos individuais dos itens.
  // Fallback para o peso configurado quando não informado.
  const packageWeight = weightGrams && weightGrams > 0 ? Math.round(weightGrams) : config.weightGrams;

  const services = [
    { code: config.sedexCode, name: "SEDEX" },
  ];

  // POST /preco/v1/nacional accepts up to 100 services in one call
  const body = {
    idLote: "1",
    parametrosProduto: services.map((s, i) => ({
      nuRequisicao:  String(i + 1),
      coProduto:     s.code,
      psObjeto:      String(packageWeight),
      tpObjeto:      "2",   // 2 = Caixa/Pacote
      comprimento:   "16",
      largura:       "11",
      altura:        "5",
      cepOrigem:     origin,
      cepDestino:    destination,
      nVlDeclarado:  "0",
    })),
  };

  let rawItems: Record<string, unknown>[] = [];
  try {
    const res = await fetch(`${BASE_URL}/preco/v1/nacional`, {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body:   JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    rawItems = Array.isArray(data) ? data : (Array.isArray(data?.parametrosProduto) ? data.parametrosProduto : []);
  } catch {
    return [];
  }

  const results: ShippingOption[] = [];
  for (const item of rawItems) {
    if (item.txErro || item.msgErro) continue;
    const nuReq = Number(item.nuRequisicao ?? item.nuReq ?? 0) - 1;
    const svc   = services[nuReq] ?? services.find(s => s.code === String(item.coProduto ?? ""));
    if (!svc) continue;
    const price = parseFloat(String(item.pcFinal ?? "0").replace(",", "."));
    const days  = parseInt(String(item.prazoEntrega ?? 0), 10);
    if (!price) continue;
    results.push({ code: svc.code, name: svc.name, price, deadlineDays: days });
  }

  return results;
}

export interface TrackingEvent {
  date: string;
  time: string;
  location: string;
  description: string;
}

export async function trackObject(trackingCode: string): Promise<TrackingEvent[]> {
  const config = await getCorreiosConfig();
  if (!config.username || !config.accessCode || !config.postalCard) {
    throw new Error("Credenciais dos Correios não configuradas");
  }

  const token = await authenticate(config);

  const params = new URLSearchParams({
    coPedido:           trackingCode,
    resultadoPorObjeto: "U",
    langue:             "101",
    categoria:          "ENCOMENDA",
  });

  const res = await fetch(`${BASE_URL}/rastro/v1/objetos?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`Correios tracking ${res.status}`);

  const data = await res.json();
  const objeto = Array.isArray(data?.objetos) ? data.objetos[0] : null;
  if (!objeto) return [];

  return (objeto.eventos ?? []).map((e: {
    dtHrCriado?: string;
    descricao?: string;
    unidade?: { endereco?: { municipio?: string; uf?: string } };
  }) => {
    const [date, timePart] = (e.dtHrCriado ?? "").split("T");
    const loc = e.unidade?.endereco;
    return {
      date:        date ?? "",
      time:        (timePart ?? "").slice(0, 5),
      location:    loc ? [loc.municipio, loc.uf].filter(Boolean).join(", ") : "",
      description: e.descricao ?? "",
    };
  });
}
