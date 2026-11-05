"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import {
  ProductQuickViewModal,
  extractDefaultProductImages,
  extractNormalizedVariants,
} from "@/components/product/ProductDetailView";
import { SITE } from "@/lib/site";
import { FALLBACK_PRODUCT_IMAGE, cn, formatBRL } from "@/lib/utils";
import type { ProductWithImages } from "@/types/database";

export function ProductCard({ product }: { product: ProductWithImages }) {
  const router = useRouter();
  const { addItem, open } = useCart();

  const variants = React.useMemo(
    () => extractNormalizedVariants(product),
    [product]
  );
  const defaultImages = React.useMemo(
    () => extractDefaultProductImages(product),
    [product]
  );

  const [selectedVariantIdx, setSelectedVariantIdx] = React.useState<number>(0);
  const [active, setActive] = React.useState<number>(0);
  const [imgLoadFailed, setImgLoadFailed] = React.useState<boolean>(false);
  const [quickViewOpen, setQuickViewOpen] = React.useState<boolean>(false);

  const activeVariant =
    variants.length > 0
      ? variants[Math.min(selectedVariantIdx, variants.length - 1)] ?? variants[0]
      : null;

  const galleryImages = React.useMemo(() => {
    const urls =
      activeVariant && activeVariant.images.length > 0
        ? activeVariant.images
        : defaultImages;

    return urls.slice(0, 8).map((url, idx) => ({
      id: `${product.id}-${selectedVariantIdx}-img-${idx}`,
      url,
    }));
  }, [activeVariant, defaultImages, product.id, selectedVariantIdx]);

  const safeActiveIdx = active < galleryImages.length ? active : 0;
  const selectedImageUrl = galleryImages[safeActiveIdx]?.url ?? null;

  React.useEffect(() => {
    setImgLoadFailed(false);
  }, [selectedImageUrl]);

  const handleVariantChange = (idx: number) => {
    if (idx === selectedVariantIdx) return;
    setSelectedVariantIdx(idx);
    setActive(0);
  };

  const hasDiscount =
    product.compare_at_price !== null &&
    product.compare_at_price > product.price;
  const discountPct = hasDiscount
    ? Math.round(
        (1 - product.price / (product.compare_at_price as number)) * 100
      )
    : 0;
  const installment = product.price / SITE.installments;
  const soldOut = product.stock <= 0;

  const cartItem = {
    productId: activeVariant
      ? `${product.id}__${activeVariant.name.toLowerCase().replace(/\s+/g, "-")}`
      : product.id,
    slug: product.slug,
    name: activeVariant
      ? `${product.name} — Cor: ${activeVariant.name}`
      : product.name,
    price: product.price,
    image: selectedImageUrl ?? FALLBACK_PRODUCT_IMAGE,
  };

  return (
    <>
      <article className="group flex flex-col overflow-hidden rounded-xl border border-nero/10 bg-white transition-shadow hover:shadow-xl">
        <div className="relative aspect-square overflow-hidden bg-marmo">
          <Link
            href={`/produto/${product.slug}`}
            aria-label={`Ver detalhes de ${product.name}`}
            className="block h-full w-full"
          >
            {selectedImageUrl && !imgLoadFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedImageUrl}
                alt={
                  activeVariant
                    ? `${product.name} - ${activeVariant.name}`
                    : product.name
                }
                loading="lazy"
                onError={() => setImgLoadFailed(true)}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={FALLBACK_PRODUCT_IMAGE}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            )}
          </Link>

          {hasDiscount && (
            <span className="pointer-events-none absolute left-3 top-3 rounded-md bg-terracotta px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
              -{discountPct}%
            </span>
          )}
          {soldOut && (
            <span className="pointer-events-none absolute right-3 top-3 rounded-md bg-nero px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-crema">
              Esgotado
            </span>
          )}

          {/* Botão de Visualização Rápida com Zoom e Seletor de Cores */}
          <button
            type="button"
            onClick={() => setQuickViewOpen(true)}
            aria-label={`Visualização rápida de ${product.name}`}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg border border-nero/15 bg-[#FDFBF7]/95 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-nero shadow-sm backdrop-blur-xs transition hover:border-[#C28E46] hover:bg-[#C28E46]"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Espiar</span>
          </button>
        </div>

        {/* Miniaturas da Galeria Ativa */}
        {galleryImages.length > 1 && (
          <ul
            className="flex flex-wrap gap-2 px-4 pt-3"
            aria-label="Fotos do produto"
          >
            {galleryImages.slice(0, 4).map((img, i) => (
              <li key={img.id}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  aria-label={`Ver foto ${i + 1}`}
                  aria-pressed={i === safeActiveIdx}
                  className={cn(
                    "relative h-12 w-12 overflow-hidden rounded-md border-2 transition",
                    i === safeActiveIdx
                      ? "border-[#C28E46]"
                      : "border-transparent opacity-80 hover:opacity-100"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Seletor de Variações de Cores no Card */}
        {variants.length > 0 && (
          <div
            className="flex flex-wrap gap-1.5 px-4 pt-3"
            aria-label="Variações de cor"
          >
            {variants.map((variant, idx) => {
              const isSelected = idx === selectedVariantIdx;
              return (
                <button
                  key={`${variant.name}-${idx}`}
                  type="button"
                  onMouseEnter={() => handleVariantChange(idx)}
                  onFocus={() => handleVariantChange(idx)}
                  onClick={() => handleVariantChange(idx)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition",
                    isSelected
                      ? "border-[#C28E46] bg-[#FDFBF7] text-nero ring-1 ring-[#C28E46]/40"
                      : "border-nero/15 bg-white text-nero/75 hover:border-[#C28E46]/60"
                  )}
                >
                  <span
                    aria-hidden="true"
                    style={{ backgroundColor: variant.hex }}
                    className="h-3 w-3 shrink-0 rounded-xs border border-black/20"
                  />
                  <span>{variant.name}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex flex-1 flex-col p-4">
          <Link
            href={`/produto/${product.slug}`}
            className="line-clamp-2 min-h-[3rem] text-base font-semibold leading-snug text-nero transition hover:text-[#9F7130]"
          >
            {product.name}
          </Link>

          <div className="mt-3">
            {hasDiscount && (
              <p
                className="text-sm text-nero/70 line-through"
                aria-label={`Preço anterior ${formatBRL(
                  product.compare_at_price as number
                )}`}
              >
                {formatBRL(product.compare_at_price as number)}
              </p>
            )}
            <p className="font-display text-3xl font-semibold leading-tight">
              {formatBRL(product.price)}{" "}
              <span className="font-sans text-sm font-medium text-nero/80">
                à vista
              </span>
            </p>
            <p className="text-sm text-nero/85">
              ou{" "}
              <strong>
                {SITE.installments}x de {formatBRL(installment)}
              </strong>{" "}
              sem juros
            </p>
          </div>

          <div className="mt-4 grid gap-2">
            <button
              type="button"
              disabled={soldOut}
              onClick={() => {
                addItem(cartItem);
                open();
              }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#141311] px-4 text-xs font-semibold uppercase tracking-wider text-[#FDFBF7] transition hover:bg-[#C28E46] hover:text-[#141311] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ShoppingBag className="h-4 w-4" /> Adicionar ao carrinho
            </button>
            <button
              type="button"
              disabled={soldOut}
              onClick={() => {
                addItem(cartItem);
                router.push("/checkout");
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#C28E46] px-4 text-xs font-semibold uppercase tracking-wider text-[#141311] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Comprar agora
            </button>
          </div>
        </div>
      </article>

      <ProductQuickViewModal
        product={product}
        open={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
      />
    </>
  );
}
