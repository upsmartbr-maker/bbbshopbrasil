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
 * Busca os produtos diretamente da tabela 'products' no Supabase ordenados por `created_at desc`.
 * Sem lista estática/mockada: quando não houver produtos cadastrados, retorna [].
 */
export async function getFeaturedProducts(
  limit = 8
): Promise<ProductWithImages[]> {
  if (isSupabaseConfigured()) {
    const client = getServerSupabaseClient() ?? supabase;
    if (client) {
      try {
        let { data, error } = await client
          .from("products")
          .select("*, product_images(*)")
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error && error.code !== "PGRST205" && error.code !== "42P01") {
          const simple = await client
            .from("products")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(limit);
          data = simple.data as ProductWithImages[] | null;
          error = simple.error;
        }

        if (!error && Array.isArray(data)) {
          if (data.length === 0) {
            return [];
          }
          const allFromAdminStore = await adminListProducts();
          const backupById = new Map(
            allFromAdminStore.map((p) => [p.id, p.product_images])
          );
          const backupBySlug = new Map(
            allFromAdminStore.map((p) => [p.slug, p.product_images])
          );

          return data.map((row) => {
            const prod = normalizeProductRecord(row as ProductWithImages);
            if (prod.product_images.length === 0) {
              const recovered =
                backupById.get(prod.id) ?? backupBySlug.get(prod.slug);
              if (recovered && recovered.length > 0) {
                prod.product_images = recovered;
                prod.image_url = prod.image_url || recovered[0]?.image_url || null;
              }
            }
            return prod;
          });
        }
      } catch {
        // Continua para adminListProducts caso a tabela SQL não exista no schema cache
      }
    }
  }

  const allFromAdminStore = await adminListProducts();
  return allFromAdminStore
    .filter((p) => !String(p.id).startsWith("demo-"))
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, limit);
}

export async function getAllProducts(): Promise<ProductWithImages[]> {
  const all = await adminListProducts();
  return all
    .filter((p) => !String(p.id).startsWith("demo-"))
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
}

export async function getProductBySlug(
  slugOrId: string
): Promise<ProductWithImages | null> {
  const clean = decodeURIComponent(slugOrId).trim().toLowerCase();
  if (!clean) return null;

  if (isSupabaseConfigured()) {
    const client = getServerSupabaseClient() ?? supabase;
    if (client) {
      try {
        const { data, error } = await client
          .from("products")
          .select("*")
          .eq("slug", clean)
          .maybeSingle();

        if (!error && data) {
          const allFromStore = await adminListProducts();
          const matchInStore = allFromStore.find(
            (p) => p.id === String(data.id) || p.slug.toLowerCase() === clean
          );
          const normalized = normalizeProductRecord(data as ProductWithImages);
          if (matchInStore) {
            if (normalized.product_images.length === 0 && matchInStore.product_images.length > 0) {
              normalized.product_images = matchInStore.product_images;
              normalized.image_url =
                normalized.image_url ||
                matchInStore.product_images[0]?.image_url ||
                null;
            }
            if (
              (!normalized.variants || normalized.variants.length === 0) &&
              matchInStore.variants &&
              matchInStore.variants.length > 0
            ) {
              normalized.variants = matchInStore.variants;
            }
          }
          return normalized;
        }
      } catch {
        // Fallback para busca na lista completa
      }
    }
  }

  const all = await getAllProducts();
  return (
    all.find(
      (p) =>
        p.slug.toLowerCase() === clean || String(p.id).toLowerCase() === clean
    ) ?? null
  );
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
