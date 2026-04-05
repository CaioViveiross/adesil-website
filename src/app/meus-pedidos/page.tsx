'use client';

import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { Package } from "lucide-react";
import { statusLabels } from "@/types/supabase";
import type { Order } from "@/types/supabase";

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Por enquanto, buscar todos os pedidos (depois implementar filtro por usuário)
        const response = await fetch('/api/orders');
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="container py-10 max-w-3xl">
          <h1 className="text-3xl font-bold mb-8">Meus Pedidos</h1>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-5 rounded-2xl border bg-card">
                <div className="w-12 h-12 rounded-full bg-muted animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-32"></div>
                  <div className="h-3 bg-muted animate-pulse rounded w-48"></div>
                </div>
                <div className="h-6 bg-muted animate-pulse rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-10 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Meus Pedidos</h1>
        {orders.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Você ainda não fez nenhum pedido.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center gap-4 p-5 rounded-2xl border bg-card hover:shadow-sm transition-shadow">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{order.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusLabels[order.status].color}`}>
                      {statusLabels[order.status].label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{order.items} item(ns) • {new Date(order.date).toLocaleDateString("pt-BR")}</p>
                </div>
                <p className="font-bold shrink-0 tabular-nums">R$ {order.total.toFixed(2).replace(".", ",")}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
