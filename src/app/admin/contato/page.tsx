'use client';

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import type { ContactMessage } from "@/types/supabase";

export default function AdminContactPage() {
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchContactMessages();
  }, []);

  const fetchContactMessages = async () => {
    try {
      const response = await fetch("/api/admin/contact-messages?limit=200");
      if (response.ok) {
        const data = await response.json();
        setContactMessages(data);
      }
    } catch (error) {
      console.error("Error fetching contact messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const normalizedSearchTerm = searchTerm.toLowerCase();
  const filteredMessages = contactMessages.filter((message) => {
    const haystack = [message.name, message.email, message.phone, message.message]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedSearchTerm);
  });

  const openMessageDetail = (message: ContactMessage) => {
    setSelectedMessage(message);
    setModalOpen(true);
  };

  const closeMessageDetail = () => {
    setModalOpen(false);
    setSelectedMessage(null);
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

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Contatos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mensagens enviadas pelos clientes pelo formulário da loja.
          </p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, e-mail, telefone ou mensagem..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Enviado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMessages.map((message) => (
                <TableRow
                  key={message.id}
                  className="cursor-pointer hover:bg-muted/60"
                  onClick={() => openMessageDetail(message)}
                >
                  <TableCell className="font-medium">{message.name}</TableCell>
                  <TableCell>{message.email}</TableCell>
                  <TableCell>{message.phone}</TableCell>
                  <TableCell className="max-w-xl whitespace-pre-wrap text-sm text-muted-foreground">
                    {message.message.length > 90 ? `${message.message.slice(0, 90)}...` : message.message}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {message.created_at
                      ? new Date(message.created_at).toLocaleString("pt-BR", {
                          timeZone: "America/Sao_Paulo",
                        })
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredMessages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma mensagem encontrada.
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={(open) => !open && closeMessageDetail()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedMessage ? `Mensagem de ${selectedMessage.name}` : "Detalhes do contato"}
            </DialogTitle>
            <DialogDescription>
              {selectedMessage?.created_at
                ? new Date(selectedMessage.created_at).toLocaleString("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                  })
                : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border bg-card p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Nome</p>
                  <p className="font-medium">{selectedMessage.name}</p>
                </div>
                <div className="rounded-2xl border bg-card p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">E-mail</p>
                  <p className="font-medium">{selectedMessage.email}</p>
                </div>
                <div className="rounded-2xl border bg-card p-4 md:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Telefone</p>
                  <p className="font-medium">{selectedMessage.phone}</p>
                </div>
              </div>

              <div className="rounded-2xl border bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Mensagem</p>
                <p className="whitespace-pre-wrap leading-6 text-sm text-foreground">
                  {selectedMessage.message}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}