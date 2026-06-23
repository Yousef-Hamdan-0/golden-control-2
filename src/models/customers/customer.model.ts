import { z } from "zod";
import { ApiError } from "@/helpers/api.helper";

type JsonRecord = Record<string, unknown>;

export interface CustomerRepairRequest {
  id: string;
  requestNumber: string;
  type: string;
  customerId: string;
  priority: string;
  faultDescription: string;
  notes: string;
  scheduledDate: string;
  isRepeated: boolean;
  isCompleted: boolean;
  status: string;
  createdBy: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  customerNumber: string;
  name: string;
  firstPhone: string;
  secondPhone: string;
  address: string;
  locationLink: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  requests: CustomerRepairRequest[];
}

export const CustomerListQuerySchema = z.object({
  name: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  page: z.coerce.number().int().positive(),
  limit: z.coerce.number().int().positive().max(1000),
});

export type CustomerListQuery = z.infer<typeof CustomerListQuerySchema>;

export const CustomerInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "اسم العميل مطلوب.")
    .max(255, "اسم العميل يجب ألا يتجاوز 255 حرفاً."),
  firstPhone: z
    .string()
    .trim()
    .min(1, "رقم الهاتف الأول مطلوب.")
    .max(50, "رقم الهاتف الأول يجب ألا يتجاوز 50 حرفاً."),
  secondPhone: z
    .string()
    .trim()
    .max(50, "رقم الهاتف الثاني يجب ألا يتجاوز 50 حرفاً.")
    .optional()
    .default(""),
  address: z.string().trim().max(500, "العنوان طويل جداً.").optional().default(""),
  locationLink: z
    .string()
    .trim()
    .max(2_000, "رابط الموقع طويل جداً.")
    .optional()
    .default(""),
});

export type CustomerInput = z.input<typeof CustomerInputSchema>;
export type ParsedCustomerInput = z.infer<typeof CustomerInputSchema>;
export const CustomerPatchSchema = CustomerInputSchema.partial();
export type CustomerPatchInput = Partial<ParsedCustomerInput>;

const CUSTOMER_FIELDS = [
  "name",
  "firstPhone",
  "secondPhone",
  "address",
  "locationLink",
] as const;

export interface NormalizedCustomerList {
  items: Customer[];
  total: number;
  page: number;
  limit: number;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numberValue(...values: unknown[]): number | undefined {
  for (const value of values) {
    const number = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(number)) return number;
  }
  return undefined;
}

function stringValue(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
  }
  return "";
}

function booleanValue(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "active") return true;
    if (normalized === "false" || normalized === "0" || normalized === "inactive") return false;
  }
  return fallback;
}

function normalizeRepairRequest(payload: unknown, index: number): CustomerRepairRequest {
  const raw = isRecord(payload) ? payload : {};
  const id = stringValue(raw.id, raw.requestNumber, raw.request_number, `request-${index + 1}`);

  return {
    id,
    requestNumber: stringValue(raw.requestNumber, raw.request_number, id),
    type: stringValue(raw.type),
    customerId: stringValue(raw.customerId, raw.customer_id),
    priority: stringValue(raw.priority),
    faultDescription: stringValue(raw.faultDescription, raw.fault_description),
    notes: stringValue(raw.notes),
    scheduledDate: stringValue(raw.scheduledDate, raw.scheduled_date),
    isRepeated: booleanValue(raw.isRepeated ?? raw.is_repeated, false),
    isCompleted: booleanValue(raw.isCompleted ?? raw.is_completed, false),
    status: stringValue(raw.status),
    createdBy: stringValue(raw.createdBy, raw.created_by),
    createdAt: stringValue(raw.createdAt, raw.created_at),
  };
}

export function normalizeCustomer(payload: unknown, fallbackId?: string): Customer {
  if (!isRecord(payload)) {
    throw new ApiError("استجابة العميل غير مطابقة للنموذج المتوقع.");
  }

  const id = stringValue(payload.id, payload._id, payload.customerNumber, fallbackId);
  if (!id) throw new ApiError("لم يرسل الخادم معرّف العميل.");

  const requestsPayload =
    (Array.isArray(payload.requests) && payload.requests) ||
    (Array.isArray(payload.repairHistory) && payload.repairHistory) ||
    (Array.isArray(payload.orders) && payload.orders) ||
    [];

  return {
    id,
    customerNumber: stringValue(payload.customerNumber, payload.customer_number, id),
    name: stringValue(payload.name, payload.fullName, payload.full_name, "عميل بدون اسم"),
    firstPhone: stringValue(payload.firstPhone, payload.first_phone, payload.phone),
    secondPhone: stringValue(payload.secondPhone, payload.second_phone, payload.phone2),
    address: stringValue(payload.address),
    locationLink: stringValue(payload.locationLink, payload.location_link, payload.locationUrl),
    isActive: booleanValue(payload.isActive ?? payload.is_active, true),
    createdAt: stringValue(payload.createdAt, payload.created_at),
    updatedAt: stringValue(payload.updatedAt, payload.updated_at),
    requests: requestsPayload.map(normalizeRepairRequest),
  };
}

