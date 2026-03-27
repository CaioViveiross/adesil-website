'use client';

import AdminLayout from "@/components/admin/AdminLayout";
import { mockOrders, mockClients, products } from "@/data/mockData";
import { DollarSign, Package, ShoppingCart, Users } from "lucide-react";

const stats = [
  { label: "Receita", value: "R$ 24.890", icon: DollarSign, change: "+12%" },
  { label: "Pedidos", value: "147", icon: ShoppingCart, change: "+8%" },
  { label: "Produtos", value: String(products.length), icon: Package, change: "" },
  { label: "Clientes", value: String(mockClients.length), icon: Users, change: "+5%" },
];

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-2xl border p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            {s.change && <p className="text-xs text-green-600 mt-1">{s.change} vs mês anterior</p>}
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border p-6">
        <h2 className="font-bold mb-4">Pedidos Recentes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 font-medium text-muted-foreground">Pedido</th>
                <th className="text-left py-3 font-medium text-muted-foreground">Cliente</th>
                <th className="text-left py-3 font-medium text-muted-foreground">Data</th>
                <th className="text-left py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right py-3 font-medium text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {mockOrders.slice(0, 5).map((order) => (
                <tr key={order.id} className="border-b last:border-0">
                  <td className="py-3 font-medium">{order.id}</td>
                  <td className="py-3">{order.customer}</td>
                  <td className="py-3">{new Date(order.date).toLocaleDateString("pt-BR")}</td>
                  <td className="py-3"><span className="text-xs bg-secondary px-2 py-1 rounded-full">{order.status}</span></td>
                  <td className="py-3 text-right tabular-nums font-medium">R$ {order.total.toFixed(2).replace(".", ",")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
