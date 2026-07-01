import type { Currency } from "@/lib/format/currency";

export type OrderStatus =
  | "new"
  | "accepted"
  | "on-the-way"
  | "arrived"
  | "under-repair"
  | "completed"
  | "incompleted"
  | "pull-to-center"
  | "postponed"
  | "cancelled"
  | "not-answer";

export type OrderType = "external" | "internal";
export type Priority = "low" | "medium" | "high" | "emergency";
export type InvoiceType = "external" | "internal";
export type PaymentStatus = "paid" | "partial" | "unpaid" | "refunded";
export type PaymentMethod = "cash" | "sham-cash";
export type PaymentCurrency = "SYP" | "USD";

export interface DeviceDraft {
  type: string;
  name: string;
  brand: string;
  model: string;
}

export interface OrderAudioRecord {
  id: string;
  name: string;
  duration: string;
  date: string;
  url: string;
}

export interface OrderStatusHistoryItem {
  id: string;
  status: OrderStatus;
  note: string;
  owner: string;
  date: string;
}

export interface Order {
  id: string;
  type: OrderType;
  client: string;
  phone: string;
  phone2?: string;
  address: string;
  locationUrl?: string;
  device: string;
  brand: string;
  devices?: DeviceDraft[];
  technician: string;
  status: OrderStatus;
  priority: Priority;
  visitDate: string;
  faultDescription?: string;
  notes?: string;
  audioRecords?: OrderAudioRecord[];
  statusHistory?: OrderStatusHistoryItem[];
  total: number;
  paid: number;
}

export interface MaintenanceOrderDraft {
  location: OrderType;
  clientName: string;
  phone1: string;
  phone2: string;
  address: string;
  locationUrl: string;
  devices: DeviceDraft[];
  faultDescription: string;
  notes: string;
  visitDate: string;
  visitTime: string;
  priority: Priority;
  technician: string;
}

export interface DateFilter {
  from: string;
  to: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unitCost: number;
  lastMove: string;
  location: string;
}

export interface InventoryMovement {
  id: string;
  partId: string;
  partName: string;
  type: "supply" | "withdraw" | "adjustment";
  quantity: number;
  owner: string;
  createdAt: string;
  reference: string;
}

export interface InvoicePayment {
  id: string;
  amount: number;
  convertedAmount?: number;
  currency: PaymentCurrency;
  method: PaymentMethod;
  dollarExchangeRate?: number;
  paidAt: string;
}

export interface InvoicePart {
  id: string;
  sparePartId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  currency?: Currency;
  totalPrice?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber?: string;
  orderId: string;
  requestNumber?: string;
  type: InvoiceType;
  client: string;
  clientPhone: string;
  clientPhone2?: string;
  clientAddress?: string;
  technicianId?: string;
  technician: string;
  technicianPhone?: string;
  status: PaymentStatus;
  currency: Currency;
  paymentMethod: PaymentMethod;
  /** USD→SYP rate captured at creation, sourced from center settings. */
  dollarExchangeRate?: number;
  total: number;
  paid: number;
  issuedAt: string;
  warrantyDuration?: string;
  locationURL?: string;
  centerPullItems?: string;
  notes?: string;
  returned?: boolean;
  parts: InvoicePart[];
  payments: InvoicePayment[];
}

export interface FinanceRecord {
  id: string;
  title: string;
  category: string;
  amount: number;
  currency: Currency;
  date: string;
  owner: string;
}

export interface TechnicianPerformance {
  id: string;
  name: string;
  completed: number;
  active: number;
  delayed: number;
  revenue: number;
  satisfaction: number;
  status: "available" | "busy" | "leave";
}
