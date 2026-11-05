import "server-only";
import { adminListBanners, adminListProducts } from "@/lib/admin-store";
import { FALLBACK_TESTIMONIALS } from "@/lib/fallback";
import { getServerSupabaseClient, isSupabaseConfigured, supabase } from "@/lib/supabase";
import { resolveStorageImageUrl } from "@/lib/utils";
import type { Banner, ProductImage, ProductWithImages, Testimonial } from "@/types/database";

/**
 * Busca os produtos para a vitrine principal da Home (ordenados por created_at desc),
 * fazendo join com a tabela `product_images` e sem quebrar ou ocultar produtos caso
 * `is_featured` esteja nulo ou falso.
 */
export async function getFeaturedProducts(
  limit = 8
): Promise<ProductWithImages[]> {
  if (isSupabaseConfigured()) {
    const client = getServerSupabaseClient() ?? supabase;
    if (client) {
      try {
        const { data, error } = await client
          .from("products")
          .select(
            "id, name, slug, description, price, compare_at_price, is_featured, stock, created_at, product_images (id, product_id, image_url, order_index)"
          )
          .order("created_at", { ascending: false })
          .limit(limit * 2);

        if (!error && Array.isArray(data) && data.length > 0) {
          const normalized: ProductWithImages[] = data.map((row) => {
            const rawImgs = Array.isArray(row.product_images)
              ? (row.product_images as ProductImage[])
              : [];
            const sortedImgs = rawImgs
              .map((img, idx) => ({
                id: img.id || `img-${row.id}-${idx}`,
                product_id: img.product_id || String(row.id),
                image_url:
                  resolveStorageImageUrl(img.image_url, "products") ||
                  img.image_url ||
                  "",
                order_index:
                  typeof img.order_index === "number" ? img.order_index : idx,
              }))
              .filter((img) => Boolean(img.image_url))
              .sort((a, b) => a.order_index - b.order_index);

            return {
              id: String(row.id),
              name: String(row.name),
              slug: String(row.slug),
              description: row.description ?? null,
              price: Number(row.price ?? 0),
              compare_at_price:
                row.compare_at_price !== null &&
                row.compare_at_price !== undefined
                  ? Number(row.compare_at_price)
                  : null,
              is_featured: Boolean(row.is_featured ?? true),
              stock: Number(row.stock ?? 0),
              created_at: String(row.created_at ?? new Date().toISOString()),
              product_images: sortedImgs,
            };
          });

          // Mantém ordenação por created_at desc sem excluir produtos cujo is_featured seja false/null
          return normalized.slice(0, limit);
        }
      } catch {
        // Fallback para adminListProducts (Supabase Storage JSON / Store local)
      }
    }
  }

  const all = await adminListProducts();
  // Prioriza produtos cadastrados pelo admin (não demo-*) e ordena por created_at desc
  const sorted = [...all].sort((a, b) => {
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
