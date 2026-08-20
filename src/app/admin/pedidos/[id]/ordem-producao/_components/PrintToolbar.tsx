'use client';

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  orderId: string;
}

/**
 * Barra de ações da ordem de produção. Fica fora do papel: `print:hidden`
 * garante que nada dela apareça no PDF ou na impressão.
 */
export default function PrintToolbar({ orderId }: Props) {
  return (
    <div className="print:hidden sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-[210mm] items-center justify-between gap-4 px-4 py-3">
        <Button variant="ghost" size="sm" asChild className="gap-1.5">
          <Link href={`/admin/pedidos/${orderId}`}>
            <ArrowLeft className="h-4 w-4" />
            Voltar ao pedido
          </Link>
        </Button>

        <div className="flex items-center gap-3">
          <p className="hidden sm:block text-xs text-muted-foreground">
            Para salvar em PDF, escolha &ldquo;Salvar como PDF&rdquo; no destino da impressão.
          </p>
          <Button size="sm" onClick={() => window.print()} className="gap-1.5">
            <Printer className="h-4 w-4" />
            Imprimir / Salvar PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
