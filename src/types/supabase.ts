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
  /** Slug da categoria real para onde o card leva; null quando ela não está publicada. */
  slug?: string | null;
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
  /** Categoria principal — define breadcrumb e URL canônica. Espelha `category_ids[0]`. */
  category_id?: number;
  /** Todas as categorias do produto (tabela `product_categories`). */
  category_ids?: number[];
  is_featured?: boolean;
  tags?: string[];
  /** Estoque disponível. `null` = produto sem controle de estoque (venda livre). */
  stock_quantity?: number | null;
  /** Descrição estruturada (padrão da loja). `description` segue como apresentação breve. */
  description_sections?: ProductDescriptionSections;
  /** Peso unitário em gramas, usado no cálculo individual de frete. */
  weight_grams?: number;
  /** Classificação fiscal (NCM). Quando vazio, a emissão de NF-e usa o "bling_ncm_padrao" das configurações. */
  ncm?: string;
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
  shipping_neighborhood?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_country?: string;
  shipping_cost?: number;
  /** Cupom aplicado no checkout. O uso só é creditado quando o pagamento aprova. */
  coupon_code?: string | null;
  /** Desconto do cupom em R$, já embutido em `total`. */
  discount_amount?: number;
  tracking_code?: string;
  tracking_carrier?: string;
  internal_notes?: string;
  /** ID da NF-e no Bling (rascunho ou emitida). */
  bling_nfe_id?: number;
  /** Situação da NF-e no Bling — ver `bling_nfe_situacao_labels` em lib/bling.ts. */
  bling_nfe_situacao?: number;
  bling_nfe_numero?: string;
  bling_nfe_chave_acesso?: string;
  bling_nfe_link_danfe?: string;
  bling_nfe_error?: string;
  bling_nfe_emitted_at?: string;
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
  shipping_neighborhood?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_country?: string;
  created_at?: string;
  updated_at?: string;
}

export const blingNfeSituacaoLabels: Record<number, { label: string; color: string }> = {
  1:  { label: "Pendente",              color: "bg-yellow-100 text-yellow-800" },
  2:  { label: "Cancelada",             color: "bg-gray-100 text-gray-700"     },
  3:  { label: "Aguardando recibo",     color: "bg-sky-100 text-primary"       },
  4:  { label: "Rejeitada",             color: "bg-red-100 text-red-800"       },
  5:  { label: "Autorizada",            color: "bg-green-100 text-green-800"   },
  6:  { label: "Emitida DANFE",         color: "bg-green-100 text-green-800"   },
  7:  { label: "Registrada",            color: "bg-sky-100 text-primary"       },
  8:  { label: "Aguardando protocolo",  color: "bg-yellow-100 text-yellow-800" },
  9:  { label: "Denegada",              color: "bg-red-100 text-red-800"       },
  10: { label: "Consulta situação",     color: "bg-gray-100 text-gray-700"     },
  11: { label: "Bloqueada",             color: "bg-red-100 text-red-800"       },
};

export const statusLabels: Record<OrderStatus, { label: string; color: string }> = {
  pending:    { label: "Pendente",     color: "bg-yellow-100 text-yellow-800"  },
  processing: { label: "Processando",  color: "bg-sky-100 text-primary"        },
  shipped:    { label: "Enviado",      color: "bg-purple-100 text-purple-800"  },
  delivered:  { label: "Entregue",     color: "bg-green-100 text-green-800"    },
  failed:     { label: "Falhou",       color: "bg-red-100 text-red-800"        },
  refunded:   { label: "Reembolsado",  color: "bg-orange-100 text-orange-800"  },
  cancelled:  { label: "Cancelado",    color: "bg-gray-100 text-gray-700"      },
};
