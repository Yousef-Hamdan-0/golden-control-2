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
import type { Currency } from "@/lib/format/currency";

type JsonRecord = Record<string, unknown>;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type InvoiceApiStatus = "paid" | "paid_partial" | "refunded";
export type InvoiceApiPaymentMethod = "cash" | "sham_cash";

export interface InvoiceListParams {
  page?: number;
  pageSize?: number;
  requestId?: string;
  search?: string;
  type?: InvoiceType | "all";
  status?: PaymentStatus | "all";
  currency?: Currency | "all";
  paymentMethod?: PaymentMethod | "all";
  startDate?: string;
  endDate?: string;
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
    if (value === undefined || value === null || value === "") continue;
    const number = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

function maybeNumberValue(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (value === undefined || value === null || value === "") continue;
    const number = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(number)) return number;
  }

  return undefined;
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

function firstArray(...values: unknown[]): unknown[] {
  for (const value of values) {
    if (Array.isArray(value)) return value;
    if (isRecord(value)) {
      if (Array.isArray(value.items)) return value.items;
      if (Array.isArray(value.data)) return value.data;
    }
  }

  return [];
}

function firstRecord(...values: unknown[]): JsonRecord {
  for (const value of values) {
    if (isRecord(value)) return value;
    if (Array.isArray(value)) {
      const record = value.find(isRecord);
      if (record) return record;
    }
  }

  return {};
}

function invoiceDataRecord(payload: unknown) {
  const root = isRecord(payload) ? payload : {};
  if (isRecord(root.invoice)) return root.invoice;
  if (isRecord(root.invoiceData)) return root.invoiceData;
  if (isRecord(root.invoice_data)) return root.invoice_data;
  if (isRecord(root.data) && !Array.isArray(root.data)) {
    const data = root.data;
    if (isRecord(data.invoice)) return data.invoice;
    if (isRecord(data.invoiceData)) return data.invoiceData;
    if (isRecord(data.invoice_data)) return data.invoice_data;
  }
  return root;
}

function nestedName(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (!isRecord(value)) return "";
  const firstLast = [
    stringValue(value.firstName, value.first_name),
    stringValue(value.lastName, value.last_name),
  ]
    .filter(Boolean)
    .join(" ");

  return stringValue(
    value.fullName,
    value.full_name,
    value.displayName,
    value.display_name,
    value.name,
    value.username,
    value.title,
    value.email,
    firstLast,
    nestedName(value.user),
    nestedName(value.profile),
    nestedName(value.account),
    nestedName(value.employee),
  );
}

function nestedPhone(value: unknown): string {
  if (!isRecord(value)) return "";
  return stringValue(
    value.firstPhone,
    value.first_phone,
    value.phone,
    value.mobile,
    value.tel,
    value.telephone,
    value.phoneNumber,
    value.phone_number,
    value.mobileNumber,
    value.mobile_number,
    value.contactPhone,
    value.contact_phone,
    value.whatsapp,
    isRecord(value.user) ? nestedPhone(value.user) : undefined,
    isRecord(value.profile) ? nestedPhone(value.profile) : undefined,
  );
}

function nestedAddress(value: unknown) {
  if (!isRecord(value)) return "";
  return stringValue(
    value.address,
    value.fullAddress,
    value.full_address,
    value.customerAddress,
    value.customer_address,
    value.clientAddress,
    value.client_address,
    value.location,
    value.street,
    value.area,
  );
}

function nestedLocationUrl(value: unknown) {
  if (!isRecord(value)) return "";
  return stringValue(
    value.locationURL,
    value.locationUrl,
    value.location_url,
    value.locationLink,
    value.location_link,
    value.mapUrl,
    value.map_url,
  );
}

function isLikelyIdentifier(value: string): boolean {
  const trimmed = value.trim();
  return UUID_PATTERN.test(trimmed) || /^[0-9a-f]{24}$/i.test(trimmed);
}

function displayNameValue(...values: unknown[]): string {
  for (const value of values) {
    const name = nestedName(value).trim();
    if (name && !isLikelyIdentifier(name)) return name;
  }

  return "";
}

function booleanText(value: unknown) {
  if (typeof value === "boolean") return value ? "نعم" : "";
  return "";
}

