"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { getApiErrorMessage } from "@/helpers/api.helper";
import { queryKeys } from "@/hooks/query-keys";
import { Icon } from "@/lib/icons";
import type { Invoice, InvoicePayment } from "@/features/operations/types";
import { createInvoiceDraftFromRequest } from "@/features/operations/utils/invoice";
import { InvoiceDetailsModal } from "@/features/operations/components/invoices/InvoiceDetailsModal";
import { InvoiceFormModal } from "@/features/operations/components/invoices/InvoiceFormModal";
import { AddPaymentModal } from "@/features/operations/components/invoices/AddPaymentModal";
import {
  useInvoiceMutations,
  useInvoicePaymentsQuery,
  useInvoiceQuery,
} from "@/features/invoices/hooks/use-invoices";
import { RequestCustomerSection } from "@/features/requests/components/RequestCustomerSection";
import { RequestDevicesSection } from "@/features/requests/components/RequestDevicesSection";
import { RequestInvoicesSection } from "@/features/requests/components/RequestInvoicesSection";
import { RequestNotesSection } from "@/features/requests/components/RequestNotesSection";
import { RequestRecordsSection } from "@/features/requests/components/RequestRecordsSection";
import { RequestSummarySection } from "@/features/requests/components/RequestSummarySection";
import { RequestStatusHistorySection } from "@/features/requests/components/RequestStatusHistorySection";
import { useDollarExchangeRate } from "@/features/settings/hooks/use-settings";
import {
  type RepairRequest,
  type RepairRequestStatusHistoryItem,
} from "@/models/requests/request.model";
import {
  canAddPayment,
  canCreateInvoiceForRequest,
  fallback,
  formatDate,
  invoiceDisplayNumber,
} from "@/features/requests/components/request-details.helpers";

