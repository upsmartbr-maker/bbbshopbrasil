import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { adminRecordLocalOrder } from "@/lib/admin-store";
import { FALLBACK_PRODUCTS } from "@/lib/fallback";
import {
  getPaymentProvider,
  getPaymentSettings,
  type CheckoutCardData,
  type CheckoutCustomerData,
  type PaymentMethodChoice,
} from "@/lib/payments";
import { getServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { calculateEstimatedShipping } from "@/types/cart";
import type { OrderItem } from "@/types/database";

interface CheckoutRequestBody {
  customer?: CheckoutCustomerData;
  items?: Array<{
    productId?: string;
    product_id?: string;
    name?: string;
    price?: number;
    unit_price?: number;
    quantity?: number;
  }>;
  paymentMethod?: PaymentMethodChoice;
  card?: CheckoutCardData;
  cep?: string;
}

export async function GET() {
  const settings = await getPaymentSettings();
  return NextResponse.json({
    ok: true,
    activeGateway: settings.active_gateway,
    mpPublicKey: settings.mp_public_key ?? null,
    pagseguroEmail: settings.pagseguro_email ?? null,
  });
}

export async function POST(request: Request) {
  let body: CheckoutRequestBody;
  try {
    body = (await request.json()) as CheckoutRequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Payload JSON inválido." },
      { status: 400 }
    );
  }

  const customer = body.customer;
  if (
    !customer ||
    typeof customer.name !== "string" ||
    customer.name.trim().length < 2 ||
    typeof customer.email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())
  ) {
    return NextResponse.json(
      { ok: false, error: "Informe nome completo e um e-mail válido." },
      { status: 400 }
    );
  }

  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (rawItems.length === 0) {
    return NextResponse.json(
      { ok: false, error: "O carrinho está vazio." },
      { status: 400 }
    );
  }

  // Valida preços dos produtos no Supabase (ou catálogo de fallback) para evitar adulteração no cliente
  const productIds = rawItems
    .map((i) => String(i.productId ?? i.product_id ?? "").trim())
    .filter(Boolean);

  const dbPrices = new Map<string, { name: string; price: number }>();

  if (isSupabaseConfigured() && productIds.length > 0) {
    const client = getServerSupabaseClient();
    if (client) {
      const { data: products } = await client
        .from("products")
        .select("id, name, price")
        .in("id", productIds);

      if (Array.isArray(products)) {
        for (const p of products) {
          dbPrices.set(String(p.id), {
            name: String(p.name),
            price: Number(p.price),
          });
        }
      }
    }
  }

  for (const fallbackProd of FALLBACK_PRODUCTS) {
    if (!dbPrices.has(fallbackProd.id)) {
      dbPrices.set(fallbackProd.id, {
        name: fallbackProd.name,
        price: fallbackProd.price,
      });
    }
  }

  const normalizedItems: OrderItem[] = [];
  for (const item of rawItems) {
    const id = String(item.productId ?? item.product_id ?? "").trim();
    const qty = Math.max(1, Math.min(99, Math.floor(Number(item.quantity ?? 1))));
    const authoritative = dbPrices.get(id);
    const unitPrice = authoritative
      ? authoritative.price
      : Math.max(0.01, Number(item.price ?? item.unit_price ?? 0));
    const name = authoritative
      ? authoritative.name
      : String(item.name || "Produto BBB Shop Brasil").trim();

    if (!id || Number.isNaN(unitPrice) || unitPrice <= 0) {
      return NextResponse.json(
        { ok: false, error: "Item inválido no carrinho." },
        { status: 400 }
      );
    }

    normalizedItems.push({
      product_id: id,
      name,
      quantity: qty,
      unit_price: Number(unitPrice.toFixed(2)),
    });
  }

  const subtotal = Number(
    normalizedItems
      .reduce((acc, i) => acc + i.unit_price * i.quantity, 0)
      .toFixed(2)
  );
  const cep = body.cep ?? customer.address?.cep ?? "";
  const shipping = Number(calculateEstimatedShipping(subtotal, cep).toFixed(2));
  const total = Number((subtotal + shipping).toFixed(2));

  // 1. Lê a tabela 'settings' no Supabase para identificar o gateway ativo
  const { provider, settings } = await getPaymentProvider();
  const activeGateway = settings.active_gateway;

  // 2. Registra o pedido na tabela 'orders' do Supabase (e no store local para visibilidade imediata no Admin)
  let orderId: string = randomUUID();
  const initialStatus = "pending" as const;

  if (isSupabaseConfigured()) {
    const client = getServerSupabaseClient();
    if (client) {
      const { data: insertedOrder, error: orderError } = await client
        .from("orders")
        .insert({
          customer_name: customer.name.trim(),
          customer_email: customer.email.trim().toLowerCase(),
          customer_phone: customer.phone?.trim() || null,
          items: normalizedItems,
          total,
          gateway: activeGateway,
          status: initialStatus,
        })
        .select("id")
        .single();

      if (!orderError && insertedOrder?.id) {
        orderId = String(insertedOrder.id);
      } else if (orderError) {
        console.warn(
          "[/api/checkout] Aviso ao gravar em orders no Supabase:",
          orderError.message
        );
      }
    }
  }

  adminRecordLocalOrder({
    id: orderId,
    customer_name: customer.name.trim(),
    customer_email: customer.email.trim().toLowerCase(),
    customer_phone: customer.phone?.trim() || null,
    items: normalizedItems,
    total,
    gateway: activeGateway,
    status: initialStatus,
    created_at: new Date().toISOString(),
  });

  // 3. Chama createPreference(orderData) no gateway ativo (MercadoPagoProvider ou PagSeguroProvider)
  const originUrl = new URL(request.url).origin;
  const preference = await provider.createPreference({
    orderId,
    items: normalizedItems,
    subtotal,
    shipping,
    total,
    paymentMethod: body.paymentMethod ?? "pix",
    card: body.card,
    customer: {
      name: customer.name.trim(),
      email: customer.email.trim().toLowerCase(),
      phone: customer.phone?.trim(),
      cpf: customer.cpf?.trim(),
      address: customer.address,
    },
    originUrl,
  });

  // Se o pagamento transparente de cartão foi aprovado imediatamente, atualiza o status do pedido
  if (preference.status === "approved" && isSupabaseConfigured()) {
    const client = getServerSupabaseClient();
    if (client) {
      await client.from("orders").update({ status: "paid" }).eq("id", orderId);
    }
  }

  return NextResponse.json({
    ok: true,
    orderId,
    gateway: activeGateway,
    subtotal,
    shipping,
    total,
    preference,
  });
}
