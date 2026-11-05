export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Hero } from "@/components/home/hero";
import { BannerCarousel } from "@/components/home/banner-carousel";
import { ProductShowcase } from "@/components/home/product-showcase";
import { AboutBrand } from "@/components/home/about-brand";
import { TrustBadges } from "@/components/home/trust-badges";
import { Testimonials } from "@/components/home/testimonials";
import { getBanners, getFeaturedProducts, getTestimonials } from "@/lib/data";

export default async function HomePage() {
  const [banners, products, testimonials] = await Promise.all([
    getBanners(),
    getFeaturedProducts(8),
    getTestimonials(),
  ]);

  return (
    <>
      <Hero />
      <BannerCarousel banners={banners} />
      <ProductShowcase products={products} />
      <AboutBrand />
      <TrustBadges />
      <Testimonials items={testimonials} />
    </>
  );
}
