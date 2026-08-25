'use client';

import Layout from "@/components/layout/Layout";
import { useCart } from "@/contexts/CartContext";
import type { ShippingOption } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useRef, Suspense } from "react";
import { Package, CreditCard, QrCode, Barcode, ExternalLink, AlertCircle, Truck, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { lookupCep } from "@/lib/viaCep";
import { salePrice } from "@/lib/utils";
import { motion } from "framer-motion";

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
  shipping_neighborhood: string;
  shipping_city: string;
  shipping_state: string;
}

const initialFormState: CheckoutForm = {
  customer_name: "", email: "", phone: "", document: "", company_name: "",
  shipping_zipcode: "", shipping_street: "", shipping_number: "",
  shipping_complement: "", shipping_neighborhood: "", shipping_city: "", shipping_state: "",
};

const isCnpj = (value: string) => value.replace(/\D/g, "").length === 14;
const fieldClass = "h-11 rounded-xl text-sm";


function CheckoutContent() {
  const {
    items, total, discount, discountType, coupon, clearCart,
    shippingOptions, setShippingOptions,
    selectedShipping, setSelectedShipping,
    shippingZip, setShippingZip,
    freeShippingThreshold,
  } = useCart();
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentParam = searchParams.get("payment");

  const [formData, setFormData] = useState<CheckoutForm>(initialFormState);
  const [saving, setSaving] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [zipError, setZipError] = useState("");
  const [addressLookupPending, setAddressLookupPending] = useState(false);
  const [lastFetchedZip, setLastFetchedZip] = useState("");
  const [shippingCalcLoading, setShippingCalcLoading] = useState(false);
  const lastCalcZip = useRef("");

  const discountAmount =
    discountType === "percent"
      ? (total * discount) / 100
      : Math.min(discount, total);

  const subtotalAfterDiscount = total - discountAmount;

  const qualifiesFreeShipping =
    freeShippingThreshold !== null && subtotalAfterDiscount >= freeShippingThreshold;

  const shippingCost = qualifiesFreeShipping
    ? 0
    : shippingOptions.length > 0
    ? (selectedShipping?.price ?? shippingOptions[0]?.price ?? 0)
    : 0;

  const freeShippingRemaining =
    freeShippingThreshold !== null && !qualifiesFreeShipping
      ? freeShippingThreshold - subtotalAfterDiscount
      : 0;
  const freeShippingProgress =
    freeShippingThreshold !== null
      ? Math.min((subtotalAfterDiscount / freeShippingThreshold) * 100, 100)
      : 0;

  const zipDigits = formData.shipping_zipcode.replace(/\D/g, "");
  const zipComplete = zipDigits.length === 8;
  const shippingKnown = qualifiesFreeShipping || (zipComplete && !shippingCalcLoading);

  const finalTotal = subtotalAfterDiscount + (shippingKnown ? shippingCost : 0);
  const isDocumentCnpj = isCnpj(formData.document);

  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      customer_name: user.name || prev.customer_name,
      email: user.email || prev.email,
      phone: user.phone || prev.phone,
      document: user.document || prev.document,
      company_name: user.company_name || prev.company_name,
      shipping_zipcode: user.shipping_zipcode || prev.shipping_zipcode,
      shipping_street: user.shipping_street || prev.shipping_street,
      shipping_number: user.shipping_number || prev.shipping_number,
      shipping_complement: user.shipping_complement || prev.shipping_complement,
      shipping_neighborhood: user.shipping_neighborhood || prev.shipping_neighborhood,
      shipping_city: user.shipping_city || prev.shipping_city,
      shipping_state: user.shipping_state || prev.shipping_state,
    }));
  }, [user]);

  // ViaCEP address autofill
  useEffect(() => {
    const cepDigits = formData.shipping_zipcode.replace(/\D/g, "");
    if (cepDigits.length !== 8 || cepDigits === lastFetchedZip) return;
    const fetchAddress = async () => {
      setZipError("");
      setAddressLookupPending(true);
      try {
        const result = await lookupCep(cepDigits);
        if (!result) { setZipError("CEP inválido ou não encontrado."); return; }
        setFormData((prev) => ({
          ...prev,
          shipping_zipcode: result.cep,
          shipping_street: result.logradouro || prev.shipping_street,
          shipping_neighborhood: result.bairro || prev.shipping_neighborhood,
          shipping_city: result.localidade || prev.shipping_city,
          shipping_state: result.uf || prev.shipping_state,
        }));
        setLastFetchedZip(cepDigits);
      } catch { setZipError("Não foi possível buscar o endereço pelo CEP."); }
      finally { setAddressLookupPending(false); }
    };
    fetchAddress();
  }, [formData.shipping_zipcode, lastFetchedZip]);

  // Auto-calculate shipping when a valid CEP is entered (and different from cart calculation)
  useEffect(() => {
    const cepDigits = formData.shipping_zipcode.replace(/\D/g, "");
    if (cepDigits.length !== 8) return;
    if (cepDigits === lastCalcZip.current) return;
    // If cart already has options for this CEP, reuse them
    if (cepDigits === shippingZip && shippingOptions.length > 0) {
      lastCalcZip.current = cepDigits;
      return;
    }

    const calcShipping = async () => {
      lastCalcZip.current = cepDigits;
      setShippingCalcLoading(true);
      try {
        const res = await fetch("/api/shipping/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cep: cepDigits,
            items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
          }),
        });
        if (!res.ok) return; // Fall back to static if API unavailable
        const data = await res.json();
        const options: ShippingOption[] = data.options ?? [];
        if (options.length > 0) {
          setShippingZip(cepDigits);
          setShippingOptions(options);
          // Keep current selection if valid, else auto-select cheapest
          if (!selectedShipping || !options.find((o) => o.code === selectedShipping.code)) {
            const cheapest = options.reduce((a, b) => (a.price <= b.price ? a : b));
            setSelectedShipping(cheapest);
          }
        }
      } catch {
        // Silently fall back to static pricing
      } finally {
        setShippingCalcLoading(false);
      }
    };
    calcShipping();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.shipping_zipcode]);

  const handleChange = (field: keyof CheckoutForm, value: string) => {
    if (field === "shipping_zipcode") setZipError("");
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) { router.push("/auth"); return; }
    if (isDocumentCnpj && !formData.company_name.trim()) {
      toast({ title: "Dados incompletos", description: "Informe a razão social quando o documento for CNPJ.", variant: "destructive" });
      return;
    }
    if (items.length === 0) {
      toast({ title: "Carrinho vazio", description: "Adicione produtos antes de finalizar.", variant: "destructive" });
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
          phone: formData.phone,
          shipping_zipcode: formData.shipping_zipcode,
          shipping_street: formData.shipping_street,
          shipping_number: formData.shipping_number,
          shipping_complement: formData.shipping_complement,
          shipping_neighborhood: formData.shipping_neighborhood,
          shipping_city: formData.shipping_city,
          shipping_state: formData.shipping_state,
          shipping_country: "BR",
          shipping_service_code: selectedShipping?.code ?? null,
          items: items.reduce((sum, item) => sum + item.quantity, 0),
          total: finalTotal,
          shipping_cost: shippingCost,
          items_detail: items.map((item) => ({
            product_id: item.product.id,
            name: item.product.name,
            quantity: item.quantity,
            price: salePrice(item.product),
          })),
          coupon: coupon || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({ title: "Erro", description: error?.error || "Falha ao finalizar a compra.", variant: "destructive" });
        return;
      }

      const result = await response.json();
      const checkoutUrl = result?.payment?.checkout_url;

      if (checkoutUrl && typeof checkoutUrl === "string" && checkoutUrl.startsWith("http")) {
        clearCart();
        setRedirecting(true);
        window.location.href = checkoutUrl;
        return;
      }

      if (result?.payment?.error) {
        toast({
          title: "Erro ao gerar pagamento",
          description: "Seu pedido foi criado, mas houve um erro ao gerar o link de pagamento. Você pode tentar novamente na página do pedido.",
          variant: "destructive",
        });
        clearCart();
        router.push(`/meus-pedidos/${result.order.id}?payment=pending`);
        return;
      }

      if (result?.payment?.pending_configuration) {
        clearCart();
        router.push(`/meus-pedidos/${result.order.id}?payment=pending`);
        return;
      }

      clearCart();
      router.push(`/meus-pedidos/${result.order?.id ?? ""}`);
    } catch {
      toast({ title: "Erro", description: "Não foi possível finalizar a compra.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container py-20 md:py-28 flex flex-col items-center text-center gap-5 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
            <Package className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Faça login para continuar</h1>
            <p className="text-muted-foreground text-sm">Precisamos do seu cadastro para salvar o endereço e emitir a nota fiscal.</p>
          </div>
          <Button className="h-11 px-6 rounded-xl font-semibold" onClick={() => router.push("/auth")}>
            Entrar ou criar conta
          </Button>
        </div>
      </Layout>
    );
  }

  if (redirecting) {
    return (
      <Layout>
        <div className="container py-20 md:py-28 flex flex-col items-center text-center gap-5 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
            <ExternalLink className="h-7 w-7 text-primary animate-pulse" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Redirecionando para o pagamento…</h1>
            <p className="text-muted-foreground text-sm">Você será levado à página segura do Mercado Pago para concluir o pagamento via Pix, cartão ou boleto.</p>
          </div>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12 md:py-20 max-w-4xl">
        <div className="mb-8 md:mb-10">
          <span className="text-[11px] font-bold text-primary uppercase tracking-[0.12em]">Compra</span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">Checkout</h1>
        </div>

        {paymentParam === "cancelled" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Pagamento cancelado. Seus dados foram salvos — preencha novamente e tente outra vez.</span>
          </motion.div>
        )}

        <div className="grid md:grid-cols-5 gap-8 items-start">
          <form className="md:col-span-3 space-y-6" onSubmit={handleSubmit}>

            {/* Dados Pessoais */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold text-base">Dados Pessoais</h2>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Nome completo</Label>
                  <Input className={fieldClass} placeholder="Nome completo" required value={formData.customer_name} onChange={(e) => handleChange("customer_name", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">E-mail</Label>
                  <Input className={fieldClass} type="email" placeholder="E-mail" required value={formData.email} onChange={(e) => handleChange("email", e.target.value)} disabled />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Telefone</Label>
                    <Input className={fieldClass} type="tel" placeholder="(11) 00000-0000" required value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">CPF ou CNPJ</Label>
                    <Input className={fieldClass} placeholder="CPF ou CNPJ" required value={formData.document} onChange={(e) => handleChange("document", e.target.value)} />
                  </div>
                </div>
                {isDocumentCnpj ? (
                  <div className="space-y-1.5">
                    <Label className="text-sm">Razão Social <span className="text-destructive">*</span></Label>
                    <Input className={fieldClass} placeholder="Razão social" required value={formData.company_name} onChange={(e) => handleChange("company_name", e.target.value)} />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Empresa (opcional)</Label>
                    <Input className={fieldClass} placeholder="Nome da empresa" value={formData.company_name} onChange={(e) => handleChange("company_name", e.target.value)} />
                  </div>
                )}
              </div>
            </div>

            {/* Endereço */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold text-base">Endereço de Entrega</h2>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">CEP</Label>
                  <Input className={fieldClass} placeholder="00000-000" required value={formData.shipping_zipcode} onChange={(e) => handleChange("shipping_zipcode", e.target.value)} />
                  {addressLookupPending && <p className="text-xs text-muted-foreground">Buscando endereço...</p>}
                  {zipError && <p className="text-xs text-destructive">{zipError}</p>}
                  {shippingCalcLoading && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Calculando frete...
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Rua</Label>
                  <Input className={fieldClass} placeholder="Nome da rua" required value={formData.shipping_street} onChange={(e) => handleChange("shipping_street", e.target.value)} />
                </div>
                <div className="grid grid-cols-5 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-sm">Número</Label>
                    <Input className={fieldClass} placeholder="Nº" required value={formData.shipping_number} onChange={(e) => handleChange("shipping_number", e.target.value)} />
                  </div>
                  <div className="col-span-3 space-y-1.5">
                    <Label className="text-sm">Complemento</Label>
                    <Input className={fieldClass} placeholder="Apto, bloco..." value={formData.shipping_complement} onChange={(e) => handleChange("shipping_complement", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Bairro</Label>
                  <Input className={fieldClass} placeholder="Bairro" required value={formData.shipping_neighborhood} onChange={(e) => handleChange("shipping_neighborhood", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Cidade</Label>
                    <Input className={fieldClass} placeholder="Cidade" required value={formData.shipping_city} onChange={(e) => handleChange("shipping_city", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Estado</Label>
                    <Input className={fieldClass} placeholder="UF" required value={formData.shipping_state} onChange={(e) => handleChange("shipping_state", e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Shipping option selector (shown once options are available) */}
              {shippingOptions.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                    Modalidade de entrega
                  </p>
                  {shippingOptions.map((opt) => (
                    <button
                      key={opt.code}
                      type="button"
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

            {/* Pagamento */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
              <h2 className="font-semibold text-base">Pagamento</h2>
              <p className="text-sm text-muted-foreground">Você escolherá o método na próxima etapa, na página segura do Mercado Pago.</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-start gap-1.5 rounded-xl border border-border bg-muted/40 px-3 py-3">
                  <QrCode className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">Pix</span>
                  <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">Instantâneo</span>
                </div>
                <div className="flex flex-col items-start gap-1.5 rounded-xl border border-border bg-muted/40 px-3 py-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">Cartão</span>
                  <span className="text-[11px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">até 12×</span>
                </div>
                <div className="flex flex-col items-start gap-1.5 rounded-xl border border-border bg-muted/40 px-3 py-3">
                  <Barcode className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">Boleto</span>
                  <span className="text-[11px] text-muted-foreground font-semibold bg-background px-2 py-0.5 rounded-full">1-3 dias</span>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl font-semibold text-base gap-2"
              disabled={saving || redirecting}
            >
              <ExternalLink className="h-4 w-4" />
              {saving
                ? "Criando pedido…"
                : shippingKnown
                ? `Ir para o Pagamento — R$ ${finalTotal.toFixed(2).replace(".", ",")}`
                : "Ir para o Pagamento"}
            </Button>
          </form>

          {/* Order Summary */}
          <div className="md:col-span-2 bg-card border border-border rounded-2xl p-5 sticky top-24 space-y-4">
            <h2 className="font-semibold text-base">Resumo do pedido</h2>
            {freeShippingThreshold !== null && (
              <div className="space-y-1.5">
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
            <div className="space-y-2.5 text-sm">
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between gap-2">
                  <span className="text-muted-foreground truncate">{item.quantity}× {item.product.name}</span>
                  <span className="tabular-nums shrink-0 font-medium">R$ {(salePrice(item.product) * item.quantity).toFixed(2).replace(".", ",")}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span><span>R$ {total.toFixed(2).replace(".", ",")}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Desconto</span><span>−R$ {discountAmount.toFixed(2).replace(".", ",")}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Frete</span>
                <span className={shippingKnown && shippingCost === 0 ? "text-emerald-600 font-medium" : ""}>
                  {!zipComplete
                    ? <span className="text-xs italic">informe o CEP</span>
                    : shippingCalcLoading
                    ? <span className="text-xs italic">calculando...</span>
                    : shippingCost === 0
                    ? "Grátis"
                    : `R$ ${shippingCost.toFixed(2).replace(".", ",")}`}
                </span>
              </div>
              {shippingKnown && selectedShipping && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  {selectedShipping.name}
                  {selectedShipping.deadlineDays > 0 && ` · até ${selectedShipping.deadlineDays} dias úteis`}
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t border-border pt-3">
                <span>Total</span>
                <span>
                  {shippingKnown
                    ? `R$ ${finalTotal.toFixed(2).replace(".", ",")}`
                    : `R$ ${subtotalAfterDiscount.toFixed(2).replace(".", ",")} + frete`}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground text-center pt-1">
              Pagamento processado com segurança pelo Mercado Pago
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}
