import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrder, deleteOrder } from "@/lib/supabase/orders";
import type { OrderStatus } from "@/types/supabase";

// GET /api/orders/[id] - Buscar pedido por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await getOrderById(id);
    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Order not found" },
      { status: 404 }
    );
  }
}

// PATCH /api/orders/[id] - Atualizar status do pedido
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // When status changes, append an entry to status_history
    if (body.status) {
      const current = await getOrderById(id);
      const history: Array<{ status: OrderStatus; changed_at: string }> =
        Array.isArray(current?.status_history) ? current.status_history : [];
      body.status_history = [
        ...history,
        { status: body.status as OrderStatus, changed_at: new Date().toISOString() },
      ];
    }

    const order = await updateOrder(id, body);
    return NextResponse.json(order);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

// PUT /api/orders/[id] - Atualizar pedido completo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const order = await updateOrder(id, body);

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[id] - Deletar pedido
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteOrder(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}