'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Package, ArrowLeft } from "lucide-react";
import { parseOrderDate } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { statusLabels } from "@/types/supabase";
import type { Order } from "@/types/supabase";

function formatCurrency(value?: number) {
  return value !== undefined ? `R$ ${value.toFixed(2).replace(".", ",")}` : "R$ 0,00";
}

export default function MyOrderDetailPage() {
  const params = useParams();
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
        if (!response.ok) {
          throw new Error("Pedido não encontrado");
        }
        const data: Order = await response.json();

        if (user && data.customer_id && data.customer_id !== user.id && user.role !== 'admin') {
          setError("Você não tem permissão para ver este pedido.");
          setOrder(null);
        } else {
          setOrder(data);
        }
      } catch (fetchError) {
        console.error("Error fetching order detail:", fetchError);
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
        <div className="container py-20 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground mt-4">Carregando pedido...</p>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <p className="text-xl font-semibold">Faça login para ver seus pedidos.</p>
          <Button asChild>
            <Link href="/auth">Ir para login</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <p className="text-xl font-semibold mb-4">Ops...</p>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button asChild>
            <Link href="/meus-pedidos">Voltar para meus pedidos</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <p className="text-xl font-semibold">Pedido não encontrado</p>
          <Button asChild className="mt-4">
            <Link href="/meus-pedidos">Voltar</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-10 max-w-4xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/meus-pedidos" className="inline-flex items-center gap-2 text-primary hover:text-primary/80">
              <ArrowLeft className="h-4 w-4" /> Voltar aos pedidos
            </Link>
            <h1 className="text-3xl font-bold mt-4">Pedido #{order.id}</h1>
            <p className="text-muted-foreground">{parseOrderDate(order.date, order.created_at)?.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
          </div>
          <div className={`rounded-full px-3 py-1 text-xs font-semibold ${statusLabels[order.status].color}`}>
            {statusLabels[order.status].label}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <div className="rounded-3xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Resumo</h2>
            <p className="text-sm text-muted-foreground mb-2">{order.items} item(ns)</p>
            <p className="text-sm text-muted-foreground">Total: <span className="font-semibold">{formatCurrency(order.total)}</span></p>
          </div>
          <div className="rounded-3xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Entrega</h2>
            <p className="text-sm text-muted-foreground">{order.shipping_street ?? "-"}, {order.shipping_number ?? "-"}</p>
            {order.shipping_complement && <p className="text-sm text-muted-foreground">{order.shipping_complement}</p>}
            <p className="text-sm text-muted-foreground">{order.shipping_city ?? "-"}, {order.shipping_state ?? "-"}</p>
            <p className="text-sm text-muted-foreground">CEP: {order.shipping_zipcode ?? "-"}</p>
          </div>
        </div>

        <div className="rounded-3xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5 gap-4">
            <div>
              <h2 className="text-lg font-semibold">Itens do pedido</h2>
              <p className="text-sm text-muted-foreground">Confira cada item solicitado.</p>
            </div>
            <p className="text-sm text-muted-foreground">Frete: {formatCurrency(order.shipping_cost)}</p>
          </div>
          <div className="space-y-4">
            {order.items_detail?.length ? (
              order.items_detail.map((item) => (
                <div key={item.product_id} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] items-center rounded-2xl border border-border bg-background p-4">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Quantidade: {item.quantity}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
                  <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum item detalhado disponível.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border bg-card p-6 shadow-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total do pedido</p>
            <p className="text-2xl font-bold">{formatCurrency(order.total)}</p>
          </div>
          <Button asChild>
            <Link href="/meus-pedidos">Voltar para meus pedidos</Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
