"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * Wraps the app with next-themes.
 * `attribute="class"` adds class="dark" on <html>, which matches the
 * `.dark { ... }` selector in styles/tokens.css. Start in light mode to
 * match the design; later we'll add the topbar toggle.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
