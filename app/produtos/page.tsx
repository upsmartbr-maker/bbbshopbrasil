export const dynamic = "force-dynamic";
export const revalidate = 0;

import { ProductCard } from "@/components/home/product-card";
import { getAllProducts } from "@/lib/data";

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const all = await getAllProducts();
  const products = q
    ? all.filter((p) =>
        `${p.name} ${p.description ?? ""}`.toLowerCase().includes(q)
      )
    : all;

  return (
    <section className="mx-auto max-w-7xl px-6 py-14">
      <h1 className="font-display text-4xl font-medium md:text-5xl">
        {q ? `Resultados para “${searchParams.q}”` : "Todos os produtos"}
      </h1>
      <p className="mt-2 text-base text-nero/80">
        {products.length}{" "}
        {products.length === 1 ? "produto encontrado" : "produtos encontrados"}
      </p>

      {products.length === 0 ? (
        <div className="mt-10 rounded-xl border border-nero/10 bg-white/70 px-6 py-14 text-center">
          <p className="text-lg font-medium text-nero/80">
            {q
              ? "Nenhum produto encontrado. Tente outro termo de busca."
              : "Nenhum produto cadastrado no momento."}
          </p>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
