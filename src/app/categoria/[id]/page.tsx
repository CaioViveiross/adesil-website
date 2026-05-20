import type { Metadata } from "next";
import { createClient } from "@/lib/supabaseServer";
import CategoryPageClient from "./_components/CategoryPageClient";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://adesilprint.com.br";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: slug } = await params;

  if (slug === "todos") {
    return {
      title: "Todos os Produtos",
      description:
        "Explore o catálogo completo de etiquetas adesivas da Adesil Print. Soluções para comércio, indústria, logística e saúde.",
      alternates: { canonical: `${APP_URL}/categoria/todos` },
      openGraph: {
        title: "Todos os Produtos | Adesil Print",
        description: "Explore o catálogo completo de etiquetas adesivas.",
        url: `${APP_URL}/categoria/todos`,
      },
    };
  }

  const supabase = await createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("name, description, slug")
    .eq("slug", slug)
    .single();

  if (!category) {
    return { title: "Categoria" };
  }

  const description =
    category.description ||
    `Etiquetas adesivas ${category.name} — soluções de alta qualidade da Adesil Print.`;

  return {
    title: category.name,
    description,
    alternates: { canonical: `${APP_URL}/categoria/${slug}` },
    openGraph: {
      title: `${category.name} | Adesil Print`,
      description,
      url: `${APP_URL}/categoria/${slug}`,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { id: slug } = await params;
  return <CategoryPageClient slug={slug} />;
}
