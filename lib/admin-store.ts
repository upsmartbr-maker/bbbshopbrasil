import { randomUUID } from "crypto";
import { FALLBACK_BANNERS, FALLBACK_PRODUCTS } from "@/lib/fallback";
import { getServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { resolveStorageImageUrl, slugify } from "@/lib/utils";
import type {
  Banner,
  GatewayName,
  Order,
  OrderStatus,
  ProductImage,
  ProductWithImages,
  Settings,
} from "@/types/database";

interface LocalMemoryStore {
  settings: Settings;
  products: ProductWithImages[];
  banners: Banner[];
  orders: Order[];
}

const STORAGE_STATE_BUCKET = "products";
const STORAGE_STATE_PATH = "_store/catalog-v1.json";

const globalForAdmin = globalThis as unknown as {
  __bbbAdminStore?: LocalMemoryStore;
  __bbbStorageHydrated?: boolean;
};

function createInitialStore(): LocalMemoryStore {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

  return {
    settings: {
      id: 1,
      active_gateway:
        process.env.ACTIVE_PAYMENT_GATEWAY === "pagseguro"
          ? "pagseguro"
          : "mercadopago",
      mp_access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN ?? null,
      mp_public_key: process.env.MERCADO_PAGO_PUBLIC_KEY ?? null,
      pagseguro_token: process.env.PAGSEGURO_TOKEN ?? null,
      pagseguro_email: process.env.PAGSEGURO_EMAIL ?? null,
      pagseguro_app_id: process.env.PAGSEGURO_APP_ID ?? null,
      pagseguro_app_key: process.env.PAGSEGURO_APP_KEY ?? null,
    },
    products: FALLBACK_PRODUCTS.map((p) => ({
      ...p,
      product_images: [...p.product_images],
    })),
    banners: FALLBACK_BANNERS.map((b) => ({ ...b })),
    orders: [
      {
        id: "a1f0c820-9012-4e11-8d2a-100000000001",
        customer_name: "Ana Carolina Mendes",
        customer_email: "ana.mendes@exemplo.com.br",
        customer_phone: "(11) 99123-4567",
        items: [
          {
            product_id: "demo-1",
            name: "Conjunto de Panelas Antiaderente 10 Peças",
            quantity: 1,
            unit_price: 1890,
          },
        ],
        total: 1890,
        gateway: "mercadopago",
        status: "paid",
        created_at: now.toISOString(),
      },
      {
        id: "b2e1d931-8123-4f22-9e3b-100000000002",
        customer_name: "Roberto Almeida",
        customer_email: "roberto.almeida@exemplo.com.br",
        customer_phone: "(21) 98765-4321",
        items: [
          {
            product_id: "demo-2",
            name: "Frigideira Gourmet 28 cm",
            quantity: 2,
            unit_price: 389.9,
          },
        ],
        total: 779.8,
        gateway: "pagseguro",
        status: "shipped",
        created_at: yesterday,
      },
      {
        id: "c3d2e042-7234-4a33-af4c-100000000003",
        customer_name: "Fernanda Costa",
        customer_email: "fernanda.costa@exemplo.com.br",
        customer_phone: "(31) 99876-1234",
        items: [
          {
            product_id: "demo-3",
            name: "Caçarola com Tampa de Vidro 24 cm",
            quantity: 1,
            unit_price: 549,
          },
        ],
        total: 549,
        gateway: "mercadopago",
        status: "pending",
        created_at: twoDaysAgo,
      },
    ],
  };
}

export function getLocalStore(): LocalMemoryStore {
  if (!globalForAdmin.__bbbAdminStore) {
    globalForAdmin.__bbbAdminStore = createInitialStore();
  }
  return globalForAdmin.__bbbAdminStore;
}

/**
 * Sincroniza o estado com um arquivo JSON no Supabase Storage ('products/_store/catalog-v1.json')
 * para garantir persistência em nuvem na Vercel mesmo quando as tabelas SQL ainda não foram criadas.
 */
async function readCloudFallbackStore(): Promise<LocalMemoryStore> {
  const local = getLocalStore();
  if (!isSupabaseConfigured()) return local;

  const client = getServerSupabaseClient();
  if (!client) return local;

  try {
    const { data, error } = await client.storage
      .from(STORAGE_STATE_BUCKET)
      .download(STORAGE_STATE_PATH);

    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text) as Partial<LocalMemoryStore>;
      if (parsed && typeof parsed === "object") {
        if (Array.isArray(parsed.products) && parsed.products.length > 0) {
          local.products = parsed.products.map(normalizeProductRecord);
        }
        if (Array.isArray(parsed.banners) && parsed.banners.length > 0) {
          local.banners = parsed.banners.map(normalizeBannerRecord);
        }
        if (Array.isArray(parsed.orders) && parsed.orders.length > 0) {
          local.orders = parsed.orders;
        }
        if (parsed.settings) {
          local.settings = { ...local.settings, ...parsed.settings, id: 1 };
        }
        globalForAdmin.__bbbStorageHydrated = true;
      }
    }
  } catch {
    /* mantém store em memória */
  }

  return local;
}

