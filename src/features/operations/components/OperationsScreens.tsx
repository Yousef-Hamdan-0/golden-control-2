"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmToast } from "@/components/ui/ConfirmToast";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { TablePagination } from "@/components/ui/TablePagination";
import { Textarea } from "@/components/ui/Textarea";
import { PageHeader } from "@/components/layout/PageHeader";
import { Icon, type IconName } from "@/lib/icons";
import { formatMoney, type Currency } from "@/lib/format/currency";
import { cn } from "@/lib/utils/cn";
import { CURRENT_USER } from "@/lib/auth/current-user";
import { PAGE_SIZE } from "@/config/constants";

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
export type PaymentStatus = "paid" | "partial" | "unpaid";
export type PaymentMethod = "cash" | "sham-cash";
export type PaymentCurrency = "SYP" | "USD";

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

interface DeviceDraft {
  type: string;
  name: string;
  brand: string;
  model: string;
}

interface OrderAudioRecord {
  id: string;
  name: string;
  duration: string;
  date: string;
  url: string;
}

interface OrderStatusHistoryItem {
  id: string;
  status: OrderStatus;
  note: string;
  owner: string;
  date: string;
}

interface MaintenanceOrderDraft {
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

interface DateFilter {
  from: string;
  to: string;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unitCost: number;
  lastMove: string;
  location: string;
}

interface InventoryMovement {
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
  paidAt: string;
}

export interface InvoicePart {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  orderId: string;
  type: InvoiceType;
  client: string;
  clientPhone: string;
  clientPhone2?: string;
  clientAddress?: string;
  technician: string;
  technicianPhone?: string;
  status: PaymentStatus;
  currency: Currency;
  paymentMethod: PaymentMethod;
  total: number;
  paid: number;
  issuedAt: string;
  warrantyDuration?: string;
  centerPullItems?: string;
  notes?: string;
  returned?: boolean;
  parts: InvoicePart[];
  payments: InvoicePayment[];
}

interface FinanceRecord {
  id: string;
  title: string;
  category: string;
  amount: number;
  currency: Currency;
  date: string;
  owner: string;
}

interface TechnicianPerformance {
  id: string;
  name: string;
  completed: number;
  active: number;
  delayed: number;
  revenue: number;
  satisfaction: number;
  status: "available" | "busy" | "leave";
}

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
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

const ORDER_STATUS_TONE: Record<OrderStatus, BadgeTone> = {
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

const PRIORITY_LABELS: Record<Priority, string> = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "عالية",
  emergency: "طارئة",
};

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  paid: "مدفوعة بالكامل",
  partial: "مدفوعة جزئياً",
  unpaid: "غير مدفوعة",
};

const PAYMENT_TONE: Record<PaymentStatus, BadgeTone> = {
  paid: "success",
  partial: "gold",
  unpaid: "danger",
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "كاش",
  "sham-cash": "شام كاش",
};

const USD_TO_SYP_RATE = 14500;
const INVENTORY_ITEMS_STORAGE_KEY = "golden-control.inventory.items";
const INVENTORY_MOVEMENTS_STORAGE_KEY = "golden-control.inventory.movements";
const INVOICES_STORAGE_KEY = "golden-control.invoices";
const SILENT_AUDIO_SRC =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=";

const ORDERS: Order[] = [
  {
    id: "ORD-5542",
    type: "external",
    client: "محمد العتيبي",
    phone: "0991 223 441",
    phone2: "0988 440 221",
    address: "دمشق - المزة",
    locationUrl: "https://maps.google.com/?q=Damascus+Mezzeh",
    device: "ثلاجة LG",
    brand: "LG",
    devices: [
      { type: "ثلاجة", name: "ثلاجة LG", brand: "LG", model: "GR-B247" },
      { type: "فريزر", name: "فريزر منزلي", brand: "LG", model: "F-220" },
    ],
    technician: "رامي سمير",
    status: "under-repair",
    priority: "high",
    visitDate: "2026-06-11 10:30",
    total: 950000,
    paid: 450000,
  },
  {
    id: "ORD-5541",
    type: "external",
    client: "سارة القحطاني",
    phone: "0944 772 118",
    address: "دمشق - المالكي",
    locationUrl: "https://maps.google.com/?q=Damascus+Malki",
    device: "شاشة سامسونغ",
    brand: "Samsung",
    devices: [{ type: "شاشة", name: "شاشة سامسونغ", brand: "Samsung", model: "UA55" }],
    technician: "رامي سمير",
    status: "completed",
    priority: "medium",
    visitDate: "2026-06-11 12:00",
    total: 680000,
    paid: 680000,
  },
  {
    id: "ORD-5540",
    type: "internal",
    client: "مركز الصفاء التجاري",
    phone: "011 442 0911",
    phone2: "0933 118 205",
    address: "استلام داخل المركز",
    device: "غسالة ناشونال",
    brand: "National",
    devices: [
      { type: "غسالة", name: "غسالة ناشونال", brand: "National", model: "NA-F70" },
      { type: "جلاية", name: "جلاية صحون", brand: "Beko", model: "" },
    ],
    technician: "هاني خالد",
    status: "pull-to-center",
    priority: "emergency",
    visitDate: "2026-06-12 09:00",
    total: 1225000,
    paid: 600000,
  },
  {
    id: "ORD-5539",
    type: "external",
    client: "ليان منصور",
    phone: "0988 113 520",
    address: "دمشق - كفرسوسة",
    locationUrl: "https://maps.google.com/?q=Damascus+Kafr+Sousa",
    device: "فرن كهربائي",
    brand: "Ariston",
    devices: [{ type: "فرن", name: "فرن كهربائي", brand: "Ariston", model: "" }],
    technician: "نور حمزة",
    status: "postponed",
    priority: "low",
    visitDate: "2026-06-13 16:00",
    total: 320000,
    paid: 0,
  },
  {
    id: "ORD-5538",
    type: "internal",
    client: "شركة الربيع",
    phone: "011 889 2020",
    phone2: "0955 202 889",
    address: "استلام داخل المركز",
    device: "مكيف سبليت",
    brand: "Gree",
    devices: [
      { type: "مكيف", name: "مكيف سبليت", brand: "Gree", model: "18K" },
      { type: "مكيف", name: "مكيف مكتب", brand: "Gree", model: "12K" },
    ],
    technician: "هاني خالد",
    status: "incompleted",
    priority: "high",
    visitDate: "2026-06-12 14:15",
    total: 1450000,
    paid: 750000,
  },
  {
    id: "ORD-5536",
    type: "internal",
    client: "مؤسسة النور",
    phone: "011 552 7788",
    phone2: "0966 214 778",
    address: "استلام داخل المركز",
    device: "براد عرض",
    brand: "Sharp",
    devices: [{ type: "براد", name: "براد عرض", brand: "Sharp", model: "SC-420" }],
    technician: "سامر يوسف",
    status: "completed",
    priority: "medium",
    visitDate: "2026-06-13 11:30",
    total: 825000,
    paid: 250000,
  },
  {
    id: "ORD-5537",
    type: "external",
    client: "مالك ناصر",
    phone: "0933 441 224",
    address: "ريف دمشق - جرمانا",
    locationUrl: "https://maps.google.com/?q=Jaramana",
    device: "جلاية بوش",
    brand: "Bosch",
    devices: [{ type: "جلاية", name: "جلاية بوش", brand: "Bosch", model: "" }],
    technician: "رامي سمير",
    status: "not-answer",
    priority: "medium",
    visitDate: "2026-06-11 18:00",
    total: 0,
    paid: 0,
  },
];

const INVENTORY: InventoryItem[] = [
  {
    id: "PRT-101",
    name: "كمبروسر ثلاجة 1/4",
    category: "ثلاجات",
    stock: 8,
    minStock: 4,
    unitCost: 780000,
    lastMove: "صرف إلى رامي سمير",
    location: "رف A-01",
  },
  {
    id: "PRT-102",
    name: "حساس حرارة NTC",
    category: "غسالات",
    stock: 3,
    minStock: 10,
    unitCost: 55000,
    lastMove: "تنبيه نقص",
    location: "رف B-04",
  },
  {
    id: "PRT-103",
    name: "لوحة تحكم شاشة",
    category: "شاشات",
    stock: 12,
    minStock: 5,
    unitCost: 420000,
    lastMove: "توريد جديد",
    location: "خزانة C",
  },
  {
    id: "PRT-104",
    name: "موتور جلاية",
    category: "جلايات",
    stock: 2,
    minStock: 4,
    unitCost: 610000,
    lastMove: "صرف إلى هاني خالد",
    location: "رف A-03",
  },
  {
    id: "PRT-105",
    name: "فلتر مكيف داخلي",
    category: "مكيفات",
    stock: 30,
    minStock: 12,
    unitCost: 30000,
    lastMove: "جرد يومي",
    location: "رف D-02",
  },
];

const INVENTORY_MOVEMENTS: InventoryMovement[] = [
  {
    id: "MOV-9108",
    partId: "PRT-103",
    partName: "لوحة تحكم شاشة",
    type: "supply",
    quantity: 4,
    owner: "المستودع",
    createdAt: "2026-06-12 13:20",
    reference: "توريد جديد",
  },
  {
    id: "MOV-9107",
    partId: "PRT-101",
    partName: "كمبروسر ثلاجة 1/4",
    type: "withdraw",
    quantity: 1,
    owner: "رامي سمير",
    createdAt: "2026-06-12 10:10",
    reference: "طلب ORD-5542",
  },
  {
    id: "MOV-9106",
    partId: "PRT-102",
    partName: "حساس حرارة NTC",
    type: "withdraw",
    quantity: 2,
    owner: "هاني خالد",
    createdAt: "2026-06-11 17:45",
    reference: "طلب ORD-5538",
  },
  {
    id: "MOV-9105",
    partId: "PRT-105",
    partName: "فلتر مكيف داخلي",
    type: "adjustment",
    quantity: 6,
    owner: "المخزون",
    createdAt: "2026-06-11 09:05",
    reference: "تسوية جرد",
  },
  {
    id: "MOV-9104",
    partId: "PRT-104",
    partName: "موتور جلاية",
    type: "withdraw",
    quantity: 1,
    owner: "نور حمزة",
    createdAt: "2026-06-10 15:30",
    reference: "طلب ORD-5529",
  },
  {
    id: "MOV-9103",
    partId: "PRT-101",
    partName: "كمبروسر ثلاجة 1/4",
    type: "supply",
    quantity: 3,
    owner: "المستودع",
    createdAt: "2026-06-09 12:00",
    reference: "فاتورة شراء",
  },
];

function readStoredList<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredList<T>(key: string, items: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(items));
}

const INVENTORY_MOVEMENT_LABELS: Record<InventoryMovement["type"], { label: string; tone: BadgeTone }> = {
  supply: { label: "توريد", tone: "success" },
  withdraw: { label: "صرف", tone: "gold" },
  adjustment: { label: "تسوية", tone: "info" },
};

const INVOICES: Invoice[] = [
  {
    id: "INV-9021",
    orderId: "ORD-5542",
    type: "external",
    client: "محمد العتيبي",
    clientPhone: "0991 223 441",
    clientPhone2: "0988 440 221",
    clientAddress: "دمشق - المزة",
    technician: "رامي سمير",
    technicianPhone: "0955 114 220",
    status: "partial",
    currency: "SYP",
    paymentMethod: "cash",
    total: 950000,
    paid: 450000,
    issuedAt: "2026-06-11",
    warrantyDuration: "3 أشهر",
    centerPullItems: "لوحة التحكم الرئيسية",
    notes: "العميل طلب التواصل قبل الزيارة بنصف ساعة.",
    parts: [
      { id: "PRT-101", name: "كمبروسر ثلاجة 1/4", quantity: 1, unitPrice: 780000 },
      { id: "PRT-102", name: "حساس حرارة NTC", quantity: 2, unitPrice: 55000 },
    ],
    payments: [
      { id: "PAY-721", amount: 450000, convertedAmount: 450000, currency: "SYP", method: "cash", paidAt: "2026-06-11" },
    ],
  },
  {
    id: "INV-9020",
    orderId: "ORD-5541",
    type: "external",
    client: "سارة القحطاني",
    clientPhone: "0944 772 118",
    clientPhone2: "لا يوجد",
    clientAddress: "دمشق - المالكي",
    technician: "رامي سمير",
    technicianPhone: "0955 114 220",
    status: "paid",
    currency: "SYP",
    paymentMethod: "sham-cash",
    total: 680000,
    paid: 680000,
    issuedAt: "2026-06-10",
    warrantyDuration: "شهر واحد",
    centerPullItems: "",
    notes: "",
    parts: [
      { id: "PRT-103", name: "لوحة تحكم شاشة", quantity: 1, unitPrice: 420000 },
      { id: "LAB-001", name: "أجور صيانة", quantity: 1, unitPrice: 260000 },
    ],
    payments: [
      { id: "PAY-720", amount: 300000, convertedAmount: 300000, currency: "SYP", method: "sham-cash", paidAt: "2026-06-10" },
      { id: "PAY-719", amount: 380000, convertedAmount: 380000, currency: "SYP", method: "sham-cash", paidAt: "2026-06-10" },
    ],
  },
  {
    id: "INV-9019",
    orderId: "ORD-5540",
    type: "internal",
    client: "مركز الصفاء التجاري",
    clientPhone: "011 442 0911",
    clientPhone2: "0933 118 205",
    clientAddress: "استلام داخل المركز",
    technician: "هاني خالد",
    technicianPhone: "0944 620 331",
    status: "partial",
    currency: "USD",
    paymentMethod: "cash",
    total: 125,
    paid: 60,
    issuedAt: "2026-06-10",
    warrantyDuration: "6 أشهر",
    centerPullItems: "مضخة التصريف",
    notes: "تم تثبيت الجهاز داخل المركز.",
    parts: [
      { id: "PRT-104", name: "موتور جلاية", quantity: 1, unitPrice: 42 },
      { id: "LAB-002", name: "أجور فحص", quantity: 1, unitPrice: 83 },
    ],
    payments: [
      { id: "PAY-718", amount: 60, convertedAmount: 60, currency: "USD", method: "cash", paidAt: "2026-06-10" },
    ],
  },
  {
    id: "INV-9018",
    orderId: "ORD-5538",
    type: "internal",
    client: "شركة الربيع",
    clientPhone: "011 889 2020",
    clientPhone2: "0955 202 889",
    clientAddress: "استلام داخل المركز",
    technician: "هاني خالد",
    technicianPhone: "0944 620 331",
    status: "unpaid",
    currency: "SYP",
    paymentMethod: "cash",
    total: 1450000,
    paid: 0,
    issuedAt: "2026-06-09",
    warrantyDuration: "لا يوجد",
    centerPullItems: "",
    notes: "بانتظار موافقة العميل على التكلفة.",
    parts: [
      { id: "PRT-105", name: "فلتر مكيف داخلي", quantity: 3, unitPrice: 30000 },
      { id: "LAB-003", name: "أجور تركيب", quantity: 1, unitPrice: 1360000 },
    ],
    payments: [],
  },
];

