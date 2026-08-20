import type {
  ProductDescriptionSections,
  ProductFaq,
  ProductSpec,
} from "@/types/supabase";

/**
 * Conversão entre a descrição estruturada gravada no banco (jsonb) e o
 * formato de texto usado no formulário do admin — uma linha por item.
 */

/**
 * Mensagem fixa de atendimento, exibida ao fim de "Dúvidas frequentes" em
 * todo produto. É constante da loja, não conteúdo por produto — por isso não
 * fica no banco nem é editável pelo admin.
 */
/**
 * Especificações padrão da loja: o admin preenche sempre os mesmos rótulos,
 * na mesma ordem, para que a tabela fique igual em todos os produtos.
 * Qualquer especificação fora desta lista vai para o campo livre "outras".
 */
export const SPEC_FIELDS = [
  { label: "Dimensões",          placeholder: "100 × 150 mm" },
  { label: "Cor",                placeholder: "Branco" },
  { label: "Tipo",               placeholder: "Térmica" },
  { label: "Quantidade por rolo", placeholder: "165 etiquetas" },
  { label: "Tubete",             placeholder: "1 polegada" },
] as const;

const SPEC_LABELS: string[] = SPEC_FIELDS.map((field) => field.label);

/**
 * Separa as especificações salvas entre os campos fixos e as extras,
 * preservando rótulos antigos que não fazem parte do padrão atual.
 */
export function splitSpecs(specs?: ProductSpec[]): {
  fixed: Record<string, string>;
  extra: string;
} {
  const fixed: Record<string, string> = {};
  const extra: ProductSpec[] = [];

  for (const spec of specs ?? []) {
    if (SPEC_LABELS.includes(spec.label)) fixed[spec.label] = spec.value;
    else extra.push(spec);
  }

  return { fixed, extra: serializeSpecs(extra) };
}

/** Monta o array final: campos fixos preenchidos, na ordem do padrão, depois as extras. */
export function joinSpecs(fixed: Record<string, string>, extra: string): ProductSpec[] {
  const ordered = SPEC_FIELDS
    .map((field) => ({ label: field.label, value: (fixed[field.label] ?? "").trim() }))
    .filter((spec) => spec.value);

  return [...ordered, ...parseSpecs(extra)];
}

export const FAQ_SUPPORT_MESSAGE =
  "Nosso time está disponível para auxiliar com dúvidas sobre o produto e sua utilização.";

/** Uma linha por item; aceita bullets coladas de outros editores ("- ", "• ", "* "). */
export function parseLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean);
}

export function serializeLines(items?: string[]): string {
  return (items ?? []).join("\n");
}

/** Uma linha por especificação, no formato "Rótulo: valor". */
export function parseSpecs(text: string): ProductSpec[] {
  return parseLines(text)
    .map((line) => {
      const separator = line.indexOf(":");
      // Sem ":" a linha vira um valor solto — melhor exibir do que descartar
      // silenciosamente o que o admin digitou.
      if (separator === -1) return { label: "", value: line };
      return {
        label: line.slice(0, separator).trim(),
        value: line.slice(separator + 1).trim(),
      };
    })
    .filter((spec) => spec.label || spec.value);
}

export function serializeSpecs(specs?: ProductSpec[]): string {
  return (specs ?? [])
    .map((spec) => (spec.label ? `${spec.label}: ${spec.value}` : spec.value))
    .join("\n");
}

/** Descarta perguntas sem resposta (ou vice-versa) vindas de linhas em branco do editor. */
export function cleanFaq(faq: ProductFaq[]): ProductFaq[] {
  return faq
    .map((item) => ({
      question: item.question.trim(),
      answer: item.answer.trim(),
    }))
    .filter((item) => item.question && item.answer);
}

/** true quando nenhuma seção tem conteúdo — usado para gravar NULL em vez de `{}`. */
export function isEmptySections(sections: ProductDescriptionSections): boolean {
  return !Object.values(sections).some((value) =>
    Array.isArray(value) ? value.length > 0 : Boolean(value)
  );
}

/**
 * Normaliza o valor vindo do banco. O jsonb é livre e produtos antigos têm
 * `null`, então a página nunca deve confiar no formato sem checar.
 */
export function normalizeSections(raw: unknown): ProductDescriptionSections | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const source = raw as Record<string, unknown>;

  const stringList = (value: unknown): string[] | undefined => {
    if (!Array.isArray(value)) return undefined;
    const items = value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
    return items.length ? items : undefined;
  };

  const specList = (value: unknown): ProductSpec[] | undefined => {
    if (!Array.isArray(value)) return undefined;
    const items = value
      .filter((item): item is ProductSpec => !!item && typeof item === "object")
      .map((item) => ({
        label: typeof item.label === "string" ? item.label.trim() : "",
        value: typeof item.value === "string" ? item.value.trim() : "",
      }))
      .filter((item) => item.label || item.value);
    return items.length ? items : undefined;
  };

  const faqList = (value: unknown): ProductFaq[] | undefined => {
    if (!Array.isArray(value)) return undefined;
    const items = value
      .filter((item): item is ProductFaq => !!item && typeof item === "object")
      .map((item) => ({
        question: typeof item.question === "string" ? item.question.trim() : "",
        answer: typeof item.answer === "string" ? item.answer.trim() : "",
      }))
      .filter((item) => item.question && item.answer);
    return items.length ? items : undefined;
  };

  const sections: ProductDescriptionSections = {
    benefits: stringList(source.benefits),
    specs: specList(source.specs),
    package_contents: stringList(source.package_contents),
    compatibility: stringList(source.compatibility),
    usage: stringList(source.usage),
    faq: faqList(source.faq),
  };

  return isEmptySections(sections) ? null : sections;
}