async function writeCloudFallbackStore(store: LocalMemoryStore): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const client = getServerSupabaseClient();
  if (!client) return;

  try {
    const payload = Buffer.from(JSON.stringify(store), "utf-8");
    await client.storage
      .from(STORAGE_STATE_BUCKET)
      .upload(STORAGE_STATE_PATH, payload, {
        contentType: "application/json",
        cacheControl: "0",
        upsert: true,
      });
  } catch {
    /* ignore */
  }
}

function normalizeProductRecord(raw: ProductWithImages): ProductWithImages {
  const rawImages = Array.isArray(raw.product_images) ? raw.product_images : [];
  const normalizedImages: ProductImage[] = rawImages
    .map((img, idx) => {
      const resolvedUrl = resolveStorageImageUrl(img.image_url, "products");
      return {
        id: img.id || `img-${raw.id}-${idx}`,
        product_id: img.product_id || raw.id,
        image_url: resolvedUrl || img.image_url || "",
        order_index: typeof img.order_index === "number" ? img.order_index : idx,
      };
    })
    .filter((img) => Boolean(img.image_url))
    .sort((a, b) => a.order_index - b.order_index);

  return {
    ...raw,
    price: Number(raw.price ?? 0),
    compare_at_price:
      raw.compare_at_price !== null && raw.compare_at_price !== undefined
        ? Number(raw.compare_at_price)
        : null,
    is_featured: raw.is_featured === undefined || raw.is_featured === null ? true : Boolean(raw.is_featured),
    stock: typeof raw.stock === "number" ? raw.stock : Number(raw.stock ?? 10),
    product_images: normalizedImages,
  };
}

function normalizeBannerRecord(raw: Banner): Banner {
  return {
    ...raw,
    image_url: resolveStorageImageUrl(raw.image_url, "banners") || raw.image_url || "",
    is_active: raw.is_active === undefined || raw.is_active === null ? true : Boolean(raw.is_active),
    order_index: Number(raw.order_index ?? 1),
  };
}

// ============================================================================
// SETTINGS
// ============================================================================

