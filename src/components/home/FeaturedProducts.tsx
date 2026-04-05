'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import ProductCard from "@/components/products/ProductCard";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import type { Product } from "@/types/supabase";

const FeaturedProducts = () => {
  const { ref, isVisible } = useScrollReveal();
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
        // Fallback para mockData se a API falhar
        const { products: mockProducts } = await import("@/data/mockData");
        setProducts(mockProducts.slice(0, 4));
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <section ref={ref} className="container py-20">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="container py-20">
      <div className={`flex items-end justify-between mb-8 ${isVisible ? "animate-fade-in" : "opacity-0"}`}>
        <div>
          <h2 className="text-2xl font-bold">Produtos em destaque</h2>
          <Link href="/categoria/adesivas" className="text-sm text-primary hover:underline">
            Ver todos os produtos
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {products.map((product, i) => (
          <div
            key={product.id}
            className={isVisible ? "animate-fade-in" : "opacity-0"}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturedProducts;
