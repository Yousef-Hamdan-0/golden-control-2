import type { BadgeTone } from "@/components/ui/Badge";
import type { DashboardLastRequest } from "@/models/dashboard/dashboard.model";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_TONE,
  type RepairRequestStatus,
} from "@/models/requests/request.model";

export type ModalMode = "view" | "edit";

export interface RecentOrder {
  id: string;
  requestNumber: string;
  client: string;
  phone: string;
  device: string;
  technician: string;
  status: RepairRequestStatus;
  notes: string;
}

export function requestStatusMeta(status: RepairRequestStatus): {
  label: string;
  tone: BadgeTone;
} {
  return {
    label: REQUEST_STATUS_LABELS[status],
    tone: REQUEST_STATUS_TONE[status],
  };
}

export function recentOrderFromDashboard(request: DashboardLastRequest): RecentOrder {
  return {
    id: request.requestId,
    requestNumber: request.requestNumber,
    client: request.customerName,
    phone: "غير متوفر",
    device: request.deviceInfo,
    technician: request.technicianName || "غير محدد",
    status: request.status,
    notes: "",
  };
}
