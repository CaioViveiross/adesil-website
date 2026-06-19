'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Search, Eye } from "lucide-react";
import { AdminPageLoader } from "@/components/admin/AdminLoader";
import { statusLabels } from "@/types/supabase";
import { parseOrderDate } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types/supabase";

const ALL_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "pending",    label: "Pendente"     },
  { value: "processing", label: "Processando"  },
  { value: "shipped",    label: "Enviado"      },
  { value: "delivered",  label: "Entregue"     },
  { value: "failed",     label: "Falhou"       },
  { value: "refunded",   label: "Reembolsado"  },
  { value: "cancelled",  label: "Cancelado"    },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const response = await fetch(`/api/orders?${params}`, { cache: 'no-store' });
      if (response.ok) setOrders(await response.json());
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) await fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const normalizedSearch = searchTerm.toLowerCase();
  const filteredOrders = orders.filter((order) => {
    const id = String(order.id).toLowerCase();
    const customer = String(order.customer_name ?? "").toLowerCase();
    return id.includes(normalizedSearch) || customer.includes(normalizedSearch);
  });

  const formatBRL = (value: number) => `R$ ${value.toFixed(2).replace(".", ",")}`;

  if (loading) return <AdminPageLoader />;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Gerenciar Pedidos</h1>
      </div>

      <div className="bg-card rounded-2xl border p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus | "all")}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    #{String(order.id).slice(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell>{order.customer_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {parseOrderDate(order.ordered_at, order.created_at)?.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(v) => handleStatusChange(order.id, v as OrderStatus)}
                    >
                      <SelectTrigger className="w-36 h-8">
                        <Badge className={statusLabels[order.status]?.color}>
                          {statusLabels[order.status]?.label}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{order.items}</TableCell>
                  <TableCell className="font-medium">{formatBRL(order.total)}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/pedidos/${order.id}`}>
                        <Eye className="h-4 w-4 mr-1.5" />
                        Ver
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredOrders.length === 0 && (
          <EmptyState variant="compact" title="Nenhum pedido encontrado." />
        )}
      </div>
    </AdminLayout>
  );
}
