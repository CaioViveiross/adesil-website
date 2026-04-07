import { NextResponse } from "next/server";
import type { BusinessCategory } from "@/types/supabase";

// Categorias de negócio fixas
const businessCategoriesData: BusinessCategory[] = [
  { id: 1, name: "Logística", image: "/images/category-logistica.png" },
  { id: 2, name: "Comércio", image: "/images/category-comercio.png" },
  { id: 3, name: "Hospitalar", image: "/images/category-hospitalar.png" },
  { id: 4, name: "Indústria", image: "/images/category-industria.png" },
];

// GET /api/business-categories - Listar categorias de negócio (dados fixos)
export async function GET() {
  try {
    return NextResponse.json(businessCategoriesData);
  } catch (error) {
    console.error("Error fetching business categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch business categories" },
      { status: 500 }
    );
  }
}

// POST /api/business-categories - Não permitido (categorias são fixas)
export async function POST() {
  return NextResponse.json(
    { error: "Business categories are fixed and cannot be created" },
    { status: 403 }
  );
}