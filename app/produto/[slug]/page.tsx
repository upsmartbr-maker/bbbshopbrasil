export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import {
  BackToCatalogBreadcrumb,
  ProductDetailView,
} from "@/components/product/ProductDetailView";
import { ProductCard } from "@/components/home/product-card";
import { getAllProducts, getProductBySlug } from "@/lib/data";

export default async function ProdutoDetalhePage({
  params,
}: {
  params: { slug: string };
}) {
  const [product, allProducts] = await Promise.all([
    getProductBySlug(params.slug),
    getAllProducts(),
  ]);

  if (!product) {
    return (
      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-terracotta">
          Catálogo BBB Shop Brasil
        </p>
        <h1 className="mt-3 font-display text-4xl font-medium text-nero">
          Produto não encontrado
        </h1>
        <p className="mt-3 text-base text-nero/75">
          O produto que você procura pode ter sido atualizado ou removido.
        </p>
        <Link
          href="/produtos"
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#C28E46] px-8 text-xs font-semibold uppercase tracking-wider text-[#141311] transition hover:brightness-105"
        >
          Ver catálogo de produtos
        </Link>
      </section>
    );
  }

  const related = allProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="bg-[#FDFBF7] py-12 lg:py-16">
      <section className="mx-auto max-w-7xl px-6">
        <BackToCatalogBreadcrumb />
        <ProductDetailView product={product} />
      </section>

      {related.length > 0 && (
        <section className="mx-auto mt-20 max-w-7xl border-t border-nero/10 px-6 pt-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-terracotta">
                Combine na sua cozinha
              </p>
              <h2 className="mt-2 font-display text-3xl font-medium text-nero sm:text-4xl">
                Outros produtos da linha
              </h2>
            </div>
            <Link
              href="/produtos"
              className="text-xs font-semibold uppercase tracking-wider text-[#9F7130] underline underline-offset-4"
            >
              Ver todos
            </Link>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

