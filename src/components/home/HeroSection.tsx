'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const HeroSection = () => {
  const { ref, isVisible } = useScrollReveal(0.1);

  return (
    <section ref={ref} className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[hsl(var(--primary))] rounded-b-[2rem] md:rounded-b-[3rem]" />
      <div className="container relative z-10 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className={`space-y-6 ${isVisible ? "animate-fade-in" : "opacity-0"}`}>
            <p className="text-primary-foreground/70 text-sm font-medium">
              Bem-vindos à nossa loja online
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-[1.1]">
              Etiquetas que marcam e fazem a{" "}
              <span className="text-primary-foreground/80 underline decoration-primary-foreground/30 decoration-2 underline-offset-4">
                diferença
              </span>
            </h1>
            <p className="text-primary-foreground/70 max-w-md">
              Encontre aqui os melhores produtos em etiquetas adesivas e Ribbons.
            </p>
            <Link href="/categoria/adesivas">
              <Button variant="outline" className="bg-background text-foreground hover:bg-background/90 border-0 mt-2">
                Ver produtos <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
