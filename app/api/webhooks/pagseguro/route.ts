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
    return NextResponse.json(
      { ok: false, error: "Payload JSON inválido no webhook do PagSeguro." },
      { status: 400 }
    );
  }

  const { provider } = await getPaymentProvider("pagseguro");
  const result = await provider.handleWebhook(payload, request.headers);

  if (!result.orderId) {
    return NextResponse.json(
      {
        ok: true,
        received: true,
        updated: false,
        reason: "Notificação recebida sem reference_id / orderId associado.",
        result,
      },
      { status: 200 }
    );
  }

  const dbUpdate = await updateOrderStatusInDb(result.orderId, result.status);

  return NextResponse.json({
    ok: true,
    gateway: "pagseguro",
    orderId: result.orderId,
    status: result.status,
    transactionId: result.transactionId,
    updatedInSupabase: dbUpdate.updated,
  });
}

