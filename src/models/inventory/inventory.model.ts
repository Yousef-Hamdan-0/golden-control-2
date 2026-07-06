import { z } from "zod";
import { ApiError } from "@/helpers/api.helper";

type JsonRecord = Record<string, unknown>;

export type InventoryMovementType = "supply" | "withdraw" | "adjustment";

export interface InventoryDailyLog {
  id: string;
  technicianId: string;
  technicianName: string;
  technicianPhone: string;
  toolsGiven: string;
  notes: string;
  createdAt: string;
  usedParts: InventoryDailyUsedPart[];
}

export interface InventoryDailyUsedPart {
  id: string;
  name: string;
  quantity: number;
}

export interface InventoryPart {
  id: string;
  sparePartNumber: string;
  name: string;
  sku: string;
  shelfLocation: string;
  quantity: number;
  costSyp: number;
  costUsd: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovementLog {
  id: string;
  movementNumber: string;
  partId: string;
  partNumber: string;
  partName: string;
  movementType: InventoryMovementType;
  quantity: number;
  owner: string;
  reference: string;
  createdAt: string;
}

export interface InventoryListResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const InventoryDailyCreateSchema = z.object({
  technicianId: z.string().trim().min(1, "اختيار الفني مطلوب"),
  toolsGiven: z.string().trim().min(3, "قائمة الأدوات مطلوبة"),
  notes: z.string().trim().optional().default(""),
});

export type InventoryDailyCreateInput = z.input<typeof InventoryDailyCreateSchema>;

export const InventoryPartInputSchema = z.object({
  name: z.string().trim().min(1, "اسم القطعة مطلوب"),
  sku: z.string().trim().optional().default(""),
  shelfLocation: z.string().trim().optional().default(""),
  costSyp: z.coerce.number().nonnegative("قيمة القطعة بالليرة غير صالحة").default(0),
  costUsd: z.coerce.number().nonnegative("قيمة القطعة بالدولار غير صالحة").default(0),
});

export type InventoryPartInput = z.input<typeof InventoryPartInputSchema>;

export const InventoryMovementInputSchema = z.object({
  partId: z.string().trim().min(1, "اختيار القطعة مطلوب"),
  movementType: z.enum(["supply", "withdraw", "adjustment"]),
  quantity: z.coerce.number().int("الكمية يجب أن تكون رقماً صحيحاً"),
  reference: z.string().trim().optional().default(""),
});

export type InventoryMovementInput = z.input<typeof InventoryMovementInputSchema>;

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

function booleanValue(value: unknown, fallback = true) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return fallback;
}

function dateValue(...values: unknown[]) {
  return stringValue(...values);
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

function nestedName(value: unknown) {
  if (!isRecord(value)) return "";
  return stringValue(value.fullName, value.full_name, value.name, value.title);
}

function isLikelyPrivateIdentifier(value: string) {
  const trimmed = value.trim();
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      trimmed,
    ) || /^[0-9a-f]{24}$/i.test(trimmed)
  );
}

function publicCodeValue(...values: unknown[]) {
  for (const value of values) {
    const code = stringValue(value).trim();
    if (code && !isLikelyPrivateIdentifier(code)) return code;
  }

  return "";
}

function normalizeUsedPart(payload: unknown, index: number): InventoryDailyUsedPart {
  const raw = isRecord(payload) ? payload : {};
  const part = isRecord(raw.part) ? raw.part : {};
  return {
    id: stringValue(raw.id, raw.partId, raw.part_id, part.id, `part-${index + 1}`),
    name: stringValue(raw.name, raw.partName, raw.part_name, nestedName(part), `قطعة ${index + 1}`),
    quantity: numberValue(raw.quantity, raw.qty),
  };
}

