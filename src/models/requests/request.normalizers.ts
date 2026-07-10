import { ApiError } from "@/helpers/api.helper";
import { API_BASE_URL } from "@/config/api-endpoints";
import { localDateKey } from "@/lib/format/date";
import { normalizeInvoice } from "@/models/invoices/invoice.model";
import {
  RepairRequestInputSchema,
  type ParsedRepairRequestInput,
  type RepairRequestInput,
  type RepairRequestPatchInput,
  type RequestListQuery,
} from "@/models/requests/request.schemas";
import type {
  NormalizedRepairRequestList,
  RepairRequest,
  RepairRequestCustomer,
  RepairRequestDevice,
  RepairRequestRecord,
  RepairRequestStatusHistoryItem,
} from "@/models/requests/request.types";
import type {
  RepairRequestPriority,
  RepairRequestStatus,
  RepairRequestType,
} from "@/models/requests/request.constants";
import {
  RepairRequestPrioritySchema,
  RepairRequestStatusSchema,
  RepairRequestTypeSchema,
} from "@/models/requests/request.constants";

export * from "@/models/requests/request.constants";
export * from "@/models/requests/request.schemas";
export * from "@/models/requests/request.types";

type JsonRecord = Record<string, unknown>;

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

function booleanValue(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  return false;
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
  return localDateKey(value);
}

function dateTimeValue(...values: unknown[]): string {
  return stringValue(...values);
}

function mediaUrl(value?: string | null) {
  const path = String(value ?? "").trim();
  if (!path) return "";
  if (/^(?:https?:|data:|blob:)/i.test(path)) return path;
  return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
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
    value.email,
    firstLast,
    nestedName(value.user),
    nestedName(value.profile),
    nestedName(value.account),
    nestedName(value.employee),
    nestedName(value.admin),
    nestedName(value.manager),
  );
}

function nestedId(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (!isRecord(value)) return "";
  return stringValue(
    value.id,
    value._id,
    value.userId,
    value.user_id,
    value.userNumber,
    value.user_number,
    nestedId(value.user),
    nestedId(value.profile),
    nestedId(value.account),
  );
}

function isLikelyIdentifier(value: string): boolean {
  const trimmed = value.trim();
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      trimmed,
    ) || /^[0-9a-f]{24}$/i.test(trimmed)
  );
}

function displayNameValue(...values: unknown[]): string {
  for (const value of values) {
    const name = nestedName(value).trim();
    if (name && !isLikelyIdentifier(name)) return name;
  }
  return "";
}

