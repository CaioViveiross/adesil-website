import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/supabase/auth";
import { getAllSettings, upsertSetting } from "@/lib/supabase/settings";

// Keys that may be written via admin panel — credentials stay in .env
const ALLOWED_KEYS = new Set([
  "correios_origin_zip",
  "correios_weight_grams",
  "shipping_free_above",
  "banner_text",
  "banner_active",
  "banner_color",
]);

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") return null;
  return profile;
}

export async function GET() {
  try {
    const profile = await requireAdmin();
    if (!profile) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

    const settings = await getAllSettings();
    // Only return non-credential settings
    return NextResponse.json(settings.filter((s) => ALLOWED_KEYS.has(s.key)));
  } catch {
    return NextResponse.json({ error: "Erro ao buscar configurações" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const profile = await requireAdmin();
    if (!profile) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

    const body = await request.json();
    const { key, value } = body;

    if (!key || typeof key !== "string" || !ALLOWED_KEYS.has(key)) {
      return NextResponse.json({ error: "Chave inválida ou não permitida" }, { status: 400 });
    }

    await upsertSetting(key, value === "" ? null : String(value ?? ""));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao salvar configuração" }, { status: 500 });
  }
}
