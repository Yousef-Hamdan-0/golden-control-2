"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { formatMoney } from "@/lib/format/currency";
import { todayDateKey } from "@/lib/format/date";
import type { Invoice, InvoicePayment, PaymentMethod, PaymentCurrency } from "../../types";
import { USD_TO_SYP_RATE } from "../../constants";
import { remaining, convertPaymentToInvoiceCurrency } from "../../utils/invoice";
import { DetailItem } from "../shared/DetailItem";

export function AddPaymentModal({
  invoice,
  onClose,
  onSave,
  submitting = false,
  submitError,
}: {
  invoice: Invoice;
  onClose: () => void;
  onSave: (payment: InvoicePayment, convertedAmount: number) => void;
  submitting?: boolean;
  submitError?: string;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [currency, setCurrency] = useState<PaymentCurrency>("SYP");
  const remainingBefore = remaining(invoice.total, invoice.paid);
  const numericAmount = Number(amount) || 0;
  const convertedAmount = convertPaymentToInvoiceCurrency(numericAmount, currency, invoice.currency);
  const remainingAfter = Math.max(0, remainingBefore - convertedAmount);

  function save() {
    onSave(
      {
        id: `PAY-${Date.now().toString().slice(-5)}`,
        amount: numericAmount,
        convertedAmount,
        currency,
        method,
        paidAt: todayDateKey(),
      },
      convertedAmount,
    );
  }

  return (
    <Modal
      title="إضافة دفعة جديدة"
      description="تسجيل دفعة على الفاتورة مع حساب المتبقي بعد الدفع."
      onClose={onClose}
      widthClassName="max-w-2xl"
    >
      <div className="space-y-4 p-5">
        {submitError ? (
          <div className="rounded-md border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
            {submitError}
          </div>
        ) : null}
        <div className="grid gap-3 md:grid-cols-2">
          <DetailItem label="رقم الفاتورة" value={invoice.id} ltr />
          <DetailItem
            label="المبلغ المتبقي"
            value={formatMoney(remainingBefore, invoice.currency)}
          />
        </div>
        <div className="rounded-md border border-gold/30 bg-gold-soft p-3 text-sm text-content-muted">
          سعر صرف الدولار المستخدم مؤقتاً: {formatMoney(USD_TO_SYP_RATE, "SYP")} لكل 1 دولار. سيتم ربطه لاحقاً بمصدر API.
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="مبلغ الدفعة الجديدة">
            <Input
              type="number"
              min={0}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0"
              disabled={submitting}
            />
          </Field>
          <Field label="طريقة الدفع">
            <Select
              value={method}
              onChange={(event) => setMethod(event.target.value as PaymentMethod)}
              disabled={submitting}
            >
              <option value="cash">كاش</option>
              <option value="sham-cash">شام كاش</option>
            </Select>
          </Field>
          <Field label="نوع العملية">
            <Select
              value={currency}
              onChange={(event) => setCurrency(event.target.value as PaymentCurrency)}
              disabled={submitting}
            >
              <option value="SYP">ليرة</option>
              <option value="USD">دولار</option>
            </Select>
          </Field>
          <DetailItem
            label="المتبقي بعد الدفع"
            value={formatMoney(remainingAfter, invoice.currency)}
          />
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            إلغاء
          </Button>
          <Button type="button" onClick={save} disabled={numericAmount <= 0 || submitting}>
            {submitting ? "جاري الحفظ..." : "حفظ الدفعة"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
