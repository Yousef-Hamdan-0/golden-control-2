import type { Order, MaintenanceOrderDraft, DeviceDraft, OrderAudioRecord, OrderStatusHistoryItem } from "../types";
import { SILENT_AUDIO_SRC } from "../constants";
import { ORDERS, TECHNICIANS } from "../data/seed";
import { CURRENT_USER } from "@/lib/auth/current-user";

export const EMPTY_DEVICE: DeviceDraft = {
  type: "",
  name: "",
  brand: "",
  model: "",
};

export const EMPTY_MAINTENANCE_ORDER: MaintenanceOrderDraft = {
  location: "external",
  clientName: "",
  phone1: "",
  phone2: "",
  address: "",
  locationUrl: "",
  devices: [{ ...EMPTY_DEVICE }],
  faultDescription: "",
  notes: "",
  visitDate: "",
  visitTime: "",
  priority: "medium",
  technician: "",
};

export function orderToDraft(order: Order): MaintenanceOrderDraft {
  const fallbackDevice = {
    type: order.device.split(" ")[0] ?? "",
    name: order.device,
    brand: order.brand,
    model: "",
  };

  return {
    location: order.type,
    clientName: order.client,
    phone1: order.phone,
    phone2: order.phone2 ?? "",
    address: order.address,
    locationUrl: order.locationUrl ?? "",
    devices: order.devices?.length ? order.devices : [fallbackDevice],
    faultDescription: order.faultDescription ?? "",
    notes: order.notes ?? "",
    visitDate: order.visitDate.slice(0, 10),
    visitTime: order.visitDate.slice(11, 16),
    priority: order.priority,
    technician: order.technician === "غير محدد" ? "" : order.technician,
  };
}

export function draftToOrder(draft: MaintenanceOrderDraft, existing?: Order): Order {
  const primaryDevice = draft.devices[0] ?? EMPTY_DEVICE;
  const nextNumber =
    Math.max(...ORDERS.map((order) => Number(order.id.replace(/\D/g, "")))) + 1;

  return {
    id: existing?.id ?? `ORD-${nextNumber}`,
    type: draft.location,
    client: draft.clientName || "عميل جديد",
    phone: draft.phone1 || "غير محدد",
    phone2: draft.phone2,
    address: draft.location === "internal" ? "استلام داخل المركز" : draft.address || "غير محدد",
    locationUrl: draft.locationUrl,
    device: [primaryDevice.type, primaryDevice.name].filter(Boolean).join(" ") || "جهاز غير محدد",
    brand: primaryDevice.brand || "غير محدد",
    devices: draft.devices,
    technician: draft.technician || "غير محدد",
    status: existing?.status ?? "new",
    priority: draft.priority,
    visitDate: `${draft.visitDate || "2026-06-11"} ${draft.visitTime || "09:00"}`,
    faultDescription: draft.faultDescription,
    notes: draft.notes,
    audioRecords: existing?.audioRecords ?? [],
    statusHistory:
      existing?.statusHistory ??
      [
        {
          id: `HIS-${existing?.id ?? nextNumber}-1`,
          status: existing?.status ?? "new",
          note: "تم إنشاء الطلب وتسجيل بيانات العميل.",
          owner: CURRENT_USER.fullName,
          date: `${draft.visitDate || "2026-06-11"} ${draft.visitTime || "09:00"}`,
        },
      ],
    total: existing?.total ?? 0,
    paid: existing?.paid ?? 0,
  };
}

export function getOrderDevices(order: Order): DeviceDraft[] {
  if (order.devices?.length) return order.devices;

  return [
    {
      type: order.device.split(" ")[0] ?? "",
      name: order.device,
      brand: order.brand,
      model: "",
    },
  ];
}

export function formatDeviceName(device: DeviceDraft): string {
  return [device.type, device.name].filter(Boolean).join(" ") || "جهاز غير محدد";
}

export function getOrderAudioRecords(order: Order): OrderAudioRecord[] {
  if (order.audioRecords?.length) return order.audioRecords;

  return [
    {
      id: `AUD-${order.id}-1`,
      name: "مكالمة استلام الطلب",
      duration: "00:42",
      date: order.visitDate,
      url: SILENT_AUDIO_SRC,
    },
  ];
}

export function getOrderStatusHistory(order: Order): OrderStatusHistoryItem[] {
  if (order.statusHistory?.length) return order.statusHistory;

  const createdDate = order.visitDate.slice(0, 10);
  return [
    {
      id: `HIS-${order.id}-1`,
      status: "new",
      note: "تم إنشاء الطلب وتسجيل بيانات العميل.",
      owner: "موظف خدمة العملاء",
      date: `${createdDate} 09:00`,
    },
    {
      id: `HIS-${order.id}-2`,
      status: order.status,
      note: "تم تحديث حالة الطلب حسب متابعة فريق الصيانة.",
      owner: order.technician || CURRENT_USER.fullName,
      date: order.visitDate,
    },
  ];
}

export function isRepairDecisionStatus(status: Order["status"]): boolean {
  return status === "completed" || status === "incompleted" || status === "under-repair";
}

export function canCreateInvoiceForOrder(order: Order, role: string): boolean {
  const normalizedRole = role.toLowerCase();
  if (normalizedRole === "admin") return true;
  if (order.type === "internal") return normalizedRole === "manager" || normalizedRole === "employee";
  return false;
}

export { TECHNICIANS };
