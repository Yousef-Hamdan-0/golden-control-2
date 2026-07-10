import {
  invoiceRepository,
  type InvoiceListParams,
  type PaymentListParams,
  type PaymentPayloadInput,
} from "@/repositories/invoice.repository";
import type { Invoice } from "@/features/operations/types";

export const invoiceService = {
  list(params: InvoiceListParams = {}) {
    return invoiceRepository.list(params);
  },

  listAll(params: Omit<InvoiceListParams, "page"> = {}) {
    return invoiceRepository.listAll(params);
  },

  getById(id: string) {
    return invoiceRepository.getById(id);
  },

  create(input: Invoice) {
    return invoiceRepository.create(input);
  },

  refund(id: string) {
    return invoiceRepository.refund(id);
  },

  downloadPdf(id: string) {
    return invoiceRepository.downloadPdf(id);
  },

  recordPayment(input: PaymentPayloadInput) {
    return invoiceRepository.recordPayment(input);
  },

  listPayments(invoiceId: string, params: PaymentListParams = {}) {
    return invoiceRepository.listPayments(invoiceId, params);
  },
};
