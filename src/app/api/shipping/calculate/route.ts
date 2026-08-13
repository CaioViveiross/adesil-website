import { NextRequest, NextResponse } from "next/server";
import { calculateShipping, isCorreiosConfigured, getFallbackWeightGrams } from "@/lib/correios";
import { createClient } from "@/lib/supabaseServer";

interface RequestItem {
  product_id: string | number;
  quantity:   number;
}

/**
 * Soma o peso total (gramas) dos itens do carrinho a partir dos pesos
 * cadastrados por produto. Produtos sem peso usam o fallback global.
 */
async function resolveTotalWeight(rawItems: RequestItem[]): Promise<number> {
  const items = rawItems.filter(
    (i) => i && i.product_id != null && Number.isFinite(Number(i.quantity)) && Number(i.quantity) > 0
  );
  if (items.length === 0) return 0;

  const supabase = await createClient();
  const ids = items.map((i) => String(i.product_id));
  const { data: products } = await supabase
    .from("products")
    .select("id, weight_grams")
    .in("id", ids);

  const weightMap = new Map(
    (products ?? []).map((p) => [String(p.id), p.weight_grams])
  );
  const fallback = await getFallbackWeightGrams();

  let total = 0;
  for (const item of items) {
    const raw = weightMap.get(String(item.product_id));
    const unit = raw && Number(raw) > 0 ? Number(raw) : fallback;
    total += unit * Number(item.quantity);
  }
  return total;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cep: string = typeof body?.cep === "string" ? body.cep : "";

    if (cep.replace(/\D/g, "").length !== 8) {
      return NextResponse.json({ error: "CEP inválido" }, { status: 400 });
    }

    if (!(await isCorreiosConfigured())) {
      return NextResponse.json(
        { error: "Cálculo de frete não configurado" },
        { status: 503 }
      );
    }

    const rawItems: RequestItem[] = Array.isArray(body?.items) ? body.items : [];
    const totalWeight = await resolveTotalWeight(rawItems);

    const options = await calculateShipping(cep, totalWeight);

    if (options.length === 0) {
      return NextResponse.json(
        { error: "Não foi possível calcular o frete para este CEP. Verifique o CEP informado." },
        { status: 422 }
      );
    }

    return NextResponse.json({ options });
  } catch (error) {
    console.error("Shipping calculation error:", error);
    return NextResponse.json({ error: "Erro ao calcular frete" }, { status: 500 });
  }
}
