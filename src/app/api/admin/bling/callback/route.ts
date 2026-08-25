import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/supabase/auth";
import { exchangeAuthorizationCode } from "@/lib/bling";

export async function GET(request: NextRequest) {
  const requestOrigin = request.headers.get("origin") || new URL(request.url).origin;
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || requestOrigin;
  const settingsUrl = new URL("/admin/configuracoes", appBaseUrl);

  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    settingsUrl.searchParams.set("bling", "error");
    settingsUrl.searchParams.set("bling_message", "Acesso negado");
    return NextResponse.redirect(settingsUrl);
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const expectedState = request.cookies.get("bling_oauth_state")?.value;

  const response = (result: "connected" | "error", message?: string) => {
    settingsUrl.searchParams.set("bling", result);
    if (message) settingsUrl.searchParams.set("bling_message", message);
    const res = NextResponse.redirect(settingsUrl);
    res.cookies.delete({ name: "bling_oauth_state", path: "/api/admin/bling" });
    return res;
  };

  if (!code || !state || !expectedState || state !== expectedState) {
    return response("error", "Estado de autorização inválido — tente conectar novamente.");
  }

  try {
    await exchangeAuthorizationCode(code);
    return response("connected");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao conectar ao Bling";
    return response("error", message);
  }
}
