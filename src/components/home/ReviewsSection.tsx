import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Star } from "lucide-react";

const reviews = [
  { name: "Patrícia Mendes", role: "Açougue São Jorge", rating: 5, text: "Etiquetas de excelente qualidade. Nosso açougue ficou muito mais organizado." },
  { name: "Ricardo Teixeira", role: "Mercado Bom Preço", rating: 5, text: "Entrega rápida e preços justos. Recomendo para qualquer comércio." },
  { name: "Luciana Ferreira", role: "Papelaria Criativa", rating: 4, text: "As etiquetas personalizadas são lindas! Nossos clientes adoraram." },
];

const ReviewsSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} className="container py-20">
      <h2 className={`text-2xl font-bold text-center mb-12 ${isVisible ? "animate-fade-in" : "opacity-0"}`}>
        O que dizem nossos clientes
      </h2>
      <div className="grid md:grid-cols-3 gap-6">
        {reviews.map((r, i) => (
          <div
            key={r.name}
            className={`p-6 rounded-2xl bg-card shadow-sm border hover:shadow-md transition-shadow ${
              isVisible ? "animate-fade-in" : "opacity-0"
            }`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex gap-1 mb-3">
              {Array.from({ length: r.rating }).map((_, j) => (
                <Star key={j} className="h-4 w-4 fill-primary text-primary" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mb-4">"{r.text}"</p>
            <div>
              <p className="font-semibold text-sm">{r.name}</p>
              <p className="text-xs text-muted-foreground">{r.role}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ReviewsSection;
