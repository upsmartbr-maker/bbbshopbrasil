import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    gateway: process.env.ACTIVE_PAYMENT_GATEWAY ?? "mercadopago",
    time: new Date().toISOString(),
  });
}

