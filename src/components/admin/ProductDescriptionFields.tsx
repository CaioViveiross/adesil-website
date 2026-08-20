'use client';

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, MessageCircle, MessageCircleQuestion } from "lucide-react";
import { FAQ_SUPPORT_MESSAGE, SPEC_FIELDS, parseLines } from "@/lib/productDescription";
import type { ProductFaq } from "@/types/supabase";

/**
 * Representação da descrição estruturada enquanto está sendo editada.
 * As seções de lista viram texto (uma linha por item) porque é o formato mais
 * rápido de digitar e colar; a conversão para JSON acontece no submit.
 */
export interface DescriptionSectionsForm {
  benefits: string;
  /** Campos fixos do padrão, indexados pelo rótulo (ver SPEC_FIELDS). */
  specs: Record<string, string>;
  /** Especificações fora do padrão, uma por linha no formato "Rótulo: valor". */
  specsExtra: string;
  package_contents: string;
  compatibility: string;
  usage: string;
  faq: ProductFaq[];
}

export const emptyDescriptionSectionsForm: DescriptionSectionsForm = {
  benefits: "",
  specs: {},
  specsExtra: "",
  package_contents: "",
  compatibility: "",
  usage: "",
  faq: [],
};

/** Quantas seções têm conteúdo — usado no badge da aba "Descrição". */
export function countFilledSections(
  value: DescriptionSectionsForm,
  description: string
): number {
  const hasSpecs =
    Object.values(value.specs).some((spec) => spec.trim()) || Boolean(value.specsExtra.trim());

  return [
    Boolean(description.trim()),
    Boolean(value.benefits.trim()),
    hasSpecs,
    Boolean(value.package_contents.trim()),
    Boolean(value.compatibility.trim()),
    Boolean(value.usage.trim()),
    value.faq.length > 0,
  ].filter(Boolean).length;
}

interface Props {
  value: DescriptionSectionsForm;
  onChange: (value: DescriptionSectionsForm) => void;
  /** Apresentação breve — vive em `products.description`, não no jsonb. */
  description: string;
  onDescriptionChange: (value: string) => void;
}

