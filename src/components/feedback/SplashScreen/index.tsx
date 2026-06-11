import type { SplashScreenProps } from "./SplashScreen.types";

/**
 * SplashScreen
 * ------------
 * Branded boot / data-loading screen for the Golden Control dashboard.
 *
 * Design notes:
 * - Server-component safe: no hooks, no client APIs, pure CSS animation.
 *   This lets it render *anywhere* — including before the MUI ThemeProvider
 *   and the auth/socket providers have mounted (e.g. as `app/loading.tsx`).
 * - Colors come only from CSS variables in `styles/tokens.css`, so it inherits
 *   light/dark automatically with zero per-component overrides.
 * - The tools mark is an inline SVG (not a MUI icon) on purpose: a splash that
 *   may paint before providers exist must not depend on the MUI runtime.
 */

const BRAND_TITLE = "الخبراء لصيانة الأجهزة الكهربائية";
const DEFAULT_MESSAGE = "جار تحميل البيانات...";

export function SplashScreen({
  message = DEFAULT_MESSAGE,
  fullScreen = true,
}: SplashScreenProps) {
  const year = new Date().getFullYear();

  return (
    <div
      dir="rtl"
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={[
        "relative flex flex-col items-center justify-center overflow-hidden",
        "bg-[var(--bg)] text-[var(--text)]",
        fullScreen ? "min-h-screen w-full" : "h-full w-full",
      ].join(" ")}
    >
      {/* ambient gold wash — barely-there, anchored top-start (RTL = top-right) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 85% at 12% 0%, var(--gold-soft) 0%, transparent 55%)",
        }}
      />

      <div className="relative flex flex-col items-center gap-7 px-6 text-center">
        {/* brand mark */}
        <div className="flex h-20 w-20 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <svg
            viewBox="0 0 24 24"
            width="34"
            height="34"
            fill="var(--gold)"
            aria-hidden
          >
            <path d="M21.67 18.17l-5.3-5.3h-.99l-2.54 2.54v.99l5.3 5.3c.39.39 1.02.39 1.41 0l2.12-2.12c.39-.39.39-1.02 0-1.41zM17.34 10.19l1.41-1.41 2.12 2.12c1.17-1.17 1.17-3.07 0-4.24l-3.54-3.54-1.41 1.41V1.71l-.7-.71-3.54 3.54.71.71h2.83l-1.41 1.41 1.06 1.06-2.89 2.89-4.13-4.13V5.06L4.83 2.04 2 4.87 5.03 7.9h1.41l4.13 4.13-.85.85H7.6l-5.3 5.3c-.39.39-.39 1.02 0 1.41l2.12 2.12c.39.39 1.02.39 1.41 0l5.3-5.3v-2.12l5.15-5.15z" />
          </svg>
        </div>

        {/* brand title (Tajawal via font-heading) */}
        <h1 className="font-heading text-[22px] font-bold leading-relaxed text-[var(--gold)] sm:text-[26px]">
          {BRAND_TITLE}
        </h1>

        {/* gold arc spinner — faint ring + bright gold arc */}
        <div
          aria-hidden
          className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--gold-soft)] border-t-[var(--gold)] motion-reduce:animate-none"
          style={{ animationDuration: "0.9s" }}
        />

        {/* status line (Cairo via default sans) */}
        <p className="text-[14px] text-[var(--text-muted)]">{message}</p>
      </div>

      {/* copyright */}
      <footer className="absolute bottom-8 text-[12px] text-[var(--text-muted)]">
        {`جميع الحقوق محفوظة ${year} @`}
      </footer>
    </div>
  );
}

export default SplashScreen;
