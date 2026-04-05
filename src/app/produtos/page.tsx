import { supabase } from "@/lib/supabaseClient";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category?: string;
  badge?: string;
};

export default async function ProdutosPage() {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, description, price, image, category, badge")
    .order("name", { ascending: true })
    .limit(20);

  if (error) {
    return (
      <main className="container py-20">
        <h1 className="text-2xl font-bold mb-4">Produtos</h1>
        <p className="text-red-600">Erro ao buscar produtos: {error.message}</p>
      </main>
    );
  }

  if (!data || data.length === 0) {
    return (
      <main className="container py-20">
        <h1 className="text-2xl font-bold mb-4">Produtos</h1>
        <p>Nenhum produto encontrado no Supabase.</p>
      </main>
    );
  }

  return (
    <main className="container py-20">
      <h1 className="text-2xl font-bold mb-6">Produtos do Supabase</h1>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((product) => (
          <li key={product.id} className="border rounded-xl p-4 shadow-sm">
            <h2 className="text-lg font-semibold">{product.name}</h2>
            <p className="text-sm text-muted-foreground mb-2">{product.category || "Categoria não informada"}</p>
            <p className="mb-2">{product.description}</p>
            <p className="font-bold">R$ {product.price?.toFixed(2).replace(".", ",")}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
