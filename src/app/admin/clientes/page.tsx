'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import { mockClients } from '@/data/mockData';

export default function AdminClients() {
  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-8">Clientes</h1>
      <div className="bg-card rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Nome</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">E-mail</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Pedidos</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Total Gasto</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Desde</th>
              </tr>
            </thead>
            <tbody>
              {mockClients.map((client) => (
                <tr key={client.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium">{client.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{client.email}</td>
                  <td className="py-3 px-4 text-right tabular-nums">{client.orders}</td>
                  <td className="py-3 px-4 text-right tabular-nums font-medium">R$ {client.totalSpent.toFixed(2).replace(".", ",")}</td>
                  <td className="py-3 px-4 text-right">{new Date(client.joinedAt).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
