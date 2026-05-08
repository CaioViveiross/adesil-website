'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import ProductCard from "@/components/products/ProductCard";
import type { Product } from "@/types/supabase";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const ProductSkeleton = () => (
  <div className="bg-card border border-border rounded-2xl overflow-hidden">
    <div className="aspect-square bg-muted animate-pulse" />
    <div className="p-4 space-y-3">
      <div className="h-3 bg-muted animate-pulse rounded-full w-3/4" />
      <div className="h-3 bg-muted animate-pulse rounded-full w-1/2" />
      <div className="h-5 bg-muted animate-pulse rounded-full w-1/3 mt-1" />
      <div className="h-9 bg-muted animate-pulse rounded-xl mt-2" />
    </div>
  </div>
);

const FeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products?limit=4');
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <section className="container py-28 md:py-36">
      <div className="flex items-end justify-between mb-14 md:mb-16">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-1"
        >
          <span className="text-[11px] font-bold text-primary uppercase tracking-[0.12em]">Catálogo</span>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Produtos em destaque</h2>
          <p className="text-muted-foreground text-sm">Os mais procurados pelos nossos clientes</p>
        </motion.div>

        <Link
          href="/categoria/todos"
          className="hidden md:flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
        >
          Ver todos
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-200" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 items-stretch">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
          : products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="h-full"
              >
                <ProductCard product={product} />
              </motion.div>
            ))
        }
      </div>

      <div className="flex md:hidden justify-center mt-8">
        <Link
          href="/categoria/todos"
          className="flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          Ver todos os produtos <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
};

export default FeaturedProducts;
