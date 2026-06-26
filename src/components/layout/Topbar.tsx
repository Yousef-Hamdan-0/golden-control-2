"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/lib/icons";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

function todayLabel(): string {
  const parts = new Intl.DateTimeFormat("ar-u-nu-latn", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Amman",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `اليوم، ${part("day")} ${part("month")} ${part("year")}`;
}

function routeTitle(pathname: string, fallback: string): string {
  if (pathname.startsWith("/users")) return "إدارة المستخدمين";
  if (pathname.startsWith("/settings/exchange-rate")) return "سعر الصرف";
  if (pathname.startsWith("/settings/center")) return "الإعدادات";
  if (pathname.startsWith("/customers")) return "إدارة العملاء";
  if (pathname.startsWith("/technicians/inventory")) return "المخزون اليومي";
  if (pathname.startsWith("/technicians/performance")) return "الأداء";
  if (pathname.startsWith("/orders")) return "إدارة الطلبات";
  if (pathname.startsWith("/inventory")) return "إدارة المخزون";
  if (pathname.startsWith("/invoices")) return "إدارة الفواتير";
  if (pathname.startsWith("/finance/expenses")) return "المصروفات";
  if (pathname.startsWith("/finance/payroll-adjustments")) return "تسويات الرواتب";
  if (pathname.startsWith("/finance/reports")) return "التقارير والإحصائيات";
  if (pathname.startsWith("/finance")) return "الإدارة المالية";
  if (pathname.startsWith("/dashboard")) return "نظرة عامة";
  return fallback;
}

export function Topbar({
  title,
  onMenuClick,
}: {
  title: string;
  onMenuClick?: () => void;
}) {
  const pathname = usePathname();
  const currentTitle = routeTitle(pathname, title);
  const [dateLabel, setDateLabel] = useState("");

  useEffect(() => {
    setDateLabel(todayLabel());
    const interval = window.setInterval(() => {
      setDateLabel(todayLabel());
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-border bg-surface relative">
      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 sm:gap-2 lg:right-6">
        <button
          type="button"
          aria-label="فتح القائمة"
          title="القائمة"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-sm text-content transition hover:bg-gold-soft hover:text-gold lg:hidden"
        >
          <Icon name="menu" />
        </button>
        <Link
          href="/settings/center"
          aria-label="الإعدادات"
          title="الإعدادات"
          className="inline-flex h-10 w-10 items-center justify-center rounded-sm text-content transition hover:bg-gold-soft hover:text-gold"
        >
          <Icon name="gear" />
        </Link>
        <ThemeToggle className="rounded-sm text-content hover:bg-gold-soft hover:text-gold" />
      </div>

      <h1 className="pointer-events-none absolute left-1/2 top-1/2 max-w-[38vw] -translate-x-1/2 -translate-y-1/2 truncate text-center font-heading text-lg font-bold text-content sm:max-w-[48vw] sm:text-[22px]">
        {currentTitle}
      </h1>

      <div
        dir="ltr"
        className="absolute left-4 top-1/2 hidden -translate-y-1/2 items-center gap-3 text-sm text-content-muted md:flex lg:left-8"
      >
        <span dir="rtl">{dateLabel || "\u00a0"}</span>
        <Icon name="calendar" size={16} />
        <span className="h-6 w-px bg-border" aria-hidden="true" />
      </div>
    </header>
  );
}
