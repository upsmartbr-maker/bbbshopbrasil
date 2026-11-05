import { NextResponse } from "next/server";
import { getPaymentProvider, updateOrderStatusInDb } from "@/lib/payments";

export async function POST(request: Request) {
  let payload: Record<string, unknown> = {};
  try {
    const parsed = await request.json();
    if (parsed && typeof parsed === "object") {
      payload = parsed as Record<string, unknown>;
    }
  } catch {
    // Alguns pings de webhook podem enviar apenas query params
  }

  const url = new URL(request.url);
  const queryDataId = url.searchParams.get("data.id") ?? url.searchParams.get("id");
  const queryTopic = url.searchParams.get("type") ?? url.searchParams.get("topic");
  const queryExternalRef = url.searchParams.get("external_reference");

  if (queryDataId && !payload.id && !payload.data) {
    payload.data = { id: queryDataId };
  }
  if (queryTopic && !payload.type) {
    payload.type = queryTopic;
  }
  if (queryExternalRef && !payload.external_reference) {
    payload.external_reference = queryExternalRef;
  }

  const { provider } = await getPaymentProvider("mercadopago");
  const result = await provider.handleWebhook(payload, request.headers);

  if (!result.orderId) {
    return NextResponse.json(
      {
        ok: true,
        received: true,
        updated: false,
        reason: "Notificação recebida sem orderId / external_reference associado.",
        result,
      },
      { status: 200 }
    );
  }

  const dbUpdate = await updateOrderStatusInDb(result.orderId, result.status);

  return NextResponse.json({
    ok: true,
    gateway: "mercadopago",
    orderId: result.orderId,
    status: result.status,
    transactionId: result.transactionId,
    updatedInSupabase: dbUpdate.updated,
  });
}

