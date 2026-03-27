'use client';

import AdminLayout from "@/components/admin/AdminLayout";
import { products } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";

export default function AdminProducts() {
  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <Button onClick={() => alert("Modal de criação (simulado)")}><Plus className="h-4 w-4 mr-2" /> Novo Produto</Button>
      </div>

      <div className="bg-card rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Produto</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Categoria</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Preço</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium">{p.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{p.category}</td>
                  <td className="py-3 px-4 text-right tabular-nums">R$ {p.price.toFixed(2).replace(".", ",")}</td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => alert(`Editar ${p.name} (simulado)`)}>
                      <Pencil className="h-3 w-3 mr-1" /> Editar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
