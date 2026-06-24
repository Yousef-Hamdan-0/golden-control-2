import { z } from "zod";
import { ApiError } from "@/helpers/api.helper";

type JsonRecord = Record<string, unknown>;

export const REPAIR_REQUEST_STATUSES = [
  "new",
  "accepted",
  "ontheway",
  "arrived",
  "underrepair",
  "completed",
  "incompleted",
  "pulltocenter",
  "postponed",
  "cancelled",
  "notanswer",
  "notrepairable",
  "repeated",
] as const;

export const REPAIR_REQUEST_PRIORITIES = [
  "low",
  "medium",
  "high",
  "emergency",
] as const;

export const REPAIR_REQUEST_TYPES = ["internal", "external"] as const;

export type RepairRequestStatus = (typeof REPAIR_REQUEST_STATUSES)[number];
export type RepairRequestPriority = (typeof REPAIR_REQUEST_PRIORITIES)[number];
export type RepairRequestType = (typeof REPAIR_REQUEST_TYPES)[number];

export const RepairRequestStatusSchema = z.enum(REPAIR_REQUEST_STATUSES);
export const RepairRequestPrioritySchema = z.enum(REPAIR_REQUEST_PRIORITIES);
export const RepairRequestTypeSchema = z.enum(REPAIR_REQUEST_TYPES);

export const REQUEST_STATUS_LABELS: Record<RepairRequestStatus, string> = {
  new: "جديد",
  accepted: "مقبول",
  ontheway: "في الطريق",
  arrived: "تم الوصول",
  underrepair: "قيد الإصلاح",
  completed: "مكتمل",
  incompleted: "غير مكتمل",
  pulltocenter: "مسحوب للمركز",
  postponed: "مؤجل",
  cancelled: "ملغي",
  notanswer: "لا يجيب",
  notrepairable: "غير قابل للإصلاح",
  repeated: "مكرر",
};

export const REQUEST_STATUS_TONE: Record<
  RepairRequestStatus,
  "neutral" | "success" | "danger" | "gold" | "info"
> = {
  new: "gold",
  accepted: "info",
  ontheway: "info",
  arrived: "info",
  underrepair: "gold",
  completed: "success",
  incompleted: "danger",
  pulltocenter: "info",
  postponed: "neutral",
  cancelled: "danger",
  notanswer: "danger",
  notrepairable: "danger",
  repeated: "gold",
};

export const REQUEST_PRIORITY_LABELS: Record<RepairRequestPriority, string> = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "عالية",
  emergency: "طارئة",
};

export const REQUEST_TYPE_LABELS: Record<RepairRequestType, string> = {
  internal: "داخلي",
  external: "خارجي",
};

export const REQUEST_STATUS_OPTIONS = REPAIR_REQUEST_STATUSES.map((value) => ({
  value,
  label: REQUEST_STATUS_LABELS[value],
}));

export const REQUEST_PRIORITY_OPTIONS = REPAIR_REQUEST_PRIORITIES.map((value) => ({
  value,
  label: REQUEST_PRIORITY_LABELS[value],
}));

export const REQUEST_TYPE_OPTIONS = REPAIR_REQUEST_TYPES.map((value) => ({
  value,
  label: REQUEST_TYPE_LABELS[value],
}));

export interface RepairRequestCustomer {
  id: string;
  name: string;
  firstPhone: string;
  secondPhone: string;
  address: string;
  locationLink: string;
}

export interface RepairRequestDevice {
  deviceType: string;
  deviceName: string;
  brand: string;
  model: string;
}

export interface RepairRequestRecord {
  id: string;
  name: string;
  url: string;
  createdAt: string;
}

export interface RepairRequestStatusHistoryItem {
  id: string;
  status: RepairRequestStatus;
  note: string;
  owner: string;
  date: string;
}

export interface RepairRequest {
  id: string;
  requestNumber: string;
  customer: RepairRequestCustomer;
  type: RepairRequestType;
  priority: RepairRequestPriority;
  status: RepairRequestStatus;
  faultDescription: string;
  notes: string;
  scheduledDate: string;
  devices: RepairRequestDevice[];
  technicianId: string;
  technicianName: string;
  createdAt: string;
  updatedAt: string;
  records: RepairRequestRecord[];
}

