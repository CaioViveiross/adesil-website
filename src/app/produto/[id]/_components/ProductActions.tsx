'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Minus, Plus, Truck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import type { Product } from "@/types/supabase";
import { salePrice } from "@/lib/utils";
import DiscountBadge from "@/components/products/DiscountBadge";

interface ProductActionsProps {
  product: Product;
}

export default function ProductActions({ product }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const router = useRouter();

  const handleBuyNow = () => {
    addItem(product, quantity);
    router.push("/carrinho");
  };

  return (
    <div className="space-y-6">
      {/* Preço */}
      <div className="space-y-1">
        {!!product.discount && (
          <p className="text-sm text-muted-foreground line-through">
            R$ {product.price.toFixed(2).replace(".", ",")}
          </p>
        )}
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
          <p className="text-3xl font-bold text-foreground">
            R$ {salePrice(product).toFixed(2).replace(".", ",")}
          </p>
          <DiscountBadge discount={product.discount} size="md" />
        </div>
        <p className="text-xs text-muted-foreground">
          ou 3× de R$ {(salePrice(product) / 3).toFixed(2).replace(".", ",")} sem juros
        </p>
      </div>

      {/* Quantidade */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">Quantidade</span>
        <div className="flex items-center border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            aria-label="Diminuir quantidade"
            className="h-10 w-10 flex items-center justify-center hover:bg-muted transition-colors"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-10 text-center font-semibold tabular-nums text-sm">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            aria-label="Aumentar quantidade"
            className="h-10 w-10 flex items-center justify-center hover:bg-muted transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-2.5">
        <Button
          className="w-full h-12 rounded-xl font-semibold text-base"
          onClick={handleBuyNow}
        >
          Comprar agora
        </Button>
        <Button
          variant="outline"
          className="w-full h-12 rounded-xl font-semibold text-base gap-2"
          onClick={() => addItem(product, quantity)}
        >
          <ShoppingCart className="h-5 w-5" />
          Adicionar ao carrinho
        </Button>
      </div>

      {/* Trust signals */}
      <div className="border-t border-border pt-5 space-y-3">
        {[
          { icon: Truck, text: "Entrega para todo o Brasil" },
          { icon: Shield, text: "Qualidade garantida em todos os produtos" },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <Icon className="h-4 w-4 text-primary shrink-0" />
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}
