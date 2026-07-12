import type { ReactNode } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { AuthBrandPanel } from "./AuthBrandPanel";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)] lg:flex-row">
      <ThemeToggle className="absolute left-5 top-5 z-20 border border-[var(--border)] bg-[var(--surface)] shadow-[0_8px_24px_rgba(0,0,0,0.08)]" />
      <AuthBrandPanel />

      <section className="relative flex min-h-[560px] flex-1 items-center justify-center bg-[var(--surface)] px-6 pb-24 pt-14 lg:min-h-screen lg:px-12">
        <div className="w-full max-w-[448px]">{children}</div>

      </section>
    </main>
  );
}

