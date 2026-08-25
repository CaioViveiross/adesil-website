import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/supabase/auth";
import { isBlingConnected, getNaturezasDeOperacoes, getFormasDePagamento } from "@/lib/bling";

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const connected = await isBlingConnected();
  if (!connected) {
    return NextResponse.json({ connected: false, naturezasOperacoes: [], formasPagamento: [] });
  }

  try {
    const [naturezasOperacoes, formasPagamento] = await Promise.all([
      getNaturezasDeOperacoes(),
      getFormasDePagamento(),
    ]);
    return NextResponse.json({ connected: true, naturezasOperacoes, formasPagamento });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao consultar o Bling";
    return NextResponse.json({ connected: true, error: message, naturezasOperacoes: [], formasPagamento: [] });
  }
}
