'use client';

import AdminLayout from "@/components/admin/AdminLayout";
import { mockOrders, statusLabels } from "@/data/mockData";

export default function AdminOrders() {
  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-8">Pedidos</h1>
      <div className="bg-card rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Pedido</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Cliente</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Data</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Itens</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {mockOrders.map((order) => (
                <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium">{order.id}</td>
                  <td className="py-3 px-4">{order.customer}</td>
                  <td className="py-3 px-4">{new Date(order.date).toLocaleDateString("pt-BR")}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusLabels[order.status].color}`}>
                      {statusLabels[order.status].label}
                    </span>
                  </td>
                  <td className="py-3 px-4 tabular-nums">{order.items}</td>
                  <td className="py-3 px-4 text-right font-medium tabular-nums">R$ {order.total.toFixed(2).replace(".", ",")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
