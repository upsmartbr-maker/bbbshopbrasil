import { NextResponse } from "next/server";
import {
  adminDeleteBanner,
  adminListBanners,
  adminReorderBanners,
  adminSaveBanner,
  type UpsertBannerInput,
} from "@/lib/admin-store";

export async function GET() {
  const banners = await adminListBanners();
  return NextResponse.json({ ok: true, banners });
}

export async function POST(request: Request) {
  let body: UpsertBannerInput & { orderedIds?: string[] };
  try {
    body = (await request.json()) as UpsertBannerInput & {
      orderedIds?: string[];
    };
  } catch {
    return NextResponse.json(
      { ok: false, error: "Payload JSON inválido." },
      { status: 400 }
    );
  }

  if (Array.isArray(body.orderedIds)) {
    const banners = await adminReorderBanners(body.orderedIds);
    return NextResponse.json({ ok: true, banners });
  }

  if (!body.title || typeof body.title !== "string") {
    return NextResponse.json(
      { ok: false, error: "Informe o título do banner." },
      { status: 400 }
    );
  }

  const banner = await adminSaveBanner(body);
  return NextResponse.json({ ok: true, banner });
}

export async function PUT(request: Request) {
  return POST(request);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "ID do banner é obrigatório." },
      { status: 400 }
    );
  }

  await adminDeleteBanner(id);
  return NextResponse.json({ ok: true });
}

