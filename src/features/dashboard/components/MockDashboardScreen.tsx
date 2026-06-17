"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  clearMockSession,
  readMockSession,
  type MockSession,
} from "@/lib/auth/mock-session";
import { MaintenanceOrderModal } from "@/features/operations/components/OperationsScreens";

type IconName =
  | "calendar"
  | "chart"
  | "chevron"
  | "edit"
  | "logout"
  | "moon"
  | "plus"
  | "receipt"
  | "settings"
  | "shield"
  | "tools"
  | "users"
  | "view"
  | "wallet"
  | "warehouse";

type NavItem = {
  icon: IconName;
  label: string;
  href: string;
  active?: boolean;
  expanded?: boolean;
  subItems?: Array<{
    label: string;
    href: string;
  }>;
};

const orderStats = [
  { label: "طلبات داخلية", value: "24", tone: "gold" },
  { label: "طلبات خارجية", value: "15", tone: "gold" },
  { label: "مكتملة", value: "18", tone: "green" },
  { label: "غير مكتملة", value: "32", tone: "gold" },
  { label: "مسحوبة إلى المركز", value: "24", tone: "gold" },
  { label: "معاد صيانتها", value: "24", tone: "gold" },
  { label: "مؤجلة إلى المركز", value: "24", tone: "gold" },
];

const navItems: NavItem[] = [
  { icon: "shield", label: "الرئيسية", href: "/dashboard", active: true },
  { icon: "users", label: "إدارة المستخدمين", href: "/settings/users" },
  { icon: "users", label: "إدارة الفنيين", href: "/technicians/inventory" },
  {
    icon: "tools",
    label: "إدارة الطلبات",
    href: "/orders",
    expanded: true,
    subItems: [
      { label: "طلبات خارجية", href: "/orders?type=external" },
      { label: "طلبات داخلية", href: "/orders?type=internal" },
      { label: "محولة للمركز", href: "/orders?status=pull-to-center" },
      { label: "غير مكتملة", href: "/orders?status=incompleted" },
      { label: "مكتملة", href: "/orders?status=completed" },
    ],
  },
  { icon: "warehouse", label: "إدارة المخزون", href: "/inventory" },
  { icon: "receipt", label: "إدارة الفواتير", href: "/invoices" },
  { icon: "wallet", label: "الإدارة المالية", href: "/finance" },
  {
    icon: "chart",
    label: "التقارير والإحصائيات",
    href: "/finance/reports/maintenance",
  },
];

const recentOrders = [
  {
    id: "#ORD-5542",
    client: "محمد العتيبي",
    device: "ثلاجة LG",
    technician: "رامي سمير",
    status: "قيد الصيانة",
    statusClass: "bg-[var(--gold-soft)] text-[var(--gold-active)]",
  },
  {
    id: "#ORD-5541",
    client: "سارة القحطاني",
    device: "شاشة سامسونغ",
    technician: "رامي سمير",
    status: "مكتمل",
    statusClass: "bg-[var(--success-soft)] text-[var(--success)]",
  },
  {
    id: "#ORD-5540",
    client: "مركز الصفاء التجاري",
    device: "غسالة ناشونال",
    technician: "رامي سمير",
    status: "محول للمركز",
    statusClass: "bg-[var(--info-soft)] text-[var(--info)]",
  },
];

const chartBars = ["h-16", "h-14", "h-10", "h-12", "h-7", "h-9", "h-5"];

