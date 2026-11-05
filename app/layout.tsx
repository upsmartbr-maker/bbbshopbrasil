import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart/cart-provider";
import { StorefrontChrome } from "@/components/layout/storefront-chrome";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://bbbshopbrasil.com.br";

export const viewport: Viewport = {
  themeColor: "#FDFBF7",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BBB Shop Brasil — Panelas e Utensílios Gourmet de Alta Performance",
    template: "%s | BBB Shop Brasil",
  },
  description:
    "Panelas antiaderentes premium, caçarolas, frigideiras e utensílios gourmet de alta qualidade para transformar sua experiência gastronômica. Entrega segura para todo o Brasil em até 12x sem juros.",
  keywords: [
    "BBB Shop Brasil",
    "panelas gourmet",
    "panelas antiaderentes",
    "utensílios de cozinha premium",
    "conjunto de panelas",
    "frigideira gourmet",
    "cozinha gourmet",
  ],
  authors: [{ name: "BBB Shop Brasil", url: siteUrl }],
  creator: "BBB Shop Brasil",
  publisher: "BBB Shop Brasil",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: ["/logo.png"],
    apple: [
      { url: "/logo.png", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: "BBB Shop Brasil",
    title: "BBB Shop Brasil — Panelas e Utensílios Gourmet de Alta Performance",
    description:
      "Design e performance na sua cozinha. Descubra nossa linha exclusiva de panelas antiaderentes e utensílios gourmet com entrega para todo o Brasil.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "BBB Shop Brasil — Panelas e Utensílios Gourmet",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BBB Shop Brasil — Panelas e Utensílios Gourmet",
    description:
      "Panelas e utensílios gourmet de alta performance para transformar sua cozinha. Entrega para todo o Brasil.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${display.variable}`}>
      <body className="font-sans">
        <CartProvider>
          <StorefrontChrome>{children}</StorefrontChrome>
        </CartProvider>
      </body>
    </html>
  );
}
