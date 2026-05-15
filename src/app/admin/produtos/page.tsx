'use client';

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import type { Product, Category } from "@/types/supabase";
import { supabase } from "@/lib/supabaseClient";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [togglingFeaturedId, setTogglingFeaturedId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    discount: "0",
    image: "",
    category_id: "" as string | number,
    tags: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/products?limit=100'),
        fetch('/api/categories')
      ]);

      const productsData = productsRes.ok ? await productsRes.json() : [];
      const categoriesData = categoriesRes.ok ? await categoriesRes.json() : [];

      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);
    try {
      // Verificar se o usuário está autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Usuário não autenticado. Faça login para fazer upload.');
      }

      console.log('Usuário autenticado:', user.id);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      console.log('Fazendo upload para:', filePath);

      const { data, error } = await supabase.storage
        .from('Adesil Bucket')
        .upload(filePath, file);

      if (error) {
        console.error('Erro do Supabase Storage:', error);
        throw error;
      }

      console.log('Upload realizado com sucesso:', data);

      const { data: { publicUrl } } = supabase.storage
        .from('Adesil Bucket')
        .getPublicUrl(filePath);

      console.log('URL pública gerada:', publicUrl);

      setFormData(prev => ({ ...prev, image: publicUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(`Erro ao fazer upload da imagem: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const categoryName = categories.find(c => c.id === product.category_id)?.name || '';
    return product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           categoryName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      discount: parseInt(formData.discount || "0", 10),
      category_id: formData.category_id ? parseInt(formData.category_id.toString()) : undefined,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    };

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        await fetchData();
        setIsDialogOpen(false);
        resetForm();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData?.error || 'Erro ao salvar produto.');
      }
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      discount: (product.discount ?? 0).toString(),
      image: product.image || "",
      category_id: product.category_id?.toString() || "",
      tags: (Array.isArray(product.tags) ? product.tags : []).join(', '),
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      discount: "0",
      image: "",
      category_id: "",
      tags: "",
    });
  };

  const handleToggleFeatured = async (product: Product, checked: boolean) => {
    setTogglingFeaturedId(product.id);

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_featured: checked }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData?.error || "Erro ao atualizar destaque.");
        return;
      }

      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? { ...item, is_featured: checked }
            : item
        )
      );
    } catch (error) {
      console.error("Error toggling featured status:", error);
      alert("Erro ao atualizar destaque.");
    } finally {
      setTogglingFeaturedId(null);
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

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Gerenciar Produtos</h1>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={formData.category_id.toString()} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Preço (R$) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="discount">Desconto (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  />
                </div>
              </div>
              {Number(formData.discount) > 0 && Number(formData.price) > 0 && (
                <p className="text-sm text-muted-foreground -mt-2">
                  Preço final:{" "}
                  <span className="font-semibold text-foreground">
                    R$ {(Number(formData.price) * (1 - Number(formData.discount) / 100)).toFixed(2).replace(".", ",")}
                  </span>
                  <span className="ml-2 line-through">
                    R$ {Number(formData.price).toFixed(2).replace(".", ",")}
                  </span>
                </p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="image">Imagem do Produto</Label>
                  <div className="space-y-2">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      disabled={uploading}
                    />
                    {uploading && <p className="text-sm text-muted-foreground">Fazendo upload...</p>}
                    {formData.image && (
                      <div className="mt-2">
                        <img
                          src={formData.image}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded border"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="tags">Tags <span className="text-muted-foreground font-normal">(separadas por vírgula)</span></Label>
                  <Input
                    id="tags"
                    placeholder="ex: ribbon, adesivo, couche"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProduct ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="bg-card rounded-2xl border p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
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
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Destaque</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    {categories.find(c => c.id === product.category_id)?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {product.discount ? (
                      <div className="flex flex-col leading-tight">
                        <span>R$ {(product.price * (1 - product.discount / 100)).toFixed(2).replace(".", ",")}</span>
                        <span className="text-xs text-muted-foreground line-through">R$ {product.price.toFixed(2).replace(".", ",")} (−{product.discount}%)</span>
                      </div>
                    ) : (
                      `R$ ${product.price.toFixed(2).replace(".", ",")}`
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={Boolean(product.is_featured)}
                      onCheckedChange={(checked) => handleToggleFeatured(product, checked)}
                      aria-label={`Alternar destaque do produto ${product.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {(Array.isArray(product.tags) ? product.tags : []).map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(product.id)}
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
      </div>
    </AdminLayout>
  );
}
