'use client';

import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Package } from "lucide-react";
import { parseOrderDate } from "@/lib/utils";
import { statusLabels } from "@/types/supabase";
import type { Order } from "@/types/supabase";

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [loading, setLoading] = useState(true);

  const openOrderDetail = async (orderId: string) => {
    setModalOpen(true);
    setLoadingOrder(true);
    setSelectedOrder(null);

    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) {
        throw new Error("Não foi possível carregar o pedido.");
      }
      const data: Order = await response.json();
      setSelectedOrder(data);
    } catch (error) {
      console.error("Error loading order detail:", error);
    } finally {
      setLoadingOrder(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedOrder(null);
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Buscar apenas os pedidos do usuário autenticado
        const response = await fetch('/api/orders?mine=true');
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
              <div key={order.id} className="flex flex-col md:flex-row items-start md:items-center gap-4 p-5 rounded-2xl border bg-card hover:shadow-sm transition-shadow">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">Pedido #{order.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusLabels[order.status].color}`}>
                      {statusLabels[order.status].label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{order.items} item(ns) • {parseOrderDate(order.date, order.created_at)?.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
                  <p className="text-sm text-muted-foreground">CEP: {order.shipping_zipcode ?? 'N/A'} • {order.shipping_city ?? '---'}/{order.shipping_state ?? '---'}</p>
                </div>
                <div className="flex flex-col gap-3 items-stretch sm:items-end">
                  <p className="font-bold tabular-nums">R$ {order.total.toFixed(2).replace(".", ",")}</p>
                  <Button variant="outline" size="sm" onClick={() => openOrderDetail(order.id)}>
                    Ver pedido
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {loadingOrder ? "Carregando pedido..." : selectedOrder ? `Pedido #${selectedOrder.id}` : "Detalhes do pedido"}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder ? parseOrderDate(selectedOrder.date, selectedOrder.created_at)?.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : ""}
            </DialogDescription>
          </DialogHeader>

          {loadingOrder ? (
            <div className="py-10 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
              <p className="text-muted-foreground mt-4">Carregando detalhes...</p>
            </div>
          ) : selectedOrder ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border bg-card p-4">
                  <h3 className="text-sm font-semibold mb-3">Resumo</h3>
                  <p className="text-sm text-muted-foreground mb-1">Itens: {selectedOrder.items}</p>
                  <p className="text-sm text-muted-foreground">Total: <span className="font-semibold">R$ {selectedOrder.total.toFixed(2).replace(".", ",")}</span></p>
                </div>
                <div className="rounded-3xl border bg-card p-4">
                  <h3 className="text-sm font-semibold mb-3">Status</h3>
                  <Badge className={statusLabels[selectedOrder.status].color}>{statusLabels[selectedOrder.status].label}</Badge>
                </div>
              </div>

              <div className="rounded-3xl border bg-card p-4">
                <h3 className="text-sm font-semibold mb-3">Entrega</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>{selectedOrder.shipping_street ?? "-"}, {selectedOrder.shipping_number ?? "-"}</p>
                  {selectedOrder.shipping_complement && <p>{selectedOrder.shipping_complement}</p>}
                  <p>{selectedOrder.shipping_city ?? "-"} / {selectedOrder.shipping_state ?? "-"}</p>
                  <p>CEP: {selectedOrder.shipping_zipcode ?? "-"}</p>
                </div>
              </div>

              <div className="rounded-3xl border bg-card p-4">
                <h3 className="text-sm font-semibold mb-3">Itens do pedido</h3>
                <div className="space-y-3">
                  {selectedOrder.items_detail?.length ? (
                    selectedOrder.items_detail.map((item) => (
                      <div key={item.product_id} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] items-center rounded-2xl border border-border bg-background p-4">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">Quantidade: {item.quantity}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">R$ {item.price.toFixed(2).replace(".", ",")}</p>
                        <p className="font-semibold">R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum item detalhado disponível.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Não foi possível carregar detalhes do pedido.</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
