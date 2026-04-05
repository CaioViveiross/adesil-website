'use client';

import { useEffect, useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import type { BusinessCategory } from "@/types/supabase";

const businessCategoriesData: BusinessCategory[] = [
  { id: "logistica", name: "Logística", image: "/images/category-logistica.jpg" },
  { id: "comercio", name: "Comércio", image: "/images/category-comercio.jpg" },
  { id: "hospitalar", name: "Hospitalar", image: "/images/category-hospitalar.jpg" },
  { id: "industria", name: "Indústria", image: "/images/category-industria.jpg" },
];

const BusinessCategories = () => {
  const { ref, isVisible } = useScrollReveal();
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCategories(businessCategoriesData);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <section ref={ref} className="container py-20">
        <h2 className="text-2xl font-bold mb-10">Para o seu negócio</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-muted animate-pulse"></div>
              <div className="w-20 h-4 bg-muted animate-pulse rounded"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="container py-20">
      <h2 className={`text-2xl font-bold mb-10 ${isVisible ? "animate-fade-in" : "opacity-0"}`}>
        Para o seu negócio
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {categories.map((cat, i) => (
          <div
            key={cat.id}
            className={`flex flex-col items-center gap-3 group cursor-pointer ${
              isVisible ? "animate-fade-in" : "opacity-0"
            }`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden shadow-md group-hover:shadow-xl transition-shadow duration-300">
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <span className="text-sm font-medium text-center">{cat.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BusinessCategories;