function booleanValue(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
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
  const sparePart = firstRecord(
    raw.sparePart,
    raw.spare_part,
    raw.part,
    raw.partData,
    raw.part_data,
    raw.inventoryPart,
    raw.inventory_part,
    raw.item,
    raw.product,
  );
  const sparePartId = stringValue(
    raw.sparePartId,
    raw.spare_part_id,
    raw.partId,
    raw.part_id,
    raw.itemId,
    raw.item_id,
    raw.productId,
    raw.product_id,
    raw.inventoryPartId,
    raw.inventory_part_id,
    sparePart.id,
  );
  const quantity = Math.max(1, numberValue(raw.quantity, raw.qty, raw.count, 1));
  const unitPrice = numberValue(
    raw.unitPrice,
    raw.unit_price,
    raw.price,
    raw.cost,
    raw.amount,
    raw.unitAmount,
    raw.unit_amount,
  );
  const totalPrice = numberValue(
    raw.totalPrice,
    raw.total_price,
    raw.total,
    raw.totalAmount,
    raw.total_amount,
    quantity * unitPrice,
  );

  return {
    id: stringValue(raw.id, raw._id, sparePartId, `PRT-${index + 1}`),
    sparePartId,
    name: stringValue(
      raw.sparePartName,
      raw.spare_part_name,
      raw.partName,
      raw.part_name,
      raw.itemName,
      raw.item_name,
      raw.productName,
      raw.product_name,
      raw.title,
      raw.name,
      raw.description,
      nestedName(sparePart),
      sparePart.sparePartNumber,
      sparePart.spare_part_number,
      sparePart.partNumber,
      sparePart.part_number,
      sparePart.sku,
      "قطعة غير محددة",
    ),
    quantity,
    unitPrice,
    currency: normalizeCurrency(raw.currency ?? sparePart.currency),
    totalPrice,
  };
}

export function normalizeInvoicePayment(payload: unknown, index = 0): InvoicePayment {
  const raw = isRecord(payload) ? payload : {};
  const amount = numberValue(
    raw.amount,
    raw.paidAmount,
    raw.paid_amount,
    raw.paymentAmount,
    raw.payment_amount,
    raw.value,
    raw.total,
  );

  return {
    id: stringValue(raw.id, raw._id, `PAY-${index + 1}`),
    amount,
    currency: normalizeCurrency(raw.currency),
    method: toUiPaymentMethod(raw.paymentMethod ?? raw.payment_method ?? raw.method),
    dollarExchangeRate: maybeNumberValue(raw.dollarExchangeRate, raw.dollar_exchange_rate),
    convertedAmount: maybeNumberValue(
      raw.convertedAmount,
      raw.converted_amount,
      raw.convertedValue,
      raw.converted_value,
      raw.convertedAmountValue,
      raw.converted_amount_value,
    ),
    paidAt: stringValue(
      raw.paidAt,
      raw.paid_at,
      raw.paymentDate,
      raw.payment_date,
      raw.date,
      raw.createdAt,
      raw.created_at,
    ),
  };
}

