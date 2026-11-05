import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function normalizeSupabaseUrl(raw: string): string {
  return raw
    .trim()
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/+$/, "");
}

const supabaseUrl = normalizeSupabaseUrl(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
);
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
      (supabaseAnonKey || process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

/**
 * Client público (browser e server components).
 * Sujeito às policies de RLS — somente leitura de catálogo/banners.
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl || "http://localhost:54321",
  supabaseAnonKey || "public-anon-key-not-configured",
  { auth: { persistSession: false } }
);

/**
 * Client administrativo (service role). USAR APENAS NO SERVIDOR
 * (route handlers, server actions). Ignora RLS e nunca deve ir ao browser.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("getSupabaseAdmin() não pode ser usado no browser.");
  }
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "Supabase admin não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Retorna o client admin quando SUPABASE_SERVICE_ROLE_KEY estiver definido,
 * ou o client público se apenas a anon key estiver disponível, sem lançar exceção.
 */
export function getServerSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  try {
    return getSupabaseAdmin();
  } catch {
    return supabase;
  }
}
