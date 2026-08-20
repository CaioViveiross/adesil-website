import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/auth";
import { getOrderById, getOrderItems } from "@/lib/supabase/orders";
import { statusLabels } from "@/types/supabase";
import { parseOrderDate } from "@/lib/utils";
import PrintToolbar from "./_components/PrintToolbar";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  // Vira o nome sugerido do arquivo ao salvar como PDF no Chrome.
  return { title: `Ordem de Producao ${id}` };
}

/** Colunas `numeric` do Postgres podem chegar como string — sempre coagir. */
function toNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value?: number | null) {
  return `R$ ${toNumber(value).toFixed(2).replace(".", ",")}`;
}

function formatDate(value?: Date | string | null) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-[9pt] uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className="text-[10pt] text-black">{value?.trim() || "—"}</dd>
    </div>
  );
}

export default async function ProductionOrderPage({ params }: Props) {
  const { id } = await params;

  // Rota fora do AdminLayout, então a checagem de admin é feita aqui.
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") notFound();

  const order = await getOrderById(id);
  if (!order) notFound();

  const items = await getOrderItems(id);

  const addressLine = [
    order.shipping_street,
    order.shipping_number,
    order.shipping_complement,
  ]
    .filter(Boolean)
    .join(", ");

  const cityLine = [order.shipping_city, order.shipping_state]
    .filter(Boolean)
    .join(" - ");

  const itemsTotal = items.reduce((sum, item) => sum + toNumber(item.total_price), 0);
  const totalUnits = items.reduce((sum, item) => sum + toNumber(item.quantity), 0);

  return (
    <div className="min-h-screen bg-neutral-100 print:bg-white">
      <PrintToolbar orderId={String(order.id)} />

      {/* Folha A4. As medidas em mm mantêm proporção entre tela e papel. */}
      <div className="mx-auto my-6 w-[210mm] min-h-[297mm] bg-white p-[14mm] text-black shadow-lg print:my-0 print:w-auto print:min-h-0 print:p-0 print:shadow-none">
        {/* Cabeçalho */}
        <header className="flex items-start justify-between gap-6 border-b-2 border-black pb-4">
          <div>
            <h1 className="text-[20pt] font-bold uppercase leading-none tracking-tight">
              Ordem de Produção
            </h1>
            <p className="mt-1 text-[10pt] text-neutral-600">Adesil Print</p>
          </div>
          <div className="text-right">
            <p className="text-[9pt] uppercase tracking-wide text-neutral-500">Pedido</p>
            <p className="text-[22pt] font-bold leading-none tabular-nums">#{order.id}</p>
            <p className="mt-1 text-[9pt] text-neutral-600">
              {statusLabels[order.status]?.label ?? order.status}
            </p>
          </div>
        </header>

        <section className="grid grid-cols-3 gap-4 border-b border-neutral-300 py-4">
          <Field label="Data do pedido" value={formatDate(parseOrderDate(order.ordered_at, order.created_at))} />
          <Field label="Emitido em" value={formatDate(new Date())} />
          <Field label="Total de volumes" value={`${totalUnits} ${totalUnits === 1 ? "unidade" : "unidades"}`} />
        </section>

        {/* Cliente e entrega */}
        <section className="grid grid-cols-2 gap-6 border-b border-neutral-300 py-4">
          <div>
            <h2 className="mb-2 text-[11pt] font-bold uppercase tracking-wide">Cliente</h2>
            <dl className="space-y-1.5">
              <Field label="Nome" value={order.customer_name} />
              <Field label="Empresa" value={order.company_name} />
              <Field label="Documento" value={order.document} />
              <Field label="E-mail" value={order.customer_email} />
            </dl>
          </div>

          <div>
            <h2 className="mb-2 text-[11pt] font-bold uppercase tracking-wide">Entrega</h2>
            <dl className="space-y-1.5">
              <Field label="Endereço" value={addressLine} />
              <Field label="Cidade / UF" value={cityLine} />
              <Field label="CEP" value={order.shipping_zipcode} />
              <Field
                label="Rastreio"
                value={
                  order.tracking_code
                    ? `${order.tracking_code}${order.tracking_carrier ? ` (${order.tracking_carrier})` : ""}`
                    : null
                }
              />
            </dl>
          </div>
        </section>

        {/* Itens — o miolo da separação */}
        <section className="py-4">
          <h2 className="mb-2 text-[11pt] font-bold uppercase tracking-wide">
            Itens para separação
          </h2>

          <table className="w-full border-collapse text-[10pt]">
            <thead>
              <tr className="border-y border-black text-left">
                <th className="w-[8mm] py-1.5 font-semibold">✓</th>
                <th className="py-1.5 font-semibold">Produto</th>
                <th className="w-[20mm] py-1.5 text-center font-semibold">Qtd</th>
                <th className="w-[25mm] py-1.5 text-right font-semibold">Unit.</th>
                <th className="w-[25mm] py-1.5 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-neutral-500">
                    Nenhum item registrado neste pedido.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  // break-inside evita que uma linha seja cortada entre páginas
                  <tr key={item.id} className="border-b border-neutral-300 break-inside-avoid">
                    <td className="py-2.5">
                      <span className="inline-block h-[4mm] w-[4mm] border border-black" />
                    </td>
                    <td className="py-2.5 pr-2">{item.product_name_snapshot}</td>
                    <td className="py-2.5 text-center text-[13pt] font-bold tabular-nums">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 text-right tabular-nums">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="py-2.5 text-right tabular-nums">
                      {formatCurrency(item.total_price)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="mt-3 flex justify-end">
            <dl className="w-[70mm] space-y-1 text-[10pt]">
              <div className="flex justify-between">
                <dt className="text-neutral-600">Subtotal</dt>
                <dd className="tabular-nums">{formatCurrency(itemsTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-600">Frete</dt>
                <dd className="tabular-nums">
                  {toNumber(order.shipping_cost) === 0 ? "Grátis" : formatCurrency(order.shipping_cost)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-black pt-1 text-[12pt] font-bold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatCurrency(order.total)}</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Observações internas: só existem no admin, nunca vão ao cliente */}
        <section className="break-inside-avoid border-t border-neutral-300 py-4">
          <h2 className="mb-2 text-[11pt] font-bold uppercase tracking-wide">
            Observações internas
          </h2>
          {order.internal_notes?.trim() ? (
            <p className="whitespace-pre-wrap text-[10pt] leading-relaxed">
              {order.internal_notes}
            </p>
          ) : (
            <div className="h-[18mm] rounded border border-dashed border-neutral-400" />
          )}
        </section>

        {/* Assinaturas do fluxo de produção */}
        <section className="break-inside-avoid grid grid-cols-3 gap-6 border-t-2 border-black pt-6">
          {["Separado por", "Conferido por", "Expedido por"].map((role) => (
            <div key={role}>
              <div className="h-[12mm] border-b border-black" />
              <p className="mt-1 text-[9pt] uppercase tracking-wide text-neutral-600">{role}</p>
              <p className="mt-2 text-[9pt] text-neutral-500">Data: ___/___/______</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
