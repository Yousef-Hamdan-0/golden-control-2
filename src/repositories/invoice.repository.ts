import { API_ENDPOINTS } from "@/config/api-endpoints";
import { PAGE_SIZE } from "@/config/constants";
import {
  requestAuthenticatedApi,
  requestAuthenticatedBlob,
  type AuthenticatedBlobResponse,
} from "@/helpers/authenticated-api.helper";
import {
  InvoicePayloadModel,
  PaymentPayloadModel,
  normalizeInvoiceListResponse,
  normalizeInvoiceResponse,
  normalizePaymentListResponse,
  normalizePaymentResponse,
  toApiInvoiceStatus,
  toApiPaymentMethod,
  type InvoiceListParams,
  type PaymentListParams,
  type PaymentPayloadInput,
} from "@/models/invoices/invoice.model";
import type { Invoice, InvoicePayment } from "@/features/operations/types";

export type { InvoiceListParams, PaymentListParams, PaymentPayloadInput };

export const invoiceRepository = {
  async list(params: InvoiceListParams = {}) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? PAGE_SIZE;
    const searchParams = new URLSearchParams({
      page: String(page),
      limit: String(pageSize),
    });

    if (params.requestId?.trim()) searchParams.set("requestId", params.requestId.trim());
    if (params.type && params.type !== "all") searchParams.set("type", params.type);
    if (params.status && params.status !== "all" && params.status !== "unpaid") {
      searchParams.set("status", toApiInvoiceStatus(params.status));
    }

    const payload = await requestAuthenticatedApi(
      `${API_ENDPOINTS.invoices.root}?${searchParams}`,
      { method: "GET" },
    );

    return normalizeInvoiceListResponse(payload, { page, pageSize });
  },

  async getById(id: string): Promise<Invoice> {
    const payload = await requestAuthenticatedApi(API_ENDPOINTS.invoices.byId(id), {
      method: "GET",
    });
    return normalizeInvoiceResponse(payload);
  },

  async create(input: Invoice): Promise<Invoice> {
    const body = new InvoicePayloadModel(input).toJSON();
    const payload = await requestAuthenticatedApi(API_ENDPOINTS.invoices.root, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return normalizeInvoiceResponse(payload);
  },

  async downloadPdf(id: string): Promise<AuthenticatedBlobResponse> {
    return requestAuthenticatedBlob(API_ENDPOINTS.invoices.pdf(id), {
      method: "GET",
      headers: { Accept: "application/pdf" },
    });
  },

  async recordPayment(input: PaymentPayloadInput): Promise<InvoicePayment> {
    const body = new PaymentPayloadModel(input).toJSON();
    const payload = await requestAuthenticatedApi(API_ENDPOINTS.payments.root, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return normalizePaymentResponse(payload);
  },

  async listPayments(invoiceId: string, params: PaymentListParams = {}): Promise<InvoicePayment[]> {
    const searchParams = new URLSearchParams();
    if (params.currency && params.currency !== "all") searchParams.set("currency", params.currency);
    if (params.paymentMethod && params.paymentMethod !== "all") {
      searchParams.set("paymentMethod", toApiPaymentMethod(params.paymentMethod));
    }
    const suffix = searchParams.toString() ? `?${searchParams}` : "";
    const payload = await requestAuthenticatedApi(
      `${API_ENDPOINTS.payments.byInvoice(invoiceId)}${suffix}`,
      { method: "GET" },
    );

    return normalizePaymentListResponse(payload);
  },
};
