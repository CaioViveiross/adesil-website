import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "./providers";
import "@/index.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://adesilprint.com.br";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#001489",
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Adesil Print — Etiquetas e Adesivos Personalizados",
    template: "%s | Adesil Print",
  },
  description:
    "Etiquetas adesivas personalizadas para comércio, indústria, logística e saúde. Qualidade premium, entrega para todo o Brasil.",
  keywords: [
    "etiquetas adesivas",
    "adesivos personalizados",
    "etiquetas personalizadas",
    "etiquetas para produtos",
    "etiquetas industriais",
    "etiquetas comerciais",
    "etiquetas logística",
    "etiquetas hospitalar",
    "impressão de etiquetas",
    "adesil",
    "adesilprint",
  ],
  authors: [{ name: "Adesil Print", url: APP_URL }],
  creator: "Adesil Print",
  publisher: "Adesil Print",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: APP_URL,
    siteName: "Adesil Print",
    title: "Adesil Print — Etiquetas e Adesivos Personalizados",
    description:
      "Etiquetas adesivas personalizadas para comércio, indústria, logística e saúde. Qualidade premium, entrega para todo o Brasil.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Adesil Print — Etiquetas e Adesivos Personalizados",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Adesil Print — Etiquetas e Adesivos Personalizados",
    description:
      "Etiquetas adesivas personalizadas para comércio, indústria, logística e saúde.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: APP_URL,
  },
  category: "e-commerce",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Adesil Print",
  url: APP_URL,
  logo: `${APP_URL}/images/adesil_logo.svg`,
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: "Portuguese",
  },
  sameAs: [],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Adesil Print",
  url: APP_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${APP_URL}/categoria/todos?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={plusJakartaSans.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://lrcwmdajasunxgkyxhhf.supabase.co" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
