"use client";

import { useMemo, useState } from "react";
import { ConfirmToast } from "@/components/ui/ConfirmToast";
import { useToast } from "@/components/ui/Toast";
import { useRole } from "@/features/auth/hooks/use-role";
import { useInventoryAllPartsQuery } from "@/features/inventory/hooks/use-inventory";
import {
  useInvoiceMutations,
  useInvoicePaymentsQuery,
  useInvoiceQuery,
} from "@/features/invoices/hooks/use-invoices";
import { getApiErrorMessage } from "@/helpers/api.helper";
import type { Invoice } from "../../types";
import { InvoiceDetailsModal } from "./InvoiceDetailsModal";

function invoiceDisplayNumber(invoice: Invoice) {
  return invoice.invoiceNumber || invoice.id;
}

export function ManagedInvoiceDetailsModal({
  invoice,
  onClose,
  onAddPayment,
}: {
  invoice: Invoice;
  onClose: () => void;
  onAddPayment?: (invoice: Invoice) => void;
}) {
  const toast = useToast();
  const { role } = useRole();
  const { refund } = useInvoiceMutations();
  const [refundInvoice, setRefundInvoice] = useState<Invoice | null>(null);
  const detailQuery = useInvoiceQuery(invoice.id);
  const paymentsQuery = useInvoicePaymentsQuery(invoice.id);
  const partsQuery = useInventoryAllPartsQuery();
  const partNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const part of partsQuery.data ?? []) map.set(part.id, part.name);
    return map;
  }, [partsQuery.data]);
  const activeInvoice = detailQuery.data ?? invoice;
  const preparedInvoice: Invoice = {
    ...activeInvoice,
    payments: paymentsQuery.data ?? activeInvoice.payments,
    parts: activeInvoice.parts.map((part) => ({
      ...part,
      name: (part.sparePartId ? partNameById.get(part.sparePartId) : undefined) || part.name,
    })),
  };

  function confirmRefund() {
    if (!refundInvoice) return;
    const displayNumber = invoiceDisplayNumber(refundInvoice);
    refund.mutate(refundInvoice.id, {
      onSuccess: () => {
        setRefundInvoice(null);
        toast.success("تم إرجاع الفاتورة", `تم إرجاع الفاتورة ${displayNumber} بنجاح.`);
      },
      onError: (error) => toast.error("تعذر إرجاع الفاتورة", getApiErrorMessage(error)),
    });
  }

  return (
    <>
      <InvoiceDetailsModal
        invoice={preparedInvoice}
        onClose={onClose}
        onAddPayment={onAddPayment ? () => onAddPayment(preparedInvoice) : undefined}
        onReturnInvoice={role === "admin" ? setRefundInvoice : undefined}
      />
      {refundInvoice ? (
        <ConfirmToast
          title="تأكيد إرجاع الفاتورة"
          message={`هل تريد إرجاع الفاتورة ${invoiceDisplayNumber(refundInvoice)}؟`}
          confirmLabel="إرجاع الفاتورة"
          tone="danger"
          isLoading={refund.isPending}
          onCancel={() => setRefundInvoice(null)}
          onConfirm={confirmRefund}
        />
      ) : null}
    </>
  );
}
