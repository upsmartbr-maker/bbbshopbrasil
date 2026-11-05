"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { resolveStorageImageUrl } from "@/lib/utils";
import type { Banner } from "@/types/database";

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [failedBannerIds, setFailedBannerIds] = React.useState<
    Record<string, boolean>
  >({});
  const total = banners.length;

  const go = React.useCallback(
    (i: number) => setIndex((i + total) % total),
    [total]
  );

  React.useEffect(() => {
    if (paused || total <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % total),
      6000
    );
    return () => window.clearInterval(id);
  }, [paused, total]);

  if (total === 0) return null;

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Destaques e promoções"
      className="mx-auto max-w-7xl px-6 py-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative overflow-hidden rounded-2xl border border-champagne/30">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {banners.map((b, i) => {
            const resolvedUrl = resolveStorageImageUrl(b.image_url, "banners");
            const showImage = Boolean(resolvedUrl && !failedBannerIds[b.id]);
            const isUnoptimized = Boolean(
              resolvedUrl &&
                (resolvedUrl.startsWith("data:") ||
                  resolvedUrl.startsWith("blob:"))
            );

            return (
              <div
                key={b.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} de ${total}`}
                aria-hidden={i !== index}
                className="relative flex min-h-[260px] w-full shrink-0 items-center md:min-h-[340px]"
              >
                {showImage && resolvedUrl ? (
                  <>
                    <Image
                      src={resolvedUrl}
                      alt={b.title || "Banner promocional"}
                      fill
                      unoptimized={isUnoptimized}
                      sizes="100vw"
                      onError={() =>
                        setFailedBannerIds((prev) => ({
                          ...prev,
                          [b.id]: true,
                        }))
                      }
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-nero/80 via-nero/50 to-transparent" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-r from-nero via-[#3a2a1a] to-champagne-deep" />
                )}
                <div className="relative max-w-xl px-8 py-10 text-crema md:px-14">
                  <h2 className="font-display text-4xl font-medium leading-tight md:text-5xl">
                    {b.title}
                  </h2>
                  {b.subtitle && (
                    <p className="mt-3 text-base leading-relaxed text-crema/90 md:text-lg">
                      {b.subtitle}
                    </p>
                  )}
                  {b.button_text && b.link && (
                    <Link
                      href={b.link}
                      tabIndex={i === index ? 0 : -1}
                      className="mt-6 inline-flex min-h-11 items-center rounded-md bg-champagne px-6 text-sm font-semibold uppercase tracking-wider text-nero hover:brightness-105"
                    >
                      {b.button_text}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {total > 1 && (
          <>
            <button
              onClick={() => go(index - 1)}
              aria-label="Slide anterior"
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-crema/90 text-nero shadow hover:bg-crema"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => go(index + 1)}
              aria-label="Próximo slide"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-crema/90 text-nero shadow hover:bg-crema"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div
              className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2"
              role="tablist"
              aria-label="Selecionar slide"
            >
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Ir para slide ${i + 1}`}
                  onClick={() => go(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === index
                      ? "w-8 bg-champagne"
                      : "w-2 bg-crema/70 hover:bg-crema"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
