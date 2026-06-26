import { z } from "zod";
import { ApiError } from "@/helpers/api.helper";
import type {
  Invoice,
  InvoicePart,
  InvoicePayment,
  InvoiceType,
  PaymentCurrency,
  PaymentMethod,
  PaymentStatus,
} from "@/features/operations/types";
import { invoicePartsTotal } from "@/features/operations/utils/invoice";
import type { Currency } from "@/lib/format/currency";

type JsonRecord = Record<string, unknown>;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type InvoiceApiStatus = "paid" | "paid_partial" | "refunded";
export type InvoiceApiPaymentMethod = "cash" | "sham_cash";

export interface InvoiceListParams {
  page?: number;
  pageSize?: number;
  requestId?: string;
  type?: InvoiceType | "all";
  status?: PaymentStatus | "all";
}

export interface PaymentListParams {
  currency?: PaymentCurrency | "all";
  paymentMethod?: PaymentMethod | "all";
}

export interface InvoiceListResult {
  items: Invoice[];
  total: number;
  page: number;
  pageSize: number;
}

export function isUuid(value: string) {
  return UUID_PATTERN.test(value.trim());
}

export const PaymentPayloadSchema = z.object({
  invoiceId: z.string().trim().min(1, "معرف الفاتورة مطلوب"),
  amount: z.coerce.number().positive("مبلغ الدفعة مطلوب"),
  currency: z.enum(["SYP", "USD"]),
  paymentMethod: z.enum(["cash", "sham-cash"]),
});

export type PaymentPayloadInput = z.input<typeof PaymentPayloadSchema>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
  }
  return "";
}

function numberValue(...values: unknown[]): number {
  for (const value of values) {
    const number = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

function dateValue(...values: unknown[]) {
  const value = stringValue(...values);
  return value.length > 10 ? value.slice(0, 10) : value;
}

function dataRecord(payload: unknown) {
  const root = isRecord(payload) ? payload : {};
  return isRecord(root.data) ? root.data : root;
}

function arrayData(payload: unknown, ...keys: string[]) {
  const root = isRecord(payload) ? payload : {};
  const data = dataRecord(payload);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(root.data)) return root.data;
  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key];
    if (Array.isArray(root[key])) return root[key];
  }
  return [];
}

function invoiceDataRecord(payload: unknown) {
  const root = isRecord(payload) ? payload : {};
  if (isRecord(root.invoice)) return root.invoice;
  if (isRecord(root.invoiceData)) return root.invoiceData;
  if (isRecord(root.data) && !Array.isArray(root.data)) {
    const data = root.data;
    if (isRecord(data.invoice)) return data.invoice;
    if (isRecord(data.invoiceData)) return data.invoiceData;
  }
  return root;
}

function nestedName(value: unknown) {
  if (!isRecord(value)) return "";
  return stringValue(value.fullName, value.full_name, value.name, value.title);
}

function nestedPhone(value: unknown) {
  if (!isRecord(value)) return "";
  return stringValue(value.firstPhone, value.first_phone, value.phone, value.mobile);
}

function normalizeCurrency(value: unknown): Currency {
  return stringValue(value).toUpperCase() === "USD" ? "USD" : "SYP";
}

export function toApiInvoiceStatus(status: PaymentStatus): InvoiceApiStatus {
  if (status === "paid") return "paid";
  if (status === "refunded") return "refunded";
  return "paid_partial";
}

export function toUiInvoiceStatus(status: unknown, paid = 0, total = 0): PaymentStatus {
  const raw = stringValue(status).toLowerCase();
  if (raw === "paid") return "paid";
  if (raw === "refunded") return "refunded";
  if (raw === "paid_partial" || raw === "partial") return "partial";
  if (paid >= total && total > 0) return "paid";
  if (paid > 0) return "partial";
  return "unpaid";
}

export function toApiPaymentMethod(method: PaymentMethod): InvoiceApiPaymentMethod {
  return method === "sham-cash" ? "sham_cash" : "cash";
}

export function toUiPaymentMethod(method: unknown): PaymentMethod {
  const raw = stringValue(method).toLowerCase().replace(/_/g, "-");
  return raw === "sham-cash" ? "sham-cash" : "cash";
}

