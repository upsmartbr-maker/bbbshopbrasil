import type { Banner, ProductWithImages, Testimonial } from "@/types/database";

/**
 * Nenhum produto estático/mockado é pré-carregado.
 * A vitrine reflete exclusivamente os produtos reais cadastrados no Supabase.
 */
export const FALLBACK_PRODUCTS: ProductWithImages[] = [];

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

