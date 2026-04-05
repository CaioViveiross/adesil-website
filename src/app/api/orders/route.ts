import { NextRequest, NextResponse } from "next/server";
import { getOrders, createOrder } from "@/lib/supabase/orders";
import type { OrderStatus } from "@/types/supabase";

// GET /api/orders - Listar pedidos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const statusParam = searchParams.get("status");

    const status = statusParam && ['pending', 'processing', 'shipped', 'delivered'].includes(statusParam)
      ? statusParam as OrderStatus
      : undefined;

    const orders = await getOrders(limit, offset, status);
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST /api/orders - Criar pedido
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const order = await createOrder(body);

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}