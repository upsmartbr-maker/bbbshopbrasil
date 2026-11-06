"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { ProductImageZoom } from "@/components/product/ProductImageZoom";
import { SITE } from "@/lib/site";
import {
  FALLBACK_PRODUCT_IMAGE,
  cn,
  formatBRL,
  resolveStorageImageUrl,
} from "@/lib/utils";
import type { ColorVariant, ProductWithImages } from "@/types/database";

export function extractNormalizedVariants(
  product: ProductWithImages
): ColorVariant[] {
  if (!Array.isArray(product.variants) || product.variants.length === 0) {
    return [];
  }

  return product.variants
    .filter((v) => v && typeof v.name === "string" && v.name.trim().length > 0)
    .map((v) => ({
      name: v.name.trim(),
      hex:
        typeof v.hex === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v.hex.trim())
          ? v.hex.trim()
          : "#1A1A1A",
      images: Array.isArray(v.images)
        ? v.images
            .map((url) => resolveStorageImageUrl(url, "products"))
            .filter((url): url is string => Boolean(url))
        : [],
    }));
}

export function extractDefaultProductImages(
  product: ProductWithImages
): string[] {
  const urls: string[] = [];

  if (Array.isArray(product.product_images) && product.product_images.length > 0) {
    const sorted = [...product.product_images].sort(
      (a, b) => Number(a.order_index ?? 0) - Number(b.order_index ?? 0)
    );
    for (const img of sorted) {
      const resolved = resolveStorageImageUrl(img.image_url, "products");
      if (resolved && !urls.includes(resolved)) {
        urls.push(resolved);
      }
    }
  }

  // Apenas se product_images estiver vazio utiliza image_url ou images como fallback,
  // garantindo que a foto com order_index: 0 seja obrigatoriamente a 1ª foto (capa principal).
  if (urls.length === 0 && product.image_url) {
    const resolvedMain = resolveStorageImageUrl(product.image_url, "products");
    if (resolvedMain) {
      urls.push(resolvedMain);
    }
  }

  if (urls.length === 0 && Array.isArray(product.images)) {
    for (const item of product.images) {
      const raw =
        typeof item === "string" ? item : item?.image_url || item?.url || "";
      const resolved = resolveStorageImageUrl(raw, "products");
      if (resolved && !urls.includes(resolved)) {
        urls.push(resolved);
      }
    }
  }

  return urls.slice(0, 8);
}

interface ProductDetailViewProps {
  product: ProductWithImages;
  isQuickView?: boolean;
  onCloseQuickView?: () => void;
}

