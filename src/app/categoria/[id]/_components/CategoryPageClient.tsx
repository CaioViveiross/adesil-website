'use client';

import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import { Package, Search, X } from "lucide-react";
import type { Product, Category } from "@/types/supabase";
import { salePrice } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";

const sortOptions = [
  { id: "relevance",  label: "Relevância"  },
  { id: "price-asc",  label: "Menor preço" },
  { id: "price-desc", label: "Maior preço" },
  { id: "name",       label: "Nome A-Z"    },
];

const ProductSkeleton = () => (
  <div className="bg-card border border-border rounded-2xl overflow-hidden">
    <div className="aspect-square bg-muted animate-pulse" />
    <div className="p-4 space-y-3">
      <div className="h-3 bg-muted animate-pulse rounded-full w-3/4" />
      <div className="h-5 bg-muted animate-pulse rounded-full w-1/3" />
      <div className="h-9 bg-muted animate-pulse rounded-xl" />
    </div>
  </div>
);

interface CategoryPageClientProps {
  slug: string;
  initialSearch?: string;
}

export default function CategoryPageClient({ slug, initialSearch = "" }: CategoryPageClientProps) {
  const isTodos = slug === "todos";

  const [sort,       setSort]       = useState("relevance");
  const [products,   setProducts]   = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  const category = isTodos ? undefined : categories.find((c) => c.slug === slug);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/products"),
        ]);
        setCategories(catRes.ok ? await catRes.json() : []);
        setProducts(prodRes.ok ? await prodRes.json() : []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Sync searchTerm if initialSearch changes (e.g. new URL navigation)
  useEffect(() => {
    setSearchTerm(initialSearch);
  }, [initialSearch]);

  const filtered = (isTodos || !category
    ? products
    : products.filter((p) => p.category_id === category.id)
  ).filter((p) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      (Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(q)))
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case "price-asc":  return salePrice(a) - salePrice(b);
      case "price-desc": return salePrice(b) - salePrice(a);
      case "name":       return (a.name || "").localeCompare(b.name || "");
      default:           return 0;
    }
  });

  return (
    <Layout>
      <div className="container py-12 md:py-20">
        {/* Breadcrumb */}
        {!isTodos && (
          <nav aria-label="Navegação estrutural" className="mb-4">
            <Link
              href="/categoria/todos"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
              Todos os produtos
            </Link>
          </nav>
        )}

        <div className="mb-8 md:mb-10">
          <span className="text-[11px] font-bold text-primary uppercase tracking-[0.12em]">Catálogo</span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">
            {loading
              ? <div className="h-8 bg-muted animate-pulse rounded-lg w-48 mt-1" />
              : category?.name || "Todos os Produtos"}
          </h1>
          {!loading && (
            <p className="text-muted-foreground text-sm mt-1">
              {category?.description || "Explore nosso catálogo completo"} · {sorted.length} {sorted.length === 1 ? "produto" : "produtos"}
            </p>
          )}
        </div>

        {/* Search + filters row */}
        <div className="flex flex-col gap-3 mb-8 pb-6 border-b border-border">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar produtos por nome..."
              className="w-full h-10 pl-9 pr-9 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category pills + sort */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <nav aria-label="Filtrar por categoria" className="flex items-center gap-2 flex-wrap">
              <a
                href="/categoria/todos"
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                  isTodos
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                Todos
              </a>
              {categories.map((cat) => (
                <a
                  key={cat.id}
                  href={`/categoria/${cat.slug}`}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                    cat.slug === slug
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {cat.name}
                </a>
              ))}
            </nav>

            <label htmlFor="sort-select" className="sr-only">Ordenar produtos</label>
            <select
              id="sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="text-sm border border-border rounded-xl px-3.5 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground shrink-0"
            >
              {sortOptions.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 items-stretch">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
            : sorted.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full"
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
        </div>

        {!loading && sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Package className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Nenhum produto encontrado</p>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? `Nenhum resultado para "${searchTerm}".` : "Tente outra categoria ou volte mais tarde."}
              </p>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-sm text-primary hover:underline font-medium"
              >
                Limpar busca
              </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
