'use client';

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ArrowLeft, CheckCircle2, Package, Clock, CreditCard, Loader2,
  XCircle, RefreshCw, Truck, PackageCheck, RotateCcw, Ban,
} from "lucide-react";
import { parseOrderDate } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { Order, OrderItem, OrderStatus } from "@/types/supabase";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  { key: "pending",    label: "Pendente",  Icon: Clock        },
  { key: "processing", label: "Aprovado",  Icon: CheckCircle2 },
  { key: "shipped",    label: "Enviado",   Icon: Truck        },
  { key: "delivered",  label: "Entregue",  Icon: PackageCheck },
] as const;

const STEP_INDEX: Record<string, number> = {
  pending: 0, processing: 1, shipped: 2, delivered: 3,
};

const TERMINAL: Record<string, { label: string; Icon: typeof XCircle; color: string }> = {
  failed:    { label: "Pagamento falhou", Icon: XCircle,   color: "text-red-600"    },
  refunded:  { label: "Reembolsado",      Icon: RotateCcw, color: "text-orange-600" },
  cancelled: { label: "Cancelado",        Icon: Ban,       color: "text-gray-500"   },
};

function OrderStatusTracker({ status }: { status: OrderStatus }) {
  if (status in TERMINAL) {
    const t = TERMINAL[status];
    return (
      <div className={`flex items-center gap-2 text-sm font-semibold ${t.color}`}>
        <t.Icon className="h-4 w-4" />
        {t.label}
      </div>
    );
  }

  const current = STEP_INDEX[status] ?? 0;

  return (
    <div className="flex items-center w-full">
      {STEPS.map((step, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500
                ${done   ? "bg-primary text-primary-foreground"                          : ""}
                ${active ? "bg-primary text-primary-foreground ring-[5px] ring-primary/15" : ""}
                ${!done && !active ? "bg-muted text-muted-foreground/40"                 : ""}
              `}>
                {active && <span className="absolute inset-0 rounded-full bg-primary/25 animate-ping" />}
                <step.Icon className="h-4 w-4 relative z-10" />
              </div>
              <span className={`text-[11px] font-semibold tracking-wide text-center leading-tight
                ${done || active ? "text-foreground" : "text-muted-foreground/40"}
              `}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mx-3 mb-5 rounded-full overflow-hidden bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-700 ease-out"
                  style={{ width: i < current ? "100%" : "0%" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const fmt = (value?: number) =>
  value !== undefined ? `R$ ${value.toFixed(2).replace(".", ",")}` : "R$ 0,00";

function PaymentBanner({ status, paymentParam, retrying, retryError, onRetry }: {
  status: Order["status"];
  paymentParam: string | null;
  retrying: boolean;
  retryError: string | null;
  onRetry: () => void;
}) {
  if (paymentParam === "success" && status !== "pending") {
    return (
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
    );
  }

  if (status === "failed") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 space-y-3"
      >
        <div className="flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 text-sm">Pagamento não concluído</p>
            <p className="text-red-700 text-xs mt-0.5">Houve um problema com o pagamento. Tente novamente.</p>
          </div>
        </div>
        {retryError && <p className="text-xs text-red-600 bg-red-100 rounded-lg px-3 py-2">{retryError}</p>}
        <Button onClick={onRetry} disabled={retrying} className="w-full h-10 rounded-xl gap-2 bg-red-600 hover:bg-red-700 text-white">
          {retrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {retrying ? "Redirecionando…" : "Tentar novamente"}
        </Button>
      </motion.div>
    );
  }

  if (status === "pending") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3"
      >
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Pagamento pendente</p>
            <p className="text-amber-700 text-xs mt-0.5">Seu pedido está aguardando confirmação de pagamento.</p>
          </div>
        </div>
        {retryError && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{retryError}</p>}
        <Button onClick={onRetry} disabled={retrying} className="w-full h-10 rounded-xl gap-2 bg-amber-600 hover:bg-amber-700 text-white">
          {retrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
          {retrying ? "Redirecionando…" : "Pagar agora"}
        </Button>
      </motion.div>
    );
  }

  return null;
}


function MyOrderDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const paymentParam = searchParams.get("payment");
  const { user, loading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const orderId = params?.id as string;

  const handleRetryPayment = async () => {
    if (!orderId) return;
    setRetrying(true);
    setRetryError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/retry-payment`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao gerar pagamento");
      window.location.href = data.checkout_url;
    } catch (err) {
      setRetryError(err instanceof Error ? err.message : "Erro ao conectar ao gateway de pagamento");
      setRetrying(false);
    }
  };

  useEffect(() => {
    if (!orderId || loading) return;
    const fetchOrder = async () => {
      setLoadingOrder(true);
      setError(null);
      try {
        const [orderRes, itemsRes] = await Promise.all([
          fetch(`/api/orders/${orderId}`),
          fetch(`/api/orders/${orderId}/items`),
        ]);
        if (!orderRes.ok) throw new Error("Pedido não encontrado");
        const data: Order = await orderRes.json();
        if (user && data.customer_id && data.customer_id !== user.id && user.role !== 'admin') {
          setError("Você não tem permissão para ver este pedido.");
          return;
        }
        setOrder(data);
        if (itemsRes.ok) setOrderItems(await itemsRes.json());
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
        <div className="container">
          <EmptyState
            icon={Package}
            title={error || "Pedido não encontrado"}
            action={{ label: "Voltar para meus pedidos", href: "/meus-pedidos", variant: "outline" }}
          />
        </div>
      </Layout>
    );
  }

  const displayItems: Array<{ key: string; name: string; quantity: number; price: number }> =
    orderItems.length > 0
      ? orderItems.map((i) => ({ key: i.id, name: i.product_name_snapshot, quantity: i.quantity, price: i.unit_price }))
      : (order.items_detail ?? []).map((i) => ({ key: i.product_id, name: i.name, quantity: i.quantity, price: i.price }));

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

          <div className="mb-6 p-5 rounded-2xl border border-border bg-card">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-4">Status do pedido</p>
            <OrderStatusTracker status={order.status} />
          </div>

          <PaymentBanner
            status={order.status}
            paymentParam={paymentParam}
            retrying={retrying}
            retryError={retryError}
            onRetry={handleRetryPayment}
          />

          <div className="mb-8">
            <span className="text-[11px] font-bold text-primary uppercase tracking-[0.12em]">Pedido</span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">#{String(order.id).slice(0, 8).toUpperCase()}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {parseOrderDate(order.ordered_at, order.created_at)?.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
            </p>
          </div>
        </motion.div>

        <div className="space-y-4">
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

          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Itens do pedido</p>
            <div className="space-y-3">
              {displayItems.length > 0 ? (
                displayItems.map((item) => (
                  <div
                    key={item.key}
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
