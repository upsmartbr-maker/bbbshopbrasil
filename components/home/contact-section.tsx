"use client";

import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Mail,
  MessageCircle,
  Send,
  Sparkles,
} from "lucide-react";

export function ContactSection() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMsg("Por favor, preencha nome completo, e-mail e mensagem.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(
          data.error ||
            "Não foi possível enviar sua mensagem. Tente novamente em instantes."
        );
        return;
      }

      setSuccessMsg(
        "Mensagem enviada com sucesso! Entraremos em contacto brevemente."
      );
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
    } catch {
      setErrorMsg(
        "Ocorreu um erro de comunicação ao enviar sua mensagem. Verifique sua conexão e tente novamente."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="contato"
      className="scroll-mt-28 bg-[#FDFBF7] py-16 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Coluna 1: Canais de Atendimento Direto */}
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#C28E46]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Atendimento Exclusivo BBB Shop Brasil</span>
            </div>

            <h2 className="mt-3 font-display text-4xl font-medium leading-tight text-nero md:text-5xl">
              Fale Conosco
            </h2>

            <p className="mt-4 text-base leading-relaxed text-nero/80">
              Tem dúvidas sobre nossas panelas gourmet, revestimento
              antiaderente, formas de pagamento ou prazos de entrega? Nossa
              equipe especializada está pronta para ajudar você a escolher o
              conjunto ideal para a sua cozinha.
            </p>

            <div className="mt-8 space-y-4">
              {/* WhatsApp */}
              <a
                href="https://wa.me/5511984997067"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4 rounded-2xl border border-nero/10 bg-white p-5 shadow-2xs transition hover:border-[#C28E46] hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#C28E46]/15 text-[#9F7130] transition group-hover:bg-[#C28E46] group-hover:text-nero">
                  <MessageCircle className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-nero/60">
                    WhatsApp Direto
                  </p>
                  <p className="mt-1 font-display text-xl font-semibold text-nero group-hover:text-[#9F7130]">
                    +55 11 98499-7067
                  </p>
                  <p className="mt-0.5 text-xs text-nero/70">
                    Clique para iniciar uma conversa imediata no WhatsApp
                  </p>
                </div>
              </a>

              {/* E-mail */}
              <a
                href="mailto:bbbshopbrasil@gmail.com"
                className="group flex items-start gap-4 rounded-2xl border border-nero/10 bg-white p-5 shadow-2xs transition hover:border-[#C28E46] hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#C28E46]/15 text-[#9F7130] transition group-hover:bg-[#C28E46] group-hover:text-nero">
                  <Mail className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-nero/60">
                    E-mail Oficial
                  </p>
                  <p className="mt-1 break-all font-display text-xl font-semibold text-nero group-hover:text-[#9F7130]">
                    bbbshopbrasil@gmail.com
                  </p>
                  <p className="mt-0.5 text-xs text-nero/70">
                    Envie solicitações, pedidos e parcerias comerciais
                  </p>
                </div>
              </a>

              {/* Horário de Atendimento Comercial */}
              <div className="flex items-start gap-4 rounded-2xl border border-nero/10 bg-white p-5 shadow-2xs">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#C28E46]/15 text-[#9F7130]">
                  <Clock className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-nero/60">
                    Horário de Atendimento Comercial
                  </p>
                  <p className="mt-1 font-display text-xl font-semibold text-nero">
                    Seg. a Sex. das 08h às 18h
                  </p>
                  <p className="mt-0.5 text-xs text-nero/70">
                    Exceto feriados nacionais (horário de Brasília)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna 2: Formulário Funcional */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-[#C28E46]/30 bg-white p-6 shadow-lg sm:p-10">
              <h3 className="font-display text-2xl font-medium text-nero sm:text-3xl">
                Envie sua mensagem
              </h3>
              <p className="mt-1.5 text-sm text-nero/75">
                Preencha os campos abaixo e retornaremos o seu contato o mais
                breve possível.
              </p>

              {successMsg && (
                <div
                  role="status"
                  className="mt-6 flex items-start gap-3 rounded-xl border border-[#C28E46] bg-[#FDFBF7] p-4 text-sm font-medium text-nero shadow-xs"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#C28E46]" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div
                  role="alert"
                  className="mt-6 flex items-start gap-3 rounded-xl border border-terracotta/40 bg-terracotta/10 p-4 text-sm font-medium text-terracotta"
                >
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-semibold uppercase tracking-wider text-nero/80"
                    >
                      Nome completo *
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome completo"
                      className="mt-1.5 h-12 w-full rounded-xl border border-nero/15 bg-[#FDFBF7] px-4 text-sm text-nero placeholder:text-nero/45 focus:border-[#C28E46] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C28E46]/35"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-semibold uppercase tracking-wider text-nero/80"
                    >
                      E-mail *
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com.br"
                      className="mt-1.5 h-12 w-full rounded-xl border border-nero/15 bg-[#FDFBF7] px-4 text-sm text-nero placeholder:text-nero/45 focus:border-[#C28E46] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C28E46]/35"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contact-phone"
                      className="block text-xs font-semibold uppercase tracking-wider text-nero/80"
                    >
                      Telefone / WhatsApp *
                    </label>
                    <input
                      id="contact-phone"
                      name="phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(11) 98499-7067"
                      className="mt-1.5 h-12 w-full rounded-xl border border-nero/15 bg-[#FDFBF7] px-4 text-sm text-nero placeholder:text-nero/45 focus:border-[#C28E46] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C28E46]/35"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-subject"
                      className="block text-xs font-semibold uppercase tracking-wider text-nero/80"
                    >
                      Assunto *
                    </label>
                    <input
                      id="contact-subject"
                      name="subject"
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Ex.: Dúvida sobre conjunto de panelas"
                      className="mt-1.5 h-12 w-full rounded-xl border border-nero/15 bg-[#FDFBF7] px-4 text-sm text-nero placeholder:text-nero/45 focus:border-[#C28E46] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C28E46]/35"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-xs font-semibold uppercase tracking-wider text-nero/80"
                  >
                    Mensagem *
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escreva como podemos ajudar você..."
                    className="mt-1.5 w-full rounded-xl border border-nero/15 bg-[#FDFBF7] p-4 text-sm text-nero placeholder:text-nero/45 focus:border-[#C28E46] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C28E46]/35"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#C28E46] px-8 text-xs font-semibold uppercase tracking-wider text-[#141311] shadow-xs transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  <Send className="h-4 w-4" />
                  <span>{submitting ? "A enviar..." : "Enviar Mensagem"}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

