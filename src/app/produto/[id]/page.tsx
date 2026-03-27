'use client';

import { useParams } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import { products } from "@/data/mockData";
import { getProductImage } from "@/lib/images";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import LabelCustomizer from "@/components/products/LabelCustomizer";
import { useState } from "react";
import { ShoppingCart, Minus, Plus, ChevronLeft } from "lucide-react";

export default function ProductPage() {
  const params = useParams();
  const id = params.id as string;
  const product = products.find((p) => p.id === id);
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [customization, setCustomization] = useState<{ text: string; color: string; font: string } | undefined>();

  if (!product) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold">Produto não encontrado</h1>
          <Link href="/" className="text-primary hover:underline mt-4 block">
            Voltar à home
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <Link href={`/categoria/${product.category}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
        </Link>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Image */}
          <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
            <img
              src={getProductImage(product.image)}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="space-y-6">
            {product.badge && (
              <span className="inline-block bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                {product.badge}
              </span>
            )}
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">{product.description}</p>

            <div className="space-y-1">
              {product.originalPrice && (
                <p className="text-sm text-muted-foreground line-through">
                  R$ {product.originalPrice.toFixed(2).replace(".", ",")}
                </p>
              )}
              <p className="text-3xl font-bold text-primary">
                R$ {product.price.toFixed(2).replace(".", ",")}
              </p>
              <p className="text-xs text-muted-foreground">ou 3x de R$ {(product.price / 3).toFixed(2).replace(".", ",")} sem juros</p>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Quantidade:</span>
              <div className="flex items-center border rounded-full">
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-10 text-center font-medium tabular-nums">{quantity}</span>
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setQuantity(quantity + 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="hero"
                className="flex-1"
                onClick={() => addItem(product, quantity, customization)}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Adicionar ao carrinho
              </Button>
            </div>

            {/* Customizer */}
            {product.customizable && (
              <LabelCustomizer onCustomize={setCustomization} />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
