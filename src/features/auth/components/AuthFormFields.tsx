"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import {
  applyArabicValidationMessage,
  clearCustomValidity,
} from "@/lib/forms/native-validation";

type AuthInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
};

export function AuthInput({
  id,
  label,
  leftSlot,
  rightSlot,
  className = "",
  onInvalid,
  onInput,
  ...props
}: AuthInputProps) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-2 block text-right text-[14px] font-medium text-[var(--text)]"
      >
        {label}
      </label>

      <div className="relative">
        {rightSlot ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--text-muted)]">
            {rightSlot}
          </span>
        ) : null}

        <input
          id={id}
          className={[
            "h-11 w-full rounded-sm border border-[var(--border)] bg-[var(--bg)] text-right text-[14px] text-[var(--text)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] outline-none transition",
            "placeholder:text-[var(--text-muted)] focus:border-[var(--gold)] focus:shadow-[0_0_0_3px_rgba(176,141,60,0.15)]",
            rightSlot ? "pr-11" : "pr-3",
            leftSlot ? "pl-11" : "pl-3",
          ].join(" ")}
          onInvalid={(event) => {
            applyArabicValidationMessage(event.currentTarget);
            onInvalid?.(event);
          }}
          onInput={(event) => {
            clearCustomValidity(event.currentTarget);
            onInput?.(event);
          }}
          {...props}
        />

        {leftSlot ? (
          <span className="absolute inset-y-0 left-3 flex items-center text-[var(--text-muted)]">
            {leftSlot}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

export function KeyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m12 12 8-8" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

export function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      {hidden ? <path d="m3 3 18 18" /> : null}
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function SubmitIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.4"
    >
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="m10 17 5-5-5-5" />
      <path d="M15 12H3" />
    </svg>
  );
}

export function PasswordVisibilityButton({
  isVisible,
  onClick,
}: {
  isVisible: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isVisible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
      className="flex h-8 w-8 items-center justify-center rounded-sm text-[var(--text-muted)] transition hover:bg-[var(--gold-soft)] hover:text-[var(--gold)]"
    >
      <EyeIcon hidden={!isVisible} />
    </button>
  );
}
