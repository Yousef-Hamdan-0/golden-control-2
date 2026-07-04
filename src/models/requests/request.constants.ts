import { z } from "zod";

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
