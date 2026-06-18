'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Truck, ExternalLink, Copy, Check } from "lucide-react";
import { AdminPageLoader } from "@/components/admin/AdminLoader";
import { statusLabels } from "@/types/supabase";
import { parseOrderDate } from "@/lib/utils";
import { toast } from "sonner";
import type { Order, OrderItem, OrderStatus } from "@/types/supabase";

const ALL_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "pending",    label: "Pendente"     },
  { value: "processing", label: "Processando"  },
  { value: "shipped",    label: "Enviado"      },
  { value: "delivered",  label: "Entregue"     },
  { value: "failed",     label: "Falhou"       },
  { value: "refunded",   label: "Reembolsado"  },
  { value: "cancelled",  label: "Cancelado"    },
];

const CARRIERS = ["Correios", "Jadlog", "Total Express", "Azul Cargo", "Latam Cargo", "Outro"];

function formatCurrency(value?: number) {
  return value !== undefined ? `R$ ${value.toFixed(2).replace(".", ",")}` : "R$ 0,00";
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingTracking, setSavingTracking] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  const [trackingCarrier, setTrackingCarrier] = useState("Correios");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const [orderRes, itemsRes] = await Promise.all([
          fetch(`/api/orders/${id}`),
          fetch(`/api/orders/${id}/items`),
        ]);
        if (!orderRes.ok) { router.push("/admin/pedidos"); return; }
        const orderData: Order = await orderRes.json();
        setOrder(orderData);
        setTrackingCode(orderData.tracking_code ?? "");
        setTrackingCarrier(orderData.tracking_carrier ?? "Correios");
        if (itemsRes.ok) setOrderItems(await itemsRes.json());
      } catch {
        router.push("/admin/pedidos");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return;
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrder((prev) => prev ? { ...prev, status: newStatus } : prev);
        toast.success("Status atualizado");
      } else {
        toast.error("Erro ao atualizar status");
      }
    } catch {
      toast.error("Erro ao atualizar status");
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSaveTracking = async () => {
    if (!order) return;
    setSavingTracking(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tracking_code:    trackingCode.trim() || null,
          tracking_carrier: trackingCarrier || "Correios",
        }),
      });
      if (res.ok) {
        setOrder((prev) => prev ? {
          ...prev,
          tracking_code:    trackingCode.trim() || undefined,
          tracking_carrier: trackingCarrier,
        } : prev);
        toast.success("Rastreio salvo");
      } else {
        toast.error("Erro ao salvar rastreio");
      }
    } catch {
      toast.error("Erro ao salvar rastreio");
    } finally {
      setSavingTracking(false);
    }
  };

  const copyCode = () => {
    if (!trackingCode) return;
    navigator.clipboard.writeText(trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading) return <AdminPageLoader />;

  if (!order) {
    return (
      <AdminLayout>
        <div className="container py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Pedido não encontrado</h1>
          <Link href="/admin/pedidos" className="inline-flex mt-6 items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <ArrowLeft className="h-4 w-4" /> Voltar à lista
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const subtotal = orderItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link href="/admin/pedidos" className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80">
              <ArrowLeft className="h-4 w-4" /> Voltar aos pedidos
            </Link>
            <h1 className="text-3xl font-bold mt-4">
              Pedido #{String(order.id).slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {parseOrderDate(order.ordered_at, order.created_at)?.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
            </p>
          </div>

          {/* Status editor */}
          <div className="flex items-center gap-3">
            <Select
              value={order.status}
              onValueChange={(v) => handleStatusChange(v as OrderStatus)}
              disabled={savingStatus}
            >
              <SelectTrigger className="w-44">
                {savingStatus
                  ? <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  : <Badge className={statusLabels[order.status]?.color}>{statusLabels[order.status]?.label}</Badge>
                }
              </SelectTrigger>
              <SelectContent>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cliente + Endereço */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Cliente &amp; Faturamento</h2>
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <span className="text-muted-foreground">Nome</span>
              <span>{order.customer_name ?? "—"}</span>
              <span className="text-muted-foreground">Faturar em nome de</span>
              <span>{order.billing_name ?? order.customer_name ?? "—"}</span>
              <span className="text-muted-foreground">E-mail</span>
              <span>{order.customer_email ?? "—"}</span>
              <span className="text-muted-foreground">CPF / CNPJ</span>
              <span className="font-mono">{order.document ?? "—"}</span>
            </div>
          </div>

          <div className="rounded-3xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Endereço de Entrega</h2>
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <span className="text-muted-foreground">Endereço</span>
              <span>
                {order.shipping_street ?? "—"}, {order.shipping_number ?? "—"}
                {order.shipping_complement ? ` — ${order.shipping_complement}` : ""}
              </span>
              <span className="text-muted-foreground">Cidade / UF</span>
              <span>{order.shipping_city ?? "—"} / {order.shipping_state ?? "—"}</span>
              <span className="text-muted-foreground">CEP</span>
              <span className="font-mono">{order.shipping_zipcode ?? "—"}</span>
              <span className="text-muted-foreground">País</span>
              <span>{order.shipping_country ?? "Brasil"}</span>
            </div>
          </div>
        </div>

        {/* Itens */}
        <div className="rounded-3xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5 gap-4">
            <div>
              <h2 className="text-lg font-semibold">Itens do Pedido</h2>
              <p className="text-sm text-muted-foreground">{order.items} item(ns)</p>
            </div>
            <p className="text-right text-sm text-muted-foreground">
              Frete: {formatCurrency(order.shipping_cost)}
            </p>
          </div>

          {orderItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Produto</th>
                    <th className="pb-3 font-medium">SKU</th>
                    <th className="pb-3 font-medium">Qtd.</th>
                    <th className="pb-3 font-medium">Preço unit.</th>
                    <th className="pb-3 font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-3 font-medium text-foreground">{item.product_name_snapshot}</td>
                      <td className="py-3 text-muted-foreground font-mono text-xs">{item.sku_snapshot ?? "—"}</td>
                      <td className="py-3 text-muted-foreground">{item.quantity}</td>
                      <td className="py-3 text-muted-foreground">{formatCurrency(item.unit_price)}</td>
                      <td className="py-3 font-medium">{formatCurrency(item.unit_price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum item detalhado disponível.</p>
          )}

          {orderItems.length > 0 && (
            <div className="mt-4 border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {order.shipping_cost != null && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Frete</span>
                  <span>{order.shipping_cost === 0 ? "Grátis" : formatCurrency(order.shipping_cost)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-foreground pt-1 border-t">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Rastreio */}
        <div className="rounded-3xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Truck className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Rastreio de Envio</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Transportadora</Label>
              <Select value={trackingCarrier} onValueChange={setTrackingCarrier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CARRIERS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Código de Rastreio</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="AA000000000BR"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                  className="font-mono"
                />
                {trackingCode && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-10 w-10 p-0 shrink-0"
                    onClick={copyCode}
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={handleSaveTracking} disabled={savingTracking} className="gap-2">
              {savingTracking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Salvar rastreio
            </Button>

            {order.tracking_code && (
              <a
                href={`https://rastreamento.correios.com.br/app/resultado.php?objeto=${order.tracking_code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Rastrear nos Correios
              </a>
            )}
          </div>

          {order.tracking_code && (
            <p className="mt-3 text-xs text-muted-foreground">
              Código atual: <span className="font-mono text-foreground">{order.tracking_code}</span>
              {order.tracking_carrier && ` — ${order.tracking_carrier}`}
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" asChild>
            <Link href="/admin/pedidos"><ArrowLeft className="h-4 w-4 mr-2" /> Voltar à lista</Link>
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
