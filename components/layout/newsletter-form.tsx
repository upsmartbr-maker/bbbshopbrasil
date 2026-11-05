"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

type Status = { kind: "idle" } | { kind: "loading" } | { kind: "ok" } | { kind: "error"; message: string };

export function NewsletterForm() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<Status>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status.kind === "loading") return;
    setStatus({ kind: "loading" });
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setStatus({ kind: "error", message: data.error ?? "Não foi possível concluir o cadastro." });
        return;
      }
      setEmail("");
      setStatus({ kind: "ok" });
    } catch {
      setStatus({ kind: "error", message: "Falha de conexão. Tente novamente." });
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <label htmlFor="newsletter-email" className="sr-only">
        Seu e-mail
      </label>
      <div className="flex gap-2">
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Seu melhor e-mail"
          className="h-11 min-w-0 flex-1 rounded-md border border-crema/30 bg-crema px-4 text-sm text-nero placeholder:text-nero/60 focus:outline-none focus:ring-2 focus:ring-champagne"
        />
        <button
          type="submit"
          disabled={status.kind === "loading"}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-champagne px-5 text-xs font-semibold uppercase tracking-wider text-nero hover:brightness-105 disabled:opacity-70"
        >
          {status.kind === "loading" && <Loader2 className="h-4 w-4 animate-spin" />} Assinar
        </button>
      </div>
      <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm">
        {status.kind === "ok" && <span className="text-[#9be3b4]">Cadastro realizado! Obrigado por assinar.</span>}
        {status.kind === "error" && <span className="text-[#ffb4a2]">{status.message}</span>}
      </p>
    </form>
  );
}

