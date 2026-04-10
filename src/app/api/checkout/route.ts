import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/supabase/orders";
import { getCurrentProfile, updateProfile } from "@/lib/supabase/auth";
import type { Order } from "@/types/supabase";

export async function POST(request: NextRequest) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      customer_name,
      document,
      company_name,
      shipping_zipcode,
      shipping_street,
      shipping_number,
      shipping_complement,
      shipping_city,
      shipping_state,
      shipping_country,
      items,
      total,
      items_detail,
      shipping_cost,
    } = body;

    await updateProfile(profile.id, {
      document,
      company_name,
      shipping_zipcode,
      shipping_street,
      shipping_number,
      shipping_complement,
      shipping_city,
      shipping_state,
      shipping_country,
    });

    const order = await createOrder({
      customer: customer_name || profile.name || profile.email,
      billing_name: customer_name || profile.name || profile.email,
      customer_id: profile.id,
      customer_email: profile.email,
      document,
      company_name,
      shipping_zipcode,
      shipping_street,
      shipping_number,
      shipping_complement,
      shipping_city,
      shipping_state,
      shipping_country: shipping_country || "BR",
      items,
      total,
      items_detail,
      shipping_cost,
      status: "pending",
    } as Omit<Order, "id" | "created_at">);

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating checkout order:", error);
    return NextResponse.json(
      { error: "Failed to create checkout order" },
      { status: 500 }
    );
  }
}
