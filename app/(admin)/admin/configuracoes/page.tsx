"use client";

import * as React from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  KeyRound,
  Save,
  ShieldCheck,
  Webhook,
} from "lucide-react";
import type { GatewayName, Settings } from "@/types/database";

export default function AdminSettingsPage() {
  const [activeGateway, setActiveGateway] =
    React.useState<GatewayName>("mercadopago");

  // Credenciais Mercado Pago
  const [mpAccessToken, setMpAccessToken] = React.useState("");
  const [mpPublicKey, setMpPublicKey] = React.useState("");
  const [showMpSecret, setShowMpSecret] = React.useState(false);

  // Credenciais PagSeguro
  const [psToken, setPsToken] = React.useState("");
  const [psEmail, setPsEmail] = React.useState("");
  const [psAppId, setPsAppId] = React.useState("");
  const [psAppKey, setPsAppKey] = React.useState("");
  const [showPsSecret, setShowPsSecret] = React.useState(false);

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [copiedWebhook, setCopiedWebhook] = React.useState<string | null>(null);

  const fetchSettings = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { ok: boolean; settings: Settings };
        if (data?.settings) {
          setActiveGateway(data.settings.active_gateway || "mercadopago");
          setMpAccessToken(data.settings.mp_access_token ?? "");
          setMpPublicKey(data.settings.mp_public_key ?? "");
          setPsToken(data.settings.pagseguro_token ?? "");
          setPsEmail(data.settings.pagseguro_email ?? "");
          setPsAppId(data.settings.pagseguro_app_id ?? "");
          setPsAppKey(data.settings.pagseguro_app_key ?? "");
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          active_gateway: activeGateway,
          mp_access_token: mpAccessToken.trim() || null,
          mp_public_key: mpPublicKey.trim() || null,
          pagseguro_token: psToken.trim() || null,
          pagseguro_email: psEmail.trim() || null,
          pagseguro_app_id: psAppId.trim() || null,
          pagseguro_app_key: psAppKey.trim() || null,
        }),
      });

      if (res.ok) {
        setFeedback(
          `Configurações salvas! O gateway ativo no checkout agora é ${
            activeGateway === "pagseguro"
              ? "PagSeguro (PagBank)"
              : "Mercado Pago"
          }.`
        );
        setTimeout(() => setFeedback(null), 4000);
      }
    } finally {
      setSaving(false);
    }
  };

  const copyWebhookUrl = async (path: string) => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://bbbshopbrasil.com.br";
    try {
      await navigator.clipboard.writeText(`${origin}${path}`);
      setCopiedWebhook(path);
      setTimeout(() => setCopiedWebhook(null), 2500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Configurações de Pagamento
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Defina o gateway preferencial que governa o checkout da loja e
          configure as credenciais do Mercado Pago e PagSeguro.
        </p>
      </div>

      {feedback && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-2xs"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          Carregando configurações do banco de dados...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-8">
          {/* 1. Seletor de Ativação do Gateway Preferencial */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Gateway Preferencial do Checkout
                </h2>
                <p className="text-xs text-slate-500">
                  Selecione qual provedor processará as compras de Pix e Cartão
                  de Crédito em `/api/checkout`.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setActiveGateway("mercadopago")}
                className={`flex items-start justify-between rounded-2xl border p-5 text-left transition-all ${
                  activeGateway === "mercadopago"
                    ? "border-slate-900 bg-[#F8FAFC] ring-2 ring-slate-900"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900">
                      Mercado Pago
                    </span>
                    {activeGateway === "mercadopago" && (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                        Ativo no Checkout
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    SDK Oficial do Mercado Pago • Suporte a Pix Transparente,
                    Cartão de Crédito e Checkout Pro em até 12x.
                  </p>
                </div>
                <span
                  className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    activeGateway === "mercadopago"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {activeGateway === "mercadopago" && (
                    <Check className="h-3 w-3" />
                  )}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveGateway("pagseguro")}
                className={`flex items-start justify-between rounded-2xl border p-5 text-left transition-all ${
                  activeGateway === "pagseguro"
                    ? "border-slate-900 bg-[#F8FAFC] ring-2 ring-slate-900"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900">
                      PagSeguro (PagBank API v4)
                    </span>
                    {activeGateway === "pagseguro" && (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                        Ativo no Checkout
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    PagBank Orders & Checkouts API v4 • Suporte a QR Code Pix e
                    Cartão de Crédito em até 12x.
                  </p>
                </div>
                <span
                  className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    activeGateway === "pagseguro"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {activeGateway === "pagseguro" && (
                    <Check className="h-3 w-3" />
                  )}
                </span>
              </button>
            </div>
          </section>

          {/* 2. Cards de Credenciais: Mercado Pago & PagSeguro */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Card Mercado Pago */}
            <section className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                      <KeyRound className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Credenciais Mercado Pago
                      </h3>
                      <p className="text-xs text-slate-500">
                        Chaves de Produção ou Teste do painel Mercado Pago
                        Developers
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMpSecret((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-[#F8FAFC] px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                  >
                    {showMpSecret ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" />
                        <span>Ocultar</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        <span>Mostrar</span>
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Public Key (`mp_public_key`)
                  </label>
                  <input
                    type="text"
                    value={mpPublicKey}
                    onChange={(e) => setMpPublicKey(e.target.value)}
                    placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 font-mono text-xs text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Access Token (`mp_access_token`)
                  </label>
                  <input
                    type={showMpSecret ? "text" : "password"}
                    value={mpAccessToken}
                    onChange={(e) => setMpAccessToken(e.target.value)}
                    placeholder="APP_USR-0000000000000000-000000-xxxxxxxxxxxxxxxx"
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 font-mono text-xs text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-slate-200 bg-[#F8FAFC] p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <Webhook className="h-3.5 w-3.5 text-slate-500" />
                    <span>Endpoint de Webhook:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyWebhookUrl("/api/webhooks/mercadopago")}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-950"
                  >
                    {copiedWebhook === "/api/webhooks/mercadopago" ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copiar URL</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="mt-1 truncate font-mono text-[11px] text-slate-500">
                  /api/webhooks/mercadopago
                </p>
              </div>
            </section>

            {/* Card PagSeguro */}
            <section className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                      <KeyRound className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Credenciais PagSeguro (PagBank)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Token, E-mail e Chaves de Aplicação da API v4
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPsSecret((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-[#F8FAFC] px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                  >
                    {showPsSecret ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" />
                        <span>Ocultar</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        <span>Mostrar</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      E-mail da Conta (`pagseguro_email`)
                    </label>
                    <input
                      type="email"
                      value={psEmail}
                      onChange={(e) => setPsEmail(e.target.value)}
                      placeholder="financeiro@bbbshopbrasil.com.br"
                      className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 text-sm text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Token Bearer PagBank (`pagseguro_token`)
                    </label>
                    <input
                      type={showPsSecret ? "text" : "password"}
                      value={psToken}
                      onChange={(e) => setPsToken(e.target.value)}
                      placeholder="Token de integração PagBank v4"
                      className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 font-mono text-xs text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      App ID (`pagseguro_app_id`)
                    </label>
                    <input
                      type="text"
                      value={psAppId}
                      onChange={(e) => setPsAppId(e.target.value)}
                      placeholder="app0000000000"
                      className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 font-mono text-xs text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      App Key (`pagseguro_app_key`)
                    </label>
                    <input
                      type={showPsSecret ? "text" : "password"}
                      value={psAppKey}
                      onChange={(e) => setPsAppKey(e.target.value)}
                      placeholder="Chave de aplicação"
                      className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 font-mono text-xs text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-slate-200 bg-[#F8FAFC] p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <Webhook className="h-3.5 w-3.5 text-slate-500" />
                    <span>Endpoint de Webhook:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyWebhookUrl("/api/webhooks/pagseguro")}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-950"
                  >
                    {copiedWebhook === "/api/webhooks/pagseguro" ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copiar URL</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="mt-1 truncate font-mono text-[11px] text-slate-500">
                  /api/webhooks/pagseguro
                </p>
              </div>
            </section>
          </div>

          {/* Rodapé de Salvamento */}
          <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-2xs sm:flex-row">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>
                As credenciais são armazenadas na tabela <code>settings</code>{" "}
                do Supabase protegidas por RLS.
              </span>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-slate-800 disabled:opacity-50 sm:w-auto"
            >
              <Save className="h-4 w-4" />
              <span>
                {saving ? "Salvando Configurações..." : "Salvar Configurações"}
              </span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

