"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { NAVIGATION, NAV_FOOTER, type NavItem } from "@/config/navigation";
import { Icon } from "@/lib/icons";
import { clearMockSession } from "@/lib/auth/mock-session";
import { CURRENT_USER } from "@/lib/auth/current-user";
import { cn } from "@/lib/utils/cn";

function isActive(
  pathname: string,
  searchParams: URLSearchParams,
  href?: string,
  exact = false,
): boolean {
  if (!href) return false;
  const [base, queryString] = href.split("?");

  if (queryString) {
    const expected = new URLSearchParams(queryString);
    return (
      pathname === base &&
      Array.from(expected.entries()).every(([key, value]) => searchParams.get(key) === value)
    );
  }

  if (exact) return pathname === base;
  return pathname === base || (base !== "/dashboard" && pathname.startsWith(`${base}/`));
}

function groupActive(pathname: string, searchParams: URLSearchParams, item: NavItem): boolean {
  if (isActive(pathname, searchParams, item.href)) return true;
  return Boolean(item.children?.some((c) => isActive(pathname, searchParams, c.href)));
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initiallyOpen = NAVIGATION.find((i) => groupActive(pathname, searchParams, i))?.label ?? null;
  const [open, setOpen] = useState<string | null>(initiallyOpen);

  useEffect(() => {
    const activeGroup = NAVIGATION.find((i) => groupActive(pathname, searchParams, i))?.label ?? null;
    if (activeGroup) setOpen(activeGroup);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose?.();
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [isOpen, onClose]);

  function closeSidebar() {
    onClose?.();
  }

  function handleLogout() {
    closeSidebar();
    clearMockSession();
    router.replace("/login");
  }

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="إغلاق القائمة"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      ) : null}

      <aside
        dir="rtl"
        className={cn(
          "fixed inset-y-0 right-0 z-40 flex w-64 max-w-[calc(100vw-2rem)] flex-col border-l border-border bg-surface transition-transform duration-200 ease-out lg:z-30 lg:translate-x-0",
          isOpen ? "translate-x-0 shadow-gold" : "translate-x-full lg:shadow-none",
        )}
      >
        <div className="flex h-16 items-center justify-between gap-3 border-b border-border px-4">
          <div className="flex min-w-0 items-center justify-start gap-3">
            <div className="text-right leading-tight">
              <div className="max-w-36 truncate text-sm font-bold text-content">
                {CURRENT_USER.fullName}
              </div>
              <div className="mt-1 max-w-36 truncate text-xs text-content-muted">
                {CURRENT_USER.jobTitle}
              </div>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-border bg-surface-2 text-content shadow-card">
              <Icon name="users" size={22} />
            </div>
          </div>

          <button
            type="button"
            aria-label="إغلاق القائمة"
            title="إغلاق القائمة"
            onClick={closeSidebar}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-content-muted transition hover:bg-gold-soft hover:text-gold lg:hidden"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="p-3">
          <Link
            href="/dashboard"
            onClick={closeSidebar}
            className={cn(
              "flex w-full items-center justify-start gap-3 rounded-md px-4 py-3 text-right",
              isActive(pathname, searchParams, "/dashboard", true)
                ? "bg-gold-soft"
                : "hover:bg-gold-soft",
            )}
          >
            <Icon name="shield" className="text-gold" />
            <div className="leading-tight">
              <div className="text-sm font-semibold text-gold">لوحة القيادة</div>
              <div className="text-xs text-content-muted">نظرة عامة</div>
            </div>
          </Link>
        </div>

        {/* Groups */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {NAVIGATION.filter((i) => i.href !== "/dashboard").map((item) => {
            const active = groupActive(pathname, searchParams, item);
            const isOpenGroup = open === item.label;
            const isLeafLink = typeof item.href === "string" && !item.children?.length;

            if (isLeafLink) {
              const href = item.href as string;
              return (
                <div key={item.label} className="mb-0.5">
                  <Link
                    href={href}
                    onClick={closeSidebar}
                    className={cn(
                      "group relative flex w-full items-center justify-start gap-3 rounded-md px-4 py-2.5 text-right text-sm transition",
                      active
                        ? "border border-border bg-surface-2 font-semibold text-gold shadow-card"
                        : "text-content hover:bg-gold-soft",
                    )}
                  >
                    {active && (
                      <span className="absolute right-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-gold" />
                    )}
                    {item.icon && <Icon name={item.icon} className="text-content-muted" />}
                    <span>{item.label}</span>
                  </Link>
                </div>
              );
            }

            return (
              <div key={item.label} className="mb-0.5">
                <button
                  type="button"
                  onClick={() => setOpen(isOpenGroup ? null : item.label)}
                  className={cn(
                    "group relative flex w-full items-center justify-between gap-3 rounded-md px-4 py-2.5 text-right text-sm transition",
                    active
                      ? "border border-border bg-surface-2 font-semibold text-gold shadow-card"
                      : "text-content hover:bg-gold-soft",
                  )}
                >
                  {active && (
                    <span className="absolute right-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-gold" />
                  )}
                  <span className="flex flex-1 items-center gap-3">
                    {item.icon && <Icon name={item.icon} className="text-content-muted" />}
                    <span>{item.label}</span>
                  </span>
                  <Icon
                    name="chevron-down"
                    size={16}
                    className={cn(
                      "text-content-muted transition-transform",
                      isOpenGroup && "rotate-180",
                    )}
                  />
                </button>

                {isOpenGroup && item.children && (
                  <div className="mt-0.5 space-y-0.5 pb-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.label}
                        href={child.href ?? "#"}
                        onClick={closeSidebar}
                        className={cn(
                          "block rounded-md px-4 py-2 pr-10 text-right text-[13px]",
                          isActive(pathname, searchParams, child.href, true)
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
          {NAV_FOOTER.map((item) =>
            item.label === "تسجيل الخروج" ? (
              <button
                key={item.label}
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-start gap-3 rounded-md px-4 py-2.5 text-right text-sm text-danger transition hover:bg-danger-soft"
              >
                {item.icon && <Icon name={item.icon} />}
                <span>{item.label}</span>
              </button>
            ) : (
              <Link
                key={item.label}
                href={item.href ?? "#"}
                onClick={closeSidebar}
                className="flex w-full items-center justify-start gap-3 rounded-md px-4 py-2.5 text-right text-sm text-content transition hover:bg-gold-soft"
              >
                {item.icon && <Icon name={item.icon} />}
                <span>{item.label}</span>
              </Link>
            ),
          )}
        </div>
      </aside>
    </>
  );
}
