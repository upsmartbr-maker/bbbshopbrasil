import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  adminDeleteProduct,
  adminListProducts,
  adminSaveProduct,
  type UpsertProductInput,
} from "@/lib/admin-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const products = await adminListProducts();
  return NextResponse.json({ ok: true, products });
}

export async function POST(request: Request) {
  let body: UpsertProductInput;
  try {
    body = (await request.json()) as UpsertProductInput;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Payload JSON inválido." },
      { status: 400 }
    );
  }

  if (!body.name || typeof body.name !== "string" || body.name.trim().length < 2) {
    return NextResponse.json(
      { ok: false, error: "Informe o nome do produto." },
      { status: 400 }
    );
  }

  if (Array.isArray(body.images) && body.images.length > 8) {
    return NextResponse.json(
      { ok: false, error: "Cada produto pode ter no máximo 8 imagens." },
      { status: 400 }
    );
  }

  const product = await adminSaveProduct(body);
  revalidatePath("/");
  revalidatePath("/produtos");
  revalidatePath(`/produto/${product.slug}`);
  revalidatePath(`/produtos/${product.slug}`);
  return NextResponse.json({ ok: true, product });
}

export async function PUT(request: Request) {
  return POST(request);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "ID do produto é obrigatório." },
      { status: 400 }
    );
  }

  await adminDeleteProduct(id);
  revalidatePath("/");
  revalidatePath("/produtos");
  return NextResponse.json({ ok: true });
}
