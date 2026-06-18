'use client';

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Truck, Megaphone, Gift,
  Check, Loader2,
} from "lucide-react";
import { AdminPageLoader } from "@/components/admin/AdminLoader";
import { toast } from "sonner";
import type { Setting } from "@/lib/supabase/settings";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FieldDef {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "number" | "email" | "textarea";
  hint?: string;
}

// ─── Section data ─────────────────────────────────────────────────────────────

const CORREIOS_CREDENTIAL_FIELDS: FieldDef[] = [
  { key: "correios_username",    label: "Usuário (e-mail ou CNPJ)", placeholder: "financeiro@empresa.com.br", hint: "Login do Meu Correios vinculado ao contrato" },
  { key: "correios_access_code", label: "Código de Acesso da API",  placeholder: "Gerado em cws.correios.com.br/chaves-acesso", hint: "Não é a senha do Meu Correios — é a chave gerada no portal CWS" },
  { key: "correios_postal_card", label: "Cartão de Postagem",       placeholder: "Ex: 0079942288", hint: "Número do cartão de postagem do contrato (10 dígitos)" },
];

const CORREIOS_FIELDS: FieldDef[] = [
  { key: "correios_origin_zip",   label: "CEP de Origem",      placeholder: "Ex: 01310100", hint: "CEP do remetente, sem hífen" },
  { key: "correios_weight_grams", label: "Peso do Pacote (g)", placeholder: "Ex: 300",      type: "number", hint: "Peso padrão em gramas" },
];


const BANNER_COLORS = [
  { label: "Padrão (marca)",  value: "" },
  { label: "Preto",           value: "#18181b" },
  { label: "Amarelo",         value: "#eab308" },
  { label: "Verde",           value: "#16a34a" },
  { label: "Vermelho",        value: "#dc2626" },
];

function hexLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}


// ─── Field component ──────────────────────────────────────────────────────────

function SettingField({
  def,
  value,
  saving,
  onChange,
  onSave,
}: {
  def: FieldDef;
  value: string;
  saving: boolean;
  onChange: (v: string) => void;
  onSave: () => void;
}) {
  const isTextarea = def.type === "textarea";
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{def.label}</Label>
      <div className="flex gap-2 items-start">
        {isTextarea ? (
          <Textarea
            placeholder={def.placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="text-sm resize-none"
            rows={3}
          />
        ) : (
          <Input
            type={def.type ?? "text"}
            placeholder={def.placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="font-mono text-sm"
          />
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0 h-10 w-10 p-0 mt-0"
          onClick={onSave}
          disabled={saving}
          title="Salvar"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        </Button>
      </div>
      {def.hint && <p className="text-xs text-muted-foreground">{def.hint}</p>}
    </div>
  );
}

function BannerColorPicker({
  selected,
  saving,
  onSelect,
}: {
  selected: string;
  saving: boolean;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Cor do banner</p>
      <div className="flex flex-wrap gap-2.5">
        {BANNER_COLORS.map((c) => {
          const active = selected === c.value;
          return (
            <button
              key={c.value || "default"}
              type="button"
              title={c.label}
              disabled={saving}
              onClick={() => onSelect(c.value)}
              className={`relative w-8 h-8 rounded-full border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                active ? "border-foreground scale-110 shadow-md" : "border-transparent hover:scale-105 hover:border-muted-foreground/40"
              }`}
              style={c.value ? { backgroundColor: c.value } : undefined}
            >
              {!c.value && (
                <span className="absolute inset-0 rounded-full bg-primary flex items-center justify-center">
                  {active && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                </span>
              )}
              {c.value && active && (
                <Check
                  className="h-3.5 w-3.5 absolute inset-0 m-auto drop-shadow"
                  style={{ color: hexLuminance(c.value) > 0.5 ? "#000" : "#fff" }}
                />
              )}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">Clique para aplicar — salvo automaticamente</p>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-2xl border p-6 space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const [values, setValues]   = useState<Record<string, string>>({});
  const [saving, setSaving]   = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    const res = await fetch("/api/admin/settings");
    if (!res.ok) return;
    const data: Setting[] = await res.json();
    const map: Record<string, string> = {};
    data.forEach((s) => { map[s.key] = s.value ?? ""; });
    setValues(map);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const save = async (key: string, overrideValue?: string) => {
    const val = overrideValue ?? values[key] ?? "";
    setSaving((p) => ({ ...p, [key]: true }));
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: val }),
      });
      if (res.ok) {
        toast.success("Salvo");
      } else {
        toast.error("Erro ao salvar");
      }
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving((p) => ({ ...p, [key]: false }));
    }
  };

  const set = (key: string, val: string) =>
    setValues((p) => ({ ...p, [key]: val }));

  const bannerActive = values["banner_active"] === "true";

  const toggleBanner = async (checked: boolean) => {
    const val = String(checked);
    set("banner_active", val);
    await save("banner_active", val);
  };

  const selectBannerColor = async (color: string) => {
    set("banner_color", color);
    await save("banner_color", color);
  };

  if (loading) return <AdminPageLoader />;

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Configurações</h1>
      </div>

      <div className="space-y-6 max-w-2xl">

        {/* ── Frete: Correios ──────────────────────────────────────── */}
        <SectionCard
          icon={Truck}
          title="Correios — Cálculo de Frete"
          description="Parâmetros usados no cálculo dinâmico de PAC e SEDEX."
        >

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CORREIOS_FIELDS.map((def) => (
              <SettingField
                key={def.key}
                def={def}
                value={values[def.key] ?? ""}
                saving={!!saving[def.key]}
                onChange={(v) => set(def.key, v)}
                onSave={() => save(def.key)}
              />
            ))}
          </div>
        </SectionCard>

        {/* ── Frete grátis ─────────────────────────────────────────── */}
        <SectionCard
          icon={Gift}
          title="Frete Grátis"
          description="Pedidos acima deste valor ganham frete grátis automaticamente. Deixe vazio para desativar."
        >
          <SettingField
            def={{ key: "shipping_free_above", label: "Frete grátis acima de (R$)", placeholder: "Ex: 300.00", type: "number", hint: "Valor mínimo do subtotal para isenção de frete" }}
            value={values["shipping_free_above"] ?? ""}
            saving={!!saving["shipping_free_above"]}
            onChange={(v) => set("shipping_free_above", v)}
            onSave={() => save("shipping_free_above")}
          />
        </SectionCard>

        {/* ── Banner global ─────────────────────────────────────────── */}
        <SectionCard
          icon={Megaphone}
          title="Aviso Global (Banner)"
          description="Faixa exibida no topo do site para todos os visitantes."
        >
          <SettingField
            def={{ key: "banner_text", label: "Texto do aviso", placeholder: "🎉 Frete grátis acima de R$ 300!", type: "textarea" }}
            value={values["banner_text"] ?? ""}
            saving={!!saving["banner_text"]}
            onChange={(v) => set("banner_text", v)}
            onSave={() => save("banner_text")}
          />

          <BannerColorPicker
            selected={values["banner_color"] ?? ""}
            saving={!!saving["banner_color"]}
            onSelect={selectBannerColor}
          />

          <div className="flex items-center justify-between rounded-xl border bg-muted/40 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Exibir banner</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {bannerActive ? "Banner ativo — visível no site" : "Banner desativado"}
              </p>
            </div>
            <Switch
              checked={bannerActive}
              onCheckedChange={toggleBanner}
              disabled={!!saving["banner_active"]}
            />
          </div>
        </SectionCard>

      </div>
    </AdminLayout>
  );
}
