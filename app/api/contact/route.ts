import { NextResponse } from "next/server";
import { getServerSupabaseClient, supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface ContactPayload {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
}

export async function POST(request: Request) {
  let body: ContactPayload;
  try {
    body = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Dados de formulário inválidos." },
      { status: 400 }
    );
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const phone = (body.phone ?? "").trim();
  const subject = (body.subject ?? "").trim();
  const message = (body.message ?? "").trim();

  if (!name || !email || !message) {
    return NextResponse.json(
      {
        ok: false,
        error: "Por favor, preencha nome completo, e-mail e mensagem.",
      },
      { status: 400 }
    );
  }

  const client = getServerSupabaseClient() ?? supabase;

  const { error } = await client.from("contact_messages").insert([
    {
      name,
      email,
      phone,
      subject,
      message,
    },
  ]);

  if (error) {
    console.error("[POST /api/contact] Erro ao inserir em contact_messages:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error.message ||
          "Não foi possível enviar sua mensagem no momento. Tente novamente.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message:
      "Mensagem enviada com sucesso! Entraremos em contacto brevemente.",
  });
}

