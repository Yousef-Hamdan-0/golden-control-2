"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Icon } from "@/lib/icons";
import { CURRENT_USER } from "@/lib/auth/current-user";

function todayLabel(): string {
  return new Intl.DateTimeFormat("ar", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export function Topbar({ title }: { title: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && theme === "dark";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      {/* Start (right in RTL): profile + settings + theme */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-2 text-content-muted">
            <Icon name="users" size={18} />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-content">{CURRENT_USER.fullName}</div>
            <div className="text-xs text-content-muted">{CURRENT_USER.jobTitle}</div>
          </div>
        </div>
        <button
          type="button"
          aria-label="الإعدادات"
          className="rounded-md p-2 text-content-muted hover:bg-surface-2"
        >
          <Icon name="gear" />
        </button>
        <button
          type="button"
          aria-label="تبديل الوضع الليلي"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="rounded-md p-2 text-content-muted hover:bg-surface-2"
        >
          <Icon name={isDark ? "sun" : "moon"} />
        </button>
      </div>

      {/* Center: page title */}
      <h1 className="absolute left-1/2 -translate-x-1/2 font-heading text-base font-bold text-content">
        {title}
      </h1>

      {/* End (left in RTL): date */}
      <div className="flex items-center gap-2 text-sm text-content-muted">
        <span>{todayLabel()}</span>
        <Icon name="calendar" size={18} />
      </div>
    </header>
  );
}
