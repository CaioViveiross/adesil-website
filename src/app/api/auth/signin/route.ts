import { NextRequest, NextResponse } from "next/server";
import { signIn } from "@/lib/supabase/auth";

// POST /api/auth/signin - Login
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const data = await signIn(email, password);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error signing in:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to sign in" },
      { status: 400 }
    );
  }
}