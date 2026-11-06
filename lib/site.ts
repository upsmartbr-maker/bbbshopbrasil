/** Configuração e helpers puros (seguros para client e server). */
export const SITE = {
  name: "BBB Shop Brasil",
  tagline: "Sua cozinha mais saudável e colorida",
  whatsapp: "5511984997067",
  whatsappDisplay: "(11) 98499-7067",
  email: "bbbshopbrasil@gmail.com",
  presaleMessage:
    "Olá! Vim pelo site da BBB Shop Brasil e gostaria de conhecer as panelas e tirar dúvidas antes de comprar.",
  // TODO: confirmar as URLs oficiais das redes sociais da BBB Shop Brasil.
  socials: {
    instagram: "https://www.instagram.com/moncoc_oficial/",
    facebook: "https://web.facebook.com/moncocimportacao/",
    youtube: "https://youtube.com/@moncoctv",
  },
  installments: 12,
} as const;

export function waLink(message: string = SITE.presaleMessage): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`;
}

export const NAV_LINKS = [
  { href: "/", label: "Início" },
  { href: "/produtos", label: "Produtos" },
  { href: "/#colecoes", label: "Coleções" },
  { href: "/#sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
] as const;