function dataFromResponse(payload: unknown): unknown {
  if (!isRecord(payload)) return payload;
  const data = payload.data;
  if (isRecord(data) && "customer" in data) return data.customer;
  if (data !== undefined && !Array.isArray(data)) return data;
  return payload.customer ?? payload;
}

export function normalizeCustomerResponse(payload: unknown): Customer {
  return normalizeCustomer(dataFromResponse(payload));
}

export function normalizeCustomerListResponse(
  payload: unknown,
  fallback: Pick<CustomerListQuery, "page" | "limit">,
): NormalizedCustomerList {
  const root = isRecord(payload) ? payload : {};
  const data = root.data;
  const dataRecord = isRecord(data) ? data : {};
  const rawItems =
    (Array.isArray(payload) && payload) ||
    (Array.isArray(data) && data) ||
    (Array.isArray(root.customers) && root.customers) ||
    (Array.isArray(root.items) && root.items) ||
    (Array.isArray(dataRecord.customers) && dataRecord.customers) ||
    (Array.isArray(dataRecord.items) && dataRecord.items);

  if (!rawItems) {
    throw new ApiError("استجابة قائمة العملاء غير مطابقة للنموذج المتوقع.");
  }

  const pagination =
    (isRecord(dataRecord.pagination) && dataRecord.pagination) ||
    (isRecord(dataRecord.meta) && dataRecord.meta) ||
    (isRecord(root.pagination) && root.pagination) ||
    (isRecord(root.meta) && root.meta) ||
    {};
  const items = rawItems.map((item, index) => normalizeCustomer(item, `customer-${index + 1}`));

  return {
    items,
    total:
      numberValue(
        pagination.total,
        pagination.totalCount,
        dataRecord.total,
        root.total,
      ) ?? items.length,
    page:
      numberValue(pagination.page, pagination.currentPage, dataRecord.page, root.page) ??
      fallback.page,
    limit:
      numberValue(
        pagination.limit,
        pagination.pageSize,
        dataRecord.limit,
        root.limit,
      ) ?? fallback.limit,
  };
}

export class CustomerRequestModel {
  private readonly input: CustomerInput | CustomerPatchInput;
  private readonly partial: boolean;

  constructor(input: CustomerInput | CustomerPatchInput, options?: { partial?: boolean }) {
    this.input = input;
    this.partial = options?.partial ?? false;
  }

  toJSON() {
    const parsed = this.partial
      ? CustomerPatchSchema.parse(this.input)
      : CustomerInputSchema.parse(this.input);
    const providedFields = new Set(
      this.partial ? Object.keys(this.input) : CUSTOMER_FIELDS,
    );
    const body: Partial<Record<(typeof CUSTOMER_FIELDS)[number], string>> = {};

    for (const field of CUSTOMER_FIELDS) {
      if (providedFields.has(field)) body[field] = parsed[field] ?? "";
    }

    return body;
  }
}

export function createCustomerUpdatePatch(
  input: CustomerInput,
  currentCustomer: Customer,
): CustomerPatchInput {
  const parsed = CustomerInputSchema.parse(input);
  const patch: CustomerPatchInput = {};

  if (parsed.name !== currentCustomer.name) patch.name = parsed.name;
  if (parsed.firstPhone !== currentCustomer.firstPhone) {
    patch.firstPhone = parsed.firstPhone;
  }
  if ((parsed.secondPhone ?? "") !== (currentCustomer.secondPhone ?? "")) {
    patch.secondPhone = parsed.secondPhone ?? "";
  }
  if ((parsed.address ?? "") !== (currentCustomer.address ?? "")) {
    patch.address = parsed.address ?? "";
  }
  if ((parsed.locationLink ?? "") !== (currentCustomer.locationLink ?? "")) {
    patch.locationLink = parsed.locationLink ?? "";
  }

  return patch;
}

export function hasCustomerPatch(input: CustomerPatchInput) {
  return Object.keys(input).length > 0;
}
