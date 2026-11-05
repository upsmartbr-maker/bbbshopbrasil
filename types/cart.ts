export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  cep: string;
  isOpen: boolean;
}

export const FREE_SHIPPING_THRESHOLD = 499;
export const DEFAULT_SHIPPING_RATE = 34.9;

/**
 * Calcula o frete estimado com base no subtotal e opcionalmente no CEP informado.
 * Compras a partir de R$ 499,00 possuem Frete Grátis.
 */
export function calculateEstimatedShipping(subtotal: number, cep?: string): number {
  if (subtotal <= 0) return 0;
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;

  const digits = (cep ?? "").replace(/\D/g, "");
  if (digits.length === 8) {
    const firstDigit = Number(digits[0]);
    // 0-3: Sudeste (SP, RJ, ES, MG)
    if (firstDigit >= 0 && firstDigit <= 3) return 24.9;
    // 8-9: Sul (PR, SC, RS) | 7: Centro-Oeste / DF
    if (firstDigit >= 7 && firstDigit <= 9) return 32.9;
    // 4-6: Nordeste e Norte
    return 44.9;
  }

  return DEFAULT_SHIPPING_RATE;
}
