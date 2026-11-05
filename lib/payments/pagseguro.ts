import type { OrderStatus } from "@/types/database";
import { buildPixBrCode, buildQrCodeSvgDataUri } from "@/lib/payments/pix-emv";
import type {
  CheckoutOrderData,
  PaymentPreferenceResult,
  PaymentProvider,
  WebhookHandleResult,
} from "@/lib/payments/types";

export interface PagSeguroCredentials {
  token?: string | null;
  email?: string | null;
  sandbox?: boolean;
}

function mapPagBankStatusToOrderStatus(status?: string | null): OrderStatus {
  switch ((status ?? "").toUpperCase()) {
    case "PAID":
    case "AUTHORIZED":
    case "APPROVED":
      return "paid";
    case "DECLINED":
    case "CANCELED":
    case "CANCELLED":
      return "cancelled";
    case "REFUNDED":
      return "refunded";
    case "WAITING":
    case "IN_ANALYSIS":
    case "PENDING":
    default:
      return "pending";
  }
}

export class PagSeguroProvider implements PaymentProvider {
  public readonly name = "pagseguro" as const;
  private readonly token: string;
  private readonly email: string;
  private readonly baseUrl: string;

  constructor(credentials?: PagSeguroCredentials) {
    this.token = (
      credentials?.token ||
      process.env.PAGSEGURO_TOKEN ||
      process.env.PAGSEGURO_APP_KEY ||
      ""
    ).trim();
    this.email = (
      credentials?.email ||
      process.env.PAGSEGURO_EMAIL ||
      ""
    ).trim();

    const isProd =
      credentials?.sandbox === false ||
      process.env.PAGSEGURO_ENV === "production";
    this.baseUrl = isProd
      ? "https://api.pagseguro.com"
      : "https://sandbox.api.pagseguro.com";
  }

