'use client';

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { DollarSign, Package, ShoppingCart } from "lucide-react";
import { parseOrderDate } from "@/lib/utils";
import { statusLabels } from "@/types/supabase";
import type { Order, Product } from "@/types/supabase";

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/products'),
        ]);

        const ordersData = ordersRes.ok ? await ordersRes.json() : [];
        const productsData = productsRes.ok ? await productsRes.json() : [];

        setOrders(ordersData);
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calcular estatísticas
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const totalProducts = products.length;

  const stats = [
    {
      label: "Receita",
      value: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      change: ""
    },
    {
      label: "Pedidos",
      value: String(totalOrders),
      icon: ShoppingCart,
      change: ""
    },
    {
      label: "Produtos",
      value: String(totalProducts),
      icon: Package,
      change: ""
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <h1 className="text-2xl font-bold mb-8">Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border p-5">
              <div className="h-4 bg-muted animate-pulse rounded w-20 mb-3"></div>
              <div className="h-8 bg-muted animate-pulse rounded w-16"></div>
            </div>
          ))}
        </div>
        <div className="bg-card rounded-2xl border p-6">
          <div className="h-6 bg-muted animate-pulse rounded w-40 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded"></div>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

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
              {orders.slice(0, 5).map((order) => (
                <tr key={order.id} className="border-b last:border-0">
                  <td className="py-3 font-medium">{order.id}</td>
                  <td className="py-3">{order.customer_name}</td>
                  <td className="py-3">{parseOrderDate(order.ordered_at, order.created_at)?.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusLabels[order.status].color}`}>
                      {statusLabels[order.status].label}
                    </span>
                  </td>
                  <td className="py-3 text-right tabular-nums font-medium">
                    R$ {order.total.toFixed(2).replace(".", ",")}
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
