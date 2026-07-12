"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { TablePagination } from "@/components/ui/TablePagination";
import { useToast } from "@/components/ui/Toast";
import { Icon } from "@/lib/icons";
import { formatMoney } from "@/lib/format/currency";
import { PAGE_SIZE } from "@/config/constants";
import { getApiErrorMessage } from "@/helpers/api.helper";
import { invoiceService } from "@/services/invoice.service";
import type { Invoice, Order } from "../../types";
import {
  PAYMENT_TONE,
  PAYMENT_LABELS,
  ORDER_STATUS_LABELS,
} from "../../constants";
import {
  typeLabel,
  currencyLabel,
  invoicePartTotal,
  remaining,
  convertPaymentToInvoiceCurrency,
} from "../../utils/invoice";
import { printInvoice } from "../../utils/pdf";
import { DetailItem } from "../shared/DetailItem";
import { EmptyState } from "../shared/EmptyState";

export function InvoiceDetailsModal({
  invoice,
  order,
  onClose,
  onAddPayment,
  onReturnInvoice,
}: {
  invoice: Invoice;
  order?: Order;
  onClose: () => void;
  onAddPayment?: () => void;
  onReturnInvoice?: (invoice: Invoice) => void;
}) {
  const toast = useToast();
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [downloading, setDownloading] = useState(false);
  const paymentPages = Math.max(1, Math.ceil(invoice.payments.length / PAGE_SIZE));
  const currentPaymentsPage = Math.min(paymentsPage, paymentPages);
  const visiblePayments = invoice.payments.slice(
    (currentPaymentsPage - 1) * PAGE_SIZE,
    currentPaymentsPage * PAGE_SIZE,
  );
  const canAddPayment = invoice.status !== "paid" && !invoice.returned;

  // Download the invoice as a real PDF file directly (server-rendered, same
  // layout as the printed copy including the warranty box and part names).
  async function downloadPdf() {
    setDownloading(true);
    try {
      const { blob, fileName } = await invoiceService.downloadPdf(invoice.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName ?? `invoice-${invoice.invoiceNumber || invoice.id}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("تعذر تنزيل PDF", getApiErrorMessage(error));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Modal
      title={`تفاصيل الفاتورة ${invoice.invoiceNumber || invoice.id}`}
      description="معاينة كاملة للفاتورة والقطع والدفعات قبل الطباعة أو التحميل."
      onClose={onClose}
      widthClassName="max-w-6xl"
    >
      <div className="space-y-5 p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <DetailItem label="رقم الفاتورة" value={invoice.invoiceNumber || invoice.id} ltr />
          <DetailItem label="رقم الطلب" value={invoice.requestNumber || invoice.orderId} ltr />
          <DetailItem label="نوع الفاتورة" value={typeLabel(invoice.type)} />
          <DetailItem
            label="حالة الفاتورة"
            value={
              <div className="flex flex-wrap gap-2">
                <Badge tone={PAYMENT_TONE[invoice.status]} dot>
                  {PAYMENT_LABELS[invoice.status]}
                </Badge>
                {invoice.returned ? <Badge tone="danger">مرجعة</Badge> : null}
              </div>
            }
          />
          <DetailItem label="اسم الفني" value={invoice.technician || "غير محدد"} />
        </div>

        <Card className="bg-surface-2 p-4 shadow-none">
          <h3 className="font-heading text-base font-bold text-content">بيانات العميل</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <DetailItem label="اسم العميل" value={invoice.client} />
            <DetailItem label="رقم 1" value={invoice.clientPhone} ltr />
            <DetailItem label="رقم 2" value={invoice.clientPhone2?.trim() || "لا يوجد"} ltr={Boolean(invoice.clientPhone2?.trim() && invoice.clientPhone2 !== "لا يوجد")} />
            <DetailItem label="العنوان" value={invoice.clientAddress || order?.address || "غير محدد"} />
          </div>
        </Card>

        <Card className="overflow-hidden shadow-none">
          <div className="border-b border-border px-4 py-3">
            <h3 className="font-heading text-base font-bold text-content">القطع المستخدمة</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-right text-sm">
              <thead>
                <tr className="bg-surface-2 text-content-muted">
                  {["اسم القطعة", "الكمية", "سعر كل قطعة", "الإجمالي"].map((header) => (
                    <th key={header} className="px-4 py-3 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoice.parts.map((part) => (
                  <tr key={part.id} className="border-t border-border">
                    <td className="px-4 py-3 text-content">{part.name}</td>
                    <td className="px-4 py-3 text-content-muted">{part.quantity}</td>
                    <td className="px-4 py-3 text-content-muted">
                      {formatMoney(part.unitPrice, invoice.currency)}
                    </td>
                    <td className="px-4 py-3 font-bold text-gold">
                      {formatMoney(invoicePartTotal(part), invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {invoice.parts.length === 0 ? <EmptyState title="لا توجد قطع مستخدمة في هذه الفاتورة." /> : null}
        </Card>

        <div className="grid gap-3 md:grid-cols-4">
          <DetailItem label="الإجمالي" value={formatMoney(invoice.total, invoice.currency)} />
          <DetailItem label="المدفوع" value={formatMoney(invoice.paid, invoice.currency)} />
          <DetailItem label="المتبقي" value={formatMoney(remaining(invoice.total, invoice.paid), invoice.currency)} />
          <DetailItem label="نوع العملة" value={currencyLabel(invoice.currency)} />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <DetailItem label="قطع تحتاج سحب للمركز" value={invoice.centerPullItems?.trim() || "لا يوجد"} />
          <DetailItem label="ملاحظات" value={invoice.notes?.trim() || "لا يوجد"} />
          <DetailItem label="مدة الكفالة" value={invoice.warrantyDuration?.trim() || "غير محددة"} />
        </div>

        {order ? (
          <Card className="bg-surface-2 p-4 shadow-none">
            <h3 className="font-heading text-base font-bold text-content">معلومات الطلب المرتبط</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <DetailItem label="رقم الطلب" value={order.id} ltr />
              <DetailItem label="الجهاز" value={order.device} />
              <DetailItem label="حالة الطلب" value={ORDER_STATUS_LABELS[order.status]} />
              <DetailItem label="موعد الزيارة" value={order.visitDate} />
            </div>
          </Card>
        ) : null}

        <Card className="overflow-hidden shadow-none">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <h3 className="font-heading text-base font-bold text-content">سجل المدفوعات</h3>
            {canAddPayment && onAddPayment ? (
              <Button type="button" size="sm" onClick={onAddPayment}>
                <Icon name="plus" size={16} />
                إضافة دفعة
              </Button>
            ) : null}
          </div>
          {invoice.payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-[360px] w-full text-right text-sm">
                <thead>
                  <tr className="bg-surface-2 text-content-muted">
                    {["المبلغ المدفوع", "المبلغ بعد التحويل"].map((header) => (
                      <th key={header} className="px-4 py-3 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visiblePayments.map((payment) => (
                    <tr key={payment.id} className="border-t border-border">
                      <td className="px-4 py-3 font-bold text-content">
                        {formatMoney(payment.amount, payment.currency)}
                      </td>
                      <td className="px-4 py-3 font-bold text-gold">
                        {formatMoney(
                          payment.convertedAmount ?? convertPaymentToInvoiceCurrency(payment.amount, payment.currency, invoice.currency),
                          invoice.currency,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="لا توجد دفعات مسجلة على هذه الفاتورة." />
          )}
          <TablePagination
            page={currentPaymentsPage}
            total={invoice.payments.length}
            pageSize={PAGE_SIZE}
            onPage={setPaymentsPage}
            itemLabel="دفعة"
          />
        </Card>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={() => printInvoice(invoice)}>
            <Icon name="file" size={18} />
            طباعة الفاتورة
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={downloading}
            onClick={downloadPdf}
          >
            <Icon name="file" size={18} />
            {downloading ? "جاري التحميل..." : "تحميل PDF"}
          </Button>
          {onReturnInvoice ? (
            <Button
              type="button"
              variant="danger"
              disabled={invoice.returned}
              onClick={() => onReturnInvoice(invoice)}
            >
              <Icon name="arrow-left" size={18} />
              إرجاع الفاتورة
            </Button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
