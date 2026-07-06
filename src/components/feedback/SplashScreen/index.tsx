import Image from "next/image";
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

const BRAND_TITLE = "AL-KHUBARA COMPANY";
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
        <div className="flex h-24 w-24 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <Image
            src="/brand/al-khubara-emblem-transparent.png"
            alt={BRAND_TITLE}
            width={82}
            height={82}
            className="object-contain"
            priority
          />
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
