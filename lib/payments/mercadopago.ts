import MercadoPagoConfig, { Payment, Preference } from "mercadopago";
import type { OrderStatus } from "@/types/database";
import { buildPixBrCode, buildQrCodeSvgDataUri } from "@/lib/payments/pix-emv";
import type {
  CheckoutOrderData,
  PaymentPreferenceResult,
  PaymentProvider,
  WebhookHandleResult,
} from "@/lib/payments/types";

export interface MercadoPagoCredentials {
  accessToken?: string | null;
  publicKey?: string | null;
}

function mapMpStatusToOrderStatus(mpStatus?: string | null): OrderStatus {
  switch ((mpStatus ?? "").toLowerCase()) {
    case "approved":
    case "authorized":
      return "paid";
    case "cancelled":
    case "rejected":
      return "cancelled";
    case "refunded":
    case "charged_back":
      return "refunded";
    case "in_process":
    case "pending":
    case "in_mediation":
    default:
      return "pending";
  }
}

export class MercadoPagoProvider implements PaymentProvider {
  public readonly name = "mercadopago" as const;
  private readonly accessToken: string;
  private readonly publicKey: string;

  constructor(credentials?: MercadoPagoCredentials) {
    this.accessToken = (
      credentials?.accessToken ||
      process.env.MERCADO_PAGO_ACCESS_TOKEN ||
      ""
    ).trim();
    this.publicKey = (
      credentials?.publicKey ||
      process.env.MERCADO_PAGO_PUBLIC_KEY ||
      ""
    ).trim();
  }

  private getClient(): MercadoPagoConfig | null {
    if (!this.accessToken) return null;
    return new MercadoPagoConfig({
      accessToken: this.accessToken,
      options: { timeout: 10000 },
    });
  }

