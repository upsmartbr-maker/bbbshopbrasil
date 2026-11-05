"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, KeyRound, Lock, Mail, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let accessToken: string | undefined;
      // Tenta autenticar via SDK cliente do Supabase Auth caso configurado
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
        try {
          const { data } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          if (data?.session?.access_token) {
            accessToken = data.session.access_token;
          }
        } catch {
          /* segue para validação na rota /api/admin/auth */
        }
      }

      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          accessToken,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Falha ao autenticar administrador.");
        setLoading(false);
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch {
      setError("Erro de conexão ao validar credenciais.");
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail("admin@bbbshopbrasil.com.br");
    setPassword("admin123");
    setError(null);
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#F8FAFC] px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para a loja pública</span>
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="flex flex-col items-center text-center">
            <Image
              src="/logo.png"
              alt="BBB Shop Brasil"
              width={140}
              height={48}
              className="h-12 w-auto object-contain"
              priority
            />
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Acesso Restrito • Supabase Auth
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              Painel Administrativo
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Entre com suas credenciais para gerenciar catálogo, pedidos e
              gateways de pagamento.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                E-mail Corporativo
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@bbbshopbrasil.com.br"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Senha
              </label>
              <div className="relative mt-1.5">
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="admin-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-slate-800 disabled:opacity-50"
            >
              <Lock className="h-4 w-4" />
              <span>{loading ? "Validando acesso..." : "Entrar no Painel"}</span>
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-slate-200/80 bg-[#F8FAFC] p-3.5 text-center">
            <p className="text-xs text-slate-500">
              Ambiente de avaliação / sem `.env` Supabase configurado:
            </p>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="mt-1.5 text-xs font-semibold text-slate-800 underline decoration-slate-300 underline-offset-4 hover:text-slate-950"
            >
              Preencher acesso rápido (admin@bbbshopbrasil.com.br)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] text-sm text-slate-500">
          Carregando autenticação...
        </div>
      }
    >
      <AdminLoginForm />
    </React.Suspense>
  );
}