function normalizeInvoice(invoice: Partial<Invoice>): Invoice {
  const total = Number(invoice.total) || 0;
  const paid = Math.min(total, Math.max(0, Number(invoice.paid) || 0));
  const status: PaymentStatus =
    invoice.status === "paid" || invoice.status === "partial" || invoice.status === "unpaid"
      ? invoice.status
      : paid >= total && total > 0
        ? "paid"
        : paid > 0
          ? "partial"
          : "unpaid";
  const currency: Currency = invoice.currency === "USD" ? "USD" : "SYP";
  const paymentMethod: PaymentMethod = invoice.paymentMethod === "sham-cash" ? "sham-cash" : "cash";
  const parts =
    Array.isArray(invoice.parts) && invoice.parts.length > 0
      ? invoice.parts.map((part, index) => ({
          id: part.id || `PRT-${index + 1}`,
          name: part.name || "قطعة غير محددة",
          quantity: Math.max(1, Number(part.quantity) || 1),
          unitPrice: Math.max(0, Number(part.unitPrice) || 0),
        }))
      : [
          {
            id: `PRT-${(invoice.id ?? "0000").replace(/\D/g, "").slice(-4) || "0000"}`,
            name: "أجور صيانة",
            quantity: 1,
            unitPrice: total,
          },
        ];
  const technician = invoice.technician || "غير محدد";

  return {
    id: invoice.id || "INV-0000",
    orderId: invoice.orderId || "ORD-0000",
    type: invoice.type === "internal" ? "internal" : "external",
    client: invoice.client || "عميل غير محدد",
    clientPhone: invoice.clientPhone || "غير محدد",
    clientPhone2: invoice.clientPhone2 || "لا يوجد",
    clientAddress: invoice.clientAddress || "غير محدد",
    technician,
    technicianPhone: invoice.technicianPhone || getTechnicianPhone(technician),
    status,
    currency,
    paymentMethod,
    total,
    paid,
    issuedAt: invoice.issuedAt || new Date().toISOString().slice(0, 10),
    warrantyDuration: invoice.warrantyDuration || "غير محددة",
    centerPullItems: invoice.centerPullItems ?? "",
    notes: invoice.notes ?? "",
    returned: Boolean(invoice.returned),
    parts,
    payments: Array.isArray(invoice.payments)
      ? invoice.payments.map((payment, index) => ({
          id: payment.id || `PAY-${index + 1}`,
          amount: Math.max(0, Number(payment.amount) || 0),
          convertedAmount: Math.max(0, Number(payment.convertedAmount ?? payment.amount) || 0),
          currency: payment.currency === "USD" ? "USD" : "SYP",
          method: payment.method === "sham-cash" ? "sham-cash" : "cash",
          paidAt: payment.paidAt || invoice.issuedAt || new Date().toISOString().slice(0, 10),
        }))
      : [],
  };
}

function readStoredInvoices() {
  return readStoredList<Partial<Invoice>>(INVOICES_STORAGE_KEY, INVOICES).map(normalizeInvoice);
}

const FINANCE_RECORDS: FinanceRecord[] = [
  {
    id: "FIN-310",
    title: "إيجار المركز",
    category: "fixed",
    amount: 4200000,
    currency: "SYP",
    date: "2026-06-01",
    owner: "الإدارة",
  },
  {
    id: "FIN-311",
    title: "وقود سيارات الصيانة",
    category: "variable",
    amount: 740000,
    currency: "SYP",
    date: "2026-06-09",
    owner: "العمليات",
  },
  {
    id: "FIN-312",
    title: "بيع قطع غيار",
    category: "sales",
    amount: 2650000,
    currency: "SYP",
    date: "2026-06-10",
    owner: "المخزون",
  },
  {
    id: "FIN-313",
    title: "دفعات صيانة خارجية",
    category: "sales",
    amount: 3120000,
    currency: "SYP",
    date: "2026-06-11",
    owner: "الفواتير",
  },
];

const TECHNICIANS: TechnicianPerformance[] = [
  {
    id: "TEC-01",
    name: "رامي سمير",
    completed: 18,
    active: 4,
    delayed: 1,
    revenue: 7250000,
    satisfaction: 96,
    status: "busy",
  },
  {
    id: "TEC-02",
    name: "هاني خالد",
    completed: 14,
    active: 3,
    delayed: 2,
    revenue: 6120000,
    satisfaction: 91,
    status: "available",
  },
  {
    id: "TEC-03",
    name: "نور حمزة",
    completed: 11,
    active: 2,
    delayed: 0,
    revenue: 4480000,
    satisfaction: 94,
    status: "available",
  },
  {
    id: "TEC-04",
    name: "سامر يوسف",
    completed: 7,
    active: 0,
    delayed: 1,
    revenue: 2880000,
    satisfaction: 88,
    status: "leave",
  },
];

const TECHNICIAN_PHONE_BY_NAME: Record<string, string> = {
  "رامي سمير": "0955 114 220",
  "هاني خالد": "0944 620 331",
  "نور حمزة": "0933 781 904",
  "سامر يوسف": "0991 440 772",
};

function typeLabel(type: OrderType | InvoiceType) {
  return type === "external" ? "خارجي" : "داخلي";
}

function currencyLabel(currency: Currency) {
  return currency === "SYP" ? "ليرة سورية" : "دولار";
}

function invoicePartTotal(part: InvoicePart) {
  return part.quantity * part.unitPrice;
}

function invoicePartsTotal(parts: InvoicePart[]) {
  return parts.reduce((sum, part) => sum + invoicePartTotal(part), 0);
}

function isRepairDecisionStatus(status: OrderStatus) {
  return status === "completed" || status === "incompleted" || status === "under-repair";
}

function canCreateInvoiceForOrder(order: Order, role: string) {
  const normalizedRole = role.toLowerCase();
  if (normalizedRole === "admin") return true;
  if (order.type === "internal") return normalizedRole === "manager" || normalizedRole === "employee";
  return false;
}

function nextInvoiceId(invoices: Invoice[]) {
  const maxNumber = Math.max(0, ...invoices.map((invoice) => Number(invoice.id.replace(/\D/g, "")) || 0));
  return `INV-${maxNumber + 1}`;
}

function createInvoiceDraftFromOrder(order: Order, invoices: Invoice[]): Invoice {
  const paid = Math.min(order.total, order.paid);
  const status: PaymentStatus = paid >= order.total && order.total > 0 ? "paid" : paid > 0 ? "partial" : "unpaid";

  return {
    id: nextInvoiceId(invoices),
    orderId: order.id,
    type: order.type,
    client: order.client,
    clientPhone: order.phone,
    clientPhone2: order.phone2 ?? "",
    clientAddress: order.address,
    technician: order.technician,
    technicianPhone: getTechnicianPhone(order.technician),
    status,
    currency: "SYP",
    paymentMethod: "cash",
    total: order.total,
    paid,
    issuedAt: new Date().toISOString().slice(0, 10),
    warrantyDuration: "",
    centerPullItems: order.status === "incompleted" ? order.device : "",
    notes: "",
    returned: false,
    parts: [
      {
        id: `PRT-${order.id.replace(/\D/g, "").slice(-4) || "0000"}`,
        name: order.device,
        quantity: 1,
        unitPrice: order.total,
      },
    ],
    payments:
      paid > 0
        ? [
            {
              id: `PAY-${Date.now().toString().slice(-5)}`,
              amount: paid,
              convertedAmount: paid,
              currency: "SYP",
              method: "cash",
              paidAt: new Date().toISOString().slice(0, 10),
            },
          ]
        : [],
  };
}

function remaining(total: number, paid: number) {
  return Math.max(0, total - paid);
}

function contains(value: string, query: string) {
  return value.toLowerCase().includes(query.trim().toLowerCase());
}

const EMPTY_DEVICE: DeviceDraft = {
  type: "",
  name: "",
  brand: "",
  model: "",
};

const EMPTY_MAINTENANCE_ORDER: MaintenanceOrderDraft = {
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

function orderToDraft(order: Order): MaintenanceOrderDraft {
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

function draftToOrder(draft: MaintenanceOrderDraft, existing?: Order): Order {
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

function normalizeDateKey(value: string): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function matchesDateValue(value: string, filter: DateFilter): boolean {
  if (!filter.from && !filter.to) return true;
  const dateKey = normalizeDateKey(value);
  const fromKey = normalizeDateKey(filter.from);
  const toKey = normalizeDateKey(filter.to);

  return (!fromKey || dateKey >= fromKey) && (!toKey || dateKey <= toKey);
}

function matchesDateFilter(order: Order, filter: DateFilter): boolean {
  return matchesDateValue(order.visitDate, filter);
}

function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <PageHeader title={title} subtitle={subtitle} />
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function KpiCards({
  cards,
}: {
  cards: Array<{ label: string; value: string; icon: IconName; tone?: BadgeTone }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="text-right">
              <p className="text-sm text-content-muted">{card.label}</p>
              <p className="mt-2 font-heading text-2xl font-bold text-content">
                {card.value}
              </p>
            </div>
            <div className="rounded-md bg-gold-soft p-2 text-gold">
              <Icon name={card.icon} />
            </div>
          </div>
          {card.tone ? (
            <div className="mt-4 flex justify-end">
              <Badge tone={card.tone} dot>
                مباشر
              </Badge>
            </div>
          ) : null}
        </Card>
      ))}
    </div>
  );
}

function FilterCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <Card className={`grid gap-3 p-4 md:grid-cols-4 ${className}`}>{children}</Card>;
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="p-10 text-center text-sm text-content-muted">
      {title}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const widthClass =
    value >= 90
      ? "w-full"
      : value >= 75
        ? "w-3/4"
        : value >= 50
          ? "w-1/2"
          : value >= 25
            ? "w-1/4"
            : "w-1/12";

  return (
    <div className="h-2 overflow-hidden rounded-sm bg-surface-2">
      <div className={`h-full rounded-sm bg-gold ${widthClass}`} />
    </div>
  );
}

