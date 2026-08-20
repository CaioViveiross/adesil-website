'use client';

import { useState } from "react";
import Image from "next/image";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border flex items-center justify-center">
        <Package className="h-16 w-16 text-muted-foreground/30" />
      </div>
    );
  }

  // Guarda contra um índice inválido caso a lista encolha entre renderizações.
  const safeIndex = images[activeIndex] ? activeIndex : 0;
  const active = images[safeIndex];

  return (
    <div className="space-y-3">
      <div className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border relative">
        <Image
          key={active}
          src={active}
          alt={productName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {/* Miniaturas só fazem sentido com mais de uma imagem */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((url, index) => {
            const isActive = index === safeIndex;
            return (
              <button
                key={index}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Ver imagem ${index + 1} de ${images.length}`}
                aria-current={isActive}
                className={cn(
                  "aspect-square rounded-xl overflow-hidden bg-muted relative border-2 transition-colors",
                  isActive
                    ? "border-primary"
                    : "border-transparent hover:border-primary/40"
                )}
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 25vw, 12vw"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
