"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthInput, MailIcon, SubmitIcon } from "./AuthFormFields";
import { AuthShell } from "./AuthShell";

export function ForgotPasswordScreen() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  return (
    <AuthShell>
      <div className="text-right">
        <p className="mb-2 text-[13px] font-medium text-[var(--gold-active)]">
          استعادة الوصول
        </p>
        <h2 className="font-heading text-[26px] font-bold leading-relaxed text-[var(--text)]">
          نسيت كلمة المرور؟
        </h2>
        <p className="mt-3 text-[14px] leading-7 text-[var(--text-muted)]">
          أدخل البريد الإلكتروني المرتبط بحسابك لاستلام رابط إعادة التعيين.
        </p>
      </div>

      {isSubmitted ? (
        <div className="mt-8 rounded-md border border-[var(--border)] bg-[var(--bg)] p-5 text-right">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-sm bg-[var(--gold-soft)] text-[var(--gold-active)]">
            <MailIcon />
          </div>
          <h3 className="font-heading text-[20px] font-bold text-[var(--text)]">
            تم إرسال رابط الاستعادة
          </h3>
          <p className="mt-2 text-[14px] leading-7 text-[var(--text-muted)]">
            تحقق من صندوق البريد واتبع الرابط لتعيين كلمة مرور جديدة.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-flex h-10 items-center justify-center rounded-sm border border-[var(--gold)] px-4 text-[14px] font-bold text-[var(--gold-active)] transition hover:bg-[var(--gold-soft)]"
          >
            العودة لتسجيل الدخول
          </Link>
        </div>
      ) : (
        <form
          className="mt-8 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            setIsSubmitted(true);
          }}
        >
          <AuthInput
            id="recovery-email"
            label="البريد الإلكتروني"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="example@gold.com"
            required
            rightSlot={<MailIcon />}
          />

          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center gap-3 rounded-sm bg-[var(--gold-active)] px-4 font-heading text-[20px] font-bold text-white shadow-[0_10px_24px_rgba(138,107,47,0.2)] transition hover:-translate-y-px hover:bg-[var(--gold)] hover:shadow-[0_16px_30px_rgba(176,141,60,0.26)] focus:outline-none focus:ring-4 focus:ring-[rgba(176,141,60,0.22)]"
          >
            <SubmitIcon />
            <span>إرسال رابط الاستعادة</span>
          </button>

          <Link
            href="/login"
            className="block text-center text-[14px] font-medium text-[var(--gold-active)] transition hover:text-[var(--gold-hover)]"
          >
            العودة لتسجيل الدخول
          </Link>
        </form>
      )}
    </AuthShell>
  );
}
