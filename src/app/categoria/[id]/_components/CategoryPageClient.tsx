'use client';

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import { EmptyState } from "@/components/ui/empty-state";
import { Package, Search, X } from "lucide-react";
import type { Product, Category } from "@/types/supabase";
import { salePrice } from "@/lib/utils";
import { motion } from "framer-motion";

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
  /** Slugs das categorias marcadas ao abrir a página. */
  initialCategories?: string[];
}

export default function CategoryPageClient({
  slug,
  initialSearch = "",
  initialCategories = [],
}: CategoryPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [sort,       setSort]       = useState("relevance");
  const [products,   setProducts]   = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selected,   setSelected]   = useState<string[]>(initialCategories);

  const selectedCategories = categories.filter((c) => selected.includes(c.slug));

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

  // Um produto pode estar em várias categorias; `category_id` é só a primeira.
  const categoryIdsOf = (product: Product): number[] =>
    (product.category_ids ?? (product.category_id ? [product.category_id] : [])).map(Number);

  /** Quantos produtos cada categoria tem — mostrado na pill. */
  const countByCategory = useMemo(() => {
    const counts = new Map<number, number>();
    for (const product of products) {
      for (const id of categoryIdsOf(product)) {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }
    return counts;
  }, [products]);

  /**
   * Reflete a seleção na URL para o filtro sobreviver a recarregar e poder ser
   * compartilhado. Sem nada marcado, volta ao catálogo geral.
   */
  const syncUrl = (slugs: string[]) => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("q", searchTerm.trim());

    if (slugs.length === 0) {
      const query = params.toString();
      router.replace(query ? `/categoria/todos?${query}` : "/categoria/todos", { scroll: false });
      return;
    }

    // Uma categoria só, igual à da rota: URL limpa, sem query redundante.
    if (!(slugs.length === 1 && slugs[0] === slug)) {
      params.set("cats", slugs.join(","));
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const toggleCategory = (categorySlug: string) => {
    const next = selected.includes(categorySlug)
      ? selected.filter((item) => item !== categorySlug)
      : [...selected, categorySlug];
    setSelected(next);
    syncUrl(next);
  };

  const clearCategories = () => {
    setSelected([]);
    syncUrl([]);
  };

  // Vários filtros combinam por "ou": o produto aparece se estiver em qualquer
  // uma das categorias marcadas — o comportamento usual de facetas em loja.
  const selectedIds = selectedCategories.map((c) => Number(c.id));
  const filtered = (selectedIds.length === 0
    ? products
    : products.filter((p) => categoryIdsOf(p).some((id) => selectedIds.includes(id)))
  ).filter((p) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
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
        {selected.length > 0 && (
          <nav aria-label="Navegação estrutural" className="mb-4">
            <button
              type="button"
              onClick={clearCategories}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
              Todos os produtos
            </button>
          </nav>
        )}

        <div className="mb-8 md:mb-10">
          <span className="text-[11px] font-bold text-primary uppercase tracking-[0.12em]">Catálogo</span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">
            {loading
              ? <div className="h-8 bg-muted animate-pulse rounded-lg w-48 mt-1" />
              : selectedCategories.length === 1
                ? selectedCategories[0].name
                : "Todos os Produtos"}
          </h1>
          {!loading && (
            <p className="text-muted-foreground text-sm mt-1">
              {selectedCategories.length === 1
                ? selectedCategories[0].description || "Explore nosso catálogo completo"
                : selectedCategories.length > 1
                  ? selectedCategories.map((c) => c.name).join(" · ")
                  : "Explore nosso catálogo completo"}
              {" · "}
              {sorted.length} {sorted.length === 1 ? "produto" : "produtos"}
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

          {/* Filtros de categoria (múltipla escolha) + ordenação */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div
              role="group"
              aria-label="Filtrar por categoria"
              className="flex items-center gap-2 flex-wrap"
            >
              <button
                type="button"
                onClick={clearCategories}
                aria-pressed={selected.length === 0}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                  selected.length === 0
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                Todos
              </button>

              {categories.map((cat) => {
                const active = selected.includes(cat.slug);
                const count = countByCategory.get(Number(cat.id)) ?? 0;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.slug)}
                    aria-pressed={active}
                    // Categoria vazia continua clicável: some da lista se for
                    // desabilitada, e o cliente perde a referência do catálogo.
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : count === 0
                          ? "bg-card border-border text-muted-foreground/50 hover:border-primary/40"
                          : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {cat.name}
                    <span
                      className={`tabular-nums text-[10px] ${
                        active ? "text-primary-foreground/70" : "text-muted-foreground/60"
                      }`}
                    >
                      {count}
                    </span>
                    {active && <X className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>

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
          <EmptyState
            icon={Package}
            title="Nenhum produto encontrado"
            description={
              searchTerm
                ? `Nenhum resultado para "${searchTerm}"${
                    selected.length > 0 ? " nas categorias selecionadas" : ""
                  }.`
                : selected.length === 1
                  ? "Esta categoria ainda não tem produtos."
                  : selected.length > 1
                    ? "Nenhum produto nas categorias selecionadas."
                    : "Volte mais tarde."
            }
            // A busca é o filtro mais provável de estar atrapalhando, então ela
            // vem primeiro; só depois oferece soltar as categorias.
            action={
              searchTerm
                ? { label: "Limpar busca", onClick: () => setSearchTerm(""), variant: "outline" }
                : selected.length > 0
                  ? { label: "Ver todos os produtos", onClick: clearCategories, variant: "outline" }
                  : undefined
            }
          />
        )}
      </div>
    </Layout>
  );
}
