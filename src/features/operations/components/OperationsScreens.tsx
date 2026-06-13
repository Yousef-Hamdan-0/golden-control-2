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
  total: number;
  paid: number;
}

interface DeviceDraft {
  type: string;
  name: string;
  brand: string;
  model: string;
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
  currency: PaymentCurrency;
  method: PaymentMethod;
  paidAt: string;
}

export interface Invoice {
  id: string;
  orderId: string;
  type: InvoiceType;
  client: string;
  clientPhone: string;
  technician: string;
  status: PaymentStatus;
  currency: Currency;
  paymentMethod: PaymentMethod;
  total: number;
  paid: number;
  issuedAt: string;
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
  incompleted: "غير مكتمل",
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
  incompleted: "danger",
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
    technician: "رامي سمير",
    status: "partial",
    currency: "SYP",
    paymentMethod: "cash",
    total: 950000,
    paid: 450000,
    issuedAt: "2026-06-11",
    payments: [
      { id: "PAY-721", amount: 450000, currency: "SYP", method: "cash", paidAt: "2026-06-11" },
    ],
  },
  {
    id: "INV-9020",
    orderId: "ORD-5541",
    type: "external",
    client: "سارة القحطاني",
    clientPhone: "0944 772 118",
    technician: "رامي سمير",
    status: "paid",
    currency: "SYP",
    paymentMethod: "sham-cash",
    total: 680000,
    paid: 680000,
    issuedAt: "2026-06-10",
    payments: [
      { id: "PAY-720", amount: 300000, currency: "SYP", method: "sham-cash", paidAt: "2026-06-10" },
      { id: "PAY-719", amount: 380000, currency: "SYP", method: "sham-cash", paidAt: "2026-06-10" },
    ],
  },
  {
    id: "INV-9019",
    orderId: "ORD-5540",
    type: "internal",
    client: "مركز الصفاء التجاري",
    clientPhone: "011 442 0911",
    technician: "هاني خالد",
    status: "partial",
    currency: "USD",
    paymentMethod: "cash",
    total: 125,
    paid: 60,
    issuedAt: "2026-06-10",
    payments: [
      { id: "PAY-718", amount: 60, currency: "USD", method: "cash", paidAt: "2026-06-10" },
    ],
  },
  {
    id: "INV-9018",
    orderId: "ORD-5538",
    type: "internal",
    client: "شركة الربيع",
    clientPhone: "011 889 2020",
    technician: "هاني خالد",
    status: "unpaid",
    currency: "SYP",
    paymentMethod: "cash",
    total: 1450000,
    paid: 0,
    issuedAt: "2026-06-09",
    payments: [],
  },
];

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
    faultDescription: "",
    notes: "",
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
    onSave?.(order);
    if (isEdit) onClose();
    else setCreatedOrder(order);
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

