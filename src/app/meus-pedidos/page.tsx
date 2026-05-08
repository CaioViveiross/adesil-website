'use client';

import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Package, ChevronRight } from "lucide-react";
import { parseOrderDate } from "@/lib/utils";
import { statusLabels } from "@/types/supabase";
import type { Order } from "@/types/supabase";
import { motion } from "framer-motion";

const OrderSkeleton = () => (
  <div className="flex items-center gap-4 p-5 rounded-2xl border border-border bg-card">
    <div className="w-11 h-11 rounded-xl bg-muted animate-pulse shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-muted animate-pulse rounded-full w-32" />
      <div className="h-3 bg-muted animate-pulse rounded-full w-48" />
    </div>
    <div className="h-6 bg-muted animate-pulse rounded-full w-20 shrink-0" />
  </div>
);

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
      if (!response.ok) throw new Error();
      setSelectedOrder(await response.json());
    } catch {
      console.error("Error loading order detail");
    } finally {
      setLoadingOrder(false);
    }
  };

  const closeModal = () => { setModalOpen(false); setSelectedOrder(null); };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders?mine=true');
        if (response.ok) setOrders(await response.json());
      } catch { console.error('Error fetching orders'); }
      finally { setLoading(false); }
    };
    fetchOrders();
  }, []);

  return (
    <Layout>
      <div className="container py-12 md:py-20 max-w-3xl">
        <div className="mb-8 md:mb-10">
          <span className="text-[11px] font-bold text-primary uppercase tracking-[0.12em]">Conta</span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">Meus Pedidos</h1>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <OrderSkeleton key={i} />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center text-center gap-4 py-20">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Package className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Nenhum pedido ainda</p>
              <p className="text-sm text-muted-foreground">Seus pedidos aparecerão aqui após a primeira compra.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-2xl border border-border bg-card hover:border-primary/20 transition-colors cursor-pointer group"
                onClick={() => openOrderDetail(order.id)}
              >
                <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">Pedido #{String(order.id).slice(0, 8)}...</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${statusLabels[order.status].color}`}>
                      {statusLabels[order.status].label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {order.items} {order.items === 1 ? 'item' : 'itens'} · {parseOrderDate(order.date, order.created_at)?.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                  </p>
                  <p className="text-xs text-muted-foreground">{order.shipping_city ?? '—'}/{order.shipping_state ?? '—'}</p>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end gap-y-1">
                  <p className="font-bold tabular-nums text-sm">R$ {order.total.toFixed(2).replace(".", ",")}</p>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {loadingOrder ? "Carregando pedido..." : selectedOrder ? `Pedido #${selectedOrder.id.slice(0, 8)}...` : "Detalhes do pedido"}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder ? parseOrderDate(selectedOrder.date, selectedOrder.created_at)?.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : ""}
            </DialogDescription>
          </DialogHeader>

          {loadingOrder ? (
            <div className="py-12 flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="text-sm text-muted-foreground">Carregando detalhes...</p>
            </div>
          ) : selectedOrder ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Resumo</p>
                  <p className="text-sm">{selectedOrder.items} {selectedOrder.items === 1 ? 'item' : 'itens'}</p>
                  <p className="font-bold mt-1">R$ {selectedOrder.total.toFixed(2).replace(".", ",")}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Status</p>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide ${statusLabels[selectedOrder.status].color}`}>
                    {statusLabels[selectedOrder.status].label}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Entrega</p>
                <div className="text-sm text-muted-foreground space-y-0.5">
                  <p>{selectedOrder.shipping_street ?? "—"}, {selectedOrder.shipping_number ?? "—"}</p>
                  {selectedOrder.shipping_complement && <p>{selectedOrder.shipping_complement}</p>}
                  <p>{selectedOrder.shipping_city ?? "—"} / {selectedOrder.shipping_state ?? "—"}</p>
                  <p>CEP: {selectedOrder.shipping_zipcode ?? "—"}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Itens</p>
                <div className="space-y-2">
                  {selectedOrder.items_detail?.length ? (
                    selectedOrder.items_detail.map((item) => (
                      <div key={item.product_id} className="flex items-center justify-between gap-3 py-2 border-b border-border/60 last:border-0">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.quantity}× R$ {item.price.toFixed(2).replace(".", ",")}</p>
                        </div>
                        <p className="font-semibold text-sm shrink-0">R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum item detalhado disponível.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">Não foi possível carregar os detalhes.</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeModal} className="rounded-xl">Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
