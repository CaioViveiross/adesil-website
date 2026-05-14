'use client';

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Package, Clock } from "lucide-react";
import { parseOrderDate } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { statusLabels } from "@/types/supabase";
import type { Order } from "@/types/supabase";
import { motion } from "framer-motion";

const fmt = (value?: number) =>
  value !== undefined ? `R$ ${value.toFixed(2).replace(".", ",")}` : "R$ 0,00";

function MyOrderDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const paymentParam = searchParams.get("payment");
  const { user, loading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const orderId = params?.id;

  useEffect(() => {
    if (!orderId || loading) return;
    const fetchOrder = async () => {
      setLoadingOrder(true);
      setError(null);
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (!response.ok) throw new Error("Pedido não encontrado");
        const data: Order = await response.json();
        if (user && data.customer_id && data.customer_id !== user.id && user.role !== 'admin') {
          setError("Você não tem permissão para ver este pedido.");
        } else {
          setOrder(data);
        }
      } catch {
        setError("Não foi possível carregar os detalhes do pedido.");
      } finally {
        setLoadingOrder(false);
      }
    };
    fetchOrder();
  }, [orderId, user, loading]);

  if (loading || loadingOrder) {
    return (
      <Layout>
        <div className="container py-20 flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">Carregando pedido...</p>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container py-20 flex flex-col items-center text-center gap-4">
          <p className="font-semibold">Faça login para ver seus pedidos.</p>
          <Button asChild className="h-10 rounded-xl"><Link href="/auth">Ir para login</Link></Button>
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout>
        <div className="container py-20 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <Package className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="font-semibold">{error || "Pedido não encontrado"}</p>
          <Button asChild variant="outline" className="h-10 rounded-xl">
            <Link href="/meus-pedidos">Voltar para meus pedidos</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12 md:py-20 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            href="/meus-pedidos"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Voltar aos pedidos
          </Link>

          {/* Banner de pagamento confirmado */}
          {paymentParam === "success" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-800 text-sm">Pagamento recebido com sucesso!</p>
                <p className="text-emerald-700 text-xs mt-0.5">Seu pedido está sendo processado. Acompanhe o status abaixo.</p>
              </div>
            </motion.div>
          )}

          {/* Banner de pagamento pendente (sem AbacatePay configurado) */}
          {paymentParam === "pending" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
            >
              <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 text-sm">Pedido criado — aguardando pagamento</p>
                <p className="text-amber-700 text-xs mt-0.5">Entre em contato para regularizar o pagamento deste pedido.</p>
              </div>
            </motion.div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-8">
            <div>
              <span className="text-[11px] font-bold text-primary uppercase tracking-[0.12em]">Pedido</span>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">#{String(order.id).slice(0, 8)}...</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {parseOrderDate(order.date, order.created_at)?.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
              </p>
            </div>
            <span className={`self-start text-xs px-3 py-1.5 rounded-full font-semibold uppercase tracking-wide ${statusLabels[order.status].color}`}>
              {statusLabels[order.status].label}
            </span>
          </div>
        </motion.div>

        <div className="space-y-4">
          {/* Summary + Delivery */}
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                title: "Resumo",
                content: (
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>{order.items} {order.items === 1 ? 'item' : 'itens'}</p>
                    <p>Total: <span className="font-bold text-foreground">{fmt(order.total)}</span></p>
                    {order.shipping_cost !== undefined && (
                      <p>Frete: <span className="text-foreground">{order.shipping_cost === 0 ? "Grátis" : fmt(order.shipping_cost)}</span></p>
                    )}
                  </div>
                ),
              },
              {
                title: "Entrega",
                content: (
                  <div className="space-y-0.5 text-sm text-muted-foreground">
                    <p>{order.shipping_street ?? "—"}, {order.shipping_number ?? "—"}</p>
                    {order.shipping_complement && <p>{order.shipping_complement}</p>}
                    <p>{order.shipping_city ?? "—"}, {order.shipping_state ?? "—"}</p>
                    <p>CEP: {order.shipping_zipcode ?? "—"}</p>
                  </div>
                ),
              },
            ].map(({ title, content }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{title}</p>
                {content}
              </div>
            ))}
          </div>

          {/* Items */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Itens do pedido</p>
            <div className="space-y-3">
              {order.items_detail?.length ? (
                order.items_detail.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex items-center justify-between gap-4 py-3 border-b border-border/60 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.quantity}× {fmt(item.price)}</p>
                    </div>
                    <p className="font-semibold text-sm shrink-0">{fmt(item.price * item.quantity)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum item detalhado disponível.</p>
              )}
            </div>
          </div>

          {/* Total bar */}
          <div className="rounded-2xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total do pedido</p>
              <p className="text-2xl font-bold mt-1">{fmt(order.total)}</p>
            </div>
            <Button asChild variant="outline" className="h-10 rounded-xl shrink-0">
              <Link href="/meus-pedidos">Voltar para meus pedidos</Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function MyOrderDetailPage() {
  return (
    <Suspense>
      <MyOrderDetailContent />
    </Suspense>
  );
}