export const RequestListQuerySchema = z.object({
  status: z.union([RepairRequestStatusSchema, z.literal("all")]),
  priority: z.union([RepairRequestPrioritySchema, z.literal("all")]),
  type: z.union([RepairRequestTypeSchema, z.literal("all")]),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  page: z.coerce.number().int().positive(),
  limit: z.coerce.number().int().positive().max(1000),
  search: z.string().trim().optional(),
});

export type RequestListQuery = z.infer<typeof RequestListQuerySchema>;

const OptionalDateSchema = z
  .string()
  .trim()
  .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: "صيغة التاريخ يجب أن تكون YYYY-MM-DD.",
  });

export const RequestCustomerInputSchema = z.object({
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
  address: z
    .string()
    .trim()
    .min(1, "عنوان العميل مطلوب.")
    .max(255, "عنوان العميل يجب ألا يتجاوز 255 حرفاً."),
  locationLink: z
    .string()
    .trim()
    .max(500, "رابط موقع العميل يجب ألا يتجاوز 500 حرف.")
    .optional()
    .default(""),
});

export const RequestDeviceInputSchema = z.object({
  deviceType: z
    .string()
    .trim()
    .min(1, "نوع الجهاز مطلوب.")
    .max(100, "نوع الجهاز يجب ألا يتجاوز 100 حرف."),
  deviceName: z
    .string()
    .trim()
    .min(1, "اسم الجهاز مطلوب.")
    .max(255, "اسم الجهاز يجب ألا يتجاوز 255 حرفاً."),
  brand: z
    .string()
    .trim()
    .max(100, "العلامة التجارية يجب ألا تتجاوز 100 حرف.")
    .optional()
    .default(""),
  model: z
    .string()
    .trim()
    .max(100, "رقم الموديل يجب ألا يتجاوز 100 حرف.")
    .optional()
    .default(""),
});

export const RepairRequestInputSchema = z.object({
  customer: RequestCustomerInputSchema,
  type: RepairRequestTypeSchema,
  priority: RepairRequestPrioritySchema,
  faultDescription: z
    .string()
    .trim()
    .min(1, "وصف العطل مطلوب.")
    .max(2000, "وصف العطل يجب ألا يتجاوز 2000 حرف."),
  notes: z
    .string()
    .trim()
    .max(2000, "الملاحظات يجب ألا تتجاوز 2000 حرف.")
    .optional()
    .default(""),
  scheduledDate: OptionalDateSchema.optional().default(""),
  devices: z.array(RequestDeviceInputSchema).min(1, "أضف جهازاً واحداً على الأقل."),
  technicianId: z.string().trim().optional().default(""),
  status: RepairRequestStatusSchema.optional(),
});

export type RepairRequestInput = z.input<typeof RepairRequestInputSchema>;
export type ParsedRepairRequestInput = z.infer<typeof RepairRequestInputSchema>;
export type RepairRequestPatchInput = Partial<
  Omit<ParsedRepairRequestInput, "customer" | "devices">
> & {
  customer?: Partial<ParsedRepairRequestInput["customer"]>;
  devices?: ParsedRepairRequestInput["devices"];
};

export const RequestRecordsInputSchema = z.object({
  requestNumber: z.string().trim().min(1, "رقم الطلب مطلوب."),
  records: z
    .array(z.string().trim().min(1, "التسجيل الصوتي مطلوب."))
    .min(1, "أضف تسجيلاً واحداً على الأقل."),
});

export type RequestRecordsInput = z.infer<typeof RequestRecordsInputSchema>;