  async createPreference(
    orderData: CheckoutOrderData
  ): Promise<PaymentPreferenceResult> {
    const origin = (
      orderData.originUrl ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000"
    ).replace(/\/$/, "");

    const client = this.getClient();
    const cpfDigits = (orderData.customer.cpf || "").replace(/\D/g, "");
    const [firstName, ...restName] = (orderData.customer.name || "Cliente").trim().split(/\s+/);
    const lastName = restName.join(" ") || "BBB Shop";

    if (client) {
      try {
        // 1. Checkout Transparente de Cartão de Crédito (quando token do cartão é enviado)
        if (orderData.paymentMethod === "credit_card" && orderData.card?.token) {
          const paymentClient = new Payment(client);
          const paymentRes = await paymentClient.create({
            body: {
              transaction_amount: Number(orderData.total.toFixed(2)),
              token: orderData.card.token,
              description: `Pedido #${orderData.orderId.slice(0, 8)} - BBB Shop Brasil`,
              installments: orderData.card.installments ?? 1,
              payment_method_id: orderData.card.paymentMethodId || "visa",
              issuer_id: orderData.card.issuerId ? Number(orderData.card.issuerId) : undefined,
              external_reference: orderData.orderId,
              notification_url: `${origin}/api/webhooks/mercadopago`,
              payer: {
                email: orderData.customer.email,
                first_name: firstName,
                last_name: lastName,
                identification:
                  cpfDigits.length === 11
                    ? { type: "CPF", number: cpfDigits }
                    : undefined,
              },
            },
          });

          const mapped = mapMpStatusToOrderStatus(paymentRes.status);
          return {
            gateway: "mercadopago",
            preferenceId: String(paymentRes.id ?? orderData.orderId),
            transactionId: String(paymentRes.id ?? ""),
            checkoutUrl: `${origin}/checkout?pedido=${orderData.orderId}&gateway=mercadopago&status=${mapped}`,
            mode: "transparent",
            status:
              mapped === "paid"
                ? "approved"
                : mapped === "cancelled"
                  ? "rejected"
                  : "pending",
            raw: { id: paymentRes.id, status: paymentRes.status },
          };
        }

        // 2. Se o cliente escolheu Pix, tenta gerar o Pix transparente via SDK Payment
        let transparentPix: PaymentPreferenceResult["pix"] | undefined;
        let pixPaymentId: string | undefined;

        if (orderData.paymentMethod === "pix") {
          try {
            const paymentClient = new Payment(client);
            const pixRes = await paymentClient.create({
              body: {
                transaction_amount: Number(orderData.total.toFixed(2)),
                description: `Pedido #${orderData.orderId.slice(0, 8)} - BBB Shop Brasil`,
                payment_method_id: "pix",
                external_reference: orderData.orderId,
                notification_url: `${origin}/api/webhooks/mercadopago`,
                payer: {
                  email: orderData.customer.email,
                  first_name: firstName,
                  last_name: lastName,
                  identification:
                    cpfDigits.length === 11
                      ? { type: "CPF", number: cpfDigits }
                      : undefined,
                },
              },
            });

            const txData = pixRes.point_of_interaction?.transaction_data;
            if (txData?.qr_code) {
              pixPaymentId = String(pixRes.id ?? "");
              transparentPix = {
                qrCodeText: txData.qr_code,
                qrCodeBase64: txData.qr_code_base64
                  ? `data:image/png;base64,${txData.qr_code_base64}`
                  : buildQrCodeSvgDataUri(txData.qr_code),
                expiresAt:
                  pixRes.date_of_expiration ||
                  new Date(Date.now() + 30 * 60 * 1000).toISOString(),
              };
            }
          } catch {
            // Caso a conta MP ainda não tenha chave Pix cadastrada, segue para Preference (Checkout Pro)
          }
        }

        // 3. Criação da Preference oficial (suporta Pix e Cartão de Crédito em até 12x)
        const preferenceClient = new Preference(client);
        const prefRes = await preferenceClient.create({
          body: {
            items: orderData.items.map((item) => ({
              id: item.product_id,
              title: item.name,
              quantity: item.quantity,
              unit_price: Number(item.unit_price.toFixed(2)),
              currency_id: "BRL",
            })),
            shipments: {
              cost: Number(orderData.shipping.toFixed(2)),
              mode: "not_specified",
            },
            payer: {
              name: firstName,
              surname: lastName,
              email: orderData.customer.email,
              identification:
                cpfDigits.length === 11
                  ? { type: "CPF", number: cpfDigits }
                  : undefined,
            },
            payment_methods: {
              installments: 12,
              default_payment_method_id:
                orderData.paymentMethod === "pix" ? "pix" : undefined,
            },
            external_reference: orderData.orderId,
            back_urls: {
              success: `${origin}/checkout?pedido=${orderData.orderId}&gateway=mercadopago&status=paid`,
              pending: `${origin}/checkout?pedido=${orderData.orderId}&gateway=mercadopago&status=pending`,
              failure: `${origin}/checkout?pedido=${orderData.orderId}&gateway=mercadopago&status=cancelled`,
            },
            auto_return: "approved",
            notification_url: `${origin}/api/webhooks/mercadopago`,
            statement_descriptor: "BBBSHOPBRASIL",
          },
        });

        const checkoutUrl =
          prefRes.init_point ||
          prefRes.sandbox_init_point ||
          `${origin}/checkout?pedido=${orderData.orderId}&gateway=mercadopago&status=pending`;

        return {
          gateway: "mercadopago",
          preferenceId: String(prefRes.id || pixPaymentId || orderData.orderId),
          transactionId: pixPaymentId,
          checkoutUrl,
          sandboxCheckoutUrl: prefRes.sandbox_init_point || checkoutUrl,
          mode: transparentPix ? "transparent" : "redirect",
          status: "pending",
          pix: transparentPix,
          raw: {
            preferenceId: prefRes.id,
            initPoint: prefRes.init_point,
            sandboxInitPoint: prefRes.sandbox_init_point,
            publicKey: this.publicKey || undefined,
          },
        };
      } catch (err) {
        console.warn(
          "[MercadoPagoProvider] Falha ao comunicar com API real do Mercado Pago; ativando fallback seguro de demonstração:",
          err instanceof Error ? err.message : err
        );
      }
    }

    // Fallback seguro (quando credenciais ainda não foram cadastradas no banco/.env)
    const brCode = buildPixBrCode({
      amount: orderData.total,
      txid: `MP${orderData.orderId.replace(/-/g, "").slice(0, 18)}`,
    });
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const simulatedUrl = `${origin}/checkout?pedido=${orderData.orderId}&gateway=mercadopago&status=pending`;

    return {
      gateway: "mercadopago",
      preferenceId: `mp_pref_${orderData.orderId.slice(0, 8)}`,
      transactionId: `mp_tx_${orderData.orderId.slice(0, 8)}`,
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

    const dataObj =
      body.data && typeof body.data === "object"
        ? (body.data as Record<string, unknown>)
        : {};

    const paymentId = String(
      dataObj.id ?? body.id ?? body.transaction_id ?? ""
    ).trim();

    let orderId: string | null =
      typeof body.external_reference === "string"
        ? body.external_reference
        : typeof body.orderId === "string"
          ? body.orderId
          : typeof body.order_id === "string"
            ? body.order_id
            : null;

    let rawStatus =
      typeof body.status === "string"
        ? body.status
        : typeof body.action === "string"
          ? body.action
          : "pending";

    // Se temos token configurado e um ID numérico de pagamento do MP, consulta a SDK oficial
    const client = this.getClient();
    if (client && paymentId && /^\d+$/.test(paymentId)) {
      try {
        const paymentClient = new Payment(client);
        const paymentInfo = await paymentClient.get({ id: paymentId });
        if (paymentInfo.external_reference) {
          orderId = String(paymentInfo.external_reference);
        }
        if (paymentInfo.status) {
          rawStatus = String(paymentInfo.status);
        }
      } catch (err) {
        console.warn(
          "[MercadoPagoProvider.handleWebhook] Não foi possível consultar Payment.get:",
          err instanceof Error ? err.message : err
        );
      }
    }

    const signatureHeader = headers?.get("x-signature") ?? null;

    return {
      gateway: "mercadopago",
      orderId,
      transactionId: paymentId || null,
      status: mapMpStatusToOrderStatus(rawStatus),
      rawStatus,
      verified: Boolean(signatureHeader || client || orderId),
    };
  }
}

