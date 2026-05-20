import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Package } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabaseServer";
import { salePrice } from "@/lib/utils";
import ProductActions from "./_components/ProductActions";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://adesilprint.com.br";

interface Props {
  params: Promise<{ id: string }>;
}

async function getProduct(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, categories(id, name, slug)")
    .eq("id", id)
    .eq("is_active", true)
    .single();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return { title: "Produto não encontrado" };
  }

  const price = salePrice(product);
  const description =
    product.description ||
    `Compre ${product.name} na Adesil Print. Etiqueta adesiva de alta qualidade com entrega para todo o Brasil.`;

  return {
    title: product.name,
    description,
    keywords: [
      product.name,
      "etiqueta adesiva",
      "adesivo personalizado",
      ...(product.tags ?? []),
    ],
    openGraph: {
      title: `${product.name} | Adesil Print`,
      description,
      url: `${APP_URL}/produto/${id}`,
      images: product.image
        ? [{ url: product.image, alt: product.name, width: 800, height: 800 }]
        : [],
      type: "website",
    },
    alternates: {
      canonical: `${APP_URL}/produto/${id}`,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const price = salePrice(product);
  const categorySlug = (product.categories as { slug?: string } | null)?.slug ?? product.category_id;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.name,
    image: product.image ? [product.image] : [],
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: "Adesil Print",
    },
    offers: {
      "@type": "Offer",
      url: `${APP_URL}/produto/${id}`,
      priceCurrency: "BRL",
      price: price.toFixed(2),
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Adesil Print",
      },
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    },
  };

  return (
    <Layout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <div className="container py-12 md:py-20">
        {/* Breadcrumb */}
        <nav aria-label="Navegação estrutural">
          <Link
            href={`/categoria/${categorySlug ?? "todos"}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
          >
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Voltar ao catálogo
          </Link>
        </nav>

        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
          {/* Imagem otimizada */}
          <div className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border relative">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* Detalhes */}
          <div className="space-y-6 pt-1">
            {Array.isArray(product.tags) && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-block bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">
                {product.name}
              </h1>
              {product.description && (
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>

            {/* Ações interativas (client component) */}
            <ProductActions product={product} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
