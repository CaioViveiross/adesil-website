import { NextRequest, NextResponse } from "next/server";
import { getClients, createClientRecord } from "@/lib/supabase/orders";

// GET /api/clients - Listar clientes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const clients = await getClients(limit, offset);
    return NextResponse.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

// POST /api/clients - Criar cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = await createClientRecord(body);

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}