export function RequestDetailsModal({
  request,
  isLoading,
  errorMessage,
  statusHistory,
  statusHistoryLoading,
  statusHistoryError,
  technicianDisplayName,
  usersById,
  downloadingPdf,
  printingPdf,
  onClose,
  onEdit,
  onDownloadPdf,
  onPrintReport,
}: {
  request: RepairRequest | null;
  isLoading: boolean;
  errorMessage?: string;
  statusHistory: RepairRequestStatusHistoryItem[];
  statusHistoryLoading: boolean;
  statusHistoryError?: string;
  technicianDisplayName?: string;
  usersById?: Map<string, string>;
  downloadingPdf: boolean;
  /** True while the print copy is being fetched (same source as the download). */
  printingPdf?: boolean;
  onClose: () => void;
  /** Omitted for roles that cannot edit (technician). */
  onEdit?: (request: RepairRequest) => void;
  /** Omitted for roles that cannot download the PDF (technician). */
  onDownloadPdf?: (request: RepairRequest) => void;
  /** Omitted for roles that cannot print the report (technician). */
  onPrintReport?: (request: RepairRequest) => void;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceNotice, setInvoiceNotice] = useState<string | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const { create, recordPayment } = useInvoiceMutations();
  const dollarExchangeRate = useDollarExchangeRate();
  const invoices = request?.invoices ?? [];
  const hasInvoice = Boolean(request?.hasInvoice) || invoices.length > 0;
  const canCreateRequestInvoice = Boolean(
    request && canCreateInvoiceForRequest(request) && !hasInvoice,
  );
  const invoiceDraft = useMemo(
    () => (request ? createInvoiceDraftFromRequest(request) : null),
    [request],
  );
  const invoiceDetailQuery = useInvoiceQuery(viewingInvoice?.id ?? null);
  const invoicePaymentsQuery = useInvoicePaymentsQuery(viewingInvoice?.id ?? null);
  const activeViewingInvoice = invoiceDetailQuery.data ?? viewingInvoice;
  const activeViewingInvoiceWithPayments = activeViewingInvoice
    ? { ...activeViewingInvoice, payments: invoicePaymentsQuery.data ?? activeViewingInvoice.payments }
    : null;

  function showCreateInvoice() {
    if (!request || !invoiceDraft) return;
    setInvoiceNotice(null);

    if (!canCreateInvoiceForRequest(request)) {
      setInvoiceNotice("إنشاء الفاتورة متاح فقط إذا كان الطلب مكتملًا أو غير مكتمل.");
      return;
    }

    if (hasInvoice) {
      setInvoiceNotice("توجد فاتورة لهذا الطلب بالفعل، لذلك لا يمكن إنشاء فاتورة جديدة.");
      return;
    }

    create.reset();
    setShowInvoiceForm(true);
  }

  function saveInvoice(nextInvoice: Invoice) {
    if (!request) return;

    create.mutate(nextInvoice, {
      onSuccess: (createdInvoice) => {
        const linkedInvoice = {
          ...createdInvoice,
          orderId: createdInvoice.orderId || request.id,
          requestNumber: createdInvoice.requestNumber || request.requestNumber,
        };
        setShowInvoiceForm(false);
        setViewingInvoice(linkedInvoice);
        void queryClient.invalidateQueries({ queryKey: queryKeys.requests.detail(request.id) });
        toast.success("تم إنشاء الفاتورة", `تم إنشاء الفاتورة ${invoiceDisplayNumber(linkedInvoice)} للطلب ${request.requestNumber}.`);
      },
      onError: (error) => toast.error("تعذر إنشاء الفاتورة", getApiErrorMessage(error)),
    });
  }

  function savePayment(payment: InvoicePayment, convertedAmount: number) {
    if (!paymentInvoice) return;
    void convertedAmount;

    recordPayment.mutate(
      {
        invoiceId: paymentInvoice.id,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.method,
      },
      {
        onSuccess: () => {
          setPaymentInvoice(null);
          void queryClient.invalidateQueries({
            queryKey: queryKeys.requests.detail(request?.id ?? paymentInvoice.orderId),
          });
          toast.success("تم حفظ الدفعة", `تم تسجيل دفعة على الفاتورة ${invoiceDisplayNumber(paymentInvoice)} بنجاح.`);
        },
        onError: (error) => toast.error("تعذر حفظ الدفعة", getApiErrorMessage(error)),
      },
    );
  }

  return (
    <>
      <Modal
        title="تفاصيل الطلب"
        description="بيانات العميل، الأجهزة، الحالة، سجل الحالة، الفواتير، والتسجيلات الصوتية."
        onClose={onClose}
        widthClassName="max-w-5xl"
      >
      <div className="space-y-5 p-5">
        {errorMessage ? (
          <div className="rounded-md border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
            تعذر تحميل تفاصيل الطلب. {errorMessage}
          </div>
        ) : null}

        {!request && isLoading ? (
          <div className="flex items-center justify-center gap-3 rounded-md border border-border bg-surface-2 p-8 text-sm text-content-muted">
            <Spinner />
            جاري تحميل بيانات الطلب...
          </div>
        ) : null}

        {request ? (
          <>
            {onEdit ? (
              <div className="flex flex-wrap items-center justify-end gap-2 border-b border-border pb-4">
                <Button type="button" size="sm" onClick={() => onEdit(request)}>
                  <Icon name="pencil" size={16} />
                  تعديل
                </Button>
              </div>
            ) : null}

            <RequestSummarySection request={request} technicianDisplayName={technicianDisplayName} />

            <RequestCustomerSection customer={request.customer} />

            <RequestDevicesSection devices={request.devices} />

            <RequestNotesSection faultDescription={request.faultDescription} notes={request.notes} />

            <RequestStatusHistorySection
              statusHistory={statusHistory}
              statusHistoryLoading={statusHistoryLoading}
              statusHistoryError={statusHistoryError}
              usersById={usersById ?? new Map()}
            />

            <RequestInvoicesSection
              invoices={invoices}
              invoiceNotice={invoiceNotice}
              canCreateRequestInvoice={canCreateRequestInvoice}
              creatingInvoice={create.isPending}
              onCreateInvoice={showCreateInvoice}
              onViewInvoice={setViewingInvoice}
              onAddPayment={setPaymentInvoice}
            />

            <RequestRecordsSection records={request.records} />

            {onDownloadPdf || onPrintReport ? (
              <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
                {onPrintReport ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={printingPdf}
                    onClick={() => onPrintReport(request)}
                  >
                    <Icon name="file" size={16} />
                    {printingPdf ? "جاري التجهيز..." : "طباعة وصل الطلب"}
                  </Button>
                ) : null}
                {onDownloadPdf ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={downloadingPdf}
                    onClick={() => onDownloadPdf(request)}
                  >
                    <Icon name="file" size={16} />
                    {downloadingPdf ? "جاري التحميل..." : "تحميل PDF"}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
      </Modal>

      {showInvoiceForm && invoiceDraft ? (
        <InvoiceFormModal
          invoice={invoiceDraft}
          mode="create"
          lockRequest
          onClose={() => setShowInvoiceForm(false)}
          onSave={saveInvoice}
          submitting={create.isPending}
          submitError={create.error ? getApiErrorMessage(create.error) : undefined}
          dollarExchangeRate={dollarExchangeRate}
        />
      ) : null}
      {activeViewingInvoiceWithPayments ? (
        <InvoiceDetailsModal
          invoice={activeViewingInvoiceWithPayments}
          onClose={() => setViewingInvoice(null)}
          onAddPayment={
            canAddPayment(activeViewingInvoiceWithPayments)
              ? () => setPaymentInvoice(activeViewingInvoiceWithPayments)
              : undefined
          }
        />
      ) : null}
      {paymentInvoice ? (
        <AddPaymentModal
          invoice={paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          onSave={savePayment}
          submitting={recordPayment.isPending}
          submitError={recordPayment.error ? getApiErrorMessage(recordPayment.error) : undefined}
          dollarExchangeRate={dollarExchangeRate}
        />
      ) : null}
    </>
  );
}
