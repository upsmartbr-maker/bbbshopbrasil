import Image from "next/image";
import { ShieldCheck } from "lucide-react";

export function OfficialBadgeBar() {
  return (
    <aside
      aria-label="Credenciamento Oficial Moncoc"
      className="relative z-10 w-full border-y border-[#C28E46]/40 bg-[#1A1A1A] text-[#FDFBF7] shadow-inner"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-3 px-6 py-3 sm:flex-row sm:gap-6 sm:py-3.5">
        {/* Selo Moncoc com proporção nítida */}
        <div className="relative flex shrink-0 items-center justify-center">
          <Image
            src="/selo.webp"
            alt="Selo de Representante Oficial Moncoc"
            width={160}
            height={56}
            priority
            className="h-12 w-auto object-contain sm:h-14"
          />
        </div>

        {/* Linha divisora sutil para desktop */}
        <div
          aria-hidden="true"
          className="hidden h-8 w-px bg-gradient-to-b from-transparent via-[#C28E46]/60 to-transparent md:block"
        />

        {/* Textos de credenciamento e procedência */}
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#C28E46]" aria-hidden="true" />
            <span className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-[#E5C378] sm:text-sm">
              Representante Oficial Moncoc
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[#E5E5E5]/90 sm:text-sm">
            Produtos 100% originais, com garantia de fábrica e nota fiscal
          </p>
        </div>
      </div>
    </aside>
  );
}
