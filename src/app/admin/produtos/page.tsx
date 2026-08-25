'use client';

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import type { Product, Category } from "@/types/supabase";
import { supabase } from "@/lib/supabaseClient";
import { ImageCropModal } from "@/components/admin/ImageCropModal";
import { ProductImagesField } from "@/components/admin/ProductImagesField";
import { ProductCategoriesField } from "@/components/admin/ProductCategoriesField";
import { MAX_PRODUCT_IMAGES, galleryImages } from "@/lib/productImages";
import { AdminPageLoader } from "@/components/admin/AdminLoader";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  ProductDescriptionFields,
  countFilledSections,
  emptyDescriptionSectionsForm,
  type DescriptionSectionsForm,
} from "@/components/admin/ProductDescriptionFields";
import {
  cleanFaq,
  isEmptySections,
  joinSpecs,
  normalizeSections,
  parseLines,
  serializeLines,
  splitSpecs,
} from "@/lib/productDescription";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [togglingFeaturedId, setTogglingFeaturedId] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    discount: "0",
    weight_grams: "",
    ncm: "",
    images: [] as string[],
    category_ids: [] as number[],
    tags: "",
  });
  const [sectionsForm, setSectionsForm] = useState<DescriptionSectionsForm>(
    emptyDescriptionSectionsForm
  );
  const [activeTab, setActiveTab] = useState("geral");

  const fetchProducts = useCallback(async (search = "") => {
    try {
      // Admin enxerga também os inativos; a vitrine nunca recebe esse parâmetro.
      const params = new URLSearchParams({ limit: "100", include_inactive: "true" });
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/products?${params}`, { cache: "no-store" });
      if (res.ok) setProducts(await res.json());
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }, []);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [, categoriesRes] = await Promise.all([
          fetchProducts(),
          fetch('/api/categories', { cache: 'no-store' }),
        ]);
        if (categoriesRes.ok) setCategories(await categoriesRes.json());
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
  }, []);

  // Debounced server-side search
  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchProducts]);

  // Step 1: file selected → open crop modal
  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Step 2: crop confirmed → upload blob to Supabase
  const handleCropConfirm = async (blob: Blob) => {
    setCropSrc(null);
    setUploading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Usuário não autenticado.");

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
      const filePath = `products/${fileName}`;

      const { error } = await supabase.storage
        .from("Adesil Bucket")
        .upload(filePath, blob, { contentType: "image/jpeg" });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("Adesil Bucket")
        .getPublicUrl(filePath);

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, publicUrl].slice(0, MAX_PRODUCT_IMAGES),
      }));
    } catch (error) {
      console.error("Erro no upload:", error);
      toast.error(`Erro ao fazer upload: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // O Radix desmonta as abas inativas, então o `required` do HTML não alcança
    // campos que estão fora da aba visível — a validação precisa ser manual.
    const priceValue = parseFloat(formData.price);

    if (!formData.name.trim()) {
      setActiveTab("geral");
      toast.error("Informe o nome do produto.");
      return;
    }

    if (!formData.price.trim() || Number.isNaN(priceValue) || priceValue < 0) {
      setActiveTab("comercial");
      toast.error("Informe um preço válido.");
      return;
    }

    const sections = {
      benefits:         parseLines(sectionsForm.benefits),
      specs:            joinSpecs(sectionsForm.specs, sectionsForm.specsExtra),
      package_contents: parseLines(sectionsForm.package_contents),
      compatibility:    parseLines(sectionsForm.compatibility),
      usage:            parseLines(sectionsForm.usage),
      faq:              cleanFaq(sectionsForm.faq),
    };

    const productData = {
      ...formData,
      // `image` segue sendo a capa: cards, carrinho, OpenGraph e JSON-LD leem dela.
      image: formData.images[0] ?? "",
      // Grava null quando nada foi preenchido, em vez de um objeto de listas vazias.
      description_sections: isEmptySections(sections) ? null : sections,
      price: parseFloat(formData.price),
      discount: parseInt(formData.discount || "0", 10),
      weight_grams: formData.weight_grams.trim() ? parseInt(formData.weight_grams, 10) : null,
      ncm: formData.ncm.trim() || null,
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
        const saved = await response.json();
        if (editingProduct) {
          setProducts(prev => prev.map(p => p.id === saved.id ? saved : p));
          toast.success('Produto atualizado');
        } else {
          setProducts(prev => [saved, ...prev]);
          toast.success('Produto criado');
        }
        setIsDialogOpen(false);
        resetForm();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData?.error || 'Erro ao salvar produto.');
      }
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
        toast.success('Produto excluído');
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
      weight_grams: product.weight_grams != null ? product.weight_grams.toString() : "",
      ncm: product.ncm ?? "",
      images: galleryImages(product),
      category_ids: product.category_ids ?? (product.category_id ? [product.category_id] : []),
      tags: (Array.isArray(product.tags) ? product.tags : []).join(', '),
    });

    const saved = normalizeSections(product.description_sections);
    const specs = splitSpecs(saved?.specs);
    setSectionsForm({
      benefits:         serializeLines(saved?.benefits),
      specs:            specs.fixed,
      specsExtra:       specs.extra,
      package_contents: serializeLines(saved?.package_contents),
      compatibility:    serializeLines(saved?.compatibility),
      usage:            serializeLines(saved?.usage),
      faq:              saved?.faq ?? [],
    });

    setActiveTab("geral");
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      discount: "0",
      weight_grams: "",
      ncm: "",
      images: [],
      category_ids: [],
      tags: "",
    });
    setSectionsForm(emptyDescriptionSectionsForm);
    setActiveTab("geral");
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
        toast.error(errorData?.error || "Erro ao atualizar destaque.");
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
      toast.error("Erro ao atualizar destaque.");
    } finally {
      setTogglingFeaturedId(null);
    }
  };

  const filledSections = countFilledSections(sectionsForm, formData.description);

  if (loading) return <AdminPageLoader />;

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
          <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0">
            <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
              <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex flex-col flex-1 min-h-0"
              >
                <TabsList className="mx-6 shrink-0 grid grid-cols-3">
                  <TabsTrigger value="geral">Geral</TabsTrigger>
                  <TabsTrigger value="descricao" className="gap-1.5">
                    Descrição
                    {filledSections > 0 && (
                      <span className="rounded-full bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 tabular-nums leading-none">
                        {filledSections}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="comercial">Preço e envio</TabsTrigger>
                </TabsList>

                {/* Só esta região rola — cabeçalho, abas e rodapé ficam fixos */}
                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">

                  <TabsContent value="geral" className="mt-0 space-y-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        placeholder="ex: Etiqueta Térmica 10x15 cm — 10 rolos"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <ProductCategoriesField
                      categories={categories}
                      value={formData.category_ids}
                      onChange={(category_ids) =>
                        setFormData((prev) => ({ ...prev, category_ids }))
                      }
                    />

                    <ProductImagesField
                      images={formData.images}
                      onChange={(images) => setFormData((prev) => ({ ...prev, images }))}
                      onSelectFile={handleFileSelect}
                      uploading={uploading}
                    />

                    <div className="space-y-1.5">
                      <Label htmlFor="tags">Tags</Label>
                      <Input
                        id="tags"
                        placeholder="ex: Novo produto, Em destaque"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Separadas por vírgula. Aparecem como selo sobre a imagem do produto.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="descricao" className="mt-0">
                    <ProductDescriptionFields
                    value={sectionsForm}
                    onChange={setSectionsForm}
                    description={formData.description}
                    onDescriptionChange={(description) =>
                      setFormData((prev) => ({ ...prev, description }))
                    }
                  />
                  </TabsContent>

                  <TabsContent value="comercial" className="mt-0 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
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
                      <div className="space-y-1.5">
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
                      <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
                        <span className="text-sm text-muted-foreground">Preço final:</span>
                        <span className="text-sm font-semibold text-foreground">
                          R$ {(Number(formData.price) * (1 - Number(formData.discount) / 100)).toFixed(2).replace(".", ",")}
                        </span>
                        <span className="text-xs text-muted-foreground line-through">
                          R$ {Number(formData.price).toFixed(2).replace(".", ",")}
                        </span>
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md leading-none uppercase tracking-wide">
                          {Number(formData.discount)}% off
                        </span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="weight_grams">Peso (g) <span className="text-muted-foreground font-normal">(para cálculo de frete)</span></Label>
                      <Input
                        id="weight_grams"
                        type="number"
                        step="1"
                        min="0"
                        placeholder="ex: 300"
                        value={formData.weight_grams}
                        onChange={(e) => setFormData({ ...formData, weight_grams: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Se vazio, usa o peso padrão configurado nos Correios.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="ncm">NCM <span className="text-muted-foreground font-normal">(classificação fiscal)</span></Label>
                      <Input
                        id="ncm"
                        placeholder="Ex: 4821.10.00"
                        value={formData.ncm}
                        onChange={(e) => setFormData({ ...formData, ncm: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Se vazio, usa o NCM padrão configurado em Configurações → Bling.
                      </p>
                    </div>
                  </TabsContent>

                </div>
              </Tabs>

              {/* Rodapé fixo: as ações ficam sempre visíveis, mesmo com a
                  aba de descrição inteira preenchida */}
              <div className="shrink-0 flex items-center justify-end gap-2 border-t border-border px-6 py-4 bg-background">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={uploading}>
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
                <TableHead>Peso</TableHead>
                <TableHead>Destaque</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    {(() => {
                      const ids = product.category_ids ?? (product.category_id ? [product.category_id] : []);
                      const names = ids
                        .map((id) => categories.find((c) => Number(c.id) === Number(id))?.name)
                        .filter(Boolean);
                      return names.length ? names.join(", ") : "N/A";
                    })()}
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
                    {product.weight_grams != null
                      ? `${product.weight_grams} g`
                      : <span className="text-muted-foreground text-xs">padrão</span>}
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
                        onClick={() => setDeleteTarget(product.id)}
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
      {cropSrc && (
        <ImageCropModal
          open={!!cropSrc}
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropSrc(null)}
        />
      )}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Excluir produto?"
        description="O produto será desativado e não aparecerá mais na loja. Esta ação não pode ser desfeita."
        onConfirm={async () => { await handleDelete(deleteTarget!); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}
