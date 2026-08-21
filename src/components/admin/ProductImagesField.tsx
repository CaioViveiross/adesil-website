'use client';

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { GripVertical, ImagePlus, Loader2, X } from "lucide-react";
import { MAX_PRODUCT_IMAGES } from "@/lib/productImages";
import { cn } from "@/lib/utils";

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
  /** Abre o modal de corte para o arquivo escolhido. */
  onSelectFile: (file: File) => void;
  uploading: boolean;
}

/** Move um item de posição preservando a ordem dos demais. */
function reorder(images: string[], from: number, to: number): string[] {
  const next = [...images];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function ProductImagesField({ images, onChange, onSelectFile, uploading }: Props) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const full = images.length >= MAX_PRODUCT_IMAGES;

  const remove = (index: number) => onChange(images.filter((_, i) => i !== index));

  const handleDrop = (to: number) => {
    if (draggingIndex !== null && draggingIndex !== to) {
      onChange(reorder(images, draggingIndex, to));
    }
    setDraggingIndex(null);
    setOverIndex(null);
  };

  /** Reordenação por teclado — o drag do mouse sozinho deixaria a ação inacessível. */
  const moveByKeyboard = (index: number, direction: -1 | 1) => {
    const to = index + direction;
    if (to < 0 || to >= images.length) return;
    onChange(reorder(images, index, to));
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor="image">Imagens do produto</Label>
        <span className="text-xs text-muted-foreground tabular-nums">
          {images.length}/{MAX_PRODUCT_IMAGES}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {images.map((url, index) => (
          <div
            key={index}
            draggable={!uploading}
            onDragStart={() => setDraggingIndex(index)}
            onDragEnd={() => {
              setDraggingIndex(null);
              setOverIndex(null);
            }}
            // preventDefault é obrigatório para o elemento aceitar o drop
            onDragOver={(e) => {
              e.preventDefault();
              setOverIndex(index);
            }}
            onDragLeave={() => setOverIndex((prev) => (prev === index ? null : prev))}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(index);
            }}
            className={cn(
              "group relative aspect-square rounded-xl overflow-hidden border bg-muted transition-all",
              uploading ? "cursor-default" : "cursor-grab active:cursor-grabbing",
              draggingIndex === index && "opacity-40",
              overIndex === index && draggingIndex !== index
                ? "border-primary ring-2 ring-primary/30"
                : "border-border"
            )}
          >
            <img
              src={url}
              alt={`Imagem ${index + 1}`}
              className="w-full h-full object-cover pointer-events-none"
            />

            {/* Alça de arraste + posição atual */}
            <div className="absolute top-1 left-1 flex items-center gap-0.5 rounded-md bg-foreground/80 px-1 py-0.5 text-background">
              <GripVertical className="h-3 w-3" />
              <span className="text-[10px] font-bold tabular-nums">{index + 1}</span>
            </div>

            {index === 0 && (
              <span className="absolute bottom-1 left-1 rounded-md bg-foreground/80 text-background text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wide">
                Capa
              </span>
            )}

            <div className="absolute bottom-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => moveByKeyboard(index, -1)}
                disabled={index === 0}
                aria-label={`Mover imagem ${index + 1} para a esquerda`}
                className="rounded bg-foreground/80 px-1 text-background text-[11px] leading-4 hover:bg-foreground disabled:opacity-30"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => moveByKeyboard(index, 1)}
                disabled={index === images.length - 1}
                aria-label={`Mover imagem ${index + 1} para a direita`}
                className="rounded bg-foreground/80 px-1 text-background text-[11px] leading-4 hover:bg-foreground disabled:opacity-30"
              >
                →
              </button>
            </div>

            <button
              type="button"
              onClick={() => remove(index)}
              title="Remover imagem"
              aria-label={`Remover imagem ${index + 1}`}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {!full && (
          <label
            htmlFor="image"
            className={cn(
              "aspect-square rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors",
              uploading
                ? "opacity-60 cursor-not-allowed"
                : "cursor-pointer hover:border-primary/40 hover:text-primary"
            )}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-5 w-5" />
                <span className="text-[10px] font-medium">Adicionar</span>
              </>
            )}
          </label>
        )}
      </div>

      {/* Fora do label acima para o input nao ficar clicavel quando a galeria enche */}
      <input
        id="image"
        type="file"
        accept="image/*"
        className="hidden"
        disabled={uploading || full}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelectFile(file);
          e.target.value = "";
        }}
      />

      <p className="text-xs text-muted-foreground">
        {full
          ? `Limite de ${MAX_PRODUCT_IMAGES} imagens atingido. Remova uma para adicionar outra.`
          : "Arraste para reordenar. A primeira é a capa, usada nos cards, no carrinho e no compartilhamento."}
      </p>
    </div>
  );
}
