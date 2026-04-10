'use client';

import Layout from "@/components/layout/Layout";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { lookupCep } from "@/lib/viaCep";

interface CheckoutForm {
  customer_name: string;
  email: string;
  phone: string;
  document: string;
  company_name: string;
  shipping_zipcode: string;
  shipping_street: string;
  shipping_number: string;
  shipping_complement: string;
  shipping_city: string;
  shipping_state: string;
}

const initialFormState: CheckoutForm = {
  customer_name: "",
  email: "",
  phone: "",
  document: "",
  company_name: "",
  shipping_zipcode: "",
  shipping_street: "",
  shipping_number: "",
  shipping_complement: "",
  shipping_city: "",
  shipping_state: "",
};

const isCnpj = (value: string) => value.replace(/\D/g, "").length === 14;

export default function CheckoutPage() {
  const { items, total, discount, clearCart } = useCart();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<CheckoutForm>(initialFormState);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [zipError, setZipError] = useState("");
  const [addressLookupPending, setAddressLookupPending] = useState(false);
  const [lastFetchedZip, setLastFetchedZip] = useState("");

  const shipping = total > 300 ? 0 : 29.9;
  const discountAmount = (total * discount) / 100;
  const finalTotal = total - discountAmount + shipping;
  const isDocumentCnpj = isCnpj(formData.document);

  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      customer_name: user.name || prev.customer_name,
      email: user.email || prev.email,
      document: user.document || prev.document,
      company_name: user.company_name || prev.company_name,
      shipping_zipcode: user.shipping_zipcode || prev.shipping_zipcode,
      shipping_street: user.shipping_street || prev.shipping_street,
      shipping_number: user.shipping_number || prev.shipping_number,
      shipping_complement: user.shipping_complement || prev.shipping_complement,
      shipping_city: user.shipping_city || prev.shipping_city,
      shipping_state: user.shipping_state || prev.shipping_state,
    }));
  }, [user]);

  useEffect(() => {
    const cepDigits = formData.shipping_zipcode.replace(/\D/g, "");
    if (cepDigits.length !== 8 || cepDigits === lastFetchedZip) {
      return;
    }

    const fetchAddress = async () => {
      setZipError("");
      setAddressLookupPending(true);

      try {
        const result = await lookupCep(cepDigits);
        if (!result) {
          setZipError("CEP inválido ou não encontrado.");
          return;
        }

        setFormData((prev) => ({
          ...prev,
          shipping_zipcode: result.cep,
          shipping_street: result.logradouro || prev.shipping_street,
          shipping_city: result.localidade || prev.shipping_city,
          shipping_state: result.uf || prev.shipping_state,
        }));
        setLastFetchedZip(cepDigits);
      } catch (error) {
        console.error("ViaCep lookup error:", error);
        setZipError("Não foi possível buscar o endereço pelo CEP.");
      } finally {
        setAddressLookupPending(false);
      }
    };

    fetchAddress();
  }, [formData.shipping_zipcode, lastFetchedZip]);

  const handleChange = (field: keyof CheckoutForm, value: string) => {
    if (field === "shipping_zipcode") {
      setZipError("");
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      router.push("/auth");
      return;
    }

    if (isDocumentCnpj && !formData.company_name.trim()) {
      toast({ title: "Dados incompletos", description: "Informe a razão social quando o documento for CNPJ.", variant: "destructive" });
      return;
    }

    if (items.length === 0) {
      toast({ title: "Carrinho vazio", description: "Adicione produtos antes de finalizar a compra.", variant: "destructive" });
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: formData.customer_name,
          document: formData.document,
          company_name: formData.company_name,
          shipping_zipcode: formData.shipping_zipcode,
          shipping_street: formData.shipping_street,
          shipping_number: formData.shipping_number,
          shipping_complement: formData.shipping_complement,
          shipping_city: formData.shipping_city,
          shipping_state: formData.shipping_state,
          shipping_country: "BR",
          items: items.reduce((sum, item) => sum + item.quantity, 0),
          total: finalTotal,
          shipping_cost: shipping,
          items_detail: items.map((item) => ({
            product_id: item.product.id,
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({ title: "Erro", description: error?.error || "Falha ao finalizar a compra.", variant: "destructive" });
        return;
      }

      setSubmitted(true);
      clearCart();
    } catch (error) {
      console.error("Checkout error:", error);
      toast({ title: "Erro", description: "Não foi possível finalizar a compra.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Carregando informações do usuário...</p>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container py-20 text-center space-y-4">
          <h1 className="text-3xl font-bold">Faça login para finalizar a compra</h1>
          <p className="text-muted-foreground">Precisamos do seu cadastro para salvar endereço e emitir a nota fiscal corretamente.</p>
          <Button variant="hero" onClick={() => router.push("/auth")}>Entrar ou criar conta</Button>
        </div>
      </Layout>
    );
  }

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
          <form className="md:col-span-3 space-y-6" onSubmit={handleSubmit}>
            <fieldset className="space-y-4">
              <legend className="font-semibold text-lg mb-2">Dados Pessoais</legend>
              <input
                type="text"
                placeholder="Nome completo"
                required
                value={formData.customer_name}
                onChange={(e) => handleChange("customer_name", e.target.value)}
                className="w-full px-4 py-3 border rounded-xl bg-background"
              />
              <input
                type="email"
                placeholder="E-mail"
                required
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                disabled
                className="w-full px-4 py-3 border rounded-xl bg-muted text-muted-foreground"
              />
              <input
                type="tel"
                placeholder="Telefone"
                required
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="w-full px-4 py-3 border rounded-xl bg-background"
              />
              <input
                type="text"
                placeholder="CPF ou CNPJ"
                required
                value={formData.document}
                onChange={(e) => handleChange("document", e.target.value)}
                className="w-full px-4 py-3 border rounded-xl bg-background"
              />
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="font-semibold text-lg mb-2">Endereço de Entrega</legend>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="CEP"
                  required
                  value={formData.shipping_zipcode}
                  onChange={(e) => handleChange("shipping_zipcode", e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl bg-background"
                />
                {addressLookupPending && (
                  <p className="text-sm text-muted-foreground">Buscando endereço pelo CEP...</p>
                )}
                {zipError && (
                  <p className="text-sm text-destructive">{zipError}</p>
                )}
              </div>
              <input
                type="text"
                placeholder="Rua"
                required
                value={formData.shipping_street}
                onChange={(e) => handleChange("shipping_street", e.target.value)}
                className="w-full px-4 py-3 border rounded-xl bg-background"
              />
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Número"
                  required
                  value={formData.shipping_number}
                  onChange={(e) => handleChange("shipping_number", e.target.value)}
                  className="px-4 py-3 border rounded-xl bg-background"
                />
                <input
                  type="text"
                  placeholder="Complemento"
                  value={formData.shipping_complement}
                  onChange={(e) => handleChange("shipping_complement", e.target.value)}
                  className="col-span-2 px-4 py-3 border rounded-xl bg-background"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Cidade"
                  required
                  value={formData.shipping_city}
                  onChange={(e) => handleChange("shipping_city", e.target.value)}
                  className="px-4 py-3 border rounded-xl bg-background"
                />
                <input
                  type="text"
                  placeholder="Estado"
                  required
                  value={formData.shipping_state}
                  onChange={(e) => handleChange("shipping_state", e.target.value)}
                  className="px-4 py-3 border rounded-xl bg-background"
                />
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="font-semibold text-lg mb-2">
                Empresa {isDocumentCnpj ? "(obrigatório para CNPJ)" : "(opcional)"}
              </legend>
              <input
                type="text"
                placeholder="Razão social ou nome da empresa"
                value={formData.company_name}
                onChange={(e) => handleChange("company_name", e.target.value)}
                required={isDocumentCnpj}
                className="w-full px-4 py-3 border rounded-xl bg-background"
              />
            </fieldset>

            <Button variant="hero" type="submit" className="w-full" disabled={saving}>
              {saving ? "Processando pedido..." : `Finalizar Compra — R$ ${finalTotal.toFixed(2).replace(".", ",")}`}
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
