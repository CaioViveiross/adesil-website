'use client';

import Link from "next/link";
import { Instagram, Facebook, Phone, Mail, MapPin } from "lucide-react";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background/75">
      <div className="container py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="space-y-5">
            <Link href="/" className="inline-flex">
              <Image
                src="/images/adesil_logo.svg"
                alt="Adesil Print"
                width={80}
                height={40}
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-sm text-background/45 leading-relaxed max-w-[220px]">
              Especialistas em etiquetas adesivas e ribbons. Qualidade profissional para o seu negócio.
            </p>
            <div className="space-y-2 text-sm text-background/45">
              <a
                href="tel:1142107059"
                className="flex items-center gap-2 hover:text-background/75 transition-colors"
              >
                <Phone className="h-3.5 w-3.5 shrink-0" />
                11 4210-7059
              </a>
              <a
                href="mailto:contato@adesilprint.com.br"
                className="flex items-center gap-2 hover:text-background/75 transition-colors"
              >
                <Mail className="h-3.5 w-3.5 shrink-0" />
                contato@adesilprint.com.br
              </a>
              <p className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                Rua Senador Darcy Ribeiro 33, São Paulo - SP
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <a
                href="https://www.instagram.com/adesilprint/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg border border-background/10 flex items-center justify-center hover:border-background/25 hover:text-background/90 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://www.facebook.com/adesilprintetiquetas/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg border border-background/10 flex items-center justify-center hover:border-background/25 hover:text-background/90 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Categorias */}
          <div>
            <h4 className="font-semibold text-background/90 text-sm mb-5">Categorias</h4>
            <ul className="space-y-3 text-sm text-background/45">
              <li>
                <Link href="/produtos" className="hover:text-background/75 transition-colors">
                  Etiquetas Adesivas
                </Link>
              </li>
              <li>
                <Link href="/produtos" className="hover:text-background/75 transition-colors">
                  Etiquetas para Balança
                </Link>
              </li>
              <li>
                <Link href="/categoria/1" className="hover:text-background/75 transition-colors">
                  Ribbons
                </Link>
              </li>
              <li>
                <Link href="/produtos" className="hover:text-background/75 transition-colors">
                  Couchê
                </Link>
              </li>
            </ul>
          </div>

          {/* Institucional */}
          <div>
            <h4 className="font-semibold text-background/90 text-sm mb-5">Institucional</h4>
            <ul className="space-y-3 text-sm text-background/45">
              <li>
                <Link href="/sobre" className="hover:text-background/75 transition-colors">
                  Sobre nós
                </Link>
              </li>
              <li>
                <Link href="/contato" className="hover:text-background/75 transition-colors">
                  Contato
                </Link>
              </li>
              <li>
                <Link href="/meus-pedidos" className="hover:text-background/75 transition-colors">
                  Meus Pedidos
                </Link>
              </li>
            </ul>
          </div>

          {/* Atendimento */}
          <div>
            <h4 className="font-semibold text-background/90 text-sm mb-5">Atendimento</h4>
            <p className="text-sm text-background/45 mb-5 leading-relaxed">
              Segunda a sexta, das 8h às 18h. Tire suas dúvidas ou solicite um orçamento.
            </p>
            <Link
              href="/contato"
              className="inline-flex items-center gap-2 text-sm font-medium text-background/80 border border-background/15 hover:border-background/30 hover:text-background/95 px-4 py-2 rounded-xl transition-colors"
            >
              Fale Conosco →
            </Link>
          </div>
        </div>

        <div className="pt-2 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-background/28">
          <p>© {new Date().getFullYear()} Adesil Print. Todos os direitos reservados.</p>
          <p>Desenvolvido por @CaioViveiros</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
