"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { getApiErrorMessage } from "@/helpers/api.helper";
import { getDeviceToken } from "@/helpers/device-token.helper";
import { clearAuthSession } from "@/helpers/auth-session.helper";
import { defaultRouteForRole, normalizeRole } from "@/lib/auth/permissions";
import { authService } from "@/services/auth.service";
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
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const remember = formData.get("remember") === "on";

    if (!email || !password) {
      setError("يرجى إدخال البريد الإلكتروني وكلمة المرور.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const session = await authService.login(
        {
          email,
          password,
          tokenDevice: getDeviceToken(),
        },
        remember,
      );
      const role = normalizeRole(session.role);

      // The technician web dashboard was removed — technicians work from
      // their mobile app, so the site has no screens for them after login.
      if (role === "technician") {
        clearAuthSession();
        setError("حسابات الفنيين تعمل عبر تطبيق الجوال فقط ولا تملك لوحة تحكم على الموقع.");
        return;
      }

      router.replace(role ? defaultRouteForRole(role) : "/dashboard");
      router.refresh();
    } catch (loginError) {
      setError(getApiErrorMessage(loginError));
    } finally {
      setIsSubmitting(false);
    }
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
          disabled={isSubmitting}
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
          disabled={isSubmitting}
          rightSlot={<LockIcon />}
          leftSlot={
            <PasswordVisibilityButton
              isVisible={isPasswordVisible}
              onClick={() => setIsPasswordVisible((value) => !value)}
            />
          }
        />

        <div className="flex items-center justify-end gap-4 text-[13px]">
          <label className="flex cursor-pointer items-center gap-2 text-[var(--text-muted)]">
            <input
              name="remember"
              type="checkbox"
              disabled={isSubmitting}
              className="h-4 w-4 rounded-sm border-[var(--border)] accent-[var(--gold-active)]"
            />
            <span>تذكرني</span>
          </label>
        </div>

        {error ? (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-sm border border-danger/30 bg-danger-soft px-4 py-3 text-right text-[13px] text-danger"
          >
            {error}
          </div>
        ) : null}

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
