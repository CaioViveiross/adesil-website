import { NextRequest, NextResponse } from "next/server";
import { getOrderById, getOrderItems } from "@/lib/supabase/orders";
import { getCurrentProfile } from "@/lib/supabase/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    // Verify ownership before returning items
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }
    if (order.customer_id !== profile.id && profile.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const items = await getOrderItems(id);
    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching order items:", error);
    return NextResponse.json({ error: "Falha ao buscar itens do pedido" }, { status: 500 });
  }
}
