"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, Truck, X } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { FREE_SHIPPING_THRESHOLD } from "@/types/cart";
import { formatBRL } from "@/lib/utils";

export function CartDrawer() {
  const {
    items,
    count,
    subtotal,
    shipping,
    total,
    freeShippingRemaining,
    cep,
    setCep,
    isOpen,
    close,
    setQuantity,
    removeItem,
  } = useCart();

  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  const progressPct = Math.min(
    100,
    Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100)
  );

  return (
    <>
      <div
        onClick={close}
        aria-hidden="true"
        className={`fixed inset-0 z-[90] bg-nero/60 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho de compras"
        aria-hidden={!isOpen}
        className={`fixed bottom-0 right-0 top-0 z-[95] flex w-full max-w-md flex-col bg-crema text-nero shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "invisible translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-nero/10 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-champagne-deep" />
            <h2 className="font-display text-2xl font-semibold">Seu Carrinho</h2>
            {count > 0 && (
              <span className="rounded-full bg-champagne/25 px-2.5 py-0.5 text-xs font-bold text-nero">
                {count} {count === 1 ? "item" : "itens"}
              </span>
            )}
          </div>
          <button
            onClick={close}
            aria-label="Fechar carrinho"
            className="rounded-md p-2 text-nero/70 transition-colors hover:bg-nero/5 hover:text-nero"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Barra de Progresso de Frete Grátis */}
        {items.length > 0 && (
          <div className="border-b border-nero/10 bg-marmo/60 px-6 py-3">
            <div className="flex items-center gap-2 text-xs font-medium text-nero/90">
              <Truck className="h-4 w-4 shrink-0 text-champagne-deep" />
              {freeShippingRemaining === 0 ? (
                <span>
                  Parabéns! Você garantiu <strong className="text-olive">Frete Grátis</strong> nesta compra.
                </span>
              ) : (
                <span>
                  Faltam <strong>{formatBRL(freeShippingRemaining)}</strong> para ganhar{" "}
                  <strong>Frete Grátis</strong>!
                </span>
              )}
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-nero/10">
              <div
                className="h-full rounded-full bg-champagne transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Lista de Itens */}
        <div className="flex-1 overflow-y-auto px-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-marmo">
                <ShoppingBag className="h-8 w-8 text-champagne-deep" />
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-nero">
                  Seu carrinho está vazio
                </p>
                <p className="mt-1 text-sm text-nero/70">
                  Explore nossas panelas e utensílios gourmet para transformar sua cozinha.
                </p>
              </div>
              <Link
                href="/produtos"
                onClick={close}
                className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-md bg-nero px-6 text-xs font-semibold uppercase tracking-wider text-crema transition-colors hover:bg-champagne hover:text-nero"
              >
                Explorar Produtos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-nero/10">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-4 py-4">
                  <Link
                    href={`/produtos/${item.slug}`}
                    onClick={close}
                    className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-nero/10 bg-marmo"
                  >
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <ShoppingBag className="h-6 w-6 text-nero/30" />
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/produtos/${item.slug}`}
                      onClick={close}
                      className="line-clamp-2 text-sm font-semibold text-nero hover:text-champagne-deep"
                    >
                      {item.name}
                    </Link>
                    <div className="mt-1 flex items-baseline justify-between gap-2">
                      <span className="text-xs text-nero/70">
                        Unit.: {formatBRL(item.price)}
                      </span>
                      <span className="text-sm font-bold text-nero">
                        {formatBRL(item.price * item.quantity)}
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between">
                      <div className="flex items-center rounded-md border border-nero/20 bg-crema">
                        <button
                          type="button"
                          aria-label="Diminuir quantidade"
                          onClick={() => setQuantity(item.productId, item.quantity - 1)}
                          className="p-1.5 text-nero/80 transition-colors hover:bg-nero/5 hover:text-nero"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span
                          className="min-w-8 text-center text-xs font-semibold"
                          aria-live="polite"
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Aumentar quantidade"
                          onClick={() => setQuantity(item.productId, item.quantity + 1)}
                          className="p-1.5 text-nero/80 transition-colors hover:bg-nero/5 hover:text-nero"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        aria-label={`Remover ${item.name}`}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-terracotta transition-colors hover:bg-terracotta/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remover</span>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Rodapé com Subtotal, Frete Estimado e Total */}
        {items.length > 0 && (
          <footer className="border-t border-nero/15 bg-marmo/60 px-6 py-5">
            {/* Simulador rápido de CEP */}
            <div className="mb-4 flex items-center gap-2">
              <label htmlFor="cart-cep-input" className="text-xs font-medium text-nero/80">
                Calcular CEP:
              </label>
              <input
                id="cart-cep-input"
                type="text"
                inputMode="numeric"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
                className="h-8 flex-1 rounded-md border border-nero/20 bg-crema px-3 text-xs text-nero placeholder:text-nero/40 focus:border-champagne-deep focus:outline-none"
              />
              {cep.replace(/\D/g, "").length === 8 && (
                <span className="text-[11px] font-medium text-olive">Atualizado</span>
              )}
            </div>

            <div className="space-y-2 border-b border-nero/10 pb-3 text-sm">
              <div className="flex items-center justify-between text-nero/80">
                <span>Subtotal</span>
                <span className="font-medium text-nero">{formatBRL(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-nero/80">
                <span>Frete estimado</span>
                {shipping === 0 ? (
                  <span className="font-semibold text-olive">Grátis</span>
                ) : (
                  <span className="font-medium text-nero">{formatBRL(shipping)}</span>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-sm font-semibold uppercase tracking-wider text-nero">
                Total
              </span>
              <div className="text-right">
                <p className="font-display text-2xl font-semibold text-nero">
                  {formatBRL(total)}
                </p>
                <p className="text-[11px] text-nero/70">
                  ou em até 12x de {formatBRL(total / 12)} sem juros
                </p>
              </div>
            </div>

            <Link
              href="/checkout"
              onClick={close}
              className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-nero px-6 text-sm font-semibold uppercase tracking-wider text-crema transition-colors hover:bg-champagne hover:text-nero"
            >
              <span>Finalizar Compra</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-nero/65">
              <ShieldCheck className="h-3.5 w-3.5 text-champagne-deep" />
              <span>Pagamento 100% seguro via Mercado Pago ou PagSeguro</span>
            </div>
          </footer>
        )}
      </aside>
    </>
  );
}
