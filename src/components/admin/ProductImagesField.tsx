'use client';

import { Label } from "@/components/ui/label";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { MAX_PRODUCT_IMAGES } from "@/lib/productImages";
import { cn } from "@/lib/utils";

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
  /** Abre o modal de corte para o arquivo escolhido. */
  onSelectFile: (file: File) => void;
  uploading: boolean;
}

export function ProductImagesField({ images, onChange, onSelectFile, uploading }: Props) {
  const full = images.length >= MAX_PRODUCT_IMAGES;

  /** Promove uma imagem a capa — ela passa a ser a primeira da galeria. */
  const setCover = (index: number) =>
    onChange([images[index], ...images.filter((_, i) => i !== index)]);

  const remove = (index: number) => onChange(images.filter((_, i) => i !== index));

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
            className="group relative aspect-square rounded-xl overflow-hidden border border-border bg-muted"
          >
            <img src={url} alt={`Imagem ${index + 1}`} className="w-full h-full object-cover" />

            {index === 0 ? (
              <span className="absolute bottom-1 left-1 rounded-md bg-foreground/80 text-background text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wide">
                Capa
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setCover(index)}
                title="Definir como capa"
                aria-label={`Definir imagem ${index + 1} como capa`}
                className="absolute bottom-1 left-1 rounded-md bg-foreground/80 text-background p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-foreground"
              >
                <Star className="h-3 w-3" />
              </button>
            )}

            <button
              type="button"
              onClick={() => remove(index)}
              title="Remover imagem"
              aria-label={`Remover imagem ${index + 1}`}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
          : "A primeira imagem é a capa, usada nos cards, no carrinho e no compartilhamento."}
      </p>
    </div>
  );
}
