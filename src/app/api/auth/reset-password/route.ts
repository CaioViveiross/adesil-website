import { NextRequest, NextResponse } from "next/server";
import { resetPassword } from "@/lib/supabase/auth";

// POST /api/auth/reset-password - Reset de senha
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    await resetPassword(email);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to reset password" },
      { status: 500 }
    );
  }
}