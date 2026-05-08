'use client';

import { Shield, Truck, Award, Headphones } from "lucide-react";
import { motion } from "framer-motion";

const benefits = [
  {
    icon: Shield,
    title: "Qualidade Garantida",
    desc: "Materiais certificados com rigoroso controle de qualidade em cada etapa da produção.",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
    borderHover: "hover:border-blue-200",
  },
  {
    icon: Truck,
    title: "Entrega Rápida",
    desc: "Envio ágil para todo o Brasil com rastreamento em tempo real até a sua porta.",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
    borderHover: "hover:border-emerald-200",
  },
  {
    icon: Award,
    title: "Melhor Custo-Benefício",
    desc: "Preços competitivos sem abrir mão da qualidade premium que o seu negócio merece.",
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50",
    borderHover: "hover:border-amber-200",
  },
  {
    icon: Headphones,
    title: "Suporte Especializado",
    desc: "Equipe técnica dedicada pronta para ajudar você a escolher a solução ideal.",
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50",
    borderHover: "hover:border-violet-200",
  },
];

const BenefitsSection = () => {
  return (
    <section className="container py-28 md:py-36">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-14 md:mb-16 space-y-2 text-center max-w-xl mx-auto"
      >
        <span className="text-[11px] font-bold text-primary uppercase tracking-[0.12em]">Nossa Qualidade</span>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Por que escolher a Adesil</h2>
        <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
          Qualidade que acompanha o crescimento da sua marca
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {benefits.map((benefit, i) => {
          const Icon = benefit.icon;
          return (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.09, ease: [0.16, 1, 0.3, 1] }}
              className={`group p-6 rounded-2xl border border-border bg-card ${benefit.borderHover} hover:shadow-md transition-all duration-300`}
            >
              <div className={`w-11 h-11 rounded-xl ${benefit.iconBg} flex items-center justify-center mb-4`}>
                <Icon className={`h-5 w-5 ${benefit.iconColor}`} />
              </div>
              <h3 className="font-semibold text-sm mb-2 leading-tight">{benefit.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{benefit.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default BenefitsSection;
