import { CheckCircle2 } from "lucide-react";
import { MediaFrame } from "@/components/ui/media-frame";
import { publicAsset } from "@/lib/assets";

const points = [
  "Revestimento antiaderente de alta resistência, que dispensa excesso de óleo",
  "Fundo triplo para aquecimento uniforme e melhor retenção de calor",
  "Acabamento elegante que vai do fogão direto para a mesa",
  "Compatíveis com gás, elétrico e indução",
];

export function AboutBrand() {
  const chef = publicAsset("chef-sobre.jpg");

  return (
    <section id="sobre" className="scroll-mt-28 bg-marmo/50 py-16 lg:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-20">
        <MediaFrame
          src={chef}
          alt="Chef da BBB Shop Brasil de avental, com uma panela nas mãos"
          placeholderLabel="Foto do chef — adicione public/chef-sobre.jpg"
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="aspect-[4/5] w-full rounded-2xl border border-champagne/30 shadow-lg"
        />

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-terracotta">Sobre a marca</p>
          <h2 className="mt-3 font-display text-4xl font-medium leading-tight md:text-5xl">
            Cozinhar é um ritual. Servir é uma arte.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-nero/85">
            A BBB Shop Brasil nasceu da paixão pela boa mesa e por uma cozinha mais saudável e colorida. Selecionamos
            panelas e utensílios gourmet que unem design, durabilidade e desempenho, para que cada preparo seja mais
            prático e cada refeição, mais especial.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-nero/85">
            Nosso foco é a experiência gastronômica: materiais antiaderentes de qualidade, que preservam o sabor dos
            alimentos e facilitam a limpeza no dia a dia.
          </p>
          <ul className="mt-8 space-y-3">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-base">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-champagne-deep" aria-hidden="true" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

