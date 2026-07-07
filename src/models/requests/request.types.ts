import type { Invoice } from "@/features/operations/types";
import type {
  RepairRequestPriority,
  RepairRequestStatus,
  RepairRequestType,
} from "@/models/requests/request.constants";

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
  mimeType?: string;
  duration?: number;
}

export interface RepairRequestStatusHistoryItem {
  id: string;
  status: RepairRequestStatus;
  note: string;
  owner: string;
  ownerId: string;
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
  invoices: Invoice[];
  statusHistory: RepairRequestStatusHistoryItem[];
  hasInvoice: boolean;
}

export interface NormalizedRepairRequestList {
  items: RepairRequest[];
  total: number;
  page: number;
  limit: number;
}
