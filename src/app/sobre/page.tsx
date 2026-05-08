'use client';

import React from "react";
import Layout from "@/components/layout/Layout";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Award, Users, Package,
  Shield, Zap, HeartHandshake, TrendingUp,
  Barcode, Thermometer, Sticker, Printer,
  ShoppingCart, Hospital, Factory, Truck,
} from "lucide-react";
import { motion } from "framer-motion";

const stats = [
  { value: "20+", label: "Anos de experiência" },
  { value: "500+", label: "Clientes ativos" },
  { value: "10M+", label: "Etiquetas entregues" },
  { value: "9+", label: "Segmentos atendidos" },
];

const valores = [
  {
    icon: Shield,
    title: "Excelência em Qualidade",
    desc: "Trabalhamos com produtos de alto padrão, comparáveis aos maiores fabricantes do Brasil.",
    bg: "bg-blue-50", color: "text-blue-600",
  },
  {
    icon: TrendingUp,
    title: "Evolução Contínua",
    desc: "Estamos em constante aprendizado e aperfeiçoamento para entregar sempre as melhores soluções.",
    bg: "bg-emerald-50", color: "text-emerald-600",
  },
  {
    icon: Zap,
    title: "Inovação e Tecnologia",
    desc: "Buscamos soluções originais em materiais, produtividade, funcionalidade e sustentabilidade.",
    bg: "bg-amber-50", color: "text-amber-600",
  },
  {
    icon: HeartHandshake,
    title: "Compromisso com o Cliente",
    desc: "Unimos eficiência, atendimento humanizado e parceria de longo prazo com cada empresa.",
    bg: "bg-violet-50", color: "text-violet-600",
  },
];

const segmentos = [
  { icon: Truck, label: "Logística" },
  { icon: ShoppingCart, label: "E-commerce" },
  { icon: Factory, label: "Indústria" },
  { icon: Hospital, label: "Saúde" },
  { icon: Barcode, label: "Varejo e Atacado" },
  { icon: Thermometer, label: "Alimentos" },
  { icon: Sticker, label: "Têxtil" },
  { icon: Printer, label: "Armazenamento" },
];

const portfolio = [
  { icon: Sticker,      title: "Etiquetas Personalizadas", desc: "Rótulos sob medida para sua marca e produto" },
  { icon: Thermometer,  title: "Etiquetas Térmicas",       desc: "Alta durabilidade para impressão direta" },
  { icon: Barcode,      title: "Rótulos e Códigos",        desc: "Identificação por código de barras e QR" },
  { icon: Printer,      title: "Ribbons e Insumos",        desc: "Consumíveis compatíveis com toda linha térmica" },
  { icon: Truck,        title: "Logística e E-commerce",   desc: "Etiquetas de rastreio, volumes e expedição" },
  { icon: ShoppingCart, title: "Balança e Comércio",       desc: "Etiquetas para PDV, preço e pesagem" },
  { icon: Hospital,     title: "Saúde e Laboratório",      desc: "Soluções para hospitais, clínicas e farmácias" },
  { icon: Factory,      title: "Industrial",               desc: "Identificação de peças, patrimônio e estoque" },
];

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.55, delay, ease: EASE },
});

interface ValorItem {
  icon: React.ElementType;
  title: string;
  desc: string;
  bg: string;
  color: string;
}

