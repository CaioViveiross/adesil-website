'use server';

import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { statusLabels } from "@/types/supabase";
import { parseOrderDate } from "@/lib/utils";
import { getOrderById } from "@/lib/supabase/orders";
import type { Order } from "@/types/supabase";

interface AdminOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatCurrency(value?: number) {
  return value !== undefined ? `R$ ${value.toFixed(2).replace(".", ",")}` : "R$ 0,00";
}

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const { id } = await params;
  let order: Order | null = null;
  try {
    order = await getOrderById(id);
  } catch (error) {
    console.error("Error loading order detail:", error);
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="container py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Pedido não encontrado</h1>
          <p className="text-muted-foreground">Verifique se o pedido ainda existe ou retorne à lista de pedidos.</p>
          <Link href="/admin/pedidos" className="inline-flex mt-6 items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <ArrowLeft className="h-4 w-4" /> Voltar à lista
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link href="/admin/pedidos" className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80">
              <ArrowLeft className="h-4 w-4" /> Voltar aos pedidos
            </Link>
            <h1 className="text-3xl font-bold mt-4">Pedido #{order.id}</h1>
            <p className="text-muted-foreground mt-1">{new Date(order.ordered_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
          </div>
          <Badge className={statusLabels[order.status].color}>{statusLabels[order.status].label}</Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Dados do Cliente</h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">Nome</p>
                <p>{order.customer_name}</p>
              </div>
              {order.customer_email && (
                <div>
                  <p className="font-medium text-foreground">E-mail</p>
                  <p>{order.customer_email}</p>
                </div>
              )}
              {order.document && (
                <div>
                  <p className="font-medium text-foreground">Documento</p>
                  <p>{order.document}</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Endereço de Entrega</h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>{order.shipping_street ?? "-"}, {order.shipping_number ?? "-"} {order.shipping_complement && `• ${order.shipping_complement}`}</p>
              <p>{order.shipping_city ?? "-"} / {order.shipping_state ?? "-"}</p>
              <p>CEP: {order.shipping_zipcode ?? "-"}</p>
              <p>País: {order.shipping_country ?? "BR"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5 gap-4">
            <div>
              <h2 className="text-lg font-semibold">Itens do Pedido</h2>
              <p className="text-sm text-muted-foreground">{order.items} item(ns)</p>
            </div>
            <p className="text-right text-sm text-muted-foreground">Frete: {formatCurrency(order.shipping_cost)}</p>
          </div>
          <div className="space-y-3 overflow-x-auto">
            {order.items_detail?.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3">Produto</th>
                    <th className="pb-3">Qtd.</th>
                    <th className="pb-3">Preço</th>
                    <th className="pb-3">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items_detail.map((item) => (
                    <tr key={item.product_id} className="border-b last:border-0">
                      <td className="py-3 font-medium text-foreground">{item.name}</td>
                      <td className="py-3 text-muted-foreground">{item.quantity}</td>
                      <td className="py-3 text-muted-foreground">{formatCurrency(item.price)}</td>
                      <td className="py-3 font-medium">{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum item detalhado disponível.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border bg-card p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Total de produtos: {order.items}</p>
            <p>Frete: {formatCurrency(order.shipping_cost)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total do pedido</p>
            <p className="text-2xl font-bold">{formatCurrency(order.total)}</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