export function ProductDetailView({
  product,
  isQuickView = false,
  onCloseQuickView,
}: ProductDetailViewProps) {
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
  const [activeImageIdx, setActiveImageIdx] = React.useState<number>(0);
  const [quantity, setQuantity] = React.useState<number>(1);
  const [justAdded, setJustAdded] = React.useState<boolean>(false);

  const activeVariant: ColorVariant | null =
    variants.length > 0
      ? variants[Math.min(selectedVariantIdx, variants.length - 1)] ?? variants[0]
      : null;

  const activeGallery: string[] = React.useMemo(() => {
    if (activeVariant && activeVariant.images.length > 0) {
      return activeVariant.images;
    }
    if (defaultImages.length > 0) {
      return defaultImages;
    }
    return [FALLBACK_PRODUCT_IMAGE];
  }, [activeVariant, defaultImages]);

  const safeImageIdx =
    activeImageIdx < activeGallery.length ? activeImageIdx : 0;
  const mainImageUrl = activeGallery[safeImageIdx] ?? FALLBACK_PRODUCT_IMAGE;

  const handleSelectVariant = (idx: number) => {
    if (idx === selectedVariantIdx) return;
    setSelectedVariantIdx(idx);
    setActiveImageIdx(0);
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
  const pixPrice = product.price * 0.95;
  const soldOut = product.stock <= 0;

  const buildCartPayload = () => {
    const colorSuffix = activeVariant ? ` — Cor: ${activeVariant.name}` : "";
    const variantKey = activeVariant
      ? `${product.id}__${activeVariant.name.toLowerCase().replace(/\s+/g, "-")}`
      : product.id;

    return {
      productId: variantKey,
      slug: product.slug,
      name: `${product.name}${colorSuffix}`,
      price: product.price,
      image: mainImageUrl,
    };
  };

  const handleAddToCart = () => {
    if (soldOut) return;
    addItem(buildCartPayload(), quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
    if (onCloseQuickView) {
      onCloseQuickView();
    }
    open();
  };

  const handleBuyNow = () => {
    if (soldOut) return;
    addItem(buildCartPayload(), quantity);
    if (onCloseQuickView) {
      onCloseQuickView();
    }
    router.push("/checkout");
  };

  return (
    <div
      className={cn(
        "grid gap-8 lg:grid-cols-12 lg:gap-12",
        isQuickView ? "items-start" : "items-start"
      )}
    >
      {/* Coluna da Galeria + Zoom Principal */}
      <div className="flex flex-col-reverse gap-4 sm:flex-row lg:col-span-7">
        {/* Lista de Miniaturas Lateral / Inferior */}
        {activeGallery.length > 1 && (
          <ul
            aria-label="Galeria de miniaturas do produto"
            className="flex shrink-0 gap-2.5 overflow-x-auto pb-1 sm:w-20 sm:flex-col sm:overflow-y-auto sm:pb-0"
          >
            {activeGallery.map((imgUrl, idx) => {
              const isSelected = idx === safeImageIdx;
              return (
                <li key={`${imgUrl}-${idx}`} className="shrink-0">
                  <button
                    type="button"
                    onMouseEnter={() => setActiveImageIdx(idx)}
                    onFocus={() => setActiveImageIdx(idx)}
                    onClick={() => setActiveImageIdx(idx)}
                    aria-label={`Visualizar foto ${idx + 1}`}
                    aria-pressed={isSelected}
                    className={cn(
                      "relative h-16 w-16 overflow-hidden rounded-xl border-2 bg-[#FDFBF7] transition-all sm:h-20 sm:w-20",
                      isSelected
                        ? "border-[#C28E46] ring-2 ring-[#C28E46]/30"
                        : "border-nero/10 opacity-75 hover:border-nero/30 hover:opacity-100"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgUrl}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Imagem em Destaque com Efeito Lente / Hover Zoom 2.2x */}
        <div className="relative flex-1">
          <ProductImageZoom
            src={mainImageUrl}
            alt={
              activeVariant
                ? `${product.name} - ${activeVariant.name}`
                : product.name
            }
            images={activeGallery}
            activeIndex={safeImageIdx}
            onSelectIndex={setActiveImageIdx}
            zoomScale={2.2}
            badge={
              <>
                {hasDiscount && (
                  <span className="pointer-events-none absolute left-4 top-4 rounded-md bg-terracotta px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-xs">
                    -{discountPct}% OFF
                  </span>
                )}
                {soldOut && (
                  <span className="pointer-events-none absolute right-4 top-4 rounded-md bg-nero px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#FDFBF7]">
                    Esgotado
                  </span>
                )}
              </>
            }
          />
        </div>
      </div>

      {/* Coluna de Informações, Variações de Cor e Ações */}
      <div className="flex flex-col lg:col-span-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#C28E46]">
          <Sparkles className="h-3.5 w-3.5" />
          <span>BBB Shop Brasil • Linha Gourmet</span>
        </div>

        <h1
          className={cn(
            "mt-2 font-display font-medium leading-tight text-nero",
            isQuickView ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"
          )}
        >
          {product.name}
        </h1>

        {/* Bloco de Preço */}
        <div className="mt-5 rounded-2xl border border-nero/10 bg-[#FDFBF7] p-5">
          {hasDiscount && (
            <p className="text-sm text-nero/60 line-through">
              De {formatBRL(product.compare_at_price as number)}
            </p>
          )}
          <div className="mt-0.5 flex flex-wrap items-baseline gap-2.5">
            <span className="font-display text-4xl font-semibold text-nero">
              {formatBRL(product.price)}
            </span>
            <span className="rounded-full bg-[#C28E46]/15 px-2.5 py-0.5 text-xs font-semibold text-[#9F7130]">
              à vista
            </span>
          </div>
          <p className="mt-1.5 text-sm text-nero/80">
            ou em até{" "}
            <strong className="text-nero">
              {SITE.installments}x de {formatBRL(installment)}
            </strong>{" "}
            sem juros no cartão
          </p>
          <p className="mt-1 text-xs font-medium text-emerald-800">
            No Pix: <strong>{formatBRL(pixPrice)}</strong> (5% de desconto
            imediato)
          </p>
        </div>

        {/* Seletor de Variações de Cores com Troca Instantânea da Galeria */}
        {variants.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-nero/80">
                Cor selecionada:{" "}
                <strong className="text-nero">{activeVariant?.name}</strong>
              </span>
              <span className="text-[11px] text-nero/60">
                { variants.length }{" "}
                {variants.length === 1 ? "opção disponível" : "cores disponíveis"}
              </span>
            </div>

            <div
              role="radiogroup"
              aria-label="Escolha a cor do produto"
              className="mt-3 flex flex-wrap gap-2.5"
            >
              {variants.map((variant, idx) => {
                const isSelected = idx === selectedVariantIdx;
                return (
                  <button
                    key={`${variant.name}-${idx}`}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onMouseEnter={() => handleSelectVariant(idx)}
                    onFocus={() => handleSelectVariant(idx)}
                    onClick={() => handleSelectVariant(idx)}
                    className={cn(
                      "inline-flex items-center gap-2.5 rounded-xl border px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition-all",
                      isSelected
                        ? "border-[#C28E46] bg-[#FDFBF7] text-nero shadow-xs ring-2 ring-[#C28E46]/35"
                        : "border-nero/15 bg-white text-nero/80 hover:border-[#C28E46]/70 hover:bg-[#FDFBF7]"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      style={{ backgroundColor: variant.hex }}
                      className="h-4 w-4 shrink-0 rounded-md border border-black/20 shadow-2xs"
                    />
                    <span>{variant.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Seletor de Quantidade + Status de Estoque */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-nero/80">
              Quantidade
            </span>
            <div className="inline-flex h-11 items-center rounded-xl border border-nero/15 bg-white px-1">
              <button
                type="button"
                disabled={soldOut || quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Diminuir quantidade"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-nero transition hover:bg-marmo disabled:opacity-40"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-9 text-center text-sm font-semibold text-nero">
                {quantity}
              </span>
              <button
                type="button"
                disabled={soldOut || quantity >= Math.max(1, product.stock)}
                onClick={() =>
                  setQuantity((q) =>
                    Math.min(Math.max(1, product.stock), q + 1)
                  )
                }
                aria-label="Aumentar quantidade"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-nero transition hover:bg-marmo disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="text-xs font-medium text-nero/70">
            {soldOut ? (
              <span className="text-terracotta">Produto indisponível</span>
            ) : product.stock <= 5 ? (
              <span className="text-amber-800">
                Restam apenas <strong>{product.stock}</strong> unidades
              </span>
            ) : (
              <span className="text-emerald-800">
                ● Em estoque para envio imediato
              </span>
            )}
          </div>
        </div>

        {/* Botões de Ação Principais (Identidade BBB Shop Brasil: #FDFBF7, #C28E46 e #141311) */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={soldOut}
            onClick={handleAddToCart}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#141311] px-5 text-xs font-semibold uppercase tracking-wider text-[#FDFBF7] shadow-xs transition hover:bg-[#C28E46] hover:text-[#141311] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {justAdded ? (
              <>
                <Check className="h-4 w-4" />
                <span>Adicionado!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" />
                <span>Adicionar ao carrinho</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={soldOut}
            onClick={handleBuyNow}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#C28E46] px-5 text-xs font-semibold uppercase tracking-wider text-[#141311] shadow-xs transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Comprar agora
          </button>
        </div>

        {/* Link para página completa quando estiver no modal de Visualização Rápida */}
        {isQuickView && (
          <div className="mt-4">
            <Link
              href={`/produto/${product.slug}`}
              onClick={onCloseQuickView}
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#9F7130] underline underline-offset-4 hover:text-nero"
            >
              <span>Ver página completa de detalhes do produto</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* Descrição do Produto */}
        {product.description && (
          <div className="mt-6 border-t border-nero/10 pt-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-nero/70">
              Sobre o produto
            </h2>
            <div className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-nero/85">
              {product.description}
            </div>
          </div>
        )}

        {/* Selos de Confiança */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-nero/10 pt-5 text-xs text-nero/80">
          <div className="flex items-center gap-2.5 rounded-xl bg-[#FDFBF7] p-3 border border-nero/10">
            <Truck className="h-4 w-4 shrink-0 text-[#C28E46]" />
            <span>Envio seguro para todo o Brasil</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-[#FDFBF7] p-3 border border-nero/10">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#C28E46]" />
            <span>Garantia de qualidade BBB Shop</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductQuickViewModal({
  product,
  open,
  onClose,
}: {
  product: ProductWithImages | null;
  open: boolean;
  onClose: () => void;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !product) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Visualização rápida: ${product.name}`}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-nero/60 p-4 backdrop-blur-xs sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative my-auto max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-[#C28E46]/30 bg-[#FDFBF7] p-6 shadow-2xl sm:p-8"
      >
        <div className="mb-4 flex items-center justify-between border-b border-nero/10 pb-3">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#9F7130]">
            Visualização Rápida
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar visualização rápida"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-nero/15 bg-white text-nero transition hover:border-[#C28E46] hover:bg-[#C28E46]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ProductDetailView
          product={product}
          isQuickView
          onCloseQuickView={onClose}
        />
      </div>
    </div>
  );
}

export function BackToCatalogBreadcrumb() {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <Link
        href="/produtos"
        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-nero/75 transition hover:text-[#C28E46]"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Voltar para o catálogo</span>
      </Link>
    </div>
  );
}

