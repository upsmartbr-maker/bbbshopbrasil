import "server-only";
import fs from "node:fs";
import path from "node:path";

/**
 * Retorna "/arquivo" se existir em /public, senão null.
 * Permite que fotos (chef, hero) apareçam automaticamente ao serem adicionadas.
 */
export function publicAsset(file: string): string | null {
  try {
    return fs.existsSync(path.join(process.cwd(), "public", file)) ? `/${file}` : null;
  } catch {
    return null;
  }
}

