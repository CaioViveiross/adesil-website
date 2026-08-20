export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'failed' | 'refunded' | 'cancelled';
export type UserRole = 'admin' | 'customer';

export interface Category {
  id?: number;
  name: string;
  description?: string;
  slug?: string;
  is_active?: boolean;
  deleted_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BusinessCategory {
  id: number;
  name: string;
  image?: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  created_at?: string;
  updated_at?: string;
}

/** Par rótulo/valor da seção "Especificações". */
export interface ProductSpec {
  label: string;
  value: string;
}

/** Pergunta e resposta da seção "Dúvidas frequentes". */
export interface ProductFaq {
  question: string;
  answer: string;
}

/**
 * Descrição estruturada do produto, seguindo o padrão da loja.
 * Todas as seções são opcionais — só aparecem na página quando preenchidas.
 * A apresentação breve continua em `Product.description`.
 */
export interface ProductDescriptionSections {
  /** Principais benefícios — 3 a 6 itens objetivos. */
  benefits?: string[];
  /** Especificações técnicas (dimensões, material, cor, tipo, quantidade...). */
  specs?: ProductSpec[];
  /** Conteúdo da embalagem — o que o cliente efetivamente recebe. */
  package_contents?: string[];
  /** Compatibilidade / aplicações — equipamentos, softwares, plataformas. */
  compatibility?: string[];
  /** Indicação de uso — onde e para quem o produto é indicado. */
  usage?: string[];
  /** Dúvidas frequentes — opcional, só quando fizer sentido. */
  faq?: ProductFaq[];
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  discount?: number;
  /** Capa do produto — espelha `images[0]`. Usada em cards, carrinho e SEO. */
  image?: string;
  /** Galeria do produto, no máximo 4 itens, capa primeiro. */
  images?: string[];
  category_id?: number;
  is_featured?: boolean;
  tags?: string[];
  stock_quantity?: number;
  /** Descrição estruturada (padrão da loja). `description` segue como apresentação breve. */
  description_sections?: ProductDescriptionSections;
  /** Peso unitário em gramas, usado no cálculo individual de frete. */
  weight_grams?: number;
  is_active?: boolean;
  deleted_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  orders: number;
  total_spent: number;
  joined_at: string;
  created_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  product_name_snapshot: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at?: string;
}

export interface Order {
  id: string;
  ordered_at: string;
  status: OrderStatus;
  total: number;
  items: number;
  customer_name: string;
  customer_id?: string;
  customer_email?: string;
  document?: string;
  billing_name?: string;
  company_name?: string;
  shipping_zipcode?: string;
  shipping_street?: string;
  shipping_number?: string;
  shipping_complement?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_country?: string;
  shipping_cost?: number;
  tracking_code?: string;
  tracking_carrier?: string;
  internal_notes?: string;
  status_history?: Array<{ status: OrderStatus; changed_at: string }>;
  /** @deprecated Use order_items table instead. Kept for backward-compat while UI migrates. */
  items_detail?: Array<{
    product_id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  document?: string;
  company_name?: string;
  shipping_zipcode?: string;
  shipping_street?: string;
  shipping_number?: string;
  shipping_complement?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_country?: string;
  created_at?: string;
  updated_at?: string;
}

export const statusLabels: Record<OrderStatus, { label: string; color: string }> = {
  pending:    { label: "Pendente",     color: "bg-yellow-100 text-yellow-800"  },
  processing: { label: "Processando",  color: "bg-sky-100 text-primary"        },
  shipped:    { label: "Enviado",      color: "bg-purple-100 text-purple-800"  },
  delivered:  { label: "Entregue",     color: "bg-green-100 text-green-800"    },
  failed:     { label: "Falhou",       color: "bg-red-100 text-red-800"        },
  refunded:   { label: "Reembolsado",  color: "bg-orange-100 text-orange-800"  },
  cancelled:  { label: "Cancelado",    color: "bg-gray-100 text-gray-700"      },
};
