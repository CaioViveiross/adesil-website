import { createClient } from "@/lib/supabaseServer";
import type { Order, Client, OrderStatus } from "@/types/supabase";

async function getSupabase() {
  return await createClient();
}

// ==================== ORDERS ====================

export async function getOrders(limit = 50, offset = 0, status?: OrderStatus, customerId?: string) {
  const supabase = await getSupabase();
  let query = supabase
    .from("orders")
    .select("*")
    .order("date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  if (customerId) {
    query = query.eq("customer_id", customerId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getOrderById(id: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getOrdersByCustomer(customerName: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .ilike("customer", `%${customerName}%`)
    .order("date", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createOrder(order: Omit<Order, "id" | "created_at">) {
  const supabase = await getSupabase();
  const orderPayload = {
    ...order,
    date: order.date || new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("orders")
    .insert(orderPayload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateOrder(id: string, updates: Partial<Order>) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteOrder(id: string) {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("orders")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}

// ==================== CLIENTS ====================

export async function getClients(limit = 50, offset = 0) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("joined_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
}

export async function getClientById(id: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getClientByEmail(email: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("email", email)
    .single();

  if (error) throw error;
  return data;
}

export async function createClientRecord(client: Omit<Client, "id" | "created_at">) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("clients")
    .insert(client)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateClient(id: string, updates: Partial<Client>) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("clients")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteClient(id: string) {
  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}