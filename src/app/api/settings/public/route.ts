import { NextResponse } from "next/server";
import { getSettings } from "@/lib/supabase/settings";

// Public endpoint — returns only non-sensitive UI config (banner).
// No auth required; no credentials or internal keys exposed.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({
      banner_text:          settings.get("banner_text")          ?? null,
      banner_active:        settings.get("banner_active")        === "true",
      banner_color:         settings.get("banner_color")         ?? null,
      shipping_free_above:  settings.get("shipping_free_above")  ?? null,
    });
  } catch {
    return NextResponse.json({ banner_text: null, banner_active: false, banner_color: null, shipping_free_above: null });
  }
}
