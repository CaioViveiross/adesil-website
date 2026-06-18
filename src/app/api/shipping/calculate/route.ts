import { NextRequest, NextResponse } from "next/server";
import { calculateShipping, isCorreiosConfigured } from "@/lib/correios";

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

    const options = await calculateShipping(cep);

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
