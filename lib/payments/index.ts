import { adminGetSettings, adminUpdateOrderStatus } from "@/lib/admin-store";
import type { GatewayName, OrderStatus, Settings } from "@/types/database";
import { MercadoPagoProvider } from "@/lib/payments/mercadopago";
import { PagSeguroProvider } from "@/lib/payments/pagseguro";
import type { PaymentGateway, PaymentProvider } from "@/lib/payments/types";

export * from "@/lib/payments/types";
export { MercadoPagoProvider } from "@/lib/payments/mercadopago";
export { PagSeguroProvider } from "@/lib/payments/pagseguro";
export { buildPixBrCode, buildQrCodeSvgDataUri, computeCrc16 } from "@/lib/payments/pix-emv";

export function getActiveGatewayFromEnv(): PaymentGateway {
  return process.env.ACTIVE_PAYMENT_GATEWAY === "pagseguro"
    ? "pagseguro"
    : "mercadopago";
}

/**
 * Lê a linha única (id = 1) da tabela `settings` no Supabase (ou store local em dev).
 */
export async function getPaymentSettings(): Promise<Settings> {
  return adminGetSettings();
}

/**
 * Retorna a instância do `PaymentProvider` ativo conforme a tabela `settings` (ou override explícito).
 */
export async function getPaymentProvider(
  gatewayOverride?: GatewayName
): Promise<{ provider: PaymentProvider; settings: Settings }> {
  const settings = await getPaymentSettings();
  const targetGateway = gatewayOverride ?? settings.active_gateway;

  if (targetGateway === "pagseguro") {
    return {
      provider: new PagSeguroProvider({
        token: settings.pagseguro_token,
        email: settings.pagseguro_email,
      }),
      settings,
    };
  }

  return {
    provider: new MercadoPagoProvider({
      accessToken: settings.mp_access_token,
      publicKey: settings.mp_public_key,
    }),
    settings,
  };
}

/**
 * Atualiza o status de um pedido na tabela `orders` do Supabase.
 */
export async function updateOrderStatusInDb(
  orderId: string,
  status: OrderStatus
): Promise<{ updated: boolean; error?: string }> {
  const updatedOrder = await adminUpdateOrderStatus(orderId, status);
  return { updated: Boolean(updatedOrder) };
}
