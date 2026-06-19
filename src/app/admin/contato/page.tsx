'use client';

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Search, Archive, MailOpen, Mail } from "lucide-react";
import { toast } from "sonner";
import { AdminContentLoader } from "@/components/admin/AdminLoader";

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: "new" | "read" | "archived";
  created_at?: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new:      { label: "Nova",      color: "bg-blue-100 text-blue-700"   },
  read:     { label: "Lida",      color: "bg-gray-100 text-gray-600"   },
  archived: { label: "Arquivada", color: "bg-amber-100 text-amber-700" },
};

const FILTERS = ["todas", "new", "read", "archived"] as const;
const FILTER_LABELS: Record<string, string> = { todas: "Todas", new: "Novas", read: "Lidas", archived: "Arquivadas" };

export default function AdminContactPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<typeof FILTERS[number]>("todas");
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = async () => {
    const res = await fetch("/api/admin/contact-messages?limit=200", { cache: 'no-store' });
    if (res.ok) setMessages(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const patchStatus = async (id: number, status: ContactMessage["status"]) => {
    await fetch(`/api/admin/contact-messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, status } : m));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status } : prev);
    toast.success(status === "archived" ? "Mensagem arquivada" : "Status atualizado");
  };

  const openMessage = async (msg: ContactMessage) => {
    setSelected(msg);
    setModalOpen(true);
    if (msg.status === "new") await patchStatus(msg.id, "read");
  };

  const filtered = messages.filter((m) => {
    if (filter !== "todas" && m.status !== filter) return false;
    const q = search.toLowerCase();
    return [m.name, m.email, m.phone, m.message].join(" ").toLowerCase().includes(q);
  });

  const unreadCount = messages.filter((m) => m.status === "new").length;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Contatos
            {unreadCount > 0 && (
              <span className="text-sm font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {unreadCount} nova{unreadCount > 1 ? "s" : ""}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Mensagens enviadas pelo formulário da loja.</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border p-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, e-mail ou mensagem..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-1 p-1 bg-muted rounded-xl">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filter === f ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {FILTER_LABELS[f]}
                {f === "new" && unreadCount > 0 && (
                  <span className="ml-1.5 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <AdminContentLoader />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-6" />
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead className="hidden md:table-cell">Telefone</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((msg) => (
                <TableRow
                  key={msg.id}
                  className={`cursor-pointer hover:bg-muted/60 ${msg.status === "new" ? "font-medium" : ""}`}
                  onClick={() => openMessage(msg)}
                >
                  <TableCell>
                    {msg.status === "new"
                      ? <Mail className="h-4 w-4 text-blue-500" />
                      : <MailOpen className="h-4 w-4 text-muted-foreground/40" />}
                  </TableCell>
                  <TableCell>{msg.name}</TableCell>
                  <TableCell className="text-muted-foreground">{msg.email}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{msg.phone}</TableCell>
                  <TableCell className="max-w-xs text-sm text-muted-foreground truncate">
                    {msg.message.slice(0, 80)}{msg.message.length > 80 ? "…" : ""}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {msg.created_at ? new Date(msg.created_at).toLocaleDateString("pt-BR") : "—"}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_LABELS[msg.status].color}`}>
                      {STATUS_LABELS[msg.status].label}
                    </span>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {msg.status !== "archived" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        title="Arquivar"
                        onClick={() => patchStatus(msg.id, "archived")}
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <EmptyState variant="compact" title="Nenhuma mensagem encontrada." />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={(o) => { if (!o) { setModalOpen(false); setSelected(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-3">
              <span>Mensagem de {selected?.name}</span>
              {selected && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_LABELS[selected.status]?.color}`}>
                  {STATUS_LABELS[selected.status]?.label}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {selected?.created_at
                ? new Date(selected.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
                : ""}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 pt-1">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Nome</p>
                  <p className="font-medium">{selected.name}</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">E-mail</p>
                  <a href={`mailto:${selected.email}`} className="font-medium text-primary hover:underline">{selected.email}</a>
                </div>
                <div className="rounded-xl border bg-card p-4 md:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Telefone</p>
                  <a href={`tel:${selected.phone}`} className="font-medium">{selected.phone}</a>
                </div>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Mensagem</p>
                <p className="whitespace-pre-wrap leading-6 text-sm">{selected.message}</p>
              </div>
              {selected.status !== "archived" && (
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" className="gap-2"
                    onClick={() => patchStatus(selected.id, "archived")}>
                    <Archive className="h-3.5 w-3.5" /> Arquivar mensagem
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
