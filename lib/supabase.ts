import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://xfaxxdmjxwfyfxylzepf.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYXh4ZG1qeHdmeWZ4eWx6ZXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4NDczNDMsImV4cCI6MjEwOTQyMzM0M30.K7Y8LOteaGSdy52o2rJMpKUlrtjxlGwRC2GMf3qEag4";

function normalizeSupabaseUrl(raw: string): string {
  return raw
    .trim()
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/+$/, "");
}

const rawEnvUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  DEFAULT_SUPABASE_URL;

const supabaseUrl = normalizeSupabaseUrl(rawEnvUrl) || DEFAULT_SUPABASE_URL;

const supabaseAnonKey = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  DEFAULT_SUPABASE_ANON_KEY
).trim();

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
      (supabaseAnonKey || process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

/**
 * Wrapper de fetch que desativa qualquer cache do Next.js Data Cache / CDN
 * em consultas do Supabase e downloads do catálogo JSON no Storage.
 */
const noStoreFetch: typeof fetch = (input, init) => {
  let targetInput = input;
  const method = (init?.method ?? "GET").toUpperCase();

  if (method === "GET" && typeof input === "string" && input.includes("_store/catalog-v1.json")) {
    const separator = input.includes("?") ? "&" : "?";
    targetInput = `${input}${separator}cb=${Date.now()}`;
  }

  return fetch(targetInput, {
    ...init,
    cache: "no-store",
  });
};

/**
 * Client público (browser e server components).
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: { persistSession: false },
    global: { fetch: noStoreFetch },
  }
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
    global: { fetch: noStoreFetch },
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
