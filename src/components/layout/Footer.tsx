'use client';

import Link from "next/link";
import { Instagram, Facebook, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background/80 mt-24">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <Image
                src="/images/adesil_logo.svg"
                alt="Adesil - Etiquetas e Ribbons"
                width={80}
                height={80}
              />
            </Link>
            <div className="space-y-2 text-sm text-background/60">
              <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> 11 4210-7059</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> pcp@adesilprint.com.br</p>
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Rua Senador Darcy Ribeiro 33, São Paulo - SP</p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button variant="outline" size="icon" className="border-background/20 text-background/60 hover:text-background hover:border-background/40 bg-transparent">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="border-background/20 text-background/60 hover:text-background hover:border-background/40 bg-transparent">
                <Facebook className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-background mb-4">Categorias</h4>
            <ul className="space-y-2 text-sm text-background/60">
              <li><Link href="/categoria/adesivas" className="hover:text-background transition-colors">Etiquetas Adesivas</Link></li>
              <li><Link href="/categoria/balanca" className="hover:text-background transition-colors">Etiquetas para Balança</Link></li>
              <li><Link href="/categoria/ribbons" className="hover:text-background transition-colors">Ribbons</Link></li>
              <li><Link href="/categoria/couche" className="hover:text-background transition-colors">Couchê</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-background mb-4">Conheça a Adesil</h4>
            <ul className="space-y-2 text-sm text-background/60">
              <li><Link href="/" className="hover:text-background transition-colors">Sobre nós</Link></li>
              <li><Link href="/" className="hover:text-background transition-colors">Nossa qualidade</Link></li>
              <li><Link href="/contato" className="hover:text-background transition-colors">Contato</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-background mb-4">Fale Conosco</h4>
            <p className="text-sm text-background/60 mb-4">Tire suas dúvidas ou solicite um orçamento.</p>
            <Link href="/contato">
              <Button variant="outline" className="border-background/20 text-background hover:bg-background/10 bg-transparent">
                Fale Conosco →
              </Button>
            </Link>
          </div>
        </div>

        <div className="border-t border-background/10 mt-12 pt-8 text-center text-xs text-background/40">
          Desenvolvido por @CaioViveiros
        </div>
      </div>
    </footer>
  );
};

export default Footer;
