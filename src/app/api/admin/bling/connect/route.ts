import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/supabase/auth";
import { getAuthorizationUrl } from "@/lib/bling";

export async function GET(request: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const requestOrigin = request.headers.get("origin") || new URL(request.url).origin;
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || requestOrigin;
  const redirectUri = `${appBaseUrl}/api/admin/bling/callback`;

  const state = crypto.randomBytes(24).toString("hex");

  let authorizationUrl: string;
  try {
    authorizationUrl = getAuthorizationUrl(state, redirectUri);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bling não configurado";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set("bling_oauth_state", state, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   300,
    path:     "/api/admin/bling",
  });
  return response;
}
