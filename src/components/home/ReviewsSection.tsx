'use client';

import { Star } from "lucide-react";
import { motion } from "framer-motion";

const reviews = [
  {
    name: "Patrícia Mendes",
    role: "Açougue São Jorge",
    rating: 5,
    text: "Etiquetas de excelente qualidade. Nosso açougue ficou muito mais organizado e profissional após adotar os produtos da Adesil.",
  },
  {
    name: "Ricardo Teixeira",
    role: "Mercado Bom Preço",
    rating: 5,
    text: "Entrega rápida e preços justos. Recomendo para qualquer comércio que precise de etiquetas com qualidade garantida.",
  },
  {
    name: "Luciana Ferreira",
    role: "Papelaria Criativa",
    rating: 5,
    text: "As etiquetas personalizadas são lindas! Nossos clientes adoraram e já estamos fazendo novos pedidos com frequência.",
  },
];

const getInitials = (name: string) =>
  name.split(" ").slice(0, 2).map((n) => n[0]).join("");

const ReviewsSection = () => {
  return (
    <section className="bg-muted/35 border-y border-border/50 py-28 md:py-36">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14 md:mb-16 space-y-2 text-center max-w-xl mx-auto"
        >
          <span className="text-[11px] font-bold text-primary uppercase tracking-[0.12em]">Avaliações</span>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">O que dizem nossos clientes</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 md:gap-6">
          {reviews.map((review, i) => (
            <motion.div
              key={review.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 hover:border-primary/20 hover:shadow-md transition-all duration-300"
            >
              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className={`h-3.5 w-3.5 ${
                      j < review.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted fill-muted"
                    }`}
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                &ldquo;{review.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-2 border-t border-border/60">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0 select-none">
                  {getInitials(review.name)}
                </div>
                <div>
                  <p className="font-semibold text-sm leading-tight">{review.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{review.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;
