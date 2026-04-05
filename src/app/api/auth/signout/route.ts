import { NextRequest, NextResponse } from "next/server";
import { signOut } from "@/lib/supabase/auth";

// POST /api/auth/signout - Logout
export async function POST() {
  try {
    await signOut();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error signing out:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to sign out" },
      { status: 500 }
    );
  }
}