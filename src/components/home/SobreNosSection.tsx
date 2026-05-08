'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Award, Package, MapPin } from "lucide-react";
import { motion } from "framer-motion";

const stats = [
  { value: "20+", label: "Anos de experiência", icon: Award },
  { value: "500+", label: "Clientes ativos", icon: Users },
  { value: "10M+", label: "Etiquetas entregues", icon: Package },
  { value: "Todo o Brasil", label: "Área de atuação", icon: MapPin },
];

export default function SobreNosSection() {
  return (
    <section className="container py-28 md:py-36">
      <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
        {/* Left — content */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-primary uppercase tracking-[0.12em]">Sobre nós</span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Especialistas em etiquetas há mais de 20 anos
            </h2>
          </div>

          <p className="text-muted-foreground leading-relaxed">
            A Adesil Print nasceu com o propósito de entregar qualidade, agilidade e confiança no segmento de etiquetas adesivas, rótulos e suprimentos para impressão térmica. Atendemos empresas de todo o Brasil que buscam identificação, organização e eficiência operacional.
          </p>

          <p className="text-muted-foreground leading-relaxed">
            Com inovação, atendimento próximo e melhoria contínua, construímos uma trajetória baseada na excelência e na parceria de longo prazo com nossos clientes.
          </p>

          <Link href="/sobre">
            <Button className="h-11 px-6 rounded-xl font-semibold gap-1.5 mt-6">
              Conheça nossa história <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>

        {/* Right — stats grid */}
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="bg-card border border-border rounded-2xl p-5 space-y-3 hover:border-primary/20 hover:shadow-md transition-all duration-300"
              >
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
