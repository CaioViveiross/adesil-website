'use client';

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ShoppingCart, Minus, Plus, ChevronLeft } from "lucide-react";
import type { Product } from "@/types/supabase";

export default function ProductPage() {
  const params = useParams();
  const id = params.id as string;
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [customization, setCustomization] = useState<{ text: string; color: string; font: string } | undefined>();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${id}`);
        if (response.ok) {
          const data = await response.json();
          setProduct(data);
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="h-4 bg-muted animate-pulse rounded w-32 mb-6"></div>
          <div className="grid md:grid-cols-2 gap-10">
            <div className="aspect-square bg-muted animate-pulse rounded-2xl"></div>
            <div className="space-y-6">
              <div className="h-6 bg-muted animate-pulse rounded w-48"></div>
              <div className="h-4 bg-muted animate-pulse rounded w-64"></div>
              <div className="h-8 bg-muted animate-pulse rounded w-32"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

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
              src={product.image || "/placeholder.svg"}
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
              {product.original_price && (
                <p className="text-sm text-muted-foreground line-through">
                  R$ {product.original_price.toFixed(2).replace(".", ",")}
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
          </div>
        </div>
      </div>
    </Layout>
  );
}
