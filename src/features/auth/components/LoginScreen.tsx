"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { createMockSession, writeMockSession } from "@/lib/auth/mock-session";
import {
  AuthInput,
  LockIcon,
  PasswordVisibilityButton,
  SubmitIcon,
  UserIcon,
} from "./AuthFormFields";
import { AuthShell } from "./AuthShell";

export function LoginScreen() {
  const router = useRouter();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const remember = formData.get("remember") === "on";

    if (!email || !password) {
      return;
    }

    setIsSubmitting(true);
    writeMockSession(createMockSession(email), remember);
    router.push("/dashboard");
  }

  return (
    <AuthShell>
      <div className="text-right">
        <h2 className="font-heading text-[26px] font-bold leading-relaxed text-[var(--text)]">
          تسجيل الدخول
        </h2>
        <p className="mt-3 text-[14px] leading-7 text-[var(--text-muted)]">
          أهلاً بك مجدداً، يرجى إدخال بياناتك للوصول إلى لوحة التحكم.
        </p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <AuthInput
          id="email"
          name="email"
          label="البريد الإلكتروني"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="example@gold.com"
          required
          rightSlot={<UserIcon />}
        />

        <AuthInput
          id="password"
          name="password"
          label="كلمة المرور"
          type={isPasswordVisible ? "text" : "password"}
          autoComplete="current-password"
          placeholder="••••••••"
          required
          rightSlot={<LockIcon />}
          leftSlot={
            <PasswordVisibilityButton
              isVisible={isPasswordVisible}
              onClick={() => setIsPasswordVisible((value) => !value)}
            />
          }
        />

        <div className="flex items-center justify-between gap-4 text-[13px]">
          <label className="flex cursor-pointer items-center gap-2 text-[var(--text-muted)]">
            <input
              name="remember"
              type="checkbox"
              className="h-4 w-4 rounded-sm border-[var(--border)] accent-[var(--gold-active)]"
            />
            <span>تذكرني</span>
          </label>

          <Link
            href="/forgot-password"
            className="font-medium text-[var(--gold-active)] transition hover:text-[var(--gold-hover)]"
          >
            نسيت كلمة المرور؟
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-12 w-full items-center justify-center gap-3 rounded-sm bg-[var(--gold-active)] px-4 font-heading text-[22px] font-bold text-white shadow-[0_10px_24px_rgba(138,107,47,0.2)] transition hover:-translate-y-px hover:bg-[var(--gold)] hover:shadow-[0_16px_30px_rgba(176,141,60,0.26)] focus:outline-none focus:ring-4 focus:ring-[rgba(176,141,60,0.22)]"
        >
          <SubmitIcon />
          <span>{isSubmitting ? "جار الدخول..." : "تسجيل الدخول"}</span>
        </button>
      </form>
    </AuthShell>
  );
}