export function normalizeInventoryDailyLog(payload: unknown): InventoryDailyLog {
  if (!isRecord(payload)) throw new ApiError("استجابة المخزون اليومي غير صالحة.");
  const technician = isRecord(payload.technician) ? payload.technician : {};
  const dailyUsage = isRecord(payload.dailyUsage) ? payload.dailyUsage : {};
  const rawParts = Array.isArray(dailyUsage.parts) ? dailyUsage.parts : [];

  return {
    id: stringValue(payload.id, payload._id),
    technicianId: stringValue(payload.technicianId, payload.technician_id),
    technicianName: stringValue(
      nestedName(technician),
      payload.technicianName,
      payload.technician_name,
      "فني غير محدد",
    ),
    technicianPhone: stringValue(technician.phone, payload.technicianPhone, payload.technician_phone),
    toolsGiven: stringValue(payload.toolsGiven, payload.tools_given, payload.tools),
    notes: stringValue(payload.notes),
    createdAt: dateValue(payload.createdAt, payload.created_at),
    usedParts: rawParts.map(normalizeUsedPart),
  };
}

export function normalizeInventoryDailyList(payload: unknown, page: number, pageSize: number) {
  const root = isRecord(payload) ? payload : {};
  const data = dataRecord(payload);
  const pagination = isRecord(root.pagination)
    ? root.pagination
    : isRecord(data.pagination)
      ? data.pagination
      : {};
  const items = arrayData(payload, "technicians", "items", "logs").map(normalizeInventoryDailyLog);
  const total = numberValue(
    isRecord(data) ? data.totalTechnicians : undefined,
    root.totalTechnicians,
    pagination.total,
    pagination.totalItems,
    pagination.totalCount,
    items.length,
  );
  const start = (page - 1) * pageSize;
  const isServerPaginated =
    isRecord(root.pagination) ||
    isRecord(data.pagination) ||
    (total > items.length && items.length <= pageSize);

  return {
    items: isServerPaginated ? items : items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
  };
}

export function normalizeInventoryPart(payload: unknown): InventoryPart {
  if (!isRecord(payload)) throw new ApiError("استجابة قطعة الغيار غير صالحة.");
  const id = stringValue(payload.id, payload._id);
  if (!id) throw new ApiError("لم يرسل الخادم معرف القطعة.");

  return {
    id,
    sparePartNumber: stringValue(payload.sparePartNumber, payload.spare_part_number, payload.partNumber, id),
    name: stringValue(payload.name, "قطعة غير محددة"),
    sku: stringValue(payload.sku),
    shelfLocation: stringValue(payload.shelfLocation, payload.shelf_location),
    quantity: numberValue(payload.quantity, payload.stock),
    costSyp: numberValue(payload.costSyp, payload.cost_syp),
    costUsd: numberValue(payload.costUsd, payload.cost_usd),
    isActive: booleanValue(payload.isActive, true),
    createdAt: dateValue(payload.createdAt, payload.created_at),
    updatedAt: dateValue(payload.updatedAt, payload.updated_at),
  };
}

export function normalizeInventoryPartResponse(payload: unknown) {
  return normalizeInventoryPart(dataRecord(payload));
}

export function normalizeInventoryPartList(
  payload: unknown,
  fallback: { page: number; pageSize: number },
): InventoryListResult<InventoryPart> {
  const root = isRecord(payload) ? payload : {};
  const data = dataRecord(payload);
  const pagination = isRecord(root.pagination)
    ? root.pagination
    : isRecord(data.pagination)
      ? data.pagination
      : {};
  const items = arrayData(payload, "parts", "items", "data").map(normalizeInventoryPart);

  return {
    items,
    total: numberValue(pagination.total, root.total, data.total, items.length),
    page: numberValue(pagination.page, data.page, root.page, fallback.page) || fallback.page,
    pageSize:
      numberValue(pagination.limit, pagination.pageSize, data.limit, root.limit, fallback.pageSize) ||
      fallback.pageSize,
  };
}

