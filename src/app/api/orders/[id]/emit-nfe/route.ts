import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/supabase/auth";
import { getOrderById } from "@/lib/supabase/orders";
import { emitNfeForOrder, refreshNfeStatus } from "@/lib/bling";

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") return null;
  return profile;
}

// POST — emite (ou reemite, se a criação já existir) a NF-e do pedido.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;
  try {
    await emitNfeForOrder(id);
    const order = await getOrderById(id);
    return NextResponse.json(order);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao emitir NF-e";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET — atualiza a situação de uma NF-e já criada (transmissão à SEFAZ é assíncrona no Bling).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;
  try {
    await refreshNfeStatus(id);
    const order = await getOrderById(id);
    return NextResponse.json(order);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao atualizar status da NF-e";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
