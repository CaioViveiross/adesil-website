import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Shield, Truck, Award, Headphones } from "lucide-react";

const benefits = [
  { icon: Shield, title: "Qualidade Garantida", desc: "Produtos testados e certificados" },
  { icon: Truck, title: "Entrega Rápida", desc: "Envio para todo o Brasil" },
  { icon: Award, title: "Melhor Preço", desc: "Preço competitivo do mercado" },
  { icon: Headphones, title: "Suporte Dedicado", desc: "Atendimento personalizado" },
];

const BenefitsSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} className="surface-elevated py-20">
      <div className="container">
        <h2 className={`text-2xl font-bold text-center mb-12 ${isVisible ? "animate-fade-in" : "opacity-0"}`}>
          Qualidade
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {benefits.map((b, i) => (
            <div
              key={b.title}
              className={`flex flex-col items-center text-center gap-3 p-6 rounded-2xl bg-background shadow-sm hover:shadow-md transition-shadow ${
                isVisible ? "animate-fade-in" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                <b.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">{b.title}</h3>
              <p className="text-xs text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
