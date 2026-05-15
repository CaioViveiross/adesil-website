import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabaseAdmin";

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const db = createAdminClient();
  const { data, error } = await db
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json();
  const { code, type, value, description, max_uses, expires_at } = body;

  if (!code?.trim() || !type || !value) {
    return NextResponse.json({ error: "Campos obrigatórios: code, type, value" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data, error } = await db
    .from("coupons")
    .insert({ code: code.trim().toUpperCase(), type, value: Number(value), description, max_uses: max_uses || null, expires_at: expires_at || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
