import { MessageCircle } from "lucide-react";
import { waLink } from "@/lib/site";

export function WhatsAppFloat() {
  return (
    <a
      href={waLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a BBB Shop Brasil no WhatsApp"
      className="group fixed bottom-5 right-5 z-[80] flex items-center gap-3 rounded-full bg-[#1E8E4A] p-4 text-white shadow-xl transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E8E4A]"
    >
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 group-hover:max-w-[12rem] group-focus-visible:max-w-[12rem] sm:inline">
        Fale conosco
      </span>
      <MessageCircle className="h-6 w-6" aria-hidden="true" />
    </a>
  );
}

