import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MediaFrame } from "@/components/ui/media-frame";

export function Hero() {
  const chef = "/chef-hero.jpg";

  return (
    <section className="bg-gradient-to-b from-marmo/60 to-crema">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-14 lg:grid-cols-2 lg:gap-16 lg:py-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-terracotta">
            Panelas e utensílios gourmet
          </p>
          <h1 className="mt-4 font-display text-5xl font-medium leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
            Design e performance <span className="text-champagne-deep">na sua cozinha</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-nero/85">
            Panelas antiaderentes de alta qualidade, com acabamento elegante e aquecimento uniforme, para transformar
            cada refeição em uma experiência gastronômica.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/#colecoes"
              className="inline-flex min-h-12 items-center gap-2 rounded-md bg-champagne px-8 text-sm font-semibold uppercase tracking-wider text-nero transition hover:brightness-105"
            >
              Conheça nossa linha <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/produtos"
              className="inline-flex min-h-12 items-center rounded-md border border-nero/30 px-8 text-sm font-semibold uppercase tracking-wider hover:border-champagne-deep hover:text-champagne-deep"
            >
              Ver todos os produtos
            </Link>
          </div>
        </div>

        <MediaFrame
          src={chef}
          alt="Chef apresentando as panelas da BBB Shop Brasil"
          priority
          placeholderLabel="Foto do chef — adicione public/chef-hero.jpg"
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="aspect-[4/5] w-full rounded-2xl border border-champagne/30 shadow-xl"
        />
      </div>
    </section>
  );
}