export async function adminGetSettings(): Promise<Settings> {
  const store = await readCloudFallbackStore();
  const local = store.settings;
  if (!isSupabaseConfigured()) return local;

  const client = getServerSupabaseClient();
  if (!client) return local;

  try {
    const { data, error } = await client
      .from("settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return local;
    const row = data as Partial<Settings>;
    return {
      id: 1,
      active_gateway:
        row.active_gateway === "pagseguro" ? "pagseguro" : "mercadopago",
      mp_access_token: row.mp_access_token ?? local.mp_access_token,
      mp_public_key: row.mp_public_key ?? local.mp_public_key,
      pagseguro_token: row.pagseguro_token ?? local.pagseguro_token,
      pagseguro_email: row.pagseguro_email ?? local.pagseguro_email,
      pagseguro_app_id: row.pagseguro_app_id ?? local.pagseguro_app_id,
      pagseguro_app_key: row.pagseguro_app_key ?? local.pagseguro_app_key,
    };
  } catch {
    return local;
  }
}

export async function adminUpdateSettings(
  patch: Partial<Omit<Settings, "id">>
): Promise<Settings> {
  const store = await readCloudFallbackStore();
  const next: Settings = {
    ...store.settings,
    ...patch,
    id: 1,
    active_gateway:
      patch.active_gateway === "pagseguro"
        ? "pagseguro"
        : patch.active_gateway === "mercadopago"
          ? "mercadopago"
          : store.settings.active_gateway,
  };
  store.settings = next;
  await writeCloudFallbackStore(store);

  if (isSupabaseConfigured()) {
    const client = getServerSupabaseClient();
    if (client) {
      try {
        const { error } = await client.from("settings").upsert(
          {
            id: 1,
            active_gateway: next.active_gateway,
            mp_access_token: next.mp_access_token,
            mp_public_key: next.mp_public_key,
            pagseguro_token: next.pagseguro_token,
            pagseguro_email: next.pagseguro_email,
            pagseguro_app_id: next.pagseguro_app_id,
            pagseguro_app_key: next.pagseguro_app_key,
          },
          { onConflict: "id" }
        );

        if (error) {
          await client.from("settings").upsert(
            {
              id: 1,
              active_gateway: next.active_gateway,
              mp_access_token: next.mp_access_token,
              mp_public_key: next.mp_public_key,
              pagseguro_token: next.pagseguro_token,
              pagseguro_email: next.pagseguro_email,
            },
            { onConflict: "id" }
          );
        }
      } catch {
        // Mantém salvo no cloud fallback store
      }
    }
  }

  return next;
}

// ============================================================================
// ORDERS
// ============================================================================

export async function adminListOrders(): Promise<Order[]> {
  const store = await readCloudFallbackStore();
  if (!isSupabaseConfigured()) return store.orders;

  const client = getServerSupabaseClient();
  if (!client) return store.orders;

  try {
    const { data, error } = await client
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !data || data.length === 0) return store.orders;
    return data as Order[];
  } catch {
    return store.orders;
  }
}

export async function adminUpdateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<Order | null> {
  const store = await readCloudFallbackStore();
  const idx = store.orders.findIndex((o) => o.id === orderId);
  if (idx >= 0) {
    store.orders[idx] = { ...store.orders[idx], status };
    await writeCloudFallbackStore(store);
  }

  if (isSupabaseConfigured()) {
    const client = getServerSupabaseClient();
    if (client) {
      try {
        const { data } = await client
          .from("orders")
          .update({ status })
          .eq("id", orderId)
          .select("*")
          .maybeSingle();
        if (data) return data as Order;
      } catch {
        /* fallback */
      }
    }
  }

  return idx >= 0 ? store.orders[idx] : null;
}

export function adminRecordLocalOrder(order: Order): void {
  const store = getLocalStore();
  store.orders = [order, ...store.orders.filter((o) => o.id !== order.id)];
  void writeCloudFallbackStore(store);
}

// ============================================================================
// PRODUCTS & PRODUCT_IMAGES
// ============================================================================

export async function adminListProducts(): Promise<ProductWithImages[]> {
  const store = await readCloudFallbackStore();
  if (!isSupabaseConfigured()) {
    return store.products.map(normalizeProductRecord);
  }

  const client = getServerSupabaseClient();
  if (!client) {
    return store.products.map(normalizeProductRecord);
  }

  try {
    const { data, error } = await client
      .from("products")
      .select(
        "id, name, slug, description, price, compare_at_price, is_featured, stock, created_at, product_images (id, product_id, image_url, order_index)"
      )
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return store.products.map(normalizeProductRecord);
    }

    return (data as ProductWithImages[]).map(normalizeProductRecord);
  } catch {
    return store.products.map(normalizeProductRecord);
  }
}

export interface UpsertProductInput {
  id?: string;
  name: string;
  slug?: string;
  description?: string | null;
  price: number;
  compare_at_price?: number | null;
  is_featured?: boolean;
  stock: number;
  images?: Array<{ id?: string; image_url: string; order_index: number }>;
}

