export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  badge?: string;
  specs: string;
  customizable: boolean;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  description: string;
}

export interface Order {
  id: string;
  date: string;
  status: "pending" | "processing" | "shipped" | "delivered";
  total: number;
  items: number;
  customer: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  orders: number;
  totalSpent: number;
  joinedAt: string;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Etiqueta Adesiva 10x15 100x150",
    description: "Etiqueta térmica de alta qualidade para impressão direta. Ideal para logística e envios.",
    price: 173.99,
    originalPrice: 194.99,
    image: "/product-1",
    category: "adesivas",
    badge: "Mais Vendido",
    specs: "10 Rolos Etiqueta 10x15 100x150 Térmica Ent. Pla Economy Cor...",
    customizable: true,
  },
  {
    id: "2",
    name: "Etiqueta para Balança Filizola",
    description: "Etiqueta compatível com balanças Filizola. Perfeita para açougues e mercados.",
    price: 173.99,
    originalPrice: 194.99,
    image: "/product-2",
    category: "balanca",
    specs: "10 Rolos Etiqueta 10x15 100x150 Térmica Ent. Pla Economy Cor...",
    customizable: true,
  },
  {
    id: "3",
    name: "Ribbon Cera 110x91",
    description: "Ribbon de alta performance para impressão por transferência térmica.",
    price: 173.99,
    image: "/product-3",
    category: "ribbons",
    specs: "10 Rolos Etiqueta 10x15 100x150 Térmica Ent. Pla Economy Cor...",
    customizable: false,
  },
  {
    id: "4",
    name: "Etiqueta Couchê 100x50",
    description: "Etiqueta couchê para impressão profissional com acabamento premium.",
    price: 173.99,
    originalPrice: 194.99,
    image: "/product-4",
    category: "couche",
    specs: "10 Rolos Etiqueta 10x15 100x150 Térmica Ent. Pla Economy Cor...",
    customizable: true,
  },
  {
    id: "5",
    name: "Etiqueta BOPP 50x30",
    description: "Etiqueta resistente à água e solventes. Ideal para indústria alimentícia.",
    price: 215.99,
    image: "/product-5",
    category: "adesivas",
    customizable: true,
    specs: "Etiqueta BOPP 50x30mm alta resistência",
  },
  {
    id: "6",
    name: "Etiqueta Personalizada Nome",
    description: "Etiquetas personalizáveis com seu nome e design. Escolha cores, fontes e estilos.",
    price: 89.99,
    image: "/product-6",
    category: "personalizadas",
    badge: "Personalizável",
    customizable: true,
    specs: "Etiqueta personalizada com nome e design exclusivo",
  },
  {
    id: "7",
    name: "Ribbon Misto 110x300",
    description: "Ribbon misto para etiquetas couchê e BOPP. Alta durabilidade.",
    price: 289.99,
    image: "/product-7",
    category: "ribbons",
    customizable: false,
    specs: "Ribbon misto premium 110x300m",
  },
  {
    id: "8",
    name: "Etiqueta Hospitalar Pulseira",
    description: "Pulseira de identificação hospitalar. Resistente e segura.",
    price: 342.99,
    image: "/product-8",
    category: "hospitalar",
    customizable: false,
    specs: "Pulseira de identificação para ambiente hospitalar",
  },
];

export const categories: Category[] = [
  { id: "adesivas", name: "Etiquetas Adesivas", image: "/cat-adesivas", description: "Etiquetas autoadesivas para diversas aplicações" },
  { id: "balanca", name: "Etiquetas para Balança", image: "/cat-balanca", description: "Compatíveis com as principais marcas" },
  { id: "ribbons", name: "Ribbons", image: "/cat-ribbons", description: "Ribbons para impressão por transferência térmica" },
  { id: "couche", name: "Couchê", image: "/cat-couche", description: "Etiquetas com acabamento premium" },
  { id: "personalizadas", name: "Personalizadas", image: "/cat-personalizadas", description: "Crie etiquetas com seu design" },
  { id: "hospitalar", name: "Hospitalar", image: "/cat-hospitalar", description: "Soluções para identificação hospitalar" },
];

export const businessCategories = [
  { id: "acougue", name: "Açougues", image: "/biz-acougue" },
  { id: "mercado", name: "Mercados", image: "/biz-mercado" },
  { id: "hospitalar", name: "Hospitalar", image: "/biz-hospitalar" },
  { id: "papelaria", name: "Arte e Papelaria", image: "/biz-papelaria" },
];

export const mockOrders: Order[] = [
  { id: "PED-001", date: "2024-03-15", status: "delivered", total: 521.97, items: 3, customer: "Maria Silva" },
  { id: "PED-002", date: "2024-03-14", status: "shipped", total: 173.99, items: 1, customer: "João Santos" },
  { id: "PED-003", date: "2024-03-13", status: "processing", total: 863.94, items: 4, customer: "Ana Costa" },
  { id: "PED-004", date: "2024-03-12", status: "pending", total: 347.98, items: 2, customer: "Carlos Oliveira" },
  { id: "PED-005", date: "2024-03-11", status: "delivered", total: 1042.95, items: 5, customer: "Fernanda Lima" },
  { id: "PED-006", date: "2024-03-10", status: "delivered", total: 289.99, items: 1, customer: "Roberto Alves" },
];

export const mockClients: Client[] = [
  { id: "1", name: "Maria Silva", email: "maria@email.com", orders: 12, totalSpent: 4250.80, joinedAt: "2023-06-15" },
  { id: "2", name: "João Santos", email: "joao@email.com", orders: 8, totalSpent: 2890.50, joinedAt: "2023-08-20" },
  { id: "3", name: "Ana Costa", email: "ana@email.com", orders: 15, totalSpent: 6120.00, joinedAt: "2023-03-10" },
  { id: "4", name: "Carlos Oliveira", email: "carlos@email.com", orders: 5, totalSpent: 1450.25, joinedAt: "2024-01-05" },
  { id: "5", name: "Fernanda Lima", email: "fernanda@email.com", orders: 20, totalSpent: 8900.00, joinedAt: "2022-11-30" },
];

export const labelFonts = [
  { id: "sans", name: "Moderna", fontFamily: "'Plus Jakarta Sans', sans-serif" },
  { id: "serif", name: "Clássica", fontFamily: "Georgia, serif" },
  { id: "mono", name: "Técnica", fontFamily: "'Courier New', monospace" },
  { id: "cursive", name: "Elegante", fontFamily: "'Segoe Script', cursive" },
];

export const labelColors = [
  { id: "blue", name: "Azul", hex: "#005DDA" },
  { id: "black", name: "Preto", hex: "#1a1a2e" },
  { id: "red", name: "Vermelho", hex: "#dc2626" },
  { id: "green", name: "Verde", hex: "#16a34a" },
  { id: "orange", name: "Laranja", hex: "#ea580c" },
  { id: "purple", name: "Roxo", hex: "#7c3aed" },
  { id: "pink", name: "Rosa", hex: "#db2777" },
  { id: "gold", name: "Dourado", hex: "#ca8a04" },
];

export const statusLabels: Record<Order["status"], { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  processing: { label: "Processando", color: "bg-blue-100 text-blue-800" },
  shipped: { label: "Enviado", color: "bg-purple-100 text-purple-800" },
  delivered: { label: "Entregue", color: "bg-green-100 text-green-800" },
};
