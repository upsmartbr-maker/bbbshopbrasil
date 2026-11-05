import { CreditCard, Headset, ShieldCheck, Truck } from "lucide-react";

const items = [
  { icon: ShieldCheck, title: "Compra Segura", text: "Ambiente protegido e pagamento com criptografia." },
  { icon: Truck, title: "Entrega Rápida", text: "Enviamos para todo o Brasil com rastreamento." },
  { icon: CreditCard, title: "Pagamento Facilitado", text: "Pix, cartão em até 12x e boleto." },
  { icon: Headset, title: "Atendimento Especializado", text: "Tire dúvidas direto pelo WhatsApp." },
];

export function TrustBadges() {
  return (
    <section aria-label="Diferenciais da loja" className="border-y border-nero/10 bg-crema">
      <ul className="mx-auto grid max-w-7xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-champagne/50 bg-champagne/10 text-champagne-deep">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-nero/80">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

