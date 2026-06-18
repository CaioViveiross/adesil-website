import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { trackObject } from "@/lib/correios";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const { id } = await params;
    const supabase = createAdminClient();

    const { data: order } = await supabase
      .from("orders")
      .select("customer_id, tracking_code, tracking_carrier")
      .eq("id", id)
      .single();

    if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

    if (profile.role !== "admin" && order.customer_id !== profile.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    if (!order.tracking_code) {
      return NextResponse.json({ tracking_code: null, tracking_carrier: null, events: [] });
    }

    try {
      const events = await trackObject(order.tracking_code);
      return NextResponse.json({
        tracking_code:    order.tracking_code,
        tracking_carrier: order.tracking_carrier ?? "Correios",
        events,
      });
    } catch {
      return NextResponse.json({
        tracking_code:    order.tracking_code,
        tracking_carrier: order.tracking_carrier ?? "Correios",
        events: [],
        api_error: "Rastreamento temporariamente indisponível",
      });
    }
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