function nestedObjectName(value: unknown): string {
  if (!isRecord(value)) return "";
  return nestedName(value);
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

function firstActiveRecord(...values: unknown[]): JsonRecord {
  for (const value of values) {
    if (isRecord(value)) return value;
    if (Array.isArray(value)) {
      const activeRecord = value.find(
        (item): item is JsonRecord =>
          isRecord(item) && (item.isActive === undefined || item.isActive === true),
      );
      if (activeRecord) return activeRecord;
      const record = value.find(isRecord);
      if (record) return record;
    }
  }

  return {};
}

function technicianAssignment(payload: JsonRecord) {
  return firstActiveRecord(
    payload.technicianAssignment,
    payload.technician_assignment,
    payload.latestTechnicianAssignment,
    payload.latest_technician_assignment,
    payload.latestAssignment,
    payload.latest_assignment,
    payload.assignment,
    payload.assignments,
    payload.technicianAssignments,
    payload.technician_assignments,
    payload.assignedTechnicians,
    payload.assigned_technicians,
    payload.technicians,
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
  const client = isRecord(rawRequest.client) ? rawRequest.client : {};
  const customerData = isRecord(rawRequest.customerData)
    ? rawRequest.customerData
    : isRecord(rawRequest.customer_data)
      ? rawRequest.customer_data
      : {};
  const id = stringValue(
    raw.id,
    raw._id,
    raw.customerId,
    raw.customer_id,
    customerData.id,
    customerData._id,
    client.id,
    client._id,
    rawRequest.customerId,
    rawRequest.customer_id,
  );

  return {
    id,
    name: stringValue(
      raw.name,
      raw.fullName,
      raw.full_name,
      raw.displayName,
      raw.display_name,
      customerData.name,
      customerData.fullName,
      customerData.full_name,
      client.name,
      client.fullName,
      client.full_name,
      rawRequest.customerName,
      rawRequest.client,
      rawRequest.clientName,
      rawRequest.client_name,
      rawRequest.name,
      "عميل غير محدد",
    ),
    firstPhone: stringValue(
      raw.firstPhone,
      raw.first_phone,
      raw.phone,
      raw.phoneNumber,
      raw.phone_number,
      raw.mobile,
      customerData.firstPhone,
      customerData.first_phone,
      customerData.phone,
      customerData.phoneNumber,
      customerData.phone_number,
      client.firstPhone,
      client.first_phone,
      client.phone,
      client.phoneNumber,
      client.phone_number,
      rawRequest.firstPhone,
      rawRequest.first_phone,
      rawRequest.phone,
      rawRequest.phoneNumber,
      rawRequest.phone_number,
      rawRequest.customerPhone,
      rawRequest.customer_phone,
      rawRequest.clientPhone,
      rawRequest.client_phone,
    ),
    secondPhone: stringValue(
      raw.secondPhone,
      raw.second_phone,
      raw.phone2,
      customerData.secondPhone,
      customerData.second_phone,
      customerData.phone2,
      client.secondPhone,
      client.second_phone,
      client.phone2,
      rawRequest.secondPhone,
      rawRequest.second_phone,
      rawRequest.customerSecondPhone,
      rawRequest.customer_second_phone,
      rawRequest.clientPhone2,
      rawRequest.client_phone_2,
      rawRequest.phone2,
    ),
    address: stringValue(
      raw.address,
      raw.fullAddress,
      raw.full_address,
      customerData.address,
      customerData.fullAddress,
      customerData.full_address,
      client.address,
      client.fullAddress,
      client.full_address,
      rawRequest.address,
      rawRequest.customerAddress,
      rawRequest.customer_address,
      rawRequest.clientAddress,
      rawRequest.client_address,
    ),
    locationLink: stringValue(
      raw.locationLink,
      raw.location_link,
      raw.locationUrl,
      raw.location_url,
      raw.mapUrl,
      raw.map_url,
      customerData.locationLink,
      customerData.location_link,
      customerData.locationUrl,
      customerData.location_url,
      client.locationLink,
      client.location_link,
      client.locationUrl,
      client.location_url,
      rawRequest.locationLink,
      rawRequest.location_link,
      rawRequest.locationUrl,
      rawRequest.location_url,
      rawRequest.mapUrl,
      rawRequest.map_url,
    ),
  };
}

function normalizeRequestDevice(payload: unknown, index: number): RepairRequestDevice {
  const raw = isRecord(payload) ? payload : {};

  return {
    deviceType: stringValue(raw.deviceType, raw.device_type, raw.type, raw.category, `جهاز ${index + 1}`),
    deviceName: stringValue(raw.deviceName, raw.device_name, raw.name, raw.title, raw.device, raw.description),
    brand: stringValue(raw.brand, raw.manufacturer, raw.make),
    model: stringValue(raw.model, raw.modelNumber, raw.model_number, raw.serialNumber, raw.serial_number),
  };
}

function normalizeRequestRecord(payload: unknown, index: number): RepairRequestRecord {
  if (typeof payload === "string") {
    return {
      id: `record-${index + 1}`,
      name: `تسجيل ${index + 1}`,
      url: mediaUrl(payload),
      createdAt: "",
    };
  }

  const raw = isRecord(payload) ? payload : {};
  const id = stringValue(raw.id, raw._id, `record-${index + 1}`);
  const file = firstRecord(raw.file, raw.audio, raw.voice, raw.recording, raw.media);
  const url = stringValue(
    raw.url,
    raw.path,
    raw.record,
    raw.src,
    raw.fileUrl,
    raw.file_url,
    raw.audioUrl,
    raw.audio_url,
    raw.voiceUrl,
    raw.voice_url,
    raw.recordingUrl,
    raw.recording_url,
    raw.recordUrl,
    raw.record_url,
    raw.mediaUrl,
    raw.media_url,
    raw.fullFilePath,
    raw.full_file_path,
    raw.filePath,
    raw.file_path,
    raw.audioPath,
    raw.audio_path,
    raw.voicePath,
    raw.voice_path,
    file.url,
    file.path,
    file.src,
  );
  const mimeType = stringValue(raw.mimeType, raw.mime_type, raw.contentType, raw.content_type, file.mimeType);
  const durationValue = Number(
    raw.duration ?? raw.durationSeconds ?? raw.duration_seconds ?? file.duration,
  );

  return {
    id,
    name: stringValue(raw.name, raw.fileName, raw.file_name, file.name, `تسجيل ${index + 1}`),
    url: mediaUrl(url),
    createdAt: dateTimeValue(raw.createdAt, raw.created_at, raw.date, raw.uploadedAt, raw.uploaded_at),
    mimeType: mimeType || undefined,
    duration: Number.isFinite(durationValue) && durationValue > 0 ? durationValue : undefined,
  };
}

function normalizeRequestInvoices(
  payload: JsonRecord,
  requestId: string,
  requestNumber: string,
) {
  const rawInvoices =
    (Array.isArray(payload.invoices) && payload.invoices) ||
    (Array.isArray(payload.requestInvoices) && payload.requestInvoices) ||
    (Array.isArray(payload.request_invoices) && payload.request_invoices) ||
    (isRecord(payload.invoice) ? [payload.invoice] : []);

  return rawInvoices.flatMap((rawInvoice) => {
    try {
      const invoice = normalizeInvoice(rawInvoice);
      return [
        {
          ...invoice,
          orderId: invoice.orderId || requestId,
          requestNumber: invoice.requestNumber || requestNumber,
        },
      ];
    } catch {
      return [];
    }
  });
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
    (Array.isArray(payload.request_devices) && payload.request_devices) ||
    (Array.isArray(payload.appliances) && payload.appliances) ||
    (Array.isArray(payload.equipment) && payload.equipment) ||
    (Array.isArray(payload.items) && payload.items) ||
    [];
  const devices = rawDevices.length
    ? rawDevices.map(normalizeRequestDevice)
    : [
        normalizeRequestDevice(
          {
            deviceType: payload.deviceType ?? payload.device_type ?? payload.device,
            deviceName: payload.deviceName ?? payload.device_name ?? payload.deviceNameArabic ?? payload.device_name_arabic ?? payload.device,
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
  const rawStatusHistory =
    (Array.isArray(payload.statusHistory) && payload.statusHistory) ||
    (Array.isArray(payload.status_history) && payload.status_history) ||
    (Array.isArray(payload.history) && payload.history) ||
    [];
  const assignment = technicianAssignment(payload);
  const assignmentTechnician = firstRecord(assignment.technician, assignment.user);

  const requestNumber = stringValue(payload.requestNumber, payload.request_number, id);
  const invoices = normalizeRequestInvoices(payload, id, requestNumber);

  return {
    id,
    requestNumber,
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
      payload.assignedToId,
      payload.assigned_to_id,
      payload.responsibleTechnicianId,
      payload.responsible_technician_id,
      assignment.technicianId,
      assignment.technician_id,
      assignmentTechnician.id,
      assignmentTechnician._id,
      assignmentTechnician.userNumber,
      assignmentTechnician.user_number,
      isRecord(payload.technician) ? payload.technician.id : undefined,
      // New backend shape: technicians: [{ id, fullName, assignedAt }] — the
      // record itself is the technician, so its id is the technician id.
      Array.isArray(payload.technicians) ? assignment.id : undefined,
    ),
    technicianName: stringValue(
      payload.technicianName,
      payload.technician_name,
      payload.technicianFullName,
      payload.technician_full_name,
      nestedObjectName(payload.technician),
      nestedObjectName(payload.technicianUser),
      nestedObjectName(payload.technician_user),
      nestedObjectName(payload.currentTechnician),
      nestedObjectName(payload.current_technician),
      nestedObjectName(payload.assignedTechnician),
      nestedObjectName(payload.assigned_technician),
      nestedObjectName(payload.assignedTo),
      nestedObjectName(payload.assigned_to),
      nestedObjectName(payload.responsibleTechnician),
      nestedObjectName(payload.responsible_technician),
      nestedObjectName(payload.user),
      nestedObjectName(assignmentTechnician),
      nestedObjectName(assignment),
    ),
    createdAt: dateTimeValue(payload.createdAt, payload.created_at),
    updatedAt: dateTimeValue(
      payload.updatedAt,
      payload.updated_at,
      payload.modifiedAt,
      payload.modified_at,
      payload.changedAt,
      payload.changed_at,
      payload.lastUpdatedAt,
      payload.last_updated_at,
      payload.createdAt,
      payload.created_at,
    ),
    records: rawRecords.map(normalizeRequestRecord),
    invoices,
    statusHistory: rawStatusHistory.map(normalizeStatusHistoryItem),
    hasInvoice: booleanValue(payload.hasInvoice ?? payload.has_invoice) || invoices.length > 0,
  };
}

function dataFromResponse(payload: unknown): unknown {
  if (!isRecord(payload)) return payload;
  const data = payload.data;
  if (isRecord(data) && "request" in data) {
    return isRecord(data.request)
      ? {
          ...data.request,
          invoices: data.request.invoices ?? data.invoices,
          invoice: data.request.invoice ?? data.invoice,
        }
      : data.request;
  }
  if (isRecord(data) && "repairRequest" in data) {
    return isRecord(data.repairRequest)
      ? {
          ...data.repairRequest,
          invoices: data.repairRequest.invoices ?? data.invoices,
          invoice: data.repairRequest.invoice ?? data.invoice,
        }
      : data.repairRequest;
  }
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
    status: normalizeRequestStatus(raw.status ?? raw.toStatus ?? raw.to_status ?? raw.newStatus ?? raw.new_status),
    note: stringValue(raw.note, raw.notes, raw.message, raw.description, raw.reason),
    owner: stringValue(
      displayNameValue(
        raw.owner,
        raw.user,
        raw.changer,
        raw.creator,
        raw.createdBy,
        raw.created_by,
        raw.createdByUser,
        raw.created_by_user,
        raw.changedBy,
        raw.changed_by,
        raw.changedByUser,
        raw.changed_by_user,
        raw.updatedBy,
        raw.updated_by,
        raw.updatedByUser,
        raw.updated_by_user,
        raw.modifiedBy,
        raw.modified_by,
        raw.performedBy,
        raw.performed_by,
        raw.statusChangedBy,
        raw.status_changed_by,
        raw.actor,
        raw.admin,
        raw.manager,
        raw.employee,
        raw.responsible,
        raw.responsibleUser,
        raw.responsible_user,
      ),
      stringValue(raw.ownerName, raw.owner_name),
      stringValue(raw.userName, raw.user_name),
      stringValue(raw.changerName, raw.changer_name),
      stringValue(raw.creatorName, raw.creator_name),
      stringValue(raw.createdByName, raw.created_by_name),
      stringValue(raw.changedByName, raw.changed_by_name),
      stringValue(raw.updatedByName, raw.updated_by_name),
      stringValue(raw.performedByName, raw.performed_by_name),
      stringValue(raw.statusChangedByName, raw.status_changed_by_name),
      "غير محدد",
    ),
    ownerId: stringValue(
      raw.ownerId,
      raw.owner_id,
      raw.userId,
      raw.user_id,
      raw.creatorId,
      raw.creator_id,
      raw.createdById,
      raw.created_by_id,
      raw.changedById,
      raw.changed_by_id,
      raw.updatedById,
      raw.updated_by_id,
      raw.modifiedById,
      raw.modified_by_id,
      raw.performedById,
      raw.performed_by_id,
      raw.statusChangedById,
      raw.status_changed_by_id,
      raw.actorId,
      raw.actor_id,
      raw.adminId,
      raw.admin_id,
      raw.managerId,
      raw.manager_id,
      raw.employeeId,
      raw.employee_id,
      raw.responsibleId,
      raw.responsible_id,
      nestedId(raw.owner),
      nestedId(raw.user),
      nestedId(raw.changer),
      nestedId(raw.creator),
      nestedId(raw.createdBy),
      nestedId(raw.created_by),
      nestedId(raw.createdByUser),
      nestedId(raw.created_by_user),
      nestedId(raw.changedBy),
      nestedId(raw.changed_by),
      nestedId(raw.changedByUser),
      nestedId(raw.changed_by_user),
      nestedId(raw.updatedBy),
      nestedId(raw.updated_by),
      nestedId(raw.updatedByUser),
      nestedId(raw.updated_by_user),
      nestedId(raw.performedBy),
      nestedId(raw.performed_by),
      nestedId(raw.statusChangedBy),
      nestedId(raw.status_changed_by),
      nestedId(raw.actor),
      nestedId(raw.responsible),
      nestedId(raw.responsibleUser),
      nestedId(raw.responsible_user),
    ),
    date: dateTimeValue(
      raw.date,
      raw.changedAt,
      raw.changed_at,
      raw.timestamp,
      raw.performedAt,
      raw.performed_at,
      raw.modifiedAt,
      raw.modified_at,
      raw.createdAt,
      raw.created_at,
      raw.updatedAt,
      raw.updated_at,
      raw.assignedAt,
      raw.assigned_at,
    ),
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
    normalizeOptionalText(parsed.technicianId) !== normalizeOptionalText(current.technicianId)
  ) {
    // Includes clearing the technician ("بدون تحديد"), so the change is detected
    // and the save is not blocked as "no changes".
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
