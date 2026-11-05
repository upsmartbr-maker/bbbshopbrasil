import { Facebook, Instagram, Mail, MessageCircle, Youtube } from "lucide-react";
import { SITE, waLink } from "@/lib/site";

export function TopBar() {
  return (
    <div className="bg-nero text-crema">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-2 text-xs">
        <p className="font-medium tracking-wide">
          <span className="hidden sm:inline">Entrega para todo o Brasil &nbsp;|&nbsp; Compra Segura &nbsp;|&nbsp; Pagamento Facilitado</span>
          <span className="sm:hidden">Entrega para todo o Brasil • Compra Segura</span>
        </p>
        <ul className="flex items-center gap-4" aria-label="Redes sociais e contato">
          <li>
            <a href={waLink()} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="hover:text-champagne">
              <MessageCircle className="h-4 w-4" />
            </a>
          </li>
          <li>
            <a href={`mailto:${SITE.email}`} aria-label="E-mail" className="hover:text-champagne">
              <Mail className="h-4 w-4" />
            </a>
          </li>
          <li>
            <a href={SITE.socials.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-champagne">
              <Instagram className="h-4 w-4" />
            </a>
          </li>
          <li>
            <a href={SITE.socials.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-champagne">
              <Facebook className="h-4 w-4" />
            </a>
          </li>
          <li>
            <a href={SITE.socials.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="hover:text-champagne">
              <Youtube className="h-4 w-4" />
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

