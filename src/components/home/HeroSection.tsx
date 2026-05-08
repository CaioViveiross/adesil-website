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
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Base gradient — static dark layer */}
      <div className="absolute inset-0 bg-[#000d66]" />

      {/* Animated gradient overlay */}
      <div className="absolute inset-0 hero-bg-animated opacity-90" />

      {/* Orb 1 — top right, drifts slowly */}
      <motion.div
        animate={{ x: [0, -30, 10, -20, 0], y: [0, 25, -15, 30, 0] }}
        transition={{ duration: 45, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full bg-blue-500/14 blur-[120px] -translate-y-1/3 translate-x-1/4 pointer-events-none will-change-transform"
      />

      {/* Orb 2 — bottom left, opposite rhythm */}
      <motion.div
        animate={{ x: [0, 35, -15, 25, 0], y: [0, -30, 20, -20, 0] }}
        transition={{ duration: 55, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-indigo-600/16 blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none will-change-transform"
      />

      {/* Orb 3 — center, slow pulse */}
      <motion.div
        animate={{ scale: [1, 1.08, 0.97, 1.05, 1], opacity: [0.06, 0.10, 0.06, 0.09, 0.06] }}
        transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-400 blur-[140px] pointer-events-none will-change-transform"
      />

      <div className="container relative z-10 py-32 md:py-44">
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
