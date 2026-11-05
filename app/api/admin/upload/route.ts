import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const bucketRaw = String(formData.get("bucket") ?? "products");
    const bucket = bucketRaw === "banners" ? "banners" : "products";

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Nenhum arquivo enviado." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext =
      file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
      "jpg";
    const filePath = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;

    // 1. Upload direto para o Supabase Storage (bucket 'products' ou 'banners')
    if (isSupabaseConfigured()) {
      const client = getServerSupabaseClient();
      if (client) {
        const { error: uploadError } = await client.storage
          .from(bucket)
          .upload(filePath, buffer, {
            contentType: file.type || "image/jpeg",
            upsert: true,
          });

        if (!uploadError) {
          const { data: pub } = client.storage
            .from(bucket)
            .getPublicUrl(filePath);
          if (pub?.publicUrl) {
            return NextResponse.json({
              ok: true,
              url: pub.publicUrl,
              storage: "supabase",
            });
          }
        }
      }
    }

    // 2. Fallback em Data URL caso o Supabase Storage ainda não esteja configurado no .env.local
    const mime = file.type || "image/jpeg";
    const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;

    return NextResponse.json({
      ok: true,
      url: dataUrl,
      storage: "local-data-url",
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Erro ao processar upload de imagem.",
      },
      { status: 500 }
    );
  }
}

