import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { resolveStorageImageUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

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
        let { error: uploadError } = await client.storage
          .from(bucket)
          .upload(filePath, buffer, {
            contentType: file.type || "image/jpeg",
            upsert: true,
          });

        // Se o bucket ainda não existir no projeto Supabase, cria como público e tenta novamente
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
            /* segue para fallback */
          }
        }

        if (!uploadError) {
          const publicUrl =
            client.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
          const normalizedUrl =
            resolveStorageImageUrl(publicUrl, bucket) || publicUrl;

          if (normalizedUrl) {
            return NextResponse.json({
              ok: true,
              url: normalizedUrl,
              publicUrl: normalizedUrl,
              storage: "supabase",
            });
          }
        }
      }
    }

    // 2. Fallback em Data URL caso o Supabase Storage não esteja acessível
    const mime = file.type || "image/jpeg";
    const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;

    return NextResponse.json({
      ok: true,
      url: dataUrl,
      publicUrl: dataUrl,
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
