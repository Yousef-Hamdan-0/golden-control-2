import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-heading)", "Tajawal", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "Cairo", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "Cairo", "system-ui", "sans-serif"],
      },
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
        text: "var(--text)",
        "text-muted": "var(--text-muted)",
        success: {
          DEFAULT: "var(--success)",
          soft: "var(--success-soft)",
        },
        danger: {
          DEFAULT: "rgb(var(--danger-rgb) / <alpha-value>)",
          soft: "var(--danger-soft)",
        },
        info: {
          DEFAULT: "var(--info)",
          soft: "var(--info-soft)",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        DEFAULT: "var(--radius-md)",
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
