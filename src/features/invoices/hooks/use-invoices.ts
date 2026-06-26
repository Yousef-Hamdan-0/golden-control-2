"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/query-keys";
import { invoiceService } from "@/services/invoice.service";
import type {
  InvoiceListParams,
  PaymentListParams,
  PaymentPayloadInput,
} from "@/repositories/invoice.repository";
import type { Invoice } from "@/features/operations/types";

export function useInvoicesQuery(params: InvoiceListParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.invoices.list(params),
    queryFn: () => invoiceService.list(params),
    enabled,
  });
}

export function useInvoicesAllQuery(
  params: Omit<InvoiceListParams, "page">,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.invoices.listAll(params),
    queryFn: () => invoiceService.listAll(params),
    enabled,
  });
}

export function useInvoiceQuery(id: string | null) {
  return useQuery({
    queryKey: queryKeys.invoices.detail(id ?? ""),
    queryFn: () => invoiceService.getById(id ?? ""),
    enabled: Boolean(id),
  });
}

export function useInvoicePaymentsQuery(invoiceId: string | null, params: PaymentListParams = {}) {
  return useQuery({
    queryKey: queryKeys.invoices.payments(invoiceId ?? "", params),
    queryFn: () => invoiceService.listPayments(invoiceId ?? "", params),
    enabled: Boolean(invoiceId),
  });
}

export function useInvoiceMutations() {
  const qc = useQueryClient();
  const invalidateInvoices = () => qc.invalidateQueries({ queryKey: queryKeys.invoices.all });

  const create = useMutation({
    mutationFn: (input: Invoice) => invoiceService.create(input),
    onSuccess: invalidateInvoices,
  });

  const recordPayment = useMutation({
    mutationFn: (input: PaymentPayloadInput) => invoiceService.recordPayment(input),
    onSuccess: async (_data, vars) => {
      await Promise.all([
        invalidateInvoices(),
        qc.invalidateQueries({ queryKey: queryKeys.invoices.detail(vars.invoiceId) }),
        qc.invalidateQueries({ queryKey: queryKeys.invoices.payments(vars.invoiceId, {}) }),
      ]);
    },
  });

  return { create, recordPayment };
}