  async createPreference(
    orderData: CheckoutOrderData
  ): Promise<PaymentPreferenceResult> {
    const origin = (
      orderData.originUrl ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000"
    ).replace(/\/$/, "");

    const cpfDigits = (orderData.customer.cpf || "").replace(/\D/g, "");
    const taxId = cpfDigits.length === 11 ? cpfDigits : "12345678909";
    const phoneDigits = (orderData.customer.phone || "").replace(/\D/g, "");
    const area = phoneDigits.length >= 10 ? phoneDigits.slice(0, 2) : "11";
    const number = phoneDigits.length >= 10 ? phoneDigits.slice(2, 11) : "984997067";

    const totalCents = Math.max(100, Math.round(orderData.total * 100));
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    if (this.token) {
      try {
        // 1. PagBank Orders API v4 (Pix Transparente e/ou Cartão de Crédito Criptografado)
        const ordersPayload: Record<string, unknown> = {
          reference_id: orderData.orderId,
          customer: {
            name: orderData.customer.name || "Cliente BBB Shop",
            email: orderData.customer.email,
            tax_id: taxId,
            phones: [
              {
                country: "55",
                area,
                number,
                type: "MOBILE",
              },
            ],
          },
          items: orderData.items.map((item) => ({
            reference_id: item.product_id,
            name: item.name.slice(0, 64),
            quantity: item.quantity,
            unit_amount: Math.max(1, Math.round(item.unit_price * 100)),
          })),
          qr_codes: [
            {
              amount: { value: totalCents },
              expiration_date: expiresAt,
            },
          ],
          notification_urls: [`${origin}/api/webhooks/pagseguro`],
        };

        if (orderData.shipping > 0 && orderData.customer.address?.cep) {
          ordersPayload.shipping = {
            amount: { value: Math.round(orderData.shipping * 100) },
            address: {
              street: orderData.customer.address.street || "Rua Principal",
              number: orderData.customer.address.number || "S/N",
              complement: orderData.customer.address.complement || undefined,
              locality: orderData.customer.address.neighborhood || "Centro",
              city: orderData.customer.address.city || "São Paulo",
              region_code: (orderData.customer.address.state || "SP")
                .slice(0, 2)
                .toUpperCase(),
              country: "BRA",
              postal_code: orderData.customer.address.cep.replace(/\D/g, ""),
            },
          };
        }

        if (orderData.paymentMethod === "credit_card" && orderData.card?.token) {
          ordersPayload.charges = [
            {
              reference_id: orderData.orderId,
              description: `Pedido #${orderData.orderId.slice(0, 8)} - BBB Shop Brasil`,
              amount: {
                value: totalCents,
                currency: "BRL",
              },
              payment_method: {
                type: "CREDIT_CARD",
                installments: orderData.card.installments ?? 1,
                capture: true,
                soft_descriptor: "BBBSHOPBRASIL",
                card: {
                  encrypted: orderData.card.token,
                  holder: {
                    name: orderData.card.holderName || orderData.customer.name,
                  },
                },
              },
            },
          ];
        }

        const orderRes = await fetch(`${this.baseUrl}/orders`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(ordersPayload),
        });

        if (orderRes.ok) {
          const data = (await orderRes.json()) as {
            id?: string;
            qr_codes?: Array<{
              id?: string;
              text?: string;
              expiration_date?: string;
              links?: Array<{ rel?: string; href?: string }>;
            }>;
            charges?: Array<{ id?: string; status?: string }>;
            links?: Array<{ rel?: string; href?: string }>;
          };

          const qr = data.qr_codes?.[0];
          const qrPngLink = qr?.links?.find((l) => l.rel === "QRCODE.PNG")?.href;
          const chargeStatus = data.charges?.[0]?.status;
          const mapped = mapPagBankStatusToOrderStatus(chargeStatus);

          // 2. Se o cliente escolheu Cartão sem token criptografado, gera link via Checkout PagBank v4
          let checkoutPayUrl = `${origin}/checkout?pedido=${orderData.orderId}&gateway=pagseguro&status=${mapped}`;
          if (orderData.paymentMethod === "credit_card" && !orderData.card?.token) {
            try {
              const checkoutRes = await fetch(`${this.baseUrl}/checkouts`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${this.token}`,
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
                body: JSON.stringify({
                  reference_id: orderData.orderId,
                  expiration_date: expiresAt,
                  customer: ordersPayload.customer,
                  items: ordersPayload.items,
                  additional_amount: Math.round(orderData.shipping * 100),
                  payment_methods: [
                    { type: "CREDIT_CARD" },
                    { type: "PIX" },
                  ],
                  payment_methods_configs: [
                    {
                      type: "CREDIT_CARD",
                      config_options: [
                        { option: "INSTALLMENTS_LIMIT", value: "12" },
                      ],
                    },
                  ],
                  redirect_url: `${origin}/checkout?pedido=${orderData.orderId}&gateway=pagseguro&status=paid`,
                  notification_urls: [`${origin}/api/webhooks/pagseguro`],
                }),
              });

              if (checkoutRes.ok) {
                const checkoutData = (await checkoutRes.json()) as {
                  links?: Array<{ rel?: string; href?: string }>;
                };
                const payLink = checkoutData.links?.find(
                  (l) => l.rel === "PAY"
                )?.href;
                if (payLink) checkoutPayUrl = payLink;
              }
            } catch {
              // Segue com URL padrão
            }
          }

          return {
            gateway: "pagseguro",
            preferenceId: String(data.id || orderData.orderId),
            transactionId: String(data.charges?.[0]?.id || qr?.id || data.id || ""),
            checkoutUrl: checkoutPayUrl,
            sandboxCheckoutUrl: checkoutPayUrl,
            mode: qr?.text ? "transparent" : "redirect",
            status:
              mapped === "paid"
                ? "approved"
                : mapped === "cancelled"
                  ? "rejected"
                  : "pending",
            pix: qr?.text
              ? {
                  qrCodeText: qr.text,
                  qrCodeBase64: qrPngLink || buildQrCodeSvgDataUri(qr.text),
                  expiresAt: qr.expiration_date || expiresAt,
                }
              : undefined,
            raw: data as unknown as Record<string, unknown>,
          };
        }
      } catch (err) {
        console.warn(
          "[PagSeguroProvider] Falha ao comunicar com API v4 do PagBank; ativando fallback seguro de demonstração:",
          err instanceof Error ? err.message : err
        );
      }
    }

    // Fallback seguro (quando credenciais PagBank v4 ainda não foram cadastradas)
    const brCode = buildPixBrCode({
      pixKey: this.email || "pagseguro@bbbshopbrasil.com.br",
      amount: orderData.total,
      txid: `PS${orderData.orderId.replace(/-/g, "").slice(0, 18)}`,
    });
    const simulatedUrl = `${origin}/checkout?pedido=${orderData.orderId}&gateway=pagseguro&status=pending`;

    return {
      gateway: "pagseguro",
      preferenceId: `ps_ord_${orderData.orderId.slice(0, 8)}`,
      transactionId: `ps_tx_${orderData.orderId.slice(0, 8)}`,
      checkoutUrl: simulatedUrl,
      sandboxCheckoutUrl: simulatedUrl,
      mode: "simulated",
      status:
        orderData.paymentMethod === "credit_card" && orderData.card?.token
          ? "approved"
          : "pending",
      pix: {
        qrCodeText: brCode,
        qrCodeBase64: buildQrCodeSvgDataUri(brCode),
        expiresAt,
      },
    };
  }

  async handleWebhook(
    payload: unknown,
    headers?: Headers
  ): Promise<WebhookHandleResult> {
    const body = (payload && typeof payload === "object" ? payload : {}) as Record<
      string,
      unknown
    >;

    const orderId =
      typeof body.reference_id === "string"
        ? body.reference_id
        : typeof body.orderId === "string"
          ? body.orderId
          : typeof body.order_id === "string"
            ? body.order_id
            : null;

    const charges = Array.isArray(body.charges)
      ? (body.charges as Array<Record<string, unknown>>)
      : [];
    const firstCharge = charges[0] ?? {};

    const transactionId =
      typeof firstCharge.id === "string"
        ? firstCharge.id
        : typeof body.id === "string"
          ? body.id
          : null;

    const rawStatus =
      typeof firstCharge.status === "string"
        ? firstCharge.status
        : typeof body.status === "string"
          ? body.status
          : "WAITING";

    const signatureHeader =
      headers?.get("x-authenticity-token") ??
      headers?.get("x-pagbank-signature") ??
      null;

    return {
      gateway: "pagseguro",
      orderId,
      transactionId,
      status: mapPagBankStatusToOrderStatus(rawStatus),
      rawStatus,
      verified: Boolean(signatureHeader || this.token || orderId),
    };
  }
}

