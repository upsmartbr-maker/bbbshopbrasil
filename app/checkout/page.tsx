"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  Lock,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import type {
  PaymentGateway,
  PaymentMethodChoice,
  PaymentPreferenceResult,
} from "@/lib/payments/types";
import { formatBRL } from "@/lib/utils";

interface CheckoutApiResponse {
  ok: boolean;
  error?: string;
  orderId: string;
  gateway: PaymentGateway;
  subtotal: number;
  shipping: number;
  total: number;
  preference: PaymentPreferenceResult;
}

function formatCpf(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

function formatPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const {
    items,
    subtotal,
    shipping,
    total,
    cep,
    setCep,
    clear,
    hydrated,
  } = useCart();

  const [activeGateway, setActiveGateway] =
    React.useState<PaymentGateway>("mercadopago");
  const [paymentMethod, setPaymentMethod] =
    React.useState<PaymentMethodChoice>("pix");

  // Dados do cliente
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [cpf, setCpf] = React.useState("");

  // Endereço
  const [street, setStreet] = React.useState("");
  const [number, setNumber] = React.useState("");
  const [complement, setComplement] = React.useState("");
  const [neighborhood, setNeighborhood] = React.useState("");
  const [city, setCity] = React.useState("");
  const [stateUf, setStateUf] = React.useState("");
  const [loadingCep, setLoadingCep] = React.useState(false);

  // Dados de cartão (para checkout transparente ou preferência parcelada)
  const [cardHolder, setCardHolder] = React.useState("");
  const [cardNumber, setCardNumber] = React.useState("");
  const [cardExpiry, setCardExpiry] = React.useState("");
  const [cardCvv, setCardCvv] = React.useState("");
  const [installments, setInstallments] = React.useState(1);

  // Submissão e resultado
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [orderResult, setOrderResult] =
    React.useState<CheckoutApiResponse | null>(null);
  const [copiedPix, setCopiedPix] = React.useState(false);

  // Consulta qual gateway está ativo na tabela settings
  React.useEffect(() => {
    let active = true;
    fetch("/api/checkout")
      .then((r) => r.json())
      .then((data) => {
        if (active && data?.activeGateway) {
          setActiveGateway(data.activeGateway);
        }
      })
      .catch(() => {
        /* mantém fallback */
      });
    return () => {
      active = false;
    };
  }, []);

  // Auto-preenchimento de endereço via ViaCEP quando CEP completa 8 dígitos
  React.useEffect(() => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    let active = true;
    setLoadingCep(true);
    fetch(`https://viacep.com.br/ws/${digits}/json/`)
      .then((r) => r.json())
      .then((data) => {
        if (!active || data?.erro) return;
        if (data.logradouro) setStreet(data.logradouro);
        if (data.bairro) setNeighborhood(data.bairro);
        if (data.localidade) setCity(data.localidade);
        if (data.uf) setStateUf(data.uf);
      })
      .catch(() => {
        /* ignore */
      })
      .finally(() => {
        if (active) setLoadingCep(false);
      });
    return () => {
      active = false;
    };
  }, [cep]);

  const handleCopyPix = async () => {
    const code = orderResult?.preference.pix?.qrCodeText;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 3000);
    } catch {
      /* ignore */
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);

    if (items.length === 0) {
      setErrorMsg("Seu carrinho está vazio.");
      return;
    }

    setSubmitting(true);
    try {
      const cardDigits = cardNumber.replace(/\D/g, "");
      const hasCardFilled =
        paymentMethod === "credit_card" &&
        cardDigits.length >= 13 &&
        cardHolder.trim().length >= 3 &&
        cardCvv.trim().length >= 3;

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name,
            email,
            phone,
            cpf,
            address: {
              cep,
              street,
              number,
              complement,
              neighborhood,
              city,
              state: stateUf,
            },
          },
          cep,
          paymentMethod,
          card:
            paymentMethod === "credit_card"
              ? {
                  token: hasCardFilled
                    ? `tok_${cardDigits.slice(-4)}_${Date.now()}`
                    : undefined,
                  holderName: cardHolder || name,
                  installments,
                }
              : undefined,
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
        }),
      });

      const data = (await res.json()) as CheckoutApiResponse;
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "Não foi possível processar seu pedido.");
        setSubmitting(false);
        return;
      }

      setOrderResult(data);
      clear();

      // Se o gateway retornou um link externo de redirect (Checkout Pro / PagBank Checkout) sem QR transparente
      if (
        data.preference.mode === "redirect" &&
        data.preference.checkoutUrl &&
        data.preference.checkoutUrl.startsWith("http") &&
        !data.preference.checkoutUrl.includes("/checkout?pedido=")
      ) {
        window.location.href = data.preference.checkoutUrl;
      }
    } catch {
      setErrorMsg("Erro de conexão ao finalizar o pedido. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const returnOrderId = searchParams.get("pedido");
  const returnStatus = searchParams.get("status");
  const returnGateway = searchParams.get("gateway");

  // Tela de Pedido Criado / QR Code Pix / Retorno de Gateway
  if (orderResult) {
    const { orderId, gateway, preference } = orderResult;
    const gatewayLabel =
      gateway === "pagseguro" ? "PagSeguro (PagBank)" : "Mercado Pago";

    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-xl border border-nero/15 bg-marmo/40 p-6 shadow-sm sm:p-10">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-olive/15 text-olive">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <span className="mt-4 rounded-full bg-champagne/25 px-3 py-1 text-xs font-bold uppercase tracking-widest text-champagne-deep">
              Pedido #{orderId.slice(0, 8).toUpperCase()}
            </span>
            <h1 className="mt-3 font-display text-3xl font-semibold text-nero sm:text-4xl">
              {preference.status === "approved"
                ? "Pagamento Aprovado!"
                : "Pedido Recebido com Sucesso!"}
            </h1>
            <p className="mt-2 max-w-lg text-sm text-nero/80">
              Processado via <strong>{gatewayLabel}</strong>. Enviamos os detalhes
              para <strong>{email}</strong>.
            </p>
          </div>

          {/* Bloco Pix Transparente */}
          {preference.pix && (
            <div className="mt-8 rounded-lg border border-nero/15 bg-crema p-6">
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-champagne-deep">
                  <QrCode className="h-4 w-4" />
                  <span>Escaneie o QR Code Pix</span>
                </div>
                <p className="mt-1 text-xs text-nero/70">
                  Abra o aplicativo do seu banco e escaneie o código abaixo ou use o
                  Pix Copia e Cola.
                </p>

                <div className="my-5 flex h-56 w-56 items-center justify-center overflow-hidden rounded-lg border border-nero/15 bg-white p-3 shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preference.pix.qrCodeBase64}
                    alt="QR Code Pix do Pedido"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="w-full max-w-md">
                  <label
                    htmlFor="pix-copy-paste"
                    className="block text-left text-xs font-semibold uppercase tracking-wider text-nero/75"
                  >
                    Código Pix Copia e Cola
                  </label>
                  <div className="mt-1.5 flex gap-2">
                    <input
                      id="pix-copy-paste"
                      type="text"
                      readOnly
                      value={preference.pix.qrCodeText}
                      className="h-11 flex-1 rounded-md border border-nero/20 bg-marmo/50 px-3 font-mono text-xs text-nero focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopyPix}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-nero px-4 text-xs font-semibold uppercase tracking-wider text-crema transition-colors hover:bg-champagne hover:text-nero"
                    >
                      {copiedPix ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Link para ambiente externo do gateway se disponível */}
          {preference.checkoutUrl &&
            preference.checkoutUrl.startsWith("http") &&
            !preference.checkoutUrl.includes("/checkout?pedido=") && (
              <div className="mt-6 text-center">
                <a
                  href={preference.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center gap-2 rounded-md bg-champagne px-6 text-xs font-semibold uppercase tracking-wider text-nero transition-colors hover:bg-champagne-deep hover:text-crema"
                >
                  <span>Abrir Ambiente Seguro {gatewayLabel}</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-nero/10 pt-6 text-sm">
            <div>
              <span className="text-nero/70">Total do pedido: </span>
              <strong className="font-display text-xl text-nero">
                {formatBRL(orderResult.total)}
              </strong>
            </div>
            <Link
              href="/produtos"
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-nero/25 px-5 text-xs font-semibold uppercase tracking-wider text-nero transition-colors hover:bg-nero hover:text-crema"
            >
              <span>Voltar à Loja</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Caso o cliente retorne de um redirect do Mercado Pago / PagSeguro com ?pedido=...
  if (returnOrderId && items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <div className="rounded-xl border border-nero/15 bg-marmo/40 p-8">
          <CheckCircle2 className="mx-auto h-12 w-12 text-olive" />
          <h1 className="mt-4 font-display text-3xl font-semibold text-nero">
            Pedido #{returnOrderId.slice(0, 8).toUpperCase()}
          </h1>
          <p className="mt-2 text-sm text-nero/80">
            Status atual:{" "}
            <strong className="uppercase">{returnStatus || "Em processamento"}</strong>{" "}
            ({returnGateway === "pagseguro" ? "PagSeguro" : "Mercado Pago"}).
          </p>
          <Link
            href="/produtos"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md bg-nero px-6 text-xs font-semibold uppercase tracking-wider text-crema hover:bg-champagne hover:text-nero"
          >
            Continuar Comprando
          </Link>
        </div>
      </div>
    );
  }

  if (hydrated && items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <ShoppingBag className="mx-auto h-12 w-12 text-champagne-deep" />
        <h1 className="mt-4 font-display text-3xl font-semibold text-nero">
          Seu carrinho está vazio
        </h1>
        <p className="mt-2 text-sm text-nero/75">
          Adicione suas panelas e utensílios gourmet favoritos antes de finalizar a
          compra.
        </p>
        <Link
          href="/produtos"
          className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-md bg-nero px-6 text-xs font-semibold uppercase tracking-wider text-crema hover:bg-champagne hover:text-nero"
        >
          Ver Catálogo Completo
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/produtos"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-nero/70 hover:text-nero"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Continuar comprando</span>
          </Link>
          <h1 className="mt-2 font-display text-3xl font-semibold text-nero sm:text-4xl">
            Finalizar Compra
          </h1>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-nero/15 bg-marmo px-4 py-2 text-xs font-medium text-nero">
          <Lock className="h-3.5 w-3.5 text-champagne-deep" />
          <span>
            Gateway ativo:{" "}
            <strong className=" uppercase text-champagne-deep">
              {activeGateway === "pagseguro" ? "PagSeguro (PagBank)" : "Mercado Pago"}
            </strong>
          </span>
        </div>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mb-6 rounded-md border border-terracotta/40 bg-terracotta/10 px-4 py-3 text-sm font-medium text-terracotta"
        >
          {errorMsg}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-8 lg:grid-cols-12"
      >
        {/* Coluna Esquerda: Dados Pessoais, Endereço e Pagamento */}
        <div className="space-y-8 lg:col-span-7">
          {/* 1. Dados Pessoais */}
          <section className="rounded-xl border border-nero/10 bg-marmo/35 p-6">
            <h2 className="font-display text-2xl font-semibold text-nero">
              1. Identificação do Cliente
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-nero/80">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: Maria Helena Oliveira"
                  className="mt-1.5 h-11 w-full rounded-md border border-nero/20 bg-crema px-3.5 text-sm text-nero focus:border-champagne-deep focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-nero/80">
                  E-mail *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com.br"
                  className="mt-1.5 h-11 w-full rounded-md border border-nero/20 bg-crema px-3.5 text-sm text-nero focus:border-champagne-deep focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-nero/80">
                  WhatsApp / Telefone *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(11) 98499-7067"
                  className="mt-1.5 h-11 w-full rounded-md border border-nero/20 bg-crema px-3.5 text-sm text-nero focus:border-champagne-deep focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-nero/80">
                  CPF (para emissão de Nota Fiscal e Pix) *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={cpf}
                  onChange={(e) => setCpf(formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  className="mt-1.5 h-11 w-full rounded-md border border-nero/20 bg-crema px-3.5 text-sm text-nero focus:border-champagne-deep focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* 2. Endereço de Entrega */}
          <section className="rounded-xl border border-nero/10 bg-marmo/35 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold text-nero">
                2. Endereço de Entrega
              </h2>
              {loadingCep && (
                <span className="text-xs font-medium text-champagne-deep">
                  Buscando CEP...
                </span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-nero/80">
                  CEP *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  placeholder="00000-000"
                  maxLength={9}
                  className="mt-1.5 h-11 w-full rounded-md border border-nero/20 bg-crema px-3.5 text-sm text-nero focus:border-champagne-deep focus:outline-none"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-nero/80">
                  Rua / Logradouro *
                </label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Av. Paulista"
                  className="mt-1.5 h-11 w-full rounded-md border border-nero/20 bg-crema px-3.5 text-sm text-nero focus:border-champagne-deep focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-nero/80">
                  Número *
                </label>
                <input
                  type="text"
                  required
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="1000"
                  className="mt-1.5 h-11 w-full rounded-md border border-nero/20 bg-crema px-3.5 text-sm text-nero focus:border-champagne-deep focus:outline-none"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-nero/80">
                  Complemento (opcional)
                </label>
                <input
                  type="text"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  placeholder="Apto 42, Bloco B"
                  className="mt-1.5 h-11 w-full rounded-md border border-nero/20 bg-crema px-3.5 text-sm text-nero focus:border-champagne-deep focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-nero/80">
                  Bairro *
                </label>
                <input
                  type="text"
                  required
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Bela Vista"
                  className="mt-1.5 h-11 w-full rounded-md border border-nero/20 bg-crema px-3.5 text-sm text-nero focus:border-champagne-deep focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-nero/80">
                  Cidade *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="São Paulo"
                  className="mt-1.5 h-11 w-full rounded-md border border-nero/20 bg-crema px-3.5 text-sm text-nero focus:border-champagne-deep focus:outline-none"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-nero/80">
                  UF *
                </label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  value={stateUf}
                  onChange={(e) => setStateUf(e.target.value.toUpperCase())}
                  placeholder="SP"
                  className="mt-1.5 h-11 w-full rounded-md border border-nero/20 bg-crema px-3 text-center text-sm uppercase text-nero focus:border-champagne-deep focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* 3. Forma de Pagamento */}
          <section className="rounded-xl border border-nero/10 bg-marmo/35 p-6">
            <h2 className="font-display text-2xl font-semibold text-nero">
              3. Método de Pagamento
            </h2>
            <p className="mt-1 text-xs text-nero/70">
              Processamento integrado via{" "}
              <strong>
                {activeGateway === "pagseguro"
                  ? "PagSeguro (API v4 PagBank)"
                  : "Mercado Pago"}
              </strong>
              .
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("pix")}
                className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-all ${
                  paymentMethod === "pix"
                    ? "border-champagne-deep bg-champagne/15 ring-1 ring-champagne-deep"
                    : "border-nero/15 bg-crema hover:border-nero/35"
                }`}
              >
                <QrCode className="h-6 w-6 shrink-0 text-champagne-deep" />
                <div>
                  <p className="text-sm font-semibold text-nero">Pix Instantâneo</p>
                  <p className="text-xs text-nero/70">
                    QR Code + Copia e Cola com aprovação imediata
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("credit_card")}
                className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-all ${
                  paymentMethod === "credit_card"
                    ? "border-champagne-deep bg-champagne/15 ring-1 ring-champagne-deep"
                    : "border-nero/15 bg-crema hover:border-nero/35"
                }`}
              >
                <CreditCard className="h-6 w-6 shrink-0 text-champagne-deep" />
                <div>
                  <p className="text-sm font-semibold text-nero">
                    Cartão de Crédito
                  </p>
                  <p className="text-xs text-nero/70">
                    Em até 12x sem juros de {formatBRL(total / 12)}
                  </p>
                </div>
              </button>
            </div>

            {paymentMethod === "credit_card" && (
              <div className="mt-5 grid grid-cols-1 gap-4 rounded-lg border border-nero/10 bg-crema p-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-nero/80">
                    Nome impresso no cartão
                  </label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    placeholder="COMO ESTÁ NO CARTÃO"
                    className="mt-1 h-11 w-full rounded-md border border-nero/20 bg-white px-3.5 text-sm uppercase text-nero focus:border-champagne-deep focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-nero/80">
                    Número do Cartão
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardNumber}
                    onChange={(e) =>
                      setCardNumber(
                        e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 16)
                          .replace(/(\d{4})(?=\d)/g, "$1 ")
                      )
                    }
                    placeholder="0000 0000 0000 0000"
                    className="mt-1 h-11 w-full rounded-md border border-nero/20 bg-white px-3.5 text-sm text-nero focus:border-champagne-deep focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-nero/80">
                    Validade (MM/AA)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardExpiry}
                    onChange={(e) => {
                      const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setCardExpiry(
                        d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
                      );
                    }}
                    placeholder="12/30"
                    className="mt-1 h-11 w-full rounded-md border border-nero/20 bg-white px-3.5 text-sm text-nero focus:border-champagne-deep focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-nero/80">
                    CVV
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) =>
                      setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    placeholder="123"
                    className="mt-1 h-11 w-full rounded-md border border-nero/20 bg-white px-3.5 text-sm text-nero focus:border-champagne-deep focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-nero/80">
                    Parcelamento sem juros
                  </label>
                  <select
                    value={installments}
                    onChange={(e) => setInstallments(Number(e.target.value))}
                    className="mt-1 h-11 w-full rounded-md border border-nero/20 bg-white px-3.5 text-sm text-nero focus:border-champagne-deep focus:outline-none"
                  >
                    {Array.from({ length: 12 }, (_, idx) => idx + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}x de {formatBRL(total / n)} sem juros (Total:{" "}
                        {formatBRL(total)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Coluna Direita: Resumo do Pedido */}
        <div className="lg:col-span-5">
          <div className="sticky top-28 rounded-xl border border-nero/15 bg-marmo/60 p-6">
            <h2 className="font-display text-2xl font-semibold text-nero">
              Resumo do Pedido
            </h2>

            <ul className="mt-4 max-h-80 divide-y divide-nero/10 overflow-y-auto pr-1">
              {items.map((item) => (
                <li
                  key={item.productId}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-nero">{item.name}</p>
                    <p className="text-xs text-nero/70">
                      Qtd: {item.quantity} × {formatBRL(item.price)}
                    </p>
                  </div>
                  <span className="font-semibold text-nero">
                    {formatBRL(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 space-y-2 border-t border-nero/10 pt-4 text-sm">
              <div className="flex items-center justify-between text-nero/80">
                <span>Subtotal</span>
                <span className="font-medium text-nero">{formatBRL(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-nero/80">
                <span className="flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-champagne-deep" />
                  <span>Frete estimado</span>
                </span>
                {shipping === 0 ? (
                  <span className="font-semibold text-olive">Grátis</span>
                ) : (
                  <span className="font-medium text-nero">{formatBRL(shipping)}</span>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between border-t border-nero/15 pt-4">
              <span className="text-base font-bold uppercase tracking-wider text-nero">
                Total
              </span>
              <div className="text-right">
                <p className="font-display text-3xl font-semibold text-nero">
                  {formatBRL(total)}
                </p>
                <p className="text-xs text-nero/70">
                  em até 12x de {formatBRL(total / 12)} sem juros
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-nero px-6 text-sm font-semibold uppercase tracking-wider text-crema transition-colors hover:bg-champagne hover:text-nero disabled:opacity-50"
            >
              <Lock className="h-4 w-4" />
              <span>
                {submitting
                  ? "Processando Pagamento..."
                  : paymentMethod === "pix"
                    ? "Gerar QR Code Pix"
                    : "Finalizar Pagamento"}
              </span>
            </button>

            <div className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-nero/70">
              <ShieldCheck className="h-4 w-4 shrink-0 text-champagne-deep" />
              <span>
                Ambiente criptografado • Dados protegidos pelo{" "}
                {activeGateway === "pagseguro" ? "PagSeguro" : "Mercado Pago"}
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <React.Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-nero/70">
          Carregando checkout seguro...
        </div>
      }
    >
      <CheckoutContent />
    </React.Suspense>
  );
}

