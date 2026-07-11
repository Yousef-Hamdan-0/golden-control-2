"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Icon } from "@/lib/icons";
import { OverlayPortal } from "@/components/ui/OverlayPortal";
import {
  WEEKDAY_LABELS,
  WEEK_START_DAY,
  formatSyriacDate,
  monthLabel,
} from "@/lib/format/months";

const POPUP_WIDTH = 300;
const POPUP_HEIGHT = 360;
const POPUP_GAP = 8;

interface DatePickerProps {
  /** Selected date as "YYYY-MM-DD" (or "" when empty). */
  value: string;
  /** Emits "YYYY-MM-DD" (or "" when cleared). */
  onChange: (value: string) => void;
  /** Earliest selectable date as "YYYY-MM-DD". */
  min?: string;
  /** Latest selectable date as "YYYY-MM-DD". */
  max?: string;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
  className?: string;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toKey(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function parseKey(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3]) };
}

/**
 * Unified, modern date picker used across the app. Renders a custom calendar
 * popup with Assyrian/Syriac month names instead of the browser's native date
 * control, while keeping the same value contract ("YYYY-MM-DD" string).
 */
export function DatePicker({
  value,
  onChange,
  min,
  max,
  disabled,
  id,
  placeholder = "اختر التاريخ",
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const parsed = parseKey(value);

  const [view, setView] = useState(() => {
    const now = new Date();
    return parsed
      ? { year: parsed.year, month: parsed.month }
      : { year: now.getFullYear(), month: now.getMonth() };
  });

  // Keep the visible month in sync when the value is changed from outside.
  useEffect(() => {
    if (parsed) setView({ year: parsed.year, month: parsed.month });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Position the (portaled) calendar under the trigger, flipping above when
  // there is not enough room below, and clamping inside the viewport.
  function updatePosition() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    let top = rect.bottom + POPUP_GAP;
    if (top + POPUP_HEIGHT > window.innerHeight && rect.top - POPUP_GAP - POPUP_HEIGHT > 0) {
      top = rect.top - POPUP_GAP - POPUP_HEIGHT;
    }

    let left = rect.right - POPUP_WIDTH;
    left = Math.max(POPUP_GAP, Math.min(left, window.innerWidth - POPUP_WIDTH - POPUP_GAP));

    setCoords({ top, left });
  }

  function toggleOpen() {
    if (open) {
      setOpen(false);
      return;
    }
    updatePosition();
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;

    function handlePointer(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || popupRef.current?.contains(target)) return;
      setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function handleReposition() {
      updatePosition();
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open]);

  const cells = useMemo(() => {
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const firstDayOfWeek = new Date(view.year, view.month, 1).getDay();
    const offset = (firstDayOfWeek - WEEK_START_DAY + 7) % 7;
    const list: Array<number | null> = Array.from({ length: offset }, () => null);
    for (let day = 1; day <= daysInMonth; day += 1) list.push(day);
    return list;
  }, [view]);

  function isOutOfRange(key: string) {
    if (min && key < min) return true;
    if (max && key > max) return true;
    return false;
  }

  function goToPreviousMonth() {
    setView((current) =>
      current.month === 0
        ? { year: current.year - 1, month: 11 }
        : { year: current.year, month: current.month - 1 },
    );
  }

  function goToNextMonth() {
    setView((current) =>
      current.month === 11
        ? { year: current.year + 1, month: 0 }
        : { year: current.year, month: current.month + 1 },
    );
  }

  const now = new Date();
  const todayKey = toKey(now.getFullYear(), now.getMonth(), now.getDate());
  const display = formatSyriacDate(value);

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        onClick={toggleOpen}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-md border border-border bg-surface-2 px-3 text-sm text-content",
          "transition-shadow duration-150 ease-out",
          "focus:border-primary focus:bg-surface focus:outline-none focus:ring-[3px] focus:ring-gold/15",
          "disabled:cursor-not-allowed disabled:opacity-60",
          open && "border-primary bg-surface ring-[3px] ring-gold/15",
        )}
      >
        <span className={cn("truncate", display ? "text-content" : "text-content-muted")}>
          {display || placeholder}
        </span>
        <Icon name="calendar" size={18} className="shrink-0 text-gold" />
      </button>

      {open && !disabled && coords ? (
        <OverlayPortal lockScroll={false}>
          <div
            ref={popupRef}
            dir="rtl"
            style={{ position: "fixed", top: coords.top, left: coords.left, width: POPUP_WIDTH }}
            className="z-[200] rounded-xl border border-border bg-surface p-3 shadow-card"
          >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              aria-label="الشهر السابق"
              onClick={goToPreviousMonth}
              className="flex h-8 w-8 items-center justify-center rounded-md text-content-muted transition hover:bg-gold-soft hover:text-gold"
            >
              <Icon name="chevron-right" size={18} />
            </button>
            <div className="font-heading text-sm font-bold text-content">
              {monthLabel(view.month + 1)} {view.year}
            </div>
            <button
              type="button"
              aria-label="الشهر التالي"
              onClick={goToNextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-md text-content-muted transition hover:bg-gold-soft hover:text-gold"
            >
              <Icon name="chevron-left" size={18} />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-content-muted">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label} className="py-1">
                {label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, index) => {
              if (day === null) return <span key={`empty-${index}`} />;

              const key = toKey(view.year, view.month, day);
              const selected = key === value;
              const isToday = key === todayKey;
              const outOfRange = isOutOfRange(key);

              return (
                <button
                  key={key}
                  type="button"
                  disabled={outOfRange}
                  onClick={() => {
                    onChange(key);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex h-9 items-center justify-center rounded-md text-sm transition",
                    selected
                      ? "bg-gold-active font-bold text-white"
                      : "text-content hover:bg-gold-soft hover:text-gold",
                    !selected && isToday && "border border-gold text-gold",
                    outOfRange && "cursor-not-allowed opacity-30 hover:bg-transparent hover:text-content",
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="rounded-md px-2 py-1 text-xs text-content-muted transition hover:bg-surface-2 hover:text-content"
            >
              مسح
            </button>
            <button
              type="button"
              disabled={isOutOfRange(todayKey)}
              onClick={() => {
                onChange(todayKey);
                setOpen(false);
              }}
              className="rounded-md px-2 py-1 text-xs font-medium text-gold transition hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
            >
              اليوم
            </button>
          </div>
          </div>
        </OverlayPortal>
      ) : null}
    </div>
  );
}
