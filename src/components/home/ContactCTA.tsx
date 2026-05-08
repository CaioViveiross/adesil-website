'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const ContactCTA = () => {
  return (
    <section className="container py-28 md:py-36">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#001489] via-[#001fb8] to-[#000d66] px-8 py-16 md:px-16 md:py-20 text-center"
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
        />

        {/* Orbs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-400/12 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-indigo-500/12 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-lg mx-auto space-y-5">
          <span className="inline-block bg-white/10 border border-white/20 text-white/85 text-xs font-medium px-3 py-1.5 rounded-full">
            Atendimento personalizado
          </span>

          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Precisa de um orçamento?
          </h2>

          <p className="text-white/60 text-base leading-relaxed">
            Nossa equipe está pronta para ajudar você a encontrar a solução ideal em etiquetas para o seu negócio.
          </p>

          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <Link href="/contato">
              <Button className="bg-white text-foreground hover:bg-white/92 font-semibold h-11 px-7 rounded-xl shadow-lg shadow-black/20 border-0">
                Fale Conosco <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default ContactCTA;
