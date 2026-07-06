"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  PAYMENT_LABELS,
  PAYMENT_TONE,
} from "@/features/operations/constants";
import type { Invoice } from "@/features/operations/types";
import { remaining } from "@/features/operations/utils/invoice";
import { formatMoney } from "@/lib/format/currency";
import { Icon } from "@/lib/icons";
import {
  canAddPayment,
  formatDateTime,
  invoiceDisplayNumber,
} from "@/features/requests/components/request-details.helpers";

export function RequestInvoicesSection({
  invoices,
  invoiceNotice,
  canCreateRequestInvoice,
  creatingInvoice,
  onCreateInvoice,
  onViewInvoice,
  onAddPayment,
}: {
  invoices: Invoice[];
  invoiceNotice: string | null;
  canCreateRequestInvoice: boolean;
  creatingInvoice: boolean;
  onCreateInvoice: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  onAddPayment: (invoice: Invoice) => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-heading text-base font-bold text-gold">سجل الفواتير</h3>
        {canCreateRequestInvoice ? (
          <Button
            type="button"
            size="sm"
            disabled={creatingInvoice}
            onClick={onCreateInvoice}
          >
            <Icon name="plus" size={16} />
            إنشاء فاتورة
          </Button>
        ) : null}
      </div>

      {invoiceNotice ? (
        <div className="rounded-md border border-gold/30 bg-gold-soft p-3 text-sm font-medium text-gold-active">
          {invoiceNotice}
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="min-w-[820px] w-full text-right text-sm">
          <thead>
            <tr className="bg-surface-2 text-content-muted">
              {["رقم الفاتورة", "الحالة", "الإجمالي", "المدفوع", "المتبقي", "وقت الإنشاء", "إجراءات"].map((header) => (
                <th key={header} className="px-4 py-3 font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.length ? (
              invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t border-border">
                  <td className="px-4 py-3 font-bold text-gold" dir="ltr">
                    {invoiceDisplayNumber(invoice)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={PAYMENT_TONE[invoice.status]} dot>
                      {PAYMENT_LABELS[invoice.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-content-muted">
                    {formatMoney(invoice.total, invoice.currency)}
                  </td>
                  <td className="px-4 py-3 text-content-muted">
                    {formatMoney(invoice.paid, invoice.currency)}
                  </td>
                  <td className="px-4 py-3 text-content-muted">
                    {formatMoney(remaining(invoice.total, invoice.paid), invoice.currency)}
                  </td>
                  <td className="px-4 py-3 text-content-muted">{formatDateTime(invoice.issuedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-start gap-2" dir="rtl">
                      <button
                        type="button"
                        aria-label={`تفاصيل الفاتورة ${invoiceDisplayNumber(invoice)}`}
                        title="تفاصيل الفاتورة"
                        onClick={() => onViewInvoice(invoice)}
                        className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2"
                      >
                        <Icon name="eye" size={18} />
                      </button>
                      <button
                        type="button"
                        aria-label={`دفعة ${invoiceDisplayNumber(invoice)}`}
                        title="إضافة دفعة"
                        disabled={!canAddPayment(invoice)}
                        onClick={() => onAddPayment(invoice)}
                        className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Icon name="plus" size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="border-t border-border">
                <td className="px-4 py-6 text-center text-content-muted" colSpan={7}>
                  لا توجد فواتير مرتبطة بهذا الطلب حالياً.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