function ListField({
  id,
  label,
  hint,
  placeholder,
  value,
  rows = 4,
  recommended,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  placeholder: string;
  value: string;
  rows?: number;
  /** Faixa recomendada de itens; fora dela o contador vira um aviso discreto. */
  recommended?: { min: number; max: number };
  onChange: (value: string) => void;
}) {
  const count = parseLines(value).length;
  const outOfRange =
    recommended && count > 0 && (count < recommended.min || count > recommended.max);

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {count > 0 && (
          <span
            className={
              outOfRange
                ? "text-xs font-medium text-amber-600"
                : "text-xs text-muted-foreground"
            }
          >
            {count} {count === 1 ? "item" : "itens"}
          </span>
        )}
      </div>
      <Textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="resize-y"
      />
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export function ProductDescriptionFields({
  value,
  onChange,
  description,
  onDescriptionChange,
}: Props) {
  const set = <K extends keyof DescriptionSectionsForm>(
    key: K,
    fieldValue: DescriptionSectionsForm[K]
  ) => onChange({ ...value, [key]: fieldValue });

  const setSpec = (label: string, specValue: string) =>
    set("specs", { ...value.specs, [label]: specValue });

  const updateFaq = (index: number, patch: Partial<ProductFaq>) =>
    set("faq", value.faq.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        As seções são opcionais e só aparecem na página do produto quando preenchidas
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          rows={4}
          placeholder={"Ganhe produtividade e economia no seu e-commerce com etiquetas térmicas confiáveis, duráveis e com excelente custo-benefício.\n\nEste kit contém 10 rolos, totalizando 1.650 etiquetas, sendo ideal para lojas virtuais, marketplaces e transportadoras."}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="resize-y"
        />
        <p className="text-xs text-muted-foreground">
          Apresentação breve: principal benefício, para quem é indicado e o diferencial.
        </p>
      </div>

      <ListField
        id="benefits"
        label="Principais benefícios"
        hint="Itens curtos e objetivos — recomendado de 3 a 6."
        placeholder={"Prontas para uso\nNão necessitam de ribbon\nAlta aderência\nImpressão nítida"}
        value={value.benefits}
        recommended={{ min: 3, max: 6 }}
        onChange={(v) => set("benefits", v)}
      />

      <div className="space-y-1.5">
        <Label>Especificações</Label>
        <div className="rounded-xl border border-border divide-y divide-border">
          {SPEC_FIELDS.map((field) => (
            <div
              key={field.label}
              className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 px-3 py-2"
            >
              <Label
                htmlFor={`spec-${field.label}`}
                className="text-xs text-muted-foreground font-normal sm:w-44 sm:shrink-0"
              >
                {field.label}
              </Label>
              <Input
                id={`spec-${field.label}`}
                placeholder={field.placeholder}
                value={value.specs[field.label] ?? ""}
                onChange={(e) => setSpec(field.label, e.target.value)}
                className="h-8 border-0 shadow-none px-0 focus-visible:ring-0"
              />
            </div>
          ))}
        </div>
      </div>

      <ListField
        id="specsExtra"
        label="Outras especificações"
        hint={'Uma por linha, no formato "Rótulo: valor"'}
        placeholder={"Quantidade total: 1.650 etiquetas\nGramatura: 75 g/m²"}
        rows={3}
        value={value.specsExtra}
        onChange={(v) => set("specsExtra", v)}
      />

      <ListField
        id="package_contents"
        label="Conteúdo da embalagem"
        hint="O que o cliente efetivamente recebe."
        placeholder={"10 rolos de etiquetas térmicas\n165 etiquetas por rolo\nTotal de 1.650 etiquetas"}
        rows={3}
        value={value.package_contents}
        onChange={(v) => set("package_contents", v)}
      />

      <ListField
        id="compatibility"
        label="Compatibilidade"
        hint="Impressoras, softwares, sistemas ou plataformas."
        placeholder={"Zebra\nElgin\nArgox\nOutras impressoras compatíveis com o formato"}
        rows={3}
        value={value.compatibility}
        onChange={(v) => set("compatibility", v)}
      />

      <ListField
        id="usage"
        label="Indicação de uso"
        hint="Onde e para quem o produto é indicado."
        placeholder={"E-commerce\nMarketplaces\nTransportadoras\nCentros de distribuição"}
        rows={3}
        value={value.usage}
        onChange={(v) => set("usage", v)}
      />

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <Label>Dúvidas frequentes</Label>
          {value.faq.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {value.faq.length} {value.faq.length === 1 ? "pergunta" : "perguntas"}
            </span>
          )}
        </div>

        {value.faq.length === 0 ? (
          <button
            type="button"
            onClick={() => set("faq", [{ question: "", answer: "" }])}
            className="w-full flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-border py-6 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
          >
            <MessageCircleQuestion className="h-5 w-5" />
            <span className="text-sm font-medium">Adicionar uma dúvida frequente</span>
            <span className="text-xs">Opcional — a seção já aparece com a mensagem de atendimento</span>
          </button>
        ) : (
          <>
            <div className="space-y-3">
              {value.faq.map((item, index) => (
                <div key={index} className="rounded-xl border border-border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground tabular-nums shrink-0 w-5">
                      {index + 1}.
                    </span>
                    <Input
                      placeholder="Pergunta"
                      value={item.question}
                      onChange={(e) => updateFaq(index, { question: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remover dúvida ${index + 1}`}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => set("faq", value.faq.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    rows={2}
                    placeholder="Resposta"
                    value={item.answer}
                    onChange={(e) => updateFaq(index, { answer: e.target.value })}
                    className="resize-y"
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => set("faq", [...value.faq, { question: "", answer: "" }])}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar dúvida
              </Button>
              <p className="text-xs text-muted-foreground text-right">
                Perguntas sem resposta são descartadas ao salvar.
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
