// Tipos baseados no schema do Supabase
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered';
export type UserRole = 'admin' | 'customer';

// Categories
export interface Category {
  id: number;
  name: string;
  image?: string;
  description?: string;
}

export interface BusinessCategory {
  id: number;
  name: string;
  image?: string;
}

// Products
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  image?: string;
  category?: number;
  tags?: string;
  business_categories?: number[]; // Array de IDs de categorias de negócio
  created_at?: string;
}

// Product Business Category relation (many-to-many)
export interface ProductBusinessCategory {
  id: string;
  product_id: string;
  business_category_id: string;
  created_at?: string;
}

// Clients
export interface Client {
  id: string;
  name: string;
  email: string;
  orders: number;
  total_spent: number;
  joined_at: string;
  created_at?: string;
}

// Orders
export interface Order {
  id: string;
  date: string;
  status: OrderStatus;
  total: number;
  items: number;
  customer: string;
  created_at?: string;
}

// Profiles (auth integration)
export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

// Status labels for UI
export const statusLabels: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  processing: { label: "Processando", color: "bg-sky-100 text-primary" },
  shipped: { label: "Enviado", color: "bg-purple-100 text-purple-800" },
  delivered: { label: "Entregue", color: "bg-green-100 text-green-800" },
};