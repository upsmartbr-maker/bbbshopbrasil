import "server-only";
import { adminListBanners, adminListProducts } from "@/lib/admin-store";
import { FALLBACK_TESTIMONIALS } from "@/lib/fallback";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Banner, ProductWithImages, Testimonial } from "@/types/database";

export async function getFeaturedProducts(limit = 8): Promise<ProductWithImages[]> {
  const all = await adminListProducts();
  const featured = all.filter((p) => p.is_featured);
  return (featured.length > 0 ? featured : all).slice(0, limit);
}

export async function getAllProducts(): Promise<ProductWithImages[]> {
  return adminListProducts();
}

export async function getBanners(): Promise<Banner[]> {
  const all = await adminListBanners();
  return all.filter((b) => b.is_active);
}

export async function getTestimonials(): Promise<Testimonial[]> {
  if (!isSupabaseConfigured()) return FALLBACK_TESTIMONIALS;
  try {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .eq("is_active", true)
      .order("order_index", { ascending: true });
    if (error || !data || data.length === 0) return FALLBACK_TESTIMONIALS;
    return data as Testimonial[];
  } catch {
    return FALLBACK_TESTIMONIALS;
  }
}
