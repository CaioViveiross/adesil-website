'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  DollarSign, ShoppingCart, TrendingUp, Users,
  AlertCircle, ArrowUpRight, ArrowDownRight, Package,
  ChevronRight, Clock,
} from "lucide-react";
import { parseOrderDate } from "@/lib/utils";
import { statusLabels } from "@/types/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Order, OrderStatus } from "@/types/supabase";

interface DailyPoint { date: string; revenue: number; count: number }
interface TopProduct  { name: string; count: number; revenue: number }
interface Stats {
  revenue:      { total: number; thisMonth: number; lastMonth: number };
  orders:       { total: number; thisMonth: number; lastMonth: number; byStatus: Record<string, number>; pending: number };
  avgTicket:    number;
  daily:        DailyPoint[];
  topProducts:  TopProduct[];
  recentOrders: Order[];
  customers:    { total: number; newThisMonth: number };
}

const fmt = (v: number) =>
  "R$ " + Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function pct(curr: number, prev: number) {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

function Trend({ curr, prev }: { curr: number; prev: number }) {
  const delta = pct(curr, prev);
  if (delta === 0 || prev === 0) return null;
  const up = delta > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${up ? "text-emerald-600" : "text-red-500"}`}>
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(delta)}% vs mês anterior
    </span>
  );
}

function BarChart({ data }: { data: DailyPoint[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const fmt2 = (d: string) => {
    const [, m, day] = d.split("-");
    return `${day}/${m}`;
  };
  return (
    <div className="flex items-end gap-1 h-28 w-full">
      {data.map((d) => {
        const h = Math.max((d.revenue / max) * 100, d.revenue > 0 ? 4 : 0);
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10">
              <div className="bg-foreground text-background text-[10px] px-2 py-1 rounded-lg whitespace-nowrap">
                {d.revenue > 0 ? fmt(d.revenue) : "–"}
              </div>
              <div className="w-px h-2 bg-foreground/30" />
            </div>
            <div
              className={`w-full rounded-t-sm transition-all duration-500 ${d.revenue > 0 ? "bg-primary" : "bg-muted"}`}
              style={{ height: `${h}%` }}
            />
            {data.length <= 14 && (
              <span className="text-[9px] text-muted-foreground/60 rotate-0 whitespace-nowrap">
                {fmt2(d.date)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

const STATUS_ORDER: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "failed", "refunded", "cancelled"];

function StatusBreakdown({ byStatus }: { byStatus: Record<string, number> }) {
  const total = Object.values(byStatus).reduce((s, v) => s + v, 0) || 1;
  return (
    <div className="space-y-2.5">
      {STATUS_ORDER.filter((s) => byStatus[s]).map((s) => {
        const count = byStatus[s] ?? 0;
        const pct   = Math.round((count / total) * 100);
        const info  = statusLabels[s];
        return (
          <div key={s} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${info.color}`}>{info.label}</span>
              <span className="font-semibold tabular-nums">{count} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KpiCard({
  label, value, sub, icon: Icon, accent = false,
}: {
  label: string; value: string; sub?: React.ReactNode; icon: React.ElementType; accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 flex flex-col gap-3 ${accent ? "bg-primary text-primary-foreground border-primary" : "bg-card"}`}>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${accent ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent ? "bg-primary-foreground/15" : "bg-muted"}`}>
          <Icon className={`h-4 w-4 ${accent ? "text-primary-foreground" : "text-muted-foreground"}`} />
        </div>
      </div>
      <p className={`text-2xl font-bold tracking-tight ${accent ? "text-primary-foreground" : ""}`}>{value}</p>
      {sub && <div className={accent ? "text-primary-foreground/70" : ""}>{sub}</div>}
    </div>
  );
}

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`bg-muted animate-pulse rounded-xl ${className}`} />
);

const PERIODS = [
  { label: "7 dias",  days: 7  },
  { label: "14 dias", days: 14 },
  { label: "30 dias", days: 30 },
] as const;

