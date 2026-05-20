'use client';

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import type { Product } from "@/types/supabase";
import { salePrice } from "@/lib/utils";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem } = useCart();
  const router = useRouter();

  const handleBuy = () => {
    addItem(product);
    router.push("/carrinho");
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="group relative bg-card border border-border rounded-2xl overflow-hidden h-full flex flex-col hover:border-primary/30 hover:shadow-xl hover:shadow-primary/8 transition-all duration-300"
    >
      {/* Imagem */}
      <Link href={`/produto/${product.id}`} className="flex-shrink-0 block relative" aria-label={`Ver ${product.name}`}>
        <div className="aspect-square overflow-hidden bg-muted relative">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-[1.07] transition-transform duration-500 ease-out"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <ShoppingCart className="h-8 w-8 text-muted-foreground/30" />
            </div>
          )}
        </div>

        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300" />

        {Array.isArray(product.tags) && product.tags.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            {product.tags.map(tag => (
              <span key={tag} className="bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shadow-sm">
                {tag}
              </span>
            ))}
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-4 flex flex-col flex-grow gap-3">
        <div className="flex-grow">
          <Link href={`/produto/${product.id}`}>
            <h3 className="text-sm font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors leading-snug">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-foreground leading-none">
            R$ {salePrice(product).toFixed(2).replace(".", ",")}
          </span>
          {!!product.discount && (
            <span className="text-xs text-muted-foreground line-through leading-none">
              R$ {product.price.toFixed(2).replace(".", ",")}
            </span>
          )}
        </div>

        {/* Botões */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="flex-1 h-9 rounded-xl font-semibold text-xs"
            onClick={handleBuy}
          >
            Comprar
          </Button>
          <Button
            size="icon"
            variant="outline"
            aria-label="Adicionar ao carrinho"
            className="h-9 w-9 rounded-xl shrink-0 border-border hover:border-primary/40 hover:text-primary transition-colors"
            onClick={() => addItem(product)}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