function normalizeMovementType(value: unknown): InventoryMovementType {
  const raw = stringValue(value).toLowerCase();
  if (raw === "withdraw" || raw === "withdrawal" || raw === "out") return "withdraw";
  if (raw === "adjustment" || raw === "adjust") return "adjustment";
  return "supply";
}

export function normalizeInventoryMovement(payload: unknown, index: number): InventoryMovementLog {
  const raw = isRecord(payload) ? payload : {};
  const part = isRecord(raw.part) ? raw.part : isRecord(raw.sparePart) ? raw.sparePart : {};
  const id = stringValue(raw.id, raw._id, `movement-${index + 1}`);
  const movementNumber = publicCodeValue(
    raw.movementNumber,
    raw.movement_number,
    raw.movementNo,
    raw.movement_no,
    raw.movementCode,
    raw.movement_code,
    raw.movementId,
    raw.movement_id,
    raw.inventoryMovementNumber,
    raw.inventory_movement_number,
    raw.stockMovementNumber,
    raw.stock_movement_number,
    raw.displayNumber,
    raw.display_number,
    raw.publicNumber,
    raw.public_number,
    raw.publicId,
    raw.public_id,
    raw.transactionNumber,
    raw.transaction_number,
    raw.transactionNo,
    raw.transaction_no,
    raw.transactionCode,
    raw.transaction_code,
    raw.number,
    raw.code,
    raw.serial,
    raw.sequence,
    raw.reference,
  );

  return {
    id,
    movementNumber,
    partId: stringValue(raw.partId, raw.part_id, raw.sparePartId, raw.spare_part_id, part.id),
    partNumber: stringValue(
      raw.sparePartNumber,
      raw.spare_part_number,
      raw.partNumber,
      raw.part_number,
      raw.partCode,
      raw.part_code,
      part.sparePartNumber,
      part.spare_part_number,
      part.partNumber,
      part.part_number,
      part.sku,
    ),
    partName: stringValue(
      raw.partName,
      raw.part_name,
      raw.sparePartName,
      raw.spare_part_name,
      raw.name,
      nestedName(part),
      part.sparePartNumber,
    ),
    movementType: normalizeMovementType(raw.movementType ?? raw.movement_type ?? raw.type),
    quantity: numberValue(raw.quantity, raw.qty),
    owner: stringValue(raw.owner, raw.createdBy, raw.created_by, raw.userName, "إدارة المخزون"),
    reference: stringValue(raw.reference),
    createdAt: dateValue(raw.createdAt, raw.created_at),
  };
}

export function normalizeInventoryMovementList(payload: unknown) {
  return arrayData(payload, "movements", "items", "data").map(normalizeInventoryMovement);
}

export class InventoryDailyPayloadModel {
  constructor(private readonly input: InventoryDailyCreateInput) {}

  toJSON() {
    const parsed = InventoryDailyCreateSchema.parse(this.input);
    return {
      technicianId: parsed.technicianId,
      toolsGiven: parsed.toolsGiven,
      notes: parsed.notes ?? "",
    };
  }
}

export class InventoryPartPayloadModel {
  constructor(private readonly input: InventoryPartInput) {}

  toJSON() {
    const parsed = InventoryPartInputSchema.parse(this.input);
    const body: Record<string, unknown> = {
      name: parsed.name,
      costSyp: parsed.costSyp,
      costUsd: parsed.costUsd,
    };
    if (parsed.sku) body.sku = parsed.sku;
    if (parsed.shelfLocation) body.shelfLocation = parsed.shelfLocation;
    return body;
  }
}

export class InventoryMovementPayloadModel {
  constructor(private readonly input: InventoryMovementInput) {}

  toJSON() {
    const parsed = InventoryMovementInputSchema.parse(this.input);
    return {
      partId: parsed.partId,
      movementType: parsed.movementType,
      quantity: parsed.quantity,
      reference: parsed.reference ?? "",
    };
  }
}
