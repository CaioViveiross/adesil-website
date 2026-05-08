'use client';

import { useEffect, useState } from "react";
import type { BusinessCategory } from "@/types/supabase";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const CategorySkeleton = () => (
  <div className="rounded-2xl overflow-hidden bg-muted animate-pulse aspect-[4/3]" />
);

const BusinessCategories = () => {
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/business-categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Erro ao buscar categorias de negócio:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <section className="bg-muted/35 border-y border-border/50 py-28 md:py-36">
      <div className="container">
        <div className="flex items-end justify-between mb-14 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-1"
          >
            <span className="text-[11px] font-bold text-primary uppercase tracking-[0.12em]">Segmentos</span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Para o seu negócio</h2>
            <p className="text-muted-foreground text-sm">Soluções especializadas para cada segmento de mercado</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <CategorySkeleton key={i} />)
            : categories.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative rounded-2xl overflow-hidden aspect-[4/3] cursor-pointer bg-muted"
                >
                  {/* Image */}
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-600 ease-out"
                  />

                  {/* Permanent gradient for legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

                  {/* Hover tint */}
                  <div className="absolute inset-0 bg-primary/15 opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

                  {/* Content */}
                  <div className="absolute bottom-0 inset-x-0 p-4">
                    <p className="text-white font-semibold text-sm leading-tight drop-shadow-sm">
                      {cat.name}
                    </p>
                    <div className="flex items-center gap-1 text-white/70 text-xs mt-1.5 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      Ver produtos <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </motion.div>
              ))
          }
        </div>
      </div>
    </section>
  );
};

export default BusinessCategories;