function normalizeInvoicePart(payload: unknown, index: number): InvoicePart {
  const raw = isRecord(payload) ? payload : {};
  const sparePart = isRecord(raw.sparePart) ? raw.sparePart : {};
  const sparePartId = stringValue(raw.sparePartId, raw.spare_part_id, sparePart.id);
  const quantity = Math.max(1, numberValue(raw.quantity, raw.qty, 1));
  const unitPrice = numberValue(raw.unitPrice, raw.unit_price, raw.price);
  const totalPrice = numberValue(raw.totalPrice, raw.total_price, quantity * unitPrice);

  return {
    id: stringValue(raw.id, raw._id, sparePartId, `PRT-${index + 1}`),
    sparePartId,
    name: stringValue(raw.sparePartName, raw.spare_part_name, nestedName(sparePart), "قطعة غير محددة"),
    quantity,
    unitPrice,
    currency: normalizeCurrency(raw.currency),
    totalPrice,
  };
}

export function normalizeInvoicePayment(payload: unknown, index = 0): InvoicePayment {
  const raw = isRecord(payload) ? payload : {};

  return {
    id: stringValue(raw.id, raw._id, `PAY-${index + 1}`),
    amount: numberValue(raw.amount),
    currency: normalizeCurrency(raw.currency),
    method: toUiPaymentMethod(raw.paymentMethod ?? raw.payment_method ?? raw.method),
    dollarExchangeRate: numberValue(raw.dollarExchangeRate, raw.dollar_exchange_rate) || undefined,
    convertedAmount: numberValue(raw.convertedAmount, raw.converted_amount, raw.amount),
    paidAt: dateValue(raw.paidAt, raw.paid_at, raw.createdAt, raw.created_at),
  };
}

export function normalizeInvoice(payload: unknown): Invoice {
  if (!isRecord(payload)) throw new ApiError("استجابة الفاتورة غير صالحة.");
  const invoice = invoiceDataRecord(payload);
  const request = isRecord(invoice.request) ? invoice.request : {};
  const customer = isRecord(request.customer) ? request.customer : {};
  const directCustomer = isRecord(invoice.customer) ? invoice.customer : {};
  const technician = isRecord(invoice.technician) ? invoice.technician : {};
  const items = arrayData(invoice.items, "items").map(normalizeInvoicePart);
  const payments = arrayData(invoice.payments, "payments").map(normalizeInvoicePayment);
  const total = numberValue(invoice.totalAmount, invoice.total_amount, invoice.total);
  const paid = numberValue(
    invoice.paidAmount,
    invoice.paid_amount,
    payments.reduce((sum, payment) => sum + (payment.convertedAmount ?? payment.amount), 0),
  );
  const currency = normalizeCurrency(invoice.totalCurrency ?? invoice.total_currency ?? invoice.currency);
  const status = toUiInvoiceStatus(invoice.status, paid, total);
  const firstPayment = payments[0];
  const requestId = stringValue(invoice.requestId, invoice.request_id, request.id);
  const requestNumber = stringValue(
    invoice.requestNumber,
    invoice.request_number,
    request.requestNumber,
    request.request_number,
  );

  return {
    id: stringValue(invoice.id, invoice._id, invoice.invoiceNumber, invoice.invoice_number),
    invoiceNumber: stringValue(invoice.invoiceNumber, invoice.invoice_number),
    orderId: requestId || requestNumber,
    requestNumber,
    type: stringValue(invoice.type, request.type).toLowerCase() === "internal" ? "internal" : "external",
    client: stringValue(
      nestedName(customer),
      nestedName(directCustomer),
      invoice.customerName,
      invoice.customer_name,
      "غير محدد",
    ),
    clientPhone: stringValue(
      nestedPhone(customer),
      nestedPhone(directCustomer),
      invoice.customerPhone,
      invoice.customer_phone,
      "غير محدد",
    ),
    clientPhone2: stringValue(customer.secondPhone, customer.second_phone, "لا يوجد"),
    clientAddress: stringValue(customer.address, directCustomer.address, request.address, "غير محدد"),
    technician: stringValue(nestedName(technician), invoice.technicianName, invoice.technician_name, "غير محدد"),
    technicianPhone: stringValue(technician.phone, invoice.technicianPhone, "لا يوجد"),
    status,
    currency,
    paymentMethod: firstPayment?.method ?? "cash",
    total,
    paid: Math.min(total, Math.max(0, paid)),
    issuedAt: dateValue(invoice.createdAt, invoice.created_at),
    warrantyDuration: stringValue(invoice.warrantyPeriod, invoice.warranty_period),
    centerPullItems: stringValue(invoice.needsCenterMaintenance, invoice.needs_center_maintenance),
    notes: stringValue(invoice.notes),
    returned: status === "refunded",
    parts: items,
    payments,
  };
}

