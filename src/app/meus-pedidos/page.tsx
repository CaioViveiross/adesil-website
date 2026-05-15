'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/layout/Layout";
import { Clock, CheckCircle2, Truck, PackageCheck, ChevronRight, Package, XCircle, RotateCcw, Ban } from "lucide-react";
import { parseOrderDate } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types/supabase";
import { motion } from "framer-motion";

const STEPS = [
  { key: "pending",    label: "Pendente",   shortLabel: "Pend.",   Icon: Clock         },
  { key: "processing", label: "Aprovado",   shortLabel: "Aprov.",  Icon: CheckCircle2  },
  { key: "shipped",    label: "Enviado",    shortLabel: "Env.",    Icon: Truck         },
  { key: "delivered",  label: "Entregue",   shortLabel: "Entreg.", Icon: PackageCheck  },
] as const;

const STEP_INDEX: Record<string, number> = {
  pending: 0, processing: 1, shipped: 2, delivered: 3,
};

const TERMINAL: Record<string, { label: string; Icon: typeof XCircle; bg: string; text: string }> = {
  failed:    { label: "Pagamento falhou",  Icon: XCircle,    bg: "bg-red-100 dark:bg-red-950/40",    text: "text-red-600 dark:text-red-400"    },
  refunded:  { label: "Reembolsado",       Icon: RotateCcw,  bg: "bg-orange-100 dark:bg-orange-950/40", text: "text-orange-600 dark:text-orange-400" },
  cancelled: { label: "Cancelado",         Icon: Ban,        bg: "bg-gray-100 dark:bg-gray-800/60",  text: "text-gray-500 dark:text-gray-400"  },
};

function StatusStepper({ status }: { status: OrderStatus }) {
  if (status in TERMINAL) {
    const t = TERMINAL[status];
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${t.bg} ${t.text}`}>
        <t.Icon className="h-3.5 w-3.5" />
        {t.label}
      </div>
    );
  }

  const current = STEP_INDEX[status] ?? 0;

  return (
    <div className="w-full">
      <div className="hidden sm:flex items-center w-full">
        {STEPS.map((step, i) => {
          const done    = i < current;
          const active  = i === current;
          const future  = i > current;
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5 relative">
                <div className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-500
                  ${done   ? "bg-primary text-primary-foreground"                         : ""}
                  ${active ? "bg-primary text-primary-foreground ring-4 ring-primary/20"  : ""}
                  ${future ? "bg-muted text-muted-foreground/40"                          : ""}
                `}>
                  {active && (
                    <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                  )}
                  <step.Icon className="h-4 w-4 relative z-10" />
                </div>
                <span className={`text-[10px] font-semibold tracking-wide whitespace-nowrap
                  ${done || active ? "text-foreground" : "text-muted-foreground/50"}
                `}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px mx-2 mb-4 rounded-full overflow-hidden bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-700 ease-out rounded-full"
                    style={{ width: i < current ? "100%" : "0%" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex sm:hidden items-center gap-1.5">
        {STEPS.map((step, i) => {
          const done   = i < current;
          const active = i === current;
          return (
            <div key={step.key} className="flex items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0
                ${done   ? "bg-primary text-primary-foreground"                        : ""}
                ${active ? "bg-primary text-primary-foreground ring-[3px] ring-primary/20" : ""}
                ${!done && !active ? "bg-muted text-muted-foreground/40"               : ""}
              `}>
                {active && <span className="absolute w-6 h-6 rounded-full bg-primary/30 animate-ping" />}
                <step.Icon className="h-3 w-3" />
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-5 h-px bg-muted overflow-hidden rounded-full">
                  <div className="h-full bg-primary transition-all duration-700" style={{ width: i < current ? "100%" : "0%" }} />
                </div>
              )}
            </div>
          );
        })}
        <span className="ml-1.5 text-[11px] font-semibold text-foreground">
          {STEPS[current]?.label ?? status}
        </span>
      </div>
    </div>
  );
}

function OrderSkeleton() {
  return (
    <div className="p-5 rounded-2xl border border-border bg-card space-y-4 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="h-4 w-36 bg-muted rounded-full" />
          <div className="h-3 w-28 bg-muted rounded-full" />
        </div>
        <div className="h-5 w-20 bg-muted rounded-full" />
      </div>
      <div className="flex items-center gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className={`rounded-full bg-muted ${i % 2 === 0 ? "w-8 h-8" : "flex-1 h-px"} last:hidden sm:block hidden`} />
        ))}
        <div className="flex sm:hidden items-center gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-muted" />
              {i < 3 && <div className="w-5 h-px bg-muted" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center text-center gap-5 py-24"
    >
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center">
          <Package className="h-9 w-9 text-primary" />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-muted border-2 border-background flex items-center justify-center">
          <span className="text-[9px] font-bold text-muted-foreground">0</span>
        </div>
      </div>
      <div className="space-y-1.5 max-w-xs">
        <p className="font-bold text-lg tracking-tight">Nenhum pedido ainda</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Quando você fizer sua primeira compra, o histórico de pedidos vai aparecer aqui.
        </p>
      </div>
    </motion.div>
  );
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders?mine=true");
        if (res.ok) setOrders(await res.json());
      } catch {
        console.error("Error fetching orders");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <Layout>
      <div className="container py-12 md:py-20 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 md:mb-10"
        >
          <span className="text-[11px] font-bold text-primary uppercase tracking-[0.12em]">Conta</span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">Meus Pedidos</h1>
          {!loading && orders.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {orders.length} {orders.length === 1 ? "pedido encontrado" : "pedidos encontrados"}
            </p>
          )}
        </motion.div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <OrderSkeleton key={i} />)}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {orders.map((order, i) => {
              const date = parseOrderDate(order.ordered_at, order.created_at);
              const isTerminal = order.status in TERMINAL;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className="group p-5 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all duration-200 cursor-pointer"
                  onClick={() => router.push(`/meus-pedidos/${order.id}`)}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm tracking-tight">
                          Pedido #{String(order.id).slice(0, 8).toUpperCase()}
                        </span>
                        {isTerminal && (
                          <span className="hidden" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span>{order.items} {order.items === 1 ? "item" : "itens"}</span>
                        {order.shipping_city && (
                          <>
                            <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40" />
                            <span>{order.shipping_city}/{order.shipping_state}</span>
                          </>
                        )}
                        {date && (
                          <>
                            <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40" />
                            <span>{date.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "short", year: "numeric" })}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="font-bold text-sm tabular-nums">
                          R$ {Number(order.total).toFixed(2).replace(".", ",")}
                        </p>
                        {order.shipping_cost === 0 && (
                          <p className="text-[10px] text-emerald-600 font-semibold">Frete grátis</p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60">
                    <StatusStepper status={order.status} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
