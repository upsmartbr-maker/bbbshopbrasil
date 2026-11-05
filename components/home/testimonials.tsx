"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import type { Testimonial } from "@/types/database";

export function Testimonials({ items }: { items: Testimonial[] }) {
  const scroller = React.useRef<HTMLUListElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.9), behavior: "smooth" });
  };

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="depoimentos-title" className="bg-marmo/50 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-terracotta">Avaliações</p>
            <h2 id="depoimentos-title" className="mt-3 font-display text-4xl font-medium md:text-5xl">
              O que nossos clientes dizem
            </h2>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button onClick={() => scrollBy(-1)} aria-label="Depoimentos anteriores" className="flex h-11 w-11 items-center justify-center rounded-full border border-nero/20 hover:border-champagne-deep">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={() => scrollBy(1)} aria-label="Próximos depoimentos" className="flex h-11 w-11 items-center justify-center rounded-full border border-nero/20 hover:border-champagne-deep">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <ul
          ref={scroller}
          className="mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 [scrollbar-width:thin]"
          tabIndex={0}
          aria-label="Lista de depoimentos"
        >
          {items.map((t) => (
            <li key={t.id} className="w-[85%] shrink-0 snap-start sm:w-[45%] lg:w-[31%]">
              <figure className="flex h-full flex-col rounded-xl border border-nero/10 bg-white p-6">
                <div className="flex gap-0.5 text-champagne" role="img" aria-label={`Avaliação ${t.rating} de 5 estrelas`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-5 w-5 ${i < t.rating ? "fill-current" : "text-nero/20"}`} aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-base leading-relaxed">“{t.text}”</blockquote>
                <figcaption className="mt-5 border-t border-nero/10 pt-4">
                  <strong className="block text-sm">{t.customer_name}</strong>
                  {t.customer_city && <span className="text-sm text-nero/70">{t.customer_city}</span>}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

