'use client';

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2 } from "lucide-react";
import type { Category } from "@/types/supabase";
import { AdminPageLoader } from "@/components/admin/AdminLoader";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({ name: "", description: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const categoriesRes = await fetch('/api/categories');
      const categoriesData = categoriesRes.ok ? await categoriesRes.json() : [];

      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchData();
        setIsDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (response.ok) await fetchData();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, description: category.description || "" });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
  };

  if (loading) return <AdminPageLoader />;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Gerenciar Categorias</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Editar' : 'Nova'} Categoria 
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCategory ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-2xl border p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground text-sm">
                    {category.description || ''}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteTarget(category.id?.toString() || '')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {categories.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma categoria encontrada.
          </div>
        )}
      </div>
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Excluir categoria?"
        description="Produtos vinculados perderão esta categoria. Esta ação não pode ser desfeita."
        onConfirm={async () => { await handleDelete(deleteTarget!); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}