import { NextResponse } from "next/server";
import { getServerSupabaseClient, supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function sanitizeStorageFileName(originalName: string): string {
  return originalName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "");
}

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
    const cleanName = sanitizeStorageFileName(file.name) || "imagem.jpg";
    const filePath = `${Date.now()}-${cleanName}`;

    const client = getServerSupabaseClient() ?? supabase;

    let { error: uploadError } = await client.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    // Caso o bucket ainda não exista, tenta criá-lo como público e reenviar
    if (uploadError) {
      try {
        await client.storage.createBucket(bucket, { public: true });
        await client.storage.updateBucket(bucket, { public: true });
        const retry = await client.storage
          .from(bucket)
          .upload(filePath, buffer, {
            contentType: file.type || "image/jpeg",
            upsert: true,
          });
        uploadError = retry.error;
      } catch {
        // Mantém uploadError original
      }
    }

    if (uploadError) {
      console.error("Erro no upload do Storage:", uploadError);
      return NextResponse.json(
        {
          ok: false,
          error: uploadError.message,
        },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = client.storage.from(bucket).getPublicUrl(filePath);

    return NextResponse.json({
      ok: true,
      url: publicUrl,
      publicUrl,
      filePath,
      storage: "supabase",
    });
  } catch (err) {
    console.error("Erro no upload do Storage:", err);
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
