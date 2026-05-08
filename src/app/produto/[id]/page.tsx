'use client';

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus, ChevronLeft, Shield, Truck, Package } from "lucide-react";
import type { Product } from "@/types/supabase";
import { motion } from "framer-motion";

export default function ProductPage() {
  const params = useParams();
  const id = params.id as string;
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [customization] = useState<{ text: string; color: string; font: string } | undefined>();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${id}`);
        setProduct(response.ok ? await response.json() : null);
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="container py-12 md:py-20">
          <div className="h-4 bg-muted animate-pulse rounded w-24 mb-8" />
          <div className="grid md:grid-cols-2 gap-10 md:gap-16">
            <div className="aspect-square bg-muted animate-pulse rounded-2xl" />
            <div className="space-y-5 pt-2">
              <div className="h-3 bg-muted animate-pulse rounded-full w-16" />
              <div className="h-8 bg-muted animate-pulse rounded-lg w-3/4" />
              <div className="space-y-2">
                <div className="h-3 bg-muted animate-pulse rounded-full" />
                <div className="h-3 bg-muted animate-pulse rounded-full w-4/5" />
              </div>
              <div className="h-9 bg-muted animate-pulse rounded-full w-32" />
              <div className="h-11 bg-muted animate-pulse rounded-xl" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container py-20 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <Package className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <h1 className="text-xl font-bold">Produto não encontrado</h1>
          <Link href="/categoria/todos">
            <Button variant="outline" className="h-10 rounded-xl">Ver todos os produtos</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12 md:py-20">
        <Link
          href={`/categoria/${product.category}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Voltar
        </Link>

        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border"
          >
            <img
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6 pt-1"
          >
            {product.tags && (
              <span className="inline-block bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                {product.tags}
              </span>
            )}

            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">{product.name}</h1>
              {product.description && (
                <p className="text-muted-foreground text-sm leading-relaxed">{product.description}</p>
              )}
            </div>

            <div className="space-y-1">
              {product.original_price && (
                <p className="text-sm text-muted-foreground line-through">
                  R$ {product.original_price.toFixed(2).replace(".", ",")}
                </p>
              )}
              <p className="text-3xl font-bold text-foreground">
                R$ {product.price.toFixed(2).replace(".", ",")}
              </p>
              <p className="text-xs text-muted-foreground">
                ou 3× de R$ {(product.price / 3).toFixed(2).replace(".", ",")} sem juros
              </p>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">Quantidade</span>
              <div className="flex items-center border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-10 w-10 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-10 text-center font-semibold tabular-nums text-sm">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-10 w-10 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <Button
              className="w-full h-12 rounded-xl font-semibold text-base gap-2"
              onClick={() => addItem(product, quantity, customization)}
            >
              <ShoppingCart className="h-5 w-5" />
              Adicionar ao carrinho
            </Button>

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
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
