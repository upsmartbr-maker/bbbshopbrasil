"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import {
  FALLBACK_PRODUCT_IMAGE,
  formatBRL,
  resolveStorageImageUrl,
} from "@/lib/utils";
import { SITE } from "@/lib/site";
import type { ProductWithImages } from "@/types/database";

export function ProductCard({ product }: { product: ProductWithImages }) {
  const router = useRouter();
  const { addItem, open } = useCart();

  // Prioridade exata para a imagem principal do produto
  const firstArrayImg = Array.isArray(product.images)
    ? typeof product.images[0] === "string"
      ? product.images[0]
      : product.images[0]?.image_url
    : undefined;

  const mainImageRaw =
    product.product_images?.[0]?.image_url ||
    product.image_url ||
    firstArrayImg ||
    null;

  const mainImage = resolveStorageImageUrl(mainImageRaw, "products");

  const galleryImages = React.useMemo(() => {
    const list: Array<{ id: string; url: string }> = [];

    if (Array.isArray(product.product_images) && product.product_images.length > 0) {
      const sorted = [...product.product_images].sort(
        (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
      );
      sorted.forEach((img, idx) => {
        const resolved = resolveStorageImageUrl(img.image_url, "products");
        if (resolved) {
          list.push({
            id: img.id || `${product.id}-img-${idx}`,
            url: resolved,
          });
        }
      });
    } else if (mainImage) {
      list.push({ id: `${product.id}-main`, url: mainImage });
    }

    return list.slice(0, 8);
  }, [product.id, product.product_images, mainImage]);

  const [active, setActive] = React.useState(0);
  const [imgLoadFailed, setImgLoadFailed] = React.useState(false);

  const selectedImageUrl = galleryImages[active]?.url || mainImage;

  React.useEffect(() => {
    setImgLoadFailed(false);
  }, [selectedImageUrl]);

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
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: selectedImageUrl ?? FALLBACK_PRODUCT_IMAGE,
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-nero/10 bg-white transition-shadow hover:shadow-xl">
      <div className="relative aspect-square overflow-hidden bg-marmo">
        {selectedImageUrl && !imgLoadFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={selectedImageUrl}
            alt={product.name}
            loading="lazy"
            onError={() => setImgLoadFailed(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          // Apenas quando não houver nenhuma imagem cadastrada (0/8 fotos), exibe o placeholder dourado da BBB Shop Brasil
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={FALLBACK_PRODUCT_IMAGE}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        )}

        {hasDiscount && (
          <span className="absolute left-3 top-3 rounded-md bg-terracotta px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
            -{discountPct}%
          </span>
        )}
        {soldOut && (
          <span className="absolute right-3 top-3 rounded-md bg-nero px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-crema">
            Esgotado
          </span>
        )}
      </div>

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
                aria-pressed={i === active}
                className={`relative h-12 w-12 overflow-hidden rounded-md border-2 ${
                  i === active ? "border-champagne" : "border-transparent"
                }`}
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

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 min-h-[3rem] text-base font-semibold leading-snug">
          {product.name}
        </h3>

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
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-nero px-4 text-xs font-semibold uppercase tracking-wider text-crema hover:bg-champagne hover:text-nero disabled:cursor-not-allowed disabled:opacity-60"
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
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-champagne px-4 text-xs font-semibold uppercase tracking-wider text-nero hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Comprar agora
          </button>
        </div>
      </div>
    </article>
  );
}
