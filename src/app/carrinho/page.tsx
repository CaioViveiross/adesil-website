'use client';

import Layout from "@/components/layout/Layout";
import { useCart } from "@/contexts/CartContext";
import type { ShippingOption } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Tag, MapPin, Truck, Loader2, CheckCircle2 } from "lucide-react";
import { salePrice } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";


function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export default function CartPage() {
  const {
    items, removeItem, updateQuantity, total, coupon, setCoupon,
    discount, discountType, applyCoupon,
    shippingZip, setShippingZip,
    shippingOptions, setShippingOptions,
    selectedShipping, setSelectedShipping,
    freeShippingThreshold,
  } = useCart();

  const [cepInput, setCepInput] = useState(shippingZip || "");
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState("");

  // Discount amount from coupon
  const discountAmount =
    discountType === "percent"
      ? (total * discount) / 100
      : Math.min(discount, total);

  const subtotalAfterDiscount = total - discountAmount;

  const qualifiesFreeShipping =
    freeShippingThreshold !== null && subtotalAfterDiscount >= freeShippingThreshold;

  const shipping: number | null = qualifiesFreeShipping
    ? 0
    : shippingOptions.length > 0
    ? (selectedShipping?.price ?? null)
    : null;

  const finalTotal =
    shipping !== null ? subtotalAfterDiscount + shipping : subtotalAfterDiscount;

  const freeShippingRemaining =
    freeShippingThreshold !== null && !qualifiesFreeShipping
      ? freeShippingThreshold - subtotalAfterDiscount
      : 0;
  const freeShippingProgress =
    freeShippingThreshold !== null
      ? Math.min((subtotalAfterDiscount / freeShippingThreshold) * 100, 100)
      : 0;

  const handleCalculateShipping = async () => {
    const digits = cepInput.replace(/\D/g, "");
    if (digits.length !== 8) {
      setCalcError("Informe um CEP válido com 8 dígitos.");
      return;
    }
    setCalcError("");
    setCalcLoading(true);
    setShippingOptions([]);
    setSelectedShipping(null);
    try {
      const res = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cep: digits,
          items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCalcError(data.error ?? "Não foi possível calcular o frete.");
        return;
      }
      const options: ShippingOption[] = data.options ?? [];
      setShippingZip(digits);
      setShippingOptions(options);
      // Auto-select cheapest option
      if (options.length > 0) {
        const cheapest = options.reduce((a, b) => (a.price <= b.price ? a : b));
        setSelectedShipping(cheapest);
      }
    } catch {
      setCalcError("Erro ao calcular frete. Tente novamente.");
    } finally {
      setCalcLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container">
          <EmptyState
            icon={ShoppingBag}
            title="Seu carrinho está vazio"
            description="Adicione produtos para continuar comprando."
            action={{ label: "Ver produtos", href: "/categoria/todos" }}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12 md:py-20">
        <div className="mb-8 md:mb-10">
          <span className="text-[11px] font-bold text-primary uppercase tracking-[0.12em]">Compra</span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">Carrinho</h1>
          <p className="text-muted-foreground text-sm mt-1">{items.length} {items.length === 1 ? 'item' : 'itens'} adicionados</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item, i) => (
              <motion.div
                key={item.product.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/20 transition-colors"
              >
                <Link href={`/produto/${item.product.id}`} className="shrink-0">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-20 h-20 rounded-xl object-cover bg-muted"
                  />
                </Link>
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <div>
                    <Link href={`/produto/${item.product.id}`}>
                      <h3 className="font-semibold text-sm leading-snug hover:text-primary transition-colors line-clamp-2">
                        {item.product.name}
                      </h3>
                    </Link>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-base font-bold">R$ {salePrice(item.product).toFixed(2).replace(".", ",")}</p>
                    {!!item.product.discount && (
                      <p className="text-xs text-muted-foreground line-through">R$ {item.product.price.toFixed(2).replace(".", ",")}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-border rounded-xl overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="h-8 w-8 flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-9 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="h-8 w-8 flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5 sticky top-24">
            <h2 className="font-bold text-base">Resumo do pedido</h2>

            {/* Coupon */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="Cupom de desconto"
                    className="w-full h-10 pl-8 pr-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <Button size="sm" onClick={applyCoupon} className="h-10 rounded-xl px-4 font-semibold">
                  Aplicar
                </Button>
              </div>
              {discount > 0 && (
                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Cupom aplicado:{" "}
                  {discountType === "percent" ? `${discount}% de desconto` : `R$ ${discount.toFixed(2).replace(".", ",")} de desconto`}
                </p>
              )}
            </div>

            {/* Shipping Calculator */}
            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                Calcular frete
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={cepInput}
                    onChange={(e) => setCepInput(formatCep(e.target.value))}
                    onKeyDown={(e) => e.key === "Enter" && handleCalculateShipping()}
                    placeholder="00000-000"
                    maxLength={9}
                    className="w-full h-10 pl-8 pr-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCalculateShipping}
                  disabled={calcLoading}
                  className="h-10 rounded-xl px-4 font-semibold shrink-0"
                >
                  {calcLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Calcular"}
                </Button>
              </div>

              {calcError && (
                <p className="text-xs text-destructive">{calcError}</p>
              )}

              {/* Shipping options */}
              {shippingOptions.length > 0 && (
                <div className="space-y-2">
                  {shippingOptions.map((opt) => (
                    <button
                      key={opt.code}
                      onClick={() => setSelectedShipping(opt)}
                      className={`w-full flex items-center justify-between text-sm px-3 py-2.5 rounded-xl border transition-colors ${
                        selectedShipping?.code === opt.code
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border hover:border-primary/40 text-muted-foreground"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {selectedShipping?.code === opt.code && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        )}
                        <span className="font-medium">{opt.name}</span>
                        {opt.deadlineDays > 0 && (
                          <span className="text-xs text-muted-foreground">
                            até {opt.deadlineDays} {opt.deadlineDays === 1 ? "dia útil" : "dias úteis"}
                          </span>
                        )}
                      </span>
                      <span className="font-semibold tabular-nums">
                        {opt.price === 0 ? "Grátis" : `R$ ${opt.price.toFixed(2).replace(".", ",")}`}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-2.5 text-sm border-t border-border pt-4">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="text-foreground">R$ {total.toFixed(2).replace(".", ",")}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>
                    Desconto{" "}
                    {discountType === "percent" ? `(${discount}%)` : ""}
                  </span>
                  <span>− R$ {discountAmount.toFixed(2).replace(".", ",")}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Frete</span>
                <span className={shipping === 0 ? "text-emerald-600 font-medium" : "text-foreground"}>
                  {shipping === null
                    ? <span className="italic text-xs">calcule acima</span>
                    : shipping === 0
                    ? "Grátis"
                    : `R$ ${shipping.toFixed(2).replace(".", ",")}`}
                </span>
              </div>
              <div className="flex justify-between font-bold text-base border-t border-border pt-3 mt-1">
                <span>Total</span>
                <span>
                  {shipping === null
                    ? `R$ ${subtotalAfterDiscount.toFixed(2).replace(".", ",")}*`
                    : `R$ ${finalTotal.toFixed(2).replace(".", ",")}`}
                </span>
              </div>
              {shipping === null && (
                <p className="text-[11px] text-muted-foreground">* Total sem frete. Calcule o frete acima.</p>
              )}
            </div>

            <Link href="/checkout" className="block">
              <Button className="w-full h-11 rounded-xl font-semibold">
                Finalizar compra <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>

            {freeShippingThreshold !== null && (
              <div className="space-y-2 pt-1">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  {qualifiesFreeShipping
                    ? <span className="text-emerald-600 font-medium">Frete grátis desbloqueado!</span>
                    : <>Faltam <span className="font-semibold text-foreground">R$ {freeShippingRemaining.toFixed(2).replace(".", ",")}</span> para frete grátis</>
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
