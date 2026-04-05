import { NextResponse } from "next/server";
import { getLabelFonts, getLabelColors } from "@/lib/supabase/auth";

// GET /api/label-customization - Buscar fontes e cores
export async function GET() {
  try {
    const [fonts, colors] = await Promise.all([
      getLabelFonts(),
      getLabelColors(),
    ]);

    return NextResponse.json({
      fonts,
      colors,
    });
  } catch (error) {
    console.error("Error fetching label customization:", error);
    return NextResponse.json(
      { error: "Failed to fetch label customization" },
      { status: 500 }
    );
  }
}