'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { ArrowRight } from "lucide-react";

const ContactCTA = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} className="container py-20">
      <div
        className={`bg-muted rounded-3xl p-12 md:p-16 text-center space-y-6 ${
          isVisible ? "animate-fade-in" : "opacity-0"
        }`}
      >
        <h2 className="text-3xl font-bold">Contato</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Precisa de um orçamento personalizado? Entre em contato com nossa equipe.
        </p>
        <Link href="/contato">
          <Button variant="hero">
            Fale Conosco <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default ContactCTA;
