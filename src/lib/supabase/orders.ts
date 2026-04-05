import { supabase } from "@/lib/supabaseClient";
import type { Order, Client, OrderStatus } from "@/types/supabase";

// ==================== ORDERS ====================

export async function getOrders(limit = 50, offset = 0, status?: OrderStatus) {
  let query = supabase
    .from("orders")
    .select("*")
    .order("date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getOrderById(id: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getOrdersByCustomer(customerName: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .ilike("customer", `%${customerName}%`)
    .order("date", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createOrder(order: Omit<Order, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("orders")
    .insert(order)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateOrder(id: string, updates: Partial<Order>) {
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
  const { error } = await supabase
    .from("orders")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}

// ==================== CLIENTS ====================

export async function getClients(limit = 50, offset = 0) {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("joined_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
}

export async function getClientById(id: string) {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getClientByEmail(email: string) {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("email", email)
    .single();

  if (error) throw error;
  return data;
}

export async function createClient(client: Omit<Client, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("clients")
    .insert(client)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateClient(id: string, updates: Partial<Client>) {
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