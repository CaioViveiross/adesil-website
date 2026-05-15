'use client';

import { Star } from "lucide-react";
import { motion } from "framer-motion";

const reviews = [
  {
    name: "Silvia Gregorio",
    role: "Cliente verificada",
    rating: 5,
    text: "A Adesil foi um divisor de águas na minha operação! Antes ficava quebrando a cabeça pedindo etiquetas que demoravam pra chegar e não tinham a mesma qualidade. Me surpreendi com a qualidade das etiquetas e do atendimento! Já sou cliente a mais de 6 meses. Entrega rápida e preço justo! Agora antes de acabar as minhas eles já enviam o novo pedido!",
  },
  {
    name: "Fabiana Freire Alcântara",
    role: "Cliente verificada",
    rating: 5,
    text: "Ótima qualidade dos produtos, atendimento impecável, e entrega rápida. Recomendo muito.",
  },
  {
    name: "Lenilson Aguiar",
    role: "Cliente verificado",
    rating: 5,
    text: "Produtos de qualidade, ótimos preços, entrega rápida. Super indico!",
  },
  {
    name: "Lelaine Vieira",
    role: "Empresa parceira",
    rating: 5,
    text: "Excelente atendimento, etiquetas ótimas! Peço sempre pra nossa empresa. Agilidade, preço e qualidade! Super recomendo!",
  },
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
    text: "As etiquetas são lindas! Nossos clientes adoraram e já estamos fazendo novos pedidos com frequência.",
  },
  {
    name: "Felipe Shimosaka",
    role: "Cliente verificado",
    rating: 5,
    text: "Ótimo atendimento, bem simpáticos e fácil resolução de problemas.",
  },
  {
    name: "Edvaldo Moreira",
    role: "Passadoria Emanuel",
    rating: 5,
    text: "As etiquetas da Adesil são de excelente qualidade e durabilidade. Recomendo para qualquer negócio que precise de soluções de etiquetagem confiáveis.",
  }
];

const getInitials = (name: string) =>
  name.split(" ").slice(0, 2).map((n) => n[0]).join("");

const avatarColors = [
  "bg-primary",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
];

function ReviewCard({ review, index }: { review: typeof reviews[number]; index: number }) {
  return (
    <div className="w-72 md:w-80 shrink-0 bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 select-none">
      <div className="flex items-center justify-between">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, j) => (
            <Star
              key={j}
              className={`h-3.5 w-3.5 ${j < review.rating ? "fill-amber-400 text-amber-400" : "text-muted fill-muted"}`}
            />
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground/60 font-medium">Google</span>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-4">
        &ldquo;{review.text}&rdquo;
      </p>

      <div className="flex items-center gap-2.5 pt-2 border-t border-border/60">
        <div className={`w-8 h-8 rounded-full ${avatarColors[index % avatarColors.length]} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
          {getInitials(review.name)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">{review.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{review.role}</p>
        </div>
      </div>
    </div>
  );
}

const row1 = [...reviews, ...reviews, ...reviews];

const ReviewsSection = () => {
  return (
    <section className="bg-muted/35 border-y border-border/50 py-28 md:py-36 overflow-hidden">
      <style>{`
        @keyframes marquee-left {
          from { transform: translateX(0); }
          to   { transform: translateX(-33.333%); }
        }
        .marquee-left  { animation: marquee-left 40s linear infinite; }
        .marquee-track:hover .marquee-left { animation-play-state: paused; }
      `}</style>

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
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-sm font-semibold">5,0</span>
            <span className="text-sm text-muted-foreground">· {reviews.length} avaliações</span>
          </div>
        </motion.div>
      </div>

      <div className="marquee-track relative">
        <div
          className="absolute inset-y-0 left-0 w-24 md:w-40 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, hsl(var(--background)), transparent)" }}
        />
        <div
          className="absolute inset-y-0 right-0 w-24 md:w-40 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, hsl(var(--background)), transparent)" }}
        />

        <div className="flex flex-nowrap min-w-max gap-4 marquee-left will-change-transform">
          {row1.map((review, i) => (
            <ReviewCard key={i} review={review} index={i % reviews.length} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;