function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  const common = {
    "aria-hidden": true,
    className,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: "2",
    viewBox: "0 0 24 24",
  };

  if (name === "calendar") {
    return (
      <svg {...common}>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M3 10h18" />
      </svg>
    );
  }

  if (name === "chart") {
    return (
      <svg {...common}>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 16v-4" />
        <path d="M12 16V8" />
        <path d="M16 16v-7" />
      </svg>
    );
  }

  if (name === "chevron") {
    return (
      <svg {...common}>
        <path d="m6 9 6 6 6-6" />
      </svg>
    );
  }

  if (name === "edit") {
    return (
      <svg {...common}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    );
  }

  if (name === "logout") {
    return (
      <svg {...common}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
      </svg>
    );
  }

  if (name === "moon") {
    return (
      <svg {...common} fill="currentColor" stroke="none">
        <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3a9 9 0 1 0 11.5 11.5Z" />
      </svg>
    );
  }

  if (name === "plus") {
    return (
      <svg {...common}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    );
  }

  if (name === "receipt") {
    return (
      <svg {...common}>
        <path d="M5 3h14v18l-2-1-2 1-2-1-2 1-2-1-2 1Z" />
        <path d="M9 7h6" />
        <path d="M9 11h6" />
        <path d="M9 15h4" />
      </svg>
    );
  }

  if (name === "settings") {
    return (
      <svg {...common}>
        <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 0 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 0 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.6V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 0 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1h.1a2 2 0 0 1 0 4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </svg>
    );
  }

  if (name === "shield") {
    return (
      <svg {...common}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="M9 12l2 2 4-5" />
      </svg>
    );
  }

  if (name === "tools") {
    return (
      <svg {...common} fill="currentColor" stroke="none">
        <path d="M21.67 18.17l-5.3-5.3h-.99l-2.54 2.54v.99l5.3 5.3c.39.39 1.02.39 1.41 0l2.12-2.12c.39-.39.39-1.02 0-1.41zM17.34 10.19l1.41-1.41 2.12 2.12c1.17-1.17 1.17-3.07 0-4.24l-3.54-3.54-1.41 1.41V1.71l-.7-.71-3.54 3.54.71.71h2.83l-1.41 1.41 1.06 1.06-2.89 2.89-4.13-4.13V5.06L4.83 2.04 2 4.87 5.03 7.9h1.41l4.13 4.13-.85.85H7.6l-5.3 5.3c-.39.39-.39 1.02 0 1.41l2.12 2.12c.39.39 1.02.39 1.41 0l5.3-5.3v-2.12l5.15-5.15z" />
      </svg>
    );
  }

  if (name === "users") {
    return (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  if (name === "view") {
    return (
      <svg {...common}>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  if (name === "wallet") {
    return (
      <svg {...common}>
        <path d="M3 7h18v13H3z" />
        <path d="M16 12h5v4h-5a2 2 0 0 1 0-4Z" />
        <path d="M3 7l3-4h12l3 4" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M4 5h16v14H4z" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
    </svg>
  );
}

function IconButton({
  icon,
  label,
  href,
}: {
  icon: IconName;
  label: string;
  href?: string;
}) {
  const className =
    "flex h-10 w-10 items-center justify-center rounded-sm text-[var(--text)] transition hover:bg-[var(--gold-soft)] hover:text-[var(--gold-active)]";

  if (href) {
    return (
      <Link href={href} aria-label={label} title={label} className={className}>
        <Icon name={icon} />
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={className}
    >
      <Icon name={icon} />
    </button>
  );
}

function Sidebar({
  onLogout,
  session,
}: {
  onLogout: () => void;
  session: MockSession | null;
}) {
  const displayName = session?.name === "admin" ? "أحمد العتيبي" : session?.name;

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-[var(--border)] bg-[var(--surface)] lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-b-0 lg:border-l">
      <div className="flex h-16 items-center gap-3 border-b border-[var(--border)] px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-[var(--surface)] text-[var(--text)] shadow-[0_1px_4px_rgba(64,50,22,0.08)]">
          <Icon name="users" className="h-7 w-7" />
        </div>
        <div>
          <p className="font-heading text-[15px] font-bold leading-none text-[var(--text)]">
            {displayName || "أحمد العتيبي"}
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">مدير النظام</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-2">
          {navItems.map((item) => (
            <div key={item.label}>
              <Link
                href={item.href}
                className={[
                  "flex h-12 w-full items-center justify-between rounded-md px-3 text-[15px] transition",
                  item.active
                    ? "border border-[var(--border)] bg-[var(--surface-2)] font-bold text-[var(--gold-active)] shadow-[0_1px_4px_rgba(64,50,22,0.06)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--gold-soft)] hover:text-[var(--gold-active)]",
                ].join(" ")}
              >
                <span className="flex items-center gap-3">
                  <Icon name={item.icon} />
                  {item.label}
                </span>
                {!item.active ? (
                  <Icon
                    name="chevron"
                    className={[
                      "h-4 w-4 transition",
                      item.expanded ? "rotate-180" : "",
                    ].join(" ")}
                  />
                ) : null}
              </Link>

              {item.subItems ? (
                <div className="mr-10 mt-2 space-y-2 rounded-md bg-[var(--surface-2)] py-2">
                  {item.subItems.map((subItem) => (
                    <Link
                      key={subItem.label}
                      href={subItem.href}
                      className="block w-full px-3 py-1.5 text-right text-[11px] text-[var(--text-muted)] transition hover:text-[var(--gold-active)]"
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-[var(--border)] p-4">
        <Link
          href="/settings/center"
          className="mb-2 flex h-10 w-full items-center gap-3 rounded-sm px-3 text-[14px] text-[var(--text-muted)] transition hover:bg-[var(--gold-soft)] hover:text-[var(--gold-active)]"
        >
          <Icon name="settings" />
          الإعدادات
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="flex h-10 w-full items-center gap-3 rounded-sm px-3 text-[14px] text-[var(--danger)] transition hover:bg-[var(--danger-soft)]"
        >
          <Icon name="logout" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}

function Topbar() {
  return (
    <header className="relative flex min-h-16 items-center border-b border-[var(--border)] bg-[var(--surface)] px-4 lg:px-8">
      <div className="absolute left-4 flex items-center gap-3 text-[13px] text-[var(--text-muted)] lg:left-8">
        <Icon name="calendar" className="h-4 w-4" />
        <span>اليوم، 24 أكتوبر 2023</span>
      </div>

      <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-heading text-[22px] font-bold text-[var(--text)]">
        نظرة عامة
      </h1>

      <div className="absolute right-4 flex items-center gap-2 lg:right-8">
        <ThemeToggle className="rounded-sm text-[var(--text)] hover:bg-[var(--gold-soft)] hover:text-[var(--gold-active)]" />
        <IconButton icon="settings" label="الإعدادات" href="/settings/center" />
      </div>
    </header>
  );
}

function NewOrderButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-[var(--gold-active)] px-4 font-heading text-[15px] font-bold text-white shadow-[0_10px_22px_rgba(138,107,47,0.18)] transition hover:-translate-y-px hover:bg-[var(--gold)] hover:shadow-[0_14px_28px_rgba(176,141,60,0.24)]"
      >
        <Icon name="plus" className="h-5 w-5" />
        طلب صيانة جديد
      </button>
    </div>
  );
}

function NewCustomersCard() {
  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_2px_10px_rgba(64,50,22,0.04)]">
      <div className="flex items-start justify-between">
        <div className="text-[var(--gold-active)]">
          <Icon name="users" />
        </div>
        <div className="text-right">
          <h2 className="font-heading text-[16px] font-bold">العملاء الجدد</h2>
          <p className="mt-2 font-heading text-[20px] font-bold text-[var(--gold-active)]">
            12
          </p>
        </div>
      </div>

      <div className="mt-8 flex h-16 items-end gap-1.5" dir="ltr">
        {chartBars.map((heightClass, index) => (
          <div
            key={`${heightClass}-${index}`}
            className={[
              "flex-1 rounded-t-sm",
              heightClass,
              index === 0 ? "bg-[var(--gold-active)]" : "bg-[var(--border)]",
            ].join(" ")}
          />
        ))}
      </div>
    </section>
  );
}

function InvoiceCard({ title }: { title: string }) {
  return (
    <section className="flex items-center justify-between rounded-sm border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="rounded-sm bg-[var(--surface-2)] p-3 text-[var(--gold-active)]">
        <Icon name="receipt" className="h-7 w-7" />
      </div>
      <div className="text-right">
        <h3 className="font-heading text-[16px] font-bold text-[var(--text)]">
          {title}
        </h3>
        <p className="mt-1 text-[13px] text-[var(--text-muted)]">
          <span className="font-heading text-[24px] font-bold text-[var(--text)]">
            42
          </span>
          فاتورة صادرة
        </p>
      </div>
      <p className="text-[12px] font-bold text-[var(--success)]">12%↑</p>
    </section>
  );
}

function OrderSummaryCard() {
  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_2px_10px_rgba(64,50,22,0.04)]">
      <div className="flex items-center justify-between">
        <span className="rounded-sm bg-[var(--surface-2)] px-2 py-1 text-[11px] text-[var(--gold-active)]">
          اليوم
        </span>
        <h2 className="flex items-center gap-2 font-heading text-[18px] font-bold text-[var(--text)]">
          <Icon name="tools" className="h-5 w-5 text-[var(--gold-active)]" />
          ملخص طلبات الصيانة
        </h2>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-4">
        {orderStats.map((item) => (
          <div key={item.label} className="text-center">
            <p className="text-[11px] text-[var(--text-muted)]">{item.label}</p>
            <p
              className={[
                "mt-1 font-heading text-[22px] font-bold",
                item.tone === "green"
                  ? "text-[var(--success)]"
                  : item.tone === "red"
                    ? "text-[var(--danger)]"
                    : "text-[var(--gold-active)]",
              ].join(" ")}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinanceCard() {
  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_2px_10px_rgba(64,50,22,0.04)]">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[11px] text-[var(--text-muted)]">42 فاتورة صادرة</p>
        <h2 className="flex items-center gap-2 font-heading text-[18px] font-bold text-[var(--text)]">
          <Icon name="wallet" className="h-5 w-5 text-[var(--gold-active)]" />
          الأداء المالي
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-md bg-[var(--gold-active)] p-5 text-white">
          <Icon
            name="wallet"
            className="absolute bottom-3 left-4 h-12 w-12 text-white/14"
          />
          <p className="text-[12px] text-white/80">إجمالي الإيرادات</p>
          <p className="mt-1 font-heading text-[22px] font-bold">12,450</p>
          <p className="text-[12px] text-white/85">ر.س</p>
        </div>

        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5 text-center">
          <p className="text-[12px] text-[var(--text-muted)]">المبيعات</p>
          <p className="mt-2 font-heading text-[24px] font-bold text-[var(--gold-active)]">
            8,200
            <span className="mr-1 text-[12px] font-normal text-[var(--text-muted)]">
              ر.س
            </span>
          </p>
        </div>

        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5 text-center">
          <p className="text-[12px] text-[var(--text-muted)]">صافي الأرباح</p>
          <p className="mt-2 font-heading text-[24px] font-bold text-[var(--success)]">
            4,250
            <span className="mr-1 text-[12px] font-normal text-[var(--text-muted)]">
              ر.س
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

function RecentOrdersTable() {
  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] shadow-[0_2px_10px_rgba(64,50,22,0.04)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <Link
          href="/orders"
          className="text-[13px] font-medium text-[var(--gold-active)]"
        >
          عرض الكل
        </Link>
        <h2 className="font-heading text-[18px] font-bold text-[var(--text)]">
          آخر الطلبات المحدثة
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[820px] w-full border-collapse text-right">
          <thead>
            <tr className="text-[12px] font-normal text-[var(--text-muted)]">
              <th className="px-5 py-3 font-normal">رقم الطلب</th>
              <th className="px-5 py-3 font-normal">العميل</th>
              <th className="px-5 py-3 font-normal">اسم ونوع الجهاز</th>
              <th className="px-5 py-3 font-normal">الفني المسؤول</th>
              <th className="px-5 py-3 font-normal">الحالة</th>
              <th className="px-5 py-3 font-normal">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr
                key={order.id}
                className="border-t border-[var(--border)] text-[14px] text-[var(--text)]"
              >
                <td className="px-5 py-5 font-bold">{order.id}</td>
                <td className="px-5 py-5">{order.client}</td>
                <td className="px-5 py-5">{order.device}</td>
                <td className="px-5 py-5">{order.technician}</td>
                <td className="px-5 py-5">
                  <span
                    className={[
                      "inline-flex rounded-sm px-3 py-1 text-[11px] font-medium",
                      order.statusClass,
                    ].join(" ")}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-5 py-5">
                  <div className="flex items-center gap-3 text-[var(--text)]">
                    <Link href={`/orders?id=${order.id}`} aria-label={`عرض ${order.id}`}>
                      <Icon name="view" className="h-5 w-5" />
                    </Link>
                    <Link href={`/orders?edit=${order.id}`} aria-label={`تعديل ${order.id}`}>
                      <Icon name="edit" className="h-5 w-5" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function MockDashboardScreen() {
  const router = useRouter();
  const [session, setSession] = useState<MockSession | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    const storedSession = readMockSession();

    if (!storedSession) {
      router.replace("/login");
      return;
    }

    setSession(storedSession);
    setIsChecking(false);
  }, [router]);

  function handleLogout() {
    clearMockSession();
    router.replace("/login");
  }

  if (isChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6 text-[var(--text)]">
        <p className="text-[14px] text-[var(--text-muted)]">جار التحقق...</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar onLogout={handleLogout} session={session} />

        <main className="min-w-0 flex-1">
          <Topbar />

          <div className="px-4 py-5 lg:px-4">
            {showOrderModal ? (
              <MaintenanceOrderModal onClose={() => setShowOrderModal(false)} />
            ) : null}
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-4">
                <section className="text-right">
                  <h2 className="font-heading text-[17px] font-bold text-[var(--gold-active)]">
                    نظرة عامة على النظام
                  </h2>
                  <p className="mt-1 text-[15px] text-[var(--text-muted)]">
                    مرحباً بك مجدداً، إليك ملخص نشاط اليوم الأربعاء، 24 مايو
                  </p>
                </section>

                <OrderSummaryCard />
                <FinanceCard />
              </div>

              <div className="space-y-4">
                <NewOrderButton onClick={() => setShowOrderModal(true)} />
                <NewCustomersCard />
                <InvoiceCard title="فواتير الخارجية" />
                <InvoiceCard title="فواتير الداخلية" />
              </div>
            </div>

            <div className="mt-4">
              <RecentOrdersTable />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
