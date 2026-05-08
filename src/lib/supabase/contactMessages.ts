import { createClient } from "@/lib/supabaseServer";
import type { ContactMessage } from "@/types/supabase";

async function getSupabase() {
  return await createClient();
}

export async function getContactMessages(limit = 50, offset = 0) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data || [];
}

export async function createContactMessage(
  contactMessage: Omit<ContactMessage, "id" | "created_at">
) {
  const supabase = await getSupabase();
  const payload = {
    ...contactMessage,
    name: contactMessage.name.trim(),
    email: contactMessage.email.trim(),
    phone: contactMessage.phone.trim(),
    message: contactMessage.message.trim(),
  };

  const { data, error } = await supabase
    .from("contact_messages")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}