'use client';

import Link from "next/link";
import { ShoppingCart, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import type { Product } from "@/types/supabase";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem } = useCart();

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="group relative bg-card border border-border rounded-2xl overflow-hidden h-full flex flex-col hover:border-primary/25 hover:shadow-lg hover:shadow-primary/6 transition-colors duration-300"
    >
      {product.tags && (
        <span className="absolute top-3 left-3 z-10 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shadow-sm">
          {product.tags}
        </span>
      )}

      <Link href={`/produto/${product.id}`} className="flex-shrink-0 block">
        <div className="aspect-square overflow-hidden bg-muted">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500 ease-out"
          />
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-grow gap-3">
        <div className="flex-grow">
          <Link href={`/produto/${product.id}`}>
            <h3 className="text-sm font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors leading-snug">
              {product.name}
            </h3>
          </Link>
        </div>

        <div>
          {product.original_price && (
            <span className="block text-xs text-muted-foreground line-through mb-0.5">
              R$ {product.original_price.toFixed(2).replace(".", ",")}
            </span>
          )}
          <p className="text-xl font-bold text-foreground leading-none">
            R$ {product.price.toFixed(2).replace(".", ",")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="flex-1 h-9 rounded-xl font-semibold text-xs gap-1.5"
            onClick={() => addItem(product)}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Adicionar
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9 rounded-xl shrink-0 border-border hover:border-primary/40 hover:text-primary transition-colors"
            asChild
          >
            <Link href={`/produto/${product.id}`}>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
