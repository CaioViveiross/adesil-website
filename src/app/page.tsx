'use client';

import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import BusinessCategories from "@/components/home/BusinessCategories";
import BenefitsSection from "@/components/home/BenefitsSection";
import ReviewsSection from "@/components/home/ReviewsSection";
import ContactCTA from "@/components/home/ContactCTA";

export default function Home() {
  return (
    <Layout>
      <HeroSection />
      <FeaturedProducts />
      <BusinessCategories />
      <BenefitsSection />
      <ReviewsSection />
      <ContactCTA />
    </Layout>
  );
}
