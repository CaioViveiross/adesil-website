'use client';

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { statusLabels } from "@/types/supabase";
import { parseOrderDate } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types/supabase";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

  const openOrderDetail = async (orderId: string) => {
    setModalOpen(true);
    setLoadingOrder(true);
    setSelectedOrder(null);

    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) {
        throw new Error("Não foi possível carregar o pedido.");
      }
      const data: Order = await response.json();
      setSelectedOrder(data);
    } catch (error) {
      console.error("Error loading admin order detail:", error);
    } finally {
      setLoadingOrder(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedOrder(null);
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const response = await fetch(`/api/orders?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const normalizedSearchTerm = searchTerm.toLowerCase();

  const filteredOrders = orders.filter(order => {
    const orderId = String(order.id).toLowerCase();
    const customer = String(order.customer ?? "").toLowerCase();
    return orderId.includes(normalizedSearchTerm) || customer.includes(normalizedSearchTerm);
  });

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchOrders();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  // Helpers
  const formatBRL = (value: number) =>
    `R$ ${value.toFixed(2).replace(".", ",")}`;

  const subtotal = (order: Order) =>
    order.items_detail?.reduce((sum, i) => sum + i.price * i.quantity, 0) ?? 0;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Gerenciar Pedidos</h1>
      </div>

      <div className="bg-card rounded-2xl border p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OrderStatus | "all")}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="processing">Processando</SelectItem>
              <SelectItem value="shipped">Enviado</SelectItem>
              <SelectItem value="delivered">Entregue</SelectItem>
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
                <TableHead className="w-32">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{parseOrderDate(order.date, order.created_at)?.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)}
                    >
                      <SelectTrigger className="w-32">
                        <Badge className={statusLabels[order.status].color}>
                          {statusLabels[order.status].label}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="processing">Processando</SelectItem>
                        <SelectItem value="shipped">Enviado</SelectItem>
                        <SelectItem value="delivered">Entregue</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{order.items}</TableCell>
                  <TableCell className="font-medium">{formatBRL(order.total)}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => openOrderDetail(order.id)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum pedido encontrado.
          </div>
        )}
      </div>

      {/* Modal de detalhes */}
      <Dialog open={modalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {loadingOrder
                ? "Carregando pedido..."
                : selectedOrder
                ? `Pedido #${selectedOrder.id}`
                : "Detalhes do pedido"}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder
                ? parseOrderDate(selectedOrder.date, selectedOrder.created_at)?.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
                : ""}
            </DialogDescription>
          </DialogHeader>

          {loadingOrder ? (
            <div className="py-10 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
              <p className="text-muted-foreground mt-4">Carregando detalhes...</p>
            </div>
          ) : selectedOrder ? (
            <div className="space-y-4">

              {/* Status + Resumo */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border bg-card p-4">
                  <h3 className="text-sm font-semibold mb-3">Resumo</h3>
                  <p className="text-sm text-muted-foreground mb-1">Itens: {selectedOrder.items}</p>
                  <p className="text-sm text-muted-foreground">
                    Total: <span className="font-semibold text-foreground">{formatBRL(selectedOrder.total)}</span>
                  </p>
                </div>
                <div className="rounded-2xl border bg-card p-4">
                  <h3 className="text-sm font-semibold mb-3">Status</h3>
                  <Badge className={statusLabels[selectedOrder.status].color}>
                    {statusLabels[selectedOrder.status].label}
                  </Badge>
                </div>
              </div>

              {/* Cliente & Faturamento (dados para NF) */}
              <div className="rounded-2xl border bg-card p-4">
                <h3 className="text-sm font-semibold mb-3">Cliente &amp; Faturamento</h3>
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                  <span className="text-muted-foreground">Nome</span>
                  <span>{selectedOrder.customer ?? "-"}</span>

                  <span className="text-muted-foreground">Faturar em nome de</span>
                  <span>{selectedOrder.billing_name ?? selectedOrder.customer ?? "-"}</span>

                  <span className="text-muted-foreground">E-mail</span>
                  <span>{selectedOrder.customer_email ?? "-"}</span>

                  <span className="text-muted-foreground">CPF / CNPJ</span>
                  <span className="font-mono">{selectedOrder.document ?? "-"}</span>
                </div>
              </div>

              {/* Entrega */}
              <div className="rounded-2xl border bg-card p-4">
                <h3 className="text-sm font-semibold mb-3">Entrega</h3>
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                  <span className="text-muted-foreground">Endereço</span>
                  <span>
                    {selectedOrder.shipping_street ?? "-"}, {selectedOrder.shipping_number ?? "-"}
                    {selectedOrder.shipping_complement ? ` — ${selectedOrder.shipping_complement}` : ""}
                  </span>

                  <span className="text-muted-foreground">Cidade / UF</span>
                  <span>{selectedOrder.shipping_city ?? "-"} / {selectedOrder.shipping_state ?? "-"}</span>

                  <span className="text-muted-foreground">CEP</span>
                  <span className="font-mono">{selectedOrder.shipping_zipcode ?? "-"}</span>

                  <span className="text-muted-foreground">País</span>
                  <span>{selectedOrder.shipping_country ?? "Brasil"}</span>

                  <span className="text-muted-foreground">Frete</span>
                  <span>{selectedOrder.shipping_cost != null ? formatBRL(selectedOrder.shipping_cost) : "-"}</span>
                </div>
              </div>

              {/* Itens do pedido */}
              <div className="rounded-2xl border bg-card p-4">
                <h3 className="text-sm font-semibold mb-3">Itens do pedido</h3>
                <div className="space-y-2">
                  {selectedOrder.items_detail?.length ? (
                    selectedOrder.items_detail.map((item) => (
                      <div
                        key={item.product_id}
                        className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Qtd: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{formatBRL(item.price * item.quantity)}</p>
                          <p className="text-xs text-muted-foreground">{item.quantity} × {formatBRL(item.price)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum item detalhado disponível.</p>
                  )}
                </div>

                {/* Totais */}
                {selectedOrder.items_detail?.length ? (
                  <div className="mt-4 border-t pt-3 space-y-1 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>{formatBRL(subtotal(selectedOrder))}</span>
                    </div>
                    {selectedOrder.shipping_cost != null && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Frete</span>
                        <span>{formatBRL(selectedOrder.shipping_cost)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-foreground pt-1 border-t">
                      <span>Total</span>
                      <span>{formatBRL(selectedOrder.total)}</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Não foi possível carregar detalhes do pedido.</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}