export function MaintenanceOrderModal({
  onClose,
  onSave,
  initialOrder,
}: {
  onClose: () => void;
  onSave?: (order: Order) => void;
  initialOrder?: Order;
}) {
  const [draft, setDraft] = useState<MaintenanceOrderDraft>(
    initialOrder ? orderToDraft(initialOrder) : EMPTY_MAINTENANCE_ORDER,
  );
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [pendingEditOrder, setPendingEditOrder] = useState<Order | null>(null);
  const isEdit = Boolean(initialOrder);

  function updateDevice(index: number, patch: Partial<DeviceDraft>) {
    setDraft((current) => ({
      ...current,
      devices: current.devices.map((device, currentIndex) =>
        currentIndex === index ? { ...device, ...patch } : device,
      ),
    }));
  }

  function addDevice() {
    setDraft((current) => ({
      ...current,
      devices: [...current.devices, { ...EMPTY_DEVICE }],
    }));
  }

  function removeDevice(index: number) {
    setDraft((current) => ({
      ...current,
      devices: current.devices.filter((_, currentIndex) => currentIndex !== index),
    }));
  }

  function handleSubmit() {
    const order = draftToOrder(draft, initialOrder);
    if (isEdit) {
      setPendingEditOrder(order);
      return;
    }

    onSave?.(order);
    setCreatedOrder(order);
  }

  return (
    <>
      <Modal
        title={isEdit ? "تعديل طلب صيانة" : "إنشاء طلب صيانة"}
        description="أدخل بيانات الطلب، العميل، الأجهزة، العطل، وموعد الزيارة."
        onClose={onClose}
        widthClassName="max-w-5xl"
      >
        <form className="space-y-6 p-5" onSubmit={(event) => event.preventDefault()}>
        <section className="space-y-3">
          <h3 className="font-heading text-base font-bold text-gold">موقع الطلب</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["internal", "external"] as OrderType[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setDraft((current) => ({ ...current, location: value }))}
                className={[
                  "rounded-md border px-4 py-3 text-right text-sm transition",
                  draft.location === value
                    ? "border-gold bg-gold-soft text-gold"
                    : "border-border bg-surface-2 text-content hover:bg-gold-soft",
                ].join(" ")}
              >
                {typeLabel(value)}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-heading text-base font-bold text-gold">بيانات العميل</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="الاسم">
              <Input
                value={draft.clientName}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, clientName: event.target.value }))
                }
                placeholder="اسم العميل"
              />
            </Field>
            <Field label="الهاتف 1">
              <Input
                dir="ltr"
                value={draft.phone1}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, phone1: event.target.value }))
                }
                placeholder="09xx xxx xxx"
              />
            </Field>
            <Field label="الهاتف 2">
              <Input
                dir="ltr"
                value={draft.phone2}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, phone2: event.target.value }))
                }
                placeholder="اختياري"
              />
            </Field>
            <Field label="العنوان">
              <Input
                value={draft.address}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, address: event.target.value }))
                }
                placeholder="المدينة / المنطقة / التفاصيل"
              />
            </Field>
            <Field label="رابط الموقع (اختياري)" className="md:col-span-2">
              <Input
                dir="ltr"
                value={draft.locationUrl}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, locationUrl: event.target.value }))
                }
                placeholder="https://maps.google.com/..."
              />
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-heading text-base font-bold text-gold">بيانات الأجهزة</h3>
            <Button type="button" variant="outline" size="sm" onClick={addDevice}>
              <Icon name="plus" size={16} />
              جهاز آخر
            </Button>
          </div>
          <div className="space-y-3">
            {draft.devices.map((device, index) => (
              <div key={index} className="rounded-md border border-border bg-surface-2 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-content">جهاز {index + 1}</span>
                  {draft.devices.length > 1 ? (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => removeDevice(index)}
                    >
                      <Icon name="trash" size={16} />
                      حذف
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  <Field label="نوع الجهاز">
                    <Input
                      value={device.type}
                      onChange={(event) => updateDevice(index, { type: event.target.value })}
                      placeholder="ثلاجة / غسالة / شاشة"
                    />
                  </Field>
                  <Field label="اسم الجهاز">
                    <Input
                      value={device.name}
                      onChange={(event) => updateDevice(index, { name: event.target.value })}
                      placeholder="اسم الجهاز"
                    />
                  </Field>
                  <Field label="الماركة">
                    <Input
                      value={device.brand}
                      onChange={(event) => updateDevice(index, { brand: event.target.value })}
                      placeholder="LG / Samsung..."
                    />
                  </Field>
                  <Field label="الموديل (اختياري)">
                    <Input
                      value={device.model}
                      onChange={(event) => updateDevice(index, { model: event.target.value })}
                      placeholder="رقم الموديل"
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-heading text-base font-bold text-gold">بيانات العطل</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="وصف العطل">
              <Textarea
                className="min-h-28"
                value={draft.faultDescription}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    faultDescription: event.target.value,
                  }))
                }
                placeholder="اكتب وصف العطل هنا"
              />
            </Field>
            <Field label="ملاحظات (اختياري)">
              <Textarea
                className="min-h-28"
                value={draft.notes}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, notes: event.target.value }))
                }
                placeholder="أي ملاحظات إضافية"
              />
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-heading text-base font-bold text-gold">تاريخ التسليم / الزيارة</h3>
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="التاريخ">
              <Input
                type="date"
                value={draft.visitDate}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, visitDate: event.target.value }))
                }
              />
            </Field>
            <Field label="الوقت">
              <Input
                type="time"
                value={draft.visitTime}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, visitTime: event.target.value }))
                }
              />
            </Field>
            <Field label="الأولوية">
              <Select
                value={draft.priority}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    priority: event.target.value as Priority,
                  }))
                }
              >
                <option value="low">منخفضة (Low)</option>
                <option value="medium">متوسطة (Medium)</option>
                <option value="high">عالية (High)</option>
                <option value="emergency">طارئة (Emergency)</option>
              </Select>
            </Field>
            <Field label="الفني (اختياري)">
              <Select
                value={draft.technician}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, technician: event.target.value }))
                }
              >
                <option value="">بدون تحديد</option>
                {TECHNICIANS.map((tech) => (
                  <option key={tech.id} value={tech.name}>
                    {tech.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </section>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="button" onClick={handleSubmit}>
            <Icon name={isEdit ? "pencil" : "plus"} size={18} />
            {isEdit ? "حفظ التعديل" : "إنشاء الطلب"}
          </Button>
        </div>
        </form>
      </Modal>
      {createdOrder ? (
        <OrderPdfActionsModal
          order={createdOrder}
          onClose={() => {
            setCreatedOrder(null);
            onClose();
          }}
        />
      ) : null}
      {pendingEditOrder ? (
        <ConfirmToast
          title="تأكيد تعديل الطلب"
          message={`هل تريد حفظ التعديلات على الطلب ${pendingEditOrder.id}؟`}
          tone="gold"
          confirmLabel="تأكيد التعديل"
          onCancel={() => setPendingEditOrder(null)}
          onConfirm={() => {
            onSave?.(pendingEditOrder);
            onClose();
          }}
        />
      ) : null}
    </>
  );
}

function escapePdfText(value: string): string {
  return value
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function buildSimplePdf(order: Order): Blob {
  const lines = [
    "Golden Control - Maintenance Order",
    `Order: ${order.id}`,
    `Client: ${escapePdfText(order.client)}`,
    `Phone: ${order.phone}`,
    `Device: ${escapePdfText(order.device)}`,
    `Brand: ${escapePdfText(order.brand)}`,
    `Technician: ${escapePdfText(order.technician)}`,
    `Visit: ${order.visitDate}`,
    `Priority: ${order.priority}`,
  ];

  const content = [
    "BT",
    "/F1 18 Tf",
    "50 780 Td",
    `(${escapePdfText(lines[0])}) Tj`,
    "/F1 12 Tf",
    ...lines.slice(1).map((line) => `0 -28 Td (${escapePdfText(line)}) Tj`),
    "ET",
  ].join("\n");

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
    `5 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj\n`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object) => {
    offsets.push(pdf.length);
    pdf += object;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

function downloadOrderPdf(order: Order) {
  const url = URL.createObjectURL(buildSimplePdf(order));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${order.id}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function printOrderPdf(order: Order) {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return;
  printWindow.document.write(`
    <html dir="rtl" lang="ar">
      <head>
        <title>${order.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #1a1a1a; }
          h1 { color: #8a6b2f; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          td { border: 1px solid #e7dfcf; padding: 12px; }
          td:first-child { width: 180px; font-weight: 700; background: #f6f1e7; }
        </style>
      </head>
      <body>
        <h1>طلب صيانة ${order.id}</h1>
        <table>
          <tr><td>العميل</td><td>${order.client}</td></tr>
          <tr><td>الهاتف</td><td dir="ltr">${order.phone}</td></tr>
          <tr><td>الجهاز</td><td>${order.device}</td></tr>
          <tr><td>الماركة</td><td>${order.brand}</td></tr>
          <tr><td>الفني</td><td>${order.technician}</td></tr>
          <tr><td>موعد الزيارة</td><td>${order.visitDate}</td></tr>
          <tr><td>العنوان</td><td>${order.address}</td></tr>
        </table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function OrderPdfActionsModal({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <Modal
      title="تم إنشاء الطلب"
      description={`تم إنشاء الطلب ${order.id}. يمكنك تنزيل ملف PDF أو طباعته الآن.`}
      onClose={onClose}
      widthClassName="max-w-xl"
    >
      <div className="space-y-4 p-5">
        <div className="rounded-md border border-border bg-surface-2 p-4 text-sm text-content-muted">
          <div className="font-semibold text-content">{order.client}</div>
          <div className="mt-1" dir="ltr">{order.phone}</div>
          <div className="mt-1">{order.device}</div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={() => downloadOrderPdf(order)}>
            تنزيل PDF
          </Button>
          <Button type="button" onClick={() => printOrderPdf(order)}>
            طباعة PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function DateFilterModal({
  filter,
  onApply,
  onClose,
}: {
  filter: DateFilter;
  onApply: (filter: DateFilter) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<DateFilter>(filter);

  return (
    <Modal
      title="فلترة حسب الوقت"
      description="اختر تاريخ البداية والنهاية لعرض السجلات ضمن الفترة المحددة."
      onClose={onClose}
      widthClassName="max-w-xl"
    >
      <div className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="من تاريخ">
            <Input
              type="date"
              value={draft.from}
              onChange={(event) =>
                setDraft((current) => ({ ...current, from: event.target.value }))
              }
            />
          </Field>
          <Field label="إلى تاريخ">
            <Input
              type="date"
              value={draft.to}
              onChange={(event) =>
                setDraft((current) => ({ ...current, to: event.target.value }))
              }
            />
          </Field>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setDraft({ from: "", to: "" })}
          >
            مسح
          </Button>
          <Button
            type="button"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            تطبيق الفلتر
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function DetailItem({
  label,
  value,
  ltr = false,
}: {
  label: string;
  value: ReactNode;
  ltr?: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-surface-2 p-3">
      <div className="text-xs text-content-muted">{label}</div>
      <div className="mt-1 font-semibold text-content" dir={ltr ? "ltr" : "rtl"}>
        {value}
      </div>
    </div>
  );
}

function getOrderDevices(order: Order): DeviceDraft[] {
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

function formatDeviceName(device: DeviceDraft) {
  return [device.type, device.name].filter(Boolean).join(" ") || "جهاز غير محدد";
}

function getTechnicianPhone(name: string) {
  if (!name || name === "غير محدد") return "لا يوجد";
  return TECHNICIAN_PHONE_BY_NAME[name] ?? "لا يوجد";
}

function getOrderAudioRecords(order: Order): OrderAudioRecord[] {
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

function getOrderStatusHistory(order: Order): OrderStatusHistoryItem[] {
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

export function OrderDetailsModal({
  order,
  invoice,
  invoices = INVOICES,
  onCreateInvoice,
  onCompleteOrder,
  onClose,
}: {
  order: Order;
  invoice?: Invoice | null;
  invoices?: Invoice[];
  onCreateInvoice?: (invoice: Invoice) => void;
  onCompleteOrder?: (order: Order) => void;
  onClose: () => void;
}) {
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);
  const [invoiceNotice, setInvoiceNotice] = useState<string | null>(null);
  const activeInvoice = invoice ?? createdInvoice;
  const invoiceBalance = activeInvoice ? remaining(activeInvoice.total, activeInvoice.paid) : 0;
  const devices = getOrderDevices(order);
  const phone2 = order.phone2?.trim() || "لا يوجد";
  const customerLocation = order.locationUrl?.trim();
  const technicianPhone = getTechnicianPhone(order.technician);
  const audioRecords = getOrderAudioRecords(order);
  const statusHistory = getOrderStatusHistory(order);
  const faultDescription = order.faultDescription?.trim() || "لا يوجد وصف عطل مسجل لهذا الطلب.";
  const invoiceDraft = createInvoiceDraftFromOrder(order, invoices);

  function handleInvoiceCreateRequest() {
    setInvoiceNotice(null);

    if (!isRepairDecisionStatus(order.status)) {
      setInvoiceNotice("يمكن إنشاء الفاتورة فقط عندما يكون الطلب مكتملًا أو قيد الإصلاح.");
      return;
    }

    if (!canCreateInvoiceForOrder(order, CURRENT_USER.role)) {
      setInvoiceNotice(
        order.type === "external"
          ? "إنشاء فاتورة الطلب الخارجي متاح فقط لمدير النظام."
          : "لا تملك صلاحية إنشاء فاتورة لهذا الطلب.",
      );
      return;
    }

    if (activeInvoice) {
      setInvoiceNotice("توجد فاتورة مرتبطة بهذا الطلب مسبقاً. يمكنك معاينتها من زر التفاصيل.");
      setShowInvoiceDetails(true);
      return;
    }

    if (!onCreateInvoice) {
      setInvoiceNotice("إنشاء الفواتير متاح من تفاصيل الطلب داخل صفحة إدارة الطلبات.");
      return;
    }

    setShowInvoiceForm(true);
  }

  return (
    <>
      <Modal
        title={`تفاصيل الطلب ${order.id}`}
        description="معلومات العميل، الأجهزة، الفني، الحالة، والفاتورة المرتبطة."
        onClose={onClose}
        widthClassName="max-w-4xl"
      >
        <div className="space-y-5 p-5">
          <Card className="bg-surface-2 p-4 shadow-none">
            <h3 className="font-heading text-base font-bold text-content">بيانات الطلب</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <DetailItem label="رقم الطلب" value={order.id} ltr />
              <DetailItem label="نوع الطلب" value={typeLabel(order.type)} />
              <DetailItem
                label="حالة الطلب"
                value={
                  <Badge tone={ORDER_STATUS_TONE[order.status]} dot>
                    {ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                }
              />
            </div>
          </Card>

          <Card className="bg-surface-2 p-4 shadow-none">
            <h3 className="font-heading text-base font-bold text-content">بيانات العميل</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <DetailItem label="اسم العميل" value={order.client} />
              <DetailItem label="رقمه 1" value={order.phone} ltr />
              <DetailItem label="رقمه 2" value={phone2} ltr={Boolean(order.phone2?.trim())} />
              <DetailItem label="عنوان العميل" value={order.address} />
              <DetailItem
                label="رابط موقع العميل"
                value={
                  customerLocation ? (
                    <a href={customerLocation} target="_blank" rel="noreferrer" className="text-gold hover:text-gold-hover">
                      فتح الموقع
                    </a>
                  ) : (
                    "لا يوجد"
                  )
                }
              />
              <DetailItem label="وقت الزيارة" value={order.visitDate} />
            </div>
          </Card>

          <Card className="overflow-hidden shadow-none">
            <div className="border-b border-border px-4 py-3">
              <h3 className="font-heading text-base font-bold text-content">الأجهزة</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[720px] w-full text-right text-sm">
                <thead>
                  <tr className="bg-surface-2 text-content-muted">
                    {["نوع الجهاز", "اسم الجهاز", "الماركة", "الموديل"].map((header) => (
                      <th key={header} className="px-4 py-3 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device, index) => (
                    <tr key={`${device.name}-${index}`} className="border-t border-border">
                      <td className="px-4 py-3 text-content-muted">{device.type || "غير محدد"}</td>
                      <td className="px-4 py-3 font-semibold text-content">{device.name || formatDeviceName(device)}</td>
                      <td className="px-4 py-3 text-content-muted">{device.brand || "غير محدد"}</td>
                      <td className="px-4 py-3 text-content-muted">{device.model || "غير محدد"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="bg-surface-2 p-4 shadow-none">
            <h3 className="font-heading text-base font-bold text-content">وصف العطل</h3>
            <p className="mt-3 rounded-md border border-border bg-surface p-3 text-sm leading-7 text-content-muted">
              {faultDescription}
            </p>
          </Card>

          <Card className="bg-surface-2 p-4 shadow-none">
            <h3 className="font-heading text-base font-bold text-content">معلومات الفني</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <DetailItem label="اسم الفني" value={order.technician} />
              <DetailItem label="رقم تلفونه" value={technicianPhone} ltr={technicianPhone !== "لا يوجد"} />
            </div>
          </Card>

          <Card className="overflow-hidden shadow-none">
            <div className="border-b border-border px-4 py-3">
              <h3 className="font-heading text-base font-bold text-content">التسجيلات الصوتية</h3>
            </div>
            <div className="divide-y divide-border">
              {audioRecords.map((record) => (
                <div key={record.id} className="grid gap-3 p-4 md:grid-cols-[1.2fr_0.6fr_0.8fr_1.4fr] md:items-center">
                  <DetailItem label="الاسم" value={record.name} />
                  <DetailItem label="المدة" value={record.duration} ltr />
                  <DetailItem label="التاريخ" value={record.date} />
                  <div>
                    <div className="mb-1.5 text-xs text-content-muted">تشغيل التسجيل</div>
                    <audio controls preload="none" src={record.url} className="h-10 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden shadow-none">
            <div className="border-b border-border px-4 py-3">
              <h3 className="font-heading text-base font-bold text-content">سجل حالة الطلب</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full text-right text-sm">
                <thead>
                  <tr className="bg-surface-2 text-content-muted">
                    {["الحالة", "الملاحظة", "المسؤول", "التاريخ"].map((header) => (
                      <th key={header} className="px-4 py-3 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {statusHistory.map((item) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <Badge tone={ORDER_STATUS_TONE[item.status]} dot>
                          {ORDER_STATUS_LABELS[item.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-content-muted">{item.note}</td>
                      <td className="px-4 py-3 text-content">{item.owner}</td>
                      <td className="px-4 py-3 text-content-muted">{item.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="bg-surface-2 p-4 shadow-none">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-heading text-base font-bold text-content">الفاتورة</h3>
              {activeInvoice ? (
                <button
                  type="button"
                  aria-label={`تفاصيل الفاتورة ${activeInvoice.id}`}
                  title="تفاصيل الفاتورة"
                  onClick={() => setShowInvoiceDetails(true)}
                  className="rounded-sm p-1.5 text-content-muted hover:bg-surface hover:text-content"
                >
                  <Icon name="eye" size={18} />
                </button>
              ) : (
                <Button type="button" size="sm" onClick={handleInvoiceCreateRequest}>
                  <Icon name="plus" size={16} />
                  إنهاء الطلب وإنشاء فاتورة
                </Button>
              )}
            </div>
            {invoiceNotice ? (
              <div className="mt-3 rounded-md border border-gold/30 bg-gold-soft p-3 text-sm font-medium text-gold-active">
                {invoiceNotice}
              </div>
            ) : null}
            {activeInvoice ? (
              <div className="mt-3 grid gap-3 md:grid-cols-4">
                <DetailItem label="رقم الفاتورة" value={activeInvoice.id} ltr />
                <DetailItem
                  label="حالة الفاتورة"
                  value={
                    <Badge tone={PAYMENT_TONE[activeInvoice.status]} dot>
                      {PAYMENT_LABELS[activeInvoice.status]}
                    </Badge>
                  }
                />
                <DetailItem label="الإجمالي" value={formatMoney(activeInvoice.total, activeInvoice.currency)} />
                <DetailItem label="المتبقي" value={formatMoney(invoiceBalance, activeInvoice.currency)} />
              </div>
            ) : (
              <p className="mt-3 text-sm text-content-muted">
                لا توجد فاتورة مرتبطة بهذا الطلب حالياً.
              </p>
            )}
          </Card>
        </div>
      </Modal>

      {showInvoiceDetails && activeInvoice ? (
        <InvoiceDetailsModal
          invoice={activeInvoice}
          order={order}
          onClose={() => setShowInvoiceDetails(false)}
        />
      ) : null}
      {showInvoiceForm ? (
        <InvoiceFormModal
          invoice={invoiceDraft}
          mode="create"
          onClose={() => setShowInvoiceForm(false)}
          onSave={(nextInvoice) => {
            setCreatedInvoice(nextInvoice);
            onCreateInvoice?.(nextInvoice);
            if (order.status !== "completed") {
              onCompleteOrder?.({
                ...order,
                status: "completed",
                statusHistory: [
                  ...statusHistory,
                  {
                    id: `HIS-${order.id}-invoice`,
                    status: "completed",
                    note: `تم إنهاء الطلب وإنشاء الفاتورة ${nextInvoice.id}.`,
                    owner: CURRENT_USER.fullName,
                    date: new Date().toISOString().slice(0, 16).replace("T", " "),
                  },
                ],
              });
            }
            setShowInvoiceForm(false);
            setShowInvoiceDetails(true);
          }}
        />
      ) : null}
    </>
  );
}

function PartFormModal({
  onClose,
  onSave,
  initialPart,
}: {
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
  initialPart?: InventoryItem | null;
}) {
  const [name, setName] = useState(initialPart?.name ?? "");
  const [code, setCode] = useState(initialPart?.id ?? "");
  const [location, setLocation] = useState(initialPart?.location ?? "");
  const [valueSyp, setValueSyp] = useState(String(initialPart?.unitCost ?? ""));
  const [valueUsd, setValueUsd] = useState(
    initialPart ? String(Number((initialPart.unitCost / USD_TO_SYP_RATE).toFixed(2))) : "",
  );
  const [pendingEditItem, setPendingEditItem] = useState<InventoryItem | null>(null);
  const isEdit = Boolean(initialPart);

  function buildItem(): InventoryItem {
    return {
      id: code || `PRT-${Date.now().toString().slice(-4)}`,
      name: name || "قطعة جديدة",
      category: initialPart?.category ?? "عام",
      stock: initialPart?.stock ?? 0,
      minStock: initialPart?.minStock ?? 1,
      unitCost: Number(valueSyp) || Math.round((Number(valueUsd) || 0) * USD_TO_SYP_RATE),
      lastMove: isEdit ? "تعديل بيانات" : "إضافة قطعة",
      location: location || "غير محدد",
    };
  }

  function saveItem(item: InventoryItem) {
    onSave(item);
    onClose();
  }

  return (
    <>
      <Modal
        title={isEdit ? "تعديل قطعة" : "إضافة قطعة"}
        description={isEdit ? "تعديل بيانات القطعة وقيمتها وموقعها." : "إضافة قطعة جديدة إلى مخزون قطع الغيار."}
        onClose={onClose}
        widthClassName="max-w-2xl"
      >
        <form className="grid gap-4 p-5 md:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
          <Field label="اسم القطعة">
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="مثال: حساس حرارة NTC" />
          </Field>
          <Field label="الكود">
            <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="PRT-000" dir="ltr" />
          </Field>
          <Field label="قيمة القطعة بالليرة السورية">
            <Input value={valueSyp} onChange={(event) => setValueSyp(event.target.value)} type="number" min={0} placeholder="0" />
          </Field>
          <Field label="قيمة القطعة بالدولار">
            <Input value={valueUsd} onChange={(event) => setValueUsd(event.target.value)} type="number" min={0} step="0.01" placeholder="0" />
          </Field>
          <Field label="الموقع" className="md:col-span-2">
            <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="رف A-01" />
          </Field>
          <div className="flex items-center justify-end gap-3 border-t border-border pt-4 md:col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={() => {
                const item = buildItem();
                if (isEdit) setPendingEditItem(item);
                else saveItem(item);
              }}
            >
              <Icon name={isEdit ? "pencil" : "plus"} size={18} />
              {isEdit ? "حفظ التعديل" : "إضافة القطعة"}
            </Button>
          </div>
        </form>
      </Modal>
      {pendingEditItem ? (
        <ConfirmToast
          title="تأكيد تعديل القطعة"
          message={`هل تريد حفظ التعديلات على القطعة ${pendingEditItem.name}؟`}
          tone="gold"
          confirmLabel="تأكيد التعديل"
          onCancel={() => setPendingEditItem(null)}
          onConfirm={() => saveItem(pendingEditItem)}
        />
      ) : null}
    </>
  );
}

function QuantityAdjustmentModal({
  items,
  onClose,
  onSave,
}: {
  items: InventoryItem[];
  onClose: () => void;
  onSave: (partId: string, movementType: InventoryMovement["type"], quantity: number) => void;
}) {
  const [partId, setPartId] = useState(items[0]?.id ?? "");
  const [movementType, setMovementType] = useState<"supply" | "adjustment">("supply");
  const [quantity, setQuantity] = useState("1");
  const [pendingAdjustment, setPendingAdjustment] = useState<{
    partId: string;
    movementType: "supply" | "adjustment";
    quantity: number;
    partName: string;
  } | null>(null);
  const selectedPart = items.find((item) => item.id === partId);
  const numericQuantity = Number(quantity) || 0;
  const delta = movementType === "supply" ? Math.max(0, numericQuantity) : numericQuantity;
  const nextStock = selectedPart ? Math.max(0, selectedPart.stock + delta) : 0;
  const wouldDropBelowZero = Boolean(selectedPart && selectedPart.stock + delta < 0);
  const canSave = Boolean(selectedPart) && delta !== 0 && !wouldDropBelowZero;

  return (
    <Modal
      title="تعديل الكمية"
      description="اختر القطعة ونوع الحركة لتعديل كمية المخزون."
      onClose={onClose}
      widthClassName="max-w-2xl"
    >
      <form className="space-y-5 p-5" onSubmit={(event) => event.preventDefault()}>
        <div className="rounded-md border border-border bg-surface-2 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="text-right">
              <div className="text-xs text-content-muted">القطعة المحددة</div>
              <div className="mt-1 font-heading text-lg font-bold text-content">
                {selectedPart?.name ?? "لا توجد قطعة"}
              </div>
              <div className="mt-1 text-xs text-content-muted" dir="ltr">
                {selectedPart?.id ?? "-"}
              </div>
            </div>
            <Badge tone={INVENTORY_MOVEMENT_LABELS[movementType].tone} dot>
              {INVENTORY_MOVEMENT_LABELS[movementType].label}
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="القطعة">
            <Select value={partId} onChange={(event) => setPartId(event.target.value)}>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} - {item.id}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="نوع الحركة">
            <Select
              value={movementType}
              onChange={(event) => {
                const nextType = event.target.value as "supply" | "adjustment";
                setMovementType(nextType);
                setQuantity(nextType === "supply" && Number(quantity) <= 0 ? "1" : quantity);
              }}
            >
              <option value="supply">توريد</option>
              <option value="adjustment">تسوية</option>
            </Select>
          </Field>
          <Field label={movementType === "supply" ? "كمية التوريد" : "قيمة التسوية"}>
            <Input
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              type="number"
              min={movementType === "supply" ? 1 : undefined}
              placeholder={movementType === "supply" ? "مثال: 5" : "مثال: 5 أو -3"}
              dir="ltr"
            />
          </Field>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-border bg-surface-2 p-3">
            <div className="text-xs text-content-muted">الكمية الحالية</div>
            <div className="mt-1 font-heading text-2xl font-bold text-content">{selectedPart?.stock ?? 0}</div>
          </div>
          <div className="rounded-md border border-border bg-surface-2 p-3">
            <div className="text-xs text-content-muted">قيمة الحركة</div>
            <div className={cn("mt-1 font-heading text-2xl font-bold", delta < 0 ? "text-danger" : "text-success")}>
              {delta > 0 ? `+${delta}` : delta}
            </div>
          </div>
          <div className="rounded-md border border-border bg-surface-2 p-3">
            <div className="text-xs text-content-muted">الكمية بعد التعديل</div>
            <div className="mt-1 font-heading text-2xl font-bold text-gold">{nextStock}</div>
          </div>
        </div>

        {movementType === "supply" ? (
          <p className="text-sm text-content-muted">حركة التوريد تزيد الكمية فقط.</p>
        ) : (
          <p className="text-sm text-content-muted">حركة التسوية تقبل رقماً موجباً أو سالباً.</p>
        )}
        {wouldDropBelowZero ? (
          <p className="rounded-md border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
            لا يمكن أن تصبح كمية القطعة أقل من صفر.
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            type="button"
            disabled={!canSave}
            onClick={() => {
              if (!selectedPart || delta === 0) return;
              setPendingAdjustment({
                partId: selectedPart.id,
                movementType,
                quantity: delta,
                partName: selectedPart.name,
              });
            }}
          >
            <Icon name="pencil" size={18} />
            حفظ تعديل الكمية
          </Button>
        </div>
      </form>
      {pendingAdjustment ? (
        <ConfirmToast
          title="تأكيد تعديل الكمية"
          message={`هل تريد حفظ تعديل كمية ${pendingAdjustment.partName}؟`}
          tone="gold"
          confirmLabel="تأكيد التعديل"
          onCancel={() => setPendingAdjustment(null)}
          onConfirm={() => {
            onSave(pendingAdjustment.partId, pendingAdjustment.movementType, pendingAdjustment.quantity);
            onClose();
          }}
        />
      ) : null}
    </Modal>
  );
}

function InternalInvoiceModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal
      title="فاتورة داخلية"
      description="إنشاء فاتورة داخلية وهمية مرتبطة بطلب صيانة."
      onClose={onClose}
      widthClassName="max-w-2xl"
    >
      <form className="grid gap-4 p-5 md:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
        <Field label="رقم الطلب">
          <Input placeholder="ORD-0000" dir="ltr" />
        </Field>
        <Field label="اسم العميل">
          <Input placeholder="اسم العميل" />
        </Field>
        <Field label="الفني">
          <Select defaultValue="">
            <option value="">اختر الفني</option>
            {TECHNICIANS.map((tech) => (
              <option key={tech.id} value={tech.name}>
                {tech.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="الإجمالي">
          <Input type="number" min={0} placeholder="0" />
        </Field>
        <Field label="المدفوع">
          <Input type="number" min={0} placeholder="0" />
        </Field>
        <Field label="العملة">
          <Select defaultValue="SYP">
            <option value="SYP">ليرة سورية</option>
            <option value="USD">دولار</option>
          </Select>
        </Field>
        <Field label="ملاحظات" className="md:col-span-2">
          <Textarea className="min-h-24" placeholder="بنود أو ملاحظات الفاتورة" />
        </Field>
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4 md:col-span-2">
          <Button type="button" variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="button" onClick={onClose}>
            <Icon name="plus" size={18} />
            إنشاء الفاتورة
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function OrdersScreen() {
  const params = useSearchParams();
  const initialType = params.get("type") as OrderType | null;
  const initialStatus = params.get("status") as OrderStatus | null;
  const [orders, setOrders] = useState<Order[]>(ORDERS);
  const [orderInvoices, setOrderInvoices] = useState<Invoice[]>(readStoredInvoices);
  const [type, setType] = useState<OrderType | "all">(initialType ?? "all");
  const [status, setStatus] = useState<OrderStatus | "all">(initialStatus ?? "all");
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [showForm, setShowForm] = useState(params.get("create") === "1");
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    from: "",
    to: "",
  });
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () =>
      orders.filter((order) => {
        const byType = type === "all" || order.type === type;
        const byStatus = status === "all" || order.status === status;
        const byPriority = priority === "all" || order.priority === priority;
        const byQuery =
          !query ||
          contains(order.id, query) ||
          contains(order.phone, query);
        const byDate = matchesDateFilter(order, dateFilter);
        return byType && byStatus && byPriority && byQuery && byDate;
      }),
    [dateFilter, orders, priority, query, status, type],
  );

  const completed = orders.filter((order) => order.status === "completed").length;
  const incompleted = orders.filter((order) => order.status === "incompleted").length;
  const pulled = orders.filter((order) => order.status === "pull-to-center").length;
  const hasDateFilter = Boolean(dateFilter.from || dateFilter.to);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visibleOrders = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function upsertOrder(order: Order) {
    setOrders((current) => {
      const exists = current.some((item) => item.id === order.id);
      return exists
        ? current.map((item) => (item.id === order.id ? order : item))
        : [order, ...current];
    });
  }

  useEffect(() => {
    writeStoredList(INVOICES_STORAGE_KEY, orderInvoices);
  }, [orderInvoices]);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="إدارة الطلبات"
        subtitle="متابعة الطلبات الداخلية والخارجية، الحالات، الأولويات، والفني المسؤول."
        action={
          <Button type="button" onClick={() => setShowForm(true)}>
            <Icon name="plus" size={18} />
            طلب صيانة جديد
          </Button>
        }
      />

      <KpiCards
        cards={[
          { label: "إجمالي الطلبات", value: String(orders.length), icon: "clipboard" },
          { label: "مكتملة", value: String(completed), icon: "shield", tone: "success" },
          { label: "قيد الإصلاح", value: String(incompleted), icon: "wrench", tone: "gold" },
          { label: "مسحوبة للمركز", value: String(pulled), icon: "box", tone: "info" },
        ]}
      />

      {showForm ? (
        <MaintenanceOrderModal
          onClose={() => setShowForm(false)}
          onSave={upsertOrder}
        />
      ) : null}
      {editingOrder ? (
        <MaintenanceOrderModal
          initialOrder={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSave={upsertOrder}
        />
      ) : null}
      {viewingOrder ? (
        <OrderDetailsModal
          order={viewingOrder}
          invoice={orderInvoices.find((invoice) => invoice.orderId === viewingOrder.id) ?? null}
          invoices={orderInvoices}
          onCreateInvoice={(invoice) =>
            setOrderInvoices((current) =>
              current.some((item) => item.id === invoice.id)
                ? current.map((item) => (item.id === invoice.id ? invoice : item))
                : [invoice, ...current],
            )
          }
          onCompleteOrder={(nextOrder) => {
            setOrders((current) =>
              current.map((item) => (item.id === nextOrder.id ? nextOrder : item)),
            );
            setViewingOrder(nextOrder);
          }}
          onClose={() => setViewingOrder(null)}
        />
      ) : null}
      {orderToDelete ? (
        <ConfirmToast
          title="تأكيد حذف الطلب"
          message={`هل تريد حذف الطلب ${orderToDelete.id} الخاص بالعميل ${orderToDelete.client}؟`}
          onCancel={() => setOrderToDelete(null)}
          onConfirm={() => {
            setOrders((current) => current.filter((item) => item.id !== orderToDelete.id));
            setOrderToDelete(null);
          }}
        />
      ) : null}
      {showDateFilter ? (
        <DateFilterModal
          filter={dateFilter}
          onApply={(filter) => {
            setDateFilter(filter);
            setPage(1);
          }}
          onClose={() => setShowDateFilter(false)}
        />
      ) : null}

      <FilterCard className="lg:grid-cols-[minmax(360px,2fr)_repeat(3,minmax(130px,1fr))_auto]">
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder="بحث برقم الطلب أو هاتف العميل"
          aria-label="بحث الطلبات"
        />
        <Select
          value={type}
          onChange={(event) => {
            setType(event.target.value as OrderType | "all");
            setPage(1);
          }}
          aria-label="تصفية نوع الطلب"
        >
          <option value="all">كل أنواع الطلبات</option>
          <option value="external">طلبات خارجية</option>
          <option value="internal">طلبات داخلية</option>
        </Select>
        <Select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as OrderStatus | "all");
            setPage(1);
          }}
          aria-label="تصفية حالة الطلب"
        >
          <option value="all">كل الحالات</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          value={priority}
          onChange={(event) => {
            setPriority(event.target.value as Priority | "all");
            setPage(1);
          }}
          aria-label="تصفية الأولوية"
        >
          <option value="all">كل الأولويات</option>
          {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Button
          type="button"
          variant={hasDateFilter ? "primary" : "outline"}
          className="whitespace-nowrap"
          onClick={() => setShowDateFilter(true)}
        >
          <Icon name="clock" size={18} />
          الفترة الزمنية
        </Button>
      </FilterCard>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full text-right text-sm">
            <thead>
              <tr className="bg-surface-2 text-content-muted">
                {[
                  "رقم الطلب",
                  "العميل",
                  "الجهاز",
                  "الفني",
                  "الحالة",
                  "الأولوية",
                  "الإجراءات",
                ].map((header) => (
                  <th key={header} className="px-4 py-3 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border hover:bg-gold-soft">
                    <td className="px-4 py-4 font-bold text-gold">{order.id}</td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-content">{order.client}</div>
                      <div className="text-xs text-content-muted" dir="ltr">
                        {order.phone}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-content-muted">
                      {order.device}
                      <span className="mx-1 text-border">/</span>
                      {order.brand}
                    </td>
                    <td className="px-4 py-4 text-content">{order.technician}</td>
                    <td className="px-4 py-4">
                      <Badge tone={ORDER_STATUS_TONE[order.status]} dot>
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone={order.priority === "emergency" ? "danger" : "neutral"}>
                        {PRIORITY_LABELS[order.priority]}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-start gap-2" dir="rtl">
                        <button
                          type="button"
                          aria-label={`تفاصيل ${order.id}`}
                          title="تفاصيل الطلب"
                          onClick={() => setViewingOrder(order)}
                          className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2"
                        >
                          <Icon name="eye" size={18} />
                        </button>
                        <button
                          type="button"
                          aria-label={`تعديل ${order.id}`}
                          title="تعديل"
                          onClick={() => setEditingOrder(order)}
                          className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2"
                        >
                          <Icon name="pencil" size={18} />
                        </button>
                        <button
                          type="button"
                          aria-label={`حذف ${order.id}`}
                          title="حذف"
                          onClick={() => setOrderToDelete(order)}
                          className="rounded-sm p-1.5 text-danger hover:bg-danger-soft"
                        >
                          <Icon name="trash" size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 ? <EmptyState title="لا توجد طلبات مطابقة للفلاتر." /> : null}
        <TablePagination
          page={currentPage}
          total={filtered.length}
          pageSize={PAGE_SIZE}
          onPage={setPage}
          itemLabel="طلب"
        />
      </Card>
    </div>
  );
}

export function InventoryScreen({ section = "parts" }: { section?: string }) {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() =>
    readStoredList(INVENTORY_ITEMS_STORAGE_KEY, INVENTORY),
  );
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>(() =>
    readStoredList(INVENTORY_MOVEMENTS_STORAGE_KEY, INVENTORY_MOVEMENTS),
  );
  const [query, setQuery] = useState("");
  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [editingPart, setEditingPart] = useState<InventoryItem | null>(null);
  const [partToDelete, setPartToDelete] = useState<InventoryItem | null>(null);
  const [partPage, setPartPage] = useState(1);
  const [movementPage, setMovementPage] = useState(1);
  const [showMovementDateFilter, setShowMovementDateFilter] = useState(false);
  const [movementDateFilter, setMovementDateFilter] = useState<DateFilter>({ from: "", to: "" });
  const lowStock = inventoryItems.filter((item) => item.stock <= item.minStock);
  const filtered = inventoryItems.filter((item) => {
    const byQuery = !query || contains(item.name, query) || contains(item.id, query);
    return byQuery;
  });

  const isMovement = section === "movement";
  const inventoryValue = inventoryItems.reduce((sum, item) => sum + item.stock * item.unitCost, 0);
  const sortedMovements = [...inventoryMovements]
    .filter((movement) => matchesDateValue(movement.createdAt, movementDateFilter))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const movementPages = Math.max(1, Math.ceil(sortedMovements.length / PAGE_SIZE));
  const currentMovementPage = Math.min(movementPage, movementPages);
  const visibleMovements = sortedMovements.slice(
    (currentMovementPage - 1) * PAGE_SIZE,
    currentMovementPage * PAGE_SIZE,
  );
  const partPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPartPage = Math.min(partPage, partPages);
  const visibleParts = filtered.slice(
    (currentPartPage - 1) * PAGE_SIZE,
    currentPartPage * PAGE_SIZE,
  );
  const hasMovementDateFilter = Boolean(movementDateFilter.from || movementDateFilter.to);

  useEffect(() => {
    writeStoredList(INVENTORY_ITEMS_STORAGE_KEY, inventoryItems);
  }, [inventoryItems]);

  useEffect(() => {
    writeStoredList(INVENTORY_MOVEMENTS_STORAGE_KEY, inventoryMovements);
  }, [inventoryMovements]);

  function upsertPart(item: InventoryItem) {
    setInventoryItems((current) => {
      const exists = current.some((part) => part.id === item.id);
      return exists
        ? current.map((part) => (part.id === item.id ? item : part))
        : [item, ...current];
    });

    if (!editingPart) {
      setInventoryMovements((current) => [
        {
          id: `MOV-${Date.now().toString().slice(-5)}`,
          partId: item.id,
          partName: item.name,
          type: "supply",
          quantity: item.stock,
          owner: "إدارة المخزون",
          createdAt: new Date().toISOString().slice(0, 10),
          reference: "إضافة قطعة",
        },
        ...current,
      ]);
    }
  }

  function adjustQuantity(partId: string, movementType: InventoryMovement["type"], quantity: number) {
    const movementPart = inventoryItems.find((item) => item.id === partId);
    if (!movementPart) return;

    const movementLabel = INVENTORY_MOVEMENT_LABELS[movementType].label;

    setInventoryItems((current) =>
      current.map((item) => {
        if (item.id !== partId) return item;
        const nextStock = Math.max(0, item.stock + quantity);
        return {
          ...item,
          stock: nextStock,
          lastMove: movementLabel,
        };
      }),
    );

    setInventoryMovements((current) => [
      {
        id: `MOV-${Date.now().toString().slice(-5)}`,
        partId: movementPart.id,
        partName: movementPart.name,
        type: movementType,
        quantity,
        owner: "إدارة المخزون",
        createdAt: new Date().toISOString().slice(0, 10),
        reference: movementType === "supply" ? "تعديل كمية - توريد" : "تعديل كمية - تسوية",
      },
      ...current,
    ]);
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title={isMovement ? "حركة المخزون" : "قطع الغيار"}
        subtitle="إدارة مخزون قطع الصيانة، حدود النقص، ومتابعة الصرف والتوريد."
      />
      {showSupplyModal || editingPart ? (
        <PartFormModal
          initialPart={editingPart}
          onClose={() => {
            setShowSupplyModal(false);
            setEditingPart(null);
          }}
          onSave={upsertPart}
        />
      ) : null}
      {showQuantityModal ? (
        <QuantityAdjustmentModal
          items={inventoryItems}
          onClose={() => setShowQuantityModal(false)}
          onSave={adjustQuantity}
        />
      ) : null}
      {showMovementDateFilter ? (
        <DateFilterModal
          filter={movementDateFilter}
          onApply={(filter) => {
            setMovementDateFilter(filter);
            setMovementPage(1);
          }}
          onClose={() => setShowMovementDateFilter(false)}
        />
      ) : null}
      {partToDelete ? (
        <ConfirmToast
          title="تأكيد حذف القطعة"
          message={`هل تريد حذف القطعة ${partToDelete.name} من جدول قطع الغيار؟`}
          onCancel={() => setPartToDelete(null)}
          onConfirm={() => {
            setInventoryItems((current) => current.filter((item) => item.id !== partToDelete.id));
            setPartToDelete(null);
          }}
        />
      ) : null}

      <KpiCards
        cards={
          isMovement
            ? [
                { label: "إجمالي الحركات", value: String(inventoryMovements.length), icon: "clipboard" },
                {
                  label: "حركات التوريد",
                  value: String(inventoryMovements.filter((item) => item.type === "supply").length),
                  icon: "plus",
                  tone: "success",
                },
                {
                  label: "حركات الصرف",
                  value: String(inventoryMovements.filter((item) => item.type === "withdraw").length),
                  icon: "box",
                  tone: "gold",
                },
                {
                  label: "التسويات",
                  value: String(inventoryMovements.filter((item) => item.type === "adjustment").length),
                  icon: "clipboard",
                  tone: "info",
                },
              ]
            : [
                { label: "إجمالي القطع", value: String(inventoryItems.length), icon: "box" },
                { label: "تنبيهات نقص", value: String(lowStock.length), icon: "alert", tone: "danger" },
                {
                  label: "قيمة المخزون بالليرة",
                  value: formatMoney(inventoryValue, "SYP"),
                  icon: "wallet",
                },
                {
                  label: "قيمة المخزون بالدولار",
                  value: formatMoney(inventoryValue / USD_TO_SYP_RATE, "USD", { decimals: 2 }),
                  icon: "wallet",
                },
              ]
        }
      />

      {!isMovement ? (
        <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-center" dir="rtl">
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPartPage(1);
            }}
            placeholder="بحث باسم القطعة أو الكود"
            aria-label="بحث المخزون"
            className="md:flex-1"
          />
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            <Button type="button" className="shrink-0" onClick={() => setShowSupplyModal(true)}>
              <Icon name="plus" size={18} />
              إضافة قطعة
            </Button>
            <Button type="button" variant="outline" className="shrink-0" onClick={() => setShowQuantityModal(true)}>
              <Icon name="pencil" size={18} />
              تعديل الكمية
            </Button>
          </div>
        </Card>
      ) : null}

      {isMovement ? (
        <>
        <div className="flex justify-end">
          <Button
            type="button"
            variant={hasMovementDateFilter ? "primary" : "outline"}
            onClick={() => setShowMovementDateFilter(true)}
          >
            <Icon name="clock" size={18} />
            الفترة الزمنية
          </Button>
        </div>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full text-right text-sm">
              <thead>
                <tr className="bg-surface-2 text-content-muted">
                  {["رقم الحركة", "القطعة", "نوع الحركة", "الكمية", "المسؤول", "المرجع", "التاريخ"].map(
                    (header) => (
                      <th key={header} className="px-4 py-3 font-medium">
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {visibleMovements.map((movement) => (
                  <tr key={movement.id} className="border-b border-border last:border-0 hover:bg-gold-soft">
                    <td className="px-4 py-4 font-bold text-gold">{movement.id}</td>
                    <td className="px-4 py-4 text-content">
                      <div className="font-medium">{movement.partName}</div>
                      <div className="text-xs text-content-muted" dir="ltr">{movement.partId}</div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone={INVENTORY_MOVEMENT_LABELS[movement.type].tone} dot>
                        {INVENTORY_MOVEMENT_LABELS[movement.type].label}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-content-muted">{movement.quantity}</td>
                    <td className="px-4 py-4 text-content-muted">{movement.owner}</td>
                    <td className="px-4 py-4 text-content-muted">{movement.reference}</td>
                    <td className="px-4 py-4 text-content-muted">{movement.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={currentMovementPage}
            total={sortedMovements.length}
            pageSize={PAGE_SIZE}
            onPage={setMovementPage}
            itemLabel="حركة"
          />
        </Card>
        </>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[840px] w-full text-right text-sm">
              <thead>
                <tr className="bg-surface-2 text-content-muted">
                  {["الكود", "القطعة", "المتوفر", "الموقع", "القيمة بالليرة", "القيمة بالدولار", "الإجراءات"].map(
                    (header) => (
                      <th key={header} className="px-4 py-3 font-medium">
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {visibleParts.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0 hover:bg-gold-soft">
                    <td className="px-4 py-4 font-bold text-gold">{item.id}</td>
                    <td className="px-4 py-4 text-content">{item.name}</td>
                    <td className="px-4 py-4">
                      <Badge tone={item.stock <= item.minStock ? "danger" : "success"} dot>
                        {item.stock}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-content-muted">{item.location}</td>
                    <td className="px-4 py-4 text-content-muted">
                      {formatMoney(item.stock * item.unitCost, "SYP")}
                    </td>
                    <td className="px-4 py-4 text-content-muted">
                      {formatMoney((item.stock * item.unitCost) / USD_TO_SYP_RATE, "USD", { decimals: 2 })}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-start gap-2" dir="rtl">
                        <button
                          type="button"
                          aria-label={`تعديل ${item.id}`}
                          title="تعديل"
                          onClick={() => setEditingPart(item)}
                          className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2"
                        >
                          <Icon name="pencil" size={18} />
                        </button>
                        <button
                          type="button"
                          aria-label={`حذف ${item.id}`}
                          title="حذف"
                          onClick={() => setPartToDelete(item)}
                          className="rounded-sm p-1.5 text-danger hover:bg-danger-soft"
                        >
                          <Icon name="trash" size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={currentPartPage}
            total={filtered.length}
            pageSize={PAGE_SIZE}
            onPage={setPartPage}
            itemLabel="قطعة"
          />
        </Card>
      )}
    </div>
  );
}

function convertPaymentToInvoiceCurrency(
  amount: number,
  paymentCurrency: PaymentCurrency,
  invoiceCurrency: Currency,
) {
  if (paymentCurrency === invoiceCurrency) return amount;
  if (invoiceCurrency === "SYP") return amount * USD_TO_SYP_RATE;
  return amount / USD_TO_SYP_RATE;
}

function buildSimpleInvoicePdf(invoice: Invoice): Blob {
  const lines = [
    "Golden Control - Invoice",
    `Invoice: ${invoice.id}`,
    `Type: ${typeLabel(invoice.type)}`,
    `Status: ${PAYMENT_LABELS[invoice.status]}`,
    `Client: ${escapePdfText(invoice.client)}`,
    `Phone: ${invoice.clientPhone}`,
    `Technician: ${escapePdfText(invoice.technician)}`,
    `Total: ${formatMoney(invoice.total, invoice.currency)}`,
    `Paid: ${formatMoney(invoice.paid, invoice.currency)}`,
    `Remaining: ${formatMoney(remaining(invoice.total, invoice.paid), invoice.currency)}`,
    `Warranty: ${escapePdfText(invoice.warrantyDuration || "N/A")}`,
  ];
  const objects: string[] = [];
  const content =
    "BT /F1 14 Tf 50 780 Td " +
    lines.map((line, index) => `${index === 0 ? "" : "0 -24 Td "}(${escapePdfText(line)}) Tj`).join(" ") +
    " ET";

  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  objects.push("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>");
  objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

function downloadInvoicePdf(invoice: Invoice) {
  const url = URL.createObjectURL(buildSimpleInvoicePdf(invoice));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${invoice.id}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

function printInvoice(invoice: Invoice) {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return;

  const partsRows = invoice.parts
    .map(
      (part) => `
        <tr>
          <td>${part.name}</td>
          <td>${part.quantity}</td>
          <td>${formatMoney(part.unitPrice, invoice.currency)}</td>
          <td>${formatMoney(invoicePartTotal(part), invoice.currency)}</td>
        </tr>
      `,
    )
    .join("");

  printWindow.document.write(`
    <html dir="rtl" lang="ar">
      <head>
        <title>${invoice.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #1f1f1f; }
          h1 { color: #8a6b00; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .box { border: 1px solid #ddd; padding: 12px; border-radius: 6px; }
        </style>
      </head>
      <body>
        <h1>فاتورة ${invoice.id}</h1>
        <div class="grid">
          <div class="box">العميل: ${invoice.client}</div>
          <div class="box">الهاتف: ${invoice.clientPhone}</div>
          <div class="box">الفني: ${invoice.technician}</div>
          <div class="box">الحالة: ${PAYMENT_LABELS[invoice.status]}</div>
          <div class="box">الإجمالي: ${formatMoney(invoice.total, invoice.currency)}</div>
          <div class="box">المتبقي: ${formatMoney(remaining(invoice.total, invoice.paid), invoice.currency)}</div>
        </div>
        <table>
          <thead><tr><th>القطعة</th><th>الكمية</th><th>سعر القطعة</th><th>الإجمالي</th></tr></thead>
          <tbody>${partsRows}</tbody>
        </table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function InvoiceDetailsModal({
  invoice,
  order,
  onClose,
  onAddPayment,
  onReturnInvoice,
}: {
  invoice: Invoice;
  order?: Order;
  onClose: () => void;
  onAddPayment?: () => void;
  onReturnInvoice?: (invoice: Invoice) => void;
}) {
  const [paymentsPage, setPaymentsPage] = useState(1);
  const paymentPages = Math.max(1, Math.ceil(invoice.payments.length / PAGE_SIZE));
  const currentPaymentsPage = Math.min(paymentsPage, paymentPages);
  const visiblePayments = invoice.payments.slice(
    (currentPaymentsPage - 1) * PAGE_SIZE,
    currentPaymentsPage * PAGE_SIZE,
  );
  const canAddPayment = invoice.status !== "paid" && !invoice.returned;

  return (
    <Modal
      title={`تفاصيل الفاتورة ${invoice.id}`}
      description="معاينة كاملة للفاتورة والقطع والدفعات قبل الطباعة أو التحميل."
      onClose={onClose}
      widthClassName="max-w-6xl"
    >
      <div className="space-y-5 p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <DetailItem label="رقم الفاتورة" value={invoice.id} ltr />
          <DetailItem label="نوع الفاتورة" value={typeLabel(invoice.type)} />
          <DetailItem
            label="حالة الفاتورة"
            value={
              <div className="flex flex-wrap gap-2">
                <Badge tone={PAYMENT_TONE[invoice.status]} dot>
                  {PAYMENT_LABELS[invoice.status]}
                </Badge>
                {invoice.returned ? <Badge tone="danger">مرجعة</Badge> : null}
              </div>
            }
          />
        </div>

        <Card className="bg-surface-2 p-4 shadow-none">
          <h3 className="font-heading text-base font-bold text-content">بيانات العميل</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <DetailItem label="اسم العميل" value={invoice.client} />
            <DetailItem label="رقم 1" value={invoice.clientPhone} ltr />
            <DetailItem label="رقم 2" value={invoice.clientPhone2?.trim() || "لا يوجد"} ltr={Boolean(invoice.clientPhone2?.trim() && invoice.clientPhone2 !== "لا يوجد")} />
            <DetailItem label="العنوان" value={invoice.clientAddress || order?.address || "غير محدد"} />
          </div>
        </Card>

        <Card className="bg-surface-2 p-4 shadow-none">
          <h3 className="font-heading text-base font-bold text-content">بيانات الفني</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <DetailItem label="اسم الفني" value={invoice.technician} />
            <DetailItem label="رقم تلفونه" value={invoice.technicianPhone || getTechnicianPhone(invoice.technician)} ltr />
          </div>
        </Card>

        <Card className="overflow-hidden shadow-none">
          <div className="border-b border-border px-4 py-3">
            <h3 className="font-heading text-base font-bold text-content">القطع المستخدمة</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-right text-sm">
              <thead>
                <tr className="bg-surface-2 text-content-muted">
                  {["اسم القطعة", "الكمية", "سعر كل قطعة", "الإجمالي"].map((header) => (
                    <th key={header} className="px-4 py-3 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoice.parts.map((part) => (
                  <tr key={part.id} className="border-t border-border">
                    <td className="px-4 py-3 text-content">{part.name}</td>
                    <td className="px-4 py-3 text-content-muted">{part.quantity}</td>
                    <td className="px-4 py-3 text-content-muted">
                      {formatMoney(part.unitPrice, invoice.currency)}
                    </td>
                    <td className="px-4 py-3 font-bold text-gold">
                      {formatMoney(invoicePartTotal(part), invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {invoice.parts.length === 0 ? <EmptyState title="لا توجد قطع مستخدمة في هذه الفاتورة." /> : null}
        </Card>

        <div className="grid gap-3 md:grid-cols-4">
          <DetailItem label="الإجمالي" value={formatMoney(invoice.total, invoice.currency)} />
          <DetailItem label="المدفوع" value={formatMoney(invoice.paid, invoice.currency)} />
          <DetailItem label="المتبقي" value={formatMoney(remaining(invoice.total, invoice.paid), invoice.currency)} />
          <DetailItem label="نوع العملة" value={currencyLabel(invoice.currency)} />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <DetailItem label="قطع تحتاج سحب للمركز" value={invoice.centerPullItems?.trim() || "لا يوجد"} />
          <DetailItem label="ملاحظات" value={invoice.notes?.trim() || "لا يوجد"} />
          <DetailItem label="مدة الكفالة" value={invoice.warrantyDuration?.trim() || "غير محددة"} />
        </div>

        {order ? (
          <Card className="bg-surface-2 p-4 shadow-none">
            <h3 className="font-heading text-base font-bold text-content">معلومات الطلب المرتبط</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <DetailItem label="رقم الطلب" value={order.id} ltr />
              <DetailItem label="الجهاز" value={order.device} />
              <DetailItem label="حالة الطلب" value={ORDER_STATUS_LABELS[order.status]} />
              <DetailItem label="موعد الزيارة" value={order.visitDate} />
            </div>
          </Card>
        ) : null}

        <Card className="overflow-hidden shadow-none">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <h3 className="font-heading text-base font-bold text-content">سجل المدفوعات</h3>
            {canAddPayment && onAddPayment ? (
              <Button type="button" size="sm" onClick={onAddPayment}>
                <Icon name="plus" size={16} />
                إضافة دفعة
              </Button>
            ) : null}
          </div>
          {invoice.payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-[640px] w-full text-right text-sm">
                <thead>
                  <tr className="bg-surface-2 text-content-muted">
                    {["المبلغ المدفوع", "المبلغ بعد التحويل", "طريقة الدفع", "نوع العملة", "التاريخ"].map((header) => (
                      <th key={header} className="px-4 py-3 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visiblePayments.map((payment) => (
                    <tr key={payment.id} className="border-t border-border">
                      <td className="px-4 py-3 text-content-muted">
                        {formatMoney(payment.amount, payment.currency)}
                      </td>
                      <td className="px-4 py-3 font-bold text-gold">
                        {formatMoney(payment.convertedAmount ?? convertPaymentToInvoiceCurrency(payment.amount, payment.currency, invoice.currency), invoice.currency)}
                      </td>
                      <td className="px-4 py-3 text-content-muted">
                        {PAYMENT_METHOD_LABELS[payment.method]}
                      </td>
                      <td className="px-4 py-3 text-content-muted">
                        {payment.currency === "SYP" ? "ليرة" : "دولار"}
                      </td>
                      <td className="px-4 py-3 text-content-muted">{payment.paidAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="لا توجد دفعات مسجلة على هذه الفاتورة." />
          )}
          <TablePagination
            page={currentPaymentsPage}
            total={invoice.payments.length}
            pageSize={PAGE_SIZE}
            onPage={setPaymentsPage}
            itemLabel="دفعة"
          />
        </Card>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={() => printInvoice(invoice)}>
            <Icon name="file" size={18} />
            طباعة الفاتورة
          </Button>
          <Button type="button" variant="outline" onClick={() => downloadInvoicePdf(invoice)}>
            <Icon name="file" size={18} />
            تحميل PDF
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={invoice.returned}
            onClick={() => onReturnInvoice?.(invoice)}
          >
            <Icon name="arrow-left" size={18} />
            إرجاع الفاتورة
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function AddPaymentModal({
  invoice,
  onClose,
  onSave,
}: {
  invoice: Invoice;
  onClose: () => void;
  onSave: (payment: InvoicePayment, convertedAmount: number) => void;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [currency, setCurrency] = useState<PaymentCurrency>("SYP");
  const remainingBefore = remaining(invoice.total, invoice.paid);
  const numericAmount = Number(amount) || 0;
  const convertedAmount = convertPaymentToInvoiceCurrency(numericAmount, currency, invoice.currency);
  const remainingAfter = Math.max(0, remainingBefore - convertedAmount);

  function save() {
    onSave(
      {
        id: `PAY-${Date.now().toString().slice(-5)}`,
        amount: numericAmount,
        convertedAmount,
        currency,
        method,
        paidAt: new Date().toISOString().slice(0, 10),
      },
      convertedAmount,
    );
    onClose();
  }

  return (
    <Modal
      title="إضافة دفعة جديدة"
      description="تسجيل دفعة على الفاتورة مع حساب المتبقي بعد الدفع."
      onClose={onClose}
      widthClassName="max-w-2xl"
    >
      <div className="space-y-4 p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <DetailItem label="رقم الفاتورة" value={invoice.id} ltr />
          <DetailItem
            label="المبلغ المتبقي"
            value={formatMoney(remainingBefore, invoice.currency)}
          />
        </div>
        <div className="rounded-md border border-gold/30 bg-gold-soft p-3 text-sm text-content-muted">
          سعر صرف الدولار المستخدم مؤقتاً: {formatMoney(USD_TO_SYP_RATE, "SYP")} لكل 1 دولار. سيتم ربطه لاحقاً بمصدر API.
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="مبلغ الدفعة الجديدة">
            <Input
              type="number"
              min={0}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="طريقة الدفع">
            <Select value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod)}>
              <option value="cash">كاش</option>
              <option value="sham-cash">شام كاش</option>
            </Select>
          </Field>
          <Field label="نوع العملية">
            <Select value={currency} onChange={(event) => setCurrency(event.target.value as PaymentCurrency)}>
              <option value="SYP">ليرة</option>
              <option value="USD">دولار</option>
            </Select>
          </Field>
          <DetailItem
            label="المتبقي بعد الدفع"
            value={formatMoney(remainingAfter, invoice.currency)}
          />
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="button" onClick={save} disabled={numericAmount <= 0}>
            حفظ الدفعة
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function InvoiceFormModal({
  invoice,
  mode = "edit",
  onClose,
  onSave,
}: {
  invoice: Invoice;
  mode?: "create" | "edit";
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
}) {
  const [draft, setDraft] = useState<Invoice>(invoice);
  const [pendingInvoice, setPendingInvoice] = useState<Invoice | null>(null);
  const isCreate = mode === "create";
  const draftTotal = invoicePartsTotal(draft.parts) || Math.max(0, Number(draft.total) || 0);
  const draftPaid = Math.min(draftTotal, Math.max(0, Number(draft.paid) || 0));
  const draftRemaining = Math.max(0, draftTotal - draftPaid);

  function patchDraft(patch: Partial<Invoice>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function patchPaymentStatus(status: PaymentStatus) {
    const total = invoicePartsTotal(draft.parts) || Math.max(0, Number(draft.total) || 0);
    patchDraft({
      status,
      paid: status === "paid" ? total : status === "unpaid" ? 0 : Math.min(Number(draft.paid) || 0, total),
    });
  }

  function patchPaid(value: string) {
    const total = invoicePartsTotal(draft.parts) || Math.max(0, Number(draft.total) || 0);
    const paid = Math.min(total, Math.max(0, Number(value) || 0));
    patchDraft({
      paid,
      status: paid >= total && total > 0 ? "paid" : paid > 0 ? "partial" : "unpaid",
    });
  }

  function patchPart(index: number, patch: Partial<InvoicePart>) {
    setDraft((current) => ({
      ...current,
      parts: current.parts.map((part, currentIndex) =>
        currentIndex === index ? { ...part, ...patch } : part,
      ),
    }));
  }

  function addPart() {
    setDraft((current) => ({
      ...current,
      parts: [
        ...current.parts,
        {
          id: `PRT-${Date.now().toString().slice(-4)}`,
          name: "",
          quantity: 1,
          unitPrice: 0,
        },
      ],
    }));
  }

  function removePart(index: number) {
    setDraft((current) => ({
      ...current,
      parts: current.parts.filter((_, currentIndex) => currentIndex !== index),
    }));
  }

  function stepPartQuantity(index: number, step: number) {
    const currentQuantity = Math.max(1, Number(draft.parts[index]?.quantity) || 1);
    patchPart(index, { quantity: Math.max(1, currentQuantity + step) });
  }

  function buildInvoice(): Invoice {
    const parts = draft.parts.map((part, index) => ({
      ...part,
      id: part.id || `PRT-${index + 1}`,
      name: part.name || "قطعة غير محددة",
      quantity: Math.max(1, Number(part.quantity) || 1),
      unitPrice: Math.max(0, Number(part.unitPrice) || 0),
    }));
    const partsTotal = invoicePartsTotal(parts);
    const total = partsTotal > 0 ? partsTotal : Math.max(0, Number(draft.total) || 0);
    const paid = Math.min(total, Math.max(0, Number(draft.paid) || 0));
    const nextStatus: PaymentStatus =
      paid >= total && total > 0 ? "paid" : paid > 0 ? "partial" : draft.status === "paid" ? "partial" : draft.status;
    const payments =
      !isCreate && draft.payments.length > 0
        ? draft.payments
        : paid > 0
          ? [
              {
                id: `PAY-${Date.now().toString().slice(-5)}`,
                amount: paid,
                convertedAmount: paid,
                currency: draft.currency,
                method: draft.paymentMethod,
                paidAt: draft.issuedAt || new Date().toISOString().slice(0, 10),
              },
            ]
          : [];

    return {
      ...draft,
      client: draft.client || "عميل غير محدد",
      clientPhone: draft.clientPhone || "غير محدد",
      clientPhone2: draft.clientPhone2 || "لا يوجد",
      clientAddress: draft.clientAddress || "غير محدد",
      technician: draft.technician || "غير محدد",
      technicianPhone: draft.technicianPhone || getTechnicianPhone(draft.technician),
      total,
      paid,
      status: nextStatus,
      issuedAt: draft.issuedAt || new Date().toISOString().slice(0, 10),
      warrantyDuration: draft.warrantyDuration || "غير محددة",
      centerPullItems: draft.centerPullItems ?? "",
      notes: draft.notes ?? "",
      parts,
      payments,
    };
  }

  return (
    <>
      <Modal
        title={isCreate ? "إنشاء فاتورة" : `تعديل الفاتورة ${invoice.id}`}
        description={isCreate ? "إنشاء فاتورة مرتبطة بالطلب مع القطع، المبالغ، الدفع، والكفالة." : "تعديل بيانات الفاتورة والقطع والدفعات الأساسية."}
        onClose={onClose}
        widthClassName="max-w-6xl"
      >
        <form className="space-y-5 p-5" onSubmit={(event) => event.preventDefault()}>
          <Card className="bg-surface-2 p-4 shadow-none">
            <div className="grid gap-3 md:grid-cols-4">
              <DetailItem label="رقم الفاتورة" value={draft.id} ltr />
              <DetailItem label="رقم الطلب" value={draft.orderId} ltr />
              <DetailItem label="نوع الفاتورة" value={typeLabel(draft.type)} />
              <DetailItem label="تاريخ الإصدار" value={draft.issuedAt} />
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="اسم العميل">
              <Input value={draft.client} onChange={(event) => patchDraft({ client: event.target.value })} placeholder="اسم العميل" />
            </Field>
            <Field label="رقم 1">
              <Input value={draft.clientPhone} onChange={(event) => patchDraft({ clientPhone: event.target.value })} dir="ltr" placeholder="09xx xxx xxx" />
            </Field>
            <Field label="رقم 2">
              <Input value={draft.clientPhone2 ?? ""} onChange={(event) => patchDraft({ clientPhone2: event.target.value })} dir="ltr" placeholder="اختياري" />
            </Field>
            <Field label="العنوان">
              <Input value={draft.clientAddress ?? ""} onChange={(event) => patchDraft({ clientAddress: event.target.value })} placeholder="عنوان العميل" />
            </Field>
            <Field label="اسم الفني">
              <Select
                value={draft.technician}
                onChange={(event) => {
                  const technician = event.target.value;
                  patchDraft({ technician, technicianPhone: getTechnicianPhone(technician) });
                }}
              >
                {TECHNICIANS.map((tech) => (
                  <option key={tech.id} value={tech.name}>
                    {tech.name}
                  </option>
                ))}
                <option value="غير محدد">غير محدد</option>
              </Select>
            </Field>
            <Field label="رقم تلفون الفني">
              <Input value={draft.technicianPhone ?? ""} onChange={(event) => patchDraft({ technicianPhone: event.target.value })} dir="ltr" placeholder="رقم الفني" />
            </Field>
          </div>

          <div className="space-y-3">
            <h3 className="font-heading text-base font-bold text-gold">حالة الفاتورة</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {([
                ["paid", "مدفوعة بالكامل"],
                ["partial", "مدفوعة جزئياً"],
                ["unpaid", "غير مدفوعة"],
              ] as Array<[PaymentStatus, string]>).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => patchPaymentStatus(value)}
                  className={cn(
                    "rounded-md border px-4 py-3 text-center font-heading text-base font-bold transition",
                    draft.status === value
                      ? "border-gold bg-gold-soft text-gold-active"
                      : "border-border bg-surface text-content-muted hover:bg-gold-soft hover:text-gold",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Card className="overflow-hidden shadow-none">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h3 className="font-heading text-base font-bold text-gold">قطع الغيار المستخدمة</h3>
              <Button type="button" variant="outline" size="sm" onClick={addPart}>
                <Icon name="plus" size={16} />
                إضافة قطعة
              </Button>
            </div>
            <div className="space-y-3 p-4">
              {draft.parts.map((part, index) => (
                <div key={`${part.id}-${index}`} className="rounded-md border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Field label="اسم القطعة" className="flex-1">
                      <Input value={part.name} onChange={(event) => patchPart(index, { name: event.target.value })} placeholder="اسم القطعة" />
                    </Field>
                    <Button type="button" variant="danger" size="sm" onClick={() => removePart(index)} disabled={draft.parts.length <= 1}>
                      <Icon name="trash" size={16} />
                    </Button>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-end">
                    <Field label="السعر لكل قطعة حسب العملة">
                      <Input
                        value={String(part.unitPrice)}
                        onChange={(event) => patchPart(index, { unitPrice: Number(event.target.value) })}
                        type="number"
                        min={0}
                        step="0.01"
                        dir="ltr"
                        placeholder={draft.currency === "USD" ? "دولار" : "ليرة سورية"}
                      />
                    </Field>
                    <div>
                      <div className="mb-1.5 text-sm text-content-muted">الكمية</div>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" className="h-9 w-9 px-0" onClick={() => stepPartQuantity(index, 1)}>
                          +
                        </Button>
                        <span className="min-w-8 text-center font-heading text-lg font-bold text-content">{part.quantity}</span>
                        <Button type="button" variant="outline" size="sm" className="h-9 w-9 px-0" onClick={() => stepPartQuantity(index, -1)}>
                          -
                        </Button>
                      </div>
                    </div>
                    <DetailItem label="إجمالي القطعة" value={formatMoney(invoicePartTotal(part), draft.currency)} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <p className="text-sm font-medium text-content-muted">
            **ملاحظة سعر الصرف الحالي لكل 1 دولار = {formatMoney(USD_TO_SYP_RATE, "SYP")}
          </p>

          <Card className="space-y-4 p-4 shadow-none">
            <h3 className="font-heading text-base font-bold text-gold">تفاصيل المبالغ</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <DetailItem label="المبلغ الكلي" value={formatMoney(draftTotal, draft.currency)} />
              <Field label="المبلغ المدفوع">
                <Input value={String(draftPaid)} onChange={(event) => patchPaid(event.target.value)} type="number" min={0} placeholder="0.00" dir="ltr" />
              </Field>
              <DetailItem label="المبلغ المتبقي" value={formatMoney(draftRemaining, draft.currency)} />
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="نوع الدفع">
              <div className="grid grid-cols-2 gap-2">
                {([
                  ["cash", "كاش"],
                  ["sham-cash", "شام كاش"],
                ] as Array<[PaymentMethod, string]>).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => patchDraft({ paymentMethod: value })}
                    className={cn(
                      "rounded-md border px-4 py-3 font-heading font-bold transition",
                      draft.paymentMethod === value
                        ? "border-gold bg-gold-soft text-gold-active"
                        : "border-border bg-surface text-content-muted hover:bg-gold-soft hover:text-gold",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="نوع العملة">
              <div className="grid grid-cols-2 gap-2">
                {([
                  ["USD", "دولار"],
                  ["SYP", "ليرة سورية"],
                ] as Array<[Currency, string]>).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => patchDraft({ currency: value })}
                    className={cn(
                      "rounded-md border px-4 py-3 font-heading font-bold transition",
                      draft.currency === value
                        ? "border-gold bg-gold-soft text-gold-active"
                        : "border-border bg-surface text-content-muted hover:bg-gold-soft hover:text-gold",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="مدة الكفالة" className="md:col-span-2">
              <Input value={draft.warrantyDuration ?? ""} onChange={(event) => patchDraft({ warrantyDuration: event.target.value })} placeholder="مثال: 6 أشهر" />
            </Field>
            <Field label="الأجهزة أو القطع التي تحتاج صيانة في المركز (اختياري)" className="md:col-span-2">
              <Textarea value={draft.centerPullItems ?? ""} onChange={(event) => patchDraft({ centerPullItems: event.target.value })} className="min-h-24" placeholder="اكتب أي ملاحظات تتعلق بالأجهزة والقطع التي تم سحبها إلى المركز هنا..." />
            </Field>
            <Field label="ملاحظات إضافية (اختياري)" className="md:col-span-2">
              <Textarea value={draft.notes ?? ""} onChange={(event) => patchDraft({ notes: event.target.value })} className="min-h-24" placeholder="اكتب أي ملاحظات تتعلق بالصيانة هنا..." />
            </Field>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="button" onClick={() => setPendingInvoice(buildInvoice())}>
              <Icon name={isCreate ? "plus" : "pencil"} size={18} />
              {isCreate ? "إنشاء وإرسال الفاتورة" : "حفظ التعديل"}
            </Button>
          </div>
        </form>
      </Modal>
      {pendingInvoice ? (
        <ConfirmToast
          title={isCreate ? "تأكيد إنشاء الفاتورة" : "تأكيد تعديل الفاتورة"}
          message={isCreate ? `هل تريد إنشاء الفاتورة ${pendingInvoice.id} ومعاينتها؟` : `هل تريد حفظ التعديلات على الفاتورة ${pendingInvoice.id}؟`}
          tone="gold"
          confirmLabel={isCreate ? "إنشاء الفاتورة" : "تأكيد التعديل"}
          onCancel={() => setPendingInvoice(null)}
          onConfirm={() => {
            onSave(pendingInvoice);
            onClose();
          }}
        />
      ) : null}
    </>
  );
}

export function InvoicesScreen() {
  const params = useSearchParams();
  const initialType = params.get("type") as InvoiceType | null;
  const initialCurrency = params.get("currency")?.toUpperCase() as Currency | undefined;
  const [invoices, setInvoices] = useState<Invoice[]>(readStoredInvoices);
  const [type, setType] = useState<InvoiceType | "all">(initialType ?? "all");
  const [currency, setCurrency] = useState<Currency | "all">(initialCurrency ?? "all");
  const [status, setStatus] = useState<PaymentStatus | "all">("all");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "all">("all");
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>({ from: "", to: "" });
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [page, setPage] = useState(1);

  const filtered = invoices.filter((invoice) => {
    const byType = type === "all" || invoice.type === type;
    const byCurrency = currency === "all" || invoice.currency === currency;
    const byStatus = status === "all" || invoice.status === status;
    const byPaymentMethod = paymentMethod === "all" || invoice.paymentMethod === paymentMethod;
    const byQuery =
      !query ||
      contains(invoice.id, query) ||
      contains(invoice.clientPhone, query);
    const byDate = matchesDateValue(invoice.issuedAt, dateFilter);
    return byType && byCurrency && byStatus && byPaymentMethod && byQuery && byDate;
  });

  const total = filtered.reduce((sum, invoice) => sum + invoice.total, 0);
  const paid = filtered.reduce((sum, invoice) => sum + invoice.paid, 0);
  const completedInvoices = invoices.filter((invoice) => invoice.status === "paid").length;
  const incompletedInvoices = invoices.filter((invoice) => invoice.status !== "paid").length;
  const hasDateFilter = Boolean(dateFilter.from || dateFilter.to);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visibleInvoices = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function savePayment(payment: InvoicePayment, convertedAmount: number) {
    if (!paymentInvoice) return;
    setInvoices((current) =>
      current.map((invoice) => {
        if (invoice.id !== paymentInvoice.id) return invoice;
        const nextPaid = Math.min(invoice.total, invoice.paid + convertedAmount);
        const nextStatus: PaymentStatus =
          nextPaid >= invoice.total ? "paid" : nextPaid > 0 ? "partial" : "unpaid";
        return {
          ...invoice,
          paid: nextPaid,
          status: nextStatus,
          paymentMethod: payment.method,
          payments: [payment, ...invoice.payments],
        };
      }),
    );
    setViewingInvoice((current) =>
      current?.id === paymentInvoice.id
        ? {
            ...current,
            paid: Math.min(current.total, current.paid + convertedAmount),
            status:
              Math.min(current.total, current.paid + convertedAmount) >= current.total
                ? "paid"
                : "partial",
            paymentMethod: payment.method,
            payments: [payment, ...current.payments],
          }
        : current,
    );
  }

  function saveInvoice(nextInvoice: Invoice) {
    setInvoices((current) =>
      current.some((invoice) => invoice.id === nextInvoice.id)
        ? current.map((invoice) => (invoice.id === nextInvoice.id ? nextInvoice : invoice))
        : [nextInvoice, ...current],
    );
    setViewingInvoice((current) => (current?.id === nextInvoice.id ? nextInvoice : current));
    setPaymentInvoice((current) => (current?.id === nextInvoice.id ? nextInvoice : current));
  }

  function returnInvoice(invoiceToReturn: Invoice) {
    const returnedInvoice = { ...invoiceToReturn, returned: true };
    setInvoices((current) =>
      current.map((invoice) => (invoice.id === returnedInvoice.id ? returnedInvoice : invoice)),
    );
    setViewingInvoice(returnedInvoice);
    setPaymentInvoice((current) => (current?.id === returnedInvoice.id ? returnedInvoice : current));
  }

  useEffect(() => {
    writeStoredList(INVOICES_STORAGE_KEY, invoices);
  }, [invoices]);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="إدارة الفواتير"
        subtitle="مراجعة الفواتير المرتبطة بالطلبات، الدفعات، المتبقي، وتجهيز الطباعة."
      />
      {showDateFilter ? (
        <DateFilterModal
          filter={dateFilter}
          onApply={(filter) => {
            setDateFilter(filter);
            setPage(1);
          }}
          onClose={() => setShowDateFilter(false)}
        />
      ) : null}
      {viewingInvoice ? (
        <InvoiceDetailsModal
          invoice={viewingInvoice}
          order={ORDERS.find((order) => order.id === viewingInvoice.orderId)}
          onClose={() => setViewingInvoice(null)}
          onAddPayment={() => setPaymentInvoice(viewingInvoice)}
          onReturnInvoice={returnInvoice}
        />
      ) : null}
      {editingInvoice ? (
        <InvoiceFormModal
          invoice={editingInvoice}
          onClose={() => setEditingInvoice(null)}
          onSave={saveInvoice}
        />
      ) : null}
      {paymentInvoice ? (
        <AddPaymentModal
          invoice={paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          onSave={savePayment}
        />
      ) : null}
      <KpiCards
        cards={[
          { label: "عدد الفواتير المكتملة", value: String(completedInvoices), icon: "file" },
          { label: "عدد الفواتير غير المكتملة", value: String(incompletedInvoices), icon: "alert", tone: "gold" },
          { label: "المدفوع", value: formatMoney(paid), icon: "wallet", tone: "success" },
          { label: "المتبقي", value: formatMoney(total - paid), icon: "clock", tone: "gold" },
        ]}
      />
      <FilterCard className="lg:grid-cols-[minmax(320px,2fr)_repeat(4,minmax(120px,1fr))_auto]">
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder="بحث برقم الفاتورة أو هاتف العميل"
          aria-label="بحث الفواتير"
        />
        <Select value={type} onChange={(event) => { setType(event.target.value as InvoiceType | "all"); setPage(1); }}>
          <option value="all">كل الفواتير</option>
          <option value="external">فواتير خارجية</option>
          <option value="internal">فواتير داخلية</option>
        </Select>
        <Select value={currency} onChange={(event) => { setCurrency(event.target.value as Currency | "all"); setPage(1); }}>
          <option value="all">كل العملات</option>
          <option value="SYP">ليرة سورية</option>
          <option value="USD">دولار</option>
        </Select>
        <Select value={status} onChange={(event) => { setStatus(event.target.value as PaymentStatus | "all"); setPage(1); }}>
          <option value="all">كل الحالات</option>
          <option value="paid">مدفوعة بالكامل</option>
          <option value="partial">مدفوعة جزئياً</option>
        </Select>
        <Select value={paymentMethod} onChange={(event) => { setPaymentMethod(event.target.value as PaymentMethod | "all"); setPage(1); }}>
          <option value="all">كل طرق الدفع</option>
          <option value="cash">كاش</option>
          <option value="sham-cash">شام كاش</option>
        </Select>
        <Button
          type="button"
          variant={hasDateFilter ? "primary" : "outline"}
          className="whitespace-nowrap"
          onClick={() => setShowDateFilter(true)}
        >
          <Icon name="clock" size={18} />
          الفترة الزمنية
        </Button>
      </FilterCard>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1020px] w-full text-right text-sm">
            <thead>
              <tr className="bg-surface-2 text-content-muted">
                {["رقم الفاتورة", "الطلب", "العميل", "الفني", "النوع", "العملة", "الحالة", "الإجمالي", "المتبقي", "إجراءات"].map(
                  (header) => (
                    <th key={header} className="px-4 py-3 font-medium">
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {visibleInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-border last:border-0 hover:bg-gold-soft">
                  <td className="px-4 py-4 font-bold text-gold">{invoice.id}</td>
                  <td className="px-4 py-4 text-content-muted">{invoice.orderId}</td>
                  <td className="px-4 py-4 text-content">
                    <div className="font-medium">{invoice.client}</div>
                    <div className="text-xs text-content-muted" dir="ltr">
                      {invoice.clientPhone}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-content-muted">{invoice.technician}</td>
                  <td className="px-4 py-4">
                    <Badge tone="neutral">{typeLabel(invoice.type)}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    <Badge tone={invoice.currency === "SYP" ? "gold" : "info"}>
                      {currencyLabel(invoice.currency)}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <Badge tone={PAYMENT_TONE[invoice.status]} dot>
                      {PAYMENT_LABELS[invoice.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-content-muted">
                    {formatMoney(invoice.total, invoice.currency)}
                  </td>
                  <td className="px-4 py-4 text-content-muted">
                    {formatMoney(remaining(invoice.total, invoice.paid), invoice.currency)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-start gap-2" dir="rtl">
                      <button
                        type="button"
                        aria-label={`تفاصيل ${invoice.id}`}
                        title="تفاصيل الفاتورة"
                        onClick={() => setViewingInvoice(invoice)}
                        className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2"
                      >
                        <Icon name="eye" size={18} />
                      </button>
                      <button
                        type="button"
                        aria-label={`تعديل ${invoice.id}`}
                        title="تعديل الفاتورة"
                        onClick={() => setEditingInvoice(invoice)}
                        className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2"
                      >
                        <Icon name="pencil" size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={currentPage}
          total={filtered.length}
          pageSize={PAGE_SIZE}
          onPage={setPage}
          itemLabel="فاتورة"
        />
      </Card>
    </div>
  );
}

function financeTitle(section?: string[]) {
  const key = section?.join("/") ?? "";
  if (key.includes("expenses/fixed")) return "المصروفات الثابتة";
  if (key.includes("expenses/variable")) return "المصروفات المتغيرة";
  if (key.includes("sales")) return "المبيعات";
  if (key.includes("profits")) return "الأرباح";
  if (key.includes("reports/maintenance")) return "تقارير الصيانة";
  if (key.includes("reports/technicians")) return "تقارير الفنيين";
  if (key.includes("reports/financial")) return "التقارير المالية";
  return "الإدارة المالية";
}

export function FinanceScreen({ section }: { section?: string[] }) {
  const title = financeTitle(section);
  const sales = FINANCE_RECORDS.filter((record) => record.category === "sales");
  const expenses = FINANCE_RECORDS.filter((record) => record.category !== "sales");
  const salesTotal = sales.reduce((sum, record) => sum + record.amount, 0);
  const expensesTotal = expenses.reduce((sum, record) => sum + record.amount, 0);
  const profit = salesTotal - expensesTotal;
  const isReport = section?.[0] === "reports";
  const [page, setPage] = useState(1);

  const records = useMemo(() => {
    const key = section?.join("/") ?? "";
    if (key.includes("fixed")) return FINANCE_RECORDS.filter((record) => record.category === "fixed");
    if (key.includes("variable")) return FINANCE_RECORDS.filter((record) => record.category === "variable");
    if (key.includes("sales")) return sales;
    return FINANCE_RECORDS;
  }, [sales, section]);
  const pages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visibleRecords = records.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="space-y-6">
      <SectionTitle
        title={title}
        subtitle="مراقبة التدفقات المالية، المصروفات، المبيعات، وصافي الأرباح."
      />
      <KpiCards
        cards={[
          { label: "المبيعات", value: formatMoney(salesTotal), icon: "chart", tone: "success" },
          { label: "المصروفات", value: formatMoney(expensesTotal), icon: "wallet", tone: "gold" },
          { label: "صافي الربح", value: formatMoney(profit), icon: "shield", tone: profit >= 0 ? "success" : "danger" },
          { label: "الفواتير المفتوحة", value: "3", icon: "file", tone: "info" },
        ]}
      />

      {isReport ? (
        <Card className="p-5">
          <div className="mb-5 text-right">
            <h3 className="font-heading text-lg font-bold text-content">{title}</h3>
            <p className="text-sm text-content-muted">
              ملخص بصري سريع للاتجاهات الشهرية مع مؤشرات قابلة للاستبدال لاحقًا برسوم بيانية حقيقية.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-6" dir="ltr">
            {["h-[54%]", "h-[72%]", "h-[64%]", "h-[88%]", "h-[76%]", "h-[94%]"].map((heightClass, index) => (
              <div key={heightClass} className="flex h-44 flex-col justify-end rounded-md bg-surface-2 p-3">
                <div
                  className={`rounded-sm bg-gold ${heightClass}`}
                  title={`الشهر ${index + 1}`}
                />
                <span className="mt-2 text-center text-xs text-content-muted">{index + 1}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-right text-sm">
              <thead>
                <tr className="bg-surface-2 text-content-muted">
                  {["الرقم", "البند", "التصنيف", "المسؤول", "التاريخ", "المبلغ"].map((header) => (
                    <th key={header} className="px-4 py-3 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRecords.map((record) => (
                  <tr key={record.id} className="border-b border-border last:border-0 hover:bg-gold-soft">
                    <td className="px-4 py-4 font-bold text-gold">{record.id}</td>
                    <td className="px-4 py-4 text-content">{record.title}</td>
                    <td className="px-4 py-4">
                      <Badge tone={record.category === "sales" ? "success" : "gold"}>
                        {record.category === "sales"
                          ? "مبيعات"
                          : record.category === "fixed"
                            ? "ثابت"
                            : "متغير"}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-content-muted">{record.owner}</td>
                    <td className="px-4 py-4 text-content-muted">{record.date}</td>
                    <td className="px-4 py-4 text-content-muted">
                      {formatMoney(record.amount, record.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={currentPage}
            total={records.length}
            pageSize={PAGE_SIZE}
            onPage={setPage}
            itemLabel="سجل"
          />
        </Card>
      )}
    </div>
  );
}

export function TechnicianPerformanceScreen() {
  return (
    <div className="space-y-6">
      <SectionTitle
        title="أداء الفنيين"
        subtitle="تتبع الإنجاز، الطلبات النشطة، التأخير، رضا العملاء، والعائد لكل فني."
      />
      <KpiCards
        cards={[
          {
            label: "الطلبات المكتملة",
            value: String(TECHNICIANS.reduce((sum, tech) => sum + tech.completed, 0)),
            icon: "shield",
            tone: "success",
          },
          {
            label: "طلبات نشطة",
            value: String(TECHNICIANS.reduce((sum, tech) => sum + tech.active, 0)),
            icon: "clipboard",
            tone: "info",
          },
          {
            label: "متوسط الرضا",
            value: `${Math.round(TECHNICIANS.reduce((sum, tech) => sum + tech.satisfaction, 0) / TECHNICIANS.length)}%`,
            icon: "chart",
          },
          {
            label: "العائد",
            value: formatMoney(TECHNICIANS.reduce((sum, tech) => sum + tech.revenue, 0)),
            icon: "wallet",
          },
        ]}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {TECHNICIANS.map((tech) => (
          <Card key={tech.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="text-right">
                <h3 className="font-heading text-lg font-bold text-content">{tech.name}</h3>
                <p className="text-sm text-content-muted">{tech.id}</p>
              </div>
              <Badge tone={tech.status === "available" ? "success" : tech.status === "busy" ? "gold" : "neutral"} dot>
                {tech.status === "available" ? "متاح" : tech.status === "busy" ? "مشغول" : "مجاز"}
              </Badge>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-md bg-surface-2 p-3">
                <p className="text-xs text-content-muted">مكتملة</p>
                <p className="font-heading text-xl font-bold text-content">{tech.completed}</p>
              </div>
              <div className="rounded-md bg-surface-2 p-3">
                <p className="text-xs text-content-muted">نشطة</p>
                <p className="font-heading text-xl font-bold text-content">{tech.active}</p>
              </div>
              <div className="rounded-md bg-surface-2 p-3">
                <p className="text-xs text-content-muted">تأخير</p>
                <p className="font-heading text-xl font-bold text-content">{tech.delayed}</p>
              </div>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-xs text-content-muted">
                <span>رضا العملاء</span>
                <span>{tech.satisfaction}%</span>
              </div>
              <ProgressBar value={tech.satisfaction} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function SettingsCenterScreen() {
  const [centerName, setCenterName] = useState("مركز الصيانة الذهبي");
  const [secondaryName, setSecondaryName] = useState("Golden Maintenance Center");
  const [address, setAddress] = useState("دمشق - شارع بغداد");
  const [phone, setPhone] = useState("011 555 2200");
  const [email, setEmail] = useState("info@golden-control.com");
  const [term1, setTerm1] = useState("الكفالة لا تشمل سوء الاستخدام أو أعطال الكهرباء الخارجية.");
  const [term2, setTerm2] = useState("");
  const [term3, setTerm3] = useState("");
  const [term4, setTerm4] = useState("");
  const [logoName, setLogoName] = useState("");

  return (
    <div className="space-y-6">
      <SectionTitle
        title="إدارة بيانات المركز"
        subtitle="تحديث بيانات المركز التي تظهر على الفواتير، الطلبات، والمستندات الرسمية."
      />
      <Card className="overflow-hidden">
        <CardHeader>
          <h3 className="text-right font-heading text-lg font-bold text-content">
            بيانات المركز
          </h3>
        </CardHeader>
        <form className="grid gap-4 p-4 md:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
          <Field label="اسم المركز">
            <Input value={centerName} onChange={(event) => setCenterName(event.target.value)} placeholder="اسم المركز" />
          </Field>
          <Field label="الاسم الثانوي">
            <Input value={secondaryName} onChange={(event) => setSecondaryName(event.target.value)} placeholder="الاسم الثانوي" />
          </Field>
          <Field label="العنوان" className="md:col-span-2">
            <Input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="عنوان المركز" />
          </Field>
          <Field label="رقم الهاتف">
            <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="رقم الهاتف" dir="ltr" />
          </Field>
          <Field label="البريد الإلكتروني">
            <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="البريد الإلكتروني" dir="ltr" type="email" />
          </Field>
          <Field label="البند 1 - اختياري" className="md:col-span-2">
            <Textarea value={term1} onChange={(event) => setTerm1(event.target.value)} className="min-h-20" placeholder="اكتب البند الأول" />
          </Field>
          <Field label="البند 2 - اختياري" className="md:col-span-2">
            <Textarea value={term2} onChange={(event) => setTerm2(event.target.value)} className="min-h-20" placeholder="اكتب البند الثاني" />
          </Field>
          <Field label="البند 3 - اختياري" className="md:col-span-2">
            <Textarea value={term3} onChange={(event) => setTerm3(event.target.value)} className="min-h-20" placeholder="اكتب البند الثالث" />
          </Field>
          <Field label="البند 4 - اختياري" className="md:col-span-2">
            <Textarea value={term4} onChange={(event) => setTerm4(event.target.value)} className="min-h-20" placeholder="اكتب البند الرابع" />
          </Field>
          <Field label="اللوجو - اختياري" className="md:col-span-2">
            <div className="grid gap-3 rounded-md border border-border bg-surface-2 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <Input
                type="file"
                accept="image/*"
                className="bg-surface"
                onChange={(event) => setLogoName(event.target.files?.[0]?.name ?? "")}
              />
              <span className="text-sm text-content-muted">
                {logoName || "لم يتم اختيار لوجو"}
              </span>
            </div>
          </Field>
          <div className="flex justify-end md:col-span-2">
            <Button type="button">حفظ بيانات المركز</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function ExchangeRateSettingsScreen() {
  const [exchangeRate, setExchangeRate] = useState("14500");
  const [updatedAt, setUpdatedAt] = useState("لم يتم التحديث بعد");

  function updateExchangeRate() {
    const now = new Intl.DateTimeFormat("ar-u-nu-latn", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date());
    setUpdatedAt(now);
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="سعر الصرف"
        subtitle="تحديد سعر صرف الدولار مقابل الليرة السورية لاستخدامه في الدفعات والتحويلات المالية."
      />
      <Card className="overflow-hidden">
        <CardHeader>
          <h3 className="text-right font-heading text-lg font-bold text-content">
            تحديث سعر الصرف
          </h3>
        </CardHeader>
        <form className="grid gap-4 p-4 md:grid-cols-[minmax(240px,1fr)_auto]" onSubmit={(event) => event.preventDefault()}>
          <Field label="سعر صرف الدولار مقابل الليرة السورية">
            <Input
              value={exchangeRate}
              onChange={(event) => setExchangeRate(event.target.value)}
              placeholder="مثال: 14500"
              dir="ltr"
              inputMode="numeric"
            />
          </Field>
          <div className="flex items-end">
            <Button type="button" className="w-full md:w-auto" onClick={updateExchangeRate}>
              <Icon name="exchange" size={18} />
              تحديث سعر الصرف
            </Button>
          </div>
        </form>
        <div className="grid gap-3 border-t border-border bg-surface-2 p-4 md:grid-cols-2">
          <DetailItem label="السعر الحالي" value={`${exchangeRate || "0"} ل.س`} ltr />
          <DetailItem label="آخر تحديث" value={updatedAt} />
        </div>
      </Card>
    </div>
  );
}
