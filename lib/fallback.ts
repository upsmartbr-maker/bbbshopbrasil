import type { Banner, ProductWithImages, Testimonial } from "@/types/database";

/**
 * CONTEÚDO DE DEMONSTRAÇÃO — exibido apenas enquanto o Supabase não estiver
 * configurado ou as tabelas estiverem vazias. Substitua por dados reais no admin.
 */
const now = new Date().toISOString();

function demo(
  n: number,
  name: string,
  price: number,
  compare: number | null,
  description: string
): ProductWithImages {
  return {
    id: `demo-${n}`,
    name,
    slug: name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-"),
    description,
    price,
    compare_at_price: compare,
    is_featured: true,
    stock: 10,
    created_at: now,
    product_images: [],
  };
}

export const FALLBACK_PRODUCTS: ProductWithImages[] = [
  demo(1, "Conjunto de Panelas Antiaderente 10 Peças", 1890, 2290, "Revestimento antiaderente premium, fundo triplo."),
  demo(2, "Frigideira Gourmet 28 cm", 389.9, 459.9, "Distribuição uniforme de calor, cabo ergonômico."),
  demo(3, "Caçarola com Tampa de Vidro 24 cm", 549, null, "Ideal para refogados e cozimentos lentos."),
  demo(4, "Panela de Pressão Inox 4,5 L", 429, 499, "Segurança e praticidade no dia a dia."),
  demo(5, "Wok Antiaderente 32 cm", 319.9, null, "Perfeita para preparos rápidos em fogo alto."),
  demo(6, "Jogo de Facas Chef 6 Peças", 699, 849, "Lâminas de aço inox de alta precisão."),
  demo(7, "Assadeira Retangular Antiaderente", 189.9, 229.9, "Assa por igual, desenforma sem esforço."),
  demo(8, "Kit Utensílios de Cozinha 12 Peças", 259, null, "Seguros para superfícies antiaderentes."),
];

export const FALLBACK_BANNERS: Banner[] = [
  {
    id: "demo-b1",
    title: "Coleção Gourmet",
    subtitle: "Panelas antiaderentes de alto desempenho para quem ama cozinhar.",
    image_url: "",
    button_text: "Ver produtos",
    link: "/produtos",
    order_index: 1,
    is_active: true,
  },
  {
    id: "demo-b2",
    title: "Pagamento facilitado",
    subtitle: "Parcele em até 12x sem juros ou pague no Pix.",
    image_url: "",
    button_text: "Aproveitar",
    link: "/produtos",
    order_index: 2,
    is_active: true,
  },
  {
    id: "demo-b3",
    title: "Atendimento especializado",
    subtitle: "Tire dúvidas com nosso time direto pelo WhatsApp.",
    image_url: "",
    button_text: "Falar no WhatsApp",
    link: "/#contato",
    order_index: 3,
    is_active: true,
  },
];

export const FALLBACK_TESTIMONIALS: Testimonial[] = [
  { id: "demo-t1", customer_name: "Cliente BBB Shop", customer_city: "São Paulo, SP", text: "As panelas são lindas e o antiaderente é excelente. Cozinhar ficou muito mais prático.", rating: 5, photo_url: null, is_active: true, order_index: 1 },
  { id: "demo-t2", customer_name: "Cliente BBB Shop", customer_city: "Campinas, SP", text: "Atendimento rápido pelo WhatsApp e entrega dentro do prazo. Recomendo!", rating: 5, photo_url: null, is_active: true, order_index: 2 },
  { id: "demo-t3", customer_name: "Cliente BBB Shop", customer_city: "Santo André, SP", text: "Qualidade acima do esperado. A frigideira distribui o calor de forma perfeita.", rating: 5, photo_url: null, is_active: true, order_index: 3 },
];

