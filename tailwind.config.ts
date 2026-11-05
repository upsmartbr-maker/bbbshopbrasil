import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        crema: "#FDFBF7",
        marmo: "#F1EBE0",
        nero: "#1F1A16",
        terracotta: "#B0502F",
        // Dourado/caramelo da marca (#C28E46) e versão escura para texto sobre fundo claro (AA)
        champagne: "#C28E46",
        "champagne-deep": "#8A5A1E",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
