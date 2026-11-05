import "server-only";
import {
  adminListBanners,
  adminListProducts,
  normalizeProductRecord,
} from "@/lib/admin-store";
import { FALLBACK_TESTIMONIALS } from "@/lib/fallback";
import { getServerSupabaseClient, isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Banner, ProductWithImages, Testimonial } from "@/types/database";

/**
 * Busca os produtos para a vitrine principal da Home usando `.select('*, product_images(*)')`,
 * ordenados por `created_at desc` e mantendo a recuperação automática de imagens.
 */
export async function getFeaturedProducts(
  limit = 8
): Promise<ProductWithImages[]> {
  const allFromAdminStore = await adminListProducts();

  if (isSupabaseConfigured()) {
    const client = getServerSupabaseClient() ?? supabase;
    if (client) {
      try {
        const { data, error } = await client
          .from("products")
          .select("*, product_images(*)")
          .order("created_at", { ascending: false })
          .limit(limit * 2);

        if (!error && Array.isArray(data) && data.length > 0) {
          const backupById = new Map(
            allFromAdminStore.map((p) => [p.id, p.product_images])
          );
          const backupBySlug = new Map(
            allFromAdminStore.map((p) => [p.slug, p.product_images])
          );

          const normalized = data.map((row) => {
            const prod = normalizeProductRecord(row as ProductWithImages);
            if (prod.product_images.length === 0) {
              const recovered =
                backupById.get(prod.id) ?? backupBySlug.get(prod.slug);
              if (recovered && recovered.length > 0) {
                prod.product_images = recovered;
                prod.image_url = recovered[0]?.image_url ?? null;
              }
            }
            return prod;
          });

          return normalized.slice(0, limit);
        }
      } catch {
        // Fallback para allFromAdminStore
      }
    }
  }

  const sorted = [...allFromAdminStore].sort((a, b) => {
    const aIsCustom = !a.id.startsWith("demo-");
    const bIsCustom = !b.id.startsWith("demo-");
    if (aIsCustom !== bIsCustom) return aIsCustom ? -1 : 1;
    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });

  return sorted.slice(0, limit);
}

export async function getAllProducts(): Promise<ProductWithImages[]> {
  const all = await adminListProducts();
  return [...all].sort((a, b) => {
    const aIsCustom = !a.id.startsWith("demo-");
    const bIsCustom = !b.id.startsWith("demo-");
    if (aIsCustom !== bIsCustom) return aIsCustom ? -1 : 1;
    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });
}

export async function getBanners(): Promise<Banner[]> {
  const all = await adminListBanners();
  return all.filter((b) => b.is_active !== false);
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