export function OrderDetailsModal({
  order,
  invoice,
  onClose,
}: {
  order: Order;
  invoice?: Invoice | null;
  onClose: () => void;
}) {
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);
  const invoiceBalance = invoice ? remaining(invoice.total, invoice.paid) : 0;
  const devices = getOrderDevices(order);
  const extraDevices = devices.slice(1);
  const phone2 = order.phone2?.trim() || "لا يوجد";
  const customerLocation = order.locationUrl?.trim();
  const technicianPhone = getTechnicianPhone(order.technician);

  return (
    <>
      <Modal
        title={`تفاصيل الطلب ${order.id}`}
        description="معلومات العميل، الأجهزة، الفني، الحالة، والفاتورة المرتبطة."
        onClose={onClose}
        widthClassName="max-w-4xl"
      >
        <div className="space-y-5 p-5">
          <div className="grid gap-3 md:grid-cols-4">
            <DetailItem label="العميل" value={order.client} />
            <DetailItem label="الهاتف الأول" value={order.phone} ltr />
            <DetailItem label="الهاتف الثاني" value={phone2} ltr={Boolean(order.phone2?.trim())} />
            <DetailItem label="نوع الطلب" value={typeLabel(order.type)} />
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <DetailItem label="موعد الزيارة" value={order.visitDate} />
            <DetailItem label="عنوان العميل" value={order.address} />
            <DetailItem
              label="موقع العميل"
              value={
                customerLocation ? (
                  <a
                    href={customerLocation}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gold hover:text-gold-hover"
                  >
                    فتح الموقع
                  </a>
                ) : (
                  "لا يوجد"
                )
              }
            />
            <DetailItem
              label="حالة الطلب"
              value={
                <Badge tone={ORDER_STATUS_TONE[order.status]} dot>
                  {ORDER_STATUS_LABELS[order.status]}
                </Badge>
              }
            />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <DetailItem label="الجهاز الرئيسي" value={order.device} />
            <DetailItem label="الماركة" value={order.brand} />
            <DetailItem label="الأولوية" value={PRIORITY_LABELS[order.priority]} />
          </div>

          <Card className="bg-surface-2 p-4 shadow-none">
            <h3 className="font-heading text-base font-bold text-content">الأجهزة الأخرى التي يريد العميل صيانتها</h3>
            {extraDevices.length > 0 ? (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {extraDevices.map((device, index) => (
                  <div key={`${device.name}-${index}`} className="rounded-md border border-border bg-surface p-3">
                    <div className="font-semibold text-content">{formatDeviceName(device)}</div>
                    <div className="mt-1 text-sm text-content-muted">
                      الماركة: {device.brand || "غير محدد"}
                    </div>
                    <div className="mt-1 text-sm text-content-muted">
                      الموديل: {device.model || "غير محدد"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-content-muted">لا توجد أجهزة أخرى لهذا الطلب.</p>
            )}
          </Card>

          <Card className="bg-surface-2 p-4 shadow-none">
            <h3 className="font-heading text-base font-bold text-content">معلومات الفني</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <DetailItem label="اسم الفني" value={order.technician} />
              <DetailItem label="رقم الفني" value={technicianPhone} ltr={technicianPhone !== "لا يوجد"} />
            </div>
          </Card>

          <Card className="bg-surface-2 p-4 shadow-none">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-heading text-base font-bold text-content">الفاتورة</h3>
              {invoice ? (
                <button
                  type="button"
                  aria-label={`تفاصيل الفاتورة ${invoice.id}`}
                  title="تفاصيل الفاتورة"
                  onClick={() => setShowInvoiceDetails(true)}
                  className="rounded-sm p-1.5 text-content-muted hover:bg-surface hover:text-content"
                >
                  <Icon name="eye" size={18} />
                </button>
              ) : null}
            </div>
            {invoice ? (
              <div className="mt-3 grid gap-3 md:grid-cols-4">
                <DetailItem label="رقم الفاتورة" value={invoice.id} ltr />
                <DetailItem
                  label="حالة الفاتورة"
                  value={
                    <Badge tone={PAYMENT_TONE[invoice.status]} dot>
                      {PAYMENT_LABELS[invoice.status]}
                    </Badge>
                  }
                />
                <DetailItem label="الإجمالي" value={formatMoney(invoice.total, invoice.currency)} />
                <DetailItem label="المتبقي" value={formatMoney(invoiceBalance, invoice.currency)} />
              </div>
            ) : (
              <p className="mt-3 text-sm text-content-muted">لا توجد فاتورة مرتبطة بهذا الطلب حالياً.</p>
            )}
          </Card>
        </div>
      </Modal>

      {showInvoiceDetails && invoice ? (
        <InvoiceDetailsModal
          invoice={invoice}
          order={order}
          onClose={() => setShowInvoiceDetails(false)}
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
  const [quantity, setQuantity] = useState(String(initialPart?.stock ?? 1));
  const [location, setLocation] = useState(initialPart?.location ?? "");
  const [valueSyp, setValueSyp] = useState(String(initialPart?.unitCost ?? ""));
  const [valueUsd, setValueUsd] = useState(
    initialPart ? String(Number((initialPart.unitCost / USD_TO_SYP_RATE).toFixed(2))) : "",
  );
  const isEdit = Boolean(initialPart);

  function save() {
    onSave({
      id: code || `PRT-${Date.now().toString().slice(-4)}`,
      name: name || "قطعة جديدة",
      category: initialPart?.category ?? "عام",
      stock: isEdit ? initialPart?.stock ?? 0 : Number(quantity) || 0,
      minStock: initialPart?.minStock ?? 1,
      unitCost: Number(valueSyp) || Math.round((Number(valueUsd) || 0) * USD_TO_SYP_RATE),
      lastMove: isEdit ? "تعديل بيانات" : "إضافة قطعة",
      location: location || "غير محدد",
    });
    onClose();
  }

  return (
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
        {!isEdit ? (
          <Field label="الكمية الافتتاحية">
            <Input value={quantity} onChange={(event) => setQuantity(event.target.value)} type="number" min={1} />
          </Field>
        ) : null}
        <Field label="الموقع">
          <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="رف A-01" />
        </Field>
        <Field label="قيمة القطعة بالليرة السورية">
          <Input value={valueSyp} onChange={(event) => setValueSyp(event.target.value)} type="number" min={0} placeholder="0" />
        </Field>
        <Field label="قيمة القطعة بالدولار">
          <Input value={valueUsd} onChange={(event) => setValueUsd(event.target.value)} type="number" min={0} step="0.01" placeholder="0" />
        </Field>
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4 md:col-span-2">
          <Button type="button" variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="button" onClick={save}>
            <Icon name={isEdit ? "pencil" : "plus"} size={18} />
            {isEdit ? "حفظ التعديل" : "إضافة القطعة"}
          </Button>
        </div>
      </form>
    </Modal>
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
              onSave(selectedPart.id, movementType, delta);
              onClose();
            }}
          >
            <Icon name="pencil" size={18} />
            حفظ تعديل الكمية
          </Button>
        </div>
      </form>
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
          { label: "غير مكتملة", value: String(incompleted), icon: "alert", tone: "danger" },
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
          invoice={INVOICES.find((invoice) => invoice.orderId === viewingOrder.id) ?? null}
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

function InvoiceDetailsModal({
  invoice,
  order,
  onClose,
  onAddPayment,
}: {
  invoice: Invoice;
  order?: Order;
  onClose: () => void;
  onAddPayment?: () => void;
}) {
  const [paymentsPage, setPaymentsPage] = useState(1);
  const paymentPages = Math.max(1, Math.ceil(invoice.payments.length / PAGE_SIZE));
  const currentPaymentsPage = Math.min(paymentsPage, paymentPages);
  const visiblePayments = invoice.payments.slice(
    (currentPaymentsPage - 1) * PAGE_SIZE,
    currentPaymentsPage * PAGE_SIZE,
  );

  return (
    <Modal
      title={`تفاصيل الفاتورة ${invoice.id}`}
      description="تفاصيل الفاتورة، الطلب المرتبط، وسجل المدفوعات."
      onClose={onClose}
      widthClassName="max-w-4xl"
    >
      <div className="space-y-5 p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <DetailItem label="العميل" value={invoice.client} />
          <DetailItem label="هاتف العميل" value={invoice.clientPhone} ltr />
          <DetailItem label="رقم الطلب" value={invoice.orderId} ltr />
          <DetailItem label="الفني" value={invoice.technician} />
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <DetailItem label="الإجمالي" value={formatMoney(invoice.total, invoice.currency)} />
          <DetailItem label="المدفوع" value={formatMoney(invoice.paid, invoice.currency)} />
          <DetailItem
            label="المتبقي"
            value={formatMoney(remaining(invoice.total, invoice.paid), invoice.currency)}
          />
          <DetailItem
            label="طريقة الدفع"
            value={PAYMENT_METHOD_LABELS[invoice.paymentMethod]}
          />
        </div>

        {order ? (
          <Card className="bg-surface-2 p-4 shadow-none">
            <h3 className="font-heading text-base font-bold text-content">معلومات الطلب</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <DetailItem label="الجهاز" value={order.device} />
              <DetailItem label="حالة الطلب" value={ORDER_STATUS_LABELS[order.status]} />
              <DetailItem label="الأولوية" value={PRIORITY_LABELS[order.priority]} />
              <DetailItem label="موعد الزيارة" value={order.visitDate} />
            </div>
          </Card>
        ) : null}

        <Card className="overflow-hidden shadow-none">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <h3 className="font-heading text-base font-bold text-content">سجل المدفوعات</h3>
            {onAddPayment ? (
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
                    {["رقم الدفعة", "المبلغ", "الطريقة", "نوع العملية", "التاريخ"].map((header) => (
                      <th key={header} className="px-4 py-3 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visiblePayments.map((payment) => (
                    <tr key={payment.id} className="border-t border-border">
                      <td className="px-4 py-3 font-bold text-gold">{payment.id}</td>
                      <td className="px-4 py-3 text-content-muted">
                        {formatMoney(payment.amount, payment.currency)}
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

export function InvoicesScreen() {
  const params = useSearchParams();
  const initialType = params.get("type") as InvoiceType | null;
  const initialCurrency = params.get("currency")?.toUpperCase() as Currency | undefined;
  const [invoices, setInvoices] = useState<Invoice[]>(INVOICES);
  const [type, setType] = useState<InvoiceType | "all">(initialType ?? "all");
  const [currency, setCurrency] = useState<Currency | "all">(initialCurrency ?? "all");
  const [status, setStatus] = useState<PaymentStatus | "all">("all");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "all">("all");
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>({ from: "", to: "" });
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
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

  return (
    <div className="space-y-6">
      <SectionTitle
        title="إدارة الفواتير"
        subtitle="مراجعة الفواتير الداخلية والخارجية، الدفعات، المتبقي، وتجهيز الطباعة."
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
          <table className="min-w-[900px] w-full text-right text-sm">
            <thead>
              <tr className="bg-surface-2 text-content-muted">
                {["رقم الفاتورة", "الطلب", "العميل", "الفني", "النوع", "الحالة", "الإجمالي", "المتبقي", "إجراءات"].map(
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
  const [phone, setPhone] = useState("011 555 2200");
  const [exchangeRate, setExchangeRate] = useState("14500");

  return (
    <div className="space-y-6">
      <SectionTitle
        title="الإعدادات"
        subtitle="إعدادات المركز، بيانات التواصل، سعر الصرف، وسلوك النظام العام."
      />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <h3 className="text-right font-heading text-lg font-bold text-content">
              بيانات المركز
            </h3>
          </CardHeader>
          <form className="grid gap-4 p-4 md:grid-cols-2">
            <Input value={centerName} onChange={(event) => setCenterName(event.target.value)} aria-label="اسم المركز" />
            <Input value={phone} onChange={(event) => setPhone(event.target.value)} aria-label="هاتف المركز" dir="ltr" />
            <Input placeholder="العنوان" defaultValue="دمشق - شارع بغداد" aria-label="العنوان" />
            <Input value={exchangeRate} onChange={(event) => setExchangeRate(event.target.value)} aria-label="سعر الصرف" dir="ltr" />
            <Textarea
              className="min-h-24 md:col-span-2"
              defaultValue="الكفالة لا تشمل سوء الاستخدام أو أعطال الكهرباء الخارجية."
              aria-label="بنود الفواتير"
            />
            <div className="flex justify-end md:col-span-2">
              <Button type="button">حفظ الإعدادات الوهمية</Button>
            </div>
          </form>
        </Card>
        <Card className="p-4">
          <h3 className="text-right font-heading text-lg font-bold text-content">
            تفضيلات النظام
          </h3>
          <div className="mt-4 space-y-3">
            {[
              "كل الصلاحيات مفتوحة في النسخة الحالية",
              "إظهار تنبيهات نقص المخزون",
              "تفعيل تحديثات الطلبات اللحظية لاحقًا",
              "استخدام الليرة السورية كعملة أساسية",
            ].map((item) => (
              <label key={item} className="flex items-center justify-between rounded-md bg-surface-2 px-3 py-3 text-sm text-content">
                <input type="checkbox" defaultChecked className="h-4 w-4 accent-gold" />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
