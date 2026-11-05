import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const DEFAULT_SUPABASE_ORIGIN = "https://xfaxxdmjxwfyfxylzepf.supabase.co";

function getSupabaseOrigin(): string {
  const raw = (process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_ORIGIN)
    .trim()
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/+$/, "");
  return raw || DEFAULT_SUPABASE_ORIGIN;
}

/**
 * Normaliza e garante que qualquer caminho ou URL de imagem do Supabase Storage
 * seja uma URL pública completa e válida.
 */
export function resolveStorageImageUrl(
  rawUrl: string | null | undefined,
  bucket: "products" | "banners" = "products"
): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Data URLs, blobs ou caminhos locais em /public
  if (
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }

  // URL completa (corrige eventual /rest/v1/ duplicado antes de /storage/v1/)
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed.replace(/\/rest\/v1\/storage\/v1\//i, "/storage/v1/");
  }

  // Caminho relativo salvo no banco (ex: "17308200-foto.jpg" ou "products/17308200-foto.jpg")
  const cleanPath = trimmed
    .replace(/^\/+/, "")
    .replace(new RegExp(`^${bucket}\\/`, "i"), "");
  return `${getSupabaseOrigin()}/storage/v1/object/public/${bucket}/${cleanPath}`;
}

/**
 * SVG Fallback elegante no padrão visual da BBB Shop Brasil caso o produto não tenha foto ou a URL falhe.
 */
export const FALLBACK_PRODUCT_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#F1EBE0"/>
          <stop offset="100%" stop-color="#E5D9C5"/>
        </linearGradient>
      </defs>
      <rect width="600" height="600" fill="url(#bg)"/>
      <circle cx="300" cy="270" r="95" fill="none" stroke="#C28E46" stroke-width="4" opacity="0.55"/>
      <path d="M235 275 C235 315, 365 315, 365 275 L380 255 L220 255 Z" fill="#C28E46" opacity="0.75"/>
      <rect x="265" y="238" width="70" height="8" rx="4" fill="#8A5A1E"/>
      <text x="300" y="420" text-anchor="middle" font-family="Georgia, serif" font-size="24" fill="#1F1A16" opacity="0.8">BBB Shop Brasil</text>
      <text x="300" y="450" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" letter-spacing="3" fill="#8A5A1E">LINHA GOURMET</text>
    </svg>`
  );
