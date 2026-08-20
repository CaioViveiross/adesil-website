import { Check, MessageCircle } from "lucide-react";
import { FAQ_SUPPORT_MESSAGE } from "@/lib/productDescription";
import type { ProductDescriptionSections } from "@/types/supabase";

interface ProductDescriptionProps {
  /** Apresentação breve — o campo `description` do produto. */
  description?: string;
  sections: ProductDescriptionSections | null;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Lista com marcador de check — usada nas seções de itens objetivos. */
function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex items-start gap-2.5">
          <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" aria-hidden />
          <span className="text-sm text-muted-foreground leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ProductDescription({ description, sections }: ProductDescriptionProps) {
  // Sem nenhum conteúdo não há o que renderizar — evita um bloco vazio na página.
  if (!description && !sections) return null;

  return (
    <div className="mt-16 md:mt-24 border-t border-border pt-12 md:pt-16">
      <div className="max-w-3xl space-y-12 md:space-y-14">
        {description && (
          <Section title="Descrição">
            {/* O admin escreve em parágrafos; preserva as quebras sem exigir HTML. */}
            <div className="space-y-3">
              {description.split(/\n\s*\n|\n/).map((paragraph, index) => {
                const text = paragraph.trim();
                if (!text) return null;
                return (
                  <p key={index} className="text-sm text-muted-foreground leading-relaxed">
                    {text}
                  </p>
                );
              })}
            </div>
          </Section>
        )}

        {sections?.benefits && (
          <Section title="Principais benefícios">
            <CheckList items={sections.benefits} />
          </Section>
        )}

        {sections?.specs && (
          <Section title="Especificações">
            <dl className="rounded-2xl border border-border overflow-hidden">
              {sections.specs.map((spec, index) => (
                <div
                  key={`${spec.label}-${index}`}
                  className="flex flex-col sm:flex-row sm:items-baseline gap-x-4 gap-y-0.5 px-4 py-3 odd:bg-muted/40"
                >
                  {spec.label && (
                    <dt className="text-sm font-medium text-foreground sm:w-52 sm:shrink-0">
                      {spec.label}
                    </dt>
                  )}
                  <dd className="text-sm text-muted-foreground">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </Section>
        )}

        {sections?.package_contents && (
          <Section title="Conteúdo da embalagem">
            <CheckList items={sections.package_contents} />
          </Section>
        )}

        {sections?.compatibility && (
          <Section title="Compatibilidade">
            <CheckList items={sections.compatibility} />
          </Section>
        )}

        {sections?.usage && (
          <Section title="Indicação de uso">
            <CheckList items={sections.usage} />
          </Section>
        )}

        {/* Sempre exibida: mesmo sem perguntas cadastradas, o produto mostra
            o canal de atendimento. */}
        <Section title="Dúvidas frequentes">
          {sections?.faq && (
            <div className="space-y-5">
              {sections.faq.map((item, index) => (
                <div key={`${item.question}-${index}`} className="space-y-1.5">
                  <h3 className="text-sm font-semibold text-foreground leading-snug">
                    {item.question}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-4">
            <MessageCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" aria-hidden />
            <p className="text-sm text-muted-foreground leading-relaxed">
              {FAQ_SUPPORT_MESSAGE}
            </p>
          </div>
        </Section>

      </div>
    </div>
  );
}
