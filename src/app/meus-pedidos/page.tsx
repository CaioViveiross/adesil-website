'use client';

import Layout from "@/components/layout/Layout";
import { mockOrders, statusLabels } from "@/data/mockData";
import { Package } from "lucide-react";

export default function MyOrdersPage() {
  return (
    <Layout>
      <div className="container py-10 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Meus Pedidos</h1>
        <div className="space-y-4">
          {mockOrders.map((order) => (
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
      </div>
    </Layout>
  );
}
