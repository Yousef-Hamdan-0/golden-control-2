"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

interface CounterInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
}

/**
 * Numeric counter with increment/decrement buttons AND direct manual typing.
 * The middle field is a real input (not a static label), so users can type a
 * value by hand while the +/- buttons keep working. Typed values are limited to
 * numbers and clamped to the optional min/max bounds.
 */
export function CounterInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled,
  className,
  id,
  "aria-label": ariaLabel,
}: CounterInputProps) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);

  // Reflect external value changes (e.g. via the buttons or a reset) into the
  // field, but never while the user is actively typing in it.
  useEffect(() => {
    if (!focused) setText(String(value));
  }, [value, focused]);

  function clamp(next: number) {
    let result = next;
    if (typeof min === "number") result = Math.max(min, result);
    if (typeof max === "number") result = Math.min(max, result);
    return result;
  }

  function stepBy(delta: number) {
    const parsed = Number(text);
    const current = Number.isNaN(parsed) ? (typeof min === "number" ? min : 0) : parsed;
    const next = clamp(current + delta);
    setText(String(next));
    onChange(next);
  }

  function handleType(raw: string) {
    const allowNegative = typeof min === "number" && min < 0;
    const cleaned = raw.replace(allowNegative ? /[^\d-]/g : /[^\d]/g, "");
    setText(cleaned);

    if (cleaned === "" || cleaned === "-") return;
    const parsed = Number(cleaned);
    if (!Number.isNaN(parsed)) onChange(clamp(parsed));
  }

  function handleBlur(raw: string) {
    setFocused(false);
    const parsed = Number(raw);
    const fallback = clamp(typeof min === "number" ? min : 0);
    const next = raw.trim() === "" || Number.isNaN(parsed) ? fallback : clamp(parsed);
    setText(String(next));
    onChange(next);
  }

  return (
    <div
      className={cn(
        "grid h-10 grid-cols-[36px_1fr_36px] items-center overflow-hidden rounded-md border border-border bg-surface-2",
        className,
      )}
    >
      <button
        type="button"
        disabled={disabled}
        aria-label="زيادة"
        className="h-full text-content-muted transition hover:bg-gold-soft hover:text-gold disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => stepBy(step)}
      >
        +
      </button>
      <input
        id={id}
        aria-label={ariaLabel}
        type="text"
        inputMode="numeric"
        dir="ltr"
        disabled={disabled}
        value={text}
        onFocus={() => setFocused(true)}
        onChange={(event) => handleType(event.target.value)}
        onBlur={(event) => handleBlur(event.target.value)}
        className="h-full w-full bg-transparent text-center font-heading text-base font-bold text-content focus:outline-none disabled:cursor-not-allowed"
      />
      <button
        type="button"
        disabled={disabled}
        aria-label="نقصان"
        className="h-full text-content-muted transition hover:bg-gold-soft hover:text-gold disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => stepBy(-step)}
      >
        -
      </button>
    </div>
  );
}