export function normalizeInvoiceResponse(payload: unknown) {
  return normalizeInvoice(dataRecord(payload));
}

export function normalizeInvoiceListResponse(
  payload: unknown,
  fallback: { page: number; pageSize: number },
): InvoiceListResult {
  const root = isRecord(payload) ? payload : {};
  const data = dataRecord(payload);
  const pagination = isRecord(root.pagination)
    ? root.pagination
    : isRecord(data.pagination)
      ? data.pagination
      : {};
  const items = arrayData(payload, "invoices", "items", "records", "results", "rows", "list", "data")
    .map(normalizeInvoice);

  return {
    items,
    total: numberValue(
      pagination.total,
      pagination.totalItems,
      pagination.totalCount,
      pagination.count,
      root.total,
      root.totalItems,
      root.totalCount,
      root.totalInvoices,
      data.total,
      data.totalItems,
      data.totalCount,
      data.totalInvoices,
      items.length,
    ),
    page:
      numberValue(pagination.page, pagination.currentPage, data.page, root.page, fallback.page) ||
      fallback.page,
    pageSize:
      numberValue(
        pagination.limit,
        pagination.pageSize,
        pagination.perPage,
        data.limit,
        root.limit,
        fallback.pageSize,
      ) ||
      fallback.pageSize,
  };
}

export function normalizePaymentListResponse(payload: unknown) {
  return arrayData(payload, "payments", "items", "data").map(normalizeInvoicePayment);
}

export function normalizePaymentResponse(payload: unknown) {
  return normalizeInvoicePayment(dataRecord(payload));
}

export class InvoicePayloadModel {
  constructor(private readonly input: Invoice) {}

  toJSON() {
    const totalAmount = invoicePartsTotal(this.input.parts) || Math.max(0, Number(this.input.total) || 0);
    const paidAmount = Math.max(0, Number(this.input.paid) || 0);
    const currency = this.input.currency;
    const requestId = this.input.orderId.trim();
    if (!requestId) throw new ApiError("معرف الطلب مطلوب لإنشاء الفاتورة.");
    if (!isUuid(requestId)) {
      throw new ApiError("اختر الطلب من القائمة حتى يتم إرسال معرف الطلب الصحيح.");
    }
    if (paidAmount <= 0) throw new ApiError("مبلغ الدفعة الأولى مطلوب لإنشاء الفاتورة.");

    return {
      payment: {
        amount: paidAmount,
        currency,
        paymentMethod: toApiPaymentMethod(this.input.paymentMethod),
      },
      requestId,
      status: toApiInvoiceStatus(this.input.status),
      totalAmount,
      warrantyPeriod: this.input.warrantyDuration ?? "",
      notes: this.input.notes ?? "",
      needsCenterMaintenance: this.input.centerPullItems ?? "",
      items: this.input.parts.map((part) => {
        const sparePartId = part.sparePartId?.trim();
        if (!sparePartId) throw new ApiError("يجب اختيار قطعة غيار لكل بند في الفاتورة.");

        return {
          sparePartId,
          quantity: Math.max(1, Number(part.quantity) || 1),
          unitPrice: Math.max(0, Number(part.unitPrice) || 0),
          currency: part.currency ?? currency,
        };
      }),
    };
  }
}

export class PaymentPayloadModel {
  constructor(private readonly input: PaymentPayloadInput) {}

  toJSON() {
    const parsed = PaymentPayloadSchema.parse(this.input);
    return {
      invoiceId: parsed.invoiceId,
      amount: parsed.amount,
      currency: parsed.currency,
      paymentMethod: toApiPaymentMethod(parsed.paymentMethod),
    };
  }
}
