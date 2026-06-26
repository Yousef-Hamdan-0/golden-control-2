import type { BadgeTone } from "@/components/ui/Badge";
import type { OrderStatus, Priority, PaymentStatus, PaymentMethod, InventoryMovement } from "../types";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "جديد",
  accepted: "مقبول",
  "on-the-way": "في الطريق",
  arrived: "تم الوصول",
  "under-repair": "قيد الإصلاح",
  completed: "مكتمل",
  incompleted: "قيد الإصلاح",
  "pull-to-center": "مسحوب للمركز",
  postponed: "مؤجل",
  cancelled: "ملغي",
  "not-answer": "لا يجيب",
};

export const ORDER_STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  new: "gold",
  accepted: "info",
  "on-the-way": "info",
  arrived: "info",
  "under-repair": "gold",
  completed: "success",
  incompleted: "gold",
  "pull-to-center": "info",
  postponed: "neutral",
  cancelled: "danger",
  "not-answer": "danger",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "عالية",
  emergency: "طارئة",
};

export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  paid: "مدفوعة بالكامل",
  partial: "مدفوعة جزئياً",
  unpaid: "غير مدفوعة",
  refunded: "مسترجعة",
};

export const PAYMENT_TONE: Record<PaymentStatus, BadgeTone> = {
  paid: "success",
  partial: "gold",
  unpaid: "danger",
  refunded: "danger",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "كاش",
  "sham-cash": "شام كاش",
};

export const INVENTORY_MOVEMENT_LABELS: Record<
  InventoryMovement["type"],
  { label: string; tone: BadgeTone }
> = {
  supply: { label: "توريد", tone: "success" },
  withdraw: { label: "صرف", tone: "gold" },
  adjustment: { label: "تسوية", tone: "info" },
};

export const USD_TO_SYP_RATE = 14500;

export const INVENTORY_ITEMS_STORAGE_KEY = "golden-control.inventory.items";
export const INVENTORY_MOVEMENTS_STORAGE_KEY = "golden-control.inventory.movements";
export const INVOICES_STORAGE_KEY = "golden-control.invoices";

export const SILENT_AUDIO_SRC =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=";
