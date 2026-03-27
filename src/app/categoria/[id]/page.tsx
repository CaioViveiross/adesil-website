'use client';

import { useParams } from "next/navigation";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import { products, categories } from "@/data/mockData";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";

const sortOptions = [
  { id: "relevance", label: "Relevância" },
  { id: "price-asc", label: "Menor preço" },
  { id: "price-desc", label: "Maior preço" },
  { id: "name", label: "Nome A-Z" },
];

export default function CategoryPage() {
  const params = useParams();
  const id = params.id as string;
  const [sort, setSort] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);

  const category = categories.find((c) => c.id === id);
  const filtered = id === "todos"
    ? products
    : products.filter((p) => p.category === id);

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case "price-asc": return a.price - b.price;
      case "price-desc": return b.price - a.price;
      case "name": return a.name.localeCompare(b.name);
      default: return 0;
    }
  });

  return (
    <Layout>
      <div className="container py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{category?.name || "Todos os Produtos"}</h1>
          <p className="text-muted-foreground mt-1">{category?.description || "Explore nosso catálogo completo"}</p>
        </div>

        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" /> Filtros
          </Button>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Categorias:</span>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={cat.id === id ? "default" : "outline"}
                size="sm"
                asChild
              >
                <a href={`/categoria/${cat.id}`}>{cat.name}</a>
              </Button>
            ))}
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-sm border rounded-full px-4 py-2 bg-background"
          >
            {sortOptions.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>

        <p className="text-sm text-muted-foreground mb-6">{sorted.length} produto(s) encontrado(s)</p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {sorted.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {sorted.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            Nenhum produto encontrado nesta categoria.
          </div>
        )}
      </div>
    </Layout>
  );
}
