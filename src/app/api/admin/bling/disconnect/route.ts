import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/supabase/auth";
import { disconnectBling } from "@/lib/bling";

export async function POST() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  await disconnectBling();
  return NextResponse.json({ success: true });
}
