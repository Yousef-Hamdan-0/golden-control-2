"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import {
  AuthInput,
  KeyIcon,
  LockIcon,
  PasswordVisibilityButton,
  SubmitIcon,
} from "./AuthFormFields";
import { AuthShell } from "./AuthShell";

export function ResetPasswordScreen() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }

    setError("");
    setIsSubmitted(true);
  }

  return (
    <AuthShell>
      <div className="text-right">
        <p className="mb-2 text-[13px] font-medium text-[var(--gold-active)]">
          كلمة مرور جديدة
        </p>
        <h2 className="font-heading text-[26px] font-bold leading-relaxed text-[var(--text)]">
          إعادة تعيين كلمة المرور
        </h2>
        <p className="mt-3 text-[14px] leading-7 text-[var(--text-muted)]">
          اختر كلمة مرور قوية لحماية الوصول إلى لوحة التحكم.
        </p>
      </div>

      {isSubmitted ? (
        <div className="mt-8 rounded-md border border-[var(--border)] bg-[var(--bg)] p-5 text-right">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-sm bg-[var(--gold-soft)] text-[var(--gold-active)]">
            <KeyIcon />
          </div>
          <h3 className="font-heading text-[20px] font-bold text-[var(--text)]">
            تم تحديث كلمة المرور
          </h3>
          <p className="mt-2 text-[14px] leading-7 text-[var(--text-muted)]">
            يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-flex h-10 items-center justify-center rounded-sm border border-[var(--gold)] px-4 text-[14px] font-bold text-[var(--gold-active)] transition hover:bg-[var(--gold-soft)]"
          >
            الانتقال لتسجيل الدخول
          </Link>
        </div>
      ) : (
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <AuthInput
            id="recovery-code"
            name="recoveryCode"
            label="رمز الاستعادة"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            required
            rightSlot={<KeyIcon />}
          />

          <AuthInput
            id="new-password"
            name="password"
            label="كلمة المرور الجديدة"
            type={isPasswordVisible ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            minLength={8}
            required
            rightSlot={<LockIcon />}
            leftSlot={
              <PasswordVisibilityButton
                isVisible={isPasswordVisible}
                onClick={() => setIsPasswordVisible((value) => !value)}
              />
            }
          />

          <AuthInput
            id="confirm-password"
            name="confirmPassword"
            label="تأكيد كلمة المرور"
            type={isPasswordVisible ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            minLength={8}
            required
            rightSlot={<LockIcon />}
          />

          {error ? (
            <p className="rounded-sm border border-[var(--danger)] bg-[var(--danger-soft)] px-3 py-2 text-right text-[13px] text-[var(--danger)]">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center gap-3 rounded-sm bg-[var(--gold-active)] px-4 font-heading text-[20px] font-bold text-white shadow-[0_10px_24px_rgba(138,107,47,0.2)] transition hover:-translate-y-px hover:bg-[var(--gold)] hover:shadow-[0_16px_30px_rgba(176,141,60,0.26)] focus:outline-none focus:ring-4 focus:ring-[rgba(176,141,60,0.22)]"
          >
            <SubmitIcon />
            <span>حفظ كلمة المرور</span>
          </button>
        </form>
      )}
    </AuthShell>
  );
}
