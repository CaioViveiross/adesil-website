import type { Metadata } from "next";
import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import BusinessCategories from "@/components/home/BusinessCategories";
import BenefitsSection from "@/components/home/BenefitsSection";
import SobreNosSection from "@/components/home/SobreNosSection";
import ReviewsSection from "@/components/home/ReviewsSection";
import ContactCTA from "@/components/home/ContactCTA";

export const metadata: Metadata = {
  title: "Etiquetas e Adesivos Personalizados para sua Empresa",
  description:
    "Etiquetas adesivas de alta qualidade para comércio, indústria, logística e saúde. Personalize com sua marca e receba em todo o Brasil.",
  openGraph: {
    title: "Adesil Print — Etiquetas e Adesivos Personalizados",
    description:
      "Etiquetas adesivas de alta qualidade para comércio, indústria, logística e saúde.",
  },
};

export default function Home() {
  return (
    <Layout>
      <HeroSection />
      <FeaturedProducts />
      <BusinessCategories />
      <BenefitsSection />
      <SobreNosSection />
      <ReviewsSection />
      <ContactCTA />
    </Layout>
  );
}