function MvvSection({ valores }: { valores: ValorItem[] }) {
  return (
    <section className="bg-muted/35 border-y border-border/50 py-20 md:py-28">
      <div className="container space-y-8">

        <motion.div {...fadeUp()} className="space-y-1">
          <span className="text-[11px] font-bold text-primary uppercase tracking-[0.12em]">Propósito</span>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Missão, Visão e Valores</h2>
        </motion.div>

        {/* Grid unificado */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          {/* Missão */}
          <motion.div
            {...fadeUp(0)}
            className="col-span-2 bg-card border border-border rounded-2xl p-7 space-y-3"
          >
            <span className="text-[11px] font-bold text-primary uppercase tracking-[0.12em]">Missão</span>
            <p className="text-foreground font-semibold text-lg leading-snug">
              Desenvolver soluções inteligentes em identificação e impressão
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Oferecendo produtos de alta qualidade que agregam eficiência, organização e produtividade — com atendimento próximo e comprometimento em cada entrega.
            </p>
          </motion.div>

          {/* Visão */}
          <motion.div
            {...fadeUp(0.08)}
            className="col-span-2 bg-card border border-border rounded-2xl p-7 space-y-3"
          >
            <span className="text-[11px] font-bold text-primary uppercase tracking-[0.12em]">Visão</span>
            <p className="text-foreground font-semibold text-lg leading-snug">
              Ser referência nacional em etiquetas e impressão térmica
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Reconhecida pela excelência, inovação e confiança — levando soluções completas a empresas de todo o Brasil, acompanhando as transformações do mercado.
            </p>
          </motion.div>

          {/* Valores */}
          {valores.map((v, i) => {
            const Icon = v.icon;
            return (
              <motion.div
                key={v.title}
                {...fadeUp(0.16 + i * 0.07)}
                className="col-span-1 p-5 rounded-2xl border border-border bg-card hover:border-primary/20 hover:shadow-md transition-all duration-300"
              >
                <div className={`w-10 h-10 rounded-xl ${v.bg} flex items-center justify-center mb-4`}>
                  <Icon className={`h-4 w-4 ${v.color}`} />
                </div>
                <h3 className="font-semibold text-sm mb-1.5 leading-tight">{v.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
              </motion.div>
            );
          })}

        </div>

      </div>
    </section>
  );
}

export default function SobrePage() {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[#000d66]" />
        <div className="absolute inset-0 hero-bg-animated opacity-90" />

        <motion.div
          animate={{ x: [0, -30, 10, -20, 0], y: [0, 25, -15, 30, 0] }}
          transition={{ duration: 45, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full bg-blue-500/14 blur-[120px] -translate-y-1/3 translate-x-1/4 pointer-events-none will-change-transform"
        />
        <motion.div
          animate={{ x: [0, 35, -15, 25, 0], y: [0, -30, 20, -20, 0] }}
          transition={{ duration: 55, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-indigo-600/16 blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none will-change-transform"
        />
        <motion.div
          animate={{ scale: [1, 1.08, 0.97, 1.05, 1], opacity: [0.06, 0.10, 0.06, 0.09, 0.06] }}
          transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-400 blur-[140px] pointer-events-none will-change-transform"
        />

        <div className="container relative z-10 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl space-y-6"
          >
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/80 text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Quem somos
            </span>

            <h1 className="text-4xl md:text-5xl font-bold text-white leading-[1.07] tracking-tight">
              Mais de 20 anos conectando empresas à qualidade
            </h1>

            <p className="text-white/60 text-lg leading-relaxed max-w-lg">
              Etiquetas, rótulos e impressão térmica com inovação, atendimento próximo e comprometimento com cada cliente — em todo o Brasil.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/contato">
                <Button className="bg-white text-foreground hover:bg-white/92 h-11 px-6 rounded-xl font-semibold shadow-lg border-0">
                  Solicitar orçamento <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link href="/categoria/todos">
                <Button variant="ghost" className="text-white border border-white/20 hover:bg-white/10 hover:text-white h-11 px-6 rounded-xl">
                  Ver produtos
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        <div className="relative h-12 md:h-16">
          <div className="absolute bottom-0 inset-x-0 h-12 md:h-16 bg-background rounded-t-[2.5rem] md:rounded-t-[3.5rem]" />
        </div>
      </section>

      {/* Quem somos */}
      <section className="container py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <motion.div {...fadeUp()} className="space-y-5">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-primary uppercase tracking-[0.12em]">Nossa história</span>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Nascemos para simplificar a identificação</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Há anos desenvolvendo soluções práticas e eficientes para empresas de todo o Brasil, a Adesil Print nasceu com o propósito de entregar qualidade, agilidade e confiança no segmento de etiquetas adesivas, rótulos e suprimentos para impressão térmica.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Especializada na fabricação de etiquetas adesivas neutras e personalizadas, atendemos negócios de diferentes segmentos que buscam identificação, organização, rastreabilidade e eficiência operacional.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Ao longo da nossa trajetória, construímos uma atuação baseada em inovação, atendimento próximo e melhoria contínua, sempre acompanhando as transformações do mercado e as novas tecnologias do setor.
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                {...fadeUp(i * 0.08)}
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/20 hover:shadow-md transition-all duration-300"
              >
                <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Missão, Visão e Valores — Tabs */}
      <MvvSection valores={valores} />

      {/* Segmentos */}
      <section className="bg-muted/35 border-y border-border/50 py-20 md:py-28">
        <div className="container">
          <motion.div {...fadeUp()} className="mb-12 md:mb-16 space-y-1">
            <span className="text-[11px] font-bold text-primary uppercase tracking-[0.12em]">Atuação</span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Segmentos atendidos</h2>
            <p className="text-muted-foreground text-sm">Desenvolvemos soluções específicas para cada setor.</p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            {segmentos.map((seg, i) => {
              const Icon = seg.icon;
              return (
                <motion.div
                  key={seg.label}
                  {...fadeUp(i * 0.06)}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{seg.label}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Portfólio */}
      <section className="container py-20 md:py-28">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12 md:mb-16">
          <motion.div {...fadeUp()} className="space-y-1">
            <span className="text-[11px] font-bold text-primary uppercase tracking-[0.12em]">Portfólio</span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">O que oferecemos</h2>
            <p className="text-muted-foreground text-sm">
              Soluções completas para identificação e impressão em todos os setores.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}>
            <Link href="/categoria/todos">
              <Button variant="outline" className="h-10 px-5 rounded-xl font-semibold gap-1.5 shrink-0">
                Ver catálogo <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {portfolio.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.45, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                className="group p-5 rounded-2xl border border-border bg-card hover:border-primary/25 hover:shadow-md transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-4">
                  <Icon className="h-4.5 w-4.5 text-primary h-[18px] w-[18px]" />
                </div>
                <h3 className="font-semibold text-sm leading-tight mb-1.5">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA Final */}
      <section className="container pb-28 md:pb-36">
        <motion.div
          {...fadeUp()}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#001489] via-[#001fb8] to-[#000d66] px-8 py-16 md:px-16 md:py-20 text-center"
        >
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
          />
          <div className="absolute top-0 right-0 w-72 h-72 bg-blue-400/12 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-lg mx-auto space-y-5">
            <span className="inline-block bg-white/10 border border-white/20 text-white/85 text-xs font-medium px-3 py-1.5 rounded-full">
              Vamos encontrar a solução ideal
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Pronto para otimizar sua operação?
            </h2>
            <p className="text-white/60 text-base leading-relaxed">
              Entre em contato com nossa equipe e descubra como a Adesil Print pode ajudar o seu negócio.
            </p>
            <div className="flex flex-wrap gap-3 justify-center pt-2">
              <Link href="/contato">
                <Button className="bg-white text-foreground hover:bg-white/92 font-semibold h-11 px-7 rounded-xl shadow-lg border-0">
                  Solicitar orçamento <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </Layout>
  );
}
