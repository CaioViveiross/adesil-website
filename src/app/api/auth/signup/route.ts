import { NextRequest, NextResponse } from "next/server";
import { signUp } from "@/lib/supabase/auth";

// POST /api/auth/signup - Cadastro
export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password and name are required" },
        { status: 400 }
      );
    }

    const data = await signUp(email, password, name);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error signing up:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to sign up" },
      { status: 400 }
    );
  }
}