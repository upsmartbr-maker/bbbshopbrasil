export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Hero } from "@/components/home/hero";
import { OfficialBadgeBar } from "@/components/home/OfficialBadgeBar";
import { BannerCarousel } from "@/components/home/banner-carousel";
import { ProductShowcase } from "@/components/home/product-showcase";
import { AboutBrand } from "@/components/home/about-brand";
import { ContactSection } from "@/components/home/contact-section";
import { TrustBadges } from "@/components/home/trust-badges";
import { Testimonials } from "@/components/home/testimonials";
import { normalizeProductRecord } from "@/lib/admin-store";
import { getBanners, getFeaturedProducts, getTestimonials } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import type { ProductWithImages } from "@/types/database";

export default async function HomePage() {
  const { data: rawProducts, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  let products: ProductWithImages[] = [];

  if (!error && Array.isArray(rawProducts)) {
    if (rawProducts.length === 0) {
      products = [];
    } else {
      const enriched = await getFeaturedProducts(
        Math.max(12, rawProducts.length)
      );
      products =
        enriched.length > 0
          ? enriched
          : rawProducts.map((item) =>
              normalizeProductRecord(item as ProductWithImages)
            );
    }
  } else {
    products = await getFeaturedProducts(12);
  }

  const [banners, testimonials] = await Promise.all([
    getBanners(),
    getTestimonials(),
  ]);

  return (
    <>
      <Hero />
      <OfficialBadgeBar />
      <BannerCarousel banners={banners} />
      <ProductShowcase products={products} />
      <AboutBrand />
      <TrustBadges />
      <Testimonials items={testimonials} />
      <ContactSection />
    </>
  );
}
