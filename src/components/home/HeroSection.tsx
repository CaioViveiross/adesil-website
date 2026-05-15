'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const trustPoints = [
  "Entrega rápida para todo o Brasil",
  "Qualidade certificada",
  "Suporte especializado",
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
};

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Base gradient — static dark layer */}
      <div className="absolute inset-0 bg-[#000d66]" />

      {/* Animated gradient overlay */}
      <div className="absolute inset-0 hero-bg-animated opacity-90" />

      <div className="container relative z-10 py-24 md:py-28">
        <div className="max-w-2xl">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-7"
          >
            <motion.div variants={item}>
              <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/85 text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Bem-vindos a Adesil
              </span>
            </motion.div>

            <motion.h1
              variants={item}
              className="text-4xl md:text-5xl lg:text-[3.4rem] font-bold text-white leading-[1.07] tracking-tight"
            >
              Etiquetas que{" "}
              <span className="relative inline-block">
                marcam
                <span className="absolute -bottom-0.5 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-300/80 to-indigo-300/60 rounded-full" />
              </span>{" "}
              a diferença
            </motion.h1>

            <motion.p
              variants={item}
              className="text-white/60 text-base md:text-lg leading-relaxed max-w-md"
            >
              Os melhores produtos em etiquetas adesivas e ribbons, com qualidade profissional e entrega para todo o Brasil.
            </motion.p>

            <motion.div variants={item} className="flex flex-wrap gap-3">
              <Link href="/categoria/todos">
                <Button className="bg-white text-foreground hover:bg-white/92 font-semibold h-11 px-6 rounded-xl shadow-lg shadow-black/25 border-0">
                  Ver produtos <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link href="/contato">
                <Button
                  variant="ghost"
                  className="text-white border border-white/20 hover:bg-white/10 hover:text-white h-11 px-6 rounded-xl"
                >
                  Solicitar orçamento
                </Button>
              </Link>
            </motion.div>

            <motion.div variants={item} className="flex flex-col gap-2 pt-1">
              {trustPoints.map((point) => (
                <div key={point} className="flex items-center gap-2.5 text-white/60 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  {point}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom curve transition */}
      <div className="relative h-14 md:h-20">
        <div className="absolute bottom-0 inset-x-0 h-14 md:h-20 bg-background rounded-t-[2.5rem] md:rounded-t-[3.5rem]" />
      </div>
    </section>
  );
};

export default HeroSection;
