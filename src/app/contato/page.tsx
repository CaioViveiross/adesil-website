'use client';

import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const contactInfo = [
  {
    icon: Phone,
    label: "Telefone",
    value: "11 4210-7059",
    href: "tel:1142107059",
  },
  {
    icon: Mail,
    label: "E-mail",
    value: "pcp@adesilprint.com.br",
    href: "mailto:pcp@adesilprint.com.br",
  },
  {
    icon: MapPin,
    label: "Endereço",
    value: "Rua Senador Darcy Ribeiro 33, São Paulo - SP",
    href: null,
  },
];

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <Layout>
      <div className="container py-16 md:py-24 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 md:mb-14"
        >
          <span className="text-[11px] font-bold text-primary uppercase tracking-[0.12em]">Fale conosco</span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">Contato</h1>
          <p className="text-muted-foreground text-sm mt-1.5">
            Entre em contato para tirar dúvidas ou solicitar um orçamento personalizado.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            {sent ? (
              <div className="flex flex-col items-center text-center gap-4 py-12">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-bold">Mensagem enviada!</h2>
                  <p className="text-muted-foreground text-sm">Retornaremos em breve pelo e-mail informado.</p>
                </div>
                <Button variant="outline" className="h-10 rounded-xl" onClick={() => setSent(false)}>
                  Enviar outra mensagem
                </Button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <Label className="text-sm">Nome</Label>
                  <Input className="h-11 rounded-xl" placeholder="Seu nome completo" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">E-mail</Label>
                  <Input className="h-11 rounded-xl" type="email" placeholder="seu@email.com" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Telefone</Label>
                  <Input className="h-11 rounded-xl" type="tel" placeholder="(11) 00000-0000" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Mensagem</Label>
                  <textarea
                    placeholder="Descreva sua dúvida ou solicitação..."
                    rows={4}
                    required
                    className="w-full px-3 py-2.5 border border-input rounded-xl bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                  />
                </div>
                <Button type="submit" className="w-full h-11 rounded-xl font-semibold">
                  Enviar mensagem
                </Button>
              </form>
            )}
          </motion.div>

          {/* Contact info */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            {contactInfo.map((info) => {
              const Icon = info.icon;
              return (
                <div key={info.label} className="flex items-start gap-4 p-4 rounded-2xl border border-border bg-card">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{info.label}</p>
                    {info.href ? (
                      <a href={info.href} className="text-sm text-muted-foreground hover:text-primary transition-colors mt-0.5 block">
                        {info.value}
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-0.5">{info.value}</p>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="p-4 rounded-2xl border border-border bg-muted/40">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Horário de atendimento</p>
              <p className="text-sm font-medium">Segunda a sexta, 8h às 18h</p>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