export async function adminSaveProduct(
  input: UpsertProductInput
): Promise<ProductWithImages> {
  const store = await readCloudFallbackStore();
  const cleanName = input.name.trim();
  const cleanSlug =
    slugify(input.slug?.trim() || cleanName) || `produto-${Date.now()}`;
  const cleanImages = (input.images ?? [])
    .slice(0, 8)
    .map((img, index) => {
      const fullUrl =
        resolveStorageImageUrl(img.image_url, "products") || img.image_url;
      return {
        id: img.id || randomUUID(),
        product_id: input.id || "",
        image_url: fullUrl,
        order_index: index,
      };
    })
    .filter((img) => Boolean(img.image_url));

  const isFeaturedFlag =
    input.is_featured === undefined || input.is_featured === null
      ? true
      : Boolean(input.is_featured);

  if (isSupabaseConfigured()) {
    const client = getServerSupabaseClient();
    if (client) {
      try {
        let productId = input.id;
        if (productId && !productId.startsWith("demo-")) {
          const { error } = await client
            .from("products")
            .update({
              name: cleanName,
              slug: cleanSlug,
              description: input.description ?? null,
              price: Number(input.price),
              compare_at_price:
                input.compare_at_price && input.compare_at_price > 0
                  ? Number(input.compare_at_price)
                  : null,
              is_featured: isFeaturedFlag,
              stock: Math.max(0, Math.floor(Number(input.stock))),
            })
            .eq("id", productId);
          if (error) throw error;
        } else {
          const { data: inserted, error } = await client
            .from("products")
            .insert({
              name: cleanName,
              slug: cleanSlug,
              description: input.description ?? null,
              price: Number(input.price),
              compare_at_price:
                input.compare_at_price && input.compare_at_price > 0
                  ? Number(input.compare_at_price)
                  : null,
              is_featured: isFeaturedFlag,
              stock: Math.max(0, Math.floor(Number(input.stock))),
            })
            .select("id")
            .single();
          if (error) throw error;
          productId = String(inserted.id);
        }

        if (productId) {
          await client
            .from("product_images")
            .delete()
            .eq("product_id", productId);
          if (cleanImages.length > 0) {
            await client.from("product_images").insert(
              cleanImages.map((img, idx) => ({
                product_id: productId,
                image_url: img.image_url,
                order_index: idx,
              }))
            );
          }

          const { data: fullProduct } = await client
            .from("products")
            .select(
              "id, name, slug, description, price, compare_at_price, is_featured, stock, created_at, product_images (id, product_id, image_url, order_index)"
            )
            .eq("id", productId)
            .single();

          if (fullProduct) {
            return normalizeProductRecord(fullProduct as ProductWithImages);
          }
        }
      } catch (err) {
        console.warn(
          "[adminSaveProduct] Tabela SQL indisponível, persistindo no Supabase Storage JSON store:",
          err instanceof Error ? err.message : err
        );
      }
    }
  }

  // Persistência garantida (memória + Supabase Storage JSON)
  const existingIdx = input.id
    ? store.products.findIndex((p) => p.id === input.id)
    : -1;
  const id = existingIdx >= 0 ? store.products[existingIdx].id : randomUUID();
  const productImages: ProductImage[] = cleanImages.map((img, idx) => ({
    id: img.id || randomUUID(),
    product_id: id,
    image_url: img.image_url,
    order_index: idx,
  }));

  const saved: ProductWithImages = normalizeProductRecord({
    id,
    name: cleanName,
    slug: cleanSlug,
    description: input.description ?? null,
    price: Number(input.price),
    compare_at_price:
      input.compare_at_price && input.compare_at_price > 0
        ? Number(input.compare_at_price)
        : null,
    is_featured: isFeaturedFlag,
    stock: Math.max(0, Math.floor(Number(input.stock))),
    created_at:
      existingIdx >= 0
        ? store.products[existingIdx].created_at
        : new Date().toISOString(),
    product_images: productImages,
  });

  if (existingIdx >= 0) {
    store.products[existingIdx] = saved;
  } else {
    store.products = [saved, ...store.products];
  }

  await writeCloudFallbackStore(store);
  return saved;
}

export async function adminDeleteProduct(id: string): Promise<boolean> {
  const store = await readCloudFallbackStore();
  store.products = store.products.filter((p) => p.id !== id);
  await writeCloudFallbackStore(store);

  if (isSupabaseConfigured() && !id.startsWith("demo-")) {
    const client = getServerSupabaseClient();
    if (client) {
      try {
        await client.from("products").delete().eq("id", id);
      } catch {
        /* ignore */
      }
    }
  }

  return true;
}

// ============================================================================
// BANNERS
// ============================================================================

