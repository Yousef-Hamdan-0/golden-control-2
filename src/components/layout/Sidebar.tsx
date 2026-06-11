"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAVIGATION, NAV_FOOTER, type NavItem } from "@/config/navigation";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils/cn";

function isActive(pathname: string, href?: string): boolean {
  if (!href) return false;
  const base = href.split("?")[0];
  return pathname === base || (base !== "/dashboard" && pathname.startsWith(base));
}

function groupActive(pathname: string, item: NavItem): boolean {
  if (isActive(pathname, item.href)) return true;
  return Boolean(item.children?.some((c) => isActive(pathname, c.href)));
}

export function Sidebar() {
  const pathname = usePathname();
  const initiallyOpen = NAVIGATION.find((i) => groupActive(pathname, i))?.label ?? null;
  const [open, setOpen] = useState<string | null>(initiallyOpen);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 right-0 z-30 hidden w-64 flex-col border-l border-border bg-surface lg:flex",
      )}
    >
      {/* Brand / dashboard card */}
      <div className="p-3">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center justify-end gap-3 rounded-md px-4 py-3 text-right",
            isActive(pathname, "/dashboard")
              ? "bg-gold-soft"
              : "hover:bg-gold-soft",
          )}
        >
          <div className="leading-tight">
            <div className="text-sm font-semibold text-gold">لوحة القيادة</div>
            <div className="text-xs text-content-muted">نظرة عامة</div>
          </div>
          <Icon name="shield" className="text-gold" />
        </Link>
      </div>

      {/* Groups */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {NAVIGATION.filter((i) => i.href !== "/dashboard").map((item) => {
          const active = groupActive(pathname, item);
          const isOpen = open === item.label;
          return (
            <div key={item.label} className="mb-0.5">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : item.label)}
                className={cn(
                  "group relative flex w-full items-center justify-between gap-3 rounded-md px-4 py-2.5 text-right text-sm",
                  active ? "text-gold" : "text-content hover:bg-gold-soft",
                )}
              >
                {active && (
                  <span className="absolute right-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-gold" />
                )}
                <Icon
                  name="chevron-down"
                  size={16}
                  className={cn(
                    "text-content-muted transition-transform",
                    isOpen && "rotate-180",
                  )}
                />
                <span className="flex flex-1 items-center justify-end gap-3">
                  <span>{item.label}</span>
                  {item.icon && <Icon name={item.icon} className="text-content-muted" />}
                </span>
              </button>

              {isOpen && item.children && (
                <div className="mt-0.5 space-y-0.5 pb-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.label}
                      href={child.href ?? "#"}
                      className={cn(
                        "block rounded-md px-4 py-2 pr-10 text-right text-[13px]",
                        isActive(pathname, child.href)
                          ? "bg-surface-2 text-gold"
                          : "text-content-muted hover:bg-surface-2",
                      )}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3">
        {NAV_FOOTER.map((item) => (
          <Link
            key={item.label}
            href={item.href ?? "#"}
            className={cn(
              "flex items-center justify-end gap-3 rounded-md px-4 py-2.5 text-right text-sm",
              item.label === "تسجيل الخروج"
                ? "text-danger hover:bg-danger-soft"
                : "text-content hover:bg-gold-soft",
            )}
          >
            <span>{item.label}</span>
            {item.icon && <Icon name={item.icon} />}
          </Link>
        ))}
      </div>
    </aside>
  );
}
