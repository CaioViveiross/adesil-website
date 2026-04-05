import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile, getAllProfiles, updateProfile } from "@/lib/supabase/auth";

// GET /api/auth/profile - Perfil do usuário atual
export async function GET() {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT /api/auth/profile - Atualizar perfil
export async function PUT(request: NextRequest) {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const updatedProfile = await updateProfile(profile.id, body);

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}