export function normalizeInvoice(payload: unknown): Invoice {
  if (!isRecord(payload)) throw new ApiError("استجابة الفاتورة غير صالحة.");
  const root = isRecord(payload) ? payload : {};
  const data = dataRecord(payload);
  const invoice = invoiceDataRecord(payload);
  const request = firstRecord(
    invoice.request,
    invoice.repairRequest,
    invoice.repair_request,
    invoice.serviceRequest,
    invoice.service_request,
    invoice.maintenanceRequest,
    invoice.maintenance_request,
    invoice.order,
    invoice.orderData,
    invoice.order_data,
    isRecord(data) ? data.request : undefined,
    isRecord(data) ? data.repairRequest : undefined,
    isRecord(data) ? data.repair_request : undefined,
    isRecord(data) ? data.serviceRequest : undefined,
    isRecord(data) ? data.service_request : undefined,
    root.request,
  );
  const customer = firstRecord(
    request.customer,
    request.customerData,
    request.customer_data,
    request.client,
    request.clientData,
    request.client_data,
    invoice.customer,
    invoice.customerData,
    invoice.customer_data,
    invoice.client,
    invoice.clientData,
    invoice.client_data,
    isRecord(data) ? data.customer : undefined,
    isRecord(data) ? data.customerData : undefined,
    isRecord(data) ? data.customer_data : undefined,
    isRecord(data) ? data.client : undefined,
    root.customer,
  );
  const assignment = firstRecord(
    invoice.technicianAssignment,
    invoice.technician_assignment,
    invoice.latestTechnicianAssignment,
    invoice.latest_technician_assignment,
    invoice.technicianAssignments,
    invoice.technician_assignments,
    invoice.assignedTechnicians,
    invoice.assigned_technicians,
    invoice.assignment,
    invoice.assignments,
    request.technicianAssignment,
    request.technician_assignment,
    request.latestTechnicianAssignment,
    request.latest_technician_assignment,
    request.technicianAssignments,
    request.technician_assignments,
    request.assignedTechnicians,
    request.assigned_technicians,
    request.latestAssignment,
    request.latest_assignment,
    request.assignment,
    request.assignments,
    invoice.technicians,
    request.technicians,
  );
  const assignmentTechnician = firstRecord(assignment.technician, assignment.user);
  const technician = firstRecord(
    invoice.technician,
    invoice.technicianUser,
    invoice.technician_user,
    invoice.assignedTechnician,
    invoice.assigned_technician,
    invoice.assignedTo,
    invoice.assigned_to,
    request.technician,
    request.technicianUser,
    request.technician_user,
    request.currentTechnician,
    request.current_technician,
    request.assignedTechnician,
    request.assigned_technician,
    request.assignedTo,
    request.assigned_to,
    request.responsibleTechnician,
    request.responsible_technician,
    assignmentTechnician,
    assignment,
  );
  const rawItems = firstArray(
    invoice.items,
    invoice.invoiceItems,
    invoice.invoice_items,
    invoice.parts,
    invoice.spareParts,
    invoice.spare_parts,
    invoice.usedParts,
    invoice.used_parts,
    invoice.lineItems,
    invoice.line_items,
    invoice.details,
    invoice.invoiceDetails,
    invoice.invoice_details,
    invoice.expenses,
    invoice.services,
    invoice.serviceItems,
    invoice.service_items,
    isRecord(data) ? data.items : undefined,
    isRecord(data) ? data.invoiceItems : undefined,
    isRecord(data) ? data.invoice_items : undefined,
  );
  const rawPaymentItems = firstArray(
    invoice.payments,
    invoice.invoicePayments,
    invoice.invoice_payments,
    invoice.paymentRecords,
    invoice.payment_records,
    invoice.transactions,
    invoice.receipts,
    isRecord(data) ? data.payments : undefined,
    isRecord(data) ? data.invoicePayments : undefined,
    isRecord(data) ? data.invoice_payments : undefined,
    root.payments,
  );
  const singlePayment = firstRecord(invoice.payment, invoice.initialPayment, invoice.latestPayment);
  const paymentItems = rawPaymentItems.length
    ? rawPaymentItems
    : Object.keys(singlePayment).length
      ? [singlePayment]
      : [];
  const items = rawItems.map(normalizeInvoicePart);
  const payments = paymentItems.map(normalizeInvoicePayment);
  const itemsTotal = items.reduce(
    (sum, item) => sum + (item.totalPrice ?? item.quantity * item.unitPrice),
    0,
  );
  const total = numberValue(
    invoice.totalAmount,
    invoice.total_amount,
    invoice.total,
    invoice.grandTotal,
    invoice.grand_total,
    invoice.amount,
    itemsTotal,
  );
  const paid = numberValue(
    invoice.paidAmount,
    invoice.paid_amount,
    invoice.paid,
    invoice.totalPaid,
    invoice.total_paid,
    payments.reduce((sum, payment) => sum + (payment.convertedAmount ?? payment.amount), 0),
  );
  const currency = normalizeCurrency(
    invoice.totalCurrency ?? invoice.total_currency ?? invoice.currency ?? invoice.paymentCurrency,
  );
  const status = toUiInvoiceStatus(invoice.status, paid, total);
  const firstPayment = payments[0];
  const requestId = stringValue(invoice.requestId, invoice.request_id, request.id, request._id);
  const requestNumber = stringValue(
    invoice.requestNumber,
    invoice.request_number,
    invoice.orderNumber,
    invoice.order_number,
    invoice.requestCode,
    invoice.request_code,
    request.requestNumber,
    request.request_number,
    request.orderNumber,
    request.order_number,
    request.number,
    request.code,
  );
  const technicianId = stringValue(
    invoice.technicianId,
    invoice.technician_id,
    invoice.assignedTechnicianId,
    invoice.assigned_technician_id,
    invoice.assignedToId,
    invoice.assigned_to_id,
    request.technicianId,
    request.technician_id,
    request.assignedTechnicianId,
    request.assigned_technician_id,
    request.assignedToId,
    request.assigned_to_id,
    technician.id,
    technician._id,
    technician.userNumber,
    technician.user_number,
    assignment.technicianId,
    assignment.technician_id,
    assignment.userId,
    assignment.user_id,
    assignmentTechnician.id,
    assignmentTechnician._id,
    assignmentTechnician.userNumber,
    assignmentTechnician.user_number,
  );
  const invoiceNumber = stringValue(
    invoice.invoiceNumber,
    invoice.invoice_number,
    invoice.invoiceNo,
    invoice.invoice_no,
    invoice.invoiceCode,
    invoice.invoice_code,
    invoice.number,
    invoice.code,
    invoice.serial,
  );
  const technicianName = stringValue(
    displayNameValue(
      invoice.technicianName,
      invoice.technician_name,
      invoice.technicianFullName,
      invoice.technician_full_name,
      invoice.technician,
      invoice.technicianUser,
      invoice.technician_user,
      invoice.assignedTechnician,
      invoice.assigned_technician,
      invoice.assignedTo,
      invoice.assigned_to,
      request.technicianName,
      request.technician_name,
      request.technicianFullName,
      request.technician_full_name,
      request.technician,
      request.technicianUser,
      request.technician_user,
      request.currentTechnician,
      request.current_technician,
      request.assignedTechnician,
      request.assigned_technician,
      request.assignedTo,
      request.assigned_to,
      request.responsibleTechnician,
      request.responsible_technician,
      assignmentTechnician,
      assignment,
    ),
    "غير محدد",
  );

  return {
    id: stringValue(invoice.id, invoice._id, invoiceNumber),
    invoiceNumber,
    orderId: requestId || requestNumber,
    requestNumber,
    type: stringValue(invoice.type, request.type).toLowerCase() === "internal" ? "internal" : "external",
    client: stringValue(
      nestedName(customer),
      invoice.customerName,
      invoice.customer_name,
      invoice.clientName,
      invoice.client_name,
      typeof invoice.client === "string" ? invoice.client : undefined,
      request.customerName,
      request.customer_name,
      request.clientName,
      request.client_name,
      request.name,
      "غير محدد",
    ),
    clientPhone: stringValue(
      nestedPhone(customer),
      invoice.customerPhone,
      invoice.customer_phone,
      invoice.clientPhone,
      invoice.client_phone,
      request.customerPhone,
      request.customer_phone,
      request.clientPhone,
      request.client_phone,
      request.firstPhone,
      request.first_phone,
      request.phone,
      "غير محدد",
    ),
    clientPhone2: stringValue(
      customer.secondPhone,
      customer.second_phone,
      customer.phone2,
      invoice.customerSecondPhone,
      invoice.customer_second_phone,
      invoice.clientPhone2,
      invoice.client_phone_2,
      request.secondPhone,
      request.second_phone,
      request.customerSecondPhone,
      request.customer_second_phone,
      request.clientPhone2,
      request.client_phone_2,
      request.phone2,
      "لا يوجد",
    ),
    clientAddress: stringValue(
      nestedAddress(customer),
      invoice.customerAddress,
      invoice.customer_address,
      invoice.clientAddress,
      invoice.client_address,
      nestedAddress(request),
      request.address,
      "غير محدد",
    ),
    technicianId,
    technician: technicianName,
    technicianPhone: stringValue(
      nestedPhone(technician),
      nestedPhone(assignmentTechnician),
      invoice.technicianPhone,
      invoice.technician_phone,
      request.technicianPhone,
      request.technician_phone,
      "لا يوجد",
    ),
    status,
    currency,
    paymentMethod: toUiPaymentMethod(invoice.paymentMethod ?? invoice.payment_method ?? firstPayment?.method),
    total,
    paid: Math.min(total, Math.max(0, paid)),
    issuedAt: stringValue(invoice.issuedAt, invoice.issued_at, invoice.createdAt, invoice.created_at),
    warrantyDuration: stringValue(
      invoice.warrantyDuration,
      invoice.warranty_duration,
      invoice.warrantyPeriod,
      invoice.warranty_period,
      invoice.warranty,
    ),
    locationURL: stringValue(
      invoice.locationURL,
      invoice.locationUrl,
      invoice.location_url,
      nestedLocationUrl(customer),
      nestedLocationUrl(request),
    ),
    centerPullItems: stringValue(
      invoice.centerPullItems,
      invoice.center_pull_items,
      invoice.needsCenterMaintenance,
      invoice.needs_center_maintenance,
      invoice.centerMaintenanceNotes,
      invoice.center_maintenance_notes,
      booleanText(invoice.needsCenterMaintenance),
      booleanText(invoice.needs_center_maintenance),
    ),
    notes: stringValue(invoice.notes, invoice.note, invoice.description),
    returned: status === "refunded" || booleanValue(invoice.returned),
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
    const totalAmount = Math.max(0, Number(this.input.total) || 0);
    const paidAmount = Math.max(0, Number(this.input.paid) || 0);
    const currency = this.input.currency;
    const requestId = this.input.orderId.trim();
    if (!requestId) throw new ApiError("معرف الطلب مطلوب لإنشاء الفاتورة.");
    if (!isUuid(requestId)) {
      throw new ApiError("اختر الطلب من القائمة حتى يتم إرسال معرف الطلب الصحيح.");
    }
    if (totalAmount <= 0) throw new ApiError("المبلغ الكلي مطلوب لإنشاء الفاتورة.");
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
      locationURL: this.input.locationURL ?? "",
      needsCenterMaintenance: this.input.centerPullItems ?? "",
      items: this.input.parts.map((part) => {
        const sparePartId = part.sparePartId?.trim();
        if (!sparePartId) throw new ApiError("يجب اختيار قطعة غيار لكل بند في الفاتورة.");

        return {
          sparePartId,
          quantity: Math.max(1, Number(part.quantity) || 1),
          unitPrice: Math.max(0, Number(part.unitPrice) || 0),
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
