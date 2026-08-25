import { createAdminClient } from "@/lib/supabaseAdmin";
import { getSetting, upsertSetting } from "@/lib/supabase/settings";
import type { Order, OrderItem } from "@/types/supabase";

const BLING_API_BASE_URL = "https://api.bling.com.br/Api/v3";
const BLING_OAUTH_BASE_URL = "https://www.bling.com.br/Api/v3";

const CLIENT_ID = process.env.BLING_CLIENT_ID;
const CLIENT_SECRET = process.env.BLING_CLIENT_SECRET;

// Renova um pouco antes do vencimento real, pra evitar corrida com chamadas em andamento.
const TOKEN_REFRESH_MARGIN_MS = 60_000;

export class BlingError extends Error {}

// ─── OAuth ───────────────────────────────────────────────────────────────────

interface BlingTokenSet {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

function requireClientCredentials(): { clientId: string; clientSecret: string } {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new BlingError("BLING_CLIENT_ID / BLING_CLIENT_SECRET não configurados");
  }
  return { clientId: CLIENT_ID, clientSecret: CLIENT_SECRET };
}

function basicAuthHeader(clientId: string, clientSecret: string): string {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

async function persistTokens(tokens: BlingTokenSet): Promise<void> {
  const expiresAt = Date.now() + (tokens.expires_in ?? 3600) * 1000;
  await upsertSetting("bling_access_token", tokens.access_token);
  // O Bling nem sempre devolve um novo refresh_token a cada renovação — só sobrescreve quando vier um.
  if (tokens.refresh_token) {
    await upsertSetting("bling_refresh_token", tokens.refresh_token);
  }
  await upsertSetting("bling_token_expires_at", String(expiresAt));
}

async function requestToken(body: Record<string, string>): Promise<BlingTokenSet> {
  const { clientId, clientSecret } = requireClientCredentials();

  const response = await fetch(`${BLING_OAUTH_BASE_URL}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization:    basicAuthHeader(clientId, clientSecret),
      "Content-Type":   "application/x-www-form-urlencoded",
      "enable-jwt":     "1",
    },
    body: new URLSearchParams(body),
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.access_token) {
    const message = data?.error_description ?? data?.error ?? `HTTP ${response.status}`;
    throw new BlingError(`Bling OAuth (${response.status}): ${message}`);
  }

  await persistTokens(data);
  return data as BlingTokenSet;
}

export function getAuthorizationUrl(state: string, redirectUri: string): string {
  const { clientId } = requireClientCredentials();
  const url = new URL(`${BLING_OAUTH_BASE_URL}/oauth/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("state", state);
  url.searchParams.set("redirect_uri", redirectUri);
  return url.toString();
}

export async function exchangeAuthorizationCode(code: string): Promise<void> {
  await requestToken({ grant_type: "authorization_code", code });
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = await getSetting("bling_refresh_token");
  if (!refreshToken) {
    throw new BlingError("Bling desconectado — conecte novamente em Configurações.");
  }
  const tokens = await requestToken({ grant_type: "refresh_token", refresh_token: refreshToken });
  return tokens.access_token;
}

async function getValidAccessToken(): Promise<string> {
  const [accessToken, expiresAtRaw] = await Promise.all([
    getSetting("bling_access_token"),
    getSetting("bling_token_expires_at"),
  ]);

  const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : 0;
  if (accessToken && Date.now() < expiresAt - TOKEN_REFRESH_MARGIN_MS) {
    return accessToken;
  }

  return refreshAccessToken();
}

export async function isBlingConnected(): Promise<boolean> {
  return !!(await getSetting("bling_refresh_token"));
}

export async function disconnectBling(): Promise<void> {
  const refreshToken = await getSetting("bling_refresh_token");
  if (refreshToken && CLIENT_ID && CLIENT_SECRET) {
    try {
      await fetch(`${BLING_OAUTH_BASE_URL}/oauth/revoke`, {
        method: "POST",
        headers: {
          Authorization:  basicAuthHeader(CLIENT_ID, CLIENT_SECRET),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ token: refreshToken, token_type_hint: "refresh_token" }),
      });
    } catch {
      // Melhor esforço — mesmo se a revogação falhar, limpamos os tokens locais abaixo.
    }
  }
  await upsertSetting("bling_access_token", null);
  await upsertSetting("bling_refresh_token", null);
  await upsertSetting("bling_token_expires_at", null);
}

// ─── Cliente HTTP de recursos ────────────────────────────────────────────────

async function blingFetch<T = unknown>(
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<T> {
  const doFetch = async (accessToken: string) =>
    fetch(`${BLING_API_BASE_URL}${path}`, {
      method: init.method ?? "GET",
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        "enable-jwt":   "1",
        "Content-Type": "application/json",
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });

  let accessToken = await getValidAccessToken();
  let response = await doFetch(accessToken);

  if (response.status === 401) {
    accessToken = await refreshAccessToken();
    response = await doFetch(accessToken);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      data?.error?.description ?? data?.error?.message ?? data?.message ?? `HTTP ${response.status}`;
    throw new BlingError(`Bling (${response.status}) ${path}: ${message}`);
  }

  return data as T;
}

// ─── Catálogos auxiliares (para os dropdowns do admin) ──────────────────────

export interface BlingOption {
  id: number;
  descricao: string;
}

export async function getNaturezasDeOperacoes(): Promise<BlingOption[]> {
  const res = await blingFetch<{ data: { id: number; descricao: string }[] }>(
    "/naturezas-operacoes?limite=100"
  );
  return res.data ?? [];
}

export async function getFormasDePagamento(): Promise<BlingOption[]> {
  const res = await blingFetch<{ data: { id: number; descricao: string }[] }>(
    "/formas-pagamentos?limite=100"
  );
  return res.data ?? [];
}

// ─── Emissão de NF-e ─────────────────────────────────────────────────────────

interface NfeCreateResult {
  id: number;
  numero?: string;
}

interface NfeFindResult {
  situacao?: number;
  numero?: string;
  chaveAcesso?: string;
  linkDanfe?: string;
}

function onlyDigits(value?: string | null): string {
  return (value ?? "").replace(/\D/g, "");
}

function tipoPessoaFromDocument(document: string): "F" | "J" {
  return onlyDigits(document).length === 14 ? "J" : "F";
}

function countryName(code?: string): string {
  return !code || code === "BR" ? "Brasil" : code;
}

async function buildNfePayload(order: Order, items: OrderItem[]) {
  const [naturezaOperacaoId, formaPagamentoId, ncmPadrao] = await Promise.all([
    getSetting("bling_natureza_operacao_id"),
    getSetting("bling_forma_pagamento_id"),
    getSetting("bling_ncm_padrao"),
  ]);

  if (!naturezaOperacaoId || !formaPagamentoId) {
    throw new BlingError(
      "Configure a Natureza de Operação e a Forma de Pagamento do Bling em Configurações antes de emitir notas."
    );
  }

  const missing: string[] = [];
  if (!order.document) missing.push("CPF/CNPJ");
  if (!order.shipping_street) missing.push("endereço");
  if (!order.shipping_neighborhood) missing.push("bairro");
  if (!order.shipping_city) missing.push("cidade");
  if (!order.shipping_state) missing.push("UF");
  if (!order.shipping_zipcode) missing.push("CEP");
  if (missing.length > 0) {
    throw new BlingError(`Pedido sem dados obrigatórios para a NF-e: ${missing.join(", ")}.`);
  }

  const supabase = createAdminClient();
  const productIds = items.map((i) => i.product_id).filter((id): id is string => !!id);
  const ncmByProduct = new Map<string, string | null>();
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("id, ncm")
      .in("id", productIds);
    (products ?? []).forEach((p: { id: string | number; ncm: string | null }) =>
      ncmByProduct.set(String(p.id), p.ncm)
    );
  }

  const rawSubtotal = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  const shippingCost = order.shipping_cost ?? 0;
  // Mesma derivação usada no retry de pagamento: o desconto do cupom não fica
  // salvo isoladamente, então recuperamos comparando com o total final do pedido.
  const discount = Math.max(0, Math.round((rawSubtotal + shippingCost - order.total) * 100) / 100);

  const itens = items.map((item) => {
    const ncm = (item.product_id && ncmByProduct.get(String(item.product_id))) || ncmPadrao;
    if (!ncm) {
      throw new BlingError(
        `Produto "${item.product_name_snapshot}" sem NCM definido e nenhum NCM padrão configurado.`
      );
    }
    return {
      codigo:              item.product_id ? String(item.product_id) : String(item.id),
      descricao:           item.product_name_snapshot,
      unidade:             "UN",
      quantidade:          item.quantity,
      valor:               item.unit_price,
      classificacaoFiscal: ncm,
      origem:              0,
    };
  });

  return {
    tipo:       1 as const,
    dataOperacao: (order.ordered_at ?? new Date().toISOString()).slice(0, 10),
    contato: {
      nome:           order.billing_name || order.customer_name,
      tipoPessoa:     tipoPessoaFromDocument(order.document!),
      numeroDocumento: onlyDigits(order.document),
      contribuinte:   9 as const,
      email:          order.customer_email,
      endereco: {
        endereco:   order.shipping_street!,
        numero:     order.shipping_number,
        complemento: order.shipping_complement,
        bairro:     order.shipping_neighborhood!,
        cep:        onlyDigits(order.shipping_zipcode),
        municipio:  order.shipping_city!,
        uf:         order.shipping_state,
        pais:       countryName(order.shipping_country),
      },
    },
    naturezaOperacao: { id: Number(naturezaOperacaoId) },
    desconto:  discount > 0 ? discount : undefined,
    itens,
    parcelas: [
      {
        data:  new Date().toISOString().slice(0, 10),
        valor: order.total,
        formaPagamento: { id: Number(formaPagamentoId) },
      },
    ],
    transporte: shippingCost > 0
      ? { fretePorConta: 0 as const, frete: shippingCost, volumes: [] }
      : { volumes: [] },
  };
}

/**
 * Emite a NF-e de um pedido: cria (se ainda não existir) e transmite à SEFAZ.
 * Reaproveita `bling_nfe_id` em pedidos já criados para não duplicar notas
 * quando o admin reemite após uma falha no envio.
 */
export async function emitNfeForOrder(orderId: string): Promise<void> {
  const supabase = createAdminClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();
  if (orderError || !order) throw new BlingError(`Pedido ${orderId} não encontrado`);

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);
  if (itemsError) throw new BlingError(`Falha ao buscar itens do pedido: ${itemsError.message}`);
  if (!items || items.length === 0) throw new BlingError("Pedido sem itens para emitir NF-e");

  try {
    let nfeId: number = order.bling_nfe_id;

    if (!nfeId) {
      const payload = await buildNfePayload(order as Order, items as OrderItem[]);
      const created = await blingFetch<{ data: NfeCreateResult }>("/nfe", {
        method: "POST",
        body:   payload,
      });
      nfeId = created.data.id;
      await supabase.from("orders").update({ bling_nfe_id: nfeId }).eq("id", orderId);
    }

    await blingFetch(`/nfe/${nfeId}/enviar`, { method: "POST", body: {} });

    const found = await blingFetch<{ data: NfeFindResult }>(`/nfe/${nfeId}`);
    await supabase
      .from("orders")
      .update({
        bling_nfe_situacao:     found.data.situacao ?? null,
        bling_nfe_numero:       found.data.numero ?? null,
        bling_nfe_chave_acesso: found.data.chaveAcesso ?? null,
        bling_nfe_link_danfe:   found.data.linkDanfe ?? null,
        bling_nfe_error:        null,
        bling_nfe_emitted_at:   new Date().toISOString(),
      })
      .eq("id", orderId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha desconhecida ao emitir NF-e";
    await supabase.from("orders").update({ bling_nfe_error: message }).eq("id", orderId);
    throw error;
  }
}

/** Atualiza a situação de uma nota já criada — a transmissão à SEFAZ é assíncrona no Bling. */
export async function refreshNfeStatus(orderId: string): Promise<void> {
  const supabase = createAdminClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("bling_nfe_id")
    .eq("id", orderId)
    .single();
  if (error || !order?.bling_nfe_id) throw new BlingError("Pedido sem NF-e emitida");

  const found = await blingFetch<{ data: NfeFindResult }>(`/nfe/${order.bling_nfe_id}`);
  await supabase
    .from("orders")
    .update({
      bling_nfe_situacao:     found.data.situacao ?? null,
      bling_nfe_numero:       found.data.numero ?? null,
      bling_nfe_chave_acesso: found.data.chaveAcesso ?? null,
      bling_nfe_link_danfe:   found.data.linkDanfe ?? null,
    })
    .eq("id", orderId);
}
