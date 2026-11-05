import Image from "next/image";
import Link from "next/link";
import { CreditCard, Lock, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { NAV_LINKS, SITE, waLink } from "@/lib/site";

export function Footer() {
  return (
    <footer id="contato" className="scroll-mt-28 bg-nero text-crema">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Image src="/logo.png" alt="BBB Shop Brasil" width={120} height={80} className="h-20 w-auto rounded-md bg-crema p-1" />
          <p className="mt-4 text-base leading-relaxed text-crema/85">
            {SITE.tagline}. Panelas e utensílios gourmet de alta qualidade, com entrega para todo o Brasil.
          </p>
        </div>

        <nav aria-label="Links úteis">
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-champagne">Links úteis</h2>
          <ul className="mt-5 space-y-3 text-base">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-crema/90 hover:text-champagne">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-champagne">Atendimento</h2>
          <ul className="mt-5 space-y-4 text-base">
            <li>
              <a href={waLink()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-crema/90 hover:text-champagne">
                <MessageCircle className="h-5 w-5 shrink-0 text-champagne" aria-hidden="true" />
                <span>WhatsApp {SITE.whatsappDisplay}</span>
              </a>
            </li>
            <li>
              <a href={`mailto:${SITE.email}`} className="flex items-center gap-3 break-all text-crema/90 hover:text-champagne">
                <Mail className="h-5 w-5 shrink-0 text-champagne" aria-hidden="true" />
                <span>{SITE.email}</span>
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-champagne">Newsletter</h2>
          <p className="mb-4 mt-5 text-base text-crema/85">Receba novidades e ofertas exclusivas.</p>
          <NewsletterForm />
        </div>
      </div>

      <div className="border-t border-crema/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 text-sm text-crema/80 md:flex-row md:items-center md:justify-between">
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2" aria-label="Segurança e pagamento">
            <li className="flex items-center gap-2"><Lock className="h-4 w-4 text-champagne" aria-hidden="true" /> Site seguro (SSL)</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-champagne" aria-hidden="true" /> Compra protegida</li>
            <li className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-champagne" aria-hidden="true" /> Pix, cartão e boleto</li>
          </ul>
          <p>© {new Date().getFullYear()} {SITE.name}. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