export async function adminListBanners(): Promise<Banner[]> {
  const store = await readCloudFallbackStore();
  if (!isSupabaseConfigured()) {
    return [...store.banners]
      .map(normalizeBannerRecord)
      .sort((a, b) => a.order_index - b.order_index);
  }

  const client = getServerSupabaseClient();
  if (!client) return store.banners.map(normalizeBannerRecord);

  try {
    const { data, error } = await client
      .from("banners")
      .select("*")
      .order("order_index", { ascending: true });

    if (error || !data || data.length === 0) {
      return [...store.banners]
        .map(normalizeBannerRecord)
        .sort((a, b) => a.order_index - b.order_index);
    }
    return (data as Banner[]).map(normalizeBannerRecord);
  } catch {
    return store.banners.map(normalizeBannerRecord);
  }
}

export interface UpsertBannerInput {
  id?: string;
  title: string;
  subtitle?: string | null;
  image_url: string;
  button_text?: string | null;
  link?: string | null;
  order_index?: number;
  is_active?: boolean;
}

export async function adminSaveBanner(input: UpsertBannerInput): Promise<Banner> {
  const store = await readCloudFallbackStore();
  const fullImg =
    resolveStorageImageUrl(input.image_url, "banners") || input.image_url.trim();
  const payload = {
    title: input.title.trim(),
    subtitle: input.subtitle?.trim() || null,
    image_url: fullImg,
    button_text: input.button_text?.trim() || null,
    link: input.link?.trim() || "/produtos",
    order_index: Number(input.order_index ?? store.banners.length + 1),
    is_active: input.is_active ?? true,
  };

  if (isSupabaseConfigured()) {
    const client = getServerSupabaseClient();
    if (client) {
      try {
        if (input.id && !input.id.startsWith("demo-")) {
          const { data, error } = await client
            .from("banners")
            .update(payload)
            .eq("id", input.id)
            .select("*")
            .single();
          if (!error && data) return normalizeBannerRecord(data as Banner);
        } else {
          const { data, error } = await client
            .from("banners")
            .insert(payload)
            .select("*")
            .single();
          if (!error && data) return normalizeBannerRecord(data as Banner);
        }
      } catch {
        /* fallback */
      }
    }
  }

  const existingIdx = input.id
    ? store.banners.findIndex((b) => b.id === input.id)
    : -1;
  const saved: Banner = normalizeBannerRecord({
    id: existingIdx >= 0 ? store.banners[existingIdx].id : randomUUID(),
    ...payload,
  });

  if (existingIdx >= 0) {
    store.banners[existingIdx] = saved;
  } else {
    store.banners.push(saved);
  }

  await writeCloudFallbackStore(store);
  return saved;
}

export async function adminDeleteBanner(id: string): Promise<boolean> {
  const store = await readCloudFallbackStore();
  store.banners = store.banners.filter((b) => b.id !== id);
  await writeCloudFallbackStore(store);

  if (isSupabaseConfigured() && !id.startsWith("demo-")) {
    const client = getServerSupabaseClient();
    if (client) {
      try {
        await client.from("banners").delete().eq("id", id);
      } catch {
        /* ignore */
      }
    }
  }

  return true;
}

export async function adminReorderBanners(
  orderedIds: string[]
): Promise<Banner[]> {
  const store = await readCloudFallbackStore();
  const map = new Map(store.banners.map((b) => [b.id, b]));
  const next: Banner[] = [];

  orderedIds.forEach((id, idx) => {
    const item = map.get(id);
    if (item) {
      next.push({ ...item, order_index: idx + 1 });
      map.delete(id);
    }
  });
  map.forEach((item) => {
    next.push({ ...item, order_index: next.length + 1 });
  });
  store.banners = next;
  await writeCloudFallbackStore(store);

  if (isSupabaseConfigured()) {
    const client = getServerSupabaseClient();
    if (client) {
      try {
        await Promise.all(
          orderedIds.map((id, idx) =>
            id.startsWith("demo-")
              ? Promise.resolve()
              : client
                  .from("banners")
                  .update({ order_index: idx + 1 })
                  .eq("id", id)
          )
        );
      } catch {
        /* ignore */
      }
    }
  }

  return adminListBanners();
}

export type { GatewayName };
