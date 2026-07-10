"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { CURRENCY_SYMBOL } from "@/config/constants";
import {
  PAYROLL_ADJUSTMENT_LABELS,
  type PayrollAdjustmentInput,
} from "@/features/payroll-adjustments/models/payroll-adjustment.model";
import { Icon } from "@/lib/icons";
import type { User } from "@/models/auth/user.model";

interface PayrollAdjustmentFormModalProps {
  users: readonly User[];
  initialMonth: string;
  onClose: () => void;
  onSave: (input: PayrollAdjustmentInput) => void;
  submitting?: boolean;
  submitError?: string;
  submitLabel?: string;
}

const MONTH_OPTIONS = [
  { value: 1, label: "كانون الثاني" },
  { value: 2, label: "شباط" },
  { value: 3, label: "آذار" },
  { value: 4, label: "نيسان" },
  { value: 5, label: "أيار" },
  { value: 6, label: "حزيران" },
  { value: 7, label: "تموز" },
  { value: 8, label: "آب" },
  { value: 9, label: "أيلول" },
  { value: 10, label: "تشرين الأول" },
  { value: 11, label: "تشرين الثاني" },
  { value: 12, label: "كانون الأول" },
];

/** Keep manual typing working: accept Arabic-Indic digits and strip the rest. */
function sanitizeAmountText(value: string) {
  return value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[^\d]/g, "");
}

function monthParts(value: string) {
  const [year, month] = value.split("-").map(Number);
  const today = new Date();

  return {
    year: Number.isFinite(year) ? year : today.getFullYear(),
    month: Number.isFinite(month) && month >= 1 && month <= 12
      ? month
      : today.getMonth() + 1,
  };
}

export function PayrollAdjustmentFormModal({
  users,
  initialMonth,
  onClose,
  onSave,
  submitting = false,
  submitError = "",
  submitLabel = "إنشاء التسوية",
}: PayrollAdjustmentFormModalProps) {
  const initialDateParts = monthParts(initialMonth);
  const [draft, setDraft] = useState<PayrollAdjustmentInput>({
    userId: users[0]?.id ?? "",
    type: "salary",
    amount: 0,
    month: initialDateParts.month,
    year: initialDateParts.year,
    note: "",
  });
  const [amountValue, setAmountValue] = useState("");
  const [yearValue, setYearValue] = useState(String(initialDateParts.year));
  const [error, setError] = useState("");

  function submitAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(amountValue);
    const year = Number(yearValue);
    const normalized: PayrollAdjustmentInput = {
      ...draft,
      amount,
      month: Number(draft.month),
      year,
      note: draft.note.trim(),
    };

    if (!users.some((user) => user.id === normalized.userId)) {
      setError("يرجى اختيار مستخدم صحيح.");
      return;
    }

    if (!Number.isFinite(normalized.amount) || normalized.amount <= 0) {
      setError("يرجى إدخال مبلغ صحيح أكبر من صفر.");
      return;
    }

    if (!Number.isInteger(normalized.month) || normalized.month < 1 || normalized.month > 12) {
      setError("يرجى اختيار شهر صحيح.");
      return;
    }

    if (!Number.isInteger(normalized.year) || normalized.year < 2000 || normalized.year > 2100) {
      setError("يرجى إدخال سنة صحيحة بين 2000 و 2100.");
      return;
    }

    setError("");
    onSave(normalized);
  }

  return (
    <Modal
      title="إنشاء تسوية رواتب"
      description="أدخل بيانات التسوية وسيتم تسجيلها ضمن الشهر المختار في الصفحة."
      onClose={onClose}
      widthClassName="max-w-xl"
    >
      <form className="space-y-5 p-5" dir="rtl" onSubmit={submitAdjustment}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="المستخدم" htmlFor="payroll-user">
            <Select
              id="payroll-user"
              value={draft.userId}
              disabled={submitting}
              onChange={(event) =>
                setDraft((current) => ({ ...current, userId: event.target.value }))
              }
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName} - {user.jobTitle}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="نوع التسوية" htmlFor="payroll-type">
            <Select
              id="payroll-type"
              value={draft.type}
              disabled={submitting}
              onChange={(event) => {
                const value = event.target.value;
                setDraft((current) => ({
                  ...current,
                  type:
                    value === "salary" ||
                    value === "bonus" ||
                    value === "deduction" ||
                    value === "overtime" ||
                    value === "commission"
                      ? value
                      : "salary",
                }));
              }}
            >
              {Object.entries(PAYROLL_ADJUSTMENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {value === "salary" ? "سلفة" : label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="الشهر" htmlFor="payroll-month">
            <Select
              id="payroll-month"
              value={draft.month}
              disabled={submitting}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  month: Number(event.target.value),
                }))
              }
            >
              {MONTH_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="السنة" htmlFor="payroll-year">
            <Input
              id="payroll-year"
              type="number"
              min="2000"
              max="2100"
              inputMode="numeric"
              dir="ltr"
              value={yearValue}
              disabled={submitting}
              onChange={(event) => {
                setYearValue(event.target.value);
                setDraft((current) => ({
                  ...current,
                  year: Number(event.target.value),
                }));
              }}
            />
          </Field>

          <Field label="المبلغ" htmlFor="payroll-amount" className="sm:col-span-2">
            <div className="relative">
              <Input
                id="payroll-amount"
                type="text"
                inputMode="numeric"
                dir="ltr"
                className="pl-14"
                value={amountValue}
                placeholder="0"
                disabled={submitting}
                onChange={(event) => {
                  const cleaned = sanitizeAmountText(event.target.value);
                  setAmountValue(cleaned);
                  setDraft((current) => ({
                    ...current,
                    amount: cleaned === "" ? 0 : Number(cleaned),
                  }));
                }}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-content-muted">
                {CURRENCY_SYMBOL}
              </span>
            </div>
          </Field>

          <Field label="ملاحظة (اختياري)" htmlFor="payroll-note" className="sm:col-span-2">
            <Textarea
              id="payroll-note"
              rows={4}
              maxLength={300}
              value={draft.note}
              placeholder="اكتب ملاحظة عن التسوية..."
              disabled={submitting}
              onChange={(event) =>
                setDraft((current) => ({ ...current, note: event.target.value }))
              }
            />
          </Field>
        </div>

        {error || submitError ? (
          <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
            {error || submitError}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            إلغاء
          </Button>
          <Button type="submit" disabled={submitting}>
            <Icon name="plus" size={17} />
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
