'use client';

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";
import { AdminContentLoader } from "@/components/admin/AdminLoader";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

interface Coupon {
  id: number;
  code: string;
  type: "percent" | "fixed";
  value: number;
  description: string | null;
  is_active: boolean;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  created_at: string;
}

const empty = (): Partial<Coupon> => ({
  code: "", type: "percent", value: 10, description: "", is_active: true,
  max_uses: null, expires_at: null,
});

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Coupon>>(empty());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);

  const load = async () => {
    const res = await fetch("/api/admin/coupons");
    if (res.ok) setCoupons(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(empty()); setDialogOpen(true); };
  const openEdit = (c: Coupon) => { setEditing({ ...c }); setDialogOpen(true); };

  const save = async () => {
    setSaving(true);
    try {
      const isEdit = Boolean(editing.id);
      const res = await fetch(
        isEdit ? `/api/admin/coupons/${editing.id}` : "/api/admin/coupons",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editing),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Erro ao salvar cupom");
        return;
      }
      toast.success(isEdit ? "Cupom atualizado!" : "Cupom criado!");
      setDialogOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (c: Coupon) => {
    await fetch(`/api/admin/coupons/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !c.is_active }),
    });
    await load();
  };

  const remove = async (c: Coupon) => {
    await fetch(`/api/admin/coupons/${c.id}`, { method: "DELETE" });
    toast.success("Cupom excluído");
    await load();
  };

  const fmtValue = (c: Coupon) =>
    c.type === "percent" ? `${c.value}%` : `R$ ${Number(c.value).toFixed(2).replace(".", ",")}`;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Cupons</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie cupons de desconto da loja.</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Novo cupom
        </Button>
      </div>

      <div className="bg-card rounded-2xl border p-6">
        {loading ? (
          <AdminContentLoader />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-mono font-semibold text-sm">{c.code}</span>
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold">{fmtValue(c)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{c.description ?? "—"}</TableCell>
                  <TableCell className="tabular-nums text-sm">
                    {c.uses_count}{c.max_uses ? `/${c.max_uses}` : ""}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.expires_at
                      ? new Date(c.expires_at).toLocaleDateString("pt-BR")
                      : <span className="text-xs">Sem validade</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={c.is_active} onCheckedChange={() => toggle(c)} />
                      <span className={`text-xs font-medium text-muted-foreground`}>
                        {c.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(c)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {coupons.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Nenhum cupom cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing.id ? "Editar cupom" : "Novo cupom"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Código *</Label>
                <Input
                  placeholder="EX10"
                  value={editing.code ?? ""}
                  onChange={(e) => setEditing((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  className="font-mono uppercase"
                  disabled={Boolean(editing.id)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo *</Label>
                <Select
                  value={editing.type ?? "percent"}
                  onValueChange={(v) => setEditing((p) => ({ ...p, type: v as "percent" | "fixed" }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Porcentagem (%)</SelectItem>
                    <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Valor * {editing.type === "percent" ? "(%)" : "(R$)"}</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={editing.value ?? ""}
                  onChange={(e) => setEditing((p) => ({ ...p, value: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Uso máximo</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Ilimitado"
                  value={editing.max_uses ?? ""}
                  onChange={(e) => setEditing((p) => ({ ...p, max_uses: e.target.value ? Number(e.target.value) : null }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input
                placeholder="Ex.: Desconto de boas-vindas"
                value={editing.description ?? ""}
                onChange={(e) => setEditing((p) => ({ ...p, description: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Data de validade</Label>
              <Input
                type="datetime-local"
                value={editing.expires_at ? editing.expires_at.slice(0, 16) : ""}
                onChange={(e) => setEditing((p) => ({ ...p, expires_at: e.target.value || null }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={save} disabled={saving}>
                {saving ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Excluir cupom "${deleteTarget?.code}"?`}
        description="O cupom será removido permanentemente e não poderá ser recuperado."
        onConfirm={() => { remove(deleteTarget!); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}
