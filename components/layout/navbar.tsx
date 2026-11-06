"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { NAV_LINKS } from "@/lib/site";

export function Navbar() {
  const { count, hydrated, open } = useCart();
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const searchForm = (idSuffix: string) => (
    <form action="/produtos" method="GET" role="search" className="relative w-full">
      <label htmlFor={`q-${idSuffix}`} className="sr-only">
        Buscar produtos
      </label>
      <input
        id={`q-${idSuffix}`}
        name="q"
        type="search"
        placeholder="Buscar panelas, frigideiras..."
        className="h-11 w-full rounded-full border border-nero/20 bg-white pl-4 pr-11 text-sm text-nero placeholder:text-nero/60 focus:border-champagne-deep focus:outline-none focus:ring-2 focus:ring-champagne/40"
      />
      <button type="submit" aria-label="Buscar" className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full text-champagne-deep hover:bg-champagne/15">
        <Search className="h-4 w-4" />
      </button>
    </form>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-nero/10 bg-crema/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-3 md:py-4">
        <Link href="/" aria-label="BBB Shop Brasil — Início" className="shrink-0">
          <Image
            src="/logo.png"
            alt="BBB Shop Brasil"
            width={220}
            height={96}
            priority
            className="h-11 w-auto object-contain md:h-16"
          />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegação principal">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-semibold uppercase tracking-widest text-nero hover:text-champagne-deep">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden w-full max-w-xs md:block">{searchForm("desktop")}</div>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <button
            type="button"
            onClick={open}
            aria-label={`Abrir carrinho${hydrated ? `, ${count} ${count === 1 ? "item" : "itens"}` : ""}`}
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-md border border-nero/20 hover:border-champagne-deep hover:text-champagne-deep"
          >
            <ShoppingBag className="h-5 w-5" />
            {hydrated && count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta px-1 text-xs font-bold leading-none text-white ring-2 ring-crema">
                {count}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-nero/20 lg:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div id="mobile-menu" hidden={!menuOpen} className="border-t border-nero/10 bg-crema px-6 pb-6 pt-4 lg:hidden">
        <div className="mb-4 md:hidden">{searchForm("mobile")}</div>
        <nav aria-label="Menu mobile" className="flex flex-col">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="border-b border-nero/10 py-3 text-base font-semibold uppercase tracking-widest hover:text-champagne-deep"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

