'use client';

import Link from "next/link";
import { products } from "@/data/mockData";
import ProductCard from "@/components/products/ProductCard";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const FeaturedProducts = () => {
  const { ref, isVisible } = useScrollReveal();
  const featured = products.slice(0, 4);

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
        {featured.map((product, i) => (
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
