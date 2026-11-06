import type { Metadata } from "next";
import { ContactSection } from "@/components/home/contact-section";

export const metadata: Metadata = {
  title: "Fale Conosco | BBB Shop Brasil",
  description:
    "Entre em contato com a BBB Shop Brasil pelo WhatsApp +55 11 98499-7067, e-mail bbbshopbrasil@gmail.com ou envie sua mensagem pelo formulário de atendimento.",
};

export default function ContatoPage() {
  return <ContactSection />;
}

