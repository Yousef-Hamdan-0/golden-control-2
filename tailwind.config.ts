import type { Config } from "tailwindcss";

/**
 * Golden Control — Tailwind config.
 * Colors are driven by CSS variables (see src/styles/tokens.css) so that
 * next-themes can flip light/dark by toggling the `.dark` class on <html>.
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        border: "var(--border)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-2)",
          active: "var(--primary-3)",
        },
        gold: {
          DEFAULT: "rgb(var(--gold-rgb) / <alpha-value>)",
          hover: "var(--gold-hover)",
          active: "var(--gold-active)",
          soft: "var(--gold-soft)",
        },
        content: {
          DEFAULT: "var(--text)",
          muted: "var(--text-muted)",
        },
        success: { DEFAULT: "var(--success)", soft: "var(--success-soft)" },
        danger: {
          DEFAULT: "rgb(var(--danger-rgb) / <alpha-value>)",
          soft: "var(--danger-soft)",
        },
        info: { DEFAULT: "var(--info)", soft: "var(--info-soft)" },
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        DEFAULT: "8px",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Tajawal", "sans-serif"],
        body: ["var(--font-body)", "Cairo", "sans-serif"],
      },
      boxShadow: {
        gold: "0 0 20px rgba(176, 141, 60, 0.30)",
        card: "0 1px 2px rgba(0,0,0,0.04)",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
