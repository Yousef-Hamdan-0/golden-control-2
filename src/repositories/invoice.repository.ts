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

type InvoiceListAllParams = Omit<InvoiceListParams, "page">;

function normalizePageParams(params: InvoiceListParams) {
  return {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? PAGE_SIZE,
  };
}

async function fetchInvoicePage(params: InvoiceListParams = {}) {
  const { page, pageSize } = normalizePageParams(params);
  const searchParams = new URLSearchParams({
    page: String(page),
    limit: String(pageSize),
  });

  if (params.requestId?.trim()) searchParams.set("requestId", params.requestId.trim());
  if (params.search?.trim()) searchParams.set("search", params.search.trim());
  if (params.type && params.type !== "all") searchParams.set("type", params.type);
  if (params.status && params.status !== "all" && params.status !== "unpaid") {
    searchParams.set("status", toApiInvoiceStatus(params.status));
  }
  if (params.currency && params.currency !== "all") searchParams.set("currency", params.currency);
  if (params.paymentMethod && params.paymentMethod !== "all") {
    searchParams.set("paymentMethod", toApiPaymentMethod(params.paymentMethod));
  }
  if (params.startDate?.trim()) searchParams.set("startDate", params.startDate.trim());
  if (params.endDate?.trim()) searchParams.set("endDate", params.endDate.trim());

  const payload = await requestAuthenticatedApi(
    `${API_ENDPOINTS.invoices.root}?${searchParams}`,
    { method: "GET" },
  );

  return normalizeInvoiceListResponse(payload, { page, pageSize });
}

async function fetchAllInvoices(params: InvoiceListAllParams = {}) {
  const pageSize = params.pageSize ?? PAGE_SIZE;
  const firstPage = await fetchInvoicePage({ ...params, page: 1, pageSize });
  const byId = new Map(firstPage.items.map((invoice) => [invoice.id, invoice]));
  const knownPages =
    firstPage.total > firstPage.items.length
      ? Math.max(1, Math.ceil(firstPage.total / firstPage.pageSize))
      : undefined;

  if (knownPages) {
    // The total is known, so fetch the remaining pages in parallel.
    const restPages = await Promise.all(
      Array.from({ length: knownPages - 1 }, (_, index) =>
        fetchInvoicePage({ ...params, page: index + 2, pageSize }),
      ),
    );
    restPages.forEach((result) =>
      result.items.forEach((invoice) => byId.set(invoice.id, invoice)),
    );
    return Array.from(byId.values());
  }

  // The total is unknown, so walk pages sequentially until an empty/short page.
  let page = 2;
  while (firstPage.items.length >= pageSize && page <= 100) {
    const result = await fetchInvoicePage({ ...params, page, pageSize });
    let addedNewInvoice = false;
    result.items.forEach((invoice) => {
      if (!byId.has(invoice.id)) addedNewInvoice = true;
      byId.set(invoice.id, invoice);
    });

    if (!addedNewInvoice || result.items.length < pageSize) break;
    page += 1;
  }

  return Array.from(byId.values());
}

export const invoiceRepository = {
  async list(params: InvoiceListParams = {}) {
    return fetchInvoicePage(params);
  },

  async listAll(params: InvoiceListAllParams = {}) {
    return fetchAllInvoices({ ...params, pageSize: params.pageSize ?? PAGE_SIZE });
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
