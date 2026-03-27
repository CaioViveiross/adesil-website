'use client';

import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <Layout>
      <div className="container py-16 max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">Contato</h1>
        <p className="text-muted-foreground mb-10">Entre em contato conosco para tirar dúvidas ou solicitar orçamentos.</p>

        <div className="grid md:grid-cols-2 gap-10">
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert("Mensagem enviada com sucesso!"); }}>
            <input type="text" placeholder="Nome" required className="w-full px-4 py-3 border rounded-xl bg-background" />
            <input type="email" placeholder="E-mail" required className="w-full px-4 py-3 border rounded-xl bg-background" />
            <input type="tel" placeholder="Telefone" className="w-full px-4 py-3 border rounded-xl bg-background" />
            <textarea placeholder="Mensagem" rows={5} required className="w-full px-4 py-3 border rounded-xl bg-background resize-none" />
            <Button variant="hero" type="submit">Enviar Mensagem</Button>
          </form>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Telefone</p>
                <p className="text-sm text-muted-foreground">11 4210-7059</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold">E-mail</p>
                <p className="text-sm text-muted-foreground">pcp@adesilprint.com.br</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Endereço</p>
                <p className="text-sm text-muted-foreground">Rua Senador Darcy Ribeiro 33, São Paulo - SP</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