export interface NormalizedRepairRequestList {
  items: RepairRequest[];
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

function dateValue(...values: unknown[]): string {
  const value = stringValue(...values);
  return value.length > 10 ? value.slice(0, 10) : value;
}

function nestedName(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (!isRecord(value)) return "";
  return stringValue(value.fullName, value.name, value.username, value.email);
}

function nestedObjectName(value: unknown): string {
  if (!isRecord(value)) return "";
  return stringValue(value.fullName, value.name, value.username, value.email);
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

function technicianAssignment(payload: JsonRecord) {
  return firstRecord(
    payload.technicianAssignment,
    payload.technician_assignment,
    payload.latestTechnicianAssignment,
    payload.latest_technician_assignment,
    payload.assignments,
    payload.technicianAssignments,
    payload.technician_assignments,
    payload.assignedTechnicians,
    payload.assigned_technicians,
  );
}

const STATUS_ALIASES: Record<string, RepairRequestStatus> = {
  "on-the-way": "ontheway",
  on_the_way: "ontheway",
  "on the way": "ontheway",
  under_repair: "underrepair",
  "under-repair": "underrepair",
  "pull-to-center": "pulltocenter",
  pull_to_center: "pulltocenter",
  "not-answer": "notanswer",
  not_answer: "notanswer",
  "not-repairable": "notrepairable",
  not_repairable: "notrepairable",
  canceled: "cancelled",
};

export function normalizeRequestStatus(value: unknown): RepairRequestStatus {
  const normalized = stringValue(value).trim().toLowerCase();
  const status = STATUS_ALIASES[normalized] ?? normalized;
  const parsed = RepairRequestStatusSchema.safeParse(status);
  return parsed.success ? parsed.data : "new";
}

export function normalizeRequestType(value: unknown): RepairRequestType {
  const parsed = RepairRequestTypeSchema.safeParse(stringValue(value).trim().toLowerCase());
  return parsed.success ? parsed.data : "external";
}

export function normalizeRequestPriority(value: unknown): RepairRequestPriority {
  const parsed = RepairRequestPrioritySchema.safeParse(
    stringValue(value).trim().toLowerCase(),
  );
  return parsed.success ? parsed.data : "medium";
}

function normalizeRequestCustomer(payload: unknown, rawRequest: JsonRecord): RepairRequestCustomer {
  const raw = isRecord(payload) ? payload : {};
  const id = stringValue(raw.id, raw._id, raw.customerId, raw.customer_id, rawRequest.customerId);

  return {
    id,
    name: stringValue(
      raw.name,
      raw.fullName,
      raw.full_name,
      rawRequest.customerName,
      rawRequest.client,
      "عميل غير محدد",
    ),
    firstPhone: stringValue(
      raw.firstPhone,
      raw.first_phone,
      raw.phone,
      rawRequest.firstPhone,
      rawRequest.first_phone,
      rawRequest.phone,
      rawRequest.customerPhone,
    ),
    secondPhone: stringValue(
      raw.secondPhone,
      raw.second_phone,
      raw.phone2,
      rawRequest.secondPhone,
      rawRequest.second_phone,
      rawRequest.phone2,
    ),
    address: stringValue(raw.address, rawRequest.address),
    locationLink: stringValue(
      raw.locationLink,
      raw.location_link,
      raw.locationUrl,
      raw.location_url,
      rawRequest.locationLink,
      rawRequest.location_link,
      rawRequest.locationUrl,
    ),
  };
}

function normalizeRequestDevice(payload: unknown, index: number): RepairRequestDevice {
  const raw = isRecord(payload) ? payload : {};

  return {
    deviceType: stringValue(raw.deviceType, raw.device_type, raw.type, `جهاز ${index + 1}`),
    deviceName: stringValue(raw.deviceName, raw.device_name, raw.name, raw.title),
    brand: stringValue(raw.brand, raw.manufacturer),
    model: stringValue(raw.model, raw.modelNumber, raw.model_number),
  };
}

function normalizeRequestRecord(payload: unknown, index: number): RepairRequestRecord {
  if (typeof payload === "string") {
    return {
      id: `record-${index + 1}`,
      name: `تسجيل ${index + 1}`,
      url: payload,
      createdAt: "",
    };
  }

  const raw = isRecord(payload) ? payload : {};
  const id = stringValue(raw.id, raw._id, `record-${index + 1}`);

  return {
    id,
    name: stringValue(raw.name, raw.fileName, raw.file_name, `تسجيل ${index + 1}`),
    url: stringValue(raw.url, raw.path, raw.record, raw.src),
    createdAt: dateValue(raw.createdAt, raw.created_at, raw.date),
  };
}

export function normalizeRepairRequest(payload: unknown, fallbackId?: string): RepairRequest {
  if (!isRecord(payload)) {
    throw new ApiError("استجابة الطلب غير مطابقة للنموذج المتوقع.");
  }

  const id = stringValue(payload.id, payload._id, payload.requestId, payload.requestNumber, fallbackId);
  if (!id) throw new ApiError("لم يرسل الخادم معرّف الطلب.");

  const rawDevices =
    (Array.isArray(payload.devices) && payload.devices) ||
    (Array.isArray(payload.requestDevices) && payload.requestDevices) ||
    (Array.isArray(payload.items) && payload.items) ||
    [];
  const devices = rawDevices.length
    ? rawDevices.map(normalizeRequestDevice)
    : [
        normalizeRequestDevice(
          {
            deviceType: payload.deviceType ?? payload.device_type ?? payload.device,
            deviceName: payload.deviceName ?? payload.device_name ?? payload.device,
            brand: payload.brand,
            model: payload.model,
          },
          0,
        ),
      ].filter((device) => device.deviceName || device.deviceType);
  const rawRecords =
    (Array.isArray(payload.records) && payload.records) ||
    (Array.isArray(payload.audioRecords) && payload.audioRecords) ||
    (Array.isArray(payload.voiceRecords) && payload.voiceRecords) ||
    [];
  const assignment = technicianAssignment(payload);
  const assignmentTechnician = firstRecord(assignment.technician, assignment.user);

  return {
    id,
    requestNumber: stringValue(payload.requestNumber, payload.request_number, id),
    customer: normalizeRequestCustomer(payload.customer, payload),
    type: normalizeRequestType(payload.type),
    priority: normalizeRequestPriority(payload.priority),
    status: normalizeRequestStatus(payload.status),
    faultDescription: stringValue(
      payload.faultDescription,
      payload.fault_description,
      payload.description,
    ),
    notes: stringValue(payload.notes),
    scheduledDate: dateValue(payload.scheduledDate, payload.scheduled_date, payload.visitDate),
    devices,
    technicianId: stringValue(
      payload.technicianId,
      payload.technician_id,
      assignment.technicianId,
      assignment.technician_id,
      assignmentTechnician.id,
      assignmentTechnician._id,
      assignmentTechnician.userNumber,
      assignmentTechnician.user_number,
      isRecord(payload.technician) ? payload.technician.id : undefined,
    ),
    technicianName: stringValue(
      payload.technicianName,
      payload.technician_name,
      nestedObjectName(payload.technician),
      nestedObjectName(payload.assignedTechnician),
      nestedObjectName(assignmentTechnician),
      nestedObjectName(assignment),
    ),
    createdAt: dateValue(payload.createdAt, payload.created_at),
    updatedAt: dateValue(payload.updatedAt, payload.updated_at),
    records: rawRecords.map(normalizeRequestRecord),
  };
}

function dataFromResponse(payload: unknown): unknown {
  if (!isRecord(payload)) return payload;
  const data = payload.data;
  if (isRecord(data) && "request" in data) return data.request;
  if (isRecord(data) && "repairRequest" in data) return data.repairRequest;
  if (data !== undefined && !Array.isArray(data)) return data;
  return payload.request ?? payload.repairRequest ?? payload;
}

export function normalizeRepairRequestResponse(payload: unknown): RepairRequest {
  return normalizeRepairRequest(dataFromResponse(payload));
}

export function maybeNormalizeRepairRequestResponse(payload: unknown): RepairRequest | null {
  try {
    return normalizeRepairRequestResponse(payload);
  } catch {
    return null;
  }
}

export function normalizeRepairRequestListResponse(
  payload: unknown,
  fallback: Pick<RequestListQuery, "page" | "limit">,
): NormalizedRepairRequestList {
  const root = isRecord(payload) ? payload : {};
  const data = root.data;
  const dataRecord = isRecord(data) ? data : {};
  const rawItems =
    (Array.isArray(payload) && payload) ||
    (Array.isArray(data) && data) ||
    (Array.isArray(root.requests) && root.requests) ||
    (Array.isArray(root.repairRequests) && root.repairRequests) ||
    (Array.isArray(root.items) && root.items) ||
    (Array.isArray(dataRecord.requests) && dataRecord.requests) ||
    (Array.isArray(dataRecord.repairRequests) && dataRecord.repairRequests) ||
    (Array.isArray(dataRecord.items) && dataRecord.items) ||
    (Array.isArray(dataRecord.data) && dataRecord.data);

  if (!rawItems) {
    throw new ApiError("استجابة قائمة الطلبات غير مطابقة للنموذج المتوقع.");
  }

  const pagination =
    (isRecord(dataRecord.pagination) && dataRecord.pagination) ||
    (isRecord(dataRecord.meta) && dataRecord.meta) ||
    (isRecord(root.pagination) && root.pagination) ||
    (isRecord(root.meta) && root.meta) ||
    {};
  const items = rawItems.map((item, index) =>
    normalizeRepairRequest(item, `request-${index + 1}`),
  );

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

function normalizeStatusHistoryItem(
  payload: unknown,
  index: number,
): RepairRequestStatusHistoryItem {
  const raw = isRecord(payload) ? payload : {};

  return {
    id: stringValue(raw.id, raw._id, `history-${index + 1}`),
    status: normalizeRequestStatus(raw.status),
    note: stringValue(raw.note, raw.notes, raw.message, raw.description),
    owner: stringValue(raw.owner, raw.createdBy, raw.created_by, nestedName(raw.user)),
    date: dateValue(raw.date, raw.createdAt, raw.created_at, raw.updatedAt, raw.updated_at),
  };
}

export function normalizeStatusHistoryResponse(
  payload: unknown,
): RepairRequestStatusHistoryItem[] {
  const root = isRecord(payload) ? payload : {};
  const data = root.data;
  const dataRecord = isRecord(data) ? data : {};
  const rawItems =
    (Array.isArray(payload) && payload) ||
    (Array.isArray(data) && data) ||
    (Array.isArray(root.statusHistory) && root.statusHistory) ||
    (Array.isArray(root.history) && root.history) ||
    (Array.isArray(root.items) && root.items) ||
    (Array.isArray(dataRecord.statusHistory) && dataRecord.statusHistory) ||
    (Array.isArray(dataRecord.history) && dataRecord.history) ||
    (Array.isArray(dataRecord.items) && dataRecord.items);

  if (!rawItems) {
    throw new ApiError("استجابة سجل الحالة غير مطابقة للنموذج المتوقع.");
  }

  return rawItems.map(normalizeStatusHistoryItem);
}

export class RepairRequestPayloadModel {
  private readonly input: RepairRequestInput;
  private readonly includeStatus: boolean;

  constructor(input: RepairRequestInput, options?: { includeStatus?: boolean }) {
    this.input = input;
    this.includeStatus = options?.includeStatus ?? false;
  }

  toJSON() {
    const parsed = RepairRequestInputSchema.parse(this.input);
    const customer: Record<string, string> = {
      name: parsed.customer.name,
      firstPhone: parsed.customer.firstPhone,
      address: parsed.customer.address,
    };
    if (parsed.customer.secondPhone) {
      customer.secondPhone = parsed.customer.secondPhone;
    }
    if (parsed.customer.locationLink) {
      customer.locationLink = parsed.customer.locationLink;
    }

    const body: Record<string, unknown> = {
      customer,
      type: parsed.type,
      priority: parsed.priority,
      faultDescription: parsed.faultDescription,
      notes: parsed.notes ?? "",
      devices: parsed.devices.map((device) => ({
        deviceType: device.deviceType,
        deviceName: device.deviceName,
        brand: device.brand ?? "",
        model: device.model ?? "",
      })),
    };

    if (parsed.scheduledDate) body.scheduledDate = parsed.scheduledDate;
    if (parsed.technicianId) body.technicianId = parsed.technicianId;
    if (this.includeStatus && parsed.status) body.status = parsed.status;

    return body;
  }
}

function normalizeOptionalText(value: string | undefined) {
  return value?.trim() ?? "";
}

function devicesEqual(
  firstDevices: ParsedRepairRequestInput["devices"],
  secondDevices: ParsedRepairRequestInput["devices"],
) {
  if (firstDevices.length !== secondDevices.length) return false;

  return firstDevices.every((device, index) => {
    const other = secondDevices[index];
    return (
      device.deviceType === other.deviceType &&
      device.deviceName === other.deviceName &&
      normalizeOptionalText(device.brand) === normalizeOptionalText(other.brand) &&
      normalizeOptionalText(device.model) === normalizeOptionalText(other.model)
    );
  });
}

export function createRepairRequestUpdatePatch(
  input: RepairRequestInput,
  currentRequest: RepairRequest,
): RepairRequestPatchInput {
  const parsed = RepairRequestInputSchema.parse(input);
  const current = RepairRequestInputSchema.parse(requestToInput(currentRequest));
  const patch: RepairRequestPatchInput = {};
  const customerPatch: RepairRequestPatchInput["customer"] = {};

  if (parsed.customer.name !== current.customer.name) {
    customerPatch.name = parsed.customer.name;
  }
  if (parsed.customer.firstPhone !== current.customer.firstPhone) {
    customerPatch.firstPhone = parsed.customer.firstPhone;
  }
  if (
    normalizeOptionalText(parsed.customer.secondPhone) &&
    normalizeOptionalText(parsed.customer.secondPhone) !== normalizeOptionalText(current.customer.secondPhone)
  ) {
    customerPatch.secondPhone = normalizeOptionalText(parsed.customer.secondPhone);
  }
  if (parsed.customer.address !== current.customer.address) {
    customerPatch.address = parsed.customer.address;
  }
  if (
    normalizeOptionalText(parsed.customer.locationLink) &&
    normalizeOptionalText(parsed.customer.locationLink) !== normalizeOptionalText(current.customer.locationLink)
  ) {
    customerPatch.locationLink = normalizeOptionalText(parsed.customer.locationLink);
  }
  if (Object.keys(customerPatch).length > 0) patch.customer = customerPatch;

  if (parsed.type !== current.type) patch.type = parsed.type;
  if (parsed.priority !== current.priority) patch.priority = parsed.priority;
  if (parsed.faultDescription !== current.faultDescription) {
    patch.faultDescription = parsed.faultDescription;
  }
  if (normalizeOptionalText(parsed.notes) !== normalizeOptionalText(current.notes)) {
    patch.notes = normalizeOptionalText(parsed.notes);
  }
  if (
    normalizeOptionalText(parsed.scheduledDate) &&
    normalizeOptionalText(parsed.scheduledDate) !== normalizeOptionalText(current.scheduledDate)
  ) {
    patch.scheduledDate = normalizeOptionalText(parsed.scheduledDate);
  }
  if (!devicesEqual(parsed.devices, current.devices)) {
    patch.devices = parsed.devices;
  }
  if (
    normalizeOptionalText(parsed.technicianId) &&
    normalizeOptionalText(parsed.technicianId) !== normalizeOptionalText(current.technicianId)
  ) {
    patch.technicianId = normalizeOptionalText(parsed.technicianId);
  }
  if (parsed.status && parsed.status !== current.status) {
    patch.status = parsed.status;
  }

  return patch;
}

export function hasRepairRequestPatch(input: RepairRequestPatchInput) {
  return Object.keys(input).length > 0;
}

export function requestToInput(request: RepairRequest): RepairRequestInput {
  return {
    customer: {
      name: request.customer.name,
      firstPhone: request.customer.firstPhone,
      secondPhone: request.customer.secondPhone,
      address: request.customer.address,
      locationLink: request.customer.locationLink,
    },
    type: request.type,
    priority: request.priority,
    faultDescription: request.faultDescription,
    notes: request.notes,
    scheduledDate: request.scheduledDate,
    devices: request.devices.length
      ? request.devices.map((device) => ({ ...device }))
      : [{ deviceType: "", deviceName: "", brand: "", model: "" }],
    technicianId: request.technicianId,
    status: request.status,
  };
}
