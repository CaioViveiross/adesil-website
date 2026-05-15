import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function GET(request: NextRequest) {
  const code = new URL(request.url).searchParams.get("code");
  if (!code?.trim()) {
    return NextResponse.json({ error: "Código não informado" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("coupons")
    .select("type, value, is_active, max_uses, uses_count, expires_at")
    .eq("code", code.trim().toUpperCase())
    .single();

  if (!data || !data.is_active) {
    return NextResponse.json({ error: "Cupom inválido ou inativo" }, { status: 404 });
  }
  if (data.max_uses !== null && data.uses_count >= data.max_uses) {
    return NextResponse.json({ error: "Cupom esgotado" }, { status: 400 });
  }
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: "Cupom expirado" }, { status: 400 });
  }

  return NextResponse.json({ type: data.type, value: Number(data.value) });
}
