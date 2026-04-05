'use client';

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import type { Product } from "@/types/supabase";

interface ProductCardProps {
  product: Product;
}



const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem } = useCart();

  console.log("ProductCard renderizado:", product.image);

  return (
    <div className="group relative bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
      {product.badge && (
        <span className="absolute top-3 left-3 z-10 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
          {product.badge}
        </span>
      )}
      <Link href={`/produto/${product.id}`}>
        <div className="aspect-square overflow-hidden bg-muted">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      </Link>
      <div className="p-4 space-y-2">
        {product.original_price && (
          <span className="text-xs text-muted-foreground line-through">
            R$ {product.original_price.toFixed(2).replace(".", ",")}
          </span>
        )}
        <p className="text-lg font-bold">
          R$ {product.price.toFixed(2).replace(".", ",")}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2">{product.specs}</p>
        <div className="flex items-center gap-2 pt-2">
          <Button size="sm" className="flex-1" onClick={() => addItem(product)}>
            Comprar
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="shrink-0 h-9 w-9"
            onClick={() => addItem(product)}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
