'use client';

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import type { Category } from "@/types/supabase";

interface Props {
  categories: Category[];
  /** Ordem importa: a primeira é a categoria principal. */
  value: number[];
  onChange: (categoryIds: number[]) => void;
}

export function ProductCategoriesField({ categories, value, onChange }: Props) {
  // A ordem não é exposta ao admin: serve só para `products.category_id`, que
  // define para onde vai o link "Voltar ao catálogo" na página do produto.
  // Sem nenhuma escolha ainda, mostra um select vazio em vez de nada.
  const rows: (number | null)[] = value.length > 0 ? value : [null];

  const setAt = (index: number, categoryId: number) => {
    const next = [...value];
    next[index] = categoryId;
    onChange(next);
  };

  const removeAt = (index: number) => onChange(value.filter((_, i) => i !== index));

  const addRow = () => {
    // Já entra preenchida com a primeira categoria livre: um select vazio
    // extra só adicionaria um passo a mais.
    const free = categories.find((c) => !value.includes(Number(c.id)));
    if (free) onChange([...value, Number(free.id)]);
  };

  const canAddMore = value.length > 0 && value.length < categories.length;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label>Categorias</Label>
        {value.length > 1 && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {value.length} selecionadas
          </span>
        )}
      </div>

      {categories.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          Nenhuma categoria cadastrada.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((categoryId, index) => {
            // Cada select esconde o que já foi escolhido nas outras linhas,
            // então não dá para repetir categoria.
            const available = categories.filter((category) => {
              const id = Number(category.id);
              return id === categoryId || !value.includes(id);
            });

            return (
              <div key={index} className="flex items-center gap-2">
                <Select
                  value={categoryId != null ? String(categoryId) : undefined}
                  onValueChange={(selected) => setAt(index, Number(selected))}
                >
                  <SelectTrigger className="w-full max-w-sm">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {available.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {value.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remover categoria ${index + 1}`}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeAt(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}

          {canAddMore && (
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar categoria
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
