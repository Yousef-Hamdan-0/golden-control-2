import { localDateKey } from "@/lib/format/date";
import type { CustomerRepairRequest } from "@/models/customers/customer.model";

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  new: "جديد",
  accepted: "مقبول",
  ontheway: "في الطريق",
  "on-the-way": "في الطريق",
  arrived: "تم الوصول",
  underrepair: "قيد الإصلاح",
  "under-repair": "قيد الإصلاح",
  completed: "مكتمل",
  incompleted: "غير مكتمل",
  pulltocenter: "مسحوب للمركز",
  "pull-to-center": "مسحوب للمركز",
  postponed: "مؤجل",
  cancelled: "ملغي",
  canceled: "ملغي",
  notanswer: "لا يجيب",
  "not-answer": "لا يجيب",
  notrepairable: "غير قابل للإصلاح",
  repeated: "مكرر",
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "عالية",
  emergency: "طارئة",
  urgent: "طارئة",
};

export function formatApiDate(value: string) {
  return localDateKey(value, "غير محدد");
}

export function requestStatusLabel(request: CustomerRepairRequest) {
  if (request.isCompleted) return "مكتمل";
  return REQUEST_STATUS_LABELS[request.status] ?? (request.status || "غير محدد");
}

export function requestStatusTone(request: CustomerRepairRequest) {
  const status = request.status.toLowerCase();
  if (request.isCompleted || status === "completed") return "success" as const;
  if (status === "cancelled" || status === "canceled") return "danger" as const;
  return "gold" as const;
}

export function customerSearchParams(search: string) {
  const value = search.trim();
  if (!value) return {};

  return /\d/.test(value) ? { phone: value } : { name: value };
}
