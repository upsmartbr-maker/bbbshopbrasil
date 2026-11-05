import { NextResponse } from "next/server";
import { adminGetSettings, adminUpdateSettings } from "@/lib/admin-store";
import type { Settings } from "@/types/database";

export async function GET() {
  const settings = await adminGetSettings();
  return NextResponse.json({ ok: true, settings });
}

export async function PUT(request: Request) {
  let body: Partial<Settings> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Payload JSON inválido." },
      { status: 400 }
    );
  }

  const updated = await adminUpdateSettings({
    active_gateway:
      body.active_gateway === "pagseguro" ? "pagseguro" : "mercadopago",
    mp_access_token: body.mp_access_token ?? null,
    mp_public_key: body.mp_public_key ?? null,
    pagseguro_token: body.pagseguro_token ?? null,
    pagseguro_email: body.pagseguro_email ?? null,
    pagseguro_app_id: body.pagseguro_app_id ?? null,
    pagseguro_app_key: body.pagseguro_app_key ?? null,
  });

  return NextResponse.json({ ok: true, settings: updated });
}

