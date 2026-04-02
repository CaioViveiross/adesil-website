'use client';

import Layout from "@/components/layout/Layout";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, coupon, setCoupon, discount, applyCoupon } = useCart();
  const shipping = total > 300 ? 0 : 29.90;
  const discountAmount = (total * discount) / 100;
  const finalTotal = total - discountAmount + shipping;

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-20 text-center space-y-4">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/40" />
          <h1 className="text-2xl font-bold">Seu carrinho está vazio</h1>
          <p className="text-muted-foreground pb-6">Adicione produtos para continuar.</p>
          <Link href="/categoria/adesivas">
            <Button variant="hero">Ver Produtos</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-8">Carrinho</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={`${item.product.id}-${item.customization?.text}`} className="flex gap-4 p-4 rounded-2xl border bg-card">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-24 h-24 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{item.product.name}</h3>
                  {item.customization && (
                    <p className="text-xs text-primary mt-0.5">Personalizado: "{item.customization.text}"</p>
                  )}
                  <p className="text-lg font-bold mt-1">R$ {item.product.price.toFixed(2).replace(".", ",")}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border rounded-full">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm tabular-nums">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeItem(item.product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-2xl border p-6 h-fit space-y-4 sticky top-24">
            <h2 className="font-bold text-lg">Resumo</h2>

            <div className="flex gap-2">
              <input
                type="text"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="Cupom de desconto"
                className="flex-1 px-4 py-2 border rounded-full text-sm bg-background"
              />
              <Button size="sm" onClick={applyCoupon}>Aplicar</Button>
            </div>
            {discount > 0 && <p className="text-xs text-green-600 font-medium">Cupom aplicado: {discount}% de desconto!</p>}

            <div className="space-y-2 text-sm border-t pt-4">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>R$ {total.toFixed(2).replace(".", ",")}</span></div>
              {discount > 0 && <div className="flex justify-between text-green-600"><span>Desconto</span><span>- R$ {discountAmount.toFixed(2).replace(".", ",")}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span>{shipping === 0 ? <span className="text-green-600">Grátis</span> : `R$ ${shipping.toFixed(2).replace(".", ",")}`}</span></div>
              <div className="flex justify-between font-bold text-lg border-t pt-3">
                <span>Total</span>
                <span>R$ {finalTotal.toFixed(2).replace(".", ",")}</span>
              </div>
            </div>

            <Link href="/checkout" className="block">
              <Button variant="hero" className="w-full">Finalizar Compra</Button>
            </Link>
            <p className="text-xs text-center text-muted-foreground">Frete grátis para compras acima de R$ 300</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
