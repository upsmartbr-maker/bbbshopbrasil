import type { GatewayName, OrderItem, OrderStatus } from "@/types/database";

export type PaymentGateway = GatewayName;
export type PaymentMethodChoice = "pix" | "credit_card";

export interface CheckoutCustomerAddress {
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export interface CheckoutCustomerData {
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  address?: CheckoutCustomerAddress;
}

export interface CheckoutCardData {
  /** Token gerado pelo SDK frontend (Mercado Pago) ou cartão criptografado (PagBank) */
  token?: string;
  holderName?: string;
  installments?: number;
  paymentMethodId?: string;
  issuerId?: string;
}

export interface CheckoutOrderData {
  orderId: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod?: PaymentMethodChoice;
  card?: CheckoutCardData;
  customer: CheckoutCustomerData;
  originUrl?: string;
}

export interface PixPaymentInfo {
  qrCodeText: string;
  qrCodeBase64: string;
  expiresAt: string;
}

export interface PaymentPreferenceResult {
  gateway: PaymentGateway;
  preferenceId: string;
  transactionId?: string;
  checkoutUrl: string;
  sandboxCheckoutUrl?: string;
  mode: "transparent" | "redirect" | "simulated";
  status: "pending" | "approved" | "rejected";
  pix?: PixPaymentInfo;
  raw?: Record<string, unknown>;
}

export interface WebhookHandleResult {
  gateway: PaymentGateway;
  orderId: string | null;
  transactionId: string | null;
  status: OrderStatus;
  rawStatus?: string;
  verified: boolean;
}

/**
 * Interface padrão de Gateway de Pagamento (Mercado Pago / PagSeguro).
 */
export interface PaymentProvider {
  readonly name: PaymentGateway;
  createPreference(orderData: CheckoutOrderData): Promise<PaymentPreferenceResult>;
  handleWebhook(payload: unknown, headers?: Headers): Promise<WebhookHandleResult>;
}

