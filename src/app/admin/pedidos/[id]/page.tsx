'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Truck, Check, Package, ChevronRight, Clock, PackageCheck, MessageSquare, History } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
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

function formatCurrency(value?: number) {
  return value !== undefined ? `R$ ${value.toFixed(2).replace(".", ",")}` : "R$ 0,00";
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

interface WorkflowStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; nextStatus: OrderStatus; variant?: "default" | "outline" };
  colorClass: string;
}

function getWorkflowStep(status: OrderStatus): WorkflowStep | null {
  switch (status) {
    case "pending":
      return {
        icon: <Clock className="h-5 w-5" />,
        title: "Aguardando pagamento",
        description: "O pedido foi criado mas o pagamento ainda não foi confirmado. O status mudará automaticamente para 'Processando' quando o AbacatePay confirmar o pagamento.",
        action: { label: "Forçar como Processando", nextStatus: "processing", variant: "outline" },
        colorClass: "bg-yellow-50 border-yellow-200 text-yellow-900",
      };
    case "processing":
      return {
        icon: <PackageCheck className="h-5 w-5" />,
        title: "Pronto para envio",
        description: "Pagamento confirmado. Separe os produtos, embale e envie. Após despachar, marque o pedido como enviado.",
        action: { label: "Marcar como Enviado", nextStatus: "shipped" },
        colorClass: "bg-sky-50 border-sky-200 text-sky-900",
      };
    case "shipped":
      return {
        icon: <Truck className="h-5 w-5" />,
        title: "Pedido a caminho",
        description: "O pedido foi enviado e está em trânsito. Confirme a entrega assim que o cliente receber o produto.",
        action: { label: "Confirmar Entrega", nextStatus: "delivered", variant: "outline" },
        colorClass: "bg-purple-50 border-purple-200 text-purple-900",
      };
    default:
      return null;
  }
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [internalNotes, setInternalNotes] = useState("");

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
        setInternalNotes(orderData.internal_notes ?? "");
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
        const updated: Order = await res.json();
        setOrder(updated);
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

  const handleSaveNotes = async () => {
    if (!order) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internal_notes: internalNotes.trim() || null }),
      });
      if (res.ok) {
        setOrder((prev) => prev ? { ...prev, internal_notes: internalNotes.trim() || undefined } : prev);
        toast.success("Nota salva");
      } else {
        toast.error("Erro ao salvar nota");
      }
    } catch {
      toast.error("Erro ao salvar nota");
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) return <AdminPageLoader />;

  if (!order) {
    return (
      <AdminLayout>
        <div className="container">
          <EmptyState
            icon={Package}
            title="Pedido não encontrado"
            action={{ label: "Voltar à lista", href: "/admin/pedidos", variant: "outline" }}
          />
        </div>
      </AdminLayout>
    );
  }

  const subtotal = orderItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  const workflowStep = getWorkflowStep(order.status);
  const statusHistory = Array.isArray(order.status_history) ? order.status_history : [];

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

        {/* Workflow banner */}
        {workflowStep && (
          <div className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4 ${workflowStep.colorClass}`}>
            <div className="flex items-start gap-3 flex-1">
              <div className="mt-0.5 shrink-0">{workflowStep.icon}</div>
              <div>
                <p className="font-semibold text-sm">{workflowStep.title}</p>
                <p className="text-sm opacity-80 mt-0.5 leading-relaxed">{workflowStep.description}</p>
              </div>
            </div>
            {workflowStep.action && (
              <Button
                size="sm"
                variant={workflowStep.action.variant ?? "default"}
                disabled={savingStatus}
                onClick={() => handleStatusChange(workflowStep.action!.nextStatus)}
                className="shrink-0 gap-1.5"
              >
                {savingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                {workflowStep.action.label}
              </Button>
            )}
          </div>
        )}

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
                    <th className="pb-3 font-medium">Qtd.</th>
                    <th className="pb-3 font-medium">Preço unit.</th>
                    <th className="pb-3 font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-3 font-medium text-foreground">{item.product_name_snapshot}</td>
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

        {/* Notas internas + Histórico lado a lado */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Notas internas */}
          <div className="rounded-3xl border bg-card p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Notas Internas</h2>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">Visível apenas para a equipe. Não aparece para o cliente.</p>
            <Textarea
              placeholder="Adicione observações sobre este pedido..."
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <Button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              variant="outline"
              className="self-start gap-2"
            >
              {savingNotes ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Salvar nota
            </Button>
          </div>

          {/* Histórico de status */}
          <div className="rounded-3xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Histórico de Status</h2>
            </div>

            {statusHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma mudança de status registrada ainda.</p>
            ) : (
              <ol className="space-y-3">
                {[...statusHistory].reverse().map((entry, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                    <div className="flex-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                      <Badge className={statusLabels[entry.status]?.color}>
                        {statusLabels[entry.status]?.label ?? entry.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatDateTime(entry.changed_at)}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
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
