'use client';

import Layout from "@/components/layout/Layout";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CheckCircle } from "lucide-react";

export default function CheckoutPage() {
  const { items, total, discount, clearCart } = useCart();
  const [submitted, setSubmitted] = useState(false);
  const shipping = total > 300 ? 0 : 29.90;
  const discountAmount = (total * discount) / 100;
  const finalTotal = total - discountAmount + shipping;

  if (submitted) {
    return (
      <Layout>
        <div className="container py-20 text-center space-y-4">
          <CheckCircle className="h-20 w-20 mx-auto text-green-500" />
          <h1 className="text-3xl font-bold">Pedido Realizado!</h1>
          <p className="text-muted-foreground">Seu pedido foi recebido com sucesso. Você receberá um e-mail de confirmação.</p>
          <p className="text-sm text-muted-foreground">Número do pedido: #PED-{Math.floor(Math.random() * 9000 + 1000)}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-10 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        <div className="grid md:grid-cols-5 gap-8">
          <form
            className="md:col-span-3 space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
              clearCart();
            }}
          >
            <fieldset className="space-y-4">
              <legend className="font-semibold text-lg mb-2">Dados Pessoais</legend>
              <input type="text" placeholder="Nome completo" required className="w-full px-4 py-3 border rounded-xl bg-background" />
              <input type="email" placeholder="E-mail" required className="w-full px-4 py-3 border rounded-xl bg-background" />
              <input type="tel" placeholder="Telefone" required className="w-full px-4 py-3 border rounded-xl bg-background" />
              <input type="text" placeholder="CPF" required className="w-full px-4 py-3 border rounded-xl bg-background" />
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="font-semibold text-lg mb-2">Endereço de Entrega</legend>
              <input type="text" placeholder="CEP" required className="w-full px-4 py-3 border rounded-xl bg-background" />
              <input type="text" placeholder="Rua" required className="w-full px-4 py-3 border rounded-xl bg-background" />
              <div className="grid grid-cols-3 gap-3">
                <input type="text" placeholder="Número" required className="px-4 py-3 border rounded-xl bg-background" />
                <input type="text" placeholder="Complemento" className="col-span-2 px-4 py-3 border rounded-xl bg-background" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Cidade" required className="px-4 py-3 border rounded-xl bg-background" />
                <input type="text" placeholder="Estado" required className="px-4 py-3 border rounded-xl bg-background" />
              </div>
            </fieldset>

            <Button variant="hero" type="submit" className="w-full">
              Finalizar Compra — R$ {finalTotal.toFixed(2).replace(".", ",")}
            </Button>
          </form>

          <div className="md:col-span-2 bg-card rounded-2xl border p-6 h-fit sticky top-24">
            <h2 className="font-bold mb-4">Resumo do Pedido</h2>
            <div className="space-y-3 text-sm">
              {items.map((item) => (
                <div key={`${item.product.id}-${item.customization?.text}`} className="flex justify-between">
                  <span className="text-muted-foreground truncate mr-2">{item.quantity}x {item.product.name}</span>
                  <span className="tabular-nums shrink-0">R$ {(item.product.price * item.quantity).toFixed(2).replace(".", ",")}</span>
                </div>
              ))}
              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>R$ {total.toFixed(2).replace(".", ",")}</span></div>
                {discount > 0 && <div className="flex justify-between text-green-600"><span>Desconto</span><span>-R$ {discountAmount.toFixed(2).replace(".", ",")}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span>{shipping === 0 ? "Grátis" : `R$ ${shipping.toFixed(2).replace(".", ",")}`}</span></div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>R$ {finalTotal.toFixed(2).replace(".", ",")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
