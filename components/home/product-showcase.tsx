import Link from "next/link";
import { ProductCard } from "@/components/home/product-card";
import type { ProductWithImages } from "@/types/database";

export function ProductShowcase({ products }: { products: ProductWithImages[] }) {
  return (
    <section id="colecoes" className="scroll-mt-28 bg-crema py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col justify-between gap-4 border-b border-nero/10 pb-8 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-terracotta">Destaques</p>
            <h2 className="mt-3 font-display text-4xl font-medium md:text-5xl">Nossos produtos em destaque</h2>
          </div>
          <Link href="/produtos" className="text-sm font-semibold uppercase tracking-wider text-champagne-deep underline underline-offset-4">
            Ver todos
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