export default function AdminDashboard() {
  const [stats, setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState<7 | 14 | 30>(14);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  if (loading) {
    return (
      <AdminLayout>
        <div className="mb-8">
          <Skeleton className="h-7 w-48 mb-1" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-56 mb-6" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </AdminLayout>
    );
  }

  if (!stats) return null;

  const { revenue, orders, avgTicket, daily, topProducts, recentOrders, customers } = stats;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{greeting}{firstName ? `, ${firstName}` : ""}!</h1>
          <p className="text-sm text-muted-foreground capitalize mt-0.5">{today}</p>
        </div>
      </div>

      {/* Alerta de pendentes */}
      {orders.pending > 0 && (
        <Link href="/admin/pedidos?status=pending">
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="font-medium">{orders.pending} {orders.pending === 1 ? "pedido pendente aguardando" : "pedidos pendentes aguardando"} pagamento</span>
            <ChevronRight className="h-4 w-4 ml-auto text-amber-500" />
          </div>
        </Link>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Receita do mês"
          value={fmt(revenue.thisMonth)}
          icon={DollarSign}
          accent
          sub={<Trend curr={revenue.thisMonth} prev={revenue.lastMonth} />}
        />
        <KpiCard
          label="Pedidos do mês"
          value={String(orders.thisMonth)}
          icon={ShoppingCart}
          sub={<Trend curr={orders.thisMonth} prev={orders.lastMonth} />}
        />
        <KpiCard
          label="Ticket médio"
          value={fmt(avgTicket)}
          icon={TrendingUp}
          sub={<span className="text-xs text-muted-foreground">pedidos pagos</span>}
        />
        <KpiCard
          label="Clientes"
          value={String(customers.total)}
          icon={Users}
          sub={
            customers.newThisMonth > 0
              ? <span className="text-xs text-emerald-600 font-semibold">+{customers.newThisMonth} este mês</span>
              : undefined
          }
        />
      </div>

      {/* Gráfico de receita */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="font-bold text-sm">Receita — últimos {period} dias</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Total acumulado: {fmt(daily.slice(-period).reduce((s, d) => s + d.revenue, 0))}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 p-1 bg-muted rounded-xl">
              {PERIODS.map((p) => (
                <button
                  key={p.days}
                  onClick={() => setPeriod(p.days)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    period === p.days
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full hidden sm:block">
              {daily.slice(-period).filter((d) => d.count > 0).length} dias com vendas
            </span>
          </div>
        </div>
        <BarChart data={daily.slice(-period)} />
      </div>

      {/* Status + Top Produtos */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="font-bold text-sm mb-5">Pedidos por status</p>
          {Object.keys(orders.byStatus).length > 0
            ? <StatusBreakdown byStatus={orders.byStatus} />
            : <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p>
          }
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="font-bold text-sm mb-5">Produtos mais vendidos</p>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold text-muted-foreground shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.count} unidades · {fmt(p.revenue)}</p>
                  </div>
                  <Package className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Ainda não há itens vendidos.</p>
          )}
        </div>
      </div>

      {/* Pedidos recentes */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="font-bold text-sm">Pedidos recentes</p>
          <Link href="/admin/pedidos" className="text-xs text-primary hover:underline font-medium">
            Ver todos →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2.5 font-medium text-muted-foreground text-xs">Pedido</th>
                <th className="text-left py-2.5 font-medium text-muted-foreground text-xs">Cliente</th>
                <th className="text-left py-2.5 font-medium text-muted-foreground text-xs hidden md:table-cell">Data</th>
                <th className="text-left py-2.5 font-medium text-muted-foreground text-xs">Status</th>
                <th className="text-right py-2.5 font-medium text-muted-foreground text-xs">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => {
                const info = statusLabels[order.status] ?? { label: order.status, color: "bg-muted text-muted-foreground" };
                return (
                  <tr key={order.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 font-mono text-xs text-muted-foreground">
                      #{String(order.id).slice(0, 8).toUpperCase()}
                    </td>
                    <td className="py-3 font-medium max-w-[120px] truncate">{order.customer_name}</td>
                    <td className="py-3 text-muted-foreground hidden md:table-cell">
                      <span className="flex items-center gap-1 text-xs">
                        <Clock className="h-3 w-3" />
                        {parseOrderDate(order.ordered_at, order.created_at)?.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "short" })}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${info.color}`}>
                        {info.label}
                      </span>
                    </td>
                    <td className="py-3 text-right tabular-nums font-bold">
                      {fmt(Number(order.total))}
                    </td>
                  </tr>
                );
              })}
              {recentOrders.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Nenhum pedido ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
