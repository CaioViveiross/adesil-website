'use client';

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, UserCheck, UserX, ShoppingBag, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { AdminPageLoader, AdminContentLoader } from "@/components/admin/AdminLoader";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Input } from "@/components/ui/input";
import { statusLabels } from "@/types/supabase";
import type { Profile, UserRole, Order } from "@/types/supabase";

export default function AdminSettingsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState<Profile | null>(null);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchProfiles = async () => {
    const response = await fetch('/api/admin/profiles?limit=100', { cache: 'no-store' });
    if (response.ok) setProfiles(await response.json());
    setLoading(false);
  };

  useEffect(() => { fetchProfiles(); }, []);

  const filteredProfiles = profiles.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRoleChange = async (profileId: string, newRole: UserRole) => {
    const response = await fetch(`/api/admin/profiles/${profileId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    if (response.ok) fetchProfiles();
  };

  const handleDeleteProfile = async (profileId: string) => {
    const response = await fetch(`/api/admin/profiles/${profileId}`, { method: 'DELETE' });
    if (response.ok) fetchProfiles();
  };

  const openHistory = async (profile: Profile) => {
    setHistoryCustomer(profile);
    setHistoryOrders([]);
    setHistoryOpen(true);
    setHistoryLoading(true);
    const res = await fetch(`/api/orders?customer_id=${profile.id}&limit=50`, { cache: 'no-store' });
    if (res.ok) setHistoryOrders(await res.json());
    setHistoryLoading(false);
  };

  const totalSpent = historyOrders
    .filter((o) => o.status !== "cancelled" && o.status !== "failed")
    .reduce((s, o) => s + Number(o.total), 0);

  const fmt = (v: number) => "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  if (loading) return <AdminPageLoader />;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Usuários</h1>
      </div>

      <div className="space-y-8">
        <div className="bg-card rounded-2xl border p-6">
          <div className="flex items-center gap-2 mb-6">
            <UserCheck className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Gerenciamento de Usuários</h2>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="w-28">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.name}</TableCell>
                    <TableCell className="text-muted-foreground">{profile.email}</TableCell>
                    <TableCell>
                      <Select
                        value={profile.role}
                        onValueChange={(v) => handleRoleChange(profile.id, v as UserRole)}
                      >
                        <SelectTrigger className="w-32">
                          <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                            {profile.role === 'admin' ? 'Admin' : 'Cliente'}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="customer">Cliente</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(profile.created_at || '').toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm" variant="ghost" className="h-8 w-8 p-0" title="Histórico de compras"
                          onClick={() => openHistory(profile)}
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm" variant="ghost" className="h-8 w-8 p-0"
                          onClick={() => setDeleteTarget(profile.id)}
                          disabled={profile.role === 'admin' && filteredProfiles.filter((p) => p.role === 'admin').length === 1}
                        >
                          <UserX className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredProfiles.length === 0 && (
            <EmptyState variant="compact" title="Nenhum usuário encontrado." />
          )}
        </div>

        <div className="bg-card rounded-2xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Informações do Sistema</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total de Usuários", value: profiles.length },
              { label: "Administradores",   value: profiles.filter((p) => p.role === "admin").length },
              { label: "Clientes",          value: profiles.filter((p) => p.role === "customer").length },
              { label: "Data Atual",        value: new Date().toLocaleDateString("pt-BR") },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-4 rounded-xl bg-muted/40">
                <div className="text-2xl font-bold text-primary">{value}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal histórico de compras */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Histórico de {historyCustomer?.name}
            </DialogTitle>
          </DialogHeader>

          {historyLoading ? (
            <AdminContentLoader />
          ) : (
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Pedidos", value: historyOrders.length },
                  { label: "Total gasto", value: fmt(totalSpent) },
                  { label: "Ticket médio", value: historyOrders.length > 0 ? fmt(totalSpent / historyOrders.length) : "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border bg-card p-3 text-center">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-bold text-sm mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              {historyOrders.length === 0 ? (
                <EmptyState variant="compact" title="Nenhum pedido encontrado." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-8" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyOrders.map((order) => {
                      const info = statusLabels[order.status] ?? { label: order.status, color: "bg-muted text-muted-foreground" };
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            #{String(order.id).slice(0, 8).toUpperCase()}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {order.ordered_at
                              ? new Date(order.ordered_at).toLocaleDateString("pt-BR")
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${info.color}`}>
                              {info.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-semibold tabular-nums text-sm">
                            {fmt(Number(order.total))}
                          </TableCell>
                          <TableCell>
                            <a href={`/admin/pedidos/${order.id}`} target="_blank" rel="noopener noreferrer">
                              <ChevronRight className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                            </a>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Excluir usuário?"
        description="O perfil será removido permanentemente. Os pedidos associados serão mantidos."
        onConfirm={async () => { await handleDeleteProfile(deleteTarget!); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}
