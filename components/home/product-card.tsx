"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImageIcon, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { formatBRL } from "@/lib/utils";
import { SITE } from "@/lib/site";
import type { ProductWithImages } from "@/types/database";

export function ProductCard({ product }: { product: ProductWithImages }) {
  const router = useRouter();
  const { addItem, open } = useCart();
  const images = product.product_images.slice(0, 4);
  const [active, setActive] = React.useState(0);
  const current = images[active]?.image_url ?? null;

  const hasDiscount = product.compare_at_price !== null && product.compare_at_price > product.price;
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / (product.compare_at_price as number)) * 100)
    : 0;
  const installment = product.price / SITE.installments;
  const soldOut = product.stock <= 0;

  const cartItem = {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: images[0]?.image_url ?? null,
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-nero/10 bg-white transition-shadow hover:shadow-xl">
      <div className="relative aspect-square overflow-hidden bg-marmo">
        {current ? (
          <Image
            src={current}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div role="img" aria-label={product.name} className="flex h-full w-full items-center justify-center bg-gradient-to-br from-marmo to-champagne/30 text-champagne-deep">
            <ImageIcon className="h-10 w-10" aria-hidden="true" />
          </div>
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

      {images.length > 1 && (
        <ul className="flex gap-2 px-4 pt-3" aria-label="Fotos do produto">
          {images.map((img, i) => (
            <li key={img.id}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-pressed={i === active}
                className={`relative h-12 w-12 overflow-hidden rounded-md border-2 ${i === active ? "border-champagne" : "border-transparent"}`}
              >
                <Image src={img.image_url} alt="" fill sizes="48px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 min-h-[3rem] text-base font-semibold leading-snug">{product.name}</h3>

        <div className="mt-3">
          {hasDiscount && (
            <p className="text-sm text-nero/70 line-through" aria-label={`Preço anterior ${formatBRL(product.compare_at_price as number)}`}>
              {formatBRL(product.compare_at_price as number)}
            </p>
          )}
          <p className="font-display text-3xl font-semibold leading-tight">
            {formatBRL(product.price)} <span className="font-sans text-sm font-medium text-nero/80">à vista</span>
          </p>
          <p className="text-sm text-nero/85">
            ou <strong>{SITE.installments}x de {formatBRL(installment)}</strong> sem juros
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

