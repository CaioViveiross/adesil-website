import { NextRequest, NextResponse } from "next/server";
import { createContactMessage } from "@/lib/supabase/contactMessages";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim();
    const phone = String(body?.phone ?? "").trim();
    const message = String(body?.message ?? "").trim();

    if (!name || !email || !phone || !message) {
      return NextResponse.json(
        { error: "Preencha nome, e-mail, telefone e mensagem." },
        { status: 400 }
      );
    }

    const contactMessage = await createContactMessage({
      name,
      email,
      phone,
      message,
    });

    return NextResponse.json(contactMessage, { status: 201 });
  } catch (error) {
    console.error("Error creating contact message:", error);
    return NextResponse.json(
      { error: "Falha ao salvar mensagem de contato." },
      { status: 500 }
    );
  